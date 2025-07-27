import { cn } from "@/lib/utils";
import React from "react";

export function ScarabBeetleIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
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
        <path d="M12 10V20" />
        <path d="M12 10C8.5 10 6 12 6 15H18C18 12 15.5 10 12 10Z" />
        <path d="M6 15V18" />
        <path d="M18 15V18" />
        <path d="M6 9L4 7" />
        <path d="M18 9L20 7" />
        <path d="M7 12L3 12" />
        <path d="M17 12L21 12" />
        <path d="M9 5a3 3 0 0 1 6 0" />
    </svg>
  );
}
