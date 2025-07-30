import type { Task } from './types';

// Helper to create dates in local timezone from YYYY-MM-DD string
const createLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    // Create date in UTC to avoid timezone shifts, then treat as local
    const date = new Date(Date.UTC(year, month - 1, day));
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

let tasksStore: Task[] = [
    { id: '1', title: 'Morning meditation ritual', dueDate: new Date(), importance: 'medium', estimatedTime: 15, category: 'Daily Rituals', completed: true },
    { id: '2', title: 'Prepare weekly project report', dueDate: createLocalDate('2024-08-16'), importance: 'high', estimatedTime: 120, category: 'Sacred Duties', completed: false },
    { id: '3', title: 'Explore the hidden sector of Cy-Giza', dueDate: new Date(), importance: 'high', estimatedTime: 240, category: 'Special Missions', completed: false },
    { id: '4', title: 'Update firewall and security protocols', dueDate: createLocalDate('2024-08-17'), importance: 'medium', estimatedTime: 45, category: 'Sacred Duties', completed: false },
    { id: '5', title: 'Launch the Sun-Ra solar probe', dueDate: createLocalDate('2024-09-01'), importance: 'high', estimatedTime: 480, category: 'Grand Expeditions', completed: false },
    { id: '6', title: 'Daily physical training', dueDate: new Date(), importance: 'low', estimatedTime: 60, category: 'Daily Rituals', completed: false },
];

// This is a simple in-memory store for our mock data.
// In a real application, this would be a database.

export const getTasks = (): Task[] => {
    return [...tasksStore];
}

export const getTaskById = (id: string | undefined): Task | undefined => {
    if (!id) return undefined;
    return tasksStore.find(task => task.id === id);
}

export const addTask = (task: Task) => {
    tasksStore.unshift(task);
}

export const updateTask = (taskId: string, updatedTask: Partial<Task>): void => {
    tasksStore = tasksStore.map(task => 
        task.id === taskId ? { ...task, ...updatedTask } : task
    );
};

export const deleteTask = (taskId: string): void => {
    tasksStore = tasksStore.filter(task => task.id !== taskId);
};
