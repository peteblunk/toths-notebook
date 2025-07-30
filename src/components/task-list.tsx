"use client";

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Sparkles } from "lucide-react";
import { isToday } from 'date-fns';

import { type Task, type FilterCategory } from '@/lib/types';
import { AddTaskDialog } from '@/components/add-task-dialog';
import { TaskCard } from '@/components/task-card';
import { getTasks, addTask, updateTask, deleteTask } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { prioritizeUserTasks } from '@/app/actions';
import { SidebarTrigger } from './ui/sidebar';

type TaskListProps = {
  activeCategory: FilterCategory;
};

export function TaskList({ activeCategory }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setTasks(getTasks());
  }, []);

  const refreshTasks = () => {
    setTasks(getTasks());
  };

  const handleTaskAdd = (newTaskData: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      id: Date.now().toString(),
      ...newTaskData,
      completed: false,
    };
    addTask(newTask);
    toast({
        title: "Task Scribed",
        description: `"${newTask.title}" has been added to your list.`,
    });
    refreshTasks();
  };

  const handleTaskCompletionChange = (taskId: string, completed: boolean) => {
    updateTask(taskId, { completed });
    refreshTasks();
  };

  const handleTaskDelete = (taskId: string) => {
    deleteTask(taskId);
    toast({ title: "Task Erased", description: "The task has been removed from the scrolls." });
    refreshTasks();
  };

  const handlePrioritize = () => {
    startTransition(async () => {
      const uncompletedTasks = tasks.filter(t => !t.completed);
      
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
      const prioritizedTasks = prioritizedIds.map(id => uncompletedTasks.find(t => t.id === id)!).filter(Boolean);
      const completedTasks = tasks.filter(t => t.completed);
      
      const newOrderedTasks = [...prioritizedTasks, ...completedTasks];
      setTasks(newOrderedTasks);

      toast({
        title: "Tasks Prioritized",
        description: "Your tasks have been reordered by the AI oracle.",
      });
    });
  };

  const filteredTasks = useMemo(() => {
    if (activeCategory === 'Today') {
      return tasks.filter(task => (task.dueDate && isToday(task.dueDate)) || task.category === 'Daily Rituals');
    }
    if (activeCategory === 'All') return tasks; 
    return tasks.filter(task => task.category === activeCategory);
  }, [tasks, activeCategory]);
  
  const getHeaderText = () => {
    switch (activeCategory) {
        case 'Today': return "Today's Agenda";
        default: return activeCategory;
    }
  }

  return (
    <div className="h-full flex flex-col">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-3xl font-headline text-primary tracking-wider">{getHeaderText()}</h1>
            <p className="text-muted-foreground">Your Cyber-Egyptian Task Manager</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto">
            <Button variant="outline" onClick={handlePrioritize} disabled={isPending}>
                {isPending ? <Bot className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Prioritize
            </Button>
            <AddTaskDialog onTaskAdd={handleTaskAdd} />
        </div>
      </header>
      
      {filteredTasks.length > 0 ? (
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
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
                    onTaskDelete={handleTaskDelete}
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
