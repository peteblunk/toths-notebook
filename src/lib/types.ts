// A sub-task has its own text and completion status
export type Subtask = {
  text: string;
  completed: boolean;
};

// Harmonized 'Responsibilities' to 'Sacred Duties'
export type TaskCategory = 'Today' | 'Daily Rituals' | 'Sacred Duties' | 'Special Missions' | 'Grand Expeditions' | string;

export type TaskImportance = 'low' | 'medium' | 'high';

export type Task = {
  id: string;
  userId: string;    // Added: Required for security/filtering
  title: string;
  category: TaskCategory;
  importance: TaskImportance;
  dueDate: Date;     // In Firestore this is a Timestamp, converted to Date in hook
  createdAt?: Date;  // Added: Needed for sorting by newest
  estimatedTime: number;
  completed: boolean;
  details?: string; 
  subtasks?: Subtask[];
  
  // --- NEW RITUAL DNA ---
  isRitual?: boolean;        // True if this is a template OR a ritual instance
  originRitualId?: string;   // The ID of the parent template (if this is a clone)
};

export type FilterCategory = 'All' | TaskCategory;