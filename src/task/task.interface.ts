export interface ITask {
  id: string;
  title: string;
  taskStatus?: ITaskStatus;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  completed?: boolean;
  completedAt?: Date | null;
  dueDate?: Date;
  priority?: ITaskPriority;
  prerequisites?: ITask[];
  dependents?: ITask[];
}

export enum ITaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export enum ITaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
}
