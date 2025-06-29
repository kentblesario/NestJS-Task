import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ITask, ITaskStatus } from './task.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskEntity } from './task.entity';

@Injectable()
export class TaskService {
  private tasks: ITask[] = [];

  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
  ) {}

  private async validateAndLoadRelations(
    ids: string[] | undefined,
    relationType: 'prerequisites' | 'dependents',
    selfId?: string,
  ): Promise<TaskEntity[]> {
    if (!ids?.length) return [];

    if (selfId && ids.includes(selfId)) {
      throw new BadRequestException(
        `A task cannot have itself as a ${relationType.slice(0, -1)}.`,
      );
    }

    const entities = await this.taskRepo.findBy({ id: In(ids) });
    const foundIds = entities.map((t) => t.id);
    const missing = ids.filter((id) => !foundIds.includes(id));

    if (missing.length > 0) {
      throw new NotFoundException(
        `${relationType[0].toUpperCase()}${relationType.slice(1)} task(s) not found: ${missing.join(', ')}`,
      );
    }

    return entities;
  }

  private validateDueDateConstraints(
    dueDate: Date,
    prerequisites: ITask[],
    dependents: ITask[],
  ): void {
    for (const parent of prerequisites) {
      if (!parent.dueDate) continue;

      if (dueDate >= parent.dueDate) {
        throw new BadRequestException(
          `Due date must be earlier than prerequisite task "${parent.title}" due date (${parent.dueDate.toISOString()})`,
        );
      }
    }

    for (const child of dependents) {
      if (!child.dueDate) continue;

      if (dueDate <= child.dueDate) {
        throw new BadRequestException(
          `Due date must be later than dependent task "${child.title}" due date (${child.dueDate.toISOString()})`,
        );
      }
    }
  }

  async getAllTasks(): Promise<ITask[]> {
    return this.taskRepo.find({
      relations: ['prerequisites', 'dependents'],
    });
  }

  async createTask(dto: CreateTaskDto): Promise<ITask> {
    const { title, description, dueDate, prerequisites, dependents } = dto;

    const foundPrereqs = await this.validateAndLoadRelations(
      prerequisites,
      'prerequisites',
    );
    const foundDependents = await this.validateAndLoadRelations(
      dependents,
      'dependents',
    );

    if (dueDate) {
      this.validateDueDateConstraints(
        new Date(dueDate),
        foundPrereqs,
        foundDependents,
      );
    }

    const taskStatus =
      foundPrereqs.length > 0 ? ITaskStatus.BLOCKED : ITaskStatus.NOT_STARTED;

    const task = this.taskRepo.create({
      title,
      description,
      dueDate: dueDate,
      prerequisites: foundPrereqs,
      dependents: foundDependents,
      taskStatus,
    });

    return this.taskRepo.save(task);
  }

  async findOne(id: string): Promise<ITask> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['prerequisites', 'dependents'],
    });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async update(id: string, data: Partial<CreateTaskDto>): Promise<ITask> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['prerequisites', 'dependents'],
    });

    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    if (data.prerequisites !== undefined) {
      task.prerequisites = await this.validateAndLoadRelations(
        data.prerequisites,
        'prerequisites',
        id,
      );
    }

    if (data.dependents !== undefined) {
      task.dependents = await this.validateAndLoadRelations(
        data.dependents,
        'dependents',
        id,
      );
    }

    const newDueDate = data.dueDate ? new Date(data.dueDate) : task.dueDate;

    if (newDueDate) {
      this.validateDueDateConstraints(
        newDueDate,
        task.prerequisites,
        task.dependents,
      );
    }

    Object.assign(task, {
      title: data.title ?? task.title,
      description: data.description ?? task.description,
      completed: data.completed ?? task.completed,
      dueDate: newDueDate,
      priority: data.priority ?? task.priority,
      completedAt: data.completed ? new Date() : task.completedAt,
    });

    return this.taskRepo.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['dependents'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found.`);
    }

    if (task.dependents && task.dependents.length > 0) {
      throw new BadRequestException(
        'Cannot delete task: it has dependent tasks. Remove or update the dependents first.',
      );
    }

    await this.taskRepo.delete(id);
  }

  async updateStatus(id: string, taskStatus: ITaskStatus): Promise<ITask> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['prerequisites', 'dependents'],
    });

    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    if (!Object.values(ITaskStatus).includes(taskStatus)) {
      throw new BadRequestException(`Invalid task status: ${taskStatus}`);
    }

    if (
      task.taskStatus === ITaskStatus.NOT_STARTED &&
      taskStatus === ITaskStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Cannot change status directly from "NOT_STARTED" to "COMPLETED". Please set status to "IN_PROGRESS" first.',
      );
    }

    if (taskStatus === ITaskStatus.COMPLETED && task.prerequisites?.length) {
      const allPrereqsDone = task.prerequisites.every(
        (t) => t.taskStatus === ITaskStatus.COMPLETED,
      );
      if (!allPrereqsDone) {
        throw new BadRequestException(
          'Cannot complete task: prerequisites are not all completed.',
        );
      }
    }

    task.taskStatus = taskStatus;
    task.completedAt = taskStatus === ITaskStatus.COMPLETED ? new Date() : null;

    await this.taskRepo.save(task);

    if (taskStatus === ITaskStatus.COMPLETED && task.dependents?.length) {
      for (const dep of task.dependents) {
        const depWithPrereqs = await this.taskRepo.findOne({
          where: { id: dep.id },
          relations: ['prerequisites'],
        });
        if (
          depWithPrereqs &&
          depWithPrereqs.taskStatus === ITaskStatus.BLOCKED &&
          depWithPrereqs.prerequisites.length > 0 &&
          depWithPrereqs.prerequisites.every(
            (prereq) => prereq.taskStatus === ITaskStatus.COMPLETED,
          )
        ) {
          depWithPrereqs.taskStatus = ITaskStatus.NOT_STARTED;
          await this.taskRepo.save(depWithPrereqs);
        }
      }
    }

    const updatedTask = await this.taskRepo.findOne({
      where: { id: task.id },
      relations: ['prerequisites', 'dependents'],
    });

    return updatedTask!;
  }
}
