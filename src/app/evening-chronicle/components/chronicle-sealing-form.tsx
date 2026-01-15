"use client";

import { History, Scroll, Star, Moon, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CyberAnkh } from "@/components/icons/cyber-ankh";
import Image from "next/image";
import { useState } from "react";
import { FirstPylonIcon } from "@/components/icons/FirstPylonIcon";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";

interface Task {
    id: string;
    title: string;
    category?: string;
    isRitual?: boolean;
    completed: boolean;
}

interface SealingFormProps {
    completedTasks: Task[];
 formState: {
        winsNote: string;       // 🏺 Changed from 'wins'
        shadowWorkNote: string; // 🏺 Changed from 'shadowWork'
        tomorrowQuest: string;
    };
    setFormState: (data: any) => void;
    onSeal: (e: React.FormEvent) => Promise<void>;
    isSubmitting: boolean;
    onBack: () => void;
    onMainHall: () => void;
    displayStreak: number;
}

export function ChronicleSealingForm({
    completedTasks,
    formState,
    setFormState,
    onSeal,
    isSubmitting,
    onBack,
    onMainHall,
    displayStreak,
}: SealingFormProps) {
    // 🏺 State to handle the local Hydraulic Sink animation
    const [isSealing, setIsSealing] = useState(false);
  const { setOpenMobile } = useSidebar();
      const router = useRouter();
    const handleLocalSeal = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSealing(true);
        // The "Thoth Sync": Trigger the actual DB function passed from page.tsx
        await onSeal(e);
    };
const handleReturn = () => {
    setOpenMobile(false);
    router.push("/");
  };
    return (
        <div className="w-full min-h-screen bg-slate-950 text-slate-200 font-sans animate-in fade-in duration-500 overflow-y-auto custom-scrollbar pb-32">
            
            {/* NAVIGATION GATES STAY THE SAME */}
            <div className="w-full max-w-4xl mx-auto flex justify-between items-start mb-8 px-4 pt-8">
                <button type="button" onClick={onBack} className="flex items-center gap-3 p-2 px-4 border-2 border-lime-500 rounded-xl bg-lime-500/10 text-lime-500 font-headline font-bold text-xs tracking-[0.2em]"><History size={16} /> BACK</button>
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
        </button>            </div>

            <form onSubmit={handleLocalSeal} className="max-w-xl mx-auto px-4">

                {/* THE GOLDEN MA'AT RECORD SECTION REMAINS AS WE DESIGNED IT */}
                <div className="mb-10 group">
                    <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.4em] mb-2">Ma&apos;at (Order & Truth)</h3>
                    <div className="h-[2px] w-full bg-gradient-to-r from-white via-amber-400 to-transparent shadow-[0_0_15px_rgba(251,191,36,0.4)]" />
                    <div className="mt-4 bg-black/20 rounded-xl border border-amber-500/10 p-4 max-h-48 overflow-y-auto space-y-3 custom-scrollbar">
                        {completedTasks.map(t => (
                            <div key={t.id} className="flex items-center gap-3 text-amber-100/80 text-sm border-b border-amber-500/5 pb-2 font-headline uppercase">
                                <CyberAnkh className="w-4 h-4 text-amber-500/70" />
                                <span>{t.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* THE CARDS REMAIN THE SAME */}
                <div className="space-y-6">
                 <Card className="bg-black/40 border-cyan-500/20 shadow-xl backdrop-blur-sm">
                        <CardHeader className="py-4 px-6">
                            <CardTitle className="text-cyan-400 font-headline tracking-widest flex items-center gap-3 text-base">
                                <Star className="w-5 h-5" /> ACHIEVEMENTS & GRATITUDE
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            <Textarea
    value={formState.winsNote} // 🏺 Updated Key
    onChange={(e) => setFormState({ ...formState, winsNote: e.target.value })}
    placeholder="... what did you learn? who did you help?"
    className="..."
/>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/40 border-indigo-500/20 shadow-xl backdrop-blur-sm">
                        <CardHeader className="py-4 px-6">
                            <CardTitle className="text-indigo-400 font-headline tracking-widest flex items-center gap-3 text-base">
                                <Moon className="w-5 h-5" /> REFLECTIONS & INTENTIONS
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                           <Textarea
    value={formState.shadowWorkNote} // 🏺 Updated Key
    onChange={(e) => setFormState({ ...formState, shadowWorkNote: e.target.value })}
    placeholder="... focus on what you will do. Take Action."
    className="..."
/>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/40 border-amber-500/20 shadow-xl backdrop-blur-sm">
                        <CardHeader className="py-4 px-6">
                            <CardTitle className="text-amber-500 font-headline tracking-widest flex items-center gap-3 text-base">
                                <div className="w-5 h-5 rounded-full border-2 border-amber-500/50" /> TOMORROW'S MAIN QUEST
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            <Input
                                value={formState.tomorrowQuest}
                                onChange={(e) => setFormState({ ...formState, tomorrowQuest: e.target.value })}
                                placeholder="... speak one thing into existence."
                                className="bg-black/60 border-slate-800 text-cyan-100 placeholder:text-cyan-900 font-headline tracking-wide h-12 text-base focus:border-amber-500/40"
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* 🏺 THE THOTH CHIP: REBORN & HYDRAULIC */}
                <div className="mt-16 flex flex-col items-center">
                    <Button
                        type="submit"
                        disabled={isSubmitting || isSealing}
                        className={`
                            w-full h-auto py-12 rounded-2xl font-headline uppercase tracking-[0.25em] 
                            transition-all duration-[2500ms] ease-in-out border-4
                            flex flex-col items-center justify-center gap-8 shadow-2xl group
                            ${isSealing || isSubmitting
                                ? "translate-y-[12px] border-white bg-transparent shadow-[0_0_50px_rgba(255,255,255,0.2)]" 
                                : "bg-black border-cyan-500/30 text-cyan-400 hover:border-cyan-400 hover:bg-slate-950"}
                        `}
                    >
                        <span className={`
                            text-xl md:text-4xl transition-all duration-500 text-center
                            ${isSealing || isSubmitting 
                                ? "text-white drop-shadow-[0_0_20px_rgba(255,255,255,1)] scale-110 font-black" 
                                : "drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"}
                        `}>
                            {isSealing || isSubmitting ? "Chronicle Sealed" : "SEAL THE CHRONICLE"}
                        </span>

                        <div className={`
                            relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 transition-all duration-[2000ms]
                            ${isSealing || isSubmitting ? 'scale-75 opacity-50 blur-[2px]' : 'group-hover:scale-110 animate-pulse'}
                        `}>
                            <Image
                                src="/icons/thoth-icon.svg"
                                alt="Thoth Chip"
                                fill
                                className={`
                                    object-contain transition-all duration-1000
                                    ${isSealing || isSubmitting 
                                        ? "brightness-[200%] drop-shadow-[0_0_30px_rgba(255,255,255,1)]" 
                                        : "drop-shadow-[0_0_25px_rgba(34,211,238,0.6)]"}
                                `}
                            />
                        </div>
                    </Button>
                </div>
            </form>
        </div>
    );
}