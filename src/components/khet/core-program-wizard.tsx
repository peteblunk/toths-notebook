"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Flame, Check, GripVertical, Trash2, Info, Pencil, Plus, Search, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCore } from '@/hooks/use-core';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  CORE_EXERCISES,
  generateCoreProgram,
  type CoreFitnessLevel,
  type CoreGoal,
  type CoreFocusArea,
  type CoreExercise,
  type CoreProgram,
} from '@/lib/core-types';

// ─────────────────────────────────────────────────────────────
// Static config
// ─────────────────────────────────────────────────────────────

const LEVELS: { id: CoreFitnessLevel; label: string; desc: string }[] = [
  { id: 'Beginner', label: 'Beginner', desc: 'New to core training or returning after a long break.' },
  { id: 'Intermediate', label: 'Intermediate', desc: 'Comfortable with planks, crunches, and hanging knee raises.' },
  { id: 'Advanced', label: 'Advanced', desc: 'Can do hanging leg raises, ab wheel rollouts, and dragon flag eccentrics.' },
  { id: 'Elite', label: 'Elite', desc: 'Front lever progressions, full dragon flags, ring work.' },
];

const GOALS: { id: CoreGoal; label: string; icon: string; desc: string }[] = [
  { id: 'Strength', label: 'Strength', icon: '💪', desc: 'Weighted & compound core movements. Low reps, high load.' },
  { id: 'Endurance', label: 'Endurance', icon: '⚡', desc: 'High volume, timed holds, and metabolic circuits.' },
  { id: 'Athletic', label: 'Athletic', icon: '🏃', desc: 'Anti-rotation, stability, and explosive power.' },
  { id: 'Aesthetics', label: 'Aesthetics', icon: '🔥', desc: 'Balanced hypertrophy across all core muscles.' },
];

const FOCUS_AREAS: { id: CoreFocusArea; label: string; icon: string }[] = [
  { id: 'Upper Abs', label: 'Upper Abs', icon: '⬆️' },
  { id: 'Lower Abs', label: 'Lower Abs', icon: '⬇️' },
  { id: 'Obliques', label: 'Obliques', icon: '↗️' },
  { id: 'Deep Core', label: 'Deep Core', icon: '🎯' },
  { id: 'Full Core', label: 'Full Core', icon: '💫' },
];

const DAYS_OPTIONS = [2, 3, 4, 5] as const;
const DURATION_OPTIONS = [4, 6, 8, 12] as const;

const LEVEL_COLORS: Record<CoreFitnessLevel, string> = {
  Beginner: 'text-green-300 border-green-500 bg-green-950/30',
  Intermediate: 'text-amber-300 border-amber-500 bg-amber-950/30',
  Advanced: 'text-orange-300 border-orange-500 bg-orange-950/30',
  Elite: 'text-red-300 border-red-500 bg-red-950/30',
};

const LEVEL_SELECTED_GLOW: Record<CoreFitnessLevel, string> = {
  Beginner: 'shadow-[0_0_12px_rgba(74,222,128,0.4)]',
  Intermediate: 'shadow-[0_0_12px_rgba(245,158,11,0.4)]',
  Advanced: 'shadow-[0_0_12px_rgba(249,115,22,0.4)]',
  Elite: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]',
};

// ─────────────────────────────────────────────────────────────
// Volume Meter
// ─────────────────────────────────────────────────────────────

function VolumeMeter({ totalSets }: { totalSets: number }) {
  const capped = Math.min(totalSets, 12);
  const pct = totalSets === 0 ? 0 : Math.min(100, (capped / 12) * 100);
  const zone = capped <= 6 ? 0 : capped <= 10 ? 1 : 2;
  const zoneLabels = ['Baseline', 'Hypertrophy Zone', 'Maximum Threshold'];
  const fillClasses = [
    'bg-zinc-500',
    'bg-green-500 shadow-[0_0_8px_rgba(74,222,128,0.6)]',
    'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]',
  ];
  const textClasses = ['text-zinc-400', 'text-green-400', 'text-orange-400'];
  const badgeClasses = [
    'text-zinc-500 border-zinc-700 bg-zinc-900',
    'text-green-400 border-green-700/50 bg-green-950/20',
    'text-orange-400 border-orange-700/50 bg-orange-950/20',
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-headline uppercase tracking-widest text-zinc-500">
          Volume Meter
        </span>
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-headline tabular-nums', textClasses[zone])}>
            {totalSets}
          </span>
          <span className="text-[9px] text-zinc-600">sets / session</span>
          <span className={cn(
            'text-[9px] font-headline uppercase tracking-wider px-1.5 py-0.5 rounded border',
            badgeClasses[zone],
          )}>
            {zoneLabels[zone]}
          </span>
        </div>
      </div>

      {/* Bar with zone markers */}
      <div className="relative h-3 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-500', fillClasses[zone])}
          style={{ width: `${pct}%` }}
        />
        {/* 50% = 6 sets, 83.3% = 10 sets */}
        <div className="absolute inset-y-0 w-px bg-zinc-600/70" style={{ left: '50%' }} />
        <div className="absolute inset-y-0 w-px bg-zinc-600/70" style={{ left: '83.33%' }} />
      </div>

      <div className="flex text-[8px] leading-none select-none">
        <span className="text-zinc-600 flex-1">0–6 Baseline</span>
        <span className="text-green-800 flex-1 text-center">7–10 Hypertrophy</span>
        <span className="text-orange-800 text-right">11–12 Max</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Swap / Add exercise picker modal
// ─────────────────────────────────────────────────────────────

/** Compute "near-equivalent" exercises for a given exercise.
 *  Near-equivalents share the same category, or same exercise type, or adjacent level.
 */
function getNearEquivalents(ex: CoreExercise, excluded: string[]): CoreExercise[] {
  const LEVEL_ORDER: CoreFitnessLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
  const myLevelIdx = LEVEL_ORDER.indexOf(ex.level);

  return CORE_EXERCISES.filter((candidate) => {
    if (candidate.id === ex.id) return false;
    if (excluded.includes(candidate.id)) return false;
    const candidateLevelIdx = LEVEL_ORDER.indexOf(candidate.level);
    const sameCategory = candidate.category === ex.category;
    const sameType = candidate.type === ex.type;
    const adjacentLevel = Math.abs(candidateLevelIdx - myLevelIdx) <= 1;
    return (sameCategory && adjacentLevel) || (sameType && sameCategory);
  }).slice(0, 8);
}

interface ExercisePickerModalProps {
  /** When provided, shows "near equivalents" section for this exercise */
  swapTarget?: CoreExercise;
  /** IDs already present in the session (to exclude from picker) */
  excludedIds: string[];
  title: string;
  onPick: (ex: CoreExercise) => void;
  onClose: () => void;
}

function ExercisePickerModal({ swapTarget, excludedIds, title, onPick, onClose }: ExercisePickerModalProps) {
  const [search, setSearch] = useState('');

  const nearEquivalents = useMemo(
    () => (swapTarget ? getNearEquivalents(swapTarget, excludedIds) : []),
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

  // Full library grouped by category (shown when no search query and no swap target)
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
          {ex.type === 'time' && ex.baseSeconds && (
            <span className="text-[9px] text-zinc-600">{ex.baseSeconds}s</span>
          )}
          {ex.type !== 'time' && ex.baseReps && (
            <span className="text-[9px] text-zinc-600">{ex.baseReps}</span>
          )}
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
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800 flex-shrink-0">
          <h3 className="font-headline text-orange-300 text-sm uppercase tracking-widest">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
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

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Search results */}
          {search.trim() && (
            <div className="space-y-1.5">
              {searchResults.length === 0 ? (
                <p className="text-zinc-600 text-sm text-center py-4">No results for "{search}"</p>
              ) : (
                searchResults.map((ex) => <ExRow key={ex.id} ex={ex} />)
              )}
            </div>
          )}

          {/* Near-equivalents section */}
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

          {/* Full library grouped by category (Add mode, no search) */}
          {!search.trim() && !swapTarget && allGrouped && (
            Object.entries(allGrouped).map(([category, exList]) => (
              <div key={category} className="space-y-1.5">
                <p className="text-[9px] font-headline uppercase tracking-wider text-orange-500 mb-2">
                  {category}
                </p>
                {exList.map((ex) => <ExRow key={ex.id} ex={ex} />)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Exercise editor (drag-to-reorder + swap + add)
// ─────────────────────────────────────────────────────────────

interface ReviewEditorProps {
  structure: 'single' | 'AB';
  exercises: Record<'single' | 'A' | 'B', CoreExercise[]>;
  onChange: (val: Record<'single' | 'A' | 'B', CoreExercise[]>) => void;
  onTabChange?: (tab: 'single' | 'A' | 'B') => void;
}

function ReviewEditor({ structure, exercises, onChange, onTabChange }: ReviewEditorProps) {
  const [tab, setTab] = useState<'single' | 'A' | 'B'>(structure === 'AB' ? 'A' : 'single');
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [swapIdx, setSwapIdx] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const current = exercises[tab];
  const currentIds = current.map((e) => e.id);

  const reorder = (from: number, to: number) => {
    const arr = [...current];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    onChange({ ...exercises, [tab]: arr });
  };

  const remove = (idx: number) => {
    onChange({ ...exercises, [tab]: current.filter((_, i) => i !== idx) });
  };

  const swapExercise = (idx: number, replacement: CoreExercise) => {
    const arr = [...current];
    arr[idx] = replacement;
    onChange({ ...exercises, [tab]: arr });
    setSwapIdx(null);
  };

  const addExercise = (ex: CoreExercise) => {
    onChange({ ...exercises, [tab]: [...current, ex] });
    setAddOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Tab switcher for AB */}
      {structure === 'AB' && (
        <div className="flex gap-2">
          {(['A', 'B'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); onTabChange?.(t); }}
              className={cn(
                'flex-1 py-2 rounded-lg border text-sm font-headline uppercase tracking-widest transition-all',
                tab === t
                  ? 'border-orange-500 bg-orange-950/30 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.3)]'
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
            onDragStart={() => { dragIdx.current = idx; }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(idx); }}
            onDrop={() => {
              if (dragIdx.current !== null && dragIdx.current !== idx) {
                reorder(dragIdx.current, idx);
              }
              dragIdx.current = null;
              setDragOver(null);
            }}
            onDragEnd={() => { dragIdx.current = null; setDragOver(null); }}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-lg border bg-zinc-900 transition-all cursor-grab active:cursor-grabbing',
              dragOver === idx ? 'border-orange-500/60 bg-orange-950/10' : 'border-zinc-800',
            )}
          >
            <GripVertical className="w-4 h-4 text-zinc-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-zinc-200 truncate">{ex.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-headline uppercase tracking-wider text-orange-500 border border-orange-800/50 rounded px-1 py-0.5">
                  {ex.category}
                </span>
                <span className="text-[9px] text-zinc-500 capitalize">{ex.type}</span>
                {ex.type === 'time' && ex.baseSeconds && (
                  <span className="text-[9px] text-zinc-500">{ex.baseSeconds}s</span>
                )}
                {ex.type !== 'time' && ex.baseReps && (
                  <span className="text-[9px] text-zinc-500">{ex.baseReps} reps</span>
                )}
              </div>
            </div>
            {/* Action buttons */}
            <button
              onClick={() => setSwapIdx(idx)}
              className="p-1 text-zinc-600 hover:text-orange-400 transition-colors flex-shrink-0"
              title="Swap exercise"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => remove(idx)}
              className="p-1 text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0"
              title="Remove exercise"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {current.length === 0 && (
          <p className="text-center text-zinc-600 text-sm py-4">No exercises in this session.</p>
        )}
      </div>

      {/* Add Exercise button */}
      <button
        onClick={() => setAddOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-orange-500/40 text-orange-400 hover:border-orange-400 hover:bg-orange-950/10 text-xs font-headline uppercase tracking-widest transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Exercise
      </button>

      {/* Swap picker */}
      {swapIdx !== null && (
        <ExercisePickerModal
          swapTarget={current[swapIdx]}
          excludedIds={currentIds.filter((_, i) => i !== swapIdx)}
          title="Swap Exercise"
          onPick={(ex) => swapExercise(swapIdx, ex)}
          onClose={() => setSwapIdx(null)}
        />
      )}

      {/* Add picker */}
      {addOpen && (
        <ExercisePickerModal
          excludedIds={currentIds}
          title="Add Exercise"
          onPick={addExercise}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main wizard component
// ─────────────────────────────────────────────────────────────

interface CoreProgramWizardProps {
  open: boolean;
  onClose: () => void;
}

export function CoreProgramWizard({ open, onClose }: CoreProgramWizardProps) {
  const { addProgram } = useCore();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('Core Protocol');
  const [level, setLevel] = useState<CoreFitnessLevel>('Intermediate');
  const [goal, setGoal] = useState<CoreGoal>('Aesthetics');
  const [focusAreas, setFocusAreas] = useState<CoreFocusArea[]>(['Upper Abs', 'Lower Abs', 'Obliques', 'Deep Core']);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [durationWeeks, setDurationWeeks] = useState(6);
  const [volumeIntensity, setVolumeIntensity] = useState<1 | 2 | 3>(2);
  const [maxMode, setMaxMode] = useState(false);
  const [maxGlitch, setMaxGlitch] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [reviewTab, setReviewTab] = useState<'single' | 'A' | 'B'>('single');
  const [saving, setSaving] = useState(false);
  const [cuesModal, setCuesModal] = useState<CoreExercise | null>(null);

  // Review step exercise state
  const [reviewExercises, setReviewExercises] = useState<Record<'single' | 'A' | 'B', CoreExercise[]>>({
    single: [],
    A: [],
    B: [],
  });

  const handleMaxModeToggle = useCallback(() => {
    setMaxMode((v) => {
      const next = !v;

      // 1. Haptic feedback (vibrate on activate only)
      if (next && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([30, 20, 60, 20, 120]);
      }

      // 2. Sizzle / crackle audio (Web Audio API — no file needed)
      if (next) {
        try {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            audioCtxRef.current = new AudioContext();
          }
          const ctx = audioCtxRef.current;
          const bufferSize = ctx.sampleRate * 0.4; // 400 ms
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            // Pink-ish noise with decaying envelope → sizzle
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.6);
          }
          const src = ctx.createBufferSource();
          src.buffer = buffer;

          // Band-pass filter: cut sub-bass & highs, keep the crackle band
          const bpf = ctx.createBiquadFilter();
          bpf.type = 'bandpass';
          bpf.frequency.value = 3200;
          bpf.Q.value = 0.7;

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.55, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);

          src.connect(bpf);
          bpf.connect(gain);
          gain.connect(ctx.destination);
          src.start();
        } catch (_) { /* AudioContext not available — silent fail */ }
      }

      // 3. Glitch flash
      if (next) {
        setMaxGlitch(true);
        setTimeout(() => setMaxGlitch(false), 600);
      }

      return next;
    });
  }, []);

  if (!open) return null;

  const structure: 'single' | 'AB' = daysPerWeek >= 4 ? 'AB' : 'single';
  const totalSessions = durationWeeks * daysPerWeek;

  const toggleFocusArea = (area: CoreFocusArea) => {
    setFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  };

  const buildReview = () => {
    setReviewTab(structure === 'AB' ? 'A' : 'single');
    const sessions = generateCoreProgram(level, goal, focusAreas, daysPerWeek, durationWeeks, undefined, volumeIntensity, maxMode);

    if (structure === 'AB') {
      const sessionA = sessions.find((s) => s.label === 'Core A');
      const sessionB = sessions.find((s) => s.label === 'Core B');
      const toExercises = (session: typeof sessionA): CoreExercise[] =>
        session
          ? session.slots
              .map((slot) => CORE_EXERCISES.find((e) => e.id === slot.exerciseId))
              .filter((e): e is CoreExercise => !!e)
          : [];
      setReviewExercises({ single: [], A: toExercises(sessionA), B: toExercises(sessionB) });
    } else {
      const session = sessions[0];
      const exList = session
        ? session.slots
            .map((slot) => CORE_EXERCISES.find((e) => e.id === slot.exerciseId))
            .filter((e): e is CoreExercise => !!e)
        : [];
      setReviewExercises({ single: exList, A: [], B: [] });
    }
  };

  const handleNext = () => {
    if (step === 2 && focusAreas.length === 0) {
      toast({ title: 'Select at least one focus area', variant: 'destructive' });
      return;
    }
    if (step === 3) {
      buildReview();
    }
    setStep((s) => s + 1);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const customExerciseOrder: Record<'single' | 'A' | 'B', string[]> = {
        single: reviewExercises.single.map((e) => e.id),
        A: reviewExercises.A.map((e) => e.id),
        B: reviewExercises.B.map((e) => e.id),
      };

      const data: Omit<CoreProgram, 'id'> = {
        userId: '',
        name: name.trim() || 'Core Protocol',
        fitnessLevel: level,
        goal,
        focusAreas,
        daysPerWeek,
        durationWeeks,
        structure,
        volumeIntensity,
        maxModeEnabled: maxMode,
        createdAt: format(new Date(), 'yyyy-MM-dd'),
        startDate: null,
        lastSessionDate: null,
        lastSessionIndex: -1,
        sessionsCompleted: 0,
        totalSessions,
        weeklyLog: { weekStr: '', count: 0 },
        customExerciseOrder,
      };

      await addProgram(data);
      toast({
        title: 'Core Program Created',
        description: `${totalSessions} sessions across ${durationWeeks} weeks. Forge the core.`,
      });
      onClose();
      setStep(1);
      setName('Core Protocol');
      setLevel('Intermediate');
      setGoal('Aesthetics');
      setFocusAreas(['Upper Abs', 'Lower Abs', 'Obliques', 'Deep Core']);
      setDaysPerWeek(3);
      setDurationWeeks(6);
      setVolumeIntensity(2);
      setMaxMode(false);
      setReviewTab('single');
    } catch {
      toast({ title: 'Error creating program', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-950 border border-orange-500/40 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="font-headline text-orange-300 text-base uppercase tracking-widest">
              Core &amp; Abs Program
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Step {step} of 4</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step progress bar */}
        <div className="flex h-1 bg-zinc-900">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={cn(
                'flex-1 transition-all duration-500',
                step >= s ? 'bg-orange-500' : 'bg-zinc-800',
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[62vh] overflow-y-auto">

          {/* ── Step 1: Name + Fitness Level ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-headline uppercase tracking-widest text-orange-400 block mb-2">
                  Program Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="Core Protocol"
                  maxLength={40}
                />
              </div>

              <div>
                <label className="text-xs font-headline uppercase tracking-widest text-orange-400 block mb-3">
                  Fitness Level
                </label>
                <div className="space-y-2">
                  {LEVELS.map(({ id, label, desc }) => (
                    <button
                      key={id}
                      onClick={() => setLevel(id)}
                      className={cn(
                        'w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                        level === id
                          ? cn(LEVEL_COLORS[id], LEVEL_SELECTED_GLOW[id])
                          : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500',
                      )}
                    >
                      <div className="flex-1">
                        <div className={cn(
                          'text-sm font-headline uppercase tracking-wider',
                          level === id ? '' : 'text-zinc-300',
                        )}>
                          {label}
                          {level === id && <Check className="w-3.5 h-3.5 inline ml-2" />}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">{desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Goal + Focus Areas ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-headline uppercase tracking-widest text-orange-400 block mb-3">
                  Training Goal
                </label>
                <div className="flex flex-col gap-2">
                  {GOALS.map(({ id, label, icon, desc }) => (
                    <button
                      key={id}
                      onClick={() => setGoal(id)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all w-full',
                        goal === id
                          ? 'border-orange-500 bg-orange-950/30 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                          : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600',
                      )}
                    >
                      <span className="text-base flex-shrink-0">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('text-sm font-headline uppercase tracking-wider', goal === id ? 'text-orange-300' : 'text-zinc-300')}>
                            {label}
                          </span>
                          {goal === id && <Check className="w-3 h-3 text-orange-400" />}
                        </div>
                        <span className="text-[10px] text-zinc-500 leading-relaxed">{desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Volume Intensity Selector ── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-xs font-headline uppercase tracking-widest text-orange-400">
                    Daily Volume Intensity
                  </label>
                </div>
                <div className="flex gap-2">
                  {([1, 2, 3] as const).map((v) => {
                    const cfg = ({
                      1: { label: 'Maintenance', sub: '1 set · tight schedule', icon: '🕐', color: 'cyan' },
                      2: { label: 'Optimal', sub: '2 sets · sweet spot', icon: '⚡', color: 'green' },
                      3: { label: 'Max Push', sub: '3 sets · peak intensity', icon: '🔥', color: 'orange' },
                    } as const)[v];
                    const selected = volumeIntensity === v;
                    const borderColor = selected
                      ? v === 1 ? 'border-cyan-500 bg-cyan-950/30 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : v === 2 ? 'border-green-500 bg-green-950/30 shadow-[0_0_12px_rgba(74,222,128,0.3)]'
                        : 'border-orange-500 bg-orange-950/30 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                      : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500';
                    const labelColor = selected
                      ? v === 1 ? 'text-cyan-300' : v === 2 ? 'text-green-300' : 'text-orange-300'
                      : 'text-zinc-300';
                    return (
                      <button
                        key={v}
                        onClick={() => setVolumeIntensity(v)}
                        className={cn(
                          'flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all',
                          borderColor,
                        )}
                      >
                        <span className="text-lg">{cfg.icon}</span>
                        <span className={cn('text-[11px] font-headline uppercase tracking-wide', labelColor)}>
                          {cfg.label}
                        </span>
                        <span className="text-[9px] text-zinc-500 text-center leading-tight">{cfg.sub}</span>
                        {selected && (
                          <Check className="w-3 h-3" style={{ color: v === 1 ? '#67e8f9' : v === 2 ? '#86efac' : '#fdba74' }} />
                        )}
                      </button>
                    );
                  })}
                </div>
                {/* Science micro-copy */}
                {volumeIntensity >= 2 && (
                  <div className="mt-2.5 flex gap-2 px-3 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60">
                    <Info className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      <span className="text-green-400">
                        Why {volumeIntensity === 2 ? '2' : '3'}+ sets?{' '}
                      </span>
                      {volumeIntensity === 2
                        ? 'Science shows the second set fully recruits deep muscle fibers that sleep during the first. Aesthetics are built in the second round.'
                        : 'The third set is where neural adaptation peaks. Fast-twitch fibers engage fully — the fibers responsible for visible definition.'}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-headline uppercase tracking-widest text-orange-400 block mb-3">
                  Focus Areas (Select All That Apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {FOCUS_AREAS.map(({ id, label, icon }) => (
                    <button
                      key={id}
                      onClick={() => toggleFocusArea(id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-headline uppercase tracking-wider transition-all',
                        focusAreas.includes(id)
                          ? 'border-orange-500 bg-orange-950/30 text-orange-300 shadow-[0_0_8px_rgba(249,115,22,0.25)]'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500',
                      )}
                    >
                      <span>{icon}</span>
                      {label}
                      {focusAreas.includes(id) && <Check className="w-3 h-3 text-orange-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Days/Week + Duration ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-headline uppercase tracking-widest text-orange-400 block mb-3">
                  Days Per Week
                </label>
                <div className="flex gap-2">
                  {DAYS_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDaysPerWeek(d)}
                      className={cn(
                        'flex-1 py-3 rounded-lg border text-sm font-headline uppercase tracking-widest transition-all',
                        daysPerWeek === d
                          ? 'border-orange-500 bg-orange-950/30 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500',
                      )}
                    >
                      {d}×
                    </button>
                  ))}
                </div>

                {/* Structure hint */}
                <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                  {daysPerWeek < 4 ? (
                    <p className="text-xs text-zinc-400">
                      <span className="text-orange-300 font-headline">Full Core</span> — Each session trains all your selected focus areas with a balanced template.
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400">
                      <span className="text-orange-300 font-headline">A/B Split</span> — Day A focuses on Rectus Abdominis (upper + lower abs). Day B focuses on Obliques + Deep Core stability.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-headline uppercase tracking-widest text-orange-400 block mb-3">
                  Program Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDurationWeeks(d)}
                      className={cn(
                        'py-3 rounded-lg border text-sm font-headline transition-all',
                        durationWeeks === d
                          ? 'border-orange-500 bg-orange-950/30 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500',
                      )}
                    >
                      <div className="font-headline uppercase tracking-widest">{d}W</div>
                      <div className="text-[9px] text-zinc-600 mt-0.5">{d * daysPerWeek} sessions</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Review Exercises ── */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Drag to reorder. Swap or remove exercises. The program auto-progresses sets and hold times each week.
              </p>

              {/* Volume Meter */}
              {(() => {
                const activeKey = structure === 'AB'
                  ? (reviewTab === 'single' ? 'A' : reviewTab) as 'A' | 'B'
                  : 'single';
                const exCount = (reviewExercises[activeKey] ?? []).length;
                const rawSets = exCount * volumeIntensity;
                const effectiveSets = maxMode && exCount > 0 ? 12 : rawSets;
                return <VolumeMeter totalSets={effectiveSets} />;
              })()}

              {/* MAX MODE toggle */}
              <button
                onClick={handleMaxModeToggle}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-all text-left',
                  maxMode
                    ? 'border-orange-400 bg-orange-950/30 shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                    : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600',
                  maxGlitch && 'animate-max-glitch',
                )}
              >
                <Zap className={cn('w-5 h-5 flex-shrink-0', maxMode ? 'text-orange-400' : 'text-zinc-500')} />
                <div className="flex-1">
                  <p className={cn(
                    'text-sm font-headline uppercase tracking-wider',
                    maxMode ? 'text-orange-300' : 'text-zinc-400',
                  )}>
                    Max Mode
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                    Hard cap: 12 total sets / session. Big moves get priority — no junk volume.
                  </p>
                </div>
                <div className={cn(
                  'w-10 h-6 rounded-full border-2 flex items-center px-0.5 transition-all duration-300 flex-shrink-0',
                  maxMode ? 'border-orange-500 bg-orange-500' : 'border-zinc-600 bg-zinc-800',
                )}>
                  <div className={cn(
                    'w-4 h-4 rounded-full bg-white transition-transform duration-300',
                    maxMode ? 'translate-x-4' : 'translate-x-0',
                  )} />
                </div>
              </button>

              <ReviewEditor
                structure={structure}
                exercises={reviewExercises}
                onChange={setReviewExercises}
                onTabChange={setReviewTab}
              />

              {/* Summary card */}
              <div className="rounded-xl border border-orange-500/20 bg-orange-950/10 p-4 space-y-3 mt-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="font-headline text-orange-300 uppercase tracking-widest text-sm">
                    {name || 'Core Protocol'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2.5">
                    <div className="text-xs text-zinc-500 mb-1">Level</div>
                    <div className={cn('font-headline', LEVEL_COLORS[level].split(' ')[0])}>{level}</div>
                  </div>
                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2.5">
                    <div className="text-xs text-zinc-500 mb-1">Goal</div>
                    <div className="text-orange-300 font-headline">{goal}</div>
                  </div>
                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2.5">
                    <div className="text-xs text-zinc-500 mb-1">Duration</div>
                    <div className="text-orange-300 font-headline">{durationWeeks} Weeks</div>
                  </div>
                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2.5">
                    <div className="text-xs text-zinc-500 mb-1">Sessions</div>
                    <div className="text-orange-300 font-headline">{totalSessions} Total</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {focusAreas.map((a) => (
                    <span key={a} className="text-[9px] font-headline uppercase tracking-wider text-orange-400 border border-orange-800/40 rounded px-1.5 py-0.5 bg-orange-950/20">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-zinc-800">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 text-sm font-headline uppercase tracking-wider transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <div className="flex-1" />
          {step < 4 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-orange-500 bg-orange-600/20 text-orange-200 hover:bg-orange-600/30 text-sm font-headline uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)]"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg border border-orange-400 bg-orange-600/30 text-orange-200 hover:bg-orange-600/40 text-sm font-headline uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] disabled:opacity-40"
            >
              <Flame className="w-4 h-4" />
              {saving ? 'Forging…' : 'Forge Program'}
            </button>
          )}
        </div>
      </div>

      {/* Cues modal */}
      {cuesModal && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
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
          </div>
        </div>
      )}
    </div>
  );
}
