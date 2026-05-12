"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { format, parseISO, differenceInCalendarDays, startOfWeek } from 'date-fns';
import {
  Flame,
  Plus,
  TrendingUp,
  Calendar,
  ChevronRight,
  BarChart2,
  X,
  Check,
  Info,
  Timer,
  Minus,
  Play,
  Pause,
  RotateCcw,
  Search,
  GripVertical,
  Trash2,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCore } from '@/hooks/use-core';
import { useToast } from '@/hooks/use-toast';
import { BanishmentPortal } from '@/components/banishment-portal';
import { DuamatefJar } from '@/components/icons/duamatef-jar';
import { CyberStylus } from '@/components/icons/cyber-stylus';
import { CoreProgramWizard } from './core-program-wizard';
import {
  CORE_EXERCISES,
  generateCoreProgram,
  type CoreProgram,
  type CoreFitnessLevel,
  type CoreGoal,
  type GeneratedCoreSession,
  type CoreSlot,
  type CoreExercise,
  type CoreSessionLog,
} from '@/lib/core-types';
import { useAuth } from '@/components/auth-provider';
import {
  buildCoreDraftKey,
  loadRawDraft,
  clearRawDraft,
  useLocalDraft,
} from '@/hooks/use-session-persistence';

// Shape of the persisted core session draft
interface CoreDraft {
  completedSets: Record<string, number[]>; // Set<number> serialised as number[]
  performance: Record<string, { weight?: number; reps?: number; seconds?: number }>;
  startTime: number;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const LEVEL_BADGE: Record<CoreFitnessLevel, string> = {
  Beginner: 'text-green-400 border-green-500/40 bg-green-950/20',
  Intermediate: 'text-amber-400 border-amber-500/40 bg-amber-950/20',
  Advanced: 'text-orange-400 border-orange-500/40 bg-orange-950/20',
  Elite: 'text-red-400 border-red-500/40 bg-red-950/20',
};

const GOAL_COLORS: Record<CoreGoal, string> = {
  Strength: 'text-red-300',
  Endurance: 'text-cyan-300',
  Athletic: 'text-yellow-300',
  Aesthetics: 'text-orange-300',
};

function localDateStr(d: Date = new Date()): string {
  return format(d, 'yyyy-MM-dd');
}

// ─────────────────────────────────────────────────────────────
// CountdownTimer — inline timer for 'time' type exercises
// ─────────────────────────────────────────────────────────────

function CountdownTimer({
  targetSeconds,
  onComplete,
}: {
  targetSeconds: number;
  onComplete: (secs: number) => void;
}) {
  const [remaining, setRemaining] = useState(targetSeconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next === 3) beep(880, 0.12);
        if (next === 2) beep(880, 0.12);
        if (next === 1) beep(880, 0.12);
        if (next <= 0) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          setFinished(true);
          // Double-beep completion tone
          beep(1047, 0.25, 0.6);
          setTimeout(() => beep(1319, 0.4, 0.55), 280);
          onComplete(targetSeconds);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setFinished(false);
    setRemaining(targetSeconds);
  };

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = targetSeconds > 0 ? (targetSeconds - remaining) / targetSeconds : 0;

  return (
    <div className="mt-3 rounded-xl border border-cyan-800/40 bg-cyan-950/10 p-3">
      {/* Timer display */}
      <div className="flex items-center justify-between mb-2.5">
        <span className={cn(
          'font-headline tabular-nums tracking-widest text-2xl transition-colors',
          finished ? 'text-green-400' : running ? 'text-cyan-300' : 'text-zinc-300',
        )}>
          {minutes > 0 ? `${minutes}:${String(secs).padStart(2, '0')}` : `${secs}s`}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setRunning((v) => !v)}
            disabled={finished}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-all border',
              finished
                ? 'border-zinc-700 text-zinc-600 cursor-not-allowed'
                : running
                  ? 'border-amber-500/60 bg-amber-950/30 text-amber-300 hover:bg-amber-950/50'
                  : 'border-cyan-500/60 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-950/50',
            )}
            title={running ? 'Pause' : 'Start'}
          >
            {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={reset}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-all"
            title="Reset"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000 ease-linear',
            finished ? 'bg-green-400' : 'bg-cyan-400',
          )}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {finished && (
        <p className="text-[9px] text-green-400 mt-1.5 text-center uppercase tracking-widest font-headline">
          Hold logged ✓
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Boost Finisher options
// ─────────────────────────────────────────────────────────────

interface BoostOption {
  id: string;          // matches CORE_EXERCISES id
  boostType: string;   // e.g. "Isometric Boost"
  name: string;
  timerOnly: boolean;  // true = timer only; false = reps OR 60s AMRAP
}

const BOOST_OPTIONS: BoostOption[] = [
  { id: 'plank',            boostType: 'Isometric Boost',  name: 'Plank',             timerOnly: true  },
  { id: 'russian-twist',    boostType: 'Oblique Boost',    name: 'Russian Twists',    timerOnly: false },
  { id: 'bicycle-crunch',   boostType: 'Oblique Boost',    name: 'Bicycle Crunches',  timerOnly: false },
  { id: 'mountain-climber', boostType: 'Metabolic Boost',  name: 'Mountain Climbers', timerOnly: false },
  { id: 'glute-bridge-hold',boostType: 'Posterior Boost',  name: 'Glute Bridge Hold', timerOnly: false },
  { id: 'dead-bug',         boostType: 'Stability Boost',  name: 'Dead Bugs',         timerOnly: true  },
];

// ─────────────────────────────────────────────────────────────
// SessionLogger — the modal to log a core session
// ─────────────────────────────────────────────────────────────

interface SessionLoggerProps {
  program: CoreProgram;
  session: GeneratedCoreSession;
  onClose: () => void;
  onComplete: (log: Omit<CoreSessionLog, 'id'>) => Promise<void>;
}

function SessionLogger({ program, session, onClose, onComplete }: SessionLoggerProps) {
  const { user } = useAuth();

  // ── Draft hydration — restore in-progress sets/performance from localStorage ──
  const draftKey = buildCoreDraftKey(program.id, session.index);
  const [completedSets, setCompletedSets] = useState<Record<string, Set<number>>>(
    () => {
      const d = loadRawDraft<CoreDraft>(draftKey);
      if (!d?.completedSets) return {};
      return Object.fromEntries(
        Object.entries(d.completedSets).map(([k, v]) => [k, new Set(v)]),
      );
    },
  );
  const [performance, setPerformance] = useState<
    Record<string, { weight?: number; reps?: number; seconds?: number }>
  >(() => loadRawDraft<CoreDraft>(draftKey)?.performance ?? {});
  const [cuesModal, setCuesModal] = useState<CoreExercise | null>(null);
  const [saving, setSaving] = useState(false);
  const [startTime] = useState<number>(
    () => loadRawDraft<CoreDraft>(draftKey)?.startTime ?? Date.now(),
  );

  // ── Ad-hoc exercises added during this session (not saved to program) ──
  const [addExOpen, setAddExOpen] = useState(false);
  const [addedItems, setAddedItems] = useState<{ ex: CoreExercise; sets: number }[]>([]);

  // ── Boost / finisher ──
  const [boostOpen, setBoostOpen] = useState(false);
  const [boostChoice, setBoostChoice] = useState<BoostOption | null>(null);
  const [boostMode, setBoostMode] = useState<'timer' | 'reps'>('timer');
  const [boostSeconds, setBoostSeconds] = useState(60);
  const [boostDone, setBoostDone] = useState(false);

  const exercises = session.slots
    .map((slot) => {
      const ex = CORE_EXERCISES.find((e) => e.id === slot.exerciseId);
      return ex ? { slot, ex } : null;
    })
    .filter((item): item is { slot: CoreSlot; ex: CoreExercise } => item !== null);

  const getSetsCompleted = (exId: string) => completedSets[exId]?.size ?? 0;
  const isFullyDone = (exId: string, totalSets: number) =>
    totalSets > 0 && getSetsCompleted(exId) === totalSets;
  const isPartial = (exId: string, totalSets: number) => {
    const c = getSetsCompleted(exId);
    return c > 0 && c < totalSets;
  };

  const toggleSet = (exId: string, setIdx: number) => {
    setCompletedSets((prev) => {
      const existing = new Set(prev[exId] ?? []);
      existing.has(setIdx) ? existing.delete(setIdx) : existing.add(setIdx);
      return { ...prev, [exId]: existing };
    });
  };

  const updatePerf = (
    id: string,
    field: 'weight' | 'reps' | 'seconds',
    val: number,
  ) => {
    setPerformance((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [field]: val },
    }));
  };

  // ── Added-exercise derived slots ──
  const addedItemsWithSlots = addedItems.map(({ ex, sets }) => ({
    ex,
    slot: { exerciseId: ex.id, type: ex.type as CoreSlot['type'], sets, targetReps: ex.baseReps, targetSeconds: ex.baseSeconds } as CoreSlot,
  }));

  const allDone =
    exercises.length > 0 &&
    exercises.every(({ slot, ex }) => isFullyDone(ex.id, slot.sets)) &&
    addedItemsWithSlots.every(({ slot, ex }) => isFullyDone(ex.id, slot.sets)) &&
    (!boostChoice || boostDone);
  const totalSetsAll =
    exercises.reduce((acc, { slot }) => acc + slot.sets, 0) +
    addedItemsWithSlots.reduce((acc, { slot }) => acc + slot.sets, 0) +
    (boostChoice ? 1 : 0);
  const completedSetsAll =
    exercises.reduce((acc, { ex }) => acc + getSetsCompleted(ex.id), 0) +
    addedItemsWithSlots.reduce((acc, { ex }) => acc + getSetsCompleted(ex.id), 0) +
    (boostDone ? 1 : 0);

  const coreDraftData = useMemo(
    () => ({
      completedSets: Object.fromEntries(
        Object.entries(completedSets).map(([k, v]) => [k, Array.from(v)]),
      ),
      performance,
      startTime,
    }),
    [completedSets, performance, startTime],
  );
  const { persistNow: persistCoreDraft } = useLocalDraft(draftKey, coreDraftData);
  const isCoreDirty = completedSetsAll > 0;

  // Browser-level guard: warn on tab close / hard refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isCoreDirty) return;
      e.preventDefault();
      persistCoreDraft();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isCoreDirty, persistCoreDraft]);

  const handleComplete = async () => {
    setSaving(true);
    try {
      const durationMinutes = Math.round((Date.now() - startTime) / 60000);
      const log: Omit<CoreSessionLog, 'id'> = {
        userId: user?.uid ?? '',
        programId: program.id,
        programName: program.name,
        sessionIndex: session.index,
        week: session.week,
        label: session.label,
        date: localDateStr(),
        slotsCompleted: [
          ...exercises
            .filter(({ slot, ex }) => isFullyDone(ex.id, slot.sets))
            .map(({ ex }) => ex.id),
          ...addedItemsWithSlots
            .filter(({ slot, ex }) => isFullyDone(ex.id, slot.sets))
            .map(({ ex }) => ex.id),
          ...(boostChoice && boostDone ? [`boost-${boostChoice.id}`] : []),
        ],
        performanceData: performance,
        durationMinutes: Math.max(durationMinutes, 1),
        completed: true,
      };
      await onComplete(log);
      clearRawDraft(draftKey);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-950 border border-orange-500/40 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.2)] flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
          <div>
            <h2 className="font-headline text-orange-300 text-base uppercase tracking-widest">
              {session.label}
            </h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              Week {session.week} · {program.name} · ~{session.estimatedMinutes}m
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {exercises.map(({ slot, ex }) => {
            const done = isFullyDone(ex.id, slot.sets);
            const partial = isPartial(ex.id, slot.sets);
            const perf = performance[ex.id] ?? {};

            return (
              <div
                key={ex.id}
                className={cn(
                  'rounded-xl border p-4 transition-all duration-200',
                  done
                    ? 'border-green-500/50 bg-green-950/15 shadow-[0_0_12px_rgba(74,222,128,0.1)]'
                    : partial
                      ? 'border-yellow-500/50 bg-yellow-950/10 shadow-[0_0_8px_rgba(234,179,8,0.08)]'
                      : 'border-zinc-800 bg-zinc-900/60',
                )}
              >
                {/* Exercise header row */}
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        'text-sm font-headline',
                        done ? 'text-green-300' : partial ? 'text-yellow-300' : 'text-zinc-100',
                      )}>
                        {ex.name}
                      </span>
                      <span className="text-[9px] font-headline uppercase tracking-wider text-orange-500 border border-orange-800/40 rounded px-1.5 py-0.5">
                        {ex.category}
                      </span>
                    </div>
                    {/* Prescription */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={cn(
                        'text-xs',
                        done ? 'text-green-400/70' : partial ? 'text-yellow-400/70' : 'text-zinc-400',
                      )}>
                        {slot.sets} sets
                        {slot.type === 'time' && slot.targetSeconds
                          ? ` × ${slot.targetSeconds}s`
                          : slot.targetReps
                            ? ` × ${slot.targetReps} reps`
                            : ''}
                      </span>
                      <span className={cn(
                        'text-[9px] font-headline uppercase tracking-wider rounded px-1.5 py-0.5 border',
                        ex.type === 'weighted'
                          ? 'text-amber-400 border-amber-800/40'
                          : ex.type === 'time'
                            ? 'text-cyan-400 border-cyan-800/40'
                            : 'text-zinc-400 border-zinc-700',
                      )}>
                        {ex.type}
                      </span>
                    </div>
                    {/* Per-set dots */}
                    <div className="flex items-center gap-2 mt-2.5">
                      {Array.from({ length: slot.sets }, (_, i) => {
                        const checked = completedSets[ex.id]?.has(i) ?? false;
                        return (
                          <button
                            key={i}
                            onClick={() => toggleSet(ex.id, i)}
                            className={cn(
                              'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                              done && checked
                                ? 'border-green-500 bg-green-500 shadow-[0_0_6px_rgba(74,222,128,0.5)]'
                                : checked
                                  ? 'border-yellow-400 bg-yellow-400 shadow-[0_0_4px_rgba(234,179,8,0.4)]'
                                  : 'border-zinc-600 hover:border-zinc-400 bg-transparent',
                            )}
                          >
                            {checked && <div className="w-2 h-2 rounded-full bg-zinc-950" />}
                          </button>
                        );
                      })}
                      {done && <Check className="w-3.5 h-3.5 text-green-400 ml-0.5" />}
                    </div>
                  </div>
                  <button
                    onClick={() => setCuesModal(ex)}
                    className="p-1 text-zinc-600 hover:text-orange-400 transition-colors flex-shrink-0"
                    title="Form cues"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>

                {/* Performance inputs (shown when not yet done) */}
                {!done && (
                  <div className={cn('mt-3', slot.type === 'time' ? 'flex flex-col gap-0' : 'flex gap-2')}>
                    {slot.type === 'weighted' && (
                      <div className="flex-1">
                        <label className="text-xs text-zinc-300 uppercase tracking-wider block mb-1">Weight (lbs)</label>
                        <input
                          type="number"
                          min={0}
                          value={perf.weight ?? ''}
                          onChange={(e) => updatePerf(ex.id, 'weight', Number(e.target.value))}
                          placeholder="0"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    )}
                    {slot.type === 'reps' && (
                      <div className="flex-1">
                        <label className="text-xs text-zinc-300 uppercase tracking-wider block mb-1">Reps Performed</label>
                        <input
                          type="number"
                          min={0}
                          value={perf.reps ?? ''}
                          onChange={(e) => updatePerf(ex.id, 'reps', Number(e.target.value))}
                          placeholder={slot.targetReps?.split('–')[0] ?? '0'}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    )}
                    {slot.type === 'time' && (
                      <CountdownTimer
                        targetSeconds={slot.targetSeconds ?? 30}
                        onComplete={(secs) => updatePerf(ex.id, 'seconds', secs)}
                      />
                    )}
                    {slot.type === 'time' && (
                      <div className="flex-1 mt-2">
                        <label className="text-xs text-zinc-300 uppercase tracking-wider block mb-1">Seconds Held</label>
                        <input
                          type="number"
                          min={0}
                          value={perf.seconds ?? ''}
                          onChange={(e) => updatePerf(ex.id, 'seconds', Number(e.target.value))}
                          placeholder={String(slot.targetSeconds ?? 30)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* ── Added-exercise cards ── */}
          {addedItemsWithSlots.map(({ slot, ex }, idx) => {
            const done = isFullyDone(ex.id, slot.sets);
            const partial = isPartial(ex.id, slot.sets);
            const perf = performance[ex.id] ?? {};
            return (
              <div
                key={`added-${ex.id}-${idx}`}
                className={cn(
                  'rounded-xl border p-4 transition-all duration-200',
                  done
                    ? 'border-green-500/50 bg-green-950/15 shadow-[0_0_12px_rgba(74,222,128,0.1)]'
                    : partial
                      ? 'border-yellow-500/50 bg-yellow-950/10 shadow-[0_0_8px_rgba(234,179,8,0.08)]'
                      : 'border-zinc-700 bg-zinc-900/60',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-sm font-headline', done ? 'text-green-300' : partial ? 'text-yellow-300' : 'text-zinc-100')}>
                        {ex.name}
                      </span>
                      <span className="text-[9px] font-headline uppercase tracking-wider text-orange-500 border border-orange-800/40 rounded px-1.5 py-0.5">
                        {ex.category}
                      </span>
                      <span className="text-[9px] font-headline uppercase tracking-wider text-cyan-400 border border-cyan-800/40 rounded px-1.5 py-0.5">
                        added
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={cn('text-xs', done ? 'text-green-400/70' : partial ? 'text-yellow-400/70' : 'text-zinc-400')}>
                        {slot.sets} sets
                        {slot.type === 'time' && slot.targetSeconds
                          ? ` × ${slot.targetSeconds}s`
                          : slot.targetReps
                            ? ` × ${slot.targetReps} reps`
                            : ''}
                      </span>
                      <span className={cn('text-[9px] font-headline uppercase tracking-wider rounded px-1.5 py-0.5 border',
                        ex.type === 'weighted' ? 'text-amber-400 border-amber-800/40'
                        : ex.type === 'time' ? 'text-cyan-400 border-cyan-800/40'
                        : 'text-zinc-400 border-zinc-700',
                      )}>
                        {ex.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2.5">
                      {Array.from({ length: slot.sets }, (_, i) => {
                        const checked = completedSets[ex.id]?.has(i) ?? false;
                        return (
                          <button
                            key={i}
                            onClick={() => toggleSet(ex.id, i)}
                            className={cn(
                              'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                              done && checked
                                ? 'border-green-500 bg-green-500 shadow-[0_0_6px_rgba(74,222,128,0.5)]'
                                : checked
                                  ? 'border-yellow-400 bg-yellow-400 shadow-[0_0_4px_rgba(234,179,8,0.4)]'
                                  : 'border-zinc-600 hover:border-zinc-400 bg-transparent',
                            )}
                          >
                            {checked && <div className="w-2 h-2 rounded-full bg-zinc-950" />}
                          </button>
                        );
                      })}
                      {done && <Check className="w-3.5 h-3.5 text-green-400 ml-0.5" />}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => setCuesModal(ex)}
                      className="p-1 text-zinc-600 hover:text-orange-400 transition-colors"
                      title="Form cues"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setAddedItems((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {!done && (
                  <div className={cn('mt-3', slot.type === 'time' ? 'flex flex-col gap-0' : 'flex gap-2')}>
                    {slot.type === 'weighted' && (
                      <div className="flex-1">
                        <label className="text-xs text-zinc-300 uppercase tracking-wider block mb-1">Weight (lbs)</label>
                        <input type="number" min={0} value={perf.weight ?? ''} onChange={(e) => updatePerf(ex.id, 'weight', Number(e.target.value))} placeholder="0" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors" />
                      </div>
                    )}
                    {slot.type === 'reps' && (
                      <div className="flex-1">
                        <label className="text-xs text-zinc-300 uppercase tracking-wider block mb-1">Reps Performed</label>
                        <input type="number" min={0} value={perf.reps ?? ''} onChange={(e) => updatePerf(ex.id, 'reps', Number(e.target.value))} placeholder={slot.targetReps?.split('–')[0] ?? '0'} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors" />
                      </div>
                    )}
                    {slot.type === 'time' && (
                      <>
                        <CountdownTimer targetSeconds={slot.targetSeconds ?? 30} onComplete={(secs) => updatePerf(ex.id, 'seconds', secs)} />
                        <div className="flex-1 mt-2">
                          <label className="text-xs text-zinc-300 uppercase tracking-wider block mb-1">Seconds Held</label>
                          <input type="number" min={0} value={perf.seconds ?? ''} onChange={(e) => updatePerf(ex.id, 'seconds', Number(e.target.value))} placeholder={String(slot.targetSeconds ?? 30)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors" />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* ── Add Exercise + BOOST buttons ── */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setAddExOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-zinc-700 text-zinc-500 hover:border-orange-500/50 hover:text-orange-400 transition-all text-xs font-headline uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5" /> Add Exercise
            </button>
            {!boostChoice && (
              <button
                onClick={() => setBoostOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-amber-700/40 text-amber-600 hover:border-amber-500/60 hover:text-amber-400 hover:bg-amber-950/10 transition-all text-xs font-headline uppercase tracking-wider"
              >
                <Zap className="w-3.5 h-3.5" /> Boost
              </button>
            )}
          </div>

          {/* ── Boost / Finisher card ── */}
          {boostChoice && (
            <div className="rounded-xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-950/20 to-zinc-900 p-4 shadow-[0_0_20px_rgba(245,158,11,0.12)]">
              {/* Boost header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="text-[9px] font-headline uppercase tracking-wider text-amber-400">{boostChoice.boostType}</span>
                  <span className="text-sm font-headline text-amber-200">{boostChoice.name}</span>
                </div>
                <button
                  onClick={() => { setBoostChoice(null); setBoostDone(false); }}
                  className="p-1 text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Remove finisher"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Timer-only boosts (Plank, Dead Bugs) */}
              {boostChoice.timerOnly && (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <label className="text-xs text-zinc-400 flex-shrink-0">Duration (s)</label>
                    <input
                      type="number"
                      min={10}
                      max={300}
                      value={boostSeconds}
                      onChange={(e) => setBoostSeconds(Math.max(10, Number(e.target.value)))}
                      className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <CountdownTimer
                    key={`boost-timer-${boostSeconds}`}
                    targetSeconds={boostSeconds}
                    onComplete={() => setBoostDone(true)}
                  />
                </>
              )}

              {/* Reps-or-timer boosts */}
              {!boostChoice.timerOnly && (
                <>
                  {/* Mode toggle */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setBoostMode('reps')}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg border text-xs font-headline uppercase tracking-wider transition-all',
                        boostMode === 'reps'
                          ? 'border-amber-500 bg-amber-950/30 text-amber-300'
                          : 'border-zinc-700 text-zinc-500 hover:border-zinc-500',
                      )}
                    >
                      Reps
                    </button>
                    <button
                      onClick={() => setBoostMode('timer')}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg border text-xs font-headline uppercase tracking-wider transition-all',
                        boostMode === 'timer'
                          ? 'border-amber-500 bg-amber-950/30 text-amber-300'
                          : 'border-zinc-700 text-zinc-500 hover:border-zinc-500',
                      )}
                    >
                      AMRAP
                    </button>
                  </div>

                  {boostMode === 'reps' && (
                    <div>
                      <label className="text-xs text-zinc-400 uppercase tracking-wider block mb-1">Reps Performed</label>
                      <input
                        type="number"
                        min={0}
                        value={performance[`boost-${boostChoice.id}`]?.reps ?? ''}
                        onChange={(e) => {
                          updatePerf(`boost-${boostChoice.id}`, 'reps', Number(e.target.value));
                          if (Number(e.target.value) > 0) setBoostDone(true);
                        }}
                        placeholder="0"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  )}

                  {boostMode === 'timer' && (
                    <>
                      <p className="text-[9px] text-amber-400/70 uppercase tracking-wider mb-2">AMRAP — max reps until the clock stops</p>
                      <div className="flex items-center gap-3 mb-3">
                        <label className="text-xs text-zinc-400 flex-shrink-0">Duration (s)</label>
                        <input
                          type="number"
                          min={10}
                          max={300}
                          value={boostSeconds}
                          onChange={(e) => setBoostSeconds(Math.max(10, Number(e.target.value)))}
                          className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                      <CountdownTimer
                        key={`boost-amrap-${boostSeconds}-${boostChoice.id}`}
                        targetSeconds={boostSeconds}
                        onComplete={() => setBoostDone(true)}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer — stacked layout prevents overflow on small screens */}
        <div className="border-t border-zinc-800 flex-shrink-0 px-5 pt-3 pb-5 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">{completedSetsAll}/{totalSetsAll} sets</span>
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm font-headline uppercase tracking-wider transition-all"
            >
              Cancel
            </button>
          </div>
          <button
            onClick={handleComplete}
            disabled={saving || completedSetsAll === 0}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-headline uppercase tracking-widest transition-all',
              allDone
                ? 'border-green-500 bg-green-600/25 text-green-200 shadow-[0_0_20px_rgba(74,222,128,0.3)]'
                : 'border-orange-500 bg-orange-600/20 text-orange-200 shadow-[0_0_12px_rgba(249,115,22,0.25)]',
              'disabled:opacity-40',
            )}
          >
            <Flame className="w-4 h-4" />
            {saving ? 'Logging…' : allDone ? 'Session Complete' : 'Log Progress'}
          </button>
        </div>
      </div>

      {/* Cues modal */}
      {cuesModal && (        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setCuesModal(null)}
        >
          <div
            className="w-full max-w-sm bg-zinc-950 border border-orange-500/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(249,115,22,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline text-orange-300 text-sm uppercase tracking-widest">{cuesModal.name}</h3>
              <button onClick={() => setCuesModal(null)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="space-y-2">
              {cuesModal.cues.map((cue, i) => (
                <li key={i} className="flex gap-2 text-xs text-zinc-300">
                  <span className="text-orange-500 font-headline flex-shrink-0">{i + 1}.</span>
                  {cue}
                </li>
              ))}
            </ol>
            {cuesModal.progression && (
              <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-[10px] font-headline text-orange-400 uppercase tracking-wider mb-1">Progression</p>
                <p className="text-xs text-zinc-400">{cuesModal.progression}</p>
              </div>
            )}
            {cuesModal.regression && (
              <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-[10px] font-headline text-zinc-500 uppercase tracking-wider mb-1">Regression</p>
                <p className="text-xs text-zinc-500">{cuesModal.regression}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Boost picker modal */}
      {boostOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setBoostOpen(false)}
        >
          <div
            className="w-full max-w-xs bg-zinc-950 border border-amber-500/40 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.2)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="font-headline text-amber-300 text-sm uppercase tracking-widest">Choose Your Finisher</h3>
              </div>
              <button onClick={() => setBoostOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 space-y-2">
              {BOOST_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setBoostChoice(opt);
                    setBoostMode('timer');
                    setBoostSeconds(60);
                    setBoostDone(false);
                    setBoostOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-amber-500/50 hover:bg-amber-950/10 transition-all text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-headline uppercase tracking-wider text-amber-400 mb-0.5">{opt.boostType}</div>
                    <div className="text-sm text-zinc-100">{opt.name}</div>
                    <div className="text-[9px] text-zinc-500 mt-0.5">{opt.timerOnly ? '60s hold (editable)' : 'Reps or 60s AMRAP'}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Exercise picker */}
      {addExOpen && (
        <CoreExPickerModal
          excludedIds={[]}
          title="Add to Session"
          onPick={(ex) => {
            setAddedItems((prev) => [...prev, { ex, sets: ex.defaultSets }]);
            setAddExOpen(false);
          }}
          onClose={() => setAddExOpen(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CoreEditModal — reorder exercises for an existing program
// ─────────────────────────────────────────────────────────────

// Near-equivalent helper (same as wizard)
function getCoreNearEquivalents(ex: CoreExercise, excluded: string[]): CoreExercise[] {
  const LEVEL_ORDER: CoreFitnessLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
  const myLevelIdx = LEVEL_ORDER.indexOf(ex.level);
  return CORE_EXERCISES.filter((candidate) => {
    if (candidate.id === ex.id) return false;
    if (excluded.includes(candidate.id)) return false;
    const cidx = LEVEL_ORDER.indexOf(candidate.level);
    return (
      (candidate.category === ex.category && Math.abs(cidx - myLevelIdx) <= 1) ||
      (candidate.type === ex.type && candidate.category === ex.category)
    );
  }).slice(0, 8);
}

// Picker modal (self-contained for this file)
function CoreExPickerModal({
  swapTarget,
  excludedIds,
  title,
  onPick,
  onClose,
}: {
  swapTarget?: CoreExercise;
  excludedIds: string[];
  title: string;
  onPick: (ex: CoreExercise) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  const nearEquivalents = useMemo(
    () => (swapTarget ? getCoreNearEquivalents(swapTarget, excludedIds) : []),
    [swapTarget, excludedIds],
  );

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return CORE_EXERCISES.filter(
      (e) =>
        !excludedIds.includes(e.id) &&
        e.id !== swapTarget?.id &&
        (e.name.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.level.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q)),
    );
  }, [search, excludedIds, swapTarget]);

  const allGrouped = useMemo(() => {
    if (search.trim() || swapTarget) return null;
    const groups: Record<string, CoreExercise[]> = {};
    for (const ex of CORE_EXERCISES) {
      if (excludedIds.includes(ex.id)) continue;
      if (!groups[ex.category]) groups[ex.category] = [];
      groups[ex.category].push(ex);
    }
    return groups;
  }, [search, excludedIds, swapTarget]);

  const ExRow = ({ ex, isNear = false }: { ex: CoreExercise; isNear?: boolean }) => (
    <button
      onClick={() => onPick(ex)}
      className={cn(
        'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg border text-left transition-all',
        isNear
          ? 'border-orange-500/40 bg-orange-950/10 hover:border-orange-400 hover:bg-orange-950/25'
          : 'border-zinc-800 bg-zinc-900 hover:border-orange-500/40 hover:bg-orange-950/10',
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-zinc-100">{ex.name}</span>
          {isNear && (
            <span className="text-[9px] font-headline uppercase tracking-wider text-orange-400 border border-orange-700/50 rounded px-1 bg-orange-950/30">
              near match
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[9px] font-headline uppercase tracking-wider text-orange-500 border border-orange-800/40 rounded px-1">
            {ex.category}
          </span>
          <span className="text-[9px] text-zinc-500 capitalize">{ex.level}</span>
          <span className="text-[9px] text-zinc-600 capitalize">{ex.type}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-zinc-950 border border-orange-500/40 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.2)] flex flex-col max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800 flex-shrink-0">
          <h3 className="font-headline text-orange-300 text-sm uppercase tracking-widest">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-3 border-b border-zinc-900 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search all exercises…"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors placeholder:text-zinc-600"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {search.trim() && (
            <div className="space-y-1.5">
              {searchResults.length === 0 ? (
                <p className="text-zinc-600 text-sm text-center py-4">No results for &ldquo;{search}&rdquo;</p>
              ) : (
                searchResults.map((ex) => <ExRow key={ex.id} ex={ex} />)
              )}
            </div>
          )}
          {!search.trim() && swapTarget && (
            <>
              {nearEquivalents.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] font-headline uppercase tracking-wider text-orange-400 mb-2">
                    Near Equivalents for {swapTarget.name}
                  </p>
                  {nearEquivalents.map((ex) => <ExRow key={ex.id} ex={ex} isNear />)}
                </div>
              )}
              <div className="space-y-1.5">
                <p className="text-[9px] font-headline uppercase tracking-wider text-zinc-500 mb-2">
                  All Other Exercises
                </p>
                {CORE_EXERCISES.filter(
                  (e) => !excludedIds.includes(e.id) && e.id !== swapTarget.id && !nearEquivalents.some((n) => n.id === e.id),
                ).map((ex) => <ExRow key={ex.id} ex={ex} />)}
              </div>
            </>
          )}
          {!search.trim() && !swapTarget && allGrouped && (
            Object.entries(allGrouped).map(([category, exList]) => (
              <div key={category} className="space-y-1.5">
                <p className="text-[9px] font-headline uppercase tracking-wider text-orange-500 mb-2">{category}</p>
                {exList.map((ex) => <ExRow key={ex.id} ex={ex} />)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface CoreEditModalProps {
  program: CoreProgram;
  onClose: () => void;
  onSave: (programId: string, order: Record<'single' | 'A' | 'B', string[]>) => Promise<void>;
}

function CoreEditModal({ program, onClose, onSave }: CoreEditModalProps) {
  const sessions = generateCoreProgram(
    program.fitnessLevel,
    program.goal,
    program.focusAreas,
    program.daysPerWeek,
    program.durationWeeks,
    program.customExerciseOrder,
    program.volumeIntensity ?? 2,
    program.maxModeEnabled ?? false,
  );

  const toExList = (ids: string[]): CoreExercise[] =>
    ids.map((id) => CORE_EXERCISES.find((e) => e.id === id)).filter((e): e is CoreExercise => !!e);

  const buildInitial = (): Record<'single' | 'A' | 'B', CoreExercise[]> => {
    if (program.customExerciseOrder) {
      return {
        single: toExList(program.customExerciseOrder.single),
        A: toExList(program.customExerciseOrder.A),
        B: toExList(program.customExerciseOrder.B),
      };
    }
    const sessionA = sessions.find((s) => s.label === 'Core A' || s.label.startsWith('Core Session'));
    const sessionB = sessions.find((s) => s.label === 'Core B');
    const slotsToEx = (s: typeof sessionA): CoreExercise[] =>
      s ? s.slots.map((slot) => CORE_EXERCISES.find((e) => e.id === slot.exerciseId)).filter((e): e is CoreExercise => !!e) : [];
    return {
      single: program.structure === 'single' ? slotsToEx(sessionA) : [],
      A: program.structure === 'AB' ? slotsToEx(sessionA) : [],
      B: program.structure === 'AB' ? slotsToEx(sessionB) : [],
    };
  };

  const [exercises, setExercises] = useState<Record<'single' | 'A' | 'B', CoreExercise[]>>(buildInitial);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'single' | 'A' | 'B'>(program.structure === 'AB' ? 'A' : 'single');
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dragIdxRef = useRef<number | null>(null);

  // Swap / add picker state
  const [swapTarget, setSwapTarget] = useState<{ ex: CoreExercise; idx: number } | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const current = exercises[tab];
  const excludedIds = current.map((e) => e.id);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(program.id, {
        single: exercises.single.map((e) => e.id),
        A: exercises.A.map((e) => e.id),
        B: exercises.B.map((e) => e.id),
      });
    } finally {
      setSaving(false);
    }
  };

  const reorder = (from: number, to: number) => {
    const arr = [...current];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setExercises({ ...exercises, [tab]: arr });
  };

  const removeEx = (idx: number) => {
    setExercises({ ...exercises, [tab]: current.filter((_, i) => i !== idx) });
  };

  const handleSwapPick = (picked: CoreExercise) => {
    if (!swapTarget) return;
    const arr = [...current];
    arr[swapTarget.idx] = picked;
    setExercises({ ...exercises, [tab]: arr });
    setSwapTarget(null);
  };

  const handleAddPick = (picked: CoreExercise) => {
    setExercises({ ...exercises, [tab]: [...current, picked] });
    setAddOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-950 border border-orange-500/40 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.2)] flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
          <div>
            <h2 className="font-headline text-orange-300 text-base uppercase tracking-widest">Edit Exercises</h2>
            <p className="text-sm text-zinc-400 mt-0.5 truncate max-w-[240px]">{program.name}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-sm text-zinc-400 leading-relaxed">
            Drag to reorder · Stylus to swap · Trash to remove · Add any exercise below.
          </p>

          {/* Tab switcher for AB */}
          {program.structure === 'AB' && (
            <div className="flex gap-2">
              {(['A', 'B'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'flex-1 py-2 rounded-lg border text-sm font-headline uppercase tracking-widest transition-all',
                    tab === t
                      ? 'border-orange-500 bg-orange-950/30 text-orange-300'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500',
                  )}
                >
                  Day {t}
                </button>
              ))}
            </div>
          )}

          {/* Exercise list */}
          <div className="space-y-2">
            {current.map((ex, idx) => (
              <div
                key={ex.id}
                draggable
                onDragStart={() => { dragIdxRef.current = idx; }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(idx); }}
                onDrop={() => {
                  if (dragIdxRef.current !== null && dragIdxRef.current !== idx) {
                    reorder(dragIdxRef.current, idx);
                  }
                  dragIdxRef.current = null;
                  setDragOver(null);
                }}
                onDragEnd={() => { dragIdxRef.current = null; setDragOver(null); }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg border bg-zinc-900 cursor-grab active:cursor-grabbing transition-all',
                  dragOver === idx ? 'border-orange-500/60 bg-orange-950/10' : 'border-zinc-800',
                )}
              >
                <GripVertical className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-200 truncate">{ex.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-headline uppercase tracking-wider text-orange-500 border border-orange-800/50 rounded px-1">
                      {ex.category}
                    </span>
                    <span className="text-[9px] text-zinc-500 capitalize">{ex.level}</span>
                    <span className="text-[9px] text-zinc-600 capitalize">{ex.type}</span>
                  </div>
                </div>
                {/* Swap */}
                <button
                  onClick={() => setSwapTarget({ ex, idx })}
                  className="p-1.5 text-zinc-600 hover:text-orange-300 transition-colors"
                  title="Swap exercise"
                >
                  <CyberStylus className="w-5 h-5" />
                </button>
                {/* Remove */}
                <button
                  onClick={() => removeEx(idx)}
                  className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                  title="Remove exercise"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Add exercise button */}
            <button
              onClick={() => setAddOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-zinc-700 text-zinc-500 hover:border-orange-500/50 hover:text-orange-400 transition-all text-sm"
            >
              <Plus className="w-4 h-4" /> Add Exercise
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t border-zinc-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm font-headline uppercase tracking-wider transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-orange-400 bg-orange-600/20 text-orange-200 hover:bg-orange-600/30 text-sm font-headline uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Swap picker */}
      {swapTarget && (
        <CoreExPickerModal
          swapTarget={swapTarget.ex}
          excludedIds={excludedIds}
          title={`Swap: ${swapTarget.ex.name}`}
          onPick={handleSwapPick}
          onClose={() => setSwapTarget(null)}
        />
      )}

      {/* Add picker */}
      {addOpen && (
        <CoreExPickerModal
          excludedIds={excludedIds}
          title="Add Exercise"
          onPick={handleAddPick}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CoreStatsModal — lifetime stats overlay
// ─────────────────────────────────────────────────────────────

function CoreStatsModal({ onClose }: { onClose: () => void }) {
  const { getCoreStats } = useCore();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getCoreStats>>>(null);
  const [loading, setLoading] = useState(true);

  useState(() => {
    getCoreStats().then((s) => { setStats(s); setLoading(false); });
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-zinc-950 border border-orange-500/40 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.2)] p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-headline text-orange-300 text-sm uppercase tracking-widest">Core Stats</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="text-zinc-600 text-sm">Loading…</div>
          </div>
        ) : !stats ? (
          <p className="text-zinc-500 text-sm text-center py-6">No sessions logged yet.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Sessions', value: stats.totalSessions },
                { label: 'Total Minutes', value: stats.totalMinutes },
                { label: 'Current Streak', value: `${stats.currentStreakWeeks}W` },
                { label: 'Longest Streak', value: `${stats.longestStreakWeeks}W` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                  <div className="text-[9px] font-headline uppercase tracking-wider text-zinc-500 mb-1">{label}</div>
                  <div className="text-lg font-headline text-orange-300">{value}</div>
                </div>
              ))}
            </div>

            {/* Heatmap (last 90 days) */}
            <div>
              <p className="text-[9px] font-headline uppercase tracking-wider text-zinc-500 mb-2">Last 90 Days</p>
              <div className="flex flex-wrap gap-0.5">
                {stats.heatmap.map(({ date, count }) => (
                  <div
                    key={date}
                    title={date}
                    className={cn(
                      'w-2.5 h-2.5 rounded-sm',
                      count === 0 ? 'bg-zinc-900' : count === 1 ? 'bg-orange-700' : 'bg-orange-400',
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Program breakdown */}
            {stats.programBreakdown.length > 0 && (
              <div>
                <p className="text-[9px] font-headline uppercase tracking-wider text-zinc-500 mb-2">By Program</p>
                <div className="space-y-1.5">
                  {stats.programBreakdown.map(({ programName, sessions }) => (
                    <div key={programName} className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 truncate">{programName}</span>
                      <span className="text-xs font-headline text-orange-300">{sessions}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CoreCard — individual program card
// ─────────────────────────────────────────────────────────────

interface CoreCardProps {
  program: CoreProgram;
  onDelete: () => void;
  onEdit: () => void;
}

function CoreCard({ program, onDelete, onEdit }: CoreCardProps) {
  const { logSession, undoSession } = useCore();
  const { toast } = useToast();
  const [activeSession, setActiveSession] = useState<GeneratedCoreSession | null>(null);
  const [pendingUndo, setPendingUndo] = useState<number | null>(null);
  const [undoing, setUndoing] = useState(false);

  const sessions = generateCoreProgram(
    program.fitnessLevel,
    program.goal,
    program.focusAreas,
    program.daysPerWeek,
    program.durationWeeks,
    program.customExerciseOrder,
    program.volumeIntensity ?? 2,
    program.maxModeEnabled ?? false,
  );

  const todayStr = localDateStr();
  const weekStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const sessionsThisWeek =
    program.weeklyLog?.weekStr === weekStr ? program.weeklyLog.count : 0;

  const progressPct = Math.min(
    100,
    Math.round((program.sessionsCompleted / (program.totalSessions || 1)) * 100),
  );

  const weekStart = program.startDate
    ? Math.floor(differenceInCalendarDays(new Date(), parseISO(program.startDate)) / 7) + 1
    : null;
  const currentWeek = weekStart ? Math.min(weekStart, program.durationWeeks) : null;

  const doneToday = program.lastSessionDate === todayStr;
  const nextIdx = program.lastSessionIndex + 1;

  // Current week's sessions to display
  const currentWeekSessions = currentWeek
    ? sessions.filter((s) => s.week === currentWeek)
    : sessions.slice(0, program.daysPerWeek);

  const lastIdx = program.lastSessionIndex;
  const isComplete = program.sessionsCompleted >= program.totalSessions;

  const handleLogComplete = async (log: Omit<CoreSessionLog, 'id'>) => {
    try {
      await logSession(log, program.id);
      toast({
        title: 'Session Logged',
        description: `${log.slotsCompleted.length} exercises completed.`,
      });
      setActiveSession(null);
    } catch {
      toast({ title: 'Error saving session', variant: 'destructive' });
    }
  };

  return (
    <>
      <div className="rounded-xl border border-orange-500/30 bg-gradient-to-br from-zinc-950 via-[#120a00] to-[#0f0800] p-4 space-y-4 overflow-hidden shadow-[0_0_20px_rgba(249,115,22,0.07)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-headline text-orange-300 text-lg">{program.name}</h3>
              {isComplete && (
                <span className="text-[9px] font-headline uppercase tracking-wider text-green-400 border border-green-500/40 rounded px-1.5 py-0.5 bg-green-950/20">
                  Complete
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={cn('text-[9px] font-headline uppercase tracking-wider border rounded px-1.5 py-0.5', LEVEL_BADGE[program.fitnessLevel])}>
                {program.fitnessLevel}
              </span>
              <span className={cn('text-[9px] font-headline uppercase tracking-wider', GOAL_COLORS[program.goal])}>
                {program.goal}
              </span>
              <span className="text-xs text-zinc-400">
                {program.daysPerWeek}× / week
                {program.structure === 'AB' && <span className="text-zinc-600 ml-1">A/B</span>}
              </span>
            </div>

            {/* Focus area tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {program.focusAreas.map((area) => (
                <span
                  key={area}
                  className="text-[9px] font-headline uppercase tracking-wider text-orange-400 border border-orange-500/30 rounded px-1.5 py-0.5 bg-orange-950/20"
                >
                  {area}
                </span>
              ))}
            </div>

            {/* Progress bar */}
            {program.startDate && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-zinc-400 mb-0.5">
                  <span>
                    {currentWeek ? `Week ${currentWeek} of ${program.durationWeeks}` : 'Progress'}
                  </span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      progressPct >= 100 ? 'bg-orange-400' : 'bg-orange-600',
                    )}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Stats + actions */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-sm text-orange-300 font-headline">
                  {sessionsThisWeek}/{program.daysPerWeek}
                </span>
              </div>
              <div className="text-xs text-zinc-300">this week</div>
            </div>
            <BanishmentPortal onConfirm={onDelete} ritualTitle={program.name}>
              <button
                className="p-1.5 rounded transition-colors text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]"
                title="Remove program"
              >
                <DuamatefJar className="w-7 h-7" />
              </button>
            </BanishmentPortal>
            <button
              onClick={onEdit}
              className="p-1.5 rounded transition-colors text-zinc-500 hover:text-orange-400 hover:bg-zinc-800"
              title="Edit exercises"
            >
              <CyberStylus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Last session */}
        {program.lastSessionDate && (
          <div className="flex items-center gap-2 text-sm text-zinc-200">
            <Calendar className="w-3.5 h-3.5" />
            Last: {format(parseISO(program.lastSessionDate), 'EEE, MMM d')}
          </div>
        )}

        {/* Session tabs */}
        {currentWeekSessions.length > 0 && !isComplete && (
          <>
            <p className={cn('text-[10px] font-headline uppercase tracking-widest', doneToday ? 'text-green-400' : 'text-zinc-400')}>
              {doneToday
                ? 'Forged today — rest and recover.'
                : `${currentWeek ? `Week ${currentWeek}` : 'Current'} Sessions`}
            </p>
            <div className="flex flex-wrap gap-1">
              {currentWeekSessions.map((session) => {
                const isCompleted = session.index <= lastIdx && lastIdx >= 0;
                const isNextUp = !doneToday && session.index === nextIdx && nextIdx < program.totalSessions;

                return (
                  <button
                    key={session.index}
                    onClick={() => {
                      if (isCompleted) { setPendingUndo(session.index); }
                      else { setActiveSession(session); }
                    }}
                    className={cn(
                      'flex items-center justify-center px-3 py-2 rounded border text-xs font-headline uppercase tracking-wider transition-all duration-200 whitespace-nowrap',
                      isCompleted
                        ? 'border-green-500/60 text-green-300 bg-green-950/20 shadow-[0_0_8px_rgba(74,222,128,0.15)] hover:border-amber-500/60 hover:text-amber-300 cursor-pointer'
                        : isNextUp
                          ? 'border-orange-400 text-orange-200 bg-orange-950/30 shadow-[0_0_12px_rgba(249,115,22,0.5)] [animation:pulse_4s_ease-in-out_infinite] hover:bg-orange-950/50 cursor-pointer'
                          : 'border-zinc-800 text-zinc-400 hover:border-orange-600/40 hover:text-orange-300 hover:bg-orange-950/5 cursor-pointer',
                    )}
                  >
                    {isCompleted && <Check className="w-3 h-3 mr-1 text-green-400" />}
                    {session.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Undo confirmation strip */}
        {pendingUndo !== null && (() => {
          const s = currentWeekSessions.find((s) => s.index === pendingUndo);
          return (
            <div className="rounded border border-amber-500/40 bg-amber-950/15 px-3 py-2 flex items-center justify-between gap-2">
              <span className="text-xs text-amber-300 font-headline uppercase tracking-wide">
                Undo &ldquo;{s?.label ?? `Session ${pendingUndo + 1}`}&rdquo;?
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={async () => {
                    setUndoing(true);
                    try {
                      await undoSession(program.id, pendingUndo);
                      toast({ title: 'Session undone', description: 'Log erased — re-do it when ready.' });
                    } catch {
                      toast({ title: 'Error undoing session', variant: 'destructive' });
                    } finally {
                      setUndoing(false);
                      setPendingUndo(null);
                    }
                  }}
                  disabled={undoing}
                  className="px-2.5 py-1 rounded border border-red-500/50 bg-red-950/20 text-red-300 text-[10px] font-headline uppercase tracking-wider hover:bg-red-950/40 transition-all disabled:opacity-50"
                >
                  {undoing ? '…' : 'Undo'}
                </button>
                <button
                  onClick={() => setPendingUndo(null)}
                  className="px-2.5 py-1 rounded border border-zinc-700 text-zinc-400 text-[10px] font-headline uppercase tracking-wider hover:border-zinc-500 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        })()}

        {/* Program complete state */}
        {isComplete && (
          <div className="rounded-lg border border-green-500/30 bg-green-950/10 px-3 py-2.5 flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-xs text-green-300">
              Program complete! {program.sessionsCompleted} sessions logged.
            </p>
          </div>
        )}
      </div>

      {/* Session logger modal */}
      {activeSession && (
        <SessionLogger
          program={program}
          session={activeSession}
          onClose={() => setActiveSession(null)}
          onComplete={handleLogComplete}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// KhetCore — main dashboard section
// ─────────────────────────────────────────────────────────────

export function KhetCore() {
  const { programs, loading, deleteProgram, updateProgram } = useCore();
  const { toast } = useToast();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<CoreProgram | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      await deleteProgram(id);
      toast({ title: 'Core program removed' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleSaveEdit = async (
    programId: string,
    order: Record<'single' | 'A' | 'B', string[]>,
  ) => {
    try {
      await updateProgram(programId, { customExerciseOrder: order });
      toast({ title: 'Exercises updated' });
      setEditingProgram(null);
    } catch {
      toast({ title: 'Error saving changes', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="h-24 rounded-xl border border-orange-500/20 bg-zinc-950/30 animate-pulse" />
    );
  }

  return (
    <>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <h3 className="font-headline text-orange-400 text-sm uppercase tracking-widest">
            Core &amp; Abs Module
          </h3>
        </div>
        {programs.length > 0 && (
          <button
            onClick={() => setStatsOpen(true)}
            className="flex items-center gap-1 text-[10px] font-headline uppercase tracking-wider text-zinc-500 hover:text-orange-400 transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Stats
          </button>
        )}
      </div>

      {/* Program cards */}
      {programs.length === 0 ? (
        <div className="border border-dashed border-orange-500/20 rounded-xl p-8 text-center">
          <Flame className="w-8 h-8 text-orange-900 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No core program active.</p>
          <p className="text-zinc-700 text-xs mt-1">Beginner to Elite. Progressive. Science-based.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map((program) => (
            <CoreCard
              key={program.id}
              program={program}
              onDelete={() => handleDelete(program.id)}
              onEdit={() => setEditingProgram(program)}
            />
          ))}
        </div>
      )}

      <CoreProgramWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />

      {editingProgram && (
        <CoreEditModal
          program={editingProgram}
          onClose={() => setEditingProgram(null)}
          onSave={handleSaveEdit}
        />
      )}

      {statsOpen && <CoreStatsModal onClose={() => setStatsOpen(false)} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// CoreLaunchButton — standalone CTA for dashboard header area
// ─────────────────────────────────────────────────────────────

export function CoreLaunchButton() {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setWizardOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-orange-500/60 bg-orange-950/20 text-orange-300 hover:bg-orange-950/40 hover:border-orange-400 font-headline uppercase tracking-widest text-sm transition-all shadow-[0_0_14px_rgba(249,115,22,0.15)] hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-[0.98]"
      >
        <Flame className="w-4 h-4" />
        Create Core Program
      </button>
      <CoreProgramWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </>
  );
}
