"use client";

import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { TaskCard } from '@/components/task-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Task } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface TaskListProps {
  filter: string;
}

export function TaskList({ filter }: TaskListProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    try {
      const tasksRef = collection(db, "tasks");
      let q = query(tasksRef, where("userId", "==", user.uid));

      // Apply filters based on the category
      if (filter === "completed") {
        q = query(q, where("completed", "==", true));
      } else if (filter !== "all") {
        // For specific categories, we usually want active tasks
        q = query(q, 
            where("category", "==", filter),
            where("completed", "==", false)
        );
      } else {
        // "all" usually implies active tasks across all categories
         q = query(q, where("completed", "==", false));
      }

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tasksData: Task[] = [];
        querySnapshot.forEach((docSnap) => {
            // 🛡️ Cast data to 'any' to avoid type errors
            const data = docSnap.data() as any;

            tasksData.push({
              id: docSnap.id,
              ...data,
              // Safe date conversions
              dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : data.dueDate,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            } as unknown as Task); // 🛡️ Double Cast
        });
        
        // simple client-side sort by creation/date
        tasksData.sort((a: any, b: any) => {
            const dateA = a.createdAt?.getTime() || 0;
            const dateB = b.createdAt?.getTime() || 0;
            return dateB - dateA;
        });

        setTasks(tasksData);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up task listener:", error);
      setLoading(false);
    }
  }, [user, filter]);

  const handleToggle = async (task: Task) => {
    try {
        const taskRef = doc(db, "tasks", task.id);
        await updateDoc(taskRef, {
            completed: !task.completed
        });
        
        const action = !task.completed ? "completed" : "reactivated";
        toast({ title: "Success", description: `Task ${action}.` });
    } catch (error) {
        console.error("Error toggling task:", error);
        toast({ title: "Error", description: "Could not update task.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg bg-background/50">
        <p>No tasks found in this scroll.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {tasks.map((task) => (
        <TaskCard 
            key={task.id} 
            task={task} 
            // This connects the toggle logic to the card
            onToggle={() => handleToggle(task)}
        />
      ))}
    </div>
  );
}