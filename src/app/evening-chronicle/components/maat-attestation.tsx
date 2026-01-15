"use client";

import { History, Scroll } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CyberAnkh } from "@/components/icons/cyber-ankh"; // Our bespoke component
import { useState } from "react";
import { useRouter } from "next/navigation"
import { FirstPylonIcon } from "@/components/icons/FirstPylonIcon";
import { useSidebar } from "@/components/ui/sidebar";

// 🏺 THE SACRED BLUEPRINT (Define the Task structure)
interface Task {
  id: string;
  title: string;
  category?: string;
  isRitual?: boolean;
  completed: boolean;
  dueDate?: string; // 🏺 New field for task due date
}

// 🏛️ THE PROP INTERFACE (Define what the component receives)
interface MaatAttestationProps {
  allTasks: Task[]; // 🏺 Receive the full scroll
  onNext: () => void;
  onBack: () => void;
  onMainHall: () => void;
}


export function MaatAttestation({
  allTasks,
  onNext,
  onBack,
  onMainHall
}: MaatAttestationProps) {

  // 🏺 THE INTERNAL SCRYING (Filtering Logic)
  // 🏺 THE SCRIBE'S CLOCK
  const getScribeDate = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // If it's between midnight and 02:30 AM, we are still "Yesterday"
    if (hours < 2 || (hours === 2 && minutes < 30)) {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }
    return now.toISOString().split('T')[0];
  };

  const scribeDate = getScribeDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const completedTasks = allTasks.filter(t => t.completed);
  const [isInitiated, setIsInitiated] = useState(false);
    const { setOpenMobile } = useSidebar();
      const router = useRouter();

  const handleInitiate = () => {
    // 1. Trigger the CSS transition (isInitiated becomes true)
    setIsInitiated(true);

    // 2. THE HOLDING PATTERN
    // This must be EQUAL TO or LONGER than your duration-[Xms]
    setTimeout(() => {
      onNext();
    }, 3500); // 🏺 If your CSS is 3000ms, set this to 3500ms
  };

  const incompleteRituals = allTasks.filter(t =>
    !t.completed && (
      t.category === "Daily Ritual" ||
      t.isRitual ||
      (t.dueDate && t.dueDate <= scribeDate) // 🏺 Anything due today or in the past
    )
  );
const handleReturn = () => {
    setOpenMobile(false);
    router.push("/");
  };
  return (
    <div className="fixed inset-0 w-full h-screen bg-black overflow-y-auto custom-scrollbar flex flex-col items-center p-6 pt-24 text-center animate-in slide-in-from-right duration-500">

      {/* 🏛️ NAVIGATION GATES */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-between p-6 bg-black/80 backdrop-blur-md max-w-4xl mx-auto w-full">
        <button onClick={onBack} className="flex items-center gap-3 p-2 px-4 border-2 border-lime-500 rounded-xl bg-lime-500/10 text-lime-500 font-headline font-bold text-xs tracking-[0.2em]">
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
{/* 🏺 THE CONTENT CHAMBER: Starts below the Pylon */}
  <div className="w-full max-w-md mt-36 flex flex-col items-center">
      <h2 className="text-3xl md:text-5xl font-headline font-bold text-amber-400 tracking-widest uppercase mb-8 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
        Ma&apos;at Created
      </h2>

      {/* THE GOLDEN LIST */}
      <div className="w-full max-w-md space-y-3 mb-12">
        {completedTasks.length > 0 ? (
          completedTasks.map((task, index) => (
            <div key={task.id} className="bg-amber-950/40 border border-amber-500/90 p-2 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom shadow-[0_0_10px_rgba(245,158,11,0.1)]" style={{ animationDelay: `${index * 100}ms` }}>

              <CyberAnkh className="w-8 h-8 animate-pulse" />
              <span className="text-md font-headline text-amber-100 tracking-wide text-center">{task.title}</span>
            </div>
          ))
        ) : (
          <div className="text-center text-amber-500/50 italic p-6 border border-amber-900/30 rounded-lg">No deeds recorded today.</div>
        )}
      </div>
</div>
      {/* RETAINED NUN */}
      {incompleteRituals.length > 0 && (
        <div className="w-full max-w-md mb-12">
          <h3 className="text-3xl font-headline text-cyan-400 tracking-widest uppercase mb-2 ">left UNDONE</h3>
          <h3 className="text-xl font-headline text-cyan-400 tracking-widest uppercase mb-2 ">Daily Rituals And<br /> Tasks Due Today </h3>
          <div className="space-y-3">
            {incompleteRituals.map((task) => (
              <div
                key={task.id}
                className="bg-slate-900/40 border border-cyan-500/90 p-3 rounded-xl flex items-center justify-start opacity-80 hover:opacity-100 transition-opacity duration-300"
              >
                <span className="text-sm md:text-md font-headline text-cyan-200 text-left tracking-wide leading-snug">
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="w-full max-w-xl pb-20 px-4 mt-auto">
        <Button
          onClick={handleInitiate}
          disabled={isInitiated}
          className={`
    w-full h-auto py-8 md:py-10 rounded-2xl font-headline uppercase tracking-[0.2em] 
    transition-all duration-[3500ms] ease-in-out
    
    /* 🏺 THE TOUCH PURGE */
    select-none active:outline-none focus:outline-none
    [−webkit-tap-highlight-color:transparent]
    [−webkit-touch-callout:none]

    ${isInitiated
              ? "translate-y-[4px]  border-2 border-red-400 shadow-none text-red-200 !bg-transparent"
              : "text-cyan-100 !bg-slate-950 border-2 border-cyan-500/50 border-b-[8px] border-r-[4px] border-cyan-900 shadow-[0_12px_20px_rgba(0,0,0,1)] hover:border-cyan-400 hover:!bg-slate-950 active:!bg-slate-950"}
    
    flex flex-col items-center justify-center gap-2 leading-tight whitespace-normal
  `}
        >
          {isInitiated ? (
            <div className="flex flex-col items-center animate-pulse duration-[3000ms]">
              {/* 🏺 THE PLASMA CORE: Light text + Heavy Red Glow */}
              <span className="text-xl md:text-2xl uppercase">
                Temple Upload In Progress
              </span>

              {/* 📜 THE SUB-TEXT: Brighter Orange-Red for clarity */}
              <span className="text-rose-500  mt-3">
                ENSCRIBING DATA <br /> GLYPHS IN TRANSIT
              </span>
            </div>
          ) : (
            <>
              <span className="glow-cyan text-lg md:text-xl font-bold">I Humbly Offer These Deeds</span>
              <span className="glow-cyan text-xs md:text-xl font-bold">
                AND ACKNOWLEDGE THE UNDONE
              </span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
