"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarFooter,
  SidebarMenuButton,
  SidebarGroupLabel,
  useSidebar, // THE FIX IS HERE: Added the missing import
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
  BookOpen,
} from "lucide-react";
import Link from 'next/link';
import { useAuth } from "@/components/auth-provider";
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { MoonPhaseIcon } from "./moon-phase-icon";

// This is the main sidebar component.
export function AppSidebar({ activeCategory, setActiveCategory }) {
  const { user } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("User signed out successfully.");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    setActiveCategory(categoryName);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const mainNavItems = [
    { name: "Today", icon: <Home /> },
    { name: "Daily Rituals", icon: <Sunrise /> },
    { name: "Sacred Duties", icon: <Eye /> },
    { name: "Special Missions", icon: <Scroll /> },
    { name: "Grand Expeditions", icon: <Mountain /> },
  ];

  return (
    <div className="flex flex-col h-full">
      <SidebarHeader>
        <div className="flex items-center justify-between p-2">
            <h1 className="text-xl font-bold text-cyan-400 font-display tracking-wider">
                Thoth's Notebook
            </h1>
            <MoonPhaseIcon />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex-grow overflow-y-auto">
        <SidebarMenu>
          {mainNavItems.map((item) => (
            <SidebarMenuButton
              key={item.name}
              icon={item.icon}
              isActive={activeCategory === item.name}
              onClick={() => handleCategoryClick(item.name)}
              className="text-sidebar-foreground"
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full text-cyan-400/70 hover:text-cyan-400">
                      <Link href="/rituals">
                        <BookOpen className="w-5 h-5" />
                        <span className="sr-only">Manage Rituals</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" align="center">
                      <p>Manage Rituals</p>
                  </TooltipContent>
                </Tooltip>

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
