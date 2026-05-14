"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRef } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { format, startOfWeek } from 'date-fns';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useKhet } from '@/hooks/use-khet';
import { useMobility } from '@/hooks/use-mobility';
import { useCore } from '@/hooks/use-core';
import { useCardio } from '@/hooks/use-cardio';
import type { WorkoutProgram, WorkoutSession } from '@/lib/khet-types';
import type { MobilityProgram, MobilitySessionLog } from '@/lib/mobility-types';
import type { CoreProgram, CoreSessionLog } from '@/lib/core-types';
import type { CardioProgram, CardioSessionLog } from '@/lib/endurance-types';
import { cn } from '@/lib/utils';

interface WeekAtAGlanceProps {
  programs: WorkoutProgram[];
}

// Unified session entry for the calendar / stats
interface CalendarEntry {
  id: string;
  date: string;
  label: string;       // "Day A", "Core B", "Session 1", etc.
  programName: string;
  module: 'strength' | 'mobility' | 'core' | 'cardio';
  durationMinutes: number;
  calories?: number;
  totalVolume?: number;
  programId?: string;
  dayLabel?: string;   // strength uses this for pill
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
  prefix = 'Session',
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
      const cycle = program.daysPerWeek > 0 ? program.daysPerWeek : 1;
      remainingLabels.push(`${prefix} ${(nextIdx % cycle) + 1}`);
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
    doneLabels.unshift(`Cardio ${program.lastSessionIndex - i + 1}`);
  }
  const remainingLabels: string[] = [];
  const cycle = program.daysPerWeek > 0 ? program.daysPerWeek : 1;
  for (let i = 1; i <= remaining; i++) {
    const sessionNum = ((program.lastSessionIndex + i) % cycle) + 1;
    remainingLabels.push(`Cardio ${sessionNum}`);
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
  pillClassName,
  remainingDayLabels,
}: {
  name: string;
  nameColor: string;
  pillClassName: string;
  doneDayLabels: string[];   // kept in signature for call-site compat, not rendered
  remainingDayLabels: string[];
}) {
  if (remainingDayLabels.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className={cn('text-sm font-headline uppercase tracking-widest', nameColor)}>
        {name}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {remainingDayLabels.map((label, i) => (
          <span
            key={`rem-${i}`}
            className={cn('px-2.5 py-1 rounded border-2 text-xs font-headline uppercase tracking-wider', pillClassName)}
          >
            {label}
          </span>
        ))}
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
  const [calEntries, setCalEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

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

  // Real-time listeners for mobility, core, and cardio sessions this week
  const mobilityBucket = useRef<CalendarEntry[]>([]);
  const coreBucket = useRef<CalendarEntry[]>([]);
  const cardioBucket = useRef<CalendarEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    const weekStart = currentWeekStr;
    const weekEnd = format(new Date(new Date(weekStart).getTime() + 6 * 86400000), 'yyyy-MM-dd');

    const merge = () =>
      setCalEntries([
        ...mobilityBucket.current,
        ...coreBucket.current,
        ...cardioBucket.current,
      ]);

    const unsubMobility = onSnapshot(
      query(collection(db, 'mobilitySessions'),
        where('userId', '==', user.uid),
        where('date', '>=', weekStart),
        where('date', '<=', weekEnd),
      ),
      (snap) => {
        mobilityBucket.current = snap.docs.map((d) => {
          const s = d.data() as MobilitySessionLog;
          return { id: d.id, date: s.date, label: s.label, programName: s.programName, module: 'mobility' as const, durationMinutes: s.durationMinutes ?? 0 };
        });
        merge();
      },
    );

    const unsubCore = onSnapshot(
      query(collection(db, 'coreSessions'),
        where('userId', '==', user.uid),
        where('date', '>=', weekStart),
        where('date', '<=', weekEnd),
      ),
      (snap) => {
        coreBucket.current = snap.docs.map((d) => {
          const s = d.data() as CoreSessionLog;
          return { id: d.id, date: s.date, label: s.label, programName: s.programName, module: 'core' as const, durationMinutes: s.durationMinutes ?? 0 };
        });
        merge();
      },
    );

    const unsubCardio = onSnapshot(
      query(collection(db, 'cardioSessions'),
        where('userId', '==', user.uid),
        where('completed', '==', true),
        where('date', '>=', weekStart),
        where('date', '<=', weekEnd),
      ),
      (snap) => {
        cardioBucket.current = snap.docs.map((d) => {
          const s = d.data() as CardioSessionLog;
          return { id: d.id, date: s.date, label: s.label, programName: s.programName, module: 'cardio' as const, durationMinutes: s.durationMinutes ?? 0, calories: s.calories };
        });
        merge();
      },
    );

    return () => { unsubMobility(); unsubCore(); unsubCardio(); };
  }, [user, currentWeekStr]);

  useEffect(() => { refresh(); }, [refresh]);

  // ── 7-day calendar entries ────────────────────────────────

  const weekDayEntries = useMemo(() => {
    const ws = startOfWeek(new Date(), { weekStartsOn: 1 });
    // Extend "today" until 3am local time for late-night workouts
    const now = new Date();
    const effectiveToday = now.getHours() < 3
      ? new Date(now.getTime() - 86400000)
      : now;
    const todayIso = format(effectiveToday, 'yyyy-MM-dd');
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws.getTime());
      d.setDate(d.getDate() + i);
      const iso = format(d, 'yyyy-MM-dd');
      const strengthOnDay = sessions.filter((s) => s.date === iso);
      const otherOnDay = calEntries.filter((e) => e.date === iso);
      return {
        date: iso,
        label: format(d, 'EEEEE'),
        dayNum: format(d, 'd'),
        isToday: iso === todayIso,
        isPast: iso < todayIso,
        isFuture: iso > todayIso,
        daySessions: strengthOnDay,
        otherSessions: otherOnDay,
      };
    });
  }, [sessions, calEntries]);

  // ── aggregate stats ──────────────────────────────────────

  const totalVolume = sessions
    .filter((s) => s.programId !== 'standalone')
    .reduce((sum, s) => sum + (s.totalVolume ?? 0), 0);

  const totalCalories =
    sessions.reduce((sum, s) => sum + (s.cardioLog?.calories ?? 0), 0) +
    calEntries.reduce((sum, e) => sum + (e.calories ?? 0), 0);

  const totalMinutes =
    sessions.filter((s) => (s.durationMinutes ?? 0) <= 180).reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0) +
    calEntries.filter((e) => (e.durationMinutes ?? 0) <= 180).reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);

  const totalSessions = sessions.length + calEntries.length;

  const volumeDisplay =
    totalVolume === 0
      ? '—'
      : weightUnit === 'lbs'
      ? `${(totalVolume * 2.20462 / 2000).toFixed(1)}t`
      : `${(totalVolume / 1000).toFixed(1)}t`;

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
    const { doneLabels, remainingLabels } = computeSimpleProgramWeek(program, currentWeekStr, 'Core');
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
    <div className="rounded-xl border-2 border-[#00cc6a]/60 bg-gradient-to-br from-zinc-950 via-zinc-900/30 to-zinc-950 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#00cc6a]" />
          <span className="font-headline text-sm uppercase tracking-widest text-[#00cc6a]">
            This Week
          </span>
          <span className="text-sm text-[#00cc6a]">{weekLabelStr}</span>
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
            <div className="grid grid-cols-4 gap-2 -mx-4 pl-[5px] pr-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-lg border-2 border-[#00cc6a]/30 bg-zinc-900/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 -mx-4 pl-[5px] pr-3">
              <div className="rounded-lg border-2 border-[#00cc6a]/50 bg-zinc-950/40 p-2.5 flex flex-col items-center justify-center gap-0.5">
                <span className="text-xl font-headline text-amber-300 leading-none">{totalSessions}</span>
                <span className="text-xs text-[#00cc6a] uppercase tracking-wider">Sessions</span>
              </div>
              <div className="rounded-lg border-2 border-[#00cc6a]/50 bg-zinc-950/40 p-2.5 flex flex-col items-center justify-center gap-0.5">
                <span className="text-xl font-headline text-amber-300 leading-none">
                  {totalCalories > 0 ? totalCalories.toLocaleString() : '—'}
                </span>
                <span className="text-xs text-[#00cc6a] uppercase tracking-wider">Calories</span>
              </div>
              <div className="rounded-lg border-2 border-[#00cc6a]/50 bg-zinc-950/40 p-2.5 flex flex-col items-center justify-center gap-0.5">
                <span className={cn(
                  'font-headline text-amber-300 leading-none text-center',
                  volumeDisplay.length > 8 ? 'text-sm' : 'text-xl',
                )}>
                  {volumeDisplay}
                </span>
                <span className="text-xs text-[#00cc6a] uppercase tracking-wider">Tons</span>
              </div>
              <div className="rounded-lg border-2 border-[#00cc6a]/50 bg-zinc-950/40 p-2.5 flex flex-col items-center justify-center gap-0.5">
                <span className="text-xl font-headline text-amber-300 leading-none">
                  {totalMinutes > 0 ? totalMinutes : '—'}
                </span>
                <span className="text-xs text-[#00cc6a] uppercase tracking-wider">Mins</span>
              </div>
            </div>
          )}

          {/* ── 7-day session calendar ── */}
          {!loading && (
            <div className="py-2 pr-3 pl-[6px] -mx-4">
              <div className="flex flex-col divide-y divide-[#00cc6a]/50">
                {weekDayEntries.map(({ date, label, dayNum, isToday, isPast, isFuture, daySessions, otherSessions }) => {
                  const allPills = [
                    ...daySessions.map((s) => ({
                      label: s.dayLabel ?? s.programName,
                      module: 'strength' as const,
                    })),
                    ...otherSessions.map((e) => ({ label: e.label, module: e.module })),
                  ];
                  const hasAny = allPills.length > 0;
                  const isGreen = isPast || isToday;
                  return (
                    <div key={date} className="flex items-center gap-2 min-h-[24px] py-1">
                      {/* Y-axis: single-letter day + date circle */}
                      <div className="flex items-center gap-2 w-12 flex-shrink-0">
                        <span className={cn(
                          'text-[12px] uppercase font-headline w-3 text-center leading-none',
                          isGreen ? 'text-[#00cc6a]' : 'text-blue-400',
                        )}>{label}</span>
                        <div
                          className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center text-sm font-headline flex-shrink-0',
                            hasAny
                              ? isGreen
                                ? 'border-2 border-[#00cc6a] text-[#00cc6a] bg-[#00cc6a]/10'
                                : 'border-2 border-blue-500/70 text-blue-300 bg-blue-500/10'
                              : isToday
                              ? 'border-2 border-[#00cc6a] text-[#00cc6a] bg-zinc-800/50'
                              : isPast
                              ? 'border-2 border-[#00994d] text-[#00cc6a]'
                              : 'border-2 border-blue-500/50 text-blue-400',
                          )}
                          style={isToday ? {
                            animation: 'today-glow 2.4s ease-in-out infinite',
                          } : undefined}>
                          {dayNum}
                        </div>
                      </div>
                      {/* X-axis: session pills */}
                      <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                        {allPills.map((p, i) => (
                          <span key={i} className={cn(
                            'text-[9px] font-headline uppercase tracking-wide rounded px-1.5 py-0.5 leading-tight',
                            p.module === 'strength' ? 'bg-amber-900/50 text-amber-300 border border-amber-600/50'
                            : p.module === 'mobility' ? 'bg-blue-900/50 text-blue-300 border border-blue-600/50'
                            : p.module === 'core'     ? 'bg-orange-900/50 text-orange-300 border border-orange-600/50'
                            :                          'bg-red-900/50 text-red-300 border border-red-600/50',
                          )}>
                            {p.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Per-program remaining days ── */}
          {!loading && hasAnyBreakdowns && (
            <div className="space-y-3">
              <p className="text-sm font-headline uppercase tracking-widest text-[#00cc6a]">
                Remaining This Week
              </p>

              {/* Strength */}
              {strengthBreakdowns.map(({ program, doneDayLabels, remainingDayLabels }) => (
                <ProgramRemainingRow
                  key={program.id}
                  name={program.name}
                  nameColor="text-amber-400"
                  pillClassName="border-amber-500/50 bg-amber-900/20 text-amber-300"
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
                  pillClassName="border-blue-500/50 bg-blue-900/20 text-blue-300"
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
                  pillClassName="border-orange-500/50 bg-orange-900/20 text-orange-300"
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
                  pillClassName="border-red-500/50 bg-red-900/20 text-red-300"
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
