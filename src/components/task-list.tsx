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

    if (now.getHours() < 2 || (now.getHours() === 2 && now.getMinutes() < 30)) {
      end.setHours(2, 30, 0, 0);
    } else {
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

    // 1. RITUAL GATEWAY (ONLY for the Daily Rituals collection)
    const isRitualSource = filter === CATEGORY_LABELS.RITUAL || filter === "Rituals";

    if (isRitualSource) {
      combined = ritualTasks.filter(t => {
        if (filter === "Rituals") return true;
        return t.category === filter; 
      });
    }
    else if (isTemporal) {
      // 2. TEMPORAL GATEWAY (Today, 7, 30)
      const timeHorizon = new Date(scribesEnd);
      if (filter === "7 Days") timeHorizon.setDate(timeHorizon.getDate() + 7);
      if (filter === "30 Days") timeHorizon.setDate(timeHorizon.getDate() + 30);

      combined = regularTasks.filter(t => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return d < timeHorizon;
      });
    }
    else {
      // 3. THE UNDONE / CATEGORY GATEWAY
      // Sacred Duties live in regularTasks, so they fall here.
      let filtered = regularTasks;

      if (filter !== "all" && filter !== "completed") {
        filtered = filtered.filter(t => {
          return t.category === filter || t.category === CATEGORY_LABELS[filter as keyof typeof CATEGORY_LABELS];
        });
      }

      combined = filtered.filter(t => !t.completed);
    }
  
    // --- THE PURIFIED TIERED SORT ---
    combined.sort((a, b) => {
      const getTier = (task: Task) => {
        if (task.category === CATEGORY_LABELS.RITUAL) return 1; 
        if (task.category === CATEGORY_LABELS.DUTY) return 2;   
        return 3;                                               
      };

      const tierA = getTier(a);
      const tierB = getTier(b);

      if (tierA !== tierB) return tierA - tierB;

      const da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return da - db;
    });

    const nun = combined.filter(t => !t.completed);
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