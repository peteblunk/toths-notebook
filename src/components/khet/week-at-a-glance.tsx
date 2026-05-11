"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { format, startOfWeek } from 'date-fns';
import { Calendar, ChevronDown, ChevronUp, Dumbbell, Flame, TrendingUp } from 'lucide-react';
import { useKhet } from '@/hooks/use-khet';
import { useMobility } from '@/hooks/use-mobility';
import { useCore } from '@/hooks/use-core';
import { useCardio } from '@/hooks/use-cardio';
import type { WorkoutProgram, WorkoutSession } from '@/lib/khet-types';
import type { MobilityProgram } from '@/lib/mobility-types';
import type { CoreProgram } from '@/lib/core-types';
import type { CardioProgram } from '@/lib/endurance-types';
import { cn } from '@/lib/utils';

interface WeekAtAGlanceProps {
  programs: WorkoutProgram[];
}

// ─── generic remaining-sessions helper for AB/single programs ─

type SimpleProgram = {
  daysPerWeek: number;
  lastSessionIndex: number;
  weeklyLog: { weekStr: string; count: number };
  structure?: 'single' | 'AB';
};

function computeSimpleProgramWeek(
  program: SimpleProgram,
  currentWeekStr: string,
): { doneCount: number; remainingLabels: string[]; doneLabels: string[] } {
  const doneCount =
    program.weeklyLog?.weekStr === currentWeekStr
      ? program.weeklyLog.count
      : 0;

  const remaining = Math.max(0, program.daysPerWeek - doneCount);
  const remainingLabels: string[] = [];

  // lastSessionIndex is only updated for main sessions (not pre-bed).
  // Use it as the anchor for what comes next.
  const lastIdx = program.lastSessionIndex >= 0 ? program.lastSessionIndex : -1;

  for (let i = 1; i <= remaining; i++) {
    const nextIdx = lastIdx + i;
    if (program.structure === 'AB') {
      remainingLabels.push(nextIdx % 2 === 0 ? 'Day A' : 'Day B');
    } else {
      remainingLabels.push(`Session ${nextIdx + 1}`);
    }
  }

  // Done labels are NOT derived here — weeklyLog.count includes pre-bed sessions
  // which would cause false checkmarks (e.g. pre-bed only = shows Day B as done).
  // Done days are already visible in the 7-day calendar strip above.
  return { doneCount, remainingLabels, doneLabels: [] };
}

function computeCardioProgramWeek(
  program: CardioProgram,
  currentWeekStr: string,
): { doneLabels: string[]; remainingLabels: string[] } {
  const doneCount =
    program.weeklyLog?.weekStr === currentWeekStr
      ? program.weeklyLog.count
      : 0;
  const remaining = Math.max(0, program.daysPerWeek - doneCount);

  const doneLabels: string[] = [];
  for (let i = doneCount - 1; i >= 0; i--) {
    doneLabels.unshift(`Session ${program.lastSessionIndex - i + 1}`);
  }
  const remainingLabels: string[] = [];
  for (let i = 1; i <= remaining; i++) {
    remainingLabels.push(`Session ${program.lastSessionIndex + i + 1}`);
  }
  return { doneLabels, remainingLabels };
}

// ─── strength program remaining helper ───────────────────────

function computeStrengthProgramWeek(
  program: WorkoutProgram,
  programSessions: WorkoutSession[],
): { doneDayLabels: string[]; remainingDayLabels: string[] } {
  const doneDayLabels = programSessions.map((s) => s.dayLabel);
  const sessionsThisWeek = programSessions.length;
  const targetPerWeek = program.frequency ?? 4;
  const totalDays = program.days?.length ?? 0;
  const remainingCount = Math.max(0, targetPerWeek - sessionsThisWeek);

  const remainingDayLabels: string[] = [];
  if (totalDays > 0 && remainingCount > 0) {
    const lastDoneIdx =
      programSessions.length > 0
        ? programSessions[programSessions.length - 1].dayIndex
        : (program.lastSessionDayIndex ?? -1);

    for (let i = 1; i <= remainingCount; i++) {
      const nextIdx = (lastDoneIdx + i) % totalDays;
      remainingDayLabels.push(program.days[nextIdx]?.label ?? `Day ${nextIdx + 1}`);
    }
  }

  return { doneDayLabels, remainingDayLabels };
}

// ─── component ───────────────────────────────────────────────

// ─── shared sub-component ────────────────────────────────────

function ProgramRemainingRow({
  name,
  nameColor,
  doneDayLabels,
  remainingDayLabels,
}: {
  name: string;
  nameColor: string;
  doneDayLabels: string[];
  remainingDayLabels: string[];
}) {
  return (
    <div className="space-y-1.5">
      <p className={cn('text-sm font-headline uppercase tracking-widest', nameColor)}>
        {name}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {doneDayLabels.map((label, i) => (
          <span
            key={`done-${i}`}
            className="flex items-center gap-1 px-2.5 py-1 rounded border border-green-500/60 bg-green-950/20 text-green-300 text-xs font-headline uppercase tracking-wider"
          >
            <span className="text-green-400">✓</span>
            {label}
          </span>
        ))}
        {remainingDayLabels.map((label, i) => (
          <span
            key={`rem-${i}`}
            className="px-2.5 py-1 rounded border border-[#00cc6a]/50 bg-zinc-800/40 text-zinc-300 text-xs font-headline uppercase tracking-wider"
          >
            {label}
          </span>
        ))}
        {doneDayLabels.length === 0 && remainingDayLabels.length === 0 && (
          <span className="text-sm text-zinc-400">No sessions this week</span>
        )}
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────

export function WeekAtAGlancePanel({ programs }: WeekAtAGlanceProps) {
  const { user } = useAuth();
  const { getWeekSessions, weightUnit } = useKhet();
  const { programs: mobilityPrograms } = useMobility();
  const { programs: corePrograms } = useCore();
  const { programs: cardioPrograms } = useCardio();

  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [otherMinutes, setOtherMinutes] = useState(0);

  // Declare week string first — used in effects below
  const currentWeekStr = useMemo(
    () => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    [],
  );

  const refresh = useCallback(() => {
    setLoading(true);
    getWeekSessions().then((s) => {
      setSessions(s);
      setLoading(false);
    });
  }, [getWeekSessions]);

  // Fetch durationMinutes from mobility, core, and cardio sessions this week
  useEffect(() => {
    if (!user) return;
    const weekStart = currentWeekStr;
    const weekEnd   = format(new Date(new Date(weekStart).getTime() + 6 * 86400000), 'yyyy-MM-dd');

    const fetchMins = async () => {
      let mins = 0;
      for (const col of ['mobilitySessions', 'coreSessions', 'cardioSessions']) {
        const snap = await getDocs(
          query(
            collection(db, col),
            where('userId', '==', user.uid),
            where('date', '>=', weekStart),
            where('date', '<=', weekEnd),
          )
        );
        snap.forEach((d) => {
          const data = d.data() as { durationMinutes?: number };
          mins += data.durationMinutes ?? 0;
        });
      }
      setOtherMinutes(mins);
    };
    fetchMins();
  }, [user, currentWeekStr]);

  useEffect(() => { refresh(); }, [refresh]);

  // ── 7-day calendar entries ────────────────────────────────

  const weekDayEntries = useMemo(() => {
    const ws = startOfWeek(new Date(), { weekStartsOn: 1 });
    const todayIso = format(new Date(), 'yyyy-MM-dd');
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws.getTime());
      d.setDate(d.getDate() + i);
      const iso = format(d, 'yyyy-MM-dd');
      return {
        date: iso,
        label: format(d, 'EEE'),  // Mon, Tue, …
        dayNum: format(d, 'd'),   // 11, 12, …
        isToday: iso === todayIso,
        daySessions: sessions.filter((s) => s.date === iso),
      };
    });
  }, [sessions]);

  // ── aggregate stats ──────────────────────────────────────

  const totalVolume = sessions
    .filter((s) => s.programId !== 'standalone')
    .reduce((sum, s) => sum + (s.totalVolume ?? 0), 0);

  const totalCalories = sessions.reduce(
    (sum, s) => sum + (s.cardioLog?.calories ?? 0), 0,
  );

  const totalMinutes = sessions.reduce(
    (sum, s) => sum + (s.durationMinutes ?? 0), 0,
  ) + otherMinutes;

  const totalSessions = sessions.length;

  const volumeDisplay =
    totalVolume === 0
      ? '—'
      : weightUnit === 'lbs'
      ? `${Math.round(totalVolume * 2.20462).toLocaleString()} lbs`
      : `${Math.round(totalVolume).toLocaleString()} kg`;

  // ── per-program remaining ─────────────────────────────────

  const strengthBreakdowns = programs.map((program) => {
    const programSessions = sessions
      .filter((s) => s.programId === program.id)
      .sort((a, b) => a.date.localeCompare(b.date));
    return { program, ...computeStrengthProgramWeek(program, programSessions) };
  });

  const mobilityBreakdowns = mobilityPrograms.map((program) => {
    const { doneLabels, remainingLabels } = computeSimpleProgramWeek(program, currentWeekStr);
    return { program, doneDayLabels: doneLabels, remainingDayLabels: remainingLabels };
  });

  const coreBreakdowns = corePrograms.map((program) => {
    const { doneLabels, remainingLabels } = computeSimpleProgramWeek(program, currentWeekStr);
    return { program, doneDayLabels: doneLabels, remainingDayLabels: remainingLabels };
  });

  const cardioBreakdowns = cardioPrograms.map((program) => {
    const { doneLabels, remainingLabels } = computeCardioProgramWeek(program, currentWeekStr);
    return { program, doneDayLabels: doneLabels, remainingDayLabels: remainingLabels };
  });

  const hasAnyBreakdowns =
    strengthBreakdowns.length > 0 ||
    mobilityBreakdowns.length > 0 ||
    coreBreakdowns.length > 0 ||
    cardioBreakdowns.length > 0;

  // ── week header label ─────────────────────────────────────

  const ws = startOfWeek(new Date(), { weekStartsOn: 1 });
  const we = new Date(ws); we.setDate(we.getDate() + 6);
  const weekLabelStr = `${format(ws, 'MMM d')} – ${format(we, 'd')}`;

  // ── volume formatter for individual sessions ──────────────

  function fmtVol(kg: number) {
    if (kg <= 0) return null;
    return weightUnit === 'lbs'
      ? `${Math.round(kg * 2.20462).toLocaleString()} lbs`
      : `${Math.round(kg).toLocaleString()} kg`;
  }

  // ─────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border border-[#00cc6a]/40 shadow-[0_0_18px_rgba(0,204,106,0.12)] bg-gradient-to-br from-zinc-950 via-zinc-900/30 to-zinc-950 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#00cc6a]" />
          <span className="font-headline text-sm uppercase tracking-widest text-[#00cc6a] drop-shadow-[0_0_6px_#00cc6a]">
            This Week
          </span>
          <span className="text-sm text-zinc-300">{weekLabelStr}</span>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-[#00cc6a] flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-[#00cc6a] flex-shrink-0" />
        }
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">

          {/* ── Summary stat tiles ── */}
          {loading ? (
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-lg border border-[#00cc6a]/20 bg-zinc-900/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-lg border border-[#00cc6a]/30 bg-zinc-950/40 p-2.5 flex flex-col items-center justify-center gap-0.5">
                <Dumbbell className="w-3.5 h-3.5 text-amber-500 mb-0.5" />
                <span className="text-xl font-headline text-amber-300 leading-none">{totalSessions}</span>
                <span className="text-xs text-zinc-300 uppercase tracking-wider">Sessions</span>
              </div>
              <div className="rounded-lg border border-[#00cc6a]/30 bg-zinc-950/40 p-2.5 flex flex-col items-center justify-center gap-0.5">
                <Flame className="w-3.5 h-3.5 text-red-500 mb-0.5" />
                <span className="text-xl font-headline text-red-300 leading-none">
                  {totalCalories > 0 ? totalCalories.toLocaleString() : '—'}
                </span>
                <span className="text-xs text-zinc-300 uppercase tracking-wider">Calories</span>
              </div>
              <div className="rounded-lg border border-[#00cc6a]/30 bg-zinc-950/40 p-2.5 flex flex-col items-center justify-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-500 mb-0.5" />
                <span className={cn(
                  'font-headline text-cyan-300 leading-none text-center',
                  volumeDisplay.length > 8 ? 'text-sm' : 'text-xl',
                )}>
                  {volumeDisplay}
                </span>
                <span className="text-xs text-zinc-300 uppercase tracking-wider">Volume</span>
              </div>
              <div className="rounded-lg border border-[#00cc6a]/30 bg-zinc-950/40 p-2.5 flex flex-col items-center justify-center gap-0.5">
                <Calendar className="w-3.5 h-3.5 text-[#00cc6a] mb-0.5" />
                <span className="text-xl font-headline text-[#00cc6a] leading-none">
                  {totalMinutes > 0 ? totalMinutes : '—'}
                </span>
                <span className="text-xs text-zinc-300 uppercase tracking-wider">Mins</span>
              </div>
            </div>
          )}

          {/* ── 7-day session calendar ── */}
          {!loading && (
            <div className="rounded-lg border border-[#00cc6a]/30 bg-zinc-950/40 p-3 space-y-3">

              {/* Day-indicator strip */}
              <div className="flex gap-1 justify-between">
                {weekDayEntries.map(({ date, label, dayNum, isToday, daySessions }) => {
                  const hasSessions = daySessions.length > 0;
                  return (
                    <div key={date} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                      <span className="text-xs text-[#00cc6a] uppercase tracking-wider">{label}</span>
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-headline transition-all',
                        hasSessions
                          ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                          : isToday
                          ? 'border-2 border-[#00cc6a] text-[#00cc6a] bg-zinc-800/50 shadow-[0_0_10px_rgba(0,204,106,0.6)]'
                          : 'border-2 border-[#00994d] text-[#00cc6a] shadow-[0_0_6px_rgba(0,204,106,0.35)]',
                      )}>
                        {hasSessions ? '✓' : dayNum}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Session detail rows — one block per active day */}
              {weekDayEntries.some((d) => d.daySessions.length > 0) ? (
                <div className="space-y-2.5 pt-2 border-t border-[#00cc6a]/20">
                  {weekDayEntries
                    .filter((d) => d.daySessions.length > 0)
                    .map(({ date, label, daySessions }) => (
                      <div key={date} className="space-y-1">
                        {/* Day header */}
                        <p className="text-xs font-headline uppercase tracking-widest text-zinc-300">
                          {label} · {format(new Date(date + 'T12:00:00'), 'MMM d')}
                        </p>

                        {/* Sessions on this day */}
                        {daySessions.map((s) => {
                          const vol = fmtVol(s.totalVolume);
                          const cals = s.cardioLog?.calories;
                          const isStandalone =
                            s.programId === 'standalone' ||
                            s.programId === 'standalone-abs';

                          return (
                            <div
                              key={s.id}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#00cc6a]/25 bg-zinc-900/30"
                            >
                              {/* Session label pill */}
                              <span className={cn(
                                'text-xs font-headline uppercase tracking-wider rounded px-2 py-0.5 border flex-shrink-0',
                                isStandalone
                                  ? 'text-red-300 border-red-600/50 bg-red-950/30'
                                  : 'text-amber-300 border-amber-600/50 bg-amber-950/30',
                              )}>
                                {s.dayLabel}
                              </span>

                              {/* Program name */}
                              {!isStandalone ? (
                                <span className="text-sm text-zinc-300 truncate min-w-0 flex-1">
                                  {s.programName}
                                </span>
                              ) : (
                                <span className="flex-1" />
                              )}

                              {/* Volume + calories */}
                              <span className="flex-shrink-0 flex items-center gap-2">
                                {vol && (
                                  <span className="text-sm font-headline text-cyan-400">{vol}</span>
                                )}
                                {cals && cals > 0 && (
                                  <span className="text-sm font-headline text-red-400">{cals} kcal</span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 text-center pt-1">
                  No sessions logged this week yet.
                </p>
              )}
            </div>
          )}

          {/* ── Per-program remaining days ── */}
          {!loading && hasAnyBreakdowns && (
            <div className="space-y-3">
              <p className="text-sm font-headline uppercase tracking-widest text-[#00cc6a] drop-shadow-[0_0_6px_#00cc6a]">
                Remaining This Week
              </p>

              {/* Strength */}
              {strengthBreakdowns.map(({ program, doneDayLabels, remainingDayLabels }) => (
                <ProgramRemainingRow
                  key={program.id}
                  name={program.name}
                  nameColor="text-amber-400"
                  doneDayLabels={doneDayLabels}
                  remainingDayLabels={remainingDayLabels}
                />
              ))}

              {/* Mobility */}
              {mobilityBreakdowns.map(({ program, doneDayLabels, remainingDayLabels }) => (
                <ProgramRemainingRow
                  key={program.id}
                  name={program.name}
                  nameColor="text-blue-400"
                  doneDayLabels={doneDayLabels}
                  remainingDayLabels={remainingDayLabels}
                />
              ))}

              {/* Core */}
              {coreBreakdowns.map(({ program, doneDayLabels, remainingDayLabels }) => (
                <ProgramRemainingRow
                  key={program.id}
                  name={program.name}
                  nameColor="text-orange-400"
                  doneDayLabels={doneDayLabels}
                  remainingDayLabels={remainingDayLabels}
                />
              ))}

              {/* Cardio */}
              {cardioBreakdowns.map(({ program, doneDayLabels, remainingDayLabels }) => (
                <ProgramRemainingRow
                  key={program.id}
                  name={program.name}
                  nameColor="text-red-400"
                  doneDayLabels={doneDayLabels}
                  remainingDayLabels={remainingDayLabels}
                />
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
