import { cn } from "@/lib/utils";
import React from "react";

export function AnkhIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-6 w-6", className)}
      {...props}
    >
      <path d="M12 22V9" />
      <path d="M4 13H20" />
      <circle cx="12" cy="5" r="4" />
    </svg>
  );
}
