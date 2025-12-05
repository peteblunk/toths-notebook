import { cn } from "@/lib/utils";

interface CyberStylusProps {
  className?: string;
}

export function CyberStylus({ className }: CyberStylusProps) {
  return (
    <svg 
      // Matched to your Inkscape A4 Canvas
      viewBox="0 0 210 297" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={cn("overflow-visible", className)}
    >
      <path 
        d="m 116.93196,139.12921 -7.79821,0.25606 m 2.64527,-25.22797 -11.891381,13.4769 0.349611,14.01242 m 34.92817,-19.16535 -9.59992,-0.29703 m 29.02251,-24.278499 -5.2148,10.609889 -10.1877,-0.75772 m -1.64182,-17.779758 -7.53121,9.116727 1.19997,9.810041 m 34.07781,-35.971088 -33.29588,9.513109 -10.70225,9.909487 -2.37827,19.422592 -6.73845,-11.495 -26.161055,28.53933 -8.464931,37.03658 5.355954,0.62653 33.233822,-11.89845 17.83708,-16.25156 -13.47691,-5.94569 19.81898,-1.58552 11.89139,-13.08052 -11.09863,-2.77466 19.81898,-3.9638 z m -0.51583,1.006898 -3.19282,3.36282 -103.537701,109.04047 -3.192821,3.36282 -13.173408,16.2232 10.799571,-7.28281 3.192821,-3.36282 103.538978,-109.042742 3.19282,-3.362819 z m -4.37892,7.831522 C 125.88274,118.11966 91.369977,154.46707 56.857204,190.81449"
        
        // PERMANENT CYBER STYLING:
        // 1. Fill: Cyan Tint (Always visible)
        // 2. Stroke: Neon Cyan (Always bright)
        // 3. Shadow: Permanent Glow
        className="fill-cyan-900/30 stroke-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
      />
    </svg>
  );
}