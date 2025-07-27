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
import { BookCopy, FolderUp, LogOut, Settings } from "lucide-react";

export function AppSidebar() {
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
            <SidebarMenuButton href="#" isActive>
              <EyeOfHorusIcon />
              Daily Rituals
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#">
              <AnkhIcon />
              Responsibilities
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#">
              <ScarabBeetleIcon />
              Special Missions
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#">
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
