import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ITask } from './task.interface';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('Tasks')
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: 200, description: 'List of tasks returned.' })
  findAll(): Promise<ITask[]> {
    return this.taskService.getAllTasks();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task found.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  findOne(@Param('id') id: string): Promise<ITask> {
    return this.taskService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid request body.' })
  create(@Body() task: CreateTaskDto): Promise<ITask> {
    return this.taskService.createTask(task);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  update(@Param('id') id: string, @Body() task: UpdateTaskDto): Promise<ITask> {
    return this.taskService.update(id, task);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.taskService.remove(id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark a task as complete/incomplete' })
  @ApiParam({ name: 'id', type: 'string', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task status updated.' })
  @ApiResponse({ status: 400, description: 'Cannot complete task.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  complete(
    @Param('id') id: string,
    @Body() task: CompleteTaskDto,
  ): Promise<ITask> {
    return this.taskService.complete(id, task.completed);
  }
}
