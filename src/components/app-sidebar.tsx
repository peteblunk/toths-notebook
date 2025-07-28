"use client";

import {
  Sidebar,
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
import { useRouter } from 'next/navigation';

// This is the main sidebar component.
// We've added the logic for signing out here.
export function AppSidebar({ activeCategory, setActiveCategory }) {
  // 1. Hooks at the top - this is the correct place for them.
  const router = useRouter();
  const { user } = useAuth(); // Get the current user to display their name

  // 2. Helper functions next.
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // After signing out, the AuthProvider will detect the change,
      // and the protected route on the main page will automatically
      // redirect the user to the /login page.
      console.log("User signed out successfully.");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // A helper array for our main navigation items
  const mainNavItems = [
    { name: "Today", icon: <Home /> },
    { name: "Daily Rituals", icon: <Sunrise /> },
    { name: "Responsibilities", icon: <Eye /> },
    { name: "Special Missions", icon: <Scroll /> },
    { name: "Grand Expeditions", icon: <Mountain /> },
  ];

  // 3. JSX return at the end.
  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <User className="w-6 h-6 text-cyan-400" />
          {/* Display the user's name if they are logged in */}
          <SidebarGroupLabel className="text-lg font-semibold text-cyan-400">
            {user ? user.displayName : "Scribe"}
          </SidebarGroupLabel>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col flex-grow">
        <Sidebar>
          <SidebarMenu>
            {/* We now map over the mainNavItems array to create the buttons dynamically */}
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
        </Sidebar>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuButton onClick={handleSignOut} icon={<LogOut />}>
          Logout
        </SidebarMenuButton>
      </SidebarFooter>
    </>
  );
}
