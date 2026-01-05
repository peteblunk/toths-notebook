import Image from "next/image";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VisualDiscoveryGuide } from "./visual-discovery-guide"; // 🏺 CALLING THE SUB-SHED

interface ThothChipAltarProps {
  isInstalled: boolean;
  canInstall: boolean;
  installChip: () => Promise<void>;
}

export function ThothChipAltar({ isInstalled, canInstall, installChip }: ThothChipAltarProps) {
  return (
    <section className="p-6 border border-cyan-500/20 bg-slate-950/40 rounded-[2rem] backdrop-blur-md flex flex-col items-center text-center gap-6">
      {/* 🏛️ HEADER & CHIP IMAGE */}
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 group">
        <div className="absolute -inset-4 bg-cyan-500/10 rounded-full blur-xl animate-pulse" />
        <Image src="/icons/thoth-icon.svg" alt="Thoth Chip" fill className="object-contain" />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-headline text-cyan-400 uppercase tracking-widest">Thoth Chip</h2>
        <p className="text-[11px] text-slate-500 font-mono uppercase">
          {isInstalled ? "CONNECTED TO TEMPLE." : "CONNECTION WEAK."}
        </p>
      </div>

      {/* 🔮 AUTOMATED INVOKE BUTTON */}
      {canInstall && !isInstalled && (
        <Button onClick={installChip} className="w-full h-auto py-6 ...">
          <span className="text-sm font-headline tracking-[0.2em]">INVOKE INSTALLATION</span>
          <Download className="w-4 h-4 opacity-50" />
        </Button>
      )}

      {/* 🧭 CODY'S MANUAL MAP */}
      {!isInstalled && <VisualDiscoveryGuide />} 
    </section>
  );
}