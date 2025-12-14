"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/components/auth-provider"; // Import our custom auth hook
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TaskList } from "@/components/task-list";
import { FilterCategory } from "@/lib/types";

// This is the main page of our application. It's now a "protected route".
export default function Home() {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('Today');
  
  // Get the user and loading state from our AuthProvider
  const { user, loading } = useAuth(); // ✅ Matches the type definition
  const router = useRouter();

  // This useEffect hook runs whenever the user, loading state, or router changes.
  // Its job is to protect the route.
  useEffect(() => {
    // If we are done loading and there is no user, it means they are not logged in.
    // We redirect them to the login page.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]); // The effect depends on these values

  // While Firebase is checking the auth state, we show a loading screen.
  // This prevents a "flash" of the main app before the redirect can happen.
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

  // If we are done loading AND there is a user, we render the main application.
  if (user) {
    return (
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        <Sidebar>
          <AppSidebar 
  activeCategory={activeCategory} 
  setActiveCategory={(category: string) => setActiveCategory(category as any)} 
/>
        </Sidebar>
        <SidebarInset className="flex-1 bg-background">
          <main className="p-4 sm:p-6 lg:p-8 h-full">
            <TaskList activeCategory={activeCategory} />
          </main>
        </SidebarInset>
      </div>
    );
  }

  // If none of the above conditions are met (which shouldn't happen, but is good for safety),
  // we return null to render nothing.
  return null;
}