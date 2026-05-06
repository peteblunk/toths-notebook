"use client";

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { X, BookOpen, ChevronDown, ChevronUp, StickyNote, Dumbbell, Activity, Flame, Zap } from 'lucide-react';
import { useKhet } from '@/hooks/use-khet';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';
import type { WorkoutSession } from '@/lib/khet-types';
import type { MobilitySessionLog } from '@/lib/mobility-types';
import type { CoreSessionLog } from '@/lib/core-types';
import type { CardioSessionLog } from '@/lib/endurance-types';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ── Unified diary entry ────────────────────────────────────
type DiaryEntryType = 'khet' | 'mobility' | 'core' | 'cardio';
interface DiaryEntry {
  id: string;
  type: DiaryEntryType;
  date: string;
  programName: string;
  label: string;
  durationMinutes?: number;
  // khet only
  totalVolume?: number;
  exerciseLogs?: WorkoutSession['exerciseLogs'];
  notes?: string;
  // mobility / core
  slotsCompleted?: string[];
  // core only
  performanceData?: CoreSessionLog['performanceData'];
  // cardio only
  calories?: number;
  avgBPM?: number;
  rpe?: number;
  exerciseName?: string;
  segments?: CardioSessionLog['segments'];
  maxFinisherDone?: boolean;
  finisherCalories?: number;
}

const TYPE_STYLE: Record<DiaryEntryType, { border: string; openBorder: string; accent: string; dim: string; icon: React.ReactNode; tag: string }> = {
  khet:     { border: 'border-zinc-800', openBorder: 'border-amber-600/40', accent: 'text-amber-300', dim: 'text-amber-600/60', icon: <Dumbbell className="w-4 h-4" />, tag: 'Strength' },
  mobility: { border: 'border-zinc-800', openBorder: 'border-blue-600/40',  accent: 'text-blue-300',  dim: 'text-blue-600/60',  icon: <Activity className="w-4 h-4" />,  tag: 'Mobility' },
  core:     { border: 'border-zinc-800', openBorder: 'border-orange-600/40', accent: 'text-orange-300', dim: 'text-orange-600/60', icon: <Flame className="w-4 h-4" />, tag: 'Core' },
  cardio:   { border: 'border-zinc-800', openBorder: 'border-red-600/40', accent: 'text-red-300', dim: 'text-red-600/60', icon: <Zap className="w-4 h-4" />, tag: 'Cardio' },
};

interface WorkoutDiaryProps {
  onClose: () => void;
}

export function WorkoutDiary({ onClose }: WorkoutDiaryProps) {
  const { getDiaryEntries, weightUnit } = useKhet();
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const load = async () => {
      const uid = user.uid;

      // 1. Khet (strength) — uses hook which handles decryption
      const khetSessions = await getDiaryEntries(60);
      const khetEntries: DiaryEntry[] = khetSessions.map((s) => ({
        id: s.id,
        type: 'khet',
        date: s.date,
        programName: s.programName,
        label: s.dayLabel,
        durationMinutes: s.durationMinutes,
        totalVolume: s.totalVolume,
        exerciseLogs: s.exerciseLogs,
        notes: s.notes,
      }));

      // 2. Mobility — unencrypted, query directly
      const mobSnap = await getDocs(query(
        collection(db, 'mobilitySessions'),
        where('userId', '==', uid),
        where('completed', '==', true),
        orderBy('date', 'desc'),
        limit(60),
      ));
      const mobEntries: DiaryEntry[] = mobSnap.docs.map((d) => {
        const s = { id: d.id, ...d.data() } as MobilitySessionLog;
        return {
          id: s.id,
          type: 'mobility',
          date: s.date,
          programName: s.programName,
          label: s.label,
          durationMinutes: s.durationMinutes,
          slotsCompleted: s.slotsCompleted,
        };
      });

      // 3. Core — unencrypted, query directly
      const coreSnap = await getDocs(query(
        collection(db, 'coreSessions'),
        where('userId', '==', uid),
        where('completed', '==', true),
        orderBy('date', 'desc'),
        limit(60),
      ));
      const coreEntries: DiaryEntry[] = coreSnap.docs.map((d) => {
        const s = { id: d.id, ...d.data() } as CoreSessionLog;
        return {
          id: s.id,
          type: 'core',
          date: s.date,
          programName: s.programName,
          label: s.label,
          durationMinutes: s.durationMinutes,
          slotsCompleted: s.slotsCompleted,
          performanceData: s.performanceData,
        };
      });

      // 4. Cardio — unencrypted, query directly
      const cardioSnap = await getDocs(query(
        collection(db, 'cardioSessions'),
        where('userId', '==', uid),
        where('completed', '==', true),
        orderBy('date', 'desc'),
        limit(60),
      ));
      const cardioEntries: DiaryEntry[] = cardioSnap.docs.map((d) => {
        const s = { id: d.id, ...d.data() } as CardioSessionLog;
        return {
          id: s.id,
          type: 'cardio',
          date: s.date,
          programName: s.programName,
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
        };
      });

      // Merge + sort newest first
      const all = [...khetEntries, ...mobEntries, ...coreEntries, ...cardioEntries];
      all.sort((a, b) => b.date.localeCompare(a.date));
      setEntries(all);
      setLoading(false);
    };

    load();
  }, [user, getDiaryEntries]);

  // Group entries by date (entries already sorted newest-first)
  const grouped = entries.reduce<{ date: string; items: DiaryEntry[] }[]>((acc, entry) => {
    const last = acc[acc.length - 1];
    if (last && last.date === entry.date) {
      last.items.push(entry);
    } else {
      acc.push({ date: entry.date, items: [entry] });
    }
    return acc;
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <h2 className="font-headline text-amber-400 text-lg uppercase tracking-widest">Workout Diary</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <p className="text-zinc-600 text-xs font-headline uppercase tracking-widest animate-pulse">
              Reading the Akashic Record…
            </p>
          </div>
        )}

        {!loading && grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Dumbbell className="w-8 h-8 text-zinc-700" />
            <p className="text-zinc-500 text-sm">No completed sessions yet.</p>
          </div>
        )}

        {!loading && grouped.map((group) => (
          <div key={group.date} className="space-y-2">
            {/* Date group header */}
            <div className="flex items-center gap-3">
              <h3 className="font-headline text-sm uppercase tracking-[0.25em] text-zinc-300">
                {format(parseISO(group.date), 'EEE, MMM d yyyy')}
              </h3>
              <div className="flex-1 h-[1px] bg-zinc-800" />
              <span className="text-[9px] font-headline uppercase tracking-widest text-zinc-600">
                {group.items.length} session{group.items.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Entries for this day */}
            {group.items.map((entry) => {
          const isOpen = expandedId === entry.id;
          const s = TYPE_STYLE[entry.type];
          const noteCount = entry.exerciseLogs?.filter((e) => !!e.notes?.trim()).length ?? 0;
          const hasSessionNote = !!entry.notes?.trim();

          return (
            <div
              key={entry.id}
              className={cn(
                'rounded-xl border bg-zinc-950/60 overflow-hidden transition-all',
                isOpen ? s.openBorder : s.border,
              )}
            >
              {/* Summary row */}
              <button
                onClick={() => setExpandedId(isOpen ? null : entry.id)}
                className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('w-4 h-4 flex-shrink-0', s.accent)}>{s.icon}</span>
                    <span className={cn('font-headline text-sm uppercase tracking-wider', s.accent)}>
                      {entry.label}
                    </span>
                    <span className="text-zinc-500 text-xs">·</span>
                    <span className="text-zinc-400 text-xs truncate">{entry.programName}</span>
                    <span className={cn('text-[9px] font-headline uppercase tracking-widest border rounded-full px-1.5 py-0.5', s.dim, 'border-current')}>{s.tag}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {!!entry.durationMinutes && (
                      <span className="text-zinc-500 text-xs">{entry.durationMinutes} min</span>
                    )}
                    {entry.type === 'khet' && entry.totalVolume != null && (
                      <span className="text-cyan-400 text-xs">
                        {(entry.totalVolume / 1000).toFixed(1)}t
                      </span>
                    )}
                    {(entry.type === 'mobility' || entry.type === 'core') && entry.slotsCompleted && (
                      <span className="text-zinc-500 text-xs">{entry.slotsCompleted.length} exercises</span>
                    )}
                    {entry.type === 'cardio' && entry.calories != null && entry.calories > 0 && (
                      <span className="text-red-400 text-xs">{entry.calories} kcal</span>
                    )}
                    {entry.type === 'cardio' && entry.avgBPM != null && entry.avgBPM > 0 && (
                      <span className="text-zinc-500 text-xs">{entry.avgBPM} avg BPM</span>
                    )}
                    {(hasSessionNote || noteCount > 0) && (
                      <span className="flex items-center gap-1 text-[10px] font-headline uppercase tracking-wider text-amber-400 border border-amber-600/30 rounded-full px-1.5 py-0.5 bg-amber-950/20">
                        <StickyNote className="w-2.5 h-2.5" />
                        {hasSessionNote && noteCount > 0
                          ? `Session + ${noteCount} note${noteCount > 1 ? 's' : ''}`
                          : hasSessionNote
                          ? 'Session note'
                          : `${noteCount} note${noteCount > 1 ? 's' : ''}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-zinc-500 mt-0.5">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-zinc-800 px-4 py-3 space-y-4">

                  {/* ── Khet (strength) detail ── */}
                  {entry.type === 'khet' && (
                    <>
                      {hasSessionNote && (
                        <div className="rounded-lg border border-amber-600/20 bg-amber-950/10 px-3 py-2.5">
                          <p className="text-[10px] font-headline uppercase tracking-widest text-amber-400 mb-1">Session Notes</p>
                          <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{entry.notes}</p>
                        </div>
                      )}
                      <div className="space-y-2">
                        {entry.exerciseLogs?.map((exLog, idx) => {
                          const completedSets = exLog.sets.filter((s) => s.completed);
                          const bestWeight = completedSets.length > 0
                            ? Math.max(...completedSets.map((s) => s.weight ?? 0))
                            : null;
                          return (
                            <div key={idx} className={cn(
                              'rounded-lg border px-3 py-2.5',
                              exLog.notes?.trim() ? 'border-zinc-700 bg-zinc-900/50' : 'border-zinc-800/50 bg-zinc-950/30',
                            )}>
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-headline text-cyan-300">{exLog.name}</p>
                                  {exLog.originalName && (
                                    <p className="text-[10px] text-zinc-600 italic mt-0.5">Sub for: {exLog.originalName}</p>
                                  )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-xs text-zinc-300">{completedSets.length} set{completedSets.length !== 1 ? 's' : ''}</p>
                                  {bestWeight !== null && bestWeight > 0 && (
                                    <p className="text-[10px] text-zinc-500">Top: {bestWeight}{weightUnit}</p>
                                  )}
                                </div>
                              </div>
                              {completedSets.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {completedSets.map((s, si) => (
                                    <span key={si} className="text-[10px] font-body text-zinc-400 bg-zinc-800/60 rounded px-1.5 py-0.5">
                                      {s.weight ?? 0}{weightUnit} × {s.reps ?? 0}{s.rpe ? ` @${s.rpe}` : ''}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {exLog.notes?.trim() && (
                                <div className="mt-2 pt-2 border-t border-zinc-700/50">
                                  <p className="text-[10px] font-headline uppercase tracking-widest text-zinc-500 mb-0.5">Note</p>
                                  <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{exLog.notes}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* ── Mobility detail ── */}
                  {entry.type === 'mobility' && entry.slotsCompleted && (
                    <div className="flex flex-wrap gap-1.5">
                      {entry.slotsCompleted.map((id) => (
                        <span key={id} className="text-[10px] font-body text-blue-300 bg-blue-950/30 border border-blue-800/40 rounded px-2 py-0.5">
                          {id.replace(/-/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* ── Core detail ── */}
                  {entry.type === 'core' && entry.slotsCompleted && (
                    <div className="space-y-1.5">
                      {entry.slotsCompleted.map((id) => {
                        const perf = entry.performanceData?.[id];
                        return (
                          <div key={id} className="flex items-center justify-between rounded-lg border border-orange-900/30 bg-orange-950/10 px-3 py-1.5">
                            <span className="text-xs font-headline text-orange-200">{id.replace(/-/g, ' ')}</span>
                            {perf && (
                              <span className="text-[10px] text-zinc-500">
                                {perf.reps != null && perf.weight != null && perf.weight > 0
                                  ? `${perf.weight}${weightUnit} × ${perf.reps}`
                                  : perf.reps != null
                                  ? `${perf.reps} reps`
                                  : perf.seconds != null
                                  ? `${perf.seconds}s`
                                  : ''}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ── Cardio detail ── */}
                  {entry.type === 'cardio' && (
                    <div className="space-y-3">
                      {/* Per-segment calorie breakdown */}
                      {entry.segments && entry.segments.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-headline uppercase tracking-widest text-zinc-400">Exercise Breakdown</p>
                          {entry.segments.map((seg, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
                              <p className="text-sm font-headline text-zinc-200">{seg.exerciseName}</p>
                              <div className="text-right">
                                <p className="text-sm font-headline text-red-300">{seg.durationMinutes}m</p>
                                {seg.calories > 0 && (
                                  <p className="text-xs text-red-400">~{seg.calories} kcal</p>
                                )}
                              </div>
                            </div>
                          ))}
                          {/* Max Mode finisher row */}
                          {entry.maxFinisherDone != null && (
                            <div className={cn(
                              'flex items-center justify-between rounded-lg border px-3 py-2',
                              entry.maxFinisherDone
                                ? 'border-green-800/50 bg-green-950/20'
                                : 'border-zinc-800 bg-zinc-900/40 opacity-50',
                            )}>
                              <div className="flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-headline text-red-200">Burpee Finisher</p>
                                  <p className="text-xs text-red-400/70">Max Mode {entry.maxFinisherDone ? '— Completed' : '— Skipped'}</p>
                                </div>
                              </div>
                              {entry.finisherCalories && entry.finisherCalories > 0 && (
                                <div className="text-right">
                                  <p className="text-xs text-red-400">~{entry.finisherCalories} kcal</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {/* Stats row: total calories, BPM, RPE */}
                      <div className="flex flex-wrap gap-2">
                        {entry.calories != null && entry.calories > 0 && (
                          <div className="rounded-lg border border-red-900/40 bg-red-950/15 px-3 py-1.5 text-center">
                            <p className="text-sm font-headline text-red-200">{entry.calories}</p>
                            <p className="text-[9px] text-zinc-500">Total kcal</p>
                          </div>
                        )}
                        {entry.avgBPM != null && entry.avgBPM > 0 && (
                          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-center">
                            <p className="text-sm font-headline text-zinc-200">{entry.avgBPM}</p>
                            <p className="text-[9px] text-zinc-500">Avg BPM</p>
                          </div>
                        )}
                        {entry.rpe != null && (
                          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-center">
                            <p className="text-sm font-headline text-zinc-200">{entry.rpe}</p>
                            <p className="text-[9px] text-zinc-500">RPE</p>
                          </div>
                        )}
                      </div>
                      {entry.notes && (
                        <div className="rounded-lg border border-red-900/20 bg-red-950/10 px-3 py-2">
                          <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{entry.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}
          </div>
        ))}
      </div>
    </div>
  );
}

