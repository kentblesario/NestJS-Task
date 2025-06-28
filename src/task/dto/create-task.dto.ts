import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ITaskPriority } from '../task.interface';

export class CreateTaskDto {
  @ApiProperty({ example: 'Finish report', description: 'Title of the task' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: 'Write monthly summary',
    description: 'Optional task details',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Mark task as completed',
  })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiPropertyOptional({
    example: '2025-06-30T18:00:00Z',
    description: 'Due date in ISO format',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    enum: ITaskPriority,
    description: 'Task priority',
    example: ITaskPriority.Medium,
  })
  @IsOptional()
  @IsEnum(ITaskPriority)
  priority?: ITaskPriority;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'List of prerequisite task IDs',
    example: ['b1234567-e89b-12d3-a456-426614174000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  prerequisites?: string[];

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'List of dependent task IDs',
    example: ['c9876543-e21c-54f1-b321-987654321000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  dependents?: string[];
}
