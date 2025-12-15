"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/components/auth-provider"; 
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TaskList } from "@/components/task-list";
import { FilterCategory } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { AddTaskDialog } from "@/components/add-task-dialog";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('Today');
  
  // Get the user and loading state from our AuthProvider
  const { user, loading } = useAuth(); 
  const router = useRouter();
  const { toast } = useToast(); // Initialize the toast hook

  // This useEffect hook protects the route
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]); 

  // ------------------------------------------------------------------
  // 1. THE MISSING HANDLER FUNCTION
  // ------------------------------------------------------------------
  const handleAddTask = async (taskData: any) => {
    if (!user) {
        console.error("No user found!");
        return;
    }

    try {
        // Decide where the scroll goes: 'dailyRituals' or 'tasks'
        const isRitual = taskData.category === "Daily Rituals" || taskData.category === "Sacred Duties";
        const targetCollection = isRitual ? "dailyRituals" : "tasks";

        console.log(`Adding task to ${targetCollection}...`, taskData);

        await addDoc(collection(db, targetCollection), {
            ...taskData,
            userId: user.uid,
            completed: false,
            createdAt: serverTimestamp(),
            // Ensure we save a valid date object
            dueDate: taskData.dueDate || new Date(), 
        });

        // (Toast is handled in the Dialog component, so we don't need one here)
    } catch (error) {
        console.error("Error adding task in Home:", error);
        toast({ 
            title: "Error", 
            description: "The Scribe could not record this task.", 
            variant: "destructive" 
        });
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-cyan-400 font-display">
        <svg className="animate-spin h-10 w-10 text-cyan-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h1 className="text-2xl tracking-wider">Accessing the Archives...</h1>
      </div>
    );
  }

  // Main App State
  if (user) {
    return (
      <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden">
        <Sidebar>
          <AppSidebar 
             activeCategory={activeCategory} 
             setActiveCategory={(category: string) => setActiveCategory(category as any)} 
          />
        </Sidebar>
        <SidebarInset className="flex flex-col flex-1 bg-background h-full overflow-hidden">
        
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="font-display font-bold text-lg">{activeCategory}</span>
          
          <div className="ml-auto">
             {/* 👇 2. PASS THE FUNCTION TO THE COMPONENT */}
             <AddTaskDialog onTaskAdd={handleAddTask} />
          </div>
        </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <TaskList filter={activeCategory} />
          </main>
        </SidebarInset>
      </div>
    );
  }

  return null;
}