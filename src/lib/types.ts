// A sub-task has its own text and completion status
export type Subtask = {
  text: string;
  completed: boolean;
};

export type Task = {
  id: string;
  title: string;
  category: TaskCategory;
  importance: TaskImportance;
  dueDate: Date;
  estimatedTime: number;
  completed: boolean;
  details?: string; // Optional notes field
  subtasks?: Subtask[]; // An array of sub-task objects
};

export type FilterCategory = 'Today' | 'All' | TaskCategory;

export type TaskCategory = 'Daily Rituals' | 'Regular Responsibilities' | 'Special Missions' | 'Grand Expeditions';

export type TaskImportance = 'low' | 'medium' | 'high';
