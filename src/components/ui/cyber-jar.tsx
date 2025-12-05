import { cn } from "@/lib/utils";

interface CyberJarProps {
  className?: string;
}

export function CyberJar({ className }: CyberJarProps) {
  return (
    // 👇 CHANGED: 'group' -> 'group/jar' (This isolates the hover logic)
    <div className={cn("group/jar relative flex items-center justify-center", className)}>
      
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full opacity-0 group-hover/jar:opacity-100 transition-opacity duration-500" />
      
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        // 👇 CHANGED: 'group-hover' -> 'group-hover/jar'
        className="relative z-10 w-full h-full transition-transform duration-300 group-hover/jar:scale-110 group-hover/jar:rotate-3"
      >
        {/* Jar Body */}
        <path d="M19 10c0 5-2 9-7 9s-7-4-7-9" className="text-slate-400 group-hover/jar:text-red-400 transition-colors" />
        <path d="M5 10v-2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" className="text-slate-400 group-hover/jar:text-red-400 transition-colors" />
        
        {/* Lid Animation */}
        <path 
            d="M12 2v4M8 6h8" 
            className="text-cyan-500 group-hover/jar:text-red-300 transition-all duration-300 group-hover/jar:-translate-y-1" 
        />
        
        {/* Circuitry */}
        <path d="M9 14h6" className="opacity-50 group-hover/jar:opacity-100 group-hover/jar:text-red-200" />
        <path d="M10 17h4" className="opacity-30 group-hover/jar:opacity-80 group-hover/jar:text-red-200" />
        
        {/* Particles */}
        <circle cx="17" cy="5" r="0.5" className="fill-cyan-400 animate-pulse" />
        <circle cx="18" cy="8" r="0.5" className="fill-cyan-400 animate-pulse delay-75" />
      </svg>
    </div>
  );
}