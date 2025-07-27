import { cn } from "@/lib/utils";
import React from "react";

export function EyeOfHorusIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-6 w-6", className)}
      {...props}
    >
      <path d="M2.5 12.5C2.5 12.5 5 16.5 12 16.5C19 16.5 21.5 12.5 21.5 12.5C21.5 12.5 19 8.5 12 8.5C5 8.5 2.5 12.5 2.5 12.5Z" />
      <circle cx="12" cy="12.5" r="2" />
      <path d="M12 16.5L13 21.5" />
      <path d="M16 14.5C16 14.5 17.5 18 20.5 19.5" />
      <path d="M20 7L21.5 4.5" />
    </svg>
  );
}
