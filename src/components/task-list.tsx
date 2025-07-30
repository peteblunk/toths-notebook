"use client";

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Sparkles } from "lucide-react";
import { isToday } from 'date-fns';

// Firebase and Auth Imports
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

import { type Task, type FilterCategory } from '@/lib/types';
import { AddTaskDialog } from '@/components/add-task-dialog';
import { TaskCard } from '@/components/task-card';
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
  const { user } = useAuth(); // Get the current user

  // --- REAL-TIME DATA FETCHING FROM FIRESTORE ---
  // This hook replaces the old mock data fetching.
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    const tasksCollection = collection(db, 'tasks');
    const q = query(tasksCollection, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasksData: Task[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tasksData.push({
          id: doc.id,
          ...data,
          dueDate: data.dueDate?.toDate(), 
          createdAt: data.createdAt?.toDate(),
        } as Task);
      });
      setTasks(tasksData);
    });

    return () => unsubscribe();
  }, [user]);

  // --- FIRESTORE CRUD FUNCTIONS ---
  // These functions replace the old mock data handlers.

  const handleTaskAdd = async (newTaskData: Omit<Task, 'id' | 'completed'>) => {
    if (!user) return;

    // Logic to handle saving to 'tasks' or 'dailyRituals'
    const isRitual = newTaskData.category === 'Daily Rituals';
    const collectionName = isRitual ? 'dailyRituals' : 'tasks';
    
    const payload = isRitual ? {
        userId: user.uid,
        title: newTaskData.title,
        category: newTaskData.category,
        importance: newTaskData.importance,
        estimatedTime: newTaskData.estimatedTime,
        details: newTaskData.details || '',
        subtasks: newTaskData.subtasks || [],
    } : {
        ...newTaskData,
        userId: user.uid,
        completed: false,
        createdAt: serverTimestamp(),
    };
    
    try {
      await addDoc(collection(db, collectionName), payload);
      toast({
        title: isRitual ? "Daily Ritual Created" : "Task Scribed",
        description: `"${newTaskData.title}" has been successfully recorded.`,
      });
    } catch (error) {
      console.error("Error adding document: ", error);
      toast({ title: "Error", description: "Could not save the task.", variant: 'destructive' });
    }
  };

  const handleTaskCompletionChange = async (taskId: string, completed: boolean) => {
    const taskDocRef = doc(db, 'tasks', taskId);
    try {
      await updateDoc(taskDocRef, { completed });
    } catch (error) {
      console.error("Error updating task: ", error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    const taskDocRef = doc(db, 'tasks', taskId);
    try {
      await deleteDoc(taskDocRef);
      toast({ title: "Task Erased", description: "The task has been removed from the scrolls." });
    } catch (error) {
      console.error("Error deleting task: ", error);
    }
  };

  // This function remains the same, affecting local state for now.
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
    // Added a check for 'Sacred Duties' to align with our recent change
    if (activeCategory === 'Sacred Duties') {
        return tasks.filter(task => task.category === 'Sacred Duties');
    }
    if (activeCategory === 'Today') {
      return tasks.filter(task => (task.dueDate && isToday(task.dueDate)) || task.category === 'Daily Rituals');
    }
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
