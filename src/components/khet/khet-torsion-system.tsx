"use client";

import { BookOpen, Info, CheckCircle2, Circle, Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

interface TimerConfig {
  totalDuration: number;
  numSets?: number;
  setDuration?: number;
  setRestDuration?: number;
}

const TIMER_CONFIGS: Record<string, TimerConfig> = {
  "System Boot-up: Bottom Breathing": { totalDuration: 300 },
  "The Expansion Valve (Reverse Kegels)": { totalDuration: 330, numSets: 3, setDuration: 70, setRestDuration: 60 },
  "The Elevator (Staged Squeezes)": { totalDuration: 735, numSets: 3, setDuration: 205, setRestDuration: 60 },
  "Internal Feedback (Dilation/Load Training)": { totalDuration: 220, numSets: 5, setDuration: 20, setRestDuration: 30 },
  "The Flutter (Neuromuscular Staccato)": { totalDuration: 300, numSets: 3, setDuration: 60, setRestDuration: 60 },
};

function StopwatchTimer({ exerciseName, onComplete }: { exerciseName?: string; onComplete?: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const config = exerciseName ? TIMER_CONFIGS[exerciseName] : null;
  const totalDuration = config?.totalDuration ?? null;

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsed((p) => {
        const next = p + 1;
        if (totalDuration !== null && next >= totalDuration) return totalDuration;
        return next;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, totalDuration]);

  useEffect(() => {
    if (totalDuration !== null && elapsed >= totalDuration && !finished) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
      setFinished(true);
      onCompleteRef.current?.();
    }
  }, [elapsed, totalDuration, finished]);

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setElapsed(0);
    setFinished(false);
  };

  const getSetInfo = () => {
    if (!config?.numSets || !config.setDuration) return null;
    const cycleDuration = config.setDuration + (config.setRestDuration ?? 0);
    const currentSet = Math.min(Math.floor(elapsed / cycleDuration) + 1, config.numSets);
    const withinCycle = elapsed % cycleDuration;
    const isSetRest = (config.setRestDuration ?? 0) > 0 && withinCycle >= config.setDuration;
    return { current: currentSet, total: config.numSets, isSetRest };
  };

  const minutes = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const remaining = totalDuration !== null ? totalDuration - elapsed : null;
  const remMin = remaining !== null ? Math.floor(remaining / 60) : null;
  const remSec = remaining !== null ? remaining % 60 : null;
  const progress = totalDuration !== null ? (elapsed / totalDuration) * 100 : null;
  const setInfo = getSetInfo();

  const getCue = (exName: string, tTotal: number) => {
    if (exName.includes("The Elevator")) {
      const withinCycle = tTotal % 265; // 205s work (5 reps × 41s) + 60s set rest
      if (withinCycle >= 205) {
        return { phase: "SET REST", isResting: true, restTimeLeft: 265 - withinCycle };
      }
      const t = withinCycle % 41; // 11s rep + 30s dead air
      if (t === 0) return { phase: "Ascent", level: "Level 1", isResting: false };
      if (t === 1) return { phase: "Ascent", level: "Level 2", isResting: false };
      if (t === 2) return { phase: "Ascent", level: "Level 3", isResting: false };
      if (t === 3) return { phase: "Ascent", level: "Level 4", isResting: false };
      if (t < 6) return { phase: "Peak", level: "Level 4 Lockdown", isResting: false };
      if (t === 6) return { phase: "Descent", level: "Level 3", isResting: false };
      if (t === 7) return { phase: "Descent", level: "Level 2", isResting: false };
      if (t === 8) return { phase: "Descent", level: "Level 1", isResting: false };
      if (t < 11) return { phase: "Reset", level: "Level 0 · Clear", isResting: false };
      return { phase: "Dead Air", isResting: true, restTimeLeft: 41 - t };
    }
    
    if (exName.includes("Expansion Valve")) {
      const withinCycle = tTotal % 130; // 70s work (10 reps × 7s) + 60s set rest
      if (withinCycle >= 70) {
        return { phase: "SET REST", isResting: true, restTimeLeft: 130 - withinCycle };
      }
      const repNum = Math.floor(withinCycle / 7) + 1;
      const withinRep = withinCycle % 7;
      if (withinRep < 5) {
        return { phase: "Push", level: `Rep ${repNum}/10 · 20% Effort`, isResting: false };
      } else {
        return { phase: "Reset", isResting: true, restTimeLeft: 7 - withinRep };
      }
    }
    
    if (exName.includes("Bottom Breathing")) {
      const t = tTotal % 12;
      if (t < 4) {
        return { phase: "Inhale", level: "Diaphragm", isResting: false };
      } else if (t < 6) {
        return { phase: "Peak", level: "Push (Expansion Valve)", isResting: false };
      } else {
        return { phase: "Exhale", level: "Pursed Lips", isResting: false };
      }
    }

    if (exName.includes("Internal Feedback")) {
      const t = tTotal % 50;
      if (t < 10) {
        return { phase: "The Grip", level: "Pull Upward", isResting: false };
      } else if (t < 20) {
        return { phase: "The Expel", level: "Push Out", isResting: false };
      } else {
        return { phase: "RESTING", isResting: true, restTimeLeft: 50 - t };
      }
    }

    if (exName.includes("The Flutter")) {
      const t = tTotal % 120; // 60s round + 60s inter-round rest
      if (t < 20) {
        return { phase: "The Burst", level: "Level 1 Flickers", isResting: false };
      } else if (t < 50) {
        return { phase: "The Flush", level: "Sustained Push", isResting: false };
      } else if (t < 60) {
        return { phase: "Dead Air", level: "Rest & Breathe", isResting: false };
      } else {
        return { phase: "RESTING", isResting: true, restTimeLeft: 120 - t };
      }
    }

    return null;
  };

  const cue = exerciseName && !finished ? getCue(exerciseName, elapsed) : null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {progress !== null && (
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-1000", finished ? "bg-violet-500" : "bg-amber-500")}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
      <div className="rounded-lg border border-violet-800/40 bg-violet-950/40 p-2.5 flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-2">
          <Timer className={cn("w-4 h-4", finished ? "text-violet-400" : running ? "text-amber-400" : "text-violet-400")} />
          <span className={cn(
            'font-headline tabular-nums tracking-widest text-base transition-colors',
            running ? 'text-amber-300' : finished ? 'text-violet-300' : 'text-zinc-300'
          )}>
            {minutes > 0 ? `${minutes}:${String(secs).padStart(2, '0')}` : `${secs}s`}
          </span>
          {remaining !== null && !finished && (
            <span className="text-xs text-zinc-500 tabular-nums">
              {remMin! > 0 ? `(${remMin}:${String(remSec!).padStart(2, '0')} left)` : `(${remSec}s left)`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {setInfo && (
            <div className="flex items-center gap-1.5 mr-1">
              {Array.from({ length: setInfo.total }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    i < setInfo.current - 1 ? "bg-violet-500" :
                    i === setInfo.current - 1 ? (setInfo.isSetRest ? "bg-zinc-500" : "bg-amber-400") :
                    "bg-zinc-700"
                  )}
                />
              ))}
              <span className="text-xs text-zinc-400 font-headline uppercase tracking-wider">
                {setInfo.isSetRest ? "rest" : `${setInfo.current}/${setInfo.total}`}
              </span>
            </div>
          )}
          {finished ? (
            <div className="flex items-center gap-1 text-violet-300 font-headline uppercase tracking-wider text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Done</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => setRunning((v) => !v)}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all border shadow-sm',
                  running
                    ? 'border-amber-500/60 bg-amber-900/40 text-amber-300 hover:bg-amber-900/60'
                    : 'border-violet-500/60 bg-violet-900/40 text-violet-300 hover:bg-violet-900/60',
                )}
              >
                {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 pl-0.5" />}
              </button>
              <button
                onClick={reset}
                className="w-8 h-8 rounded-full flex items-center justify-center border border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 hover:border-zinc-500 transition-all shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
      
      {cue && (
        <div className={cn(
          "rounded-md p-2.5 text-center font-headline uppercase tracking-wider text-sm transition-all duration-300",
          !running && elapsed === 0 ? "bg-zinc-900/40 text-zinc-400 border border-zinc-800/50" :
          cue.isResting ? "bg-zinc-900/80 text-zinc-300 border border-zinc-700/80 shadow-inner" : 
          "bg-amber-950/40 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(249,115,22,0.1)] scale-[1.02]"
        )}>
          {cue.isResting ? (
            <div className="flex items-center justify-center gap-2">
              <span>{cue.phase}</span>
              <span className="text-zinc-500">|</span>
              <span className="tabular-nums">{cue.restTimeLeft}s</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>{cue.phase}</span>
              {cue.level && (
                <>
                  <span className={cn("transition-colors", !running && elapsed === 0 ? "text-zinc-600" : "text-amber-600/60")}>|</span>
                  <span>{cue.level}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
      {finished && (
        <div className="rounded-md p-2.5 text-center font-headline uppercase tracking-wider text-sm bg-violet-950/40 text-violet-300 border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
          Exercise Complete
        </div>
      )}
    </div>
  );
}

const EXERCISES_DB = {
  "Bottom Breathing": {
    name: "System Boot-up: Bottom Breathing",
    sets: "5m",
    hold: "4s in, 2s push, 6s out",
    action: "Deep diaphragmatic breathing.",
    instruction: "Lie flat, knees bent. Inhale for 4s, ensuring only the lower abdomen rises. Perform a 2s 'Expansion Valve' push at the peak of the inhale. Exhale for 6s through pursed lips.",
    goal: "Override the defensive 'clamping' reflex and maintain oxygenation under load."
  },
  "Expansion Valve": {
    name: "The Expansion Valve (Reverse Kegels)",
    sets: "3 sets x 10",
    hold: "5s hold / 2s reset",
    action: "Active lengthening/relaxation.",
    instruction: "Using 20% effort, visualize pushing the pelvic floor downward and outward (mimicking a bowel movement). Hold for 5 seconds. Do not hold your breath. 2s rest between reps. 60s rest between sets.",
    goal: "Maximum receptivity and immediate 'reset' after heavy lifting or entry."
  },
  "The Elevator": {
    name: "The Elevator (Staged Squeezes)",
    sets: "3 sets x 5 cycles",
    hold: "10s cycle / 30s rest",
    action: "Granular contraction control. TUT: 10s per cycle. Interval: 30s Neutral Rest between reps. Volume: 3 Sets of 5 Cycles (Rest 60s between sets).",
    instruction: "Protocol:\n- The Ascent (3s): 1s at Level 1, 1s at Level 2, 1s at Level 3.\n- The Peak (2s): Hard isometric hold at Level 3.\n- The Descent (3s): 1s at Level 2, 1s at Level 1, 1s at Level 0 (Full release).\n- The Reset (2s): Complete silence/relaxation before starting the next rep.",
    goal: "Granular contraction control."
  },
  "Internal Feedback": {
    name: "Internal Feedback (Dilation/Load Training)",
    sets: "5 Grip/5 Expel",
    hold: "10s grip / 10s expel",
    action: "Resistance training with a silicone trainer.",
    instruction: "The Grip: Squeeze the trainer and try to 'pull' it upward internally for 10s. The Expel: Use an Expansion Valve push to slowly slide the trainer out against light hand resistance. 30s rest between reps. 90s rest between sets.",
    goal: "Resistance training with a silicone trainer."
  },
  "The Flutter": {
    name: "The Flutter (Neuromuscular Staccato)",
    sets: "3 rounds",
    hold: "20s pulse / 30s flush",
    action: "High-frequency pulsing. Cadence: ~2-3 pulses per sec. Interval: 1:1.5 Work-to-Rest ratio. Volume: 3 Rounds (Rest 60s between rounds).",
    instruction: "Protocol:\n- The Burst: 20 seconds of max speed 'flickers' at Level 1.\n- The Flush: 30 seconds of sustained Expansion Valve (Reverse Kegel) push.\n- The Rest: 10 seconds of 'Dead Air' (No engagement, just breathing).",
    goal: "High-frequency pulsing."
  }
};

const TORSION_PROGRAM = [
  {
    day: 'Day 1',
    focus: 'Elevator & Expansion',
    desc: 'Muscle isolation and deep breathing.',
    exercises: [EXERCISES_DB["Bottom Breathing"], EXERCISES_DB["Expansion Valve"], EXERCISES_DB["The Elevator"]]
  },
  {
    day: 'Day 2',
    focus: 'Feedback & Flutter',
    desc: 'Resistance and high-frequency pulsing.',
    exercises: [EXERCISES_DB["Bottom Breathing"], EXERCISES_DB["Internal Feedback"], EXERCISES_DB["The Flutter"]]
  },
  {
    day: 'Day 3',
    focus: 'Elevator & Expansion',
    desc: 'Muscle isolation and deep breathing.',
    exercises: [EXERCISES_DB["Bottom Breathing"], EXERCISES_DB["Expansion Valve"], EXERCISES_DB["The Elevator"]]
  },
  {
    day: 'Day 4',
    focus: 'Feedback & Flutter',
    desc: 'Resistance and high-frequency pulsing.',
    exercises: [EXERCISES_DB["Bottom Breathing"], EXERCISES_DB["Internal Feedback"], EXERCISES_DB["The Flutter"]]
  },
  {
    day: 'Day 5',
    focus: 'Elevator & Expansion',
    desc: 'Muscle isolation and deep breathing.',
    exercises: [EXERCISES_DB["Bottom Breathing"], EXERCISES_DB["Expansion Valve"], EXERCISES_DB["The Elevator"]]
  },
  {
    day: 'Day 6',
    focus: 'Feedback & Flutter',
    desc: 'Resistance and high-frequency pulsing.',
    exercises: [EXERCISES_DB["Bottom Breathing"], EXERCISES_DB["Internal Feedback"], EXERCISES_DB["The Flutter"]]
  },
  {
    day: 'Day 7',
    focus: 'Elevator & Expansion',
    desc: 'Muscle isolation and deep breathing.',
    exercises: [EXERCISES_DB["Bottom Breathing"], EXERCISES_DB["Expansion Valve"], EXERCISES_DB["The Elevator"]]
  }
];

interface TorsionState {
  completedDays: number[];
  completedExercises: { [dayIndex: number]: string[] };
  completedAllAt: number | null;
}

const DEFAULT_STATE: TorsionState = {
  completedDays: [],
  completedExercises: {},
  completedAllAt: null
};

const CALIBRATION_LEVELS = [
  {
    level: 'Level 0',
    title: 'Neutral',
    subtitle: 'The Open Gate',
    state: 'Complete biological silence; maximum receptivity.',
    technical: 'The "Expansion Valve" is slightly engaged (20% outward nudge) to counteract the pelvic floor\'s natural resting tone.',
    prowess: 'This is the required state for initial intake. It ensures the internal canal is at its maximum diameter, allowing for effortless, pain-free entry regardless of the top\'s size.',
  },
  {
    level: 'Level 1',
    title: 'Flicker',
    subtitle: 'The Sensory Ping',
    state: 'Neural activation without tissue displacement.',
    technical: 'You are "thinking" about the muscle. The nerves fire, but there is no visible movement of the sphincter or internal walls.',
    prowess: 'Used to send a subtle "I feel you" signal to the top. It provides sensory feedback without adding restrictive pressure, signaling that the system is online and responsive.',
  },
  {
    level: 'Level 2',
    title: 'Grip',
    subtitle: 'The Sustainable Wrap',
    state: 'Sustainable, circumferential engagement.',
    technical: 'A firm, rhythmic "hug." This level utilizes slow-twitch fibers and can be maintained for the duration of a long session without fatigue.',
    prowess: 'The primary setting for "milking." By maintaining Level 2 during the top\'s withdrawal, you create a constant, pleasurable friction that significantly enhances their sensation.',
  },
  {
    level: 'Level 3',
    title: 'Compression',
    subtitle: 'The Friction Engine',
    state: 'High-torque closure.',
    technical: 'A strong, active squeeze. You will feel the internal walls move inward significantly, creating a tight seal around the top.',
    prowess: 'Used for climax enhancement. Applying Level 3 compression as the top nears their finish provides the intense friction required to push them over the edge.',
  },
  {
    level: 'Level 4',
    title: 'Lockdown',
    subtitle: 'The Structural Brake',
    state: 'Absolute maximum output.',
    technical: 'The system is braced and unyielding. This requires significant effort and is unsustainable for long periods.',
    prowess: 'Total rhythm control. Use Lockdown to momentarily stall the top\'s movement, change the pace of the session, or provide a "wall" of resistance that intensifies the sensation of deep thrusting.',
  },
];

function CalibrationLevels() {
  const [openLevel, setOpenLevel] = useState<string | null>(null);
  return (
    <div className="space-y-2 text-sm">
      <p className="text-xs text-zinc-500 font-headline uppercase tracking-wider text-center pb-1">Click each level for more details</p>
      {CALIBRATION_LEVELS.map(({ level, title, subtitle, state: desc, technical, prowess }) => {
        const isOpen = openLevel === level;
        return (
          <div key={level} className={cn('rounded-lg border transition-colors overflow-hidden', isOpen ? 'border-violet-600/60 bg-violet-950/30' : 'border-zinc-700/60 bg-zinc-900/60')}>
            <button
              onClick={() => setOpenLevel(isOpen ? null : level)}
              className="w-full flex items-start gap-3 p-2.5 text-left"
            >
              <span className="font-headline text-violet-300 text-xs uppercase tracking-wider whitespace-nowrap pt-0.5 flex-shrink-0">{level}</span>
              <div className="flex-1 min-w-0">
                <span className="font-headline text-zinc-100 text-xs uppercase tracking-wider">{title} </span>
                <span className="text-zinc-500 text-xs">· {subtitle}</span>
                <p className="text-zinc-400 mt-0.5">{desc}</p>
              </div>
              <span className={cn('text-violet-500 text-xs flex-shrink-0 mt-0.5 transition-transform duration-200', isOpen ? 'rotate-180' : '')}>▾</span>
            </button>
            {isOpen && (
              <div className="px-3 pb-3 space-y-2 border-t border-violet-800/40 pt-2.5">
                <div>
                  <p className="text-xs font-headline text-violet-400 uppercase tracking-wider mb-0.5">Technical Detail</p>
                  <p className="text-zinc-300 leading-relaxed">{technical}</p>
                </div>
                <div>
                  <p className="text-xs font-headline text-amber-400 uppercase tracking-wider mb-0.5">Prowess Application</p>
                  <p className="text-zinc-300 leading-relaxed">{prowess}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div className="mt-3 rounded-lg border border-violet-800/40 bg-violet-950/20 p-3">
        <p className="text-xs font-headline text-violet-300 uppercase tracking-wider mb-1">The "Delta" Principle</p>
        <p className="text-zinc-400 leading-relaxed">The effectiveness of Level 3 and Level 4 is entirely dependent on your ability to return to Level 0. The greater the "Delta" (difference) between your open state and your closed state, the more powerful and "expert" your control will feel to your partner.</p>
      </div>
    </div>
  );
}

export function KhetTorsionSystem() {
  const [state, setState] = useState<TorsionState>(DEFAULT_STATE);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [showConcepts, setShowConcepts] = useState(false);
  const [openConceptSection, setOpenConceptSection] = useState<string | null>(null);
  const [expandedEx, setExpandedEx] = useState<string | null>(null);
  const [activeTimerEx, setActiveTimerEx] = useState<string | null>(null);

  useEffect(() => {
    const loaded = localStorage.getItem('khet-torsion-state');
    if (loaded) {
      try {
        const parsed = JSON.parse(loaded) as TorsionState;
        
        // Check for 3 AM reset
        if (parsed.completedAllAt) {
          const completedAt = new Date(parsed.completedAllAt);
          const next3AM = new Date(completedAt);
          next3AM.setHours(3, 0, 0, 0);
          if (next3AM <= completedAt) {
            next3AM.setDate(next3AM.getDate() + 1);
          }
          
          if (new Date() >= next3AM) {
             // Reset
             setState(DEFAULT_STATE);
             localStorage.setItem('khet-torsion-state', JSON.stringify(DEFAULT_STATE));
             return;
          }
        }

        setState(parsed);

      } catch (e) {}
    }
  }, []);

  const saveState = (newState: TorsionState) => {
    setState(newState);
    localStorage.setItem('khet-torsion-state', JSON.stringify(newState));
  };

  const toggleExercise = (dayIdx: number, exName: string) => {
    const dayExs = state.completedExercises[dayIdx] || [];
    const isCompleted = dayExs.includes(exName);
    
    let newDayExs;
    if (isCompleted) {
      newDayExs = dayExs.filter(e => e !== exName);
    } else {
      newDayExs = [...dayExs, exName];
    }
    
    let newCompletedDays = [...state.completedDays];
    let newCompletedAllAt = state.completedAllAt;

    const allExsForDay = TORSION_PROGRAM[dayIdx].exercises.map(e => e.name);
    const dayNowComplete = allExsForDay.every(e => newDayExs.includes(e));

    if (dayNowComplete && !newCompletedDays.includes(dayIdx)) {
      newCompletedDays.push(dayIdx);
      if (newCompletedDays.length === 7) {
         newCompletedAllAt = Date.now();
      }
    } else if (!dayNowComplete && newCompletedDays.includes(dayIdx)) {
      newCompletedDays = newCompletedDays.filter(d => d !== dayIdx);
      newCompletedAllAt = null;
    }

    const newState = {
      completedDays: newCompletedDays,
      completedExercises: { ...state.completedExercises, [dayIdx]: newDayExs },
      completedAllAt: newCompletedAllAt
    };
    saveState(newState);
  };

  const upcomingDayIndex = [0,1,2,3,4,5,6].find(d => !state.completedDays.includes(d)) ?? 6;

  return (
    <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-zinc-950 via-[#1a0b2e] to-[#0a0014] p-4 space-y-4 overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.07)]" onClick={() => setActiveDay(null)}>
       {/* Header */}
       <div className="flex items-start justify-between gap-3">
         <div className="flex-1 min-w-0">
           <div className="flex items-center gap-2 flex-wrap mb-1">
             <h3 className="font-headline text-violet-300 text-xl">Torsion System</h3>
             <span className="text-sm font-headline uppercase tracking-wider text-violet-300 border border-violet-500/40 rounded px-1.5 py-0.5 bg-violet-950/40">
               Elite Mastery
             </span>
           </div>
           {showConcepts && <p className="text-sm text-zinc-300 mt-1">Specific mastery of the pelvic floor, sphincteric system, and internal awareness.</p>}
         </div>
         <button onClick={() => setShowConcepts(!showConcepts)} className="p-2 rounded transition-colors text-violet-300 hover:text-violet-200 bg-violet-900/30 hover:bg-violet-900/50 border border-violet-500/30 shadow-sm flex-shrink-0">
           <BookOpen className="w-5 h-5" />
         </button>
       </div>

       {showConcepts && (
         <div className="border-t border-violet-900/50 pt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
           {([
             {
               id: 'overview',
               label: 'The System & Objective',
               content: (
                 <div className="space-y-3 text-sm text-zinc-200 leading-relaxed">
                   <p>The Torsion System is a specialized neuromuscular conditioning program designed to isolate and calibrate the pelvic floor and sphincteric complex. Unlike the Mass Displacement Engine, which focuses on external power, this module develops internal precision, pressure management, and the ability to decouple autonomic tension from conscious control.</p>
                   <p><strong className="text-violet-300">The Objective:</strong> The primary goal is to expand your "Dynamic Range"—the measurable distance between absolute relaxation (Level 0) and maximum structural torque (Level 4). By mastering this range, you achieve superior control over internal friction, allowing for both effortless receptivity and high-intensity feedback.</p>
                 </div>
               ),
             },
             {
               id: 'principles',
               label: 'Core Principles',
               content: (
                 <div className="space-y-3 text-sm text-zinc-200 leading-relaxed">
                   <p><strong className="text-violet-300">The "Zero" State:</strong> Prowess is defined by the depth of your relaxation. If the system fails to reach "Absolute Zero" during rest intervals, it becomes hypertonic, reducing overall responsiveness and control.</p>
                   <p><strong className="text-violet-300">Neuromuscular Dissociation:</strong> Training the internal ring to operate independently of the glutes, abdominals, and breath.</p>
                   <p><strong className="text-violet-300">Biological Synchrony:</strong> Once calibrated, the system allows for the "Milking" application—utilizing Expansion Valve protocols during intake and Level 2 Grip protocols during withdrawal to maximize feedback for both parties.</p>
                   <p><strong className="text-violet-300">Operational Integration:</strong> The pelvic floor is highly reactive. High-intensity compound lifts naturally induce bracing and tension. Perform Bottom Breathing and Expansion Valve immediately after heavy lower-body training to reset the system to its baseline open state.</p>
                 </div>
               ),
             },
             {
               id: 'foundational',
               label: 'Foundational Mechanics',
               content: (
                 <div className="space-y-4 text-sm text-zinc-200 leading-relaxed">
                   <div className="pl-3 border-l-2 border-violet-600/50 space-y-1">
                     <p className="font-headline text-violet-300 uppercase tracking-wider text-xs">System Boot-up: Bottom Breathing</p>
                     <p><strong className="text-zinc-400 font-normal">The "Why":</strong> Most people subconsciously clench their pelvic floor when nervous, excited, or physically strained—a defensive reflex.</p>
                     <p><strong className="text-zinc-400 font-normal">The Outcome:</strong> Re-wires your nervous system to stay open during high-intensity moments. By syncing a 2-second expansion push with a deep inhale, you train your body to prioritize oxygenation over bracing, preventing the panic-tightening that makes entry or deep thrusting uncomfortable.</p>
                   </div>
                   <div className="pl-3 border-l-2 border-violet-600/50 space-y-1">
                     <p className="font-headline text-violet-300 uppercase tracking-wider text-xs">The Expansion Valve (Reverse Kegels)</p>
                     <p><strong className="text-zinc-400 font-normal">The "Why":</strong> Traditional fitness focuses solely on squeezing, leading to a tight, non-responsive muscle. This is the System Reset—the "Clear" button.</p>
                     <p><strong className="text-zinc-400 font-normal">The Outcome:</strong> Focuses on lengthening the tissue, increasing your "Initial Intake" capacity. Allows you to welcome entry effortlessly and reset tension levels instantly if a top changes rhythm or depth unexpectedly.</p>
                   </div>
                 </div>
               ),
             },
             {
               id: 'tuning',
               label: 'High-Performance Tuning',
               content: (
                 <div className="space-y-4 text-sm text-zinc-200 leading-relaxed">
                   <div className="pl-3 border-l-2 border-amber-600/50 space-y-1">
                     <p className="font-headline text-amber-300 uppercase tracking-wider text-xs">Internal Feedback (Dilation Training)</p>
                     <p><strong className="text-zinc-400 font-normal">The "Why":</strong> Squeezing air is different from managing a physical object. This is your load-bearing calibration.</p>
                     <p><strong className="text-zinc-400 font-normal">The Outcome:</strong> Develops "Proprioception"—the ability to feel exactly where the top is and how much pressure you are applying. The difference between a dumb squeeze and a smart grip that responds to the top&apos;s specific shape and movement.</p>
                   </div>
                   <div className="pl-3 border-l-2 border-amber-600/50 space-y-1">
                     <p className="font-headline text-amber-300 uppercase tracking-wider text-xs">The Flutter (Neuromuscular Staccato)</p>
                     <p><strong className="text-zinc-400 font-normal">The "Why":</strong> Long, sustained holds build endurance but not vibrancy.</p>
                     <p><strong className="text-zinc-400 font-normal">The Outcome:</strong> Trains fast-twitch muscle fibers. When mastered, you can create a high-frequency internal shiver or vibration. For a top, this feels like the internal walls are alive and electrified—a unique sensory experience a simple squeeze cannot replicate.</p>
                   </div>
                 </div>
               ),
             },
             {
               id: 'summary',
               label: 'System Summary',
               content: (
                 <div className="space-y-3 text-sm text-zinc-200">
                   <p className="leading-relaxed text-zinc-400">By combining these protocols, you aren&apos;t just doing exercises—you are building a sophisticated, responsive system that can adapt to any top, any speed, and any duration with total control.</p>
                   <div className="overflow-x-auto rounded-lg border border-violet-800/50">
                     <table className="w-full text-sm text-left">
                       <thead>
                         <tr className="text-violet-300 font-headline border-b border-violet-800/60 bg-violet-950/40">
                           <th className="p-2.5 pr-3">Protocol</th>
                           <th className="p-2.5 pr-3">Mechanical Analogy</th>
                           <th className="p-2.5">Sexual Benefit</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-violet-900/40">
                         <tr><td className="p-2.5 pr-3 text-zinc-200">Bottom Breathing</td><td className="p-2.5 pr-3 text-zinc-400">Cooling System</td><td className="p-2.5 text-zinc-300">Stay relaxed during intense thrusting.</td></tr>
                         <tr><td className="p-2.5 pr-3 text-zinc-200">Expansion Valve</td><td className="p-2.5 pr-3 text-zinc-400">Intake Port</td><td className="p-2.5 text-zinc-300">Effortless entry and immediate openness.</td></tr>
                         <tr><td className="p-2.5 pr-3 text-zinc-200">The Elevator</td><td className="p-2.5 pr-3 text-zinc-400">Transmission</td><td className="p-2.5 text-zinc-300">Shifting grips for varied pleasure.</td></tr>
                         <tr><td className="p-2.5 pr-3 text-zinc-200">Internal Feedback</td><td className="p-2.5 pr-3 text-zinc-400">Sensor Array</td><td className="p-2.5 text-zinc-300">Precise awareness of position and depth.</td></tr>
                         <tr><td className="p-2.5 pr-3 text-zinc-200">The Flutter</td><td className="p-2.5 pr-3 text-zinc-400">Turbo Boost</td><td className="p-2.5 text-zinc-300">High-speed internal vibration/shivering.</td></tr>
                       </tbody>
                     </table>
                   </div>
                 </div>
               ),
             },
             {
               id: 'calibration',
               label: 'Levels: Calibration Scale',
               content: (
                 <CalibrationLevels />
               ),
             },
           ] as { id: string; label: string; content: React.ReactNode }[]).map(({ id, label, content }) => (
             <div key={id} className="rounded-lg border border-violet-800/40 overflow-hidden">
               <button
                 onClick={() => setOpenConceptSection(openConceptSection === id ? null : id)}
                 className={cn(
                   'w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-headline uppercase tracking-wider transition-colors',
                   openConceptSection === id
                     ? 'bg-violet-900/60 text-violet-200 border-b border-violet-700/50'
                     : 'bg-violet-950/30 text-violet-300 hover:bg-violet-900/40'
                 )}
               >
                 <span>{label}</span>
                 <span className={cn('text-violet-500 transition-transform duration-200', openConceptSection === id ? 'rotate-180' : '')}>▾</span>
               </button>
               {openConceptSection === id && (
                 <div className="p-3.5 bg-black/30">
                   {content}
                 </div>
               )}
             </div>
           ))}
         </div>
       )}

       {/* Days */}
       <div className="flex flex-wrap gap-2 mt-4">
         {TORSION_PROGRAM.map((day, idx) => {
           const isCompleted = state.completedDays.includes(idx);
           const isUpcoming = upcomingDayIndex === idx && !isCompleted;
           const isActive = activeDay === idx;

           return (
             <button
               key={idx}
               onClick={(e) => { e.stopPropagation(); setActiveDay(isActive ? null : idx); }}
               className={cn(
                 'px-4 py-2.5 rounded border text-sm font-headline uppercase tracking-wider transition-all duration-200 relative',
                 isUpcoming && 'border-orange-500 text-orange-200 bg-orange-950/60 shadow-[0_0_15px_rgba(249,115,22,0.4)]',
                 isCompleted && 'border-violet-500 text-violet-200 bg-violet-900/60 shadow-[0_0_10px_rgba(139,92,246,0.3)]',
                 !isUpcoming && !isCompleted && 'border-zinc-600 text-zinc-300 hover:border-zinc-400 bg-zinc-900/40',
                 isActive && 'ring-2 ring-white/30 scale-105 shadow-lg'
               )}
             >
               {day.day}
             </button>
           );
         })}
       </div>

       {/* Active Day Content */}
       {activeDay === null ? (
         <div className="border border-violet-800/30 rounded-lg p-6 bg-violet-950/10 text-center">
           <p className="text-sm text-zinc-500 font-headline uppercase tracking-wider">Select a day to view exercises</p>
         </div>
       ) : (
       <div className="border border-violet-800/50 rounded-lg p-4 bg-violet-950/20" onClick={(e) => e.stopPropagation()}>
         <h4 className="text-base font-headline text-violet-300 uppercase tracking-widest mb-1.5">{TORSION_PROGRAM[activeDay].focus}</h4>
         <p className="text-sm text-zinc-300 mb-4">{TORSION_PROGRAM[activeDay].desc}</p>
         
         <div className="space-y-4">
           {TORSION_PROGRAM[activeDay].exercises.map((ex, i) => {
             const isExCompleted = (state.completedExercises[activeDay] || []).includes(ex.name);
             const isExpanded = expandedEx === ex.name;
             const isTimerActive = activeTimerEx === ex.name;

             return (
               <div key={i} className="flex flex-col border border-zinc-700/80 rounded-lg bg-zinc-900/60 overflow-hidden shadow-sm">
                 <div className="p-3">
                   <div className="flex items-start gap-3">
                     <button onClick={() => toggleExercise(activeDay, ex.name)} className={cn("mt-1 transition-colors flex-shrink-0", isExCompleted ? "text-violet-400" : "text-zinc-400 hover:text-zinc-200")}>
                       {isExCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                     </button>
                     
                     <div className="flex-1 min-w-0">
                       <p className={cn("text-base font-headline transition-colors mb-1.5", isExCompleted ? "text-violet-300" : "text-zinc-100")}>{ex.name}</p>
                       <p className="text-sm text-violet-300/80 font-headline uppercase tracking-wider mb-1.5">{ex.sets}</p>
                       <p className="text-sm text-zinc-300 flex items-center gap-1.5">
                         <Timer className="w-4 h-4 text-zinc-400" />
                         {ex.hold}
                       </p>
                     </div>

                     <div className="text-right flex items-start gap-2 flex-shrink-0">
                       <button onClick={() => setActiveTimerEx(isTimerActive ? null : ex.name)} className={cn("p-2 border rounded hover:bg-opacity-80 transition-colors shadow-sm", isTimerActive ? "bg-amber-900/30 border-amber-600/50 text-amber-300" : "bg-violet-900/30 border-violet-600/50 text-violet-300")}>
                         <Timer className="w-5 h-5" />
                       </button>
                       <button onClick={() => setExpandedEx(isExpanded ? null : ex.name)} className={cn("p-2 border rounded hover:bg-opacity-80 transition-colors shadow-sm", isExpanded ? "bg-violet-800/40 border-violet-500 text-white" : "bg-violet-900/30 border-violet-600/50 text-violet-300")}>
                         <Info className="w-5 h-5" />
                       </button>
                     </div>
                   </div>

                   {/* Inline Timer component */}
                   {isTimerActive && (
                     <StopwatchTimer
                       exerciseName={ex.name}
                       onComplete={() => { if (!isExCompleted) toggleExercise(activeDay, ex.name); }}
                     />
                   )}
                 </div>

                 {isExpanded && (
                   <div className="p-4 pt-3 text-sm text-zinc-200 space-y-3 bg-black/40 border-t border-zinc-700/80">
                     <p className="leading-relaxed"><strong className="text-violet-300">Action:</strong> {ex.action}</p>
                     <p className="whitespace-pre-wrap leading-relaxed"><strong className="text-violet-300">Instruction:</strong> {ex.instruction}</p>
                     <p className="leading-relaxed"><strong className="text-violet-300">Goal:</strong> {ex.goal}</p>
                   </div>
                 )}
               </div>
             );
           })}
           {TORSION_PROGRAM[activeDay].exercises.length === 0 && (
             <p className="text-sm text-zinc-400 italic">No formal exercises scheduled.</p>
           )}
         </div>

         {state.completedDays.includes(activeDay) && (
            <div className="mt-5 p-3 bg-violet-900/30 border border-violet-500/50 rounded-lg text-center shadow-[0_0_20px_rgba(139,92,246,0.25)]">
              <p className="text-base font-headline text-violet-300 uppercase tracking-widest flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Session Complete
              </p>
            </div>
         )}
       </div>
       )}

       {/* Level Details Modal */}
    </div>
  );
}
