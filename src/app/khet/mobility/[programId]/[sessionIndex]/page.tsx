"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  Circle,
  Wind,
  Timer,
  Activity,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobility } from '@/hooks/use-mobility';
import {
  generateMobilityPlan,
  generatePrebedSession,
  type MobilityExercise,
  type GeneratedSession,
  type MobilitySlot,
} from '@/lib/mobility-types';
import mobilityExercisesData from '@/../public/docs/mobility-exercises.json';
import {
  buildMobilityDraftKey,
  loadRawDraft,
  clearRawDraft,
  useLocalDraft,
} from '@/hooks/use-session-persistence';

// Shape of the persisted mobility draft
interface MobilityDraft {
  completedKeys: string[];
  levelUpMode: boolean;
  startTime: number;
}

const ALL_EXERCISES = mobilityExercisesData as MobilityExercise[];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function getSlotKey(slot: MobilitySlot, side: 'left' | 'right' | 'both'): string {
  return `${slot.exerciseId}__${side}`;
}

// ─────────────────────────────────────────────────────────────
// BigTimer
// ─────────────────────────────────────────────────────────────

interface BigTimerProps {
  totalSeconds: number;
  onComplete: () => void;
  label: string;
  side: 'left' | 'right' | 'both';
}

function BigTimer({ totalSeconds, onComplete, label, side }: BigTimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isActive, setIsActive] = useState(false);
  const [breathMode, setBreathMode] = useState(false);
  const totalBreaths = Math.round(totalSeconds / 5);  // ~5s per breath
  const breathsLeft = Math.round((timeLeft / totalSeconds) * totalBreaths);
  const pct = 1 - timeLeft / (totalSeconds || 1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const beep = (freq: number, dur: number, vol = 0.45) => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (_) { /* silent fail */ }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isActive) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next === 3) beep(880, 0.12);
        if (next === 2) beep(880, 0.12);
        if (next === 1) beep(880, 0.12);
        if (next <= 0) {
          clearInterval(intervalRef.current!);
          if (!doneRef.current) {
            doneRef.current = true;
            beep(1047, 0.25, 0.6);
            setTimeout(() => beep(1319, 0.4, 0.55), 280);
            setTimeout(onComplete, 300);
          }
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, onComplete]);

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    doneRef.current = false;
    setTimeLeft(totalSeconds);
    setIsActive(false);
  };

  const sideLabel =
    side === 'left' ? 'LEFT SIDE' : side === 'right' ? 'RIGHT SIDE' : null;

  // SVG ring
  const r = 88;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Side badge */}
      {sideLabel && (
        <div
          className={cn(
            'text-xs font-headline uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border',
            side === 'left'
              ? 'border-cyan-500/60 bg-cyan-950/30 text-cyan-300'
              : 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300',
          )}
        >
          {sideLabel}
        </div>
      )}

      {/* Ring + timer */}
      <div className="relative w-52 h-52 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
          {/* Track */}
          <circle cx="100" cy="100" r={r} fill="none" stroke="#1f2937" strokeWidth="8" />
          {/* Progress */}
          <circle
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke={timeLeft === 0 ? '#34d399' : '#22d3ee'}
            strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>

        {/* Time / breath display */}
        {breathMode ? (
          <div className="flex flex-col items-center">
            <span className="text-6xl font-headline font-bold text-cyan-400 tabular-nums drop-shadow-[0_0_30px_rgba(34,211,238,0.9)]">
              {breathsLeft}
            </span>
            <span className="text-xs font-headline uppercase tracking-[0.2em] text-cyan-600 mt-1">
              breaths
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span
              className={cn(
                'text-6xl font-headline font-bold tabular-nums transition-colors',
                timeLeft === 0
                  ? 'text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.9)]'
                  : 'text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.9)]',
              )}
            >
              {formatSeconds(timeLeft)}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleReset}
          className="p-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-all"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsActive((v) => !v)}
          className={cn(
            'px-8 py-3 rounded-xl border text-sm font-headline uppercase tracking-widest transition-all shadow-lg',
            isActive
              ? 'border-amber-500/60 bg-amber-950/30 text-amber-300 hover:bg-amber-950/50'
              : 'border-cyan-500 bg-cyan-950/30 text-cyan-200 hover:bg-cyan-950/50 shadow-[0_0_20px_rgba(34,211,238,0.3)]',
          )}
        >
          {isActive ? (
            <span className="flex items-center gap-2">
              <Pause className="w-5 h-5" />
              Pause
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              {timeLeft === totalSeconds ? 'Start Hold' : 'Resume'}
            </span>
          )}
        </button>

        <button
          onClick={() => setBreathMode((v) => !v)}
          className={cn(
            'p-2.5 rounded-lg border transition-all',
            breathMode
              ? 'border-indigo-500/60 bg-indigo-950/30 text-indigo-300'
              : 'border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500',
          )}
          title={breathMode ? 'Switch to countdown' : 'Switch to breath counter'}
        >
          <Wind className="w-5 h-5" />
        </button>
      </div>

      {breathMode && (
        <p className="text-xs text-zinc-500 text-center">
          Hold for {totalBreaths} breaths (~{Math.round(totalSeconds / 60 * 10) / 10} min)
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ExerciseItem
// ─────────────────────────────────────────────────────────────

interface ExerciseItemProps {
  slot: MobilitySlot;
  exercise: MobilityExercise;
  completedKeys: Set<string>;
  activeKey: string | null;
  onActivate: (key: string) => void;
  onMarkDone: (key: string) => void;
  sideIndex: number; // 0 or 1 for left-right; 0 for bilateral
  totalSides: number;
  levelUpMode: boolean;
}

function ExerciseItem({
  slot,
  exercise,
  completedKeys,
  activeKey,
  onActivate,
  onMarkDone,
  sideIndex,
  totalSides,
  levelUpMode,
}: ExerciseItemProps) {
  const [cueOpen, setCueOpen] = useState(false);
  const side: 'left' | 'right' | 'both' =
    exercise.sides === 'bilateral' ? 'both' : sideIndex === 0 ? 'left' : 'right';
  const key = getSlotKey(slot, side);
  const r1Key = key + '__r1';
  const r2Key = key + '__r2';
  const isR1Done = levelUpMode && completedKeys.has(r1Key);
  const isR2Done = levelUpMode && completedKeys.has(r2Key);
  const isFullyDone = levelUpMode ? isR2Done : completedKeys.has(key);
  const isFirstRoundOnly = levelUpMode && isR1Done && !isR2Done;
  const isDone = isFullyDone;
  const isActive = activeKey === key;
  const sideLabel =
    side === 'left' ? 'Left' : side === 'right' ? 'Right' : null;

  const holdLabel = slot.isDynamic
    ? `${slot.reps ?? 10} reps`
    : `${slot.holdSeconds}s${slot.sets > 1 ? ` × ${slot.sets} sets` : ''}`;

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-300',
        isDone
          ? 'border-emerald-500/50 bg-emerald-950/20'
          : isFirstRoundOnly
            ? 'border-amber-400/60 bg-amber-950/15 shadow-[0_0_10px_rgba(251,191,36,0.12)]'
            : isActive
              ? 'border-cyan-500/70 bg-cyan-950/15 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
              : 'border-zinc-800 bg-zinc-950/30',
      )}
    >
      <div className="flex items-center gap-3 px-3 py-3">
        {/* Done toggle(s) */}
        {levelUpMode ? (
          <div className="flex gap-0.5 flex-shrink-0">
            <button onClick={() => onMarkDone(r1Key)}>
              {isR1Done ? (
                <CheckCircle2 className={cn('w-5 h-5', isR2Done ? 'text-emerald-400' : 'text-amber-400')} />
              ) : (
                <Circle className="w-5 h-5 text-zinc-600" />
              )}
            </button>
            <button
              onClick={() => { if (isR1Done) onMarkDone(r2Key); }}
              className={cn(!isR1Done && 'opacity-25 cursor-not-allowed')}
            >
              {isR2Done ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Circle className={cn('w-5 h-5', isR1Done ? 'text-zinc-400' : 'text-zinc-700')} />
              )}
            </button>
          </div>
        ) : (
          <button onClick={() => onMarkDone(key)} className="flex-shrink-0">
            {isDone ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Circle className="w-5 h-5 text-zinc-600" />
            )}
          </button>
        )}

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'text-sm font-headline uppercase tracking-widest',
                isDone ? 'text-emerald-300' : isFirstRoundOnly ? 'text-amber-300' : isActive ? 'text-cyan-200' : 'text-zinc-200',
              )}
            >
              {exercise.name}
            </span>
            {sideLabel && (
              <span
                className={cn(
                  'text-[9px] font-headline uppercase tracking-wider px-1.5 py-0.5 rounded border',
                  side === 'left'
                    ? 'border-cyan-600/40 text-cyan-500 bg-cyan-950/20'
                    : 'border-emerald-600/40 text-emerald-500 bg-emerald-950/20',
                )}
              >
                {sideLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{holdLabel}</p>
        </div>

        {/* Cue toggle */}
        <button
          onClick={() => setCueOpen((v) => !v)}
          className="flex-shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          {cueOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Start Timer */}
        {!isDone && !slot.isDynamic && (
          <button
            onClick={() => onActivate(key)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-headline uppercase tracking-wider transition-all',
              isActive
                ? 'border-cyan-500/60 bg-cyan-950/30 text-cyan-300'
                : isFirstRoundOnly
                  ? 'border-amber-500/50 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-cyan-600/50 hover:text-cyan-300',
            )}
          >
            <Timer className="w-3.5 h-3.5" />
            {isActive ? 'Active' : isFirstRoundOnly ? 'Round 2' : 'Timer'}
          </button>
        )}
      </div>

      {/* Level-up nudge — visible after round 1, before round 2 */}
      {isFirstRoundOnly && (
        <div className="flex items-center gap-1.5 px-3 pb-2 -mt-0.5">
          <span className="text-[10px] text-amber-400 font-headline uppercase tracking-widest">
            ↑ Reach a little further this time
          </span>
        </div>
      )}

      {/* Cue panel */}
      {cueOpen && (
        <div className="px-4 pb-3">
          <p className="text-xs text-zinc-400 leading-relaxed border-t border-zinc-800 pt-2">
            {exercise.cues}
          </p>
          {exercise.modifications.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Easier:</span>
              {exercise.modifications.map((modId) => {
                const modEx = ALL_EXERCISES.find((e) => e.id === modId);
                return modEx ? (
                  <span
                    key={modId}
                    className="text-[9px] text-zinc-500 border border-zinc-800 rounded px-1.5 py-0.5"
                  >
                    {modEx.name}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main session page
// ─────────────────────────────────────────────────────────────

export default function MobilitySessionPage() {
  const params = useParams();
  const router = useRouter();
  const { programs, logSession } = useMobility();

  const programId = params.programId as string;
  const sessionIndexParam = params.sessionIndex as string;
  const isPrebed = sessionIndexParam === 'prebed';
  const sessionIndex = isPrebed ? -1 : parseInt(sessionIndexParam, 10);

  const program = programs.find((p) => p.id === programId);

  const session: GeneratedSession | null = (() => {
    if (!program) return null;
    if (isPrebed) return generatePrebedSession(ALL_EXERCISES);
    const allSessions = generateMobilityPlan(program, ALL_EXERCISES);
    return allSessions.find((s) => s.index === sessionIndex) ?? null;
  })();

  // Build the flat list of "items" (one per slot×side)
  const items = (() => {
    if (!session) return [];
    const result: { slot: MobilitySlot; exercise: MobilityExercise; sideIndex: number; totalSides: number }[] = [];
    for (const slot of session.slots) {
      const ex = ALL_EXERCISES.find((e) => e.id === slot.exerciseId);
      if (!ex) continue;
      const totalSides = ex.sides === 'left-right' ? 2 : 1;
      for (let si = 0; si < totalSides; si++) {
        result.push({ slot, exercise: ex, sideIndex: si, totalSides });
      }
    }
    return result;
  })();

  // ── Draft hydration — restore in-progress state from localStorage ──
  const draftKey = buildMobilityDraftKey(programId, sessionIndexParam);
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(
    () => new Set(loadRawDraft<MobilityDraft>(draftKey)?.completedKeys ?? []),
  );
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [activeTimer, setActiveTimer] = useState<{ holdSeconds: number; label: string; side: 'left' | 'right' | 'both' } | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [levelUpMode, setLevelUpMode] = useState<boolean>(
    () => loadRawDraft<MobilityDraft>(draftKey)?.levelUpMode ?? false,
  );
  const startTimeRef = useRef<number>((() => {
    const stored = loadRawDraft<MobilityDraft>(draftKey)?.startTime;
    // If stored start time is > 8 hours old (stale/abandoned session) reset to now
    // to prevent durationMinutes from inflating to hundreds of minutes.
    const STALE_MS = 8 * 3600000;
    return stored && (Date.now() - stored) < STALE_MS ? stored : Date.now();
  })());

  // ── Persistence: debounced draft writes ──
  const mobilityDraftData = useMemo(
    () => ({
      completedKeys: Array.from(completedKeys),
      levelUpMode,
      startTime: startTimeRef.current,
    }),
    [completedKeys, levelUpMode],
  );
  const { persistNow: persistMobilityDraft } = useLocalDraft(draftKey, mobilityDraftData);
  const isDirty = completedKeys.size > 0;

  // ── Browser-level guard: warn on tab close / hard refresh ──
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      persistMobilityDraft();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, persistMobilityDraft]);

  // ── App-level guard: intercept back-button navigation ──
  useEffect(() => {
    if (!isDirty) return;
    const handlePopState = () => {
      if (!isDirty) return;
      const leave = window.confirm(
        'You have unsaved mobility progress. Leave without sealing the session?',
      );
      if (!leave) {
        window.history.pushState(null, '', window.location.href);
      } else {
        persistMobilityDraft();
      }
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isDirty, persistMobilityDraft]);

  const totalItems = levelUpMode ? items.length * 2 : items.length;
  const doneCount = levelUpMode
    ? items.reduce((acc, { slot, exercise, sideIndex }) => {
        const side: 'left' | 'right' | 'both' = exercise.sides === 'bilateral' ? 'both' : sideIndex === 0 ? 'left' : 'right';
        const base = getSlotKey(slot, side);
        return acc + (completedKeys.has(base + '__r1') ? 1 : 0) + (completedKeys.has(base + '__r2') ? 1 : 0);
      }, 0)
    : completedKeys.size;

  const handleActivate = useCallback(
    (key: string) => {
      const item = items.find(
        (it) => getSlotKey(it.slot, it.exercise.sides === 'bilateral' ? 'both' : it.sideIndex === 0 ? 'left' : 'right') === key,
      );
      if (!item) return;
      const side: 'left' | 'right' | 'both' =
        item.exercise.sides === 'bilateral' ? 'both' : item.sideIndex === 0 ? 'left' : 'right';

      setActiveKey(key);
      setActiveTimer({
        holdSeconds: item.slot.holdSeconds,
        label: item.exercise.name,
        side,
      });
      // scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [items],
  );

  const handleTimerComplete = useCallback(() => {
    if (!activeKey) return;
    // In Level-Up Mode: mark r1 first, then r2 when timer fires again
    const isCompletingR2 = levelUpMode && completedKeys.has(activeKey + '__r1');
    const markKey = levelUpMode
      ? (isCompletingR2 ? activeKey + '__r2' : activeKey + '__r1')
      : activeKey;
    setCompletedKeys((prev) => new Set([...prev, markKey]));
    // Auto-activate next incomplete item
    const currentIdx = items.findIndex(
      (it) =>
        getSlotKey(
          it.slot,
          it.exercise.sides === 'bilateral' ? 'both' : it.sideIndex === 0 ? 'left' : 'right',
        ) === activeKey,
    );
    const next = items.slice(currentIdx + 1).find((it) => {
      const k = getSlotKey(
        it.slot,
        it.exercise.sides === 'bilateral' ? 'both' : it.sideIndex === 0 ? 'left' : 'right',
      );
      if (levelUpMode) {
        if (isCompletingR2) {
          // second pass: advance to next item that has r1 done but r2 not yet done
          return completedKeys.has(k + '__r1') && !completedKeys.has(k + '__r2') && !it.slot.isDynamic;
        } else {
          // first pass: advance to next item without r1 done
          return !completedKeys.has(k + '__r1') && !it.slot.isDynamic;
        }
      }
      return !completedKeys.has(k) && !it.slot.isDynamic;
    });
    if (next) {
      const nSide: 'left' | 'right' | 'both' =
        next.exercise.sides === 'bilateral' ? 'both' : next.sideIndex === 0 ? 'left' : 'right';
      const nKey = getSlotKey(next.slot, nSide);
      setActiveKey(nKey);
      setActiveTimer({
        holdSeconds: next.slot.holdSeconds,
        label: next.exercise.name,
        side: nSide,
      });
    } else {
      setActiveKey(null);
      setActiveTimer(null);
    }
  }, [activeKey, items, completedKeys, levelUpMode]);

  const handleMarkDone = useCallback((key: string) => {
    setCompletedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    if (activeKey === key) {
      setActiveKey(null);
      setActiveTimer(null);
    }
  }, [activeKey]);

  // Watch for all done
  useEffect(() => {
    const allDone = levelUpMode
      ? items.length > 0 && items.every(({ slot, exercise, sideIndex }) => {
          const side: 'left' | 'right' | 'both' = exercise.sides === 'bilateral' ? 'both' : sideIndex === 0 ? 'left' : 'right';
          return completedKeys.has(getSlotKey(slot, side) + '__r2');
        })
      : totalItems > 0 && doneCount === totalItems;
    if (allDone && !sessionComplete) {
      setSessionComplete(true);
    }
  }, [completedKeys, doneCount, totalItems, items, levelUpMode, sessionComplete]);

  const handleFinish = async () => {
    if (!program || !session || saving) return;
    setSaving(true);
    try {
      const durationMinutes = Math.round((Date.now() - startTimeRef.current) / 60000);
      await logSession(
        {
          userId: '',
          programId: program.id,
          programName: program.name,
          sessionIndex,
          week: session.week,
          label: session.label,
          type: session.type,
          date: format(new Date(), 'yyyy-MM-dd'),
          slotsCompleted: Array.from(completedKeys),
          durationMinutes: Math.max(1, durationMinutes),
          completed: true,
          levelUpMode,
        },
        program.id,
      );
      clearRawDraft(draftKey);
      router.push('/khet/dashboard');
    } catch {
      setSaving(false);
    }
  };

  if (!program || !session) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Activity className="w-10 h-10 text-zinc-700 mx-auto" />
          <p className="text-zinc-500 text-sm">Session not found.</p>
          <Link href="/khet/dashboard" className="text-blue-400 text-sm hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Completion screen ──────────────────────────────────────
  if (sessionComplete) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 text-center space-y-8">
        {/* Glow ring */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/10 shadow-[0_0_80px_rgba(52,211,153,0.4)]" />
          <CheckCircle2 className="w-20 h-20 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.8)]" />
        </div>

        <div className="space-y-2">
          <h1 className="font-headline text-3xl text-emerald-300 uppercase tracking-widest">
            Body Maintained.
          </h1>
          <h2 className="font-headline text-2xl text-emerald-400 uppercase tracking-widest">
            Gains Protected.
          </h2>
          <p className="text-zinc-500 text-sm mt-3">
            {session.label} — {doneCount} stretches completed
          </p>
        </div>

        <button
          onClick={handleFinish}
          disabled={saving}
          className="px-8 py-3 rounded-xl border border-emerald-500 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50 font-headline uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] disabled:opacity-50"
        >
          {saving ? 'Logging…' : 'Seal the Session'}
        </button>

        <Link href="/khet/dashboard" className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors">
          Skip without logging
        </Link>
      </div>
    );
  }

  // ── Active session screen ──────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Top nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
        <Link
          href="/khet/dashboard"
          className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-headline uppercase tracking-widest">Exit</span>
        </Link>
        <div className="text-center">
          <p className="text-xs font-headline uppercase tracking-widest text-blue-300">
            {session.label}
          </p>
          {session.week > 0 && (
            <p className="text-[10px] text-zinc-600">Week {session.week} · {session.estimatedMinutes} min</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs font-headline text-zinc-400">
            <span className="text-white">{doneCount}</span>/{totalItems}
          </p>
          <p className="text-[10px] text-zinc-600">done</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-900">
        <div
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${totalItems > 0 ? (doneCount / totalItems) * 100 : 0}%` }}
        />
      </div>

      {/* Timer area */}
      <div className="flex flex-col items-center justify-center py-8 px-4">
        {activeTimer ? (
          <div className="w-full flex flex-col items-center">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-headline uppercase tracking-[0.3em] text-zinc-400">
                Now Holding
              </p>
              {levelUpMode && activeKey && completedKeys.has(activeKey + '__r1') && (
                <span className="text-[9px] font-headline uppercase tracking-widest text-amber-400 border border-amber-500/30 rounded-full px-2 py-0.5 bg-amber-950/20">
                  Round 2
                </span>
              )}
            </div>
            <h2 className="font-headline text-xl text-white uppercase tracking-widest mb-6 text-center">
              {activeTimer.label}
            </h2>
            <BigTimer
              key={activeKey}
              totalSeconds={activeTimer.holdSeconds}
              onComplete={handleTimerComplete}
              label={activeTimer.label}
              side={activeTimer.side}
            />
            <button
              onClick={() => {
                if (activeKey) {
                  const skipKey = levelUpMode
                    ? (completedKeys.has(activeKey + '__r1') ? activeKey + '__r2' : activeKey + '__r1')
                    : activeKey;
                  setCompletedKeys((prev) => new Set([...prev, skipKey]));
                }
                setActiveKey(null);
                setActiveTimer(null);
              }}
              className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Skip & Mark Done
            </button>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <Activity className="w-10 h-10 text-blue-800 mx-auto" />
            <p className="text-sm text-zinc-500 font-headline uppercase tracking-widest">
              Tap a Timer to Begin
            </p>
            <p className="text-xs text-zinc-700">
              Or check off exercises manually as you go
            </p>
          </div>
        )}
      </div>

      {/* Exercise list */}
      <div className="flex-1 px-4 pb-8 space-y-2">
        <p className="text-[10px] font-headline uppercase tracking-widest text-zinc-600 mb-3">
          Session Checklist
        </p>
        {items.map(({ slot, exercise, sideIndex, totalSides }) => {
          const side: 'left' | 'right' | 'both' =
            exercise.sides === 'bilateral' ? 'both' : sideIndex === 0 ? 'left' : 'right';
          const key = getSlotKey(slot, side);
          return (
            <ExerciseItem
              key={key}
              slot={slot}
              exercise={exercise}
              completedKeys={completedKeys}
              activeKey={activeKey}
              onActivate={handleActivate}
              onMarkDone={handleMarkDone}
              sideIndex={sideIndex}
              totalSides={totalSides}
              levelUpMode={levelUpMode}
            />
          );
        })}

        {/* Level-Up Mode toggle */}
        <div
          className={cn(
            'mt-4 flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all duration-300',
            levelUpMode
              ? 'border-amber-500/40 bg-amber-950/15 shadow-[0_0_15px_rgba(251,191,36,0.08)]'
              : 'border-zinc-800 bg-zinc-950/30',
          )}
        >
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-xs font-headline uppercase tracking-widest',
                levelUpMode ? 'text-amber-400' : 'text-zinc-400',
              )}
            >
              Level-Up Mode
            </p>
            <p className="text-[10px] text-zinc-600 mt-0.5 leading-snug">
              Two rounds per stretch — push deeper on pass 2.
            </p>
          </div>
          <button
            onClick={() => {
              setLevelUpMode((v) => !v);
              setCompletedKeys(new Set());
              setActiveKey(null);
              setActiveTimer(null);
            }}
            className={cn(
              'flex-shrink-0 w-11 h-6 rounded-full border-2 flex items-center transition-all duration-300 px-0.5 ml-4',
              levelUpMode
                ? 'border-amber-500 bg-amber-500'
                : 'border-zinc-600 bg-zinc-800',
            )}
          >
            <div
              className={cn(
                'w-4 h-4 rounded-full bg-white transition-transform duration-300',
                levelUpMode ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </button>
        </div>

        {/* Manual finish button */}
        {doneCount > 0 && doneCount < totalItems && (
          <div className="pt-4">
            <button
              onClick={() => setSessionComplete(true)}
              className="w-full py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:border-emerald-600/40 hover:text-emerald-300 text-xs font-headline uppercase tracking-widest transition-all"
            >
              Finish Session ({doneCount}/{totalItems} done)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
