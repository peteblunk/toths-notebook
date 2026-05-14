"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parseISO, differenceInCalendarDays, startOfWeek } from 'date-fns';
import {
  Activity,
  Plus,
  Moon,
  TrendingUp,
  Calendar,
  ChevronRight,
  BarChart2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobility } from '@/hooks/use-mobility';
import { useToast } from '@/hooks/use-toast';
import { BanishmentPortal } from '@/components/banishment-portal';
import { DuamatefJar } from '@/components/icons/duamatef-jar';
import { CyberStylus } from '@/components/icons/cyber-stylus';
import { MobilityProgramWizard } from './mobility-program-wizard';
import { MobilityExerciseEditor } from './mobility-exercise-editor';
import type { MobilityProgram, MobilityExercise } from '@/lib/mobility-types';
import {
  generateMobilityPlan,
  generatePrebedSession,
} from '@/lib/mobility-types';
import mobilityExercisesData from '@/../public/docs/mobility-exercises.json';

const ALL_EXERCISES = mobilityExercisesData as MobilityExercise[];

// ─────────────────────────────────────────────────────────────
// Helpers for building edit exercise lists from an existing program
// ─────────────────────────────────────────────────────────────

function buildEditExercises(
  program: MobilityProgram,
): Record<'single' | 'A' | 'B', MobilityExercise[]> {
  const toExList = (ids: string[]): MobilityExercise[] =>
    ids
      .map((id) => ALL_EXERCISES.find((e) => e.id === id))
      .filter((e): e is MobilityExercise => !!e);

  if (program.customSlotOrder) {
    return {
      single: toExList(program.customSlotOrder.single),
      A: toExList(program.customSlotOrder.A),
      B: toExList(program.customSlotOrder.B),
    };
  }

  // Fall back to generating from plan (programs created before editor feature)
  const sessions = generateMobilityPlan(program, ALL_EXERCISES);
  const sessionA = sessions.find((s) => s.label === 'Day A' || s.label.startsWith('Session'));
  const sessionB = sessions.find((s) => s.label === 'Day B');
  const slotsToEx = (s: typeof sessionA): MobilityExercise[] =>
    s
      ? s.slots
          .map((slot) => ALL_EXERCISES.find((e) => e.id === slot.exerciseId))
          .filter((e): e is MobilityExercise => !!e)
      : [];

  return {
    single: program.structure === 'single' ? slotsToEx(sessionA) : [],
    A: program.structure === 'AB' ? slotsToEx(sessionA) : [],
    B: program.structure === 'AB' ? slotsToEx(sessionB) : [],
  };
}

// ─────────────────────────────────────────────────────────────
// MobilityEditModal
// ─────────────────────────────────────────────────────────────

interface MobilityEditModalProps {
  program: MobilityProgram;
  onClose: () => void;
  onSave: (programId: string, customSlotOrder: Record<'single' | 'A' | 'B', string[]>) => Promise<void>;
}

function MobilityEditModal({ program, onClose, onSave }: MobilityEditModalProps) {
  const [exercises, setExercises] = useState<Record<'single' | 'A' | 'B', MobilityExercise[]>>(
    () => buildEditExercises(program),
  );
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-950 border border-blue-500/40 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.2)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
          <div>
            <h2 className="font-headline text-blue-300 text-base uppercase tracking-widest">
              Edit Exercises
            </h2>
            <p className="text-sm text-zinc-400 mt-0.5 truncate max-w-[240px]">{program.name}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-sm text-zinc-400 leading-relaxed">
            Changes apply across all 6 weeks. Hold times still scale with progression automatically.
          </p>
          <MobilityExerciseEditor
            structure={program.structure}
            exercises={exercises}
            onChange={setExercises}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-zinc-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 text-sm font-headline uppercase tracking-wider transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-blue-400 bg-blue-600/20 text-blue-200 hover:bg-blue-600/30 text-sm font-headline uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MobilityCard
// ─────────────────────────────────────────────────────────────

interface MobilityCardProps {
  program: MobilityProgram;
  onDelete: () => void;
  onEdit: () => void;
}

function MobilityCard({ program, onDelete, onEdit }: MobilityCardProps) {
  const { undoSession } = useMobility();
  const { toast } = useToast();
  const router = useRouter();
  const sessions = generateMobilityPlan(program, ALL_EXERCISES);
  const [pendingUndo, setPendingUndo] = useState<number | null>(null);
  const [undoing, setUndoing] = useState(false);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const weekStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const sessionsThisWeek =
    program.weeklyLog?.weekStr === weekStr ? program.weeklyLog.count : 0;

  const progressPct = Math.min(
    100,
    Math.round(
      (program.sessionsCompleted / (program.totalMainSessions || 1)) * 100,
    ),
  );

  const weekStart = program.startDate
    ? Math.floor(
        differenceInCalendarDays(new Date(), parseISO(program.startDate)) / 7,
      ) + 1
    : null;
  const currentWeek = weekStart ? Math.min(weekStart, 6) : null;

  const doneToday = program.lastSessionDate === todayStr;
  const nextIdx = program.lastSessionIndex + 1;
  const remainingMainSessions = sessions.filter((s) => s.index >= nextIdx);

  // Build the week's sessions for the day-tab row
  // Show: sessions from the CURRENT week block (same week number)
  const currentWeekSessions = currentWeek
    ? sessions.filter((s) => s.week === currentWeek)
    : sessions.slice(0, program.daysPerWeek);

  const lastIdx = program.lastSessionIndex;

  return (
    <div className="rounded-xl border-2 border-blue-400/85 bg-gradient-to-br from-zinc-950 via-[#050a18] to-[#0a0518] p-4 space-y-4 overflow-hidden shadow-[0_0_18px_rgba(96,165,250,0.28)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-headline text-blue-300 text-lg">{program.name}</h3>
          </div>

          <div className="mt-1.5 space-y-0.5">
            {/* Tight spots as plain text */}
            {program.tightSpots.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {program.tightSpots.map((spot) => (
                  <span key={spot} className="text-[9px] font-headline uppercase tracking-wider text-blue-300 border border-blue-400/80 rounded px-1.5 py-0.5 bg-blue-950/20">
                    {spot}
                  </span>
                ))}
              </div>
            )}
            <div className="text-sm text-blue-300">
              {program.daysPerWeek}× per week
              {program.structure === 'AB' && (
                <span className="text-blue-300 ml-2">A/B Split</span>
              )}
            </div>
            {currentWeek && (
              <div className="text-sm text-blue-300">
                Week {currentWeek} of 6
                {program.startDate && (
                  <span className="text-blue-300 ml-2">
                    (Day {differenceInCalendarDays(new Date(), parseISO(program.startDate))})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Tight spot tags — removed, now shown as plain text above */}

          {/* Progress bar */}
          {program.startDate && (
            <div className="mt-2.5">
              <div className="flex justify-between text-xs text-blue-300 mb-0.5">
                <span>Progress</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    progressPct >= 100 ? 'bg-blue-400' : 'bg-blue-500',
                  )}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 rounded transition-colors text-zinc-400 hover:text-blue-400"
              title="Edit exercises"
            >
              <CyberStylus className="w-8 h-8" />
            </button>
            <BanishmentPortal onConfirm={onDelete} ritualTitle={program.name}>
              <button
                className="p-1.5 rounded transition-colors text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]"
                title="Remove program"
              >
                <DuamatefJar className="w-8 h-8" />
              </button>
            </BanishmentPortal>
          </div>
        </div>
      </div>

      {/* Last session */}
      {program.lastSessionDate && (
        <div className="flex items-center gap-2 text-sm text-blue-300">
          <Calendar className="w-3.5 h-3.5" />
          Last: {format(parseISO(program.lastSessionDate), 'EEE, MMM d')}
        </div>
      )}

      {/* Session tabs for current week */}
      {currentWeekSessions.length > 0 && (
        <>
          <p
            className={cn(
              'text-[10px] font-headline uppercase tracking-widest',
              doneToday ? 'text-green-400' : 'text-blue-300',
            )}
          >
            {doneToday && remainingMainSessions.length === 0
              ? 'Protocol Complete — Rest & Recover'
              : 'Select Day to Begin Session'}
          </p>
          <div className="flex flex-wrap gap-1">
            {currentWeekSessions.map((session) => {
              const isCompleted = session.index <= lastIdx && lastIdx >= 0;
              const isNextUp =
                !doneToday &&
                session.index === nextIdx &&
                nextIdx < program.totalMainSessions;

              if (isCompleted) {
                return (
                  <button
                    key={session.index}
                    onClick={() => setPendingUndo(session.index)}
                    className="flex items-center justify-center px-3 py-2 rounded border text-xs font-headline uppercase tracking-wider transition-all duration-200 whitespace-nowrap border-green-500/60 text-green-300 bg-green-950/20 shadow-[0_0_8px_rgba(74,222,128,0.2)] hover:border-amber-500/60 hover:text-amber-300 cursor-pointer"
                  >
                    {session.label}
                  </button>
                );
              }
              return (
                <Link
                  key={session.index}
                  href={`/khet/mobility/${program.id}/${session.index}`}
                  className={cn(
                    'flex items-center justify-center px-3 py-2 rounded border text-xs font-headline uppercase tracking-wider transition-all duration-200 whitespace-nowrap',
                    isNextUp
                      ? 'border-blue-400 text-blue-200 bg-blue-950/30 shadow-[0_0_12px_rgba(96,165,250,0.5)] [animation:pulse_4s_ease-in-out_infinite]'
                      : 'border-zinc-800 text-zinc-400 hover:border-blue-600/40 hover:text-blue-300 hover:bg-blue-950/5',
                  )}
                >
                  {session.label}
                </Link>
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
                    toast({ title: 'Session undone', description: 'Log erased — edit and re-seal when ready.' });
                    router.push(`/khet/mobility/${program.id}/${pendingUndo}`);
                  } catch {
                    toast({ title: 'Error undoing session', variant: 'destructive' });
                    setUndoing(false);
                    setPendingUndo(null);
                  }
                }}
                disabled={undoing}
                className="px-2.5 py-1 rounded border border-red-500/50 bg-red-950/20 text-red-300 text-[10px] font-headline uppercase tracking-wider hover:bg-red-950/40 transition-all disabled:opacity-50"
              >
                {undoing ? '…' : 'Undo & Edit'}
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

      {/* Pre-bed button */}
      {program.includePreBed && (
        <Link
          href={`/khet/mobility/${program.id}/prebed`}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-indigo-500/40 bg-indigo-950/10 text-indigo-300 hover:bg-indigo-950/25 transition-all text-xs font-headline uppercase tracking-widest w-full"
        >
          <Moon className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1">Pre-Bed Routine</span>
          <span className="text-zinc-500 text-[9px] normal-case tracking-normal font-sans">~10m</span>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        </Link>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// KhetMobility — Dashboard Section
// ─────────────────────────────────────────────────────────────

export function KhetMobility() {
  const { programs, loading, deleteProgram, updateProgram } = useMobility();
  const { toast } = useToast();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<MobilityProgram | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteProgram(id);
      toast({ title: 'Mobility program removed' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleSaveEdit = async (
    programId: string,
    customSlotOrder: Record<'single' | 'A' | 'B', string[]>,
  ) => {
    try {
      await updateProgram(programId, { customSlotOrder });
      toast({ title: 'Exercises updated', description: 'Your custom order applies to all 6 weeks.' });
      setEditingProgram(null);
    } catch {
      toast({ title: 'Error saving changes', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="h-24 rounded-xl border border-blue-500/20 bg-zinc-950/30 animate-pulse" />
    );
  }

  return (
    <>
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-blue-400" />
        <h3 className="font-headline text-blue-400 text-sm uppercase tracking-widest">
          Mobility & Recovery
        </h3>
      </div>

      {/* Program cards */}
      {programs.length === 0 ? (
        <div className="border border-dashed border-blue-500/20 rounded-xl p-8 text-center">
          <Activity className="w-8 h-8 text-blue-900 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No mobility program active.</p>
          <p className="text-zinc-700 text-xs mt-1">6 weeks. Progressive. Science-based.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map((program) => (
            <MobilityCard
              key={program.id}
              program={program}
              onDelete={() => handleDelete(program.id)}
              onEdit={() => setEditingProgram(program)}
            />
          ))}
        </div>
      )}

      <MobilityProgramWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />

      {editingProgram && (
        <MobilityEditModal
          program={editingProgram}
          onClose={() => setEditingProgram(null)}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// MobilityLaunchButton — standalone "Start Mobility Program"
// button for use in the dashboard header area
// ─────────────────────────────────────────────────────────────

export function MobilityLaunchButton() {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setWizardOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-blue-500/60 bg-blue-950/20 text-blue-300 hover:bg-blue-950/40 hover:border-blue-400 font-headline uppercase tracking-widest text-sm transition-all shadow-[0_0_14px_rgba(59,130,246,0.15)] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-[0.98]"
      >
        <Activity className="w-4 h-4" />
        Create Mobility Program
      </button>
      <MobilityProgramWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </>
  );
}
