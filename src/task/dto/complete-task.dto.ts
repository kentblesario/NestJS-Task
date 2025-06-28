import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteTaskDto {
  @ApiProperty({
    example: true,
    description: 'Whether the task is completed or not',
  })
  @IsBoolean()
  completed: boolean;
}
