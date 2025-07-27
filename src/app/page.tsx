import { Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TaskList } from "@/components/task-list";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset className="flex-1 bg-background">
        <main className="p-4 sm:p-6 lg:p-8 h-full">
          <TaskList />
        </main>
      </SidebarInset>
    </div>
  );
}
