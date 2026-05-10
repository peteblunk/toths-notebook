"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { format, parseISO, differenceInCalendarDays, startOfWeek } from 'date-fns';
import {
  Zap, Plus, TrendingUp, Calendar, X, Flame, Activity,
  Play, Pause, RotateCcw, Check, ChevronDown, Search, ArrowLeftRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCardio } from '@/hooks/use-cardio';
import { useKhet } from '@/hooks/use-khet';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  buildCardioDraftKey,
  loadRawDraft,
  clearRawDraft,
  useLocalDraft,
} from '@/hooks/use-session-persistence';

// Shape of the persisted cardio session draft
type CardioSegmentState = { exerciseId: string; exerciseName: string; minutes: string; done: boolean };
interface CardioDraft {
  segments: CardioSegmentState[];
  bpm: string;
  rpe: string;
  distance: string;
  notes: string;
  finisherDone: boolean;
  finisherTally: number;
  caloriesOverride: number | null;
  logPhase: 'active' | 'post';
}
import { BanishmentPortal } from '@/components/banishment-portal';
import { CardioProgramWizard } from './cardio-program-wizard';
import { DuamatefJar } from '@/components/icons/duamatef-jar';
import { CyberStylus } from '@/components/icons/cyber-stylus';
import {
  CARDIO_EXERCISES,
  generateCardioProgram,
  estimateCalories,
  lbsToKg,
  type CardioProgram,
  type CardioFitnessLevel,
  type CardioGoal,
  type CardioIntervalType,
  type CardioSessionLog,
  type GeneratedCardioSession,
  type CardioSegment,
  type CardioExerciseCategory,
} from '@/lib/endurance-types';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const LEVEL_BADGE: Record<CardioFitnessLevel, string> = {
  Novice:       'text-green-400 border-green-600/40 bg-green-950/20',
  Intermediate: 'text-yellow-400 border-yellow-600/40 bg-yellow-950/20',
  Elite:        'text-red-400 border-red-600/40 bg-red-950/20',
};

const GOAL_COLOR: Record<CardioGoal, string> = {
  'Fat Loss':        'text-orange-300',
  'Engine Building': 'text-cyan-300',
  'VO2 Max':         'text-red-300',
};

const INTERVAL_BADGE: Record<CardioIntervalType, string> = {
  Zone2:   'text-blue-300 border-blue-700/40 bg-blue-950/20',
  LSD:     'text-blue-400 border-blue-600/40 bg-blue-950/20',
  HIIT:    'text-red-300 border-red-700/40 bg-red-950/20',
  Tabata:  'text-orange-300 border-orange-700/40 bg-orange-950/20',
  Tempo:   'text-yellow-300 border-yellow-700/40 bg-yellow-950/20',
  Pyramid: 'text-purple-300 border-purple-700/40 bg-purple-950/20',
  EMOM:    'text-cyan-300 border-cyan-700/40 bg-cyan-950/20',
};

const CATEGORY_ORDER: CardioExerciseCategory[] = ['Machine', 'Bodyweight', 'Outdoor', 'Water'];

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function localDateStr(d: Date = new Date()): string {
  return format(d, 'yyyy-MM-dd');
}

// ─────────────────────────────────────────────────────────────
// ExercisePicker
// ─────────────────────────────────────────────────────────────
interface ExercisePickerProps {
  onSelect: (id: string, name: string) => void;
  onCancel: () => void;
  title?: string;
}

function ExercisePicker({ onSelect, onCancel, title = 'Select Exercise' }: ExercisePickerProps) {
  const [search, setSearch] = useState('');
  const filtered = CARDIO_EXERCISES.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
        <p className="text-[10px] font-headline uppercase tracking-widest text-zinc-400">{title}</p>
        <button onClick={onCancel} className="text-zinc-400 active:scale-90 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="px-3 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-zinc-600" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-700 focus:outline-none"
          />
        </div>
      </div>
      <div className="max-h-56 overflow-y-auto divide-y divide-zinc-800/60">
        {CATEGORY_ORDER.map((cat) => {
          const exercises = filtered.filter((e) => e.category === cat);
          if (exercises.length === 0) return null;
          return (
            <div key={cat}>
              <p className="text-[9px] font-headline uppercase tracking-widest text-zinc-600 px-4 py-1.5 bg-zinc-900/50">{cat}</p>
              {exercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => onSelect(ex.id, ex.name)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left active:bg-zinc-800/60 transition-colors"
                >
                  <span className="text-sm text-zinc-300 font-headline">{ex.name}</span>
                  <span className="text-[9px] text-zinc-600">MET {ex.metModerate}–{ex.metHigh}</span>
                </button>
              ))}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-zinc-600 text-xs text-center py-6">No exercises match</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RPE Info Popover
// ─────────────────────────────────────────────────────────────
const RPE_SCALE = [
  { range: '1–2', label: 'Very Easy',  desc: 'Barely breathing — full conversation' },
  { range: '3–4', label: 'Light',       desc: 'Comfortable, can sing or chat freely' },
  { range: '5–6', label: 'Moderate',    desc: 'Zone 2 — slightly winded, still talking' },
  { range: '7–8', label: 'Hard',        desc: 'Short phrases only, pushing effort' },
  { range: '9',    label: 'Very Hard',   desc: 'Near max — barely 1–2 words' },
  { range: '10',   label: 'Max Effort',  desc: 'All-out sprint — cannot speak' },
];
function rpeMatchesRange(rpe: number, range: string): boolean {
  if (range.includes('–')) {
    const [lo, hi] = range.split('–').map(Number);
    return rpe >= lo && rpe <= hi;
  }
  return rpe === Number(range);
}
function RPEInfoPopover({ targetRPE }: { targetRPE?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-zinc-600 text-zinc-400 text-[9px] font-bold leading-none flex-shrink-0 transition-all active:scale-90 hover:border-zinc-400 hover:text-zinc-200"
        aria-label="What is RPE?"
      >
        i
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed left-4 right-4 bottom-6 z-50 rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-headline uppercase tracking-widest text-zinc-200">Rate of Perceived Exertion</p>
              <button onClick={() => setOpen(false)} className="p-1 text-zinc-500 active:scale-90"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
              How hard the session <em>feels</em> on a 1–10 scale — no heart-rate monitor needed.
              {targetRPE !== undefined && <span className="text-red-300"> Your target for this session is <strong>{targetRPE}/10</strong>.</span>}
            </p>
            <div className="space-y-1">
              {RPE_SCALE.map(({ range, label, desc }) => {
                const isTarget = targetRPE !== undefined && rpeMatchesRange(targetRPE, range);
                return (
                  <div key={range} className={cn(
                    'flex items-start gap-3 rounded-lg px-2.5 py-1.5',
                    isTarget ? 'bg-red-950/40 border border-red-800/50' : 'bg-zinc-800/30',
                  )}>
                    <span className={cn('text-sm font-headline tabular-nums w-8 flex-shrink-0', isTarget ? 'text-red-300' : 'text-zinc-500')}>{range}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-headline', isTarget ? 'text-red-200' : 'text-zinc-200')}>
                        {label}{isTarget && <span className="text-xs text-red-400 ml-2">← target</span>}
                      </p>
                      <p className="text-xs text-zinc-500">{desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Interval Timer (Big Clock)
// ─────────────────────────────────────────────────────────────
function IntervalTimer({
  interval,
  onAllComplete,
}: {
  interval: NonNullable<GeneratedCardioSession['slot']['interval']>;
  onAllComplete: () => void;
}) {
  const [phase, setPhase] = useState<'work' | 'rest'>('work');
  const [remaining, setRemaining] = useState(interval.workSeconds);
  const [round, setRound] = useState(1);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const totalRounds = interval.rounds;

  const beep = (freq: number, dur: number, vol = 0.4) => {
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
    } catch { /* silent fail */ }
  };

  useEffect(() => {
    if (!running) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next === 3 || next === 2 || next === 1) beep(880, 0.1);
        if (next <= 0) {
          clearInterval(timerRef.current!);
          if (phase === 'work') {
            beep(660, 0.25, 0.5);
            setPhase('rest');
            setRemaining(interval.restSeconds);
            setRunning(true);
          } else {
            const nextRound = round + 1;
            if (nextRound > totalRounds) {
              beep(1047, 0.3, 0.6);
              setTimeout(() => beep(1319, 0.4, 0.55), 300);
              setRunning(false);
              setDone(true);
              onAllComplete();
            } else {
              beep(1047, 0.2, 0.5);
              setRound(nextRound);
              setPhase('work');
              setRemaining(interval.workSeconds);
              setRunning(true);
            }
          }
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, round]);

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false); setDone(false); setPhase('work');
    setRemaining(interval.workSeconds); setRound(1);
  };

  const progress = phase === 'work'
    ? (interval.workSeconds - remaining) / interval.workSeconds
    : (interval.restSeconds - remaining) / interval.restSeconds;

  return (
    <div className={cn('rounded-2xl border-2 p-5 transition-all',
      done ? 'border-green-500/60 bg-green-950/20'
        : phase === 'work' ? 'border-red-600/70 bg-red-950/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
        : 'border-zinc-600/50 bg-zinc-900/40')}>
      {/* Phase label */}
      <div className="flex items-center justify-center mb-1">
        <span className={cn('text-[10px] font-headline uppercase tracking-[0.4em]',
          done ? 'text-green-400' : phase === 'work' ? 'text-red-400' : 'text-zinc-500')}>
          {done ? 'Complete' : phase === 'work' ? '⚡ Work' : '— Rest —'}
        </span>
      </div>
      {/* Round counter — big and unmissable */}
      <div className="text-center mb-1">
        <span className={cn('font-headline tabular-nums',
          done ? 'text-green-300' : 'text-zinc-200')}
          style={{ fontSize: '2.2rem', lineHeight: 1 }}>
          {done ? 'Done' : `Round ${round}`}
        </span>
        {!done && (
          <span className="font-headline text-zinc-600" style={{ fontSize: '1.3rem' }}>
            &nbsp;/&nbsp;{totalRounds}
          </span>
        )}
      </div>
      {/* Countdown clock */}
      <div className={cn('text-center font-headline tabular-nums leading-none mb-4',
        done ? 'text-green-300' : phase === 'work' ? 'text-red-200' : 'text-zinc-400')}
        style={{ fontSize: '4.5rem' }}>
        {done ? '✓' : fmtTime(remaining)}
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden mb-4">
        <div className={cn('h-full rounded-full transition-all duration-1000 ease-linear',
          done ? 'bg-green-400' : phase === 'work' ? 'bg-red-500' : 'bg-zinc-500')}
          style={{ width: `${Math.min(100, progress * 100)}%` }} />
      </div>
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => setRunning((v) => !v)} disabled={done}
          className={cn('w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all active:scale-90',
            done ? 'border-zinc-700 text-zinc-600 cursor-not-allowed'
              : running ? 'border-zinc-600 bg-zinc-800 text-zinc-300'
              : 'border-red-500 bg-red-950/40 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.3)]')}>
          {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button onClick={reset} className="w-10 h-10 rounded-full border border-zinc-700 text-zinc-400 flex items-center justify-center transition-all active:scale-90">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Elapsed Timer
// ─────────────────────────────────────────────────────────────
function ElapsedTimer({ targetMinutes, onFinish }: { targetMinutes: number; onFinish: (minutes: number) => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const progress = targetMinutes > 0 ? Math.min(1, elapsed / (targetMinutes * 60)) : 0;
  const remaining = Math.max(0, targetMinutes * 60 - elapsed);

  return (
    <div className="rounded-2xl border border-blue-700/50 bg-blue-950/10 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-headline uppercase tracking-[0.3em] text-blue-400">Zone 2 — Elapsed</span>
        <span className="text-[10px] text-zinc-500">Target: {targetMinutes}m</span>
      </div>
      <div className="text-center font-headline tabular-nums text-blue-200 leading-none mb-2" style={{ fontSize: '4.5rem' }}>
        {fmtTime(elapsed)}
      </div>
      {remaining > 0 && <p className="text-center text-[10px] text-zinc-600 mb-3">{fmtTime(remaining)} remaining</p>}
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-4">
        <div className="h-full rounded-full bg-blue-500 transition-all duration-1000 ease-linear" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => setRunning((v) => !v)}
          className={cn('w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all active:scale-90',
            running ? 'border-zinc-600 bg-zinc-800 text-zinc-300' : 'border-blue-500 bg-blue-950/40 text-blue-300')}>
          {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button onClick={() => { setElapsed(0); setRunning(false); }} className="w-10 h-10 rounded-full border border-zinc-700 text-zinc-400 flex items-center justify-center active:scale-90 transition-all">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button onClick={() => onFinish(Math.round(elapsed / 60))}
          className="px-4 py-2 rounded-lg border border-blue-600/50 bg-blue-950/30 text-blue-300 text-xs font-headline uppercase tracking-widest active:scale-95 transition-all">
          Done
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SessionLogger
// ─────────────────────────────────────────────────────────────
interface SessionLoggerProps {
  program: CardioProgram;
  session: GeneratedCardioSession;
  ghostLog: CardioSessionLog | null;
  bodyWeightKg: number;
  onClose: () => void;
  onSave: (log: Omit<CardioSessionLog, 'id'>) => Promise<void>;
}

function SessionLogger({ program, session, ghostLog, bodyWeightKg, onClose, onSave }: SessionLoggerProps) {
  const { distanceUnit } = useKhet();

  // ── Draft hydration — restore in-progress form state from localStorage ──
  const draftKey = buildCardioDraftKey(program.id, session.index);
  const initEx = CARDIO_EXERCISES.find((e) => e.id === session.slot.exerciseId) ?? CARDIO_EXERCISES[0];

  const [logPhase, setLogPhase] = useState<'active' | 'post'>(
    () => loadRawDraft<CardioDraft>(draftKey)?.logPhase ?? 'active',
  );
  const exercisesRef = useRef<HTMLDivElement>(null);

  const [segments, setSegments] = useState<CardioSegmentState[]>(
    () =>
      loadRawDraft<CardioDraft>(draftKey)?.segments ?? [
        { exerciseId: initEx.id, exerciseName: initEx.name, minutes: String(session.estimatedMinutes), done: false },
      ],
  );
  const [swapIdx, setSwapIdx] = useState<number | null>(null);
  const [addingEx, setAddingEx] = useState(false);
  const [activeTimerIdx, setActiveTimerIdx] = useState<number | null>(null);

  const [bpm, setBpm] = useState(() => loadRawDraft<CardioDraft>(draftKey)?.bpm ?? '');
  const [rpe, setRpe] = useState(() => loadRawDraft<CardioDraft>(draftKey)?.rpe ?? '');
  const [distance, setDistance] = useState(() => loadRawDraft<CardioDraft>(draftKey)?.distance ?? '');
  const [notes, setNotes] = useState(() => loadRawDraft<CardioDraft>(draftKey)?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [segmentErrors, setSegmentErrors] = useState<boolean[]>([]);
  const [finisherDone, setFinisherDone] = useState(
    () => loadRawDraft<CardioDraft>(draftKey)?.finisherDone ?? false,
  );
  const [finisherTally, setFinisherTally] = useState(
    () => loadRawDraft<CardioDraft>(draftKey)?.finisherTally ?? 0,
  );
  const [caloriesOverride, setCaloriesOverride] = useState<number | null>(
    () => loadRawDraft<CardioDraft>(draftKey)?.caloriesOverride ?? null,
  );

  const totalMinutes = segments.reduce((acc, s) => acc + (parseInt(s.minutes) || 0), 0);

  // Live calorie estimate per segment
  const segmentCals = segments.map((seg) => {
    const ex = CARDIO_EXERCISES.find((e) => e.id === seg.exerciseId) ?? CARDIO_EXERCISES[0];
    const targetRPE = parseInt(rpe) || session.slot.targetRPE;
    const met = targetRPE >= 7 ? ex.metHigh : ex.metModerate;
    const mins = parseInt(seg.minutes) || 0;
    return bodyWeightKg > 0 && mins > 0 ? estimateCalories(met, bodyWeightKg, mins) : 0;
  });
  const totalCalories = segmentCals.reduce((a, b) => a + b, 0);

  // Max Mode finisher calorie estimate (burpees: ~10 reps/min, MET 11)
  const finisherCals = session.maxFinisher && bodyWeightKg > 0
    ? estimateCalories(11, bodyWeightKg, (session.maxFinisher.rounds * session.maxFinisher.repsPerRound) / 10)
    : 0;
  const grandTotalCalories = totalCalories + (finisherDone ? finisherCals : 0);
  const effectiveCalories = caloriesOverride !== null ? caloriesOverride : grandTotalCalories;

  // ── Persistence: debounced draft writes ──
  const cardioDraftData = useMemo(
    () => ({ segments, bpm, rpe, distance, notes, finisherDone, finisherTally, caloriesOverride, logPhase }),
    [segments, bpm, rpe, distance, notes, finisherDone, finisherTally, caloriesOverride, logPhase],
  );
  const { persistNow: persistCardioDraft } = useLocalDraft(draftKey, cardioDraftData);
  const isCardioDirty =
    segments.some((s) => s.done) || !!bpm || !!rpe || !!distance || !!notes ||
    finisherDone || finisherTally > 0 || logPhase === 'post';

  // Browser-level guard: warn on tab close / hard refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isCardioDirty) return;
      e.preventDefault();
      persistCardioDraft();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isCardioDirty, persistCardioDraft]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const segErrs = segments.map((s) => (parseInt(s.minutes) || 0) <= 0);
    const anySegErr = segErrs.some(Boolean);
    if (totalMinutes <= 0 || anySegErr) {
      errs.minutes = anySegErr
        ? 'Enter a duration (minutes) for each exercise below ↓'
        : 'Total duration must be greater than 0';
    }
    setErrors(errs);
    setSegmentErrors(segErrs);
    if (Object.keys(errs).length > 0) {
      exercisesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const builtSegments: CardioSegment[] = segments.map((seg, i) => ({
        exerciseId: seg.exerciseId,
        exerciseName: seg.exerciseName,
        durationMinutes: parseInt(seg.minutes) || 0,
        calories: segmentCals[i],
      }));
      await onSave({
        userId: program.userId,
        programId: program.id,
        programName: program.name,
        sessionIndex: session.index,
        week: session.week,
        label: session.label,
        date: localDateStr(),
        exerciseId: segments[0].exerciseId,
        exerciseName: segments[0].exerciseName,
        durationMinutes: totalMinutes,
        distance: parseFloat(distance) || undefined,
        distanceUnit,
        calories: effectiveCalories || undefined,
        avgBPM: parseInt(bpm) || undefined,
        rpe: parseInt(rpe) || undefined,
        completed: true,
        notes: notes.trim() || undefined,
        segments: builtSegments,
        maxFinisherDone: session.maxFinisher ? finisherDone : undefined,
        finisherCalories: (session.maxFinisher && finisherDone && finisherCals > 0) ? finisherCals : undefined,
      });
      clearRawDraft(draftKey);
    } catch (err) {
      console.error('[handleSave] unexpected error:', err);
    } finally {
      setSaving(false);
    }
  };

  const hasInterval = !!session.slot.interval;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#060810]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-red-900/40 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Zap className="w-4 h-4 text-red-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-headline uppercase tracking-widest text-zinc-500 leading-none">{program.name.split('—')[0].trim()}</p>
            <p className="text-sm font-headline text-red-200 uppercase tracking-widest truncate">Week {session.week} · {session.focus}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded text-zinc-400 active:scale-90 transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4 pt-4">
        {/* Ghost log */}
        {ghostLog && (
          <div className="rounded-xl border border-amber-700/40 bg-amber-950/20 px-4 py-3">
            <p className="text-[9px] font-headline uppercase tracking-widest text-amber-600 mb-1">Last Effort — Beat This</p>
            <div className="flex flex-wrap gap-3">
              {ghostLog.calories != null && <span className="text-sm font-headline text-amber-300">{ghostLog.calories} Cal</span>}
              {ghostLog.avgBPM != null && <span className="text-sm font-headline text-amber-300">{ghostLog.avgBPM} Avg BPM</span>}
              {ghostLog.rpe != null && <span className="text-sm font-headline text-amber-300">RPE {ghostLog.rpe}</span>}
              {ghostLog.durationMinutes != null && <span className="text-sm font-headline text-amber-300">{ghostLog.durationMinutes}m</span>}
            </div>
          </div>
        )}

        {/* Exercises + running calorie total */}
        <div ref={exercisesRef} className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-headline uppercase tracking-widest text-zinc-500">Exercises</p>
            <span className={cn('text-xs font-headline transition-colors', grandTotalCalories > 0 ? 'text-red-300' : 'text-zinc-700')}>
              {grandTotalCalories > 0 ? `~${grandTotalCalories} kcal total` : 'Add duration to estimate calories'}
            </span>
          </div>

          {segments.map((seg, idx) => (
            <div key={idx} className={cn(
              'rounded-xl border-2 overflow-hidden transition-all',
              seg.done
                ? 'border-green-500/50 bg-green-950/10'
                : activeTimerIdx === idx
                ? hasInterval
                  ? 'border-red-600/70 bg-red-950/10 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                  : 'border-blue-600/70 bg-blue-950/10 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                : 'border-zinc-800 bg-zinc-900/50',
            )}>
              <div className="flex items-center gap-2 px-3 py-2.5">
                {/* Done circle */}
                <button
                  onClick={() => setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, done: !s.done } : s))}
                  className={cn(
                    'w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all active:scale-90',
                    seg.done ? 'border-green-500 bg-green-500' : 'border-zinc-500',
                  )}
                >
                  {seg.done && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
                {/* Name + calories */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-sm font-headline truncate', seg.done ? 'text-green-400' : 'text-zinc-200')}>{seg.exerciseName}</span>
                    {segmentCals[idx] > 0 && (
                      <span className="text-[9px] font-headline text-red-400 border border-red-900/40 rounded-full px-1.5 py-0.5">
                        ~{segmentCals[idx]} kcal
                      </span>
                    )}
                  </div>
                </div>
                {/* Right-side controls */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Timer button (only when not done) */}
                  {!seg.done && (
                    <button
                      onClick={() => setActiveTimerIdx(activeTimerIdx === idx ? null : idx)}
                      className={cn(
                        'px-2 py-1 rounded-lg border text-[10px] font-headline uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95',
                        activeTimerIdx === idx
                          ? hasInterval
                            ? 'border-red-500 bg-red-950/40 text-red-300'
                            : 'border-blue-500 bg-blue-950/40 text-blue-300'
                          : hasInterval
                            ? 'border-red-800/60 bg-red-950/20 text-red-400'
                            : 'border-blue-800/60 bg-blue-950/20 text-blue-400',
                      )}
                    >
                      {activeTimerIdx === idx ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      {activeTimerIdx === idx ? 'Hide' : 'Timer'}
                    </button>
                  )}
                  {/* Alternate button */}
                  <button
                    onClick={() => setSwapIdx(swapIdx === idx ? null : idx)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg border border-red-800/60 bg-red-950/20 text-red-400 transition-all text-[10px] font-headline uppercase tracking-wider active:scale-95"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    Alt
                  </button>
                  {segments.length > 1 && (
                    <button onClick={() => setSegments((prev) => prev.filter((_, i) => i !== idx))} className="p-1 text-red-500/60 active:scale-90 transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {/* Duration row */}
              <div className="px-3 pb-2.5 flex items-center gap-2">
                <label className={cn('text-[9px] font-headline uppercase tracking-widest flex-shrink-0',
                  segmentErrors[idx] ? 'text-red-400' : 'text-zinc-600')}>
                  Duration (min){segmentErrors[idx] && ' ← required'}
                </label>
                <input type="number" min={1}
                  value={seg.minutes}
                  onChange={(e) => {
                    setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, minutes: e.target.value } : s));
                    setSegmentErrors((prev) => prev.map((v, i) => i === idx ? false : v));
                    setErrors({});
                  }}
                  className={cn('w-20 h-8 bg-black border rounded px-2 text-sm text-white text-center focus:outline-none transition-all',
                    segmentErrors[idx]
                      ? 'border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'
                      : errors.minutes
                      ? 'border-red-500/60 shadow-[0_0_4px_rgba(239,68,68,0.3)]'
                      : 'border-zinc-700 focus:border-red-500')} />
              </div>
              {/* Inline timer */}
              {activeTimerIdx === idx && (
                <div className="border-t border-zinc-800 p-3">
                  {hasInterval && session.slot.interval ? (
                    <IntervalTimer
                      interval={session.slot.interval}
                      onAllComplete={() => {
                        setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, done: true } : s));
                        setActiveTimerIdx(null);
                      }}
                    />
                  ) : (
                    <ElapsedTimer
                      targetMinutes={parseInt(seg.minutes) || session.estimatedMinutes}
                      onFinish={(mins) => {
                        setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, minutes: String(mins), done: true } : s));
                        setActiveTimerIdx(null);
                      }}
                    />
                  )}
                </div>
              )}
              {/* Exercise swap picker */}
              {swapIdx === idx && (
                <div className="border-t border-zinc-800 p-2">
                  <ExercisePicker title="Swap Exercise" onSelect={(id, name) => { setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, exerciseId: id, exerciseName: name } : s)); setSwapIdx(null); }} onCancel={() => setSwapIdx(null)} />
                </div>
              )}
            </div>
          ))}

          {addingEx ? (
            <ExercisePicker title="Add Exercise" onSelect={(id, name) => { setSegments((prev) => [...prev, { exerciseId: id, exerciseName: name, minutes: '20', done: false }]); setAddingEx(false); }} onCancel={() => setAddingEx(false)} />
          ) : (
            <button onClick={() => setAddingEx(true)} className="w-full py-2.5 rounded-xl border border-dashed border-red-900/50 text-red-400/80 text-xs font-headline uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] active:bg-red-950/20">
              <Plus className="w-3.5 h-3.5" /> Add Exercise to Workout
            </button>
          )}

          {errors.minutes && (
            <p className="text-xs text-red-400 font-headline text-center border border-red-900/40 bg-red-950/20 rounded-lg px-3 py-2">
              {errors.minutes}
            </p>
          )}

          {/* Max Mode Finisher */}
          {session.maxFinisher && (
            <div className={cn(
              'rounded-xl border-2 overflow-hidden transition-all',
              finisherDone
                ? 'border-green-500/60 bg-green-950/10'
                : 'border-red-500/80 bg-red-950/20 shadow-[0_0_14px_rgba(239,68,68,0.35)]',
            )}>
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-headline text-red-200">{session.maxFinisher.exerciseName}</span>
                      <span className="text-[9px] font-headline uppercase text-red-400 border border-red-900/50 rounded-full px-1.5 py-0.5 bg-red-950/30">Max Mode</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {session.maxFinisher.rounds} rounds × {session.maxFinisher.repsPerRound} reps
                      {finisherCals > 0 && ` · ~${finisherCals} kcal`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFinisherDone((v) => !v)}
                  className={cn(
                    'w-7 h-7 rounded border-2 flex items-center justify-center transition-all',
                    finisherDone ? 'border-green-500 bg-green-500 text-white' : 'border-red-600/80 text-transparent',
                  )}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Tally counter */}
              <div className="px-3 pb-3 flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <button
                    onClick={() => setFinisherTally((n) => Math.max(0, n - 1))}
                    className="w-8 h-8 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 text-lg font-headline flex items-center justify-center active:scale-90 transition-all"
                  >−</button>
                  <div className="flex-1 text-center">
                    <p className="text-xl font-headline text-red-200 tabular-nums leading-none">
                      {finisherTally}
                      <span className="text-sm text-zinc-500"> / {session.maxFinisher.rounds}</span>
                    </p>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">Rounds Done</p>
                  </div>
                  <button
                    onClick={() => {
                      const next = Math.min(finisherTally + 1, session.maxFinisher!.rounds);
                      setFinisherTally(next);
                      if (next >= session.maxFinisher!.rounds) setFinisherDone(true);
                    }}
                    className="w-8 h-8 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 text-lg font-headline flex items-center justify-center active:scale-90 transition-all"
                  >+</button>
                </div>
                <button
                  onClick={() => {
                    const next = Math.min(finisherTally + 1, session.maxFinisher!.rounds);
                    setFinisherTally(next);
                    if (next >= session.maxFinisher!.rounds) setFinisherDone(true);
                  }}
                  className="flex-shrink-0 px-4 py-2 rounded-lg border border-red-700/60 bg-red-950/30 text-red-200 text-xs font-headline uppercase tracking-widest active:scale-[0.97] transition-all"
                >
                  Tally Round
                </button>
              </div>
              <div className="px-3 pb-2.5">
                <p className="text-[9px] text-red-400/80 font-headline">{session.maxFinisher.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Session info */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-[9px] font-headline uppercase px-1.5 py-0.5 rounded border', INTERVAL_BADGE[session.slot.intervalType])}>{session.slot.intervalType}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-400">RPE target: {session.slot.targetRPE}</span>
              <RPEInfoPopover targetRPE={session.slot.targetRPE} />
            </div>
          </div>
          <p className="text-xs text-zinc-400 leading-snug">{session.slot.notes}</p>
          {session.slot.interval && (
            <div className="flex gap-3 pt-1">
              <div className="text-center"><p className="text-lg font-headline text-red-300">{session.slot.interval.workSeconds}s</p><p className="text-[9px] text-zinc-600">Work</p></div>
              <div className="text-center"><p className="text-lg font-headline text-zinc-400">{session.slot.interval.restSeconds}s</p><p className="text-[9px] text-zinc-600">Rest</p></div>
              <div className="text-center"><p className="text-lg font-headline text-zinc-300">×{session.slot.interval.rounds}</p><p className="text-[9px] text-zinc-600">Rounds</p></div>
              <div className="text-center"><p className="text-lg font-headline text-zinc-300">{session.estimatedMinutes}m</p><p className="text-[9px] text-zinc-600">Est.</p></div>
            </div>
          )}
        </div>

        {/* ACTIVE: Finish / Cancel buttons */}
        {logPhase === 'active' && (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setLogPhase('post')} className="py-2.5 rounded-lg border border-red-800/60 bg-red-950/20 text-red-300 text-xs font-headline uppercase tracking-widest active:scale-95 transition-all">
              Finish / Log Now
            </button>
            <button onClick={onClose} className="py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-xs font-headline uppercase tracking-widest active:scale-95 transition-all">
              Cancel
            </button>
          </div>
        )}

        {/* POST */}
        {logPhase === 'post' && (
          <div className="space-y-4">
            <p className="text-sm font-headline uppercase tracking-[0.3em] text-zinc-300 text-center">Log Your Results</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-headline uppercase tracking-[0.2em] text-zinc-300 block mb-1">Avg BPM</label>
                <input type="number" min={0} value={bpm} placeholder="e.g. 148" onChange={(e) => setBpm(e.target.value)}
                  className="w-full h-10 bg-black border border-zinc-700 rounded px-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-red-500" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <label className="text-xs font-headline uppercase tracking-[0.2em] text-zinc-300">RPE (1–10)</label>
                  <RPEInfoPopover targetRPE={session.slot.targetRPE} />
                </div>
                <input type="number" min={1} max={10} value={rpe} placeholder={String(session.slot.targetRPE)} onChange={(e) => setRpe(e.target.value)}
                  className="w-full h-10 bg-black border border-zinc-700 rounded px-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="text-xs font-headline uppercase tracking-[0.2em] text-zinc-300 block mb-1">Distance ({distanceUnit})</label>
                <input type="number" min={0} step={0.1} value={distance} placeholder="0" onChange={(e) => setDistance(e.target.value)}
                  className="w-full h-10 bg-black border border-zinc-700 rounded px-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="text-xs font-headline uppercase tracking-[0.2em] text-zinc-300 block mb-1">Calories</label>
                <input
                  type="number" min={0}
                  value={caloriesOverride !== null ? caloriesOverride : grandTotalCalories || ''}
                  onChange={(e) => setCaloriesOverride(parseInt(e.target.value) || null)}
                  placeholder={grandTotalCalories > 0 ? `~${grandTotalCalories}` : '0'}
                  className="w-full h-10 bg-black border border-zinc-700 rounded px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-headline uppercase tracking-[0.2em] text-zinc-300 block mb-1">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it feel? Any PRs?" rows={2}
                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-700 resize-none focus:outline-none focus:border-red-500" />
            </div>
            {bodyWeightKg < 40 && (
              <p className="text-xs text-zinc-500 text-center">For calorie estimates, set your body weight in Athlete Profile or in the program wizard.</p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {logPhase === 'post' && (
        <div className="px-4 py-4 border-t border-zinc-800 flex-shrink-0 space-y-2">
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3.5 rounded-xl border border-red-500 bg-red-600/20 text-red-100 font-headline uppercase tracking-widest text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40 shadow-[0_0_16px_rgba(239,68,68,0.3)]">
            <Flame className="w-4 h-4" />
            {saving ? 'Logging…' : 'Finish Ritual'}
          </button>
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-zinc-800 text-zinc-600 text-xs font-headline uppercase tracking-widest active:scale-[0.98] transition-all">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Edit Program Modal
// ─────────────────────────────────────────────────────────────
interface EditProgramModalProps {
  program: CardioProgram;
  onClose: () => void;
  onSave: (updates: Partial<CardioProgram>) => Promise<void>;
}

function EditProgramModal({ program, onClose, onSave }: EditProgramModalProps) {
  const [exerciseId, setExerciseId] = useState(program.primaryExerciseId);
  const [daysPerWeek, setDaysPerWeek] = useState(program.daysPerWeek);
  const [durationWeeks, setDurationWeeks] = useState(program.durationWeeks);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const exercise = CARDIO_EXERCISES.find((e) => e.id === exerciseId) ?? CARDIO_EXERCISES[0];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        primaryExerciseId: exerciseId,
        primaryExerciseName: exercise.name,
        daysPerWeek,
        durationWeeks,
        totalSessions: daysPerWeek * durationWeeks,
      });
    } finally {
      setSaving(false);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-950 border border-red-500/30 rounded-2xl shadow-[0_0_40px_rgba(239,68,68,0.2)] flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
          <div>
            <h2 className="font-headline text-red-300 text-base uppercase tracking-widest">Edit Program</h2>
            <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-[240px]">{program.name}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 active:scale-90 transition-all"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-[9px] font-headline uppercase tracking-widest text-zinc-500">Primary Exercise</label>
            <button onClick={() => setShowPicker(!showPicker)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-zinc-300 font-headline active:scale-[0.98] transition-all">
              <span>{exercise.name}</span>
              <ChevronDown className={cn('w-4 h-4 text-zinc-500 transition-transform', showPicker && 'rotate-180')} />
            </button>
            {showPicker && (
              <ExercisePicker title="Change Exercise"
                onSelect={(id) => { setExerciseId(id); setShowPicker(false); }}
                onCancel={() => setShowPicker(false)} />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-headline uppercase tracking-widest text-zinc-500">Days Per Week</label>
            <div className="flex gap-1.5 flex-wrap">
              {[3, 4, 5, 6, 7].map((d) => (
                <button key={d} onClick={() => setDaysPerWeek(d)}
                  className={cn('flex-1 min-w-[2.5rem] py-2 rounded-lg border font-headline text-sm uppercase tracking-widest transition-all active:scale-95',
                    daysPerWeek === d ? 'border-red-500 bg-red-950/40 text-red-200' : 'border-zinc-700 bg-zinc-900 text-zinc-500')}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-headline uppercase tracking-widest text-zinc-500">Duration (weeks)</label>
            <div className="flex gap-2">
              {[4, 6, 8].map((d) => (
                <button key={d} onClick={() => setDurationWeeks(d)}
                  className={cn('flex-1 py-2 rounded-lg border font-headline text-sm uppercase tracking-widest transition-all active:scale-95',
                    durationWeeks === d ? 'border-red-500 bg-red-950/40 text-red-200' : 'border-zinc-700 bg-zinc-900 text-zinc-500')}>
                  {d}w
                </button>
              ))}
            </div>
          </div>
          <p className="text-[9px] text-zinc-700 text-center">Changing days/week or duration updates the total session count. Completed sessions are preserved.</p>
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t border-zinc-800 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-300 text-sm font-headline uppercase tracking-wider transition-all active:scale-95">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-400 bg-red-600/20 text-red-200 text-sm font-headline uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-40">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Program Card — week schedule style
// ─────────────────────────────────────────────────────────────
interface ProgramCardProps {
  program: CardioProgram;
  onDelete: () => void;
  onEdit: () => void;
}

function CardioProgramCard({ program, onDelete, onEdit }: ProgramCardProps) {
  const { logSession, getGhostLog } = useCardio();
  const { getUserSettings } = useKhet();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessionOpen, setSessionOpen] = useState(false);
  const [ghostLog, setGhostLog] = useState<CardioSessionLog | null>(null);
  const [activeSession, setActiveSession] = useState<GeneratedCardioSession | null>(null);
  // Always derive from Athlete Profile settings (canonical, already in kg).
  // Fall back to program.bodyWeightKg only as last resort, treating it as kg.
  const [bodyWeightKg, setBodyWeightKg] = useState(program.bodyWeightKg ?? 80);

  useEffect(() => {
    getUserSettings().then((s) => {
      if (!s?.bodyWeight) return;
      const bw = s.weightUnit === 'lbs' ? lbsToKg(s.bodyWeight) : s.bodyWeight;
      if (bw > 20) setBodyWeightKg(bw);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allSessions = generateCardioProgram(program);
  const lastIdx = program.lastSessionIndex;
  const nextIdx = lastIdx + 1;

  const weekStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const sessionsThisWeek = program.weeklyLog?.weekStr === weekStr ? program.weeklyLog.count : 0;

  const weekStart = program.startDate
    ? Math.floor(differenceInCalendarDays(new Date(), parseISO(program.startDate)) / 7) + 1
    : null;
  const currentWeek = weekStart ? Math.min(weekStart, program.durationWeeks) : 1;

  const currentWeekSessions = allSessions.filter((s) => s.week === currentWeek);
  const progressPct = program.totalSessions > 0
    ? Math.min(100, Math.round((program.sessionsCompleted / program.totalSessions) * 100))
    : 0;
  const phaseName = allSessions.find((s) => s.index === nextIdx)?.phaseName
    ?? allSessions.find((s) => s.week === currentWeek)?.phaseName
    ?? 'Aerobic Base';

  const handleBeginSession = async (session: GeneratedCardioSession) => {
    if (!user) return;
    const settings = await getUserSettings();
    if (settings?.bodyWeight) {
      const bw = settings.bodyWeight;
      setBodyWeightKg(settings.weightUnit === 'lbs' ? lbsToKg(bw) : bw);
    }
    const ghost = await getGhostLog(program.id, session.index);
    setGhostLog(ghost);
    setActiveSession(session);
    setSessionOpen(true);
  };

  const handleSaveSession = async (log: Omit<CardioSessionLog, 'id'>) => {
    try {
      await logSession(log);
      toast({ title: 'SESSION LOGGED', description: `${log.calories ?? '—'} cal · ${log.durationMinutes}m` });
      // Stamp a completed task tile on the main task list (non-critical)
      try {
        await addDoc(collection(db, 'tasks'), {
          userId: log.userId,
          title: `${log.programName} — ${log.label}`,
          iv: null,
          isEncrypted: false,
          category: 'Khet',
          importance: 'medium',
          estimatedTime: log.durationMinutes ?? 0,
          completed: true,
          completedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          dueDate: new Date(),
          isRitual: false,
          originRitualId: null,
          khetProgramId: log.programId,
          tags: ['Cardio', 'Khet-Station'],
        });
      } catch {
        // Non-critical — don't block the session save
      }
      setSessionOpen(false);
    } catch (err) {
      console.error('[SessionLogger] save failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: 'Save failed', description: msg, variant: 'destructive' });
    }
  };

  return (
    <>
      <div className="rounded-xl border border-red-900/40 bg-zinc-950/60 overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-headline text-red-200 text-sm uppercase tracking-widest leading-tight truncate">{program.name}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={cn('text-[9px] font-headline uppercase px-1.5 py-0.5 rounded border', LEVEL_BADGE[program.fitnessLevel])}>{program.fitnessLevel}</span>
                <span className={cn('text-[9px] font-headline', GOAL_COLOR[program.goal])}>{program.goal}</span>
                <span className="text-[9px] text-zinc-600">{program.daysPerWeek}d/wk · {program.durationWeeks}wk</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <div className="flex items-center gap-0.5">
                <button onClick={onEdit} className="p-1.5 text-red-400 transition-all active:scale-90" title="Edit program">
                  <CyberStylus className="w-5 h-5" />
                </button>
                <BanishmentPortal onConfirm={onDelete} ritualTitle={program.name}>
                  <button className="p-1.5 text-red-600/70 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]" title="Remove program">
                    <DuamatefJar className="w-7 h-7" />
                  </button>
                </BanishmentPortal>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-red-500" />
                <span className="text-[10px] font-headline text-red-400">{sessionsThisWeek}/{program.daysPerWeek}</span>
              </div>
            </div>
          </div>

          {/* Phase */}
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            <span className="text-[10px] font-headline text-red-300">Week {currentWeek}/{program.durationWeeks}: {phaseName}</span>
          </div>

          {/* Progress */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-zinc-600">{program.sessionsCompleted} / {program.totalSessions} sessions</span>
              <span className="text-[9px] font-headline text-red-400">{progressPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-400 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {program.lastSessionDate && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Calendar className="w-3 h-3" />
              Last: {format(parseISO(program.lastSessionDate), 'EEE, MMM d')}
            </div>
          )}
        </div>

        {/* Week session tabs */}
        {currentWeekSessions.length > 0 && (
          <div className="px-4 pb-4 space-y-2">
            <p className="text-[9px] font-headline uppercase tracking-widest text-zinc-600">Week {currentWeek} Sessions</p>
            <div className="flex flex-wrap gap-1.5">
              {currentWeekSessions.map((session) => {
                const isCompleted = session.index <= lastIdx && lastIdx >= 0;
                const isNextUp = session.index === nextIdx && nextIdx < program.totalSessions;

                return (
                  <button
                    key={session.index}
                    onClick={() => handleBeginSession(session)}
                    className={cn(
                      'flex items-center gap-1 px-3 py-2 rounded border text-xs font-headline uppercase tracking-wider transition-all duration-200 whitespace-nowrap',
                      isCompleted
                        ? 'border-green-500/60 text-green-300 bg-green-950/20 shadow-[0_0_8px_rgba(74,222,128,0.2)]'
                        : isNextUp
                        ? 'border-yellow-400 text-yellow-200 bg-yellow-950/20 shadow-[0_0_12px_rgba(234,179,8,0.5)] [animation:pulse_2s_ease-in-out_infinite]'
                        : 'border-zinc-700 text-zinc-300 active:border-red-700/40',
                    )}
                  >
                    {isCompleted && <Check className="w-3 h-3" />}
                    <span>{session.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {sessionOpen && activeSession && (
        <SessionLogger
          program={program}
          session={activeSession}
          ghostLog={ghostLog}
          bodyWeightKg={bodyWeightKg}
          onClose={() => setSessionOpen(false)}
          onSave={handleSaveSession}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// KhetCardio — section
// ─────────────────────────────────────────────────────────────

export function KhetCardio() {
  const { programs, loading, deleteProgram, updateProgram } = useCardio();
  const { toast } = useToast();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<CardioProgram | null>(null);

  const handleDelete = async (id: string) => {
    try { await deleteProgram(id); toast({ title: 'Program banished' }); }
    catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const handleSaveEdit = async (updates: Partial<CardioProgram>) => {
    if (!editingProgram) return;
    try { await updateProgram(editingProgram.id, updates); toast({ title: 'Program updated' }); setEditingProgram(null); }
    catch { toast({ title: 'Error saving changes', variant: 'destructive' }); }
  };

  if (loading) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-red-400" />
          <h3 className="font-headline text-red-400 text-sm uppercase tracking-widest">Endurance Engine</h3>
        </div>
        {programs.length > 0 && (
          <button onClick={() => setWizardOpen(true)} className="flex items-center gap-1 text-[10px] font-headline uppercase tracking-widest text-red-400 transition-all active:scale-95">
            <Plus className="w-3 h-3" /> New
          </button>
        )}
      </div>

      {programs.length === 0 && (
        <div className="rounded-xl border border-dashed border-red-900/40 p-10 text-center">
          <Zap className="w-8 h-8 text-red-900 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No endurance programs yet.</p>
          <p className="text-zinc-700 text-xs mt-1 mb-4">Build your aerobic engine.</p>
          <button onClick={() => setWizardOpen(true)} className="px-4 py-2 rounded-lg border border-red-700/60 bg-red-950/20 text-red-300 text-xs font-headline uppercase tracking-widest active:scale-95 transition-all">
            Create Cardio Program
          </button>
        </div>
      )}

      {programs.map((program) => (
        <CardioProgramCard
          key={program.id}
          program={program}
          onDelete={() => handleDelete(program.id)}
          onEdit={() => setEditingProgram(program)}
        />
      ))}

      <CardioProgramWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />

      {editingProgram && (
        <EditProgramModal
          program={editingProgram}
          onClose={() => setEditingProgram(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
