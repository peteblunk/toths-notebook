"use client";

import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarFooter,
  SidebarMenuButton,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { MoonPhaseIcon } from './moon-phase-icon'; // Import our new component

// This is the main sidebar component.
export function AppSidebar({ activeCategory, setActiveCategory }) {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
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

  return (
    <div className="flex flex-col h-full">
      <SidebarHeader>
        <div className="flex items-center justify-center p-2">
            <h1 className="text-xl font-bold text-cyan-400 font-display tracking-wider">
                Thoth's Notebook
            </h1>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex-grow overflow-y-auto">
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
            
            <div className="flex items-center gap-1">
                {/* Our new moon icon is placed here! */}
                <MoonPhaseIcon />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                        onClick={handleSignOut}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full border border-pink-500 text-pink-500 hover:bg-pink-500/10 hover:text-pink-400"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="sr-only">Logout</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" align="center">
                      <p>Logout</p>
                  </TooltipContent>
                </Tooltip>
            </div>
        </div>
      </SidebarFooter>
    </div>
  );
}
