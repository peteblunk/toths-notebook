"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase"; // Importing your Config keys
import { useAuth } from "@/components/auth-provider"; // Assuming you have this

export type Task = {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  createdAt: any;
  userId: string;
  // Add other fields you use, like 'isPriority' or 'date'
};

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. LISTEN TO TASKS (Real-time)
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    // Query: Get tasks for this user, ordered by creation time
    const q = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid),
      // You might need an index for this orderBy, check your console logs if it errors!
      // orderBy("createdAt", "desc") 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newTasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      
      setTasks(newTasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. ADD TASK HELPER
  const addTask = async (title: string, category: string) => {
    if (!user) return;
    await addDoc(collection(db, "tasks"), {
      title,
      category,
      completed: false,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
  };

  // 3. TOGGLE COMPLETE HELPER
  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, {
      completed: !currentStatus
    });
  };

  return { tasks, loading, addTask, toggleTask };
}