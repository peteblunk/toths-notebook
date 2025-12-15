"use client";

import { useRouter } from 'next/navigation'; // 1. Import Router
import { Sidebar, SidebarInset, SidebarTrigger, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";

export default function ArchivesPage() {
  const router = useRouter(); // 2. Initialize Router

  // 3. The Navigation Handler
  // When a user clicks a category (like "Today" or "Rituals"), 
  // we intercept it and force a navigation back to the main app.
  const handleReturnToDashboard = (category: string) => {
     router.push('/');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        
        <Sidebar>
          {/* 4. Pass the handler to the sidebar */}
          <AppSidebar 
             activeCategory="Archives" 
             setActiveCategory={handleReturnToDashboard} 
          />
        </Sidebar>

        <SidebarInset className="bg-background min-h-screen flex flex-col">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="font-display font-bold text-lg">The Archives</span>
          </header>
          
          <div className="flex flex-col items-center justify-center flex-1 text-center space-y-6 p-8">
            {/* Animated Icon */}
            <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="64" 
                  height="64" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="text-cyan-400 relative z-10"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  <circle cx="12" cy="10" r="2" />
                </svg>
            </div>

            <div className="space-y-2 max-w-md">
                <h1 className="text-3xl font-display font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                    ARCHIVES SEALED
                </h1>
                <p className="text-muted-foreground font-mono text-sm">
                    The ancient scrolls are currently being digitized. <br/>
                    Access to historical records is restricted by the High Scribe.
                </p>
            </div>
            
            <div className="px-4 py-2 border border-dashed border-zinc-700 rounded bg-zinc-900/50">
                <code className="text-xs text-amber-500">Status: 404 // CONSTRUCTING_TIMELINE</code>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}