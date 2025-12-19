"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
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
  Landmark,
  Calendar,
  Package
} from "lucide-react";
import Link from 'next/link';
import { useAuth } from "@/components/auth-provider";
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { MoonPhaseIcon } from "./moon-phase-icon";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { KhonsuTimer } from "@/components/khonsu-timer";
import { CATEGORY_LABELS } from "@/lib/types";

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

  const temporalFilters = [
    { name: "Today", icon: <Home className="w-4 h-4" /> },
    { name: "7 Days", icon: <Calendar className="w-4 h-4" /> },
    { name: "30 Days", icon: <Landmark className="w-4 h-4" /> },
  ];

  const essenceFilters = [
    { name: CATEGORY_LABELS.GENERAL, icon: <Package className="w-4 h-4" /> },
    { name: CATEGORY_LABELS.RITUAL, icon: <Sunrise className="w-4 h-4" /> },
    { name: CATEGORY_LABELS.DUTY, icon: <Eye className="w-4 h-4" /> },
    { name: CATEGORY_LABELS.MISSION, icon: <Scroll className="w-4 h-4" /> },
    { name: CATEGORY_LABELS.EXPEDITION, icon: <Mountain className="w-4 h-4" /> },
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

      <SidebarContent className="flex-grow overflow-visible px-2 space-y-12 mt-8">

        {/* TEMPORAL GATEWAY - AZURE OVERLAY */}
        <div className="group/temporal relative flex items-center h-12">
          {/* Trigger Area */}
          <div className="cursor-pointer py-2 pl-3 border-l-2 border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-950/20 transition-all duration-300 w-full z-10">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-cyan-400/40 group-hover/temporal:text-cyan-300 font-display">
              Temporal
            </h3>
          </div>

          {/* THE SUPERIMPOSED ARRAY */}

          <div className="absolute 
  /* Using a pixel value ensures it doesn't 'revert' to the left */
  left-[140px] 
  top-0 
  flex flex-col space-y-2 
  opacity-0 -translate-x-8 pointer-events-none 
  /* The transition moves it into place on hover */
  group-hover/temporal:opacity-100 
  group-hover/temporal:translate-x-4 
  group-hover/temporal:pointer-events-auto 
  transition-all duration-300 ease-out 
  /* Higher Z-index to float over the main list */
  z-[100] 
  min-w-[140px]
">
            {temporalFilters.map((item) => (
              <button
                key={item.name}
                onClick={() => handleCategoryClick(item.name)}
                className={`
          h-10 px-4 flex items-center gap-3 bg-black border font-display text-[10px] uppercase tracking-widest transition-all
          ${activeCategory === item.name
                    ? "border-cyan-400 text-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.5)]"
                    : "border-cyan-900 text-cyan-900 hover:border-cyan-500 hover:text-cyan-400"}
        `}
              >
                <span className="w-4 h-4">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </div>
        </div>

        {/* THE UNDONE (ESSENCE) - EMERALD OVERLAY */}
        <div className="group/undone relative flex items-center h-12">
          {/* Trigger Area */}
          <div className="cursor-pointer py-2 pl-3 border-l-2 border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-950/20 transition-all duration-300 w-full z-10">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-emerald-400/40 group-hover/undone:text-emerald-300 font-display">
              The Undone
            </h3>
          </div>

          {/* SUPERIMPOSED DATA ARRAY (EMERALD) */}
          <div className="absolute 
    left-[140px] 
    top-0 
    flex flex-col space-y-2 
    opacity-0 -translate-x-8 pointer-events-none 
    /* CHANGE THESE THREE FROM /temporal TO /undone */
    group-hover/undone:opacity-100 
    group-hover/undone:translate-x-4 
    group-hover/undone:pointer-events-auto 
    transition-all duration-300 ease-out 
    z-[100] 
    min-w-[160px]
  ">
            {essenceFilters.map((item) => (
              <button
                key={item.name}
                onClick={() => handleCategoryClick(item.name)}
                className={`
          h-10 px-4 flex items-center gap-3 bg-black border font-display text-[10px] uppercase tracking-widest transition-all
          ${activeCategory === item.name
                    ? "border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    : "border-emerald-900/50 text-emerald-900 hover:border-emerald-500 hover:text-emerald-400"}
        `}
              >
                <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </div>
        </div>

      </SidebarContent>

      <SidebarFooter>
        <div className="mt-auto border-t border-cyan-900/30 pt-2 flex flex-col gap-1">
          <SidebarMenuButton asChild className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/50 group w-full justify-start pl-2">
            <Link href="/rituals">
              <BookOpen className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-bold tracking-wide">Manage Rituals</span>
            </Link>
          </SidebarMenuButton>

          <SidebarMenuButton asChild className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 group w-full justify-start pl-2">
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
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Manage Rituals</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleSignOut} variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-pink-500 text-pink-500 hover:bg-pink-500/10">
                  <LogOut className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </SidebarFooter>
    </div>
  );
}