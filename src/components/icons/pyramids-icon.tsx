import { cn } from "@/lib/utils";
import React from "react";

export function PyramidsIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
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
      <path d="M2 22L12 4L22 22Z" />
      <path d="M9.5 15.5L16.5 22" />
      <path d="M17 10L22 22" />
    </svg>
  );
}
