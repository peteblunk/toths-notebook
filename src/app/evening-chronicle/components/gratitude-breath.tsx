"use client";

import { Wind, History, Scroll } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation"
import { useSidebar } from "@/components/ui/sidebar";
import { FirstPylonIcon } from "@/components/icons/FirstPylonIcon";

interface GratitudeProps {
  onNext: () => void;
  onBack: () => void;
  onMainHall: () => void;
}

export function GratitudeBreath({ onNext, onBack, onMainHall }: GratitudeProps) {
  // 🏺 State to handle the "Hydraulic Flash"
  const [isInitiated, setIsInitiated] = useState(false);
  const { setOpenMobile } = useSidebar();
      const router = useRouter();
  const handleInitiate = () => {
    setIsInitiated(true);
    // 🌬️ A slightly faster transition here to keep the "Spiritual Flow"
    setTimeout(() => {
      onNext();
    }, 2000); 
  };
const handleReturn = () => {
    setOpenMobile(false);
    router.push("/");
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-1000 border-4 border-cyan-500/10 m-2 rounded-3xl">
      <div className="w-full flex justify-between items-start mb-8 px-2">
        <button onClick={onBack} className="flex items-center gap-3 p-2 px-4 border-2 border-lime-500 rounded-xl bg-lime-500/10 text-lime-500 font-headline font-bold text-xs tracking-[0.2em] hover:bg-lime-500/20 transition-all">
          <History size={16} /> BACK
        </button>
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
      </div>

      <div className="mb-8 animate-pulse">
        <Wind className="w-16 h-16 text-cyan-400" />
      </div>

      <h2 className="text-2xl md:text-4xl font-headline font-bold text-cyan-400 tracking-widest uppercase mb-10 max-w-md leading-tight">
        You churned chaos into order.
      </h2>

      <Card className="bg-slate-900/40 border border-cyan-500/30 max-w-md mb-12 backdrop-blur-sm">
        <CardContent className="p-6">
          <p className="text-lg md:text-xl text-cyan-100/90 font-headline tracking-wide leading-relaxed">
            Take 8 breaths <br/> STRETCH <br/>Celebrate and give thanks in a way that honors yourself and those that assisted you. PRAY
          </p>
        </CardContent>
      </Card>

      {/* 🏺 THE ETHEREAL CHASSIS BUTTON */}
      <Button 
        onClick={handleInitiate} 
        disabled={isInitiated}
        className={`
          w-full max-w-md py-10 rounded-2xl font-headline uppercase tracking-[0.2em] 
          transition-all duration-[2000ms] ease-in-out border-4
          select-none [−webkit-tap-highlight-color:transparent]
          ${isInitiated 
            ? "translate-y-[8px] border-cyan-100 shadow-[0_0_40px_rgba(255,0,0,0.4)] bg-transparent" 
            : "bg-slate-950/50 text-cyan-400 border-cyan-500/80 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:border-cyan-400 hover:bg-cyan-950/30"}
          flex flex-col items-center justify-center gap-2 leading-tight whitespace-normal
        `}
      >
        {isInitiated ? (
          <div className="flex flex-col items-center animate-pulse">
            {/* 💎 THE WHITE FLASH POP */}
            <span className="text-2xl md:text-3xl font-black tracking-[0.2em] text-white drop-shadow-[0_0_25px_rgba(255,255,255,1)] uppercase">
              Offering Sent
            </span>
            
          </div>
        ) : (
          <span className="text-xl md:text-2xl font-bold">I have given thanks</span>
        )}
      </Button>
    </div>
  );
}