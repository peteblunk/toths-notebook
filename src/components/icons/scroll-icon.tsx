import { cn } from "@/lib/utils";
import React from "react";

export function ScrollIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
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
      <path d="M4 22V2h10l6 6v14H4z" />
      <path d="M14 2v6h6" />
      <path d="M8 14h4" />
      <path d="M8 18h8" />
    </svg>
  );
}
