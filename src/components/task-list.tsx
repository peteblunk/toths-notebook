"use client";

import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc,
  deleteDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { TaskCard } from '@/components/task-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Task } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Scroll } from 'lucide-react'; 

interface TaskListProps {
  filter: string;
}

export function TaskList({ filter }: TaskListProps) {
  const { user } = useAuth();
  
  // SEPARATE STATE BUCKETS
  const [regularTasks, setRegularTasks] = useState<Task[]>([]);
  const [ritualTasks, setRitualTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const isRitualView = filter === "Daily Rituals" || filter === "Rituals";
  const isMaatView = filter === "Today"; 

  // ------------------------------------------------------------------
  // EFFECT 1: Fetch Regular Tasks
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!user) return;
    
    if (isRitualView) {
        setRegularTasks([]);
        return;
    }

    setLoading(true);
    
    const tasksRef = collection(db, "tasks");
    let q = query(tasksRef, where("userId", "==", user.uid));

    // For Ma'at (Today) view, we fetch everything so we can filter for overdue + today client-side
    // For specific category filters, we apply them here to save bandwidth
    if (!isMaatView && filter !== "all" && filter !== "Inbox" && filter !== "completed" && filter !== "Upcoming") {
         q = query(q, where("category", "==", filter));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const results: Task[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            results.push({
                id: doc.id,
                ...data,
                dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : data.dueDate,
            } as Task);
        });
        setRegularTasks(results);
        if (!isMaatView) setLoading(false);
    });

    return () => unsubscribe();
  }, [user, filter, isRitualView, isMaatView]);


  // ------------------------------------------------------------------
  // EFFECT 2: Fetch Daily Rituals
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    if (!isRitualView && !isMaatView) {
        setRitualTasks([]);
        return;
    }

    const ritualsRef = collection(db, "dailyRituals");
    let q = query(ritualsRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const results: Task[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            results.push({
                id: doc.id,
                ...data,
                dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : data.dueDate,
                isRitual: true, 
            } as unknown as Task);
        });
        setRitualTasks(results);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, filter, isRitualView, isMaatView]);


  // ------------------------------------------------------------------
  // LOGIC: Merge & Split into NUN (Active) vs MA'AT (Done)
  // ------------------------------------------------------------------
  const getCategorizedTasks = () => {
    let combined = [];

    if (isRitualView) {
        combined = [...ritualTasks];
    } else if (isMaatView) {
        // --- MA'AT LOGIC UPDATE ---
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        
        const nextDayStart = new Date(todayStart);
        nextDayStart.setDate(todayStart.getDate() + 1);

        const relevantTasks = regularTasks.filter(t => {
            if (!t.dueDate) return false;
            const d = new Date(t.dueDate);
            
            // 1. ACTIVE TASKS: Include Today OR Past (Overdue)
            // Logic: Is the due date BEFORE tomorrow?
            if (!t.completed) {
                return d < nextDayStart; 
            }
            
            // 2. COMPLETED TASKS: Only include if due Today
            // (We don't want to see tasks completed 2 years ago in today's view)
            return d >= todayStart && d < nextDayStart;
        });

        // Rituals: Always include all of them in Ma'at/Ritual view
        combined = [...relevantTasks, ...ritualTasks];
    } else {
        // Standard view filters
        if (filter === "completed") {
            combined = regularTasks.filter(t => t.completed);
        } else {
            combined = regularTasks;
        }
    }

    // Sort Logic
    combined.sort((a, b) => {
        const aIsSacred = a.category === "Sacred Duties" || (a as any).isRitual;
        const bIsSacred = b.category === "Sacred Duties" || (b as any).isRitual;
        
        // Sacred/Rituals always float to top
        if (aIsSacred && !bIsSacred) return -1;
        if (!aIsSacred && bIsSacred) return 1;
        
        // Then sort by Date (Oldest first for overdue items)
        const da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return da - db;
    });

    // SPLIT THE WATERS
    const nun = combined.filter(t => !t.completed);
    const maat = combined.filter(t => t.completed);

    return { nun, maat };
  };

  const { nun, maat } = getCategorizedTasks();

  const handleToggle = async (task: Task) => {
    const collectionName = (task as any).isRitual || isRitualView ? "dailyRituals" : "tasks";
    try {
        const taskRef = doc(db, collectionName, task.id);
        await updateDoc(taskRef, { completed: !task.completed });
        toast({ title: "Updated", description: "The balance shifts." });
    } catch (error) {
        console.error("Error toggling:", error);
    }
  };

  const handleDelete = async (taskId: string) => {
      const allTasks = [...nun, ...maat];
      const taskObj = allTasks.find(t => t.id === taskId);
      const collectionName = (taskObj as any)?.isRitual || isRitualView ? "dailyRituals" : "tasks";

      try {
          await deleteDoc(doc(db, collectionName, taskId));
          toast({ title: "Banished", description: "Task removed." });
      } catch (error) {
          console.error("Error deleting:", error);
      }
  };

  if (loading && nun.length === 0 && maat.length === 0) {
    return <div className="space-y-4"><Skeleton className="h-24"/><Skeleton className="h-24"/></div>;
  }

  if (nun.length === 0 && maat.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
         <p>No scrolls found in the {filter} jar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      
      {/* 1. NUN (Active/Pending) */}
      <div className="space-y-4">
        {/* Header: Only show if there are completed items, or just always show for structure */}
        {maat.length > 0 && (
             <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] pl-1 mb-4 flex items-center gap-2">
               <Scroll className="w-4 h-4" />
               Nun (The Waters of Potential)
             </h3>
        )}

        {nun.length === 0 && maat.length > 0 && (
            <p className="text-sm text-muted-foreground italic">The waters are calm. All tasks are done.</p>
        )}

        {nun.map((task) => (
            <TaskCard 
                key={task.id} 
                task={task}
                collectionName={(task as any).isRitual ? "dailyRituals" : "tasks"}
                onToggle={() => handleToggle(task)}
                onTaskDelete={handleDelete}
            />
        ))}
      </div>

      {/* 2. MA'AT (Completed/Done) */}
      {maat.length > 0 && (
          <div className="space-y-4 pt-4 relative">
             <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
             
             <h3 className="text-xs font-bold text-amber-500 uppercase tracking-[0.2em] pl-1 mb-4 flex items-center gap-2">
               <span className="text-lg">☥</span> 
               Ma'at (Order & Truth)
             </h3>

             <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">
                {maat.map((task) => (
                    <TaskCard 
                        key={task.id} 
                        task={task}
                        collectionName={(task as any).isRitual ? "dailyRituals" : "tasks"}
                        onToggle={() => handleToggle(task)}
                        onTaskDelete={handleDelete}
                    />
                ))}
             </div>
          </div>
      )}
    </div>
  );
}