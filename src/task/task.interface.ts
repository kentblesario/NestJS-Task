export interface ITask {
  id: string;
  title: string;
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
