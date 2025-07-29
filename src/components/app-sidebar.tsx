"use client";

import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarFooter,
  SidebarMenuButton,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  Home,
  Sunrise,
  Eye,
  Scroll,
  Mountain,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

// This is the main sidebar component, now correctly structured.
export function AppSidebar({ activeCategory, setActiveCategory }) {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // The AuthProvider will automatically handle the redirect.
      console.log("User signed out successfully.");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const mainNavItems = [
    { name: "Today", icon: <Home /> },
    { name: "Daily Rituals", icon: <Sunrise /> },
    { name: "Responsibilities", icon: <Eye /> },
    { name: "Special Missions", icon: <Scroll /> },
    { name: "Grand Expeditions", icon: <Mountain /> },
  ];

  // THE FIX IS HERE: We are returning a React Fragment (<>) instead of another <Sidebar>.
  // This provides the "guts" of the sidebar, which are then correctly placed
  // inside the main <Sidebar> component in `page.tsx`.
  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-center p-2">
            <h1 className="text-xl font-bold text-cyan-400 font-display tracking-wider">
                Thoth's Notebook
            </h1>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {mainNavItems.map((item) => (
            <SidebarMenuButton
              key={item.name}
              icon={item.icon}
              isActive={activeCategory === item.name}
              onClick={() => setActiveCategory(item.name)}
            >
              {item.name}
            </SidebarMenuButton>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 border-t border-border p-2">
            <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 bg-cyan-900/50 flex items-center justify-center rounded-full flex-shrink-0">
                    <User className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1 overflow-hidden">
                    <SidebarGroupLabel className="text-sm font-semibold text-foreground truncate">
                        {user ? user.displayName : "Scribe"}
                    </SidebarGroupLabel>
                </div>
            </div>
            <SidebarMenuButton 
                onClick={handleSignOut} 
                icon={<LogOut className="w-5 h-5" />} 
                className="h-8 w-8 p-0 flex-shrink-0"
                tooltip="Logout"
            />
        </div>
      </SidebarFooter>
    </>
  );
}
