"use client";

import { format, parseISO } from 'date-fns';
import { History } from 'lucide-react';
import type { WorkoutSession } from '@/lib/khet-types';
import { cn } from '@/lib/utils';

interface GhostLogProps {
  sessions: WorkoutSession[];
  exerciseId: string; // Show ghost data for this specific exercise (original id)
}

/**
 * Renders the last 3 logged set entries for a given exercise
 * as ghost/reference data to guide progressive overload.
 * Also shows any substitute exercise used, and per-exercise notes.
 */
export function GhostLog({ sessions, exerciseId }: GhostLogProps) {
  if (sessions.length === 0) return null;

  const relevant = sessions
    .map((s) => ({
      date: s.date,
      // Match direct use OR substitution of the original exercise
      log: s.exerciseLogs.find(
        (e) => e.exerciseId === exerciseId || e.originalExerciseId === exerciseId,
      ),
    }))
    .filter((x) => x.log && x.log.sets.some((s) => s.completed));

  if (relevant.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {relevant.map(({ date, log }, idx) => {
        const wasSubstituted = !!log!.originalExerciseId && log!.originalExerciseId === exerciseId && log!.exerciseId !== exerciseId;
        const completedSets = log!.sets.filter((s) => s.completed);
        return (
          <div
            key={idx}
            className={cn(
              'rounded border px-2.5 py-2 space-y-1',
              idx === 0
                ? 'border-amber-500/30 bg-amber-950/10'
                : 'border-zinc-800 bg-zinc-950/20',
            )}
          >
            {/* Date + substitute label */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('text-xs font-headline', idx === 0 ? 'text-amber-400' : 'text-zinc-400')}>
                {format(parseISO(date), 'EEE, MMM d')}
              </span>
              {wasSubstituted && (
                <span className="text-xs text-cyan-300 font-headline">
                  → {log!.name}
                </span>
              )}
            </div>
            {/* Sets */}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {completedSets.map((s, si) => (
                <span key={si} className={cn('text-sm font-headline tabular-nums', idx === 0 ? 'text-amber-300' : 'text-zinc-300')}>
                  {s.weight}×{s.reps}
                  {s.rpe !== undefined && (
                    <span className="text-zinc-500 ml-0.5 text-xs">@{s.rpe}</span>
                  )}
                </span>
              ))}
            </div>
            {/* Exercise notes */}
            {log!.notes && log!.notes.trim() && (
              <p className="text-xs text-zinc-400 italic leading-snug">{log!.notes}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Full-day ghost log panel for above the session
// ─────────────────────────────────────────────────────────────

interface GhostLogPanelProps {
  sessions: WorkoutSession[];
}

export function GhostLogPanel({ sessions }: GhostLogPanelProps) {
  if (sessions.length === 0) return null;

  return (
    <div className="border border-zinc-800 rounded-lg p-3 bg-zinc-950/50">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-[10px] font-headline uppercase tracking-[0.3em] text-zinc-500">
          Akashic Record — Last {sessions.length} Session{sessions.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s.id} className="border-l-2 border-zinc-700 pl-3">
            <div className="text-[10px] text-zinc-400 font-headline mb-1">
              {format(parseISO(s.date), 'EEE, MMM d')}
              <span className="ml-2 text-amber-500/60">
                {s.totalVolume.toLocaleString()} kg
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
              {s.exerciseLogs.map((exLog) => {
                const completedSets = exLog.sets.filter((set) => set.completed);
                if (completedSets.length === 0) return null;
                return (
                  <div key={exLog.exerciseId} className="text-[9px] text-zinc-600">
                    <span className="text-zinc-500 mr-1">{exLog.name}:</span>
                    {completedSets.map((s, i) => (
                      <span key={i} className="mr-1.5">
                        {s.weight}×{s.reps}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
