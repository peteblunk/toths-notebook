"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarFooter,
  SidebarMenuButton,
  SidebarGroupLabel,
  useSidebar,
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
  Eclipse,
  Moon, 
} from "lucide-react";
import Link from 'next/link';
import { useAuth } from "@/components/auth-provider";
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { MoonPhaseIcon } from "./moon-phase-icon";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { KhonsuTimer } from "@/components/khonsu-timer";

// This is the main sidebar component.
interface AppSidebarProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export function AppSidebar({ activeCategory, setActiveCategory }: AppSidebarProps) {
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
              isActive={activeCategory === item.name}
              onClick={() => handleCategoryClick(item.name)}
              className="text-sidebar-foreground"
            >
              {item.icon}
              <span>{item.name}</span>
            </SidebarMenuButton>
          ))}
          
          <div className="pt-4 mt-4 border-t border-cyan-900/30">
            <Dialog>
              <DialogTrigger asChild>
                <SidebarMenuButton className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/50 group">
                  {/* The Eclipse icon spins slowly on hover for that "Charging Up" effect */}
                  <Eclipse className="group-hover:animate-spin-slow transition-all duration-700" />
                  <span className="font-bold tracking-wide">Invoke Khonsu</span>
                </SidebarMenuButton>
              </DialogTrigger>
              <DialogContent className="p-0 border-none bg-transparent max-w-md shadow-none sm:max-w-lg">
                <DialogTitle className="sr-only">Invoke Khonsu Timer</DialogTitle>
                <KhonsuTimer />
              </DialogContent>
            </Dialog>
          </div>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        {/* --- Footer Navigation Actions --- */}
        <div className="mt-auto border-t border-cyan-900/30 pt-2 flex flex-col gap-1">
            
            {/* NEW: Manage Daily Rituals (The Template Library) */}
            <SidebarMenuButton 
                asChild 
                className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/50 group w-full justify-start pl-2"
            >
                <Link href="/rituals">
                <BookOpen className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-bold tracking-wide">Manage Rituals</span>
                </Link>
            </SidebarMenuButton>

            {/* Evening Chronicle Anchor */}
            <SidebarMenuButton 
                asChild 
                className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 group w-full justify-start pl-2"
            >
                <Link href="/evening-chronicle">
                <Moon className="w-4 h-4 mr-2 group-hover:animate-spin-slow transition-all duration-700" />
                <span className="font-bold tracking-wide">Evening Chronicle</span>
                </Link>
            </SidebarMenuButton>
        </div>

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