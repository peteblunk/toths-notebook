"use client";

import { useState } from "react";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TaskList } from "@/components/task-list";
import { FilterCategory } from "@/lib/types";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('Today');

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar>
        <AppSidebar activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      </Sidebar>
      <SidebarInset className="flex-1 bg-background">
        <main className="p-4 sm:p-6 lg:p-8 h-full">
          <TaskList activeCategory={activeCategory} />
        </main>
      </SidebarInset>
    </div>
  );
}
