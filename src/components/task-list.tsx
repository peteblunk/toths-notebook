"use client";

import React from 'react';
import { TaskCard } from '@/components/task-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Scroll } from 'lucide-react';
import { useTasks } from '@/hooks/use-tasks';
import { type Task } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';

interface TaskListProps {
  filter: string;
}

export function TaskList({ filter }: TaskListProps) {
  const {
    tasks: regularTasks,
    rituals: ritualTasks,
    loading,
    toggleTask,
    deleteTask
  } = useTasks(filter);

  // ------------------------------------------------------------------
  // 1. THE PERSISTENCE LOGIC (The Scribe's Day)
  // ------------------------------------------------------------------
  const getScribesEndOfDay = () => {
    const now = new Date();
    const end = new Date(now);

    // If current time is before 2:30 AM, we are still in "yesterday's" session
    if (now.getHours() < 2 || (now.getHours() === 2 && now.getMinutes() < 30)) {
      end.setHours(2, 30, 0, 0);
    } else {
      // Otherwise, the current session ends at 2:30 AM tomorrow
      end.setDate(now.getDate() + 1);
      end.setHours(2, 30, 0, 0);
    }
    return end;
  };

  const isTemporal = ["Today", "7 Days", "30 Days"].includes(filter);
  // ------------------------------------------------------------------
  // 2. THE DUAL-GATEWAY FILTERING
  // ------------------------------------------------------------------
  const getCategorizedTasks = () => {
    let combined: Task[] = [];
    const scribesEnd = getScribesEndOfDay();

    // Determine the Gateway

    const isRitualTemplateView = filter === "Daily Rituals" || filter === "Rituals";

    if (isRitualTemplateView) {
      combined = [...ritualTasks];
    }
    else if (isTemporal) {
      // GATEWAY 1: TEMPORAL (Today, 7, 30)
      const timeHorizon = new Date(scribesEnd);
      if (filter === "7 Days") timeHorizon.setDate(timeHorizon.getDate() + 7);
      if (filter === "30 Days") timeHorizon.setDate(timeHorizon.getDate() + 30);

      combined = regularTasks.filter(t => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        // Show everything within the window (Persistence Fix is here)
        return d < timeHorizon;
      });
    }
    else {
      // GATEWAY 2: ESSENCE (Khet, Missions, Duties, etc.)
      let filtered = regularTasks;

      if (filter !== "all" && filter !== "completed") {
        // If the filter is Khet, it matches the CATEGORY_LABELS.GENERAL
        const targetCategory = filter === CATEGORY_LABELS.GENERAL ? "Today" : filter;
        filtered = filtered.filter(t => t.category === targetCategory);
      }

      // RULE: Essence views show ONLY incomplete (Nun) tasks
      combined = filtered.filter(t => !t.completed);
    }

    // --- SORT LOGIC ---
    combined.sort((a, b) => {
      const aIsSacred = a.category === "Sacred Duties" || a.isRitual;
      const bIsSacred = b.category === "Sacred Duties" || b.isRitual;
      if (aIsSacred && !bIsSacred) return -1;
      if (!aIsSacred && bIsSacred) return 1;

      const da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return da - db;
    });

    // --- SPLIT THE WATERS ---
    const nun = combined.filter(t => !t.completed);
    // Ma'at is only populated for Temporal views per the new law
    const maat = isTemporal ? combined.filter(t => t.completed) : [];

    return { nun, maat };
  };

  const { nun, maat } = getCategorizedTasks();

  const handleToggle = (task: Task) => toggleTask(task);
  const handleDelete = (taskId: string) => {
    const allTasks = [...regularTasks, ...ritualTasks];
    const taskObj = allTasks.find(t => t.id === taskId);
    if (taskObj) deleteTask(taskObj);
  };

  if (loading && nun.length === 0 && maat.length === 0) {
    return <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>;
  }

  if (nun.length === 0 && (isTemporal ? maat.length === 0 : true)) {
    return (
      <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-muted/20 rounded-lg">
        <p>No scrolls found in the {filter} jar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* NUN: ACTIVE */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] pl-1 mb-4 flex items-center gap-2">
          <Scroll className="w-4 h-4" />
          Nun (The Waters of Potential)
        </h3>
        {nun.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            collectionName={task.isRitual ? "dailyRituals" : "tasks"}
            onToggle={() => handleToggle(task)}
            onTaskDelete={handleDelete}
          />
        ))}
      </div>

      {/* MA'AT: COMPLETED (Only in Temporal Views) */}
      {isTemporal && maat.length > 0 && (
        <div className="space-y-4 pt-4 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-[0.2em] pl-1 mb-4 flex items-center gap-2">
            <span className="text-lg">☥</span> Ma'at (Order & Truth)
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