"use client";

import { History } from "lucide-react";
import { KhepriIconMotion } from "@/components/khepri-animation";
import { useState } from "react";
interface ChronicleThresholdProps {
  onNext: () => void;
  onMainHall: () => void;
}
export function ChronicleThreshold({ onNext, onMainHall }: ChronicleThresholdProps) {
  const [isScarabGold, setIsScarabGold] = useState(false);

  const handleScarabClick = () => {
    setIsScarabGold(true);
    setTimeout(() => onNext(), 2000);
  };

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-between p-6 text-center animate-in fade-in duration-1000">
      <button onClick={onMainHall} className="absolute top-8 left-8 flex items-center gap-3 text-zinc-100 hover:text-red-500 transition-colors group">
        <div className="p-2 border border-zinc-400 rounded-lg group-hover:border-red-500/50">
          <History size={15} />
        </div>
        <span className="text-xs uppercase tracking-[0.2em] font-headline font-bold">Return to Main Hall</span>
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