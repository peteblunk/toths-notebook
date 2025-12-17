"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast"; 
import { Task } from "@/lib/types"; 

export function useTasks(filter?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]); // Standard Tasks
  const [rituals, setRituals] = useState<Task[]>([]); // Ritual Templates
  const [loading, setLoading] = useState(true);

  // 1. FETCH STANDARD TASKS (The Nun)
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    const q = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            // Normalize Timestamps safely
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : data.dueDate,
            
            // --- THE FIX IS HERE ---
            // Do NOT hardcode false. Read the DNA tag!
            isRitual: data.isRitual ?? false, 
            originRitualId: data.originRitualId ?? null,
        };
      }) as Task[];
      
      setTasks(results);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. FETCH RITUAL TEMPLATES (The Source Code)
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "dailyRituals"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isRitual: true, // Tag these as Templates!
      })) as unknown as Task[];
      
      setRituals(results);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. SAFE ACTIONS

  const addTask = async (title: string, category: string, dueDate?: Date) => {
    if (!user) return;
    
    // We need to cast the importance to match the strict type or provide a default
    const newTask = {
      title,
      category,
      completed: false,
      userId: user.uid,
      createdAt: serverTimestamp(),
      dueDate: dueDate || null,
      importance: 'medium', // Default value required by new Type
      estimatedTime: 15     // Default value required by new Type
    };

    await addDoc(collection(db, "tasks"), newTask);
  };

  const toggleTask = async (task: Task) => {
    // Determine which collection this task belongs to
    const collectionName = task.isRitual && !task.originRitualId ? "dailyRituals" : "tasks";
    // NOTE: If it has originRitualId, it's a clone in "tasks". If it's a raw template, it's in "dailyRituals".
    // But usually, we only toggle clones. This safety check ensures we target the right place.
    
    // Simplification for your current architecture:
    // If it's in the main list, it's in "tasks" (even if it is a ritual instance).
    // If it's in the Manage Rituals list, it's in "dailyRituals".
    // For now, let's keep your logic simple:
    const targetCollection = (task as any).originRitualId ? "tasks" : (task.isRitual ? "dailyRituals" : "tasks");
    
    const taskRef = doc(db, targetCollection, task.id);
    await updateDoc(taskRef, {
      completed: !task.completed
    });
  };

  // --- THE SAFETY LOCK ---
  const deleteTask = async (task: Task) => {
    // Check if it is a Ritual Instance (Clone) OR a Ritual Template
    if (task.isRitual) {
      // STOP! Do not delete ritual instances or templates from the main view.
      toast({
        title: "Forbidden Action",
        description: "Rituals cannot be banished. They must be fulfilled.",
        variant: "destructive"
      });
      return; 
    }

    // Proceed if it is a normal task
    try {
      await deleteDoc(doc(db, "tasks", task.id));
      toast({ title: "Banished", description: "Task removed from the archives." });
    } catch (error) {
      console.error("Delete failed", error);
      toast({ title: "Error", variant: "destructive", description: "Could not delete task." });
    }
  };

  return { 
    tasks,      // Regular tasks list (Including First Breath Clones)
    rituals,    // Ritual templates list
    loading, 
    addTask, 
    toggleTask, 
    deleteTask 
  };
}