import { ApiProperty } from '@nestjs/swagger';
import { ITaskStatus } from '../task.interface';
import { IsEnum } from 'class-validator';

export class UpdateTaskStatusDto {
  @ApiProperty({
    enum: ITaskStatus,
    example: ITaskStatus.NOT_STARTED,
    description:
      'Task status indicating if the task is Not Started, In Progress, Completed, or Blocked',
  })
  @IsEnum(ITaskStatus)
  taskStatus: ITaskStatus;
}
