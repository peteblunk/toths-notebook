import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { IbisIcon } from "./icons/ibis-icon";
import { EyeOfHorusIcon } from "./icons/eye-of-horus-icon";
import { AnkhIcon } from "./icons/ankh-icon";
import { ScarabBeetleIcon } from "./icons/scarab-beetle-icon";
import { PyramidsIcon } from "./icons/pyramids-icon";
import { ScrollIcon } from "./icons/scroll-icon";
import { BookCopy, CalendarClock, FolderUp, LogOut, Settings } from "lucide-react";
import { FilterCategory } from "@/lib/types";

type AppSidebarProps = {
  activeCategory: FilterCategory;
  setActiveCategory: (category: FilterCategory) => void;
};


export function AppSidebar({ activeCategory, setActiveCategory }: AppSidebarProps) {
  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <IbisIcon className="text-primary size-8" />
          <h2 className="text-xl font-headline tracking-wider text-primary group-data-[collapsible=icon]:hidden">
            THOTH
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
           <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => setActiveCategory('Today')} 
              isActive={activeCategory === 'Today'}
              tooltip="Tasks due today and daily rituals"
            >
              <CalendarClock />
              Today
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => setActiveCategory('Daily Rituals')} 
              isActive={activeCategory === 'Daily Rituals'}
              tooltip="Tasks that repeat every day."
            >
              <EyeOfHorusIcon />
              Daily Rituals
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => setActiveCategory('Regular Responsibilities')} 
              isActive={activeCategory === 'Regular Responsibilities'}
              tooltip="Core duties and recurring obligations."
            >
              <AnkhIcon />
              Responsibilities
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => setActiveCategory('Special Missions')} 
              isActive={activeCategory === 'Special Missions'}
              tooltip="Unique, one-off objectives with specific goals."
            >
              <ScarabBeetleIcon />
              Special Missions
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => setActiveCategory('Grand Expeditions')} 
              isActive={activeCategory === 'Grand Expeditions'}
              tooltip="Large, long-term projects with multiple phases."
            >
              <PyramidsIcon />
              Grand Expeditions
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton href="#">
                    <ScrollIcon />
                    Goals & Habits
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="#">
                    <BookCopy />
                    Templates
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="#">
                    <FolderUp />
                    Google Drive
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton href="#">
              <Settings />
              Settings
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#">
              <LogOut />
              Logout
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
