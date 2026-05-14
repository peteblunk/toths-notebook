"use client";

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { X, Dumbbell, Activity, Flame, Zap, Archive } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { useKhet } from '@/hooks/use-khet';
import { cn } from '@/lib/utils';
import type { WorkoutSession } from '@/lib/khet-types';
import type { MobilitySessionLog } from '@/lib/mobility-types';
import type { CoreSessionLog } from '@/lib/core-types';
import type { CardioSessionLog } from '@/lib/endurance-types';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ModuleType = 'strength' | 'mobility' | 'core' | 'cardio';

interface ProgramHistoryPanelProps {
  programId: string;
  programName: string;
  module: ModuleType;
  onClose: () => void;
}

const MODULE_STYLE: Record<ModuleType, {
  accent: string; headerBorder: string; sectionBorder: string;
  dateFg: string; divider: string; icon: React.ReactNode; label: string;
}> = {
  strength: { accent: 'text-amber-300', headerBorder: 'border-amber-400', sectionBorder: 'border-amber-900/40', dateFg: 'text-amber-300', divider: 'border-amber-900/25', icon: <Dumbbell className="w-5 h-5" />, label: 'Mass Displacement Engine' },
  mobility: { accent: 'text-blue-300',  headerBorder: 'border-blue-400',  sectionBorder: 'border-blue-900/40',  dateFg: 'text-blue-300',  divider: 'border-blue-900/25',  icon: <Activity className="w-5 h-5" />, label: 'Mobility' },
  core:     { accent: 'text-orange-300', headerBorder: 'border-orange-400', sectionBorder: 'border-orange-900/40', dateFg: 'text-orange-300', divider: 'border-orange-900/25', icon: <Flame className="w-5 h-5" />, label: 'Core' },
  cardio:   { accent: 'text-red-300',   headerBorder: 'border-red-400',   sectionBorder: 'border-red-900/40',   dateFg: 'text-red-300',   divider: 'border-red-900/25',   icon: <Zap className="w-5 h-5" />,    label: 'Endurance Engine' },
};

// ─────────────────────────────────────────────────────────────
// Spreadsheet row helpers
// ─────────────────────────────────────────────────────────────

interface ExerciseOccurrence {
  date: string; label: string;
  sets: { weight?: number; reps?: number; rpe?: number }[];
  notes?: string;
  wasSubstitute: boolean; originalName?: string;
}
interface SlotOccurrence    { date: string; label: string; perf?: { weight?: number; reps?: number; seconds?: number }; }
interface SimpleOccurrence  { date: string; label: string; }
interface CardioOccurrence  { date: string; label: string; durationMinutes?: number; calories?: number; avgBPM?: number; rpe?: number; notes?: string; }

// ── Date block: left column = date, right = content ──
function DateBlock({
  date, label, isLast, dateFg, divider, children,
}: {
  date: string; label: string; isLast: boolean;
  dateFg: string; divider: string; children: React.ReactNode;
}) {
  return (
    <div className={cn('flex gap-0', !isLast && `border-b border-dashed ${divider}`)}>
      <div className="w-14 flex-shrink-0 pt-2 pb-2 pr-2">
        <p className={cn('text-xs font-headline tabular-nums leading-tight', dateFg)}>
          {format(parseISO(date), 'MMM d')}
        </p>
        <p className="text-[9px] text-zinc-500 font-headline tabular-nums mt-0.5 leading-tight">
          {format(parseISO(date), 'yy')}
        </p>
      </div>
      <div className="flex-1 border-l border-zinc-800/60 pl-3 py-2 min-w-0">
        {label && (
          <p className="text-[9px] font-headline uppercase tracking-widest text-zinc-400 mb-1">{label}</p>
        )}
        {children}
      </div>
    </div>
  );
}

// ── Section header (sticky, per-exercise) ──
function ExerciseSection({
  name, count, accent, sectionBorder, children,
}: {
  name: string; count: number; accent: string; sectionBorder: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div className={cn('flex items-baseline gap-3 px-4 py-1.5 sticky top-0 bg-background z-10 border-b', sectionBorder)}>
        <h3 className={cn('font-headline text-xs uppercase tracking-widest', accent)}>{name}</h3>
        <span className="text-zinc-400 text-[10px] font-headline">{count}×</span>
      </div>
      <div className="px-4">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Normalised session record used for rendering
// ─────────────────────────────────────────────────────────────

interface HistoryEntry {
  id: string;
  date: string;
  completedAt?: string;
  label: string;
  durationMinutes?: number;
  // strength
  totalVolume?: number;
  exerciseLogs?: WorkoutSession['exerciseLogs'];
  notes?: string;
  // mobility / core
  slotsCompleted?: string[];
  performanceData?: CoreSessionLog['performanceData'];
  // cardio
  calories?: number;
  avgBPM?: number;
  rpe?: number;
  exerciseName?: string;
  segments?: CardioSessionLog['segments'];
  maxFinisherDone?: boolean;
  finisherCalories?: number;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function ProgramHistoryPanel({ programId, programName, module, onClose }: ProgramHistoryPanelProps) {
  const { getDiaryEntries, weightUnit } = useKhet();
  const { user } = useAuth();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const style = MODULE_STYLE[module];

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const load = async () => {
      const uid = user.uid;

      if (module === 'strength') {
        // Strength sessions are stored encrypted via the khet hook
        const all = await getDiaryEntries(500);
        const filtered = all
          .filter((s) => s.programId === programId)
          .sort((a, b) => (b.completedAt ?? b.date).localeCompare(a.completedAt ?? a.date));
        setEntries(filtered.map((s) => ({
          id: s.id,
          date: s.date,
          completedAt: s.completedAt,
          label: s.dayLabel,
          durationMinutes: s.durationMinutes,
          totalVolume: s.totalVolume,
          exerciseLogs: s.exerciseLogs,
          notes: s.notes,
        })));

      } else if (module === 'mobility') {
        const snap = await getDocs(query(
          collection(db, 'mobilitySessions'),
          where('userId', '==', uid),
          where('programId', '==', programId),
          where('completed', '==', true),
        ));
        const docs = snap.docs
          .map((d) => { const s = { id: d.id, ...d.data() } as MobilitySessionLog; return s; })
          .sort((a, b) => (b.completedAt ?? b.date).localeCompare(a.completedAt ?? a.date));
        setEntries(docs.map((s) => ({
            id: s.id, date: s.date, completedAt: s.completedAt,
            label: s.label, durationMinutes: s.durationMinutes,
            slotsCompleted: s.slotsCompleted,
          })));

      } else if (module === 'core') {
        const snap = await getDocs(query(
          collection(db, 'coreSessions'),
          where('userId', '==', uid),
          where('programId', '==', programId),
          where('completed', '==', true),
        ));
        const docs = snap.docs
          .map((d) => { const s = { id: d.id, ...d.data() } as CoreSessionLog; return s; })
          .sort((a, b) => (b.completedAt ?? b.date).localeCompare(a.completedAt ?? a.date));
        setEntries(docs.map((s) => ({
            id: s.id, date: s.date, completedAt: s.completedAt,
            label: s.label, durationMinutes: s.durationMinutes,
            slotsCompleted: s.slotsCompleted, performanceData: s.performanceData,
          })));

      } else {
        // cardio
        const snap = await getDocs(query(
          collection(db, 'cardioSessions'),
          where('userId', '==', uid),
          where('programId', '==', programId),
          where('completed', '==', true),
        ));
        const docs = snap.docs
          .map((d) => { const s = { id: d.id, ...d.data() } as CardioSessionLog; return s; })
          .sort((a, b) => (b.completedAt ?? b.date).localeCompare(a.completedAt ?? a.date));
        setEntries(docs.map((s) => ({
            id: s.id,
            date: s.date,
            completedAt: s.completedAt,
            label: s.label,
            durationMinutes: s.durationMinutes,
            calories: s.calories,
            avgBPM: s.avgBPM,
            rpe: s.rpe,
            exerciseName: s.exerciseName,
            notes: s.notes,
            segments: s.segments,
            maxFinisherDone: s.maxFinisherDone,
            finisherCalories: s.finisherCalories,
          })));
      }

      setLoading(false);
    };

    load();
  }, [user, programId, module, getDiaryEntries]);

  // ── Build spreadsheet groupings ──

  // STRENGTH — by exercise name, newest-first per exercise
  const strengthByExercise: [string, ExerciseOccurrence[]][] = (() => {
    if (module !== 'strength') return [];
    const map = new Map<string, ExerciseOccurrence[]>();
    for (const entry of entries) {
      for (const exLog of entry.exerciseLogs ?? []) {
        const done = exLog.sets.filter((s) => s.completed);
        if (done.length === 0) continue;
        if (!map.has(exLog.name)) map.set(exLog.name, []);
        map.get(exLog.name)!.push({
          date: entry.date, label: entry.label ?? '',
          sets: done.map((s) => ({ weight: s.weight, reps: s.reps, rpe: s.rpe })),
          notes: exLog.notes,
          wasSubstitute: !!exLog.originalName, originalName: exLog.originalName,
        });
      }
    }
    for (const occs of map.values()) occs.sort((a, b) => b.date.localeCompare(a.date));
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  })();

  // CORE — by slot name
  const coreByExercise: [string, SlotOccurrence[]][] = (() => {
    if (module !== 'core') return [];
    const map = new Map<string, SlotOccurrence[]>();
    for (const entry of entries) {
      for (const slotId of entry.slotsCompleted ?? []) {
        const name = slotId.replace(/-/g, ' ');
        if (!map.has(name)) map.set(name, []);
        map.get(name)!.push({ date: entry.date, label: entry.label ?? '', perf: entry.performanceData?.[slotId] });
      }
    }
    for (const occs of map.values()) occs.sort((a, b) => b.date.localeCompare(a.date));
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  })();

  // MOBILITY — by slot name, just attendance
  const mobilityByExercise: [string, SimpleOccurrence[]][] = (() => {
    if (module !== 'mobility') return [];
    const map = new Map<string, SimpleOccurrence[]>();
    for (const entry of entries) {
      for (const slotId of entry.slotsCompleted ?? []) {
        const name = slotId.replace(/-/g, ' ');
        if (!map.has(name)) map.set(name, []);
        map.get(name)!.push({ date: entry.date, label: entry.label ?? '' });
      }
    }
    for (const occs of map.values()) occs.sort((a, b) => b.date.localeCompare(a.date));
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  })();

  // CARDIO — by primary exercise name
  const cardioByExercise: [string, CardioOccurrence[]][] = (() => {
    if (module !== 'cardio') return [];
    const map = new Map<string, CardioOccurrence[]>();
    for (const entry of entries) {
      const exName = entry.exerciseName ?? 'Cardio';
      if (!map.has(exName)) map.set(exName, []);
      map.get(exName)!.push({
        date: entry.date, label: entry.label ?? '',
        durationMinutes: entry.durationMinutes, calories: entry.calories,
        avgBPM: entry.avgBPM, rpe: entry.rpe, notes: entry.notes,
      });
    }
    for (const occs of map.values()) occs.sort((a, b) => b.date.localeCompare(a.date));
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  })();

  const isEmpty =
    (module === 'strength' && strengthByExercise.length === 0) ||
    (module === 'core' && coreByExercise.length === 0) ||
    (module === 'mobility' && mobilityByExercise.length === 0) ||
    (module === 'cardio' && cardioByExercise.length === 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className={cn('flex items-center justify-between px-4 py-3 border-b flex-shrink-0', style.headerBorder)}>
        <div className="flex items-center gap-2">
          <span className={style.accent}>{style.icon}</span>
          <div>
            <h2 className={cn('font-headline text-lg uppercase tracking-widest', style.accent)}>{programName}</h2>
            <p className="text-xs text-zinc-400 font-headline uppercase tracking-widest">{style.label} — All Session Data</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded text-zinc-300 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-40">
            <p className="text-zinc-500 text-sm font-headline uppercase tracking-widest animate-pulse">
              Loading session archive…
            </p>
          </div>
        )}

        {!loading && isEmpty && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Archive className="w-8 h-8 text-zinc-700" />
            <p className="text-zinc-500 text-sm">No completed sessions found for this program.</p>
          </div>
        )}

        {/* ── STRENGTH ── */}
        {!loading && module === 'strength' && strengthByExercise.map(([exName, occs]) => (
          <ExerciseSection key={exName} name={exName} count={occs.length} accent={style.accent} sectionBorder={style.sectionBorder}>
            {occs.map((occ, oi) => (
              <DateBlock key={oi} date={occ.date} label={occ.label} isLast={oi === occs.length - 1} dateFg={style.dateFg} divider={style.divider}>
                {/* Column headers — only on the first (newest) date row */}
                {oi === 0 && (
                  <div className="flex items-center mb-1 pb-0.5 border-b border-zinc-800/40">
                    <span className="w-8 flex-shrink-0 text-[9px] font-headline uppercase tracking-wider text-zinc-400">Set</span>
                    <span className="w-24 flex-shrink-0 text-[9px] font-headline uppercase tracking-wider text-zinc-400">{weightUnit} × reps</span>
                    <span className="w-8 flex-shrink-0 text-[9px] font-headline uppercase tracking-wider text-zinc-400">RPE</span>
                    <span className="text-[9px] font-headline uppercase tracking-wider text-zinc-400">Notes</span>
                  </div>
                )}
                {occ.wasSubstitute && (
                  <p className="text-[9px] text-cyan-300 italic mb-0.5">sub for {occ.originalName}</p>
                )}
                <div className="space-y-px">
                  {occ.sets.map((set, si) => (
                    <div key={si} className="flex items-start gap-0">
                      <span className="w-8 flex-shrink-0 text-xs font-headline tabular-nums text-zinc-400">{si + 1}</span>
                      <span className="w-24 flex-shrink-0 text-xs font-headline tabular-nums text-zinc-200">
                        {set.weight ?? '—'} × {set.reps ?? '—'}
                      </span>
                      <span className="w-8 flex-shrink-0 text-xs tabular-nums text-zinc-300">
                        {set.rpe !== undefined ? set.rpe : ''}
                      </span>
                      {si === 0 && occ.notes?.trim() && (
                        <span className="text-xs text-zinc-300 italic leading-tight min-w-0">{occ.notes}</span>
                      )}
                    </div>
                  ))}
                </div>
              </DateBlock>
            ))}
          </ExerciseSection>
        ))}

        {/* ── CORE ── */}
        {!loading && module === 'core' && coreByExercise.map(([slotName, occs]) => (
          <ExerciseSection key={slotName} name={slotName} count={occs.length} accent={style.accent} sectionBorder={style.sectionBorder}>
            {occs.map((occ, oi) => (
              <DateBlock key={oi} date={occ.date} label={occ.label} isLast={oi === occs.length - 1} dateFg={style.dateFg} divider={style.divider}>
                {occ.perf ? (
                  <span className="text-xs font-headline tabular-nums text-zinc-200">
                    {occ.perf.reps != null && occ.perf.weight != null && occ.perf.weight > 0
                      ? `${occ.perf.weight}${weightUnit} × ${occ.perf.reps}`
                      : occ.perf.reps != null ? `${occ.perf.reps} reps`
                      : occ.perf.seconds != null ? `${occ.perf.seconds}s`
                      : '✓'}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400">✓</span>
                )}
              </DateBlock>
            ))}
          </ExerciseSection>
        ))}

        {/* ── MOBILITY ── */}
        {!loading && module === 'mobility' && mobilityByExercise.map(([exName, occs]) => (
          <ExerciseSection key={exName} name={exName} count={occs.length} accent={style.accent} sectionBorder={style.sectionBorder}>
            {occs.map((occ, oi) => (
              <DateBlock key={oi} date={occ.date} label={occ.label} isLast={oi === occs.length - 1} dateFg={style.dateFg} divider={style.divider}>
                <span className="text-xs text-zinc-400">✓</span>
              </DateBlock>
            ))}
          </ExerciseSection>
        ))}

        {/* ── CARDIO ── */}
        {!loading && module === 'cardio' && cardioByExercise.map(([exName, occs]) => (
          <ExerciseSection key={exName} name={exName} count={occs.length} accent={style.accent} sectionBorder={style.sectionBorder}>
            {occs.map((occ, oi) => (
              <DateBlock key={oi} date={occ.date} label={occ.label} isLast={oi === occs.length - 1} dateFg={style.dateFg} divider={style.divider}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  {occ.durationMinutes != null && (
                    <span className="text-xs font-headline tabular-nums text-zinc-200">{occ.durationMinutes}m</span>
                  )}
                  {occ.calories != null && occ.calories > 0 && (
                    <span className="text-xs font-headline tabular-nums text-red-300">{occ.calories} kcal</span>
                  )}
                  {occ.avgBPM != null && occ.avgBPM > 0 && (
                    <span className="text-xs tabular-nums text-zinc-400">{occ.avgBPM} bpm</span>
                  )}
                  {occ.rpe != null && (
                    <span className="text-xs text-zinc-400 tabular-nums">@{occ.rpe}</span>
                  )}
                </div>
                {occ.notes?.trim() && (
                  <p className="text-xs text-zinc-300 italic leading-snug mt-0.5">↳ {occ.notes}</p>
                )}
              </DateBlock>
            ))}
          </ExerciseSection>
        ))}
      </div>
    </div>
  );
}
