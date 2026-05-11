"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, differenceInDays, parseISO } from 'date-fns';
import {
  Dumbbell,
  Plus,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Calendar,
  Zap,
  BatteryLow,
  BarChart2,
  User,
  BookOpen,
  Activity,
  FlameKindling,
  ChevronDown,
} from 'lucide-react';
import { CyberStylus } from '@/components/icons/cyber-stylus';
import { DuamatefJar } from '@/components/icons/duamatef-jar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useKhet } from '@/hooks/use-khet';
import { ProgramWizard } from './program-wizard';
import { ProgressPanel } from './progress-panel';
import { GainzPanel } from './gainz-panel';
import { UserStatsPanel } from './user-stats-panel';
import { BanishmentPortal } from '@/components/banishment-portal';
import { FirstPylonIcon } from '@/components/icons/FirstPylonIcon';
import { WorkoutDiary } from './workout-diary';
import { QuickLogCardio } from './quick-log-cardio';
import { StandaloneAbsPanel } from './standalone-abs-panel';
import type { WorkoutProgram, DeloadStrategy } from '@/lib/khet-types';
import { cn, localDateStr } from '@/lib/utils';
import { Khet75Hard } from './khet-75hard';
import { KhetMobility, MobilityLaunchButton } from './khet-mobility';
import { KhetCore, CoreLaunchButton } from './khet-core';
import { MobilityProgramWizard } from './mobility-program-wizard';
import { CoreProgramWizard } from './core-program-wizard';
import { KhetCardio } from './khet-cardio';
import { CardioProgramWizard } from './cardio-program-wizard';
import { KhetTorsionSystem } from './khet-torsion-system';
import { WeekAtAGlancePanel } from './week-at-a-glance';

export function KhetDashboard() {
  const { programs, loading, deleteProgram } = useKhet();
  const { toast } = useToast();
  const router = useRouter();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<WorkoutProgram | null>(null);
  const [gainzOpen, setGainzOpen] = useState(false);
  const [userStatsOpen, setUserStatsOpen] = useState(false);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [standaloneCardioOpen, setStandaloneCardioOpen] = useState(false);
  const [standaloneAbsOpen, setStandaloneAbsOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [mobilityWizardOpen, setMobilityWizardOpen] = useState(false);
  const [coreWizardOpen, setCoreWizardOpen] = useState(false);
  const [cardioProgramWizardOpen, setCardioProgramWizardOpen] = useState(false);
  const [torsionEnabled, setTorsionEnabled] = useState(false);

  useEffect(() => {
    // Only read localStorage on the client to prevent hydration mismatch
    setTorsionEnabled(localStorage.getItem('khet-torsion-enabled') === 'true');
    // Listen for storage changes in case it's toggled in UserStatsPanel
    const onStorageChange = () => {
      setTorsionEnabled(localStorage.getItem('khet-torsion-enabled') === 'true');
    };
    window.addEventListener('storage', onStorageChange);
    // Also set an interval or just rely on state updating when UserStatsPanel is closed
    // Better: We just check when UserStatsPanel closes or when dashboard mounts
  }, [userStatsOpen]); // re-check when userStatsOpen changes

  const handleDelete = async (id: string) => {
    try {
      await deleteProgram(id);
      toast({ title: 'Program banished' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 rounded-xl border border-zinc-800 bg-zinc-950/30 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Hall pylon button */}
      <div>
        <button
          onClick={() => router.push('/')}
          className="flex flex-col items-center justify-center p-2 rounded-2xl border-2 border-amber-400 bg-amber-950/40 active:scale-95 transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] min-w-[110px]"
        >
          <FirstPylonIcon size={60} className="text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
          <span className="font-headline font-bold text-[8px] tracking-widest uppercase text-amber-300 mt-1">
            To Main Hall
          </span>
        </button>
      </div>

      {/* Header */}
      <div>
        <div className="mb-4">
          <h2 className="font-headline text-amber-400 text-xl uppercase tracking-widest">
            Khet-Station
          </h2>
        </div>
        {/* Program launch — single expandable button */}
        <div className="space-y-2">
          <button
            onClick={() => setCreateMenuOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 py-3 px-4 rounded-xl border-2 border-amber-500/70 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40 hover:border-amber-400 font-headline uppercase tracking-widest text-sm transition-all shadow-[0_0_14px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create New Program
            </div>
            <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', createMenuOpen && 'rotate-180')} />
          </button>

          {createMenuOpen && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden divide-y divide-zinc-800/60">
              {/* Strength */}
              <button
                onClick={() => { setCreateMenuOpen(false); setWizardOpen(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-950/20 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg border border-amber-700/50 bg-amber-950/30 flex items-center justify-center flex-shrink-0 group-hover:border-amber-500 transition-colors">
                  <Dumbbell className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-headline uppercase tracking-widest text-amber-300">Strength Program</p>
                  <p className="text-sm text-zinc-400">Mass Displacement Engine — PPL, Upper/Lower, Full Body</p>
                </div>
              </button>

              {/* Mobility */}
              <button
                onClick={() => { setCreateMenuOpen(false); setMobilityWizardOpen(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-950/20 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg border border-blue-700/50 bg-blue-950/30 flex items-center justify-center flex-shrink-0 group-hover:border-blue-500 transition-colors">
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-headline uppercase tracking-widest text-blue-300">Mobility Program</p>
                  <p className="text-sm text-zinc-400">Flexibility, joint health &amp; recovery — 6-week progressions</p>
                </div>
              </button>

              {/* Core */}
              <button
                onClick={() => { setCreateMenuOpen(false); setCoreWizardOpen(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-950/20 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg border border-orange-700/50 bg-orange-950/30 flex items-center justify-center flex-shrink-0 group-hover:border-orange-500 transition-colors">
                  <FlameKindling className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-headline uppercase tracking-widest text-orange-300">Core Program</p>
                  <p className="text-sm text-zinc-400">Strength, endurance &amp; stability — 4 to 12 weeks</p>
                </div>
              </button>

              {/* Cardio / Endurance */}
              <button
                onClick={() => { setCreateMenuOpen(false); setCardioProgramWizardOpen(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-950/20 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg border border-red-800/50 bg-red-950/30 flex items-center justify-center flex-shrink-0 group-hover:border-red-500 transition-colors">
                  <Zap className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-headline uppercase tracking-widest text-red-300">Cardio / Endurance Program</p>
                  <p className="text-sm text-zinc-400">Intervals, Zone 2, VO₂ Max — science-based engine</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Week at a Glance */}
      <WeekAtAGlancePanel programs={programs} />

      {/* 75 Hard Protocol — sits directly under New Program */}
      <Khet75Hard />

      {/* Action row: Athlete, Diary, Log Cardio, Log Abs, Gainz */}
      <div className="grid grid-cols-2 gap-2">
        {/* Athlete Profile */}
        <button
          onClick={() => setUserStatsOpen(true)}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-cyan-700/60 bg-cyan-950/30 text-cyan-300 font-headline uppercase tracking-[0.15em] text-xs transition-all active:scale-95 active:bg-cyan-950/60 active:border-cyan-500 shadow-[inset_0_1px_0_rgba(34,211,238,0.08)]"
        >
          <User className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <div className="text-left">
            <p className="text-cyan-200 text-xs font-headline uppercase tracking-widest leading-tight">Athlete</p>
            <p className="text-xs text-cyan-600 leading-tight">Profile &amp; settings</p>
          </div>
        </button>

        {/* Diary */}
        <button
          onClick={() => setDiaryOpen(true)}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-violet-700/60 bg-violet-950/30 text-violet-300 font-headline uppercase tracking-[0.15em] text-xs transition-all active:scale-95 active:bg-violet-950/60 active:border-violet-500 shadow-[inset_0_1px_0_rgba(139,92,246,0.08)]"
        >
          <BookOpen className="w-5 h-5 text-violet-400 flex-shrink-0" />
          <div className="text-left">
            <p className="text-violet-200 text-xs font-headline uppercase tracking-widest leading-tight">Diary</p>
            <p className="text-xs text-violet-600 leading-tight">All sessions logged</p>
          </div>
        </button>

        {/* Log Cardio */}
        <button
          onClick={() => setStandaloneCardioOpen(true)}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-red-800/60 bg-red-950/30 text-red-300 font-headline uppercase tracking-[0.15em] text-xs transition-all active:scale-95 active:bg-red-950/60 active:border-red-500 shadow-[inset_0_1px_0_rgba(239,68,68,0.08)]"
        >
          <Activity className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div className="text-left">
            <p className="text-red-200 text-xs font-headline uppercase tracking-widest leading-tight">Log Cardio</p>
            <p className="text-xs text-red-700 leading-tight">Quick session entry</p>
          </div>
        </button>

        {/* Log Abs */}
        <button
          onClick={() => setStandaloneAbsOpen(true)}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-orange-700/60 bg-orange-950/30 text-orange-300 font-headline uppercase tracking-[0.15em] text-xs transition-all active:scale-95 active:bg-orange-950/60 active:border-orange-500 shadow-[inset_0_1px_0_rgba(249,115,22,0.08)]"
        >
          <FlameKindling className="w-5 h-5 text-orange-400 flex-shrink-0" />
          <div className="text-left">
            <p className="text-orange-200 text-xs font-headline uppercase tracking-widest leading-tight">Log Abs</p>
            <p className="text-xs text-orange-600 leading-tight">Core &amp; abs session</p>
          </div>
        </button>

        {/* Gainz — full-width on last row */}
        <button
          onClick={() => setGainzOpen(true)}
          className="col-span-2 flex items-center gap-3 px-4 py-3.5 rounded-xl border border-amber-700/60 bg-amber-950/30 text-amber-300 font-headline uppercase tracking-[0.15em] text-xs transition-all active:scale-95 active:bg-amber-950/60 active:border-amber-500 shadow-[inset_0_1px_0_rgba(245,158,11,0.12)]"
        >
          <BarChart2 className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="text-left">
            <p className="text-amber-200 text-xs font-headline uppercase tracking-widest leading-tight">Gainz</p>
            <p className="text-xs text-amber-600 leading-tight">PRs &amp; lifetime stats</p>
          </div>
        </button>
      </div>

      {/* Strength section header */}
      <div className="flex items-center gap-2">
        <Dumbbell className="w-4 h-4 text-amber-400" />
        <h3 className="font-headline text-amber-400 text-sm uppercase tracking-widest">
          Mass Displacement Engine
        </h3>
      </div>

      {/* Empty state */}
      {programs.length === 0 && (
        <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center">
          <Dumbbell className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 font-body text-sm">No programs forged yet.</p>
          <p className="text-zinc-700 text-xs mt-1">
            Create your first program to begin tracking.
          </p>
          <Button
            onClick={() => setWizardOpen(true)}
            className="mt-4 bg-amber-600 hover:bg-amber-500 text-black font-headline uppercase tracking-widest text-xs"
          >
            Forge a Program
          </Button>
        </div>
      )}

      {/* Program cards */}
      {programs.map((program) => (
        <ProgramCard
          key={program.id}
          program={program}
          onEdit={() => setEditingProgram(program)}
          onDelete={() => handleDelete(program.id)}
        />
      ))}

      {/* Mobility & Recovery */}
      <div className="space-y-3">
        <KhetMobility />
      </div>

      {/* Core & Abs Module */}
      <div className="space-y-3">
        <KhetCore />
      </div>

      {/* Endurance Engine */}
      <div className="space-y-3">
        <KhetCardio />
      </div>

      {torsionEnabled && (
        <div className="space-y-3">
          <KhetTorsionSystem />
        </div>
      )}

      {/* Program Wizard — create */}
      <ProgramWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
      {/* Program Wizard — edit */}
      <ProgramWizard
        open={!!editingProgram}
        editProgram={editingProgram ?? undefined}
        onClose={() => setEditingProgram(null)}
      />
      {/* Gainz panel */}
      {gainzOpen && <GainzPanel onClose={() => setGainzOpen(false)} />}
      {/* Athlete Profile / User Stats */}
      {userStatsOpen && <UserStatsPanel onClose={() => setUserStatsOpen(false)} />}
      {/* Workout Diary */}
      {diaryOpen && <WorkoutDiary onClose={() => setDiaryOpen(false)} />}
      {/* Standalone quick-logs */}
      {standaloneCardioOpen && <QuickLogCardio onClose={() => setStandaloneCardioOpen(false)} />}
      {standaloneAbsOpen && <StandaloneAbsPanel onClose={() => setStandaloneAbsOpen(false)} />}
      {/* Program wizards launched from Create New Program menu */}
      <MobilityProgramWizard open={mobilityWizardOpen} onClose={() => setMobilityWizardOpen(false)} />
      <CoreProgramWizard open={coreWizardOpen} onClose={() => setCoreWizardOpen(false)} />
      <CardioProgramWizard open={cardioProgramWizardOpen} onClose={() => setCardioProgramWizardOpen(false)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

interface ProgramCardProps {
  program: WorkoutProgram;
  onEdit: () => void;
  onDelete: () => void;
}

function ProgramCard({ program, onEdit, onDelete }: ProgramCardProps) {
  const { updateProgram } = useKhet();
  const { toast } = useToast();
  const [deloadOpen, setDeloadOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [confirmDeloadStrategy, setConfirmDeloadStrategy] = useState<DeloadStrategy>(
    program.deloadStrategy ?? 'reduce-volume',
  );

  const mesocycleDays = program.mesocycleStart
    ? differenceInDays(new Date(), parseISO(program.mesocycleStart))
    : 0;
  const mesocycleWeeks = Math.floor(mesocycleDays / 7);
  const totalSessions = (program.frequency ?? 4) * (program.durationWeeks ?? 8);
  const progressPct = Math.min(100, Math.round(((program.sessionsCompleted ?? 0) / totalSessions) * 100));
  const adaptationAlert = mesocycleDays >= 42;
  // Recommend deload every 6 weeks if not currently deloading
  const weeksSinceDeload = program.lastDeloadEnd
    ? Math.floor(differenceInDays(new Date(), parseISO(program.lastDeloadEnd)) / 7)
    : mesocycleWeeks;
  const deloadRecommended = !program.isDeloading && weeksSinceDeload >= 6;

  const splitLabel: Record<string, string> = {
    PPL: 'Push / Pull / Legs',
    UpperLower: 'Upper / Lower',
    FullBody: 'Full Body',
  };

  // ── Day-status logic ─────────────────────────────────────────
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const lastDone = program.lastSessionDayIndex ?? -1;
  const doneToday = program.lastSessionDate === todayStr;
  const totalDays = program.days?.length ?? 0;
  // Every day 0..lastDone has been completed in the current cycle
  const allCycleDone = totalDays > 0 && lastDone === totalDays - 1;
  // Completed the final day TODAY → all glow green until midnight
  const allDoneToday = allCycleDone && doneToday;
  // Completed the final day on a PREVIOUS day → new cycle begins, reset to day 0
  const cycleReset = allCycleDone && !doneToday;
  // Next day in rotation
  const nextIdx = (lastDone === -1 || cycleReset) ? 0 : (lastDone + 1) % (totalDays || 1);

  const deloadLabel: Record<DeloadStrategy, string> = {
    'reduce-volume': 'Reduce Volume (Best)',
    'reduce-intensity': 'Reduce Intensity (Joint Relief)',
    'reduce-reps': 'Reduce Reps (Quick Session)',
    'reduce-frequency': 'Reduce Frequency (Easy Week)',
  };

  const handleStartDeload = async () => {
    const today = localDateStr();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    try {
      await updateProgram(program.id, {
        isDeloading: true,
        deloadStrategy: confirmDeloadStrategy,
        lastDeloadStart: today,
        lastDeloadEnd: localDateStr(endDate),
      });
      toast({ title: 'Deload Week Started', description: `${deloadLabel[confirmDeloadStrategy]} — ends ${format(endDate, 'MMM d')}.` });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
    setDeloadOpen(false);
  };

  const handleEndDeload = async () => {
    try {
      await updateProgram(program.id, { isDeloading: false });
      toast({ title: 'Deload Week Complete', description: 'Back to full training. Forge on.' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border bg-gradient-to-br from-zinc-950 via-[#0a0f1e] to-[#0f0a00] p-4 space-y-4 overflow-hidden',
        adaptationAlert ? 'border-amber-600/50' : 'border-zinc-800',
      )}
    >
      {/* Program header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-headline text-amber-300 text-lg">{program.name}</h3>
            {program.isDeloading && (
              <span className="flex items-center gap-1 text-[9px] font-headline uppercase tracking-wider text-blue-400 border border-blue-500/40 rounded px-1.5 py-0.5 bg-blue-950/20 flex-shrink-0">
                <BatteryLow className="w-2.5 h-2.5" />
                Deload
              </span>
            )}
            {adaptationAlert && !program.isDeloading && (
              <span className="flex items-center gap-1 text-[9px] font-headline uppercase tracking-wider text-amber-500 border border-amber-600/50 rounded px-1.5 py-0.5 bg-amber-950/20 flex-shrink-0">
                <AlertTriangle className="w-2.5 h-2.5" />
                Adapt
              </span>
            )}
          </div>

          {/* Stacked meta lines */}
          <div className="mt-1.5 space-y-0.5">
            <div className="text-sm text-zinc-200">{splitLabel[program.split]}</div>
            <div className="text-sm text-zinc-200">{program.frequency}× per week</div>
            {program.mesocycleStart && (
              <div className="text-sm text-zinc-200">
                Week {mesocycleWeeks + 1} of {program.durationWeeks ?? 8}
                <span className="text-zinc-400 ml-2">(Day {mesocycleDays})</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {program.mesocycleStart && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-zinc-400 mb-0.5">
                <span>Progress</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    progressPct >= 100 ? 'bg-amber-400' : 'bg-cyan-600',
                  )}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          {/* Volume stat */}
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-sm text-cyan-300 font-headline">
                {(program.lifetimeVolume / 1000).toFixed(1)}t
              </span>
            </div>
            <div className="text-xs text-zinc-300">lifetime</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setProgressOpen(true)}
              className="p-1.5 rounded transition-colors text-zinc-400 hover:text-amber-400"
              title="Progress & PRs"
            >
              <BarChart2 className="w-8 h-8" />
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 rounded transition-colors text-zinc-400 hover:text-cyan-400"
              title="Edit program"
            >
              <CyberStylus className="w-8 h-8" />
            </button>
            <BanishmentPortal onConfirm={onDelete} ritualTitle={program.name}>
              <button
                className="p-1.5 rounded transition-colors text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]"
                title="Banish program"
              >
                <DuamatefJar className="w-8 h-8" />
              </button>
            </BanishmentPortal>
          </div>
        </div>
      </div>

      {/* Last session */}
      {program.lastSessionDate && (
        <div className="flex items-center gap-2 text-sm text-zinc-200">
          <Calendar className="w-3.5 h-3.5" />
          Last: {format(parseISO(program.lastSessionDate), 'EEE, MMM d')}
          {program.lastSessionDayIndex !== null && program.lastSessionDayIndex !== undefined && (
            <span className="text-zinc-400">
              — {program.days[program.lastSessionDayIndex]?.label}
            </span>
          )}
        </div>
      )}

      {/* Deload info row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-zinc-500">
          {program.isDeloading && program.lastDeloadStart && program.lastDeloadEnd ? (
            <span className="text-blue-400">
              Deload: {format(parseISO(program.lastDeloadStart), 'MMM d')} – {format(parseISO(program.lastDeloadEnd), 'MMM d')}
              {' '}— {deloadLabel[program.deloadStrategy ?? 'reduce-volume']}
            </span>
          ) : program.lastDeloadEnd ? (
            <span>Last deload: {format(parseISO(program.lastDeloadEnd), 'MMM d, yyyy')}</span>
          ) : (
            <span className="text-zinc-700">No deload logged yet</span>
          )}
        </div>

        {program.isDeloading ? (
          <button
            onClick={handleEndDeload}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-500/40 bg-blue-950/20 text-blue-300 hover:bg-blue-950/40 transition-all text-xs font-headline uppercase tracking-wider"
          >
            <Zap className="w-3 h-3" />
            End Deload
          </button>
        ) : (
          <button
            onClick={() => setDeloadOpen(true)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-xs font-headline uppercase tracking-wider',
              deloadRecommended
                ? 'border-amber-500/60 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500',
            )}
          >
            <BatteryLow className="w-3 h-3" />
            {deloadRecommended ? 'Deload Now' : 'Start Deload'}
          </button>
        )}
      </div>

      {/* Deload confirm panel */}
      {deloadOpen && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-950/10 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-headline uppercase tracking-widest text-blue-300">Choose Deload Strategy</p>
            <button onClick={() => setDeloadOpen(false)} className="text-zinc-600 hover:text-zinc-400">×</button>
          </div>

          <Select
            value={confirmDeloadStrategy}
            onValueChange={(v) => setConfirmDeloadStrategy(v as DeloadStrategy)}
          >
            <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black border-zinc-800">
              <SelectItem value="reduce-volume" className="text-amber-300 focus:bg-amber-950/30">
                Reduce Volume (Best) — 1–2 sets, same weight &amp; reps
              </SelectItem>
              <SelectItem value="reduce-intensity" className="text-amber-300 focus:bg-amber-950/30">
                Reduce Intensity (Joint Relief) — 60% weight, same sets &amp; reps
              </SelectItem>
              <SelectItem value="reduce-reps" className="text-amber-300 focus:bg-amber-950/30">
                Reduce Reps (Quick Session) — half reps, same sets &amp; weight
              </SelectItem>
            </SelectContent>
          </Select>

          <p className="text-[10px] text-zinc-500">
            {confirmDeloadStrategy === 'reduce-volume' && 'Sets cut to 1 (or 2 if 5+ sets) — same weight, same reps.'}
            {confirmDeloadStrategy === 'reduce-intensity' && 'Weight at 60% of your working load — full sets and reps.'}
            {confirmDeloadStrategy === 'reduce-reps' && 'Reps cut in half — same sets, same weight.'}
          </p>

          <button
            onClick={handleStartDeload}
            className="w-full py-1.5 rounded border border-blue-500/50 bg-blue-950/30 text-blue-300 hover:bg-blue-950/50 transition-all text-xs font-headline uppercase tracking-widest"
          >
            Begin Deload Week
          </button>
        </div>
      )}

      {/* Adaptation alert banner */}
      {adaptationAlert && !program.isDeloading && (
        <div className="rounded border border-amber-700/40 bg-amber-950/10 p-2 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300">
            <strong>42-Day Adaptation Alert</strong> — Your CNS has fully mapped this stimulus. 
            Rotate exercise selection to prevent plateau.
          </p>
        </div>
      )}

      {/* Day tabs */}
      <p className={cn(
        'text-[10px] font-headline uppercase tracking-widest mb-1',
        allDoneToday ? 'text-green-400' : 'text-zinc-400',
      )}>
        {allDoneToday ? 'All Sessions Complete — Rest Up' : 'Select Day to Begin Workout'}
      </p>
      <div className="flex flex-wrap gap-1">
        {(program.days ?? []).map((day, idx) => {
          // Green if completed in current cycle (indices 0..lastDone), clears on cycle reset
          const isCompletedInCycle = !cycleReset && lastDone >= 0 && idx <= lastDone;
          const isNextUp = !allDoneToday && idx === nextIdx;
          return (
            <Link
              key={idx}
              href={`/khet/session/${program.id}/${idx}`}
              className={cn(
                'group flex items-center justify-center px-3 py-2 rounded border text-xs font-headline uppercase tracking-wider transition-all duration-200 whitespace-nowrap',
                isCompletedInCycle
                  ? 'border-green-500/60 text-green-300 bg-green-950/20 shadow-[0_0_8px_rgba(74,222,128,0.2)]'
                  : isNextUp
                  ? 'border-orange-400 text-orange-300 bg-orange-950/20 shadow-[0_0_12px_rgba(251,146,60,0.5)] [animation:pulse_4s_ease-in-out_infinite]'
                  : 'border-zinc-800 text-zinc-400 hover:border-amber-600/40 hover:text-amber-300 hover:bg-amber-950/5',
              )}
            >
              <span>{day.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Progress Panel drawer */}
      {progressOpen && (
        <ProgressPanel program={program} onClose={() => setProgressOpen(false)} />
      )}
    </div>
  );
}
