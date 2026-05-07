"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { X, Zap, Flame, Search, Check, ArrowLeftRight, Play, Pause, RotateCcw, Timer, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCardio } from '@/hooks/use-cardio';
import { useKhet } from '@/hooks/use-khet';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  CARDIO_EXERCISES,
  estimateCaloriesForExercise,
  lbsToKg,
  type CardioExerciseCategory,
  type CardioSegment,
} from '@/lib/endurance-types';

const CATEGORY_ORDER: CardioExerciseCategory[] = ['Machine', 'Bodyweight', 'Outdoor', 'Water'];

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type SegmentDraft = {
  exerciseId: string;
  exerciseName: string;
  duration: string;
  done: boolean;
  /** Total reps logged — can be fine-adjusted independently of rounds */
  repTally: number;
  /** Number of full rounds tallied via the Tally Round button */
  roundCount: number;
  /** Reps per round — user-selectable (default 10) */
  roundSize: number;
};

/** Exercises where one-tap rep counting (tally mode) is auto-enabled */
const TALLY_EXERCISE_IDS = new Set([
  'burpees', 'box-jumps', 'kettlebell-swings', 'jump-squats',
  'thrusters', 'medicine-ball-slams', 'mountain-climbers', 'jump-rope',
]);

// ─────────────────────────────────────────────────────────────
// RPE Info Popover
// ─────────────────────────────────────────────────────────────
const RPE_SCALE_QL = [
  { range: '1–2', label: 'Very Easy',  desc: 'Barely breathing — full conversation' },
  { range: '3–4', label: 'Light',       desc: 'Comfortable, can sing or chat freely' },
  { range: '5–6', label: 'Moderate',    desc: 'Zone 2 — slightly winded, still talking' },
  { range: '7–8', label: 'Hard',        desc: 'Short phrases only, pushing effort' },
  { range: '9',    label: 'Very Hard',   desc: 'Near max — barely 1–2 words' },
  { range: '10',   label: 'Max Effort',  desc: 'All-out sprint — cannot speak' },
];
function rpeMatchesRangeQL(rpe: number, range: string): boolean {
  if (range.includes('–')) { const [lo, hi] = range.split('–').map(Number); return rpe >= lo && rpe <= hi; }
  return rpe === Number(range);
}
function RPEInfoPopover({ targetRPE }: { targetRPE?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-zinc-600 text-zinc-400 text-[9px] font-bold leading-none flex-shrink-0 transition-all active:scale-90"
        aria-label="What is RPE?"
      >i</button>
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
            </p>
            <div className="space-y-1">
              {RPE_SCALE_QL.map(({ range, label, desc }) => {
                const isTarget = targetRPE !== undefined && rpeMatchesRangeQL(targetRPE, range);
                return (
                  <div key={range} className={cn('flex items-start gap-3 rounded-lg px-2.5 py-1.5', isTarget ? 'bg-red-950/40 border border-red-800/50' : 'bg-zinc-800/30')}>
                    <span className={cn('text-sm font-headline tabular-nums w-8 flex-shrink-0', isTarget ? 'text-red-300' : 'text-zinc-500')}>{range}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-headline', isTarget ? 'text-red-200' : 'text-zinc-200')}>{label}{isTarget && <span className="text-sm text-red-400 ml-2">← target</span>}</p>
                      <p className="text-sm text-zinc-400">{desc}</p>
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
// QuickTimer — stopwatch that auto-fills duration on stop
// ─────────────────────────────────────────────────────────────
function QuickTimer({ onCapture }: { onCapture: (minutes: number) => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const handleStop = () => {
    setRunning(false);
    const mins = Math.max(1, Math.round(elapsed / 60));
    onCapture(mins);
  };

  const handleReset = () => { setRunning(false); setElapsed(0); };

  return (
    <div className="rounded-2xl border border-red-800/50 bg-red-950/10 px-4 py-4">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="w-4 h-4 text-red-400" />
        <span className="text-sm font-headline uppercase tracking-widest text-red-300">Session Timer</span>
        {running && (
          <span className="ml-auto text-sm text-red-400 font-headline animate-pulse">LIVE</span>
        )}
      </div>
      <div className="text-center font-headline tabular-nums text-red-200 leading-none mb-4" style={{ fontSize: '4rem' }}>
        {fmtTime(elapsed)}
      </div>
      <div className="h-1 rounded-full bg-zinc-800 overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-red-600 transition-all duration-1000 ease-linear"
          style={{ width: elapsed > 0 ? `${Math.min(100, (elapsed % 3600) / 36)}%` : '0%' }}
        />
      </div>
      <div className="flex items-center justify-center gap-3">
        {!running && elapsed === 0 && (
          <button
            onClick={() => setRunning(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500 bg-red-950/30 text-red-300 text-sm font-headline uppercase tracking-wider active:scale-95 transition-all"
          >
            <Play className="w-4 h-4" /> Start
          </button>
        )}
        {running && (
          <button
            onClick={() => setRunning(false)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-600 bg-zinc-800 text-zinc-300 text-sm font-headline uppercase tracking-wider active:scale-95 transition-all"
          >
            <Pause className="w-4 h-4" /> Pause
          </button>
        )}
        {!running && elapsed > 0 && (
          <>
            <button
              onClick={() => setRunning(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-700/60 bg-red-950/20 text-red-300 text-sm font-headline uppercase tracking-wider active:scale-95 transition-all"
            >
              <Play className="w-4 h-4" /> Resume
            </button>
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500 bg-red-600/20 text-red-100 text-sm font-headline uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
            >
              <Check className="w-4 h-4" /> Done
            </button>
            <button
              onClick={handleReset}
              className="w-10 h-10 rounded-xl border border-zinc-700 text-zinc-400 flex items-center justify-center active:scale-90 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
      {elapsed > 0 && (
        <p className="text-sm text-zinc-500 text-center mt-3">
          Tap <span className="text-red-300">Done</span> to auto-fill duration ({Math.max(1, Math.round(elapsed / 60))} min)
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function ExercisePicker({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string, name: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const selected = CARDIO_EXERCISES.find((e) => e.id === selectedId);
  const filtered = CARDIO_EXERCISES.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-1.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-zinc-300 font-headline active:scale-[0.98] active:bg-zinc-800 transition-all"
      >
        <span>{selected?.name ?? 'Select exercise…'}</span>
        <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-600" />
      </button>

      {open && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-950 overflow-hidden">
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
          <div className="max-h-52 overflow-y-auto divide-y divide-zinc-800/60">
            {CATEGORY_ORDER.map((cat) => {
              const exercises = filtered.filter((e) => e.category === cat);
              if (exercises.length === 0) return null;
              return (
                <div key={cat}>
            <p className="text-[9px] font-headline uppercase tracking-widest text-zinc-400 px-4 py-1.5 bg-zinc-900/50">{cat}</p>
                  {exercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => { onSelect(ex.id, ex.name); setOpen(false); setSearch(''); }}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-2.5 text-left active:bg-zinc-800/60 transition-colors',
                        ex.id === selectedId && 'bg-red-950/20',
                      )}
                    >
                      <span className="text-sm text-zinc-300 font-headline">{ex.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-500">MET {ex.metModerate}–{ex.metHigh}</span>
                        {ex.id === selectedId && <Check className="w-3 h-3 text-red-400" />}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// QuickLogCardio — standalone quick session logger
// ─────────────────────────────────────────────────────────────

interface QuickLogCardioProps {
  onClose: () => void;
}

export function QuickLogCardio({ onClose }: QuickLogCardioProps) {
  const { logSession } = useCardio();
  const { getUserSettings, distanceUnit } = useKhet();
  const { user } = useAuth();
  const { toast } = useToast();

  const [segments, setSegments] = useState<SegmentDraft[]>([
    { exerciseId: 'treadmill-run', exerciseName: 'Treadmill Run', duration: '', done: false, repTally: 0, roundCount: 0, roundSize: 10 },
  ]);
  const [bpm, setBpm] = useState('');
  const [rpe, setRpe] = useState('');
  const [distance, setDistance] = useState('');
  const [notes, setNotes] = useState('');
  const [caloriesOverride, setCaloriesOverride] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bodyWeightKg, setBodyWeightKg] = useState(80);
  const durationRef = useRef<HTMLInputElement>(null);
  const lastTallyRef = useRef<Record<number, number>>({});

  // Load body weight from Athlete Profile
  useEffect(() => {
    getUserSettings().then((s) => {
      if (!s?.bodyWeight) return;
      const bw = s.weightUnit === 'lbs' ? lbsToKg(s.bodyWeight) : s.bodyWeight;
      setBodyWeightKg(bw);
    });
  }, [getUserSettings]);

  const handleSegmentTally = useCallback((idx: number) => {
    const now = Date.now();
    if (now - (lastTallyRef.current[idx] ?? 0) < 250) return;
    lastTallyRef.current[idx] = now;
    setSegments((prev) => prev.map((s, i) =>
      i === idx ? { ...s, roundCount: s.roundCount + 1, repTally: s.repTally + s.roundSize } : s
    ));
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(50);
    }
  }, []);

  const rpeNum = parseInt(rpe) || 5;
  const segmentEstimates = segments.map((seg) => {
    const ex = CARDIO_EXERCISES.find((e) => e.id === seg.exerciseId) ?? CARDIO_EXERCISES[0];
    const mins = parseFloat(seg.duration) || 0;
    return mins > 0 && bodyWeightKg > 0 ? estimateCaloriesForExercise(ex, bodyWeightKg, mins, rpeNum) : 0;
  });
  const totalDurationMins = segments.reduce((sum, s) => sum + (parseFloat(s.duration) || 0), 0);
  const totalEstimatedCals = segmentEstimates.reduce((a, b) => a + b, 0);
  const effectiveCalories = caloriesOverride !== '' ? (parseInt(caloriesOverride) || 0) : totalEstimatedCals;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (totalDurationMins <= 0) errs.duration = 'Add a duration to at least one exercise';
    setErrors(errs);
    if (errs.duration) {
      durationRef.current?.focus();
      durationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !user) return;
    setSaving(true);
    try {
      const builtSegments: CardioSegment[] = segments
        .map((seg, i) => ({
          exerciseId: seg.exerciseId,
          exerciseName: seg.exerciseName,
          durationMinutes: parseFloat(seg.duration),
          calories: segmentEstimates[i] ?? 0,
        }))
        .filter((s) => s.durationMinutes > 0);
      const tallyNotes = segments
        .filter((s) => s.repTally > 0)
        .map((s) => s.roundCount > 0
          ? `${s.exerciseName}: ${s.roundCount} rounds × ${s.roundSize} = ${s.repTally} reps`
          : `${s.exerciseName}: ${s.repTally} reps`
        )
        .join(', ');
      const finalNotes = [notes.trim(), tallyNotes].filter(Boolean).join(' · ');
      const primaryExercise = segments[0];
      const logExerciseName =
        segments.length > 1
          ? segments.map((s) => s.exerciseName).join(' + ')
          : primaryExercise.exerciseName;
      await logSession({
        userId: user.uid,
        programId: 'standalone',
        programName: 'Quick Log',
        sessionIndex: 0,
        week: 1,
        label: 'Quick Log',
        date: format(new Date(), 'yyyy-MM-dd'),
        exerciseId: primaryExercise.exerciseId,
        exerciseName: logExerciseName,
        durationMinutes: totalDurationMins,
        distance: parseFloat(distance) || undefined,
        distanceUnit,
        calories: effectiveCalories || undefined,
        avgBPM: parseInt(bpm) || undefined,
        rpe: rpeNum || undefined,
        completed: true,
        notes: finalNotes || undefined,
        segments: builtSegments.length > 0 ? builtSegments : undefined,
      });
      toast({ title: 'CARDIO LOGGED', description: `${logExerciseName} · ${totalDurationMins}m${effectiveCalories ? ` · ~${effectiveCalories} kcal` : ''}` });
      // Stamp a completed task tile on the main task list (non-critical)
      try {
        await addDoc(collection(db, 'tasks'), {
          userId: user.uid,
          title: `Cardio — ${logExerciseName}`,
          iv: null,
          isEncrypted: false,
          category: 'Khet',
          importance: 'medium',
          estimatedTime: totalDurationMins ?? 0,
          completed: true,
          completedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          dueDate: new Date(),
          isRitual: false,
          originRitualId: null,
          khetProgramId: 'standalone',
          tags: ['Cardio', 'Khet-Station'],
        });
      } catch {
        // Non-critical — don't block the session save
      }
      onClose();
    } catch (err) {
      console.error('[QuickLogCardio] save failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: 'Save failed', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#060810]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-red-900/40 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-red-400" />
          <div>
            <h2 className="font-headline text-red-300 text-base uppercase tracking-widest leading-none">Log Cardio</h2>
            <p className="text-sm text-zinc-400 mt-0.5">Quick standalone session</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded text-zinc-400 active:scale-90 transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Timer */}
        <QuickTimer
          onCapture={(mins) => {
            setSegments((prev) => {
              const emptyIdx = prev.findIndex((s) => !s.duration);
              if (emptyIdx !== -1) return prev.map((s, i) => i === emptyIdx ? { ...s, duration: String(mins) } : s);
              return prev.map((s, i) => i === 0 ? { ...s, duration: String(mins) } : s);
            });
          }}
        />

        {/* Exercises */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-headline uppercase tracking-[0.2em] text-zinc-300">
              Exercises
            </label>
            {errors.duration && (
              <span className="text-sm text-red-400 font-headline">{errors.duration}</span>
            )}
          </div>
          {segments.map((seg, idx) => {
            const segCals = segmentEstimates[idx] ?? 0;
            if (seg.done) {
              return (
                <div key={idx} className="rounded-xl border border-green-800/50 bg-green-950/10 px-3 py-2.5 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border border-green-500/60 bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-headline text-green-300 leading-none">{seg.exerciseName}</p>
                    <p className="text-xs text-green-700 mt-0.5">
                      {seg.duration} min
                      {segCals > 0 ? ` · ~${segCals} kcal` : ''}
                      {seg.roundCount > 0 ? ` · ${seg.roundCount} rounds` : ''}
                      {seg.repTally > 0 ? ` · ${seg.repTally} reps` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, done: false } : s))}
                    className="text-xs text-zinc-600 active:text-zinc-400 transition-colors flex-shrink-0"
                  >
                    Undo
                  </button>
                </div>
              );
            }
            return (
              <div key={idx} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-headline text-zinc-600 w-5 flex-shrink-0 text-center">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <ExercisePicker
                      selectedId={seg.exerciseId}
                      onSelect={(id, name) =>
                        setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, exerciseId: id, exerciseName: name } : s))
                      }
                    />
                  </div>
                  {segments.length > 1 && (
                    <button
                      onClick={() => setSegments((prev) => prev.filter((_, i) => i !== idx))}
                      className="w-8 h-8 rounded-lg border border-zinc-700 text-zinc-400 flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      ref={idx === 0 ? durationRef : undefined}
                      type="number"
                      min={1}
                      value={seg.duration}
                      placeholder="Duration (min)"
                      onChange={(e) => {
                        setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, duration: e.target.value } : s));
                        setErrors((p) => ({ ...p, duration: '' }));
                      }}
                      className={cn(
                        'w-full h-10 bg-black border rounded-lg px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-all',
                        errors.duration && !seg.duration
                          ? 'border-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]'
                          : 'border-zinc-700 focus:border-red-500',
                      )}
                    />
                  </div>
                  {segCals > 0 && (
                    <div className="flex-shrink-0 rounded-lg border border-red-900/40 bg-red-950/10 px-2.5 py-1.5 text-center">
                      <p className="text-sm font-headline text-red-300 tabular-nums leading-none">~{segCals}</p>
                      <p className="text-xs text-red-700">kcal</p>
                    </div>
                  )}
                </div>
                {seg.duration && parseFloat(seg.duration) > 0 && (
                  <button
                    onClick={() => setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, done: true } : s))}
                    className="w-full h-11 rounded-lg border border-zinc-600 bg-zinc-800/60 text-zinc-200 text-sm font-headline uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] active:bg-zinc-700/60 transition-all"
                  >
                    <Check className="w-4 h-4 text-amber-400" /> Mark Complete
                  </button>
                )}
                {!seg.duration || parseFloat(seg.duration) <= 0 ? (
                  <button
                    disabled
                    className="w-full h-11 rounded-lg border border-zinc-800 bg-zinc-900/30 text-zinc-600 text-sm font-headline uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" /> Mark Complete
                  </button>
                ) : null}

                {/* ── Tally Mode (auto-shown for high-density rep exercises) ── */}
                {TALLY_EXERCISE_IDS.has(seg.exerciseId) && (
                  <div className="rounded-xl border border-red-900/50 bg-red-950/10 p-3 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-headline uppercase tracking-widest text-red-400">Round Counter</p>
                      {(seg.roundCount > 0 || seg.repTally > 0) && (
                        <button
                          onClick={() => setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, roundCount: 0, repTally: 0 } : s))}
                          className="text-[9px] text-zinc-600 active:text-zinc-400 font-headline uppercase tracking-wider transition-colors"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    {/* Reps per round chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-headline uppercase tracking-wider text-zinc-400 flex-shrink-0">Reps/round:</span>
                      {[5, 10, 15, 20, 25].map((size) => (
                        <button
                          key={size}
                          onClick={() => setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, roundSize: size } : s))}
                          className={cn(
                            'h-6 px-2 rounded border text-xs font-headline transition-all',
                            seg.roundSize === size
                              ? 'border-red-500/70 bg-red-950/40 text-red-300'
                              : 'border-zinc-600 text-zinc-300 active:border-zinc-400',
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>

                    {/* Rounds row: −/count/+ + Tally button */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          onClick={() => setSegments((prev) => prev.map((s, i) =>
                            i === idx && s.roundCount > 0
                              ? { ...s, roundCount: s.roundCount - 1, repTally: Math.max(0, s.repTally - s.roundSize) }
                              : s
                          ))}
                          className="w-10 h-10 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 text-xl font-headline flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
                        >−</button>
                        <div className="flex-1 text-center">
                          <p className="text-3xl font-headline text-red-200 tabular-nums leading-none">{seg.roundCount}</p>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">Rounds</p>
                        </div>
                        <button
                          onClick={() => setSegments((prev) => prev.map((s, i) =>
                            i === idx ? { ...s, roundCount: s.roundCount + 1, repTally: s.repTally + s.roundSize } : s
                          ))}
                          className="w-10 h-10 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 text-xl font-headline flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
                        >+</button>
                      </div>
                      <button
                        onClick={() => handleSegmentTally(idx)}
                        className="flex-shrink-0 px-4 rounded-lg border border-red-700/60 bg-red-950/30 text-red-200 text-xs font-headline uppercase tracking-widest active:scale-[0.97] active:bg-red-900/40 transition-all"
                        style={{ minHeight: '48px' }}
                      >
                        Tally Round
                      </button>
                    </div>

                    {/* Total reps row with fine ±1 adjustment */}
                    <div className="flex items-center justify-between pt-0.5 border-t border-red-900/30">
                      <p className="text-[9px] font-headline uppercase tracking-widest text-zinc-600">
                        Total Reps
                        {seg.roundCount > 0 && <span className="text-zinc-700 ml-1">({seg.roundCount} × {seg.roundSize})</span>}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, repTally: Math.max(0, s.repTally - 1) } : s))}
                          className="w-7 h-7 rounded border border-zinc-700 bg-zinc-900 text-zinc-400 text-sm font-headline flex items-center justify-center active:scale-90 transition-all"
                        >−</button>
                        <span className="text-lg font-headline text-red-300 tabular-nums w-10 text-center">{seg.repTally}</span>
                        <button
                          onClick={() => setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, repTally: s.repTally + 1 } : s))}
                          className="w-7 h-7 rounded border border-zinc-700 bg-zinc-900 text-zinc-400 text-sm font-headline flex items-center justify-center active:scale-90 transition-all"
                        >+</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <button
            onClick={() =>
              setSegments((prev) => [
                ...prev,
                { exerciseId: 'treadmill-run', exerciseName: 'Treadmill Run', duration: '', done: false, repTally: 0, roundCount: 0, roundSize: 10 },
              ])
            }
            className="w-full py-2.5 rounded-xl border border-dashed border-zinc-700 text-zinc-400 text-sm font-headline uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Exercise
          </button>
        </div>

        {/* Live calorie estimate */}
        {totalEstimatedCals > 0 && (
          <div className="rounded-xl border border-red-900/40 bg-red-950/10 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-headline uppercase tracking-widest text-red-400">
                {segments.length > 1 ? 'Total Estimated Burn' : 'Estimated Burn'}
              </p>
              <p className="text-2xl font-headline text-red-300 tabular-nums leading-none">{totalEstimatedCals} <span className="text-sm text-red-500">kcal</span></p>
            </div>
            <Flame className="w-7 h-7 text-red-800/60" />
          </div>
        )}
        {bodyWeightKg < 40 && !totalEstimatedCals && (
          <p className="text-sm text-zinc-500 text-center">Set your body weight in Athlete Profile to see calorie estimates.</p>
        )}

        {/* Secondary stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-headline uppercase tracking-[0.2em] text-zinc-300 block">Avg BPM</label>
            <input
              type="number" min={0} value={bpm} placeholder="e.g. 145"
              onChange={(e) => setBpm(e.target.value)}
              className="w-full h-10 bg-black border border-zinc-700 rounded-lg px-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <label className="text-sm font-headline uppercase tracking-[0.2em] text-zinc-300">RPE (1–10)</label>
              <RPEInfoPopover />
              <span className="text-sm text-red-400 ml-1">Increases calorie accuracy</span>
            </div>
            <input
              type="number" min={1} max={10} value={rpe} placeholder="5"
              onChange={(e) => setRpe(e.target.value)}
              className="w-full h-10 bg-black border border-zinc-700 rounded-lg px-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-headline uppercase tracking-[0.2em] text-zinc-300 block">Distance ({distanceUnit})</label>
            <input
              type="number" min={0} step={0.1} value={distance} placeholder="0"
              onChange={(e) => setDistance(e.target.value)}
              className="w-full h-10 bg-black border border-zinc-700 rounded-lg px-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-headline uppercase tracking-[0.2em] text-zinc-300 block">Calories</label>
            <input
              type="number" min={0}
              value={caloriesOverride}
              placeholder={totalEstimatedCals > 0 ? `${totalEstimatedCals}` : '—'}
              onChange={(e) => setCaloriesOverride(e.target.value)}
              className="w-full h-10 bg-black border border-zinc-700 rounded-lg px-3 text-sm text-red-300 placeholder:text-zinc-600 focus:outline-none focus:border-red-500 font-headline"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-headline uppercase tracking-[0.2em] text-zinc-300 block">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Distance, pace, any notes…"
            rows={2}
            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-700 resize-none focus:outline-none focus:border-red-500"
          />
        </div>


      </div>

      {/* Save footer */}
      <div className="px-4 py-4 border-t border-zinc-800 flex-shrink-0 space-y-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-xl border border-red-500 bg-red-600/20 text-red-100 font-headline uppercase tracking-widest text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40 shadow-[0_0_16px_rgba(239,68,68,0.3)]"
        >
          <Flame className="w-4 h-4" />
          {saving ? 'Logging…' : 'Log Session'}
        </button>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-headline uppercase tracking-widest active:scale-[0.98] transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
