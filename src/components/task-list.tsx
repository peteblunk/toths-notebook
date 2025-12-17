"use client";

import React from 'react';
import { TaskCard } from '@/components/task-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Scroll } from 'lucide-react'; 
import { useTasks, Task } from '@/hooks/use-tasks'; // Import the new Scribe Hook

interface TaskListProps {
  filter: string;
}

export function TaskList({ filter }: TaskListProps) {
  // ------------------------------------------------------------------
  // 1. USE THE SCRIBE HOOK
  // We get the data and the "Safe Actions" directly from our new brain.
  // We alias them to 'regularTasks'/'ritualTasks' to match your existing logic.
  // ------------------------------------------------------------------
  const { 
    tasks: regularTasks, 
    rituals: ritualTasks, 
    loading, 
    toggleTask, 
    deleteTask 
  } = useTasks(filter);

  // Helper flags
  const isRitualView = filter === "Daily Rituals" || filter === "Rituals";
  const isMaatView = filter === "Today"; 

  // ------------------------------------------------------------------
  // 2. LOGIC: Merge & Split into NUN (Active) vs MA'AT (Done)
  // ------------------------------------------------------------------
  const getCategorizedTasks = () => {
    let combined: Task[] = [];

    if (isRitualView) {
        // VIEW: Daily Rituals (Show only templates)
        combined = [...ritualTasks];
    } else if (isMaatView) {
        // VIEW: Today (Show active tasks + overdue + rituals)
        
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        
        const nextDayStart = new Date(todayStart);
        nextDayStart.setDate(todayStart.getDate() + 1);

        const relevantTasks = regularTasks.filter(t => {
            if (!t.dueDate) return false;
            const d = new Date(t.dueDate);
            
            // 1. ACTIVE TASKS: Include Today OR Past (Overdue)
            if (!t.completed) {
                return d < nextDayStart; 
            }
            
            // 2. COMPLETED TASKS: Only include if due Today
            return d >= todayStart && d < nextDayStart;
        });

        // The Templates (ritualTasks) are hidden from this view.
combined = [...relevantTasks];

    } else {
        // VIEW: Categories (Inbox, Sacred Duties, etc.)
        // Since the Hook now fetches ALL tasks, we must filter by category here.
        
        let filtered = regularTasks;

        // Apply Category Filter if it's not a generic view
        if (filter !== "all" && filter !== "Inbox" && filter !== "completed" && filter !== "Upcoming") {
             filtered = filtered.filter(t => t.category === filter);
        }

        if (filter === "completed") {
            combined = filtered.filter(t => t.completed);
        } else {
            combined = filtered;
        }
    }

    // Sort Logic
    combined.sort((a, b) => {
        const aIsSacred = a.category === "Sacred Duties" || a.isRitual;
        const bIsSacred = b.category === "Sacred Duties" || b.isRitual;
        
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

  // ------------------------------------------------------------------
  // 3. ACTION HANDLERS
  // Now we just delegate to the Hook's safe functions
  // ------------------------------------------------------------------
  
  const handleToggle = (task: Task) => {
    toggleTask(task);
  };

  const handleDelete = (taskId: string) => {
      // Find the full task object so the Hook can check 'isRitual'
      const allTasks = [...regularTasks, ...ritualTasks];
      const taskObj = allTasks.find(t => t.id === taskId);
      
      if (taskObj) {
        deleteTask(taskObj); // This triggers the safety lock if needed
      }
  };

  // ------------------------------------------------------------------
  // 4. RENDER UI
  // ------------------------------------------------------------------

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
                // We pass the collection name for the UI styling (locking the trash icon)
                collectionName={task.isRitual ? "dailyRituals" : "tasks"}
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
                        collectionName={task.isRitual ? "dailyRituals" : "tasks"}
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