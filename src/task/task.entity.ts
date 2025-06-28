import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { ITaskPriority } from './task.interface';

@Entity()
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: false })
  completed: boolean;

  @Column({ type: 'datetime', nullable: true })
  dueDate?: Date;

  @Column({ type: 'text', default: ITaskPriority.Low, nullable: true })
  priority?: ITaskPriority;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @UpdateDateColumn({ type: 'datetime', nullable: true })
  completedAt: Date | null;

  @ManyToMany(() => TaskEntity, (task) => task.dependents)
  @JoinTable()
  prerequisites: TaskEntity[];

  @ManyToMany(() => TaskEntity, (task) => task.prerequisites)
  dependents: TaskEntity[];
}
