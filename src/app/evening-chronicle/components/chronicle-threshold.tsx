"use client";

import { History } from "lucide-react";
import { KhepriIconMotion } from "@/components/khepri-animation";
import { useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation"
import { FirstPylonIcon } from "@/components/icons/FirstPylonIcon";
import { i } from "node_modules/genkit/lib/index-5yfMIzsW";
interface ChronicleThresholdProps {
  onNext: () => void;
  onMainHall: () => void;
}
export function ChronicleThreshold({ onNext, onMainHall }: ChronicleThresholdProps) {
  const [isScarabGold, setIsScarabGold] = useState(false);
   const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const handleScarabClick = () => {
    setIsScarabGold(true);
    setTimeout(() => onNext(), 2000);
  };
  const handleReturn = () => {
    setOpenMobile(false);
    router.push("/");
  };
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-between p-6 text-center animate-in fade-in duration-1000">
  <button
    onClick={handleReturn}
    className="flex flex-col items-center justify-center p-0.1 rounded-2xl border-2 border-cyan-400 bg-cyan-950/40 active:scale-95 transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)] min-w-[110px]"
  >
    {/* The Pylon: Expanded to the very edge of the stone */}
    <FirstPylonIcon 
      size={80} 
      className="text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]" 
    />
  
    {/* The Text: Tightly integrated foundation */}
    <span className="font-headline font-bold text-[8px] tracking-[0.em] uppercase text-cyan-300 mt-[-4px] mb-1">
      To Main Hall
    </span>
  </button>

      <div className="pt-20 max-w-xs space-y-4">
        <h2 className="text-cyan-400/80 text-[24px] tracking-[0.4em] uppercase font-bold font-headline">The Evening Chronicle</h2>
      </div>

      <div className="flex flex-col gap-0 text-[hsl(280,100%,60%)] text-xl font-body">
        <span>Review your Ma&apos;at.</span>
        <span>Reflect on your actions.</span>
        <span>Imagine tomorrow.</span>
        <span>Seal the record.</span>
      </div>

      <div className="relative w-72 h-72 flex flex-col items-center justify-center cursor-pointer group" onClick={handleScarabClick}>
        <KhepriIconMotion className="w-full h-full" forceGold={isScarabGold} />
        {!isScarabGold && (
          <div className="absolute bottom-0 animate-pulse">
            <p className="text-cyan-400 text-[16px] font-bold font-headline uppercase tracking-[0.6em]">Initiate Khepri Protocol</p>
          </div>
        )}
      </div>
    </div>
  );
}