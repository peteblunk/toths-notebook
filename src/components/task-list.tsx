"use client";

import { useState, useEffect, useTransition, useMemo } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Task } from '@/lib/types';
import { AddTaskDialog } from '@/components/add-task-dialog';
import { TaskCard } from '@/components/task-card';
import { Pyramid, Waves, Bot, Sparkles, Sun } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { prioritizeUserTasks } from '@/app/actions';
import { SidebarTrigger } from './ui/sidebar';
import { useAuth } from '@/components/auth-provider';
import { isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskListProps {
  activeCategory: string;
}

export function TaskList({ activeCategory }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();

  // --- REAL-TIME DATA FETCHING ---
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
        // 1. Cast data to 'any' so we can access properties freely
        const data = doc.data() as any;
        
        tasksData.push({
          id: doc.id,
          ...data,
          // 2. Safe date conversion
          dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : data.dueDate,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        } as unknown as Task); // 3. The "Double Cast" to force TypeScript to accept it
      });

    return () => unsubscribe();
  }, [user]);

  // --- CRUD HANDLERS ---
  const handleTaskAdd = async (newTaskData: Omit<Task, 'id' | 'completed'>) => {
    if (!user) return;
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
      toast({ title: isRitual ? "Daily Ritual Created" : "Task Scribed", description: `"${newTaskData.title}" has been recorded.` });
    } catch (error) {
      console.error("Error adding document: ", error);
      toast({ title: "Error", description: "Could not save.", variant: 'destructive' });
    }
  };

  const handleTaskCompletionChange = async (taskId: string, completed: boolean) => {
    const taskDocRef = doc(db, 'tasks', taskId);
    try { await updateDoc(taskDocRef, { completed }); } catch (error) { console.error("Error updating: ", error); }
  };

  const handleTaskDelete = async (taskId: string) => {
    const taskDocRef = doc(db, 'tasks', taskId);
    try { await deleteDoc(taskDocRef); toast({ title: "Task Erased", description: "Removed from the scrolls." }); } catch (error) { console.error("Error deleting: ", error); }
  };

  const handlePrioritize = () => {
    startTransition(async () => {
      const uncompletedTasks = tasks.filter(t => !t.completed);
      if (uncompletedTasks.length < 2) {
        toast({ title: "Not enough tasks", description: "Need at least two tasks to prioritize.", variant: 'destructive' });
        return;
      }
      toast({ title: "Engaging the Oracle...", description: "Thoth's AI is analyzing your tasks." });
      const prioritizedIds = await prioritizeUserTasks(uncompletedTasks);
      const prioritizedTasks = prioritizedIds.map(id => uncompletedTasks.find(t => t.id === id)!).filter(Boolean);
      const completedTasks = tasks.filter(t => t.completed);
      const newOrderedTasks = [...prioritizedTasks, ...completedTasks];
      setTasks(newOrderedTasks);
      toast({ title: "Tasks Prioritized", description: "Reordered by the AI oracle." });
    });
  };

  const filteredTasks = useMemo(() => {
    if (activeCategory === 'Sacred Duties') return tasks.filter(task => task.category === 'Sacred Duties');
    if (activeCategory === 'Today') return tasks.filter(task => (task.dueDate && isToday(task.dueDate)) || task.category === 'Daily Rituals');
    return tasks.filter(task => task.category === activeCategory);
  }, [tasks, activeCategory]);

  const getHeaderText = () => {
    switch (activeCategory) { case 'Today': return "Today's Agenda"; default: return activeCategory; }
  }

  // --- SPLIT THE WATERS ---
  const nunTasks = filteredTasks.filter(t => !t.completed);
  const maatTasks = filteredTasks.filter(t => t.completed);

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

      {filteredTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-muted rounded-lg">
          <h3 className="text-xl font-headline text-primary">The Papyrus is Blank</h3>
          <p className="text-muted-foreground mt-2">No tasks found. Add a new task to begin your journey.</p>
        </div>
      ) : (


        <div id="main-scroll-container" className="space-y-8 pb-20 overflow-y-auto flex-1 pr-1">

          {/* --- SECTION 1: NUN (CHAOS / INCOMPLETE) --- */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2 border-b border-cyan-900/50 pb-2 mb-4">
              <Waves className="w-5 h-5 text-cyan-600 animate-pulse" />
              <h2 className="text-lg font-display tracking-widest text-cyan-600 uppercase">
                Nun <span className="text-xs text-cyan-800 ml-2 normal-case font-mono">// The Primordial Waters</span>
              </h2>
            </div>

            <AnimatePresence>
              {nunTasks.length === 0 ? (
                <div className="p-6 border border-dashed border-cyan-900/30 rounded-lg text-center text-cyan-800 text-sm italic">
                  The waters are still. Chaos has been subdued.
                </div>
              ) : (
                nunTasks.map(task => (
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
                ))
              )}
            </AnimatePresence>
          </section>

          {/* --- SECTION 2: MA'AT (ORDER / COMPLETE) --- */}
          {maatTasks.length > 0 && (
            <motion.section
              id="maat-sanctuary" // 👈 ADD THIS BEACON 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mt-12"
            >
              {/* DIVINE SEPARATOR: A glowing line separating Dark from Light */}
              <div className="absolute -top-6 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80 shadow-[0_0_20px_#f59e0b]" />

              {/* THE MA'AT SANCTUARY CONTAINER - NOW BRIGHT & RADIANT */}
              <div className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-100 p-6 md:p-8 shadow-[0_0_80px_rgba(251,191,36,0.3)] relative overflow-hidden">

                {/* Ambient Light Effect inside the box */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/20 blur-[80px] rounded-full pointer-events-none" />

                <div className="flex items-center gap-3 border-b border-amber-200 pb-4 mb-6 relative z-10">
                  {/* Sun Icon: Darker Amber for contrast against white */}
                  <Sun className="w-8 h-8 text-amber-600 animate-spin-slow drop-shadow-md" />
                  {/* UPDATED: Layout to stack text correctly */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                    <h2 className="text-2xl font-display tracking-[0.2em] text-amber-900 uppercase drop-shadow-sm font-bold">
                      Ma'at
                    </h2>
                    <span className="text-xs text-amber-700 font-mono tracking-normal opacity-80">
                      Order Established
                    </span>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <AnimatePresence>
                    {maatTasks.map(task => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
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
              </div>
            </motion.section>
          )}

        </div>
      )}
    </div>
  );
}