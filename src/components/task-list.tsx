"use client";

import React, { useState, useTransition, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Plus, SlidersHorizontal, Sparkles } from "lucide-react";

import { type Task, type TaskCategory } from '@/lib/types';
import { AddTaskDialog } from '@/components/add-task-dialog';
import { TaskCard } from '@/components/task-card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { prioritizeUserTasks } from '@/app/actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from './ui/sidebar';

// Helper to create dates in local timezone from YYYY-MM-DD string
const createLocalDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const initialTasks: Task[] = [
  { id: '1', title: 'Morning meditation ritual', dueDate: createLocalDate('2024-08-15'), importance: 'medium', estimatedTime: 15, category: 'Daily Rituals', completed: true },
  { id: '2', title: 'Prepare weekly project report', dueDate: createLocalDate('2024-08-16'), importance: 'high', estimatedTime: 120, category: 'Regular Responsibilities', completed: false },
  { id: '3', title: 'Explore the hidden sector of Cy-Giza', dueDate: createLocalDate('2024-08-20'), importance: 'high', estimatedTime: 240, category: 'Special Missions', completed: false },
  { id: '4', title: 'Update firewall and security protocols', dueDate: createLocalDate('2024-08-17'), importance: 'medium', estimatedTime: 45, category: 'Regular Responsibilities', completed: false },
  { id: '5', title: 'Launch the Sun-Ra solar probe', dueDate: createLocalDate('2024-09-01'), importance: 'high', estimatedTime: 480, category: 'Grand Expeditions', completed: false },
  { id: '6', title: 'Daily physical training', dueDate: createLocalDate('2024-08-15'), importance: 'low', estimatedTime: 60, category: 'Daily Rituals', completed: false },
];

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeCategory, setActiveCategory] = useState<TaskCategory | 'All'>('All');
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleTaskAdd = (newTaskData: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: crypto.randomUUID(),
      completed: false,
    };
    setTasks(prev => [...prev, newTask]);
    toast({
      title: "Task Scribed",
      description: `"${newTask.title}" has been added to your list.`,
    });
  };

  const handleTaskCompletionChange = (taskId: string, completed: boolean) => {
    setTasks(prev =>
      prev.map(task => (task.id === taskId ? { ...task, completed } : task))
    );
  };

  const handlePrioritize = () => {
    startTransition(async () => {
      const uncompletedTasks = tasks.filter(t => !t.completed);
      const completedTasks = tasks.filter(t => t.completed);
      
      if (uncompletedTasks.length < 2) {
        toast({
            title: "Not enough tasks",
            description: "You need at least two uncompleted tasks to prioritize.",
            variant: 'destructive'
        });
        return;
      }
      
      toast({
        title: "Engaging the Oracle...",
        description: "Thoth's AI is analyzing your tasks.",
      });

      const prioritizedIds = await prioritizeUserTasks(uncompletedTasks);
      
      const prioritizedUncompleted = prioritizedIds.map(id => uncompletedTasks.find(t => t.id === id)!).filter(Boolean);
      
      setTasks([...prioritizedUncompleted, ...completedTasks]);

      toast({
        title: "Tasks Prioritized",
        description: "Your tasks have been reordered by the AI oracle.",
      });
    });
  };

  const filteredTasks = useMemo(() => {
    if (activeCategory === 'All') return tasks;
    return tasks.filter(task => task.category === activeCategory);
  }, [tasks, activeCategory]);

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-3xl font-headline text-primary tracking-wider">Thoth's Notebook</h1>
            <p className="text-muted-foreground">Your Cyber-Egyptian Task Manager</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrioritize} disabled={isPending}>
                {isPending ? <Bot className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Prioritize
            </Button>
            <AddTaskDialog onTaskAdd={handleTaskAdd} />
        </div>
      </header>

      <div className="mb-4">
        <Select value={activeCategory} onValueChange={(value: TaskCategory | 'All') => setActiveCategory(value)}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Scrolls (Tasks)</SelectItem>
            <SelectItem value="Daily Rituals">Daily Rituals</SelectItem>
            <SelectItem value="Regular Responsibilities">Regular Responsibilities</SelectItem>
            <SelectItem value="Special Missions">Special Missions</SelectItem>
            <SelectItem value="Grand Expeditions">Grand Expeditions</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {filteredTasks.length > 0 ? (
        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <AnimatePresence>
            {filteredTasks.map(task => (
                <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                >
                <TaskCard
                    task={task}
                    onTaskCompletionChange={handleTaskCompletionChange}
                />
                </motion.div>
            ))}
            </AnimatePresence>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-muted rounded-lg">
            <h3 className="text-xl font-headline text-primary">The Papyrus is Blank</h3>
            <p className="text-muted-foreground mt-2">No tasks found for this category. Add a new task to begin your journey.</p>
        </div>
      )}
    </div>
  );
}
