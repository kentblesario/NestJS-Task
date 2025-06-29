import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ITask } from './task.interface';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { UpdateTaskStatusDto } from './dto/update-status.dto';

@ApiTags('Tasks')
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({
    status: 200,
    description: 'List of all tasks returned successfully.',
  })
  findAll(): Promise<ITask[]> {
    return this.taskService.getAllTasks();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific task by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Task UUID (v4 format)',
  })
  @ApiResponse({
    status: 200,
    description: 'Task found and returned successfully.',
  })
  @ApiResponse({ status: 404, description: 'Task not found with provided ID.' })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ITask> {
    return this.taskService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new task',
    description: `
Create a new task with optional prerequisites or dependents.

**Fields:**
- \`title\` (string, required): Task title
- \`description\` (string, optional): Detailed description
- \`dueDate\` (ISO8601 string, optional): Deadline for the task
- \`priority\` ("Low", "Medium", "High", optional): Defaults to "Medium"
- \`prerequisites\` (string[], optional): UUIDs of prerequisite tasks
- \`dependents\` (string[], optional): UUIDs of dependent tasks

**Rules:**
- If prerequisites are set, this task’s due date must be earlier than each prerequisite.
- If dependents are set, this task’s due date must be later than each dependent.
- If prerequisites exist, taskStatus will default to "BLOCKED". Otherwise, it defaults to "NOT_STARTED".
    `,
  })
  @ApiResponse({ status: 201, description: 'Task created successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data or business rules violated.',
  })
  @ApiBody({ type: CreateTaskDto })
  create(@Body() task: CreateTaskDto): Promise<ITask> {
    return this.taskService.createTask(task);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update task details by ID',
    description: `
Update task title, description, dueDate, priority, prerequisites, or dependents.

- UUID must be valid (v4).
- If changing dueDate or relationships, validation will ensure scheduling constraints are met.
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Task UUID (v4 format)',
  })
  @ApiResponse({ status: 200, description: 'Task updated successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed for update.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  @ApiBody({ type: UpdateTaskDto })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() task: UpdateTaskDto,
  ): Promise<ITask> {
    return this.taskService.update(id, task);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Task UUID (v4 format)',
  })
  @ApiResponse({ status: 200, description: 'Task deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.taskService.remove(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update task status',
    description: `
Update the current task status to one of the allowed transitions.

**Allowed values:** \`NOT_STARTED\`, \`IN_PROGRESS\`, \`COMPLETED\`, \`BLOCKED\`

**Business rules:**
- Cannot transition directly from \`NOT_STARTED\` → \`COMPLETED\`.
- Cannot mark task as \`COMPLETED\` unless all prerequisites are completed.
- Transition to \`IN_PROGRESS\` is allowed if the task is not blocked.
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Task UUID (v4 format)',
  })
  @ApiResponse({
    status: 200,
    description: 'Task status updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status or business rule violation.',
  })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  @ApiBody({ type: UpdateTaskStatusDto })
  complete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() taskStatusDto: UpdateTaskStatusDto,
  ): Promise<ITask> {
    return this.taskService.updateStatus(id, taskStatusDto.taskStatus);
  }
}
