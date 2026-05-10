"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import {
  FlameKindling,
  Plus,
  X,
  Check,
  Info,
  Pause,
  Play,
  RotateCcw,
  Search,
  ChevronRight,
  Zap,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  CORE_EXERCISES,
  type CoreExercise,
  type CoreSlot,
  type CoreSessionLog,
} from '@/lib/core-types';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─────────────────────────────────────────────────────────────
// CountdownTimer
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
          beep(1047, 0.25, 0.6);
          setTimeout(() => beep(1319, 0.4, 0.55), 280);
          onComplete(targetSeconds);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  id: string;
  boostType: string;
  name: string;
  timerOnly: boolean;
}

const BOOST_OPTIONS: BoostOption[] = [
  { id: 'plank',             boostType: 'Isometric Boost',  name: 'Plank',             timerOnly: true  },
  { id: 'russian-twist',     boostType: 'Oblique Boost',    name: 'Russian Twists',    timerOnly: false },
  { id: 'bicycle-crunch',    boostType: 'Oblique Boost',    name: 'Bicycle Crunches',  timerOnly: false },
  { id: 'mountain-climber',  boostType: 'Metabolic Boost',  name: 'Mountain Climbers', timerOnly: false },
  { id: 'glute-bridge-hold', boostType: 'Posterior Boost',  name: 'Glute Bridge Hold', timerOnly: false },
  { id: 'dead-bug',          boostType: 'Stability Boost',  name: 'Dead Bugs',         timerOnly: true  },
];

// ─────────────────────────────────────────────────────────────
// Exercise Picker Modal
// ─────────────────────────────────────────────────────────────

function ExPickerModal({
  excludedIds,
  onPick,
  onClose,
}: {
  excludedIds: string[];
  onPick: (ex: CoreExercise) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return CORE_EXERCISES.filter(
      (e) =>
        !excludedIds.includes(e.id) &&
        (e.name.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.level.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q)),
    );
  }, [search, excludedIds]);

  const allGrouped = useMemo(() => {
    if (search.trim()) return null;
    const groups: Record<string, CoreExercise[]> = {};
    for (const ex of CORE_EXERCISES) {
      if (excludedIds.includes(ex.id)) continue;
      if (!groups[ex.category]) groups[ex.category] = [];
      groups[ex.category].push(ex);
    }
    return groups;
  }, [search, excludedIds]);

  const ExRow = ({ ex }: { ex: CoreExercise }) => (
    <button
      onClick={() => onPick(ex)}
      className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-orange-500/40 hover:bg-orange-950/10 text-left transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-zinc-100">{ex.name}</span>
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
          <h3 className="font-headline text-orange-300 text-sm uppercase tracking-widest">Add Exercise</h3>
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
          {search.trim() ? (
            searchResults.length > 0 ? (
              <div className="space-y-1.5">
                {searchResults.map((ex) => <ExRow key={ex.id} ex={ex} />)}
              </div>
            ) : (
              <p className="text-center text-zinc-500 text-sm py-6">No exercises match &quot;{search}&quot;</p>
            )
          ) : (
            allGrouped &&
            Object.entries(allGrouped).map(([cat, exs]) => (
              <div key={cat}>
                <p className="text-[10px] font-headline uppercase tracking-widest text-orange-400/70 mb-2">{cat}</p>
                <div className="space-y-1.5">
                  {exs.map((ex) => <ExRow key={ex.id} ex={ex} />)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// StandaloneAbsPanel — à la carte Core & Abs quick session
// ─────────────────────────────────────────────────────────────

interface StandaloneAbsPanelProps {
  onClose: () => void;
}

export function StandaloneAbsPanel({ onClose }: StandaloneAbsPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Exercise list — user builds this from scratch
  const [items, setItems] = useState<{ ex: CoreExercise; sets: number }[]>([]);
  const [completedSets, setCompletedSets] = useState<Record<string, Set<number>>>({});
  const [performance, setPerformance] = useState<
    Record<string, { weight?: number; reps?: number; seconds?: number }>
  >({});
  const [cuesModal, setCuesModal] = useState<CoreExercise | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startTime] = useState(Date.now());

  // ── Boost / finisher ──
  const [boostOpen, setBoostOpen] = useState(false);
  const [boostChoice, setBoostChoice] = useState<BoostOption | null>(null);
  const [boostMode, setBoostMode] = useState<'timer' | 'reps'>('timer');
  const [boostSeconds, setBoostSeconds] = useState(60);
  const [boostDone, setBoostDone] = useState(false);

  const itemsWithSlots = items.map(({ ex, sets }) => ({
    ex,
    slot: {
      exerciseId: ex.id,
      type: ex.type as CoreSlot['type'],
      sets,
      targetReps: ex.baseReps,
      targetSeconds: ex.baseSeconds,
    } as CoreSlot,
  }));

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
    setPerformance((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), [field]: val } }));
  };

  const totalSetsAll =
    itemsWithSlots.reduce((acc, { slot }) => acc + slot.sets, 0) +
    (boostChoice ? 1 : 0);
  const completedSetsAll =
    itemsWithSlots.reduce((acc, { ex }) => acc + getSetsCompleted(ex.id), 0) +
    (boostDone ? 1 : 0);
  const allDone =
    items.length > 0 &&
    itemsWithSlots.every(({ slot, ex }) => isFullyDone(ex.id, slot.sets)) &&
    (!boostChoice || boostDone);

  const excludedIds = items.map((i) => i.ex.id);

  const handleSave = async () => {
    if (!user || completedSetsAll === 0) return;
    setSaving(true);
    try {
      const durationMinutes = Math.max(1, Math.round((Date.now() - startTime) / 60000));
      const log: Omit<CoreSessionLog, 'id'> = {
        userId: user.uid,
        programId: 'standalone-abs',
        programName: 'Quick Core Session',
        sessionIndex: 0,
        week: 1,
        label: 'Ad-Hoc Session',
        date: format(new Date(), 'yyyy-MM-dd'),
        slotsCompleted: [
          ...itemsWithSlots
            .filter(({ slot, ex }) => isFullyDone(ex.id, slot.sets))
            .map(({ ex }) => ex.id),
          ...(boostChoice && boostDone ? [`boost-${boostChoice.id}`] : []),
        ],
        performanceData: performance,
        durationMinutes,
        completed: true,
      };
      await addDoc(collection(db, 'coreSessions'), {
        ...log,
        completedAt: new Date().toISOString(),
      });
      // Stamp completed task tile (non-critical)
      try {
        await addDoc(collection(db, 'tasks'), {
          userId: user.uid,
          title: 'Quick Core Session — Ad-Hoc',
          iv: null,
          isEncrypted: false,
          category: 'Khet',
          importance: 'medium',
          estimatedTime: 0,
          completed: true,
          completedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          dueDate: new Date(),
          isRitual: false,
          originRitualId: null,
          khetProgramId: 'standalone-abs',
          tags: ['Core', 'Abs', 'Khet-Station'],
        });
      } catch {
        // Non-critical
      }
      toast({
        title: 'Core session logged',
        description: `${items.length} exercise${items.length !== 1 ? 's' : ''}`,
      });
      onClose();
    } catch {
      toast({ title: 'Error saving', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-950 border border-orange-500/40 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.2)] flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FlameKindling className="w-5 h-5 text-orange-400" />
            <div>
              <h2 className="font-headline text-orange-300 text-base uppercase tracking-widest">
                Quick Core Session
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">À la carte · pick any exercises</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* Empty state */}
          {items.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
              <FlameKindling className="w-14 h-14 text-zinc-800" />
              <div className="text-center">
                <p className="text-zinc-400 text-sm font-headline uppercase tracking-widest">No exercises yet</p>
                <p className="text-zinc-600 text-xs mt-1">Build your session by adding exercises below.</p>
              </div>
              <button
                onClick={() => setPickerOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-orange-500/60 bg-orange-950/20 text-orange-300 font-headline uppercase tracking-widest text-sm hover:border-orange-400 hover:bg-orange-950/30 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Exercise
              </button>
            </div>
          )}

          {/* Exercise cards */}
          {itemsWithSlots.map(({ slot, ex }, idx) => {
            const done = isFullyDone(ex.id, slot.sets);
            const partial = isPartial(ex.id, slot.sets);
            const perf = performance[ex.id] ?? {};

            return (
              <div
                key={`${ex.id}-${idx}`}
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
                    {/* Name + badges */}
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

                  {/* Info + Remove buttons */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => setCuesModal(ex)}
                      className="p-1 text-zinc-600 hover:text-orange-400 transition-colors"
                      title="Form cues"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                      title="Remove exercise"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Performance inputs */}
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
                      <>
                        <CountdownTimer
                          targetSeconds={slot.targetSeconds ?? 30}
                          onComplete={(secs) => updatePerf(ex.id, 'seconds', secs)}
                        />
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
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Exercise + BOOST row (visible once exercises are added) */}
          {items.length > 0 && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setPickerOpen(true)}
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
          )}

          {/* ── Boost / Finisher card ── */}
          {boostChoice && (
            <div className="rounded-xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-950/20 to-zinc-900 p-4 shadow-[0_0_20px_rgba(245,158,11,0.12)]">
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

              {/* Timer-only boosts */}
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
            <span className="text-xs text-zinc-500">
              {items.length > 0 ? `${completedSetsAll}/${totalSetsAll} sets` : 'Add exercises to begin'}
            </span>
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm font-headline uppercase tracking-wider transition-all"
            >
              Cancel
            </button>
          </div>
          <button
            onClick={handleSave}
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

      {/* ── Cues modal ── */}
      {cuesModal && (
        <div
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

      {/* ── Exercise picker ── */}
      {pickerOpen && (
        <ExPickerModal
          excludedIds={excludedIds}
          onPick={(ex) => {
            setItems((prev) => [...prev, { ex, sets: ex.defaultSets }]);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {/* ── Boost picker modal ── */}
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
    </div>
  );
}
