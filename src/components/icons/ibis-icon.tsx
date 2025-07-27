import { cn } from "@/lib/utils";
import React from "react";

export function IbisIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
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
      <path d="M8 21c-1.278-2.396-1.03-5.26 1-7 1.583-1.36 3.68-2 6-2h2" />
      <path d="M12 21c-1.278-2.396-1.03-5.26 1-7 1.583-1.36 3.68-2 6-2h2" />
      <path d="M14 3c-1.923 1.923-2.308 4.79-1 7 1.583 2.56 4.38 4 8 4" />
      <path d="M18 7c-4.522.61-7.147 2.85-8 6" />
      <path d="M5 21c-1-2-1-4 0-6" />
    </svg>
  );
}
