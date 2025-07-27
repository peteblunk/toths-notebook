export type TaskCategory = 'Daily Rituals' | 'Regular Responsibilities' | 'Special Missions' | 'Grand Expeditions';

export type TaskImportance = 'high' | 'medium' | 'low';

export type Task = {
  id: string;
  title: string;
  dueDate: Date;
  importance: TaskImportance;
  estimatedTime: number; // in minutes
  category: TaskCategory;
  completed: boolean;
};
