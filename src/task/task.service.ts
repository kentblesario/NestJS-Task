import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ITask } from './task.interface';
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

  async getAllTasks(): Promise<ITask[]> {
    return this.taskRepo.find({
      relations: ['prerequisites', 'dependents'],
    });
  }

  async createTask(dto: CreateTaskDto): Promise<ITask> {
    const { title, description, prerequisites, dependents } = dto;

    const foundPrereqs = await this.validateAndLoadRelations(
      prerequisites,
      'prerequisites',
    );
    const foundDependents = await this.validateAndLoadRelations(
      dependents,
      'dependents',
    );

    const task = this.taskRepo.create({
      title,
      description,
      prerequisites: foundPrereqs,
      dependents: foundDependents,
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

    Object.assign(task, {
      title: data.title ?? task.title,
      description: data.description ?? task.description,
      completed: data.completed ?? task.completed,
      dueDate: data.dueDate ?? task.dueDate,
      priority: data.priority ?? task.priority,
      completedAt: data.completed ? new Date() : task.completedAt,
    });

    return this.taskRepo.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepo.delete(task.id);
  }

  async complete(id: string, completed: boolean): Promise<ITask> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['prerequisites'],
    });

    if (!task) throw new NotFoundException(`Task ${id} not found`);
    console.log('task', task);
    console.log('id', id);
    console.log('completed', completed);

    // Only allow marking as completed if all prerequisites are done
    if (completed && task.prerequisites?.length) {
      const allPrereqsDone = task.prerequisites.every((t) => t.completed);
      console.log('allPrereqsDone', allPrereqsDone);

      if (!allPrereqsDone) {
        throw new BadRequestException(
          'Cannot complete task: prerequisites not completed.',
        );
      }
    }

    task.completed = completed;
    task.completedAt = completed ? new Date() : null;

    return this.taskRepo.save(task);
  }
}
