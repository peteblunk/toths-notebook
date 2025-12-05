import { cn } from "@/lib/utils";

interface CyberJarProps {
  className?: string;
}

export function CyberJar({ className }: CyberJarProps) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={cn("overflow-visible", className)}
    >
      {/* Glow Effect (Pulsing Red) */}
      <circle cx="12" cy="12" r="10" className="fill-red-500/20 animate-pulse blur-xl" />

      {/* Jar Body (Solid, Bright Red-Grey) */}
      <path d="M19 10c0 5-2 9-7 9s-7-4-7-9" className="text-red-400 transition-colors" />
      <path d="M5 10v-2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" className="text-red-400 transition-colors" />
      
      {/* Lid (LOWERED: Changed -translate-y-2 to -translate-y-1) */}
      <g className="-translate-y-1 rotate-3 origin-center">
         <path d="M12 2v4M8 6h8" className="text-red-300 drop-shadow-[0_0_8px_rgba(252,165,165,0.6)]" />
      </g>
      
      {/* Circuitry (Fully Visible) */}
      <path d="M9 14h6" className="text-red-200" />
      <path d="M10 17h4" className="text-red-200" />
    </svg>
  );
}