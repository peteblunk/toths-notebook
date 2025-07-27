'use server';

import { prioritizeTasks, type TaskInput } from '@/ai/flows/prioritize-tasks';
import { Task } from '@/lib/types';
import { format } from 'date-fns';

export async function prioritizeUserTasks(tasks: Task[]): Promise<string[]> {
  const tasksToPrioritize: TaskInput[] = tasks
    .filter(task => !task.completed)
    .map(task => ({
      id: task.id,
      title: task.title,
      dueDate: format(task.dueDate, 'yyyy-MM-dd'),
      importance: task.importance,
      estimatedTime: task.estimatedTime,
    }));

  if (tasksToPrioritize.length === 0) {
    return [];
  }

  try {
    const prioritizedTasks = await prioritizeTasks(tasksToPrioritize);
    return prioritizedTasks.map(task => task.id);
  } catch (error) {
    console.error('Error prioritizing tasks:', error);
    // In case of an error, return the original order of IDs
    return tasksToPrioritize.map(task => task.id);
  }
}
