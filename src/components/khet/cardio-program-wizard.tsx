"use client";

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { X, ChevronRight, ChevronLeft, Zap, Check, Activity, Flame, TrendingUp, Timer, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCardio } from '@/hooks/use-cardio';
import { useKhet } from '@/hooks/use-khet';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  CARDIO_EXERCISES,
  generateCardioProgram,
  estimateCalories,
  lbsToKg,
  type CardioFitnessLevel,
  type CardioGoal,
  type CardioExercise,
  type CardioExerciseCategory,
} from '@/lib/endurance-types';

// ─────────────────────────────────────────────────────────────
// Arc-Welder Max Mode sound — "bzzzd"
// ─────────────────────────────────────────────────────────────
function playMaxModeSound() {
  try {
    const ctx = new AudioContext();
    // Layer 1: Distorted sawtooth buzz (body of the arc)
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.4);
    const distCurve = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      const x = (i * 2) / 512 - 1;
      distCurve[i] = (Math.PI + 600) * x / (Math.PI + 600 * Math.abs(x));
    }
    const dist = ctx.createWaveShaper();
    dist.curve = distCurve;
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.7, ctx.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(dist); dist.connect(g1); g1.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.45);
    // Layer 2: White noise burst (crackle/spark)
    const bufLen = Math.floor(ctx.sampleRate * 0.25);
    const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) nd[i] = (Math.random() * 2 - 1);
    const ns = ctx.createBufferSource();
    ns.buffer = noiseBuf;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.45, ctx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    ns.connect(g2); g2.connect(ctx.destination); ns.start();
    // Layer 3: Sharp crack transient
    const crack = ctx.createOscillator();
    crack.type = 'sawtooth';
    crack.frequency.setValueAtTime(3500, ctx.currentTime);
    crack.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.07);
    const g3 = ctx.createGain();
    g3.gain.setValueAtTime(0.6, ctx.currentTime);
    g3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
    crack.connect(g3); g3.connect(ctx.destination);
    crack.start(); crack.stop(ctx.currentTime + 0.07);
    setTimeout(() => ctx.close(), 600);
  } catch { /* silent fail */ }
}

// ─────────────────────────────────────────────────────────────
// Static config
// ─────────────────────────────────────────────────────────────

const LEVELS: { id: CardioFitnessLevel; label: string; icon: string; desc: string; detail: string }[] = [
  {
    id: 'Novice',
    label: 'Novice',
    icon: '🟢',
    desc: 'New to structured cardio or returning after a long break.',
    detail: 'Programs focus on Zone 2 aerobic base-building with one light interval day per week.',
  },
  {
    id: 'Intermediate',
    label: 'Intermediate',
    icon: '🟡',
    desc: 'Consistent cardio 3+ days/week with some interval experience.',
    detail: 'Mixed Zone 2 and HIIT protocols. 2:1 work-to-rest ratios on interval days.',
  },
  {
    id: 'Elite',
    label: 'Elite',
    icon: '🔴',
    desc: 'Experienced with structured training, HR zones, and high-intensity work.',
    detail: 'High-intensity intervals, 1:1 or 2:1 W:R, Pyramid and Tabata protocols. High MET targets.',
  },
];

const GOALS: { id: CardioGoal; label: string; icon: string; desc: string; detail: string }[] = [
  {
    id: 'Fat Loss',
    label: 'Fat Loss',
    icon: '🔥',
    desc: 'Maximize caloric expenditure and metabolic conditioning.',
    detail: 'Higher total volume (+10%), mix of Zone 2 and HIIT. Fat oxidation is prioritized.',
  },
  {
    id: 'Engine Building',
    label: 'Engine Building',
    icon: '⚙️',
    desc: 'Build a dominant aerobic base and cardiovascular capacity.',
    detail: 'Progressive Zone 2 overload with targeted high-intensity sessions. Endurance first.',
  },
  {
    id: 'VO2 Max',
    label: 'VO₂ Max',
    icon: '⚡',
    desc: 'Peak oxygen uptake and maximum power output.',
    detail: 'Shorter, more intense sessions. Pyramid intervals, Tabata, and max-effort sprint protocols.',
  },
];

const DAYS_OPTIONS = [3, 4, 5, 6, 7] as const;
const DURATION_OPTIONS = [4, 6, 8] as const;

const CATEGORY_ORDER: CardioExerciseCategory[] = ['Machine', 'Bodyweight', 'Outdoor', 'Water'];

const LEVEL_COLORS: Record<CardioFitnessLevel, string> = {
  Novice:       'border-green-500/60 bg-green-950/20 text-green-200',
  Intermediate: 'border-yellow-500/60 bg-yellow-950/20 text-yellow-200',
  Elite:        'border-red-500/60 bg-red-950/20 text-red-200',
};

const LEVEL_SELECTED: Record<CardioFitnessLevel, string> = {
  Novice:       'border-green-400 bg-green-950/40 shadow-[0_0_14px_rgba(74,222,128,0.4)]',
  Intermediate: 'border-yellow-400 bg-yellow-950/40 shadow-[0_0_14px_rgba(234,179,8,0.4)]',
  Elite:        'border-red-400 bg-red-950/40 shadow-[0_0_14px_rgba(239,68,68,0.5)]',
};

// ─────────────────────────────────────────────────────────────
// RPE Info Popover
// ─────────────────────────────────────────────────────────────
const RPE_SCALE_WIZ = [
  { range: '1–2', label: 'Very Easy',  desc: 'Barely breathing — full conversation' },
  { range: '3–4', label: 'Light',       desc: 'Comfortable, can sing or chat freely' },
  { range: '5–6', label: 'Moderate',    desc: 'Zone 2 — slightly winded, still talking' },
  { range: '7–8', label: 'Hard',        desc: 'Short phrases only, pushing effort' },
  { range: '9',    label: 'Very Hard',   desc: 'Near max — barely 1–2 words' },
  { range: '10',   label: 'Max Effort',  desc: 'All-out sprint — cannot speak' },
];
function rpeMatchesRangeWiz(rpe: number, range: string): boolean {
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
              {targetRPE !== undefined && <span className="text-red-300"> Target for this session: <strong>{targetRPE}/10</strong>.</span>}
            </p>
            <div className="space-y-1">
              {RPE_SCALE_WIZ.map(({ range, label, desc }) => {
                const isTarget = targetRPE !== undefined && rpeMatchesRangeWiz(targetRPE, range);
                return (
                  <div key={range} className={cn('flex items-start gap-3 rounded-lg px-2.5 py-1.5', isTarget ? 'bg-red-950/40 border border-red-800/50' : 'bg-zinc-800/30')}>
                    <span className={cn('text-sm font-headline tabular-nums w-8 flex-shrink-0', isTarget ? 'text-red-300' : 'text-zinc-500')}>{range}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-headline', isTarget ? 'text-red-200' : 'text-zinc-200')}>{label}{isTarget && <span className="text-xs text-red-400 ml-2">← target</span>}</p>
                      <p className="text-xs text-zinc-500">{desc}</p>
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
// Step dots
// ─────────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-full transition-all duration-300',
            i < current
              ? 'w-2 h-2 bg-red-500'
              : i === current
              ? 'w-3 h-3 bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
              : 'w-2 h-2 bg-zinc-700',
          )}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Wizard
// ─────────────────────────────────────────────────────────────

interface CardioProgramWizardProps {
  open: boolean;
  onClose: () => void;
}

export function CardioProgramWizard({ open, onClose }: CardioProgramWizardProps) {
  const { addProgram } = useCardio();
  const { user } = useAuth();
  const { toast } = useToast();
  const { getUserSettings, updateUserSettings } = useKhet();

  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<CardioFitnessLevel | null>(null);
  const [goal, setGoal] = useState<CardioGoal | null>(null);
  const [exerciseId, setExerciseId] = useState('');
  const [varietyMode, setVarietyMode] = useState(false);
  const [preferredExerciseIds, setPreferredExerciseIds] = useState<string[]>([]);
  const [maxMode, setMaxMode] = useState(false);
  const [maxGlitch, setMaxGlitch] = useState(false);
  const [daysPerWeek, setDaysPerWeek] = useState<3 | 4 | 5 | 6 | 7>(3);
  const [durationWeeks, setDurationWeeks] = useState<4 | 6 | 8>(6);
  const [bodyWeight, setBodyWeight] = useState('');
  const [bodyWeightUnit, setBodyWeightUnit] = useState<'lbs' | 'kg'>('lbs');
  const [saving, setSaving] = useState(false);

  // Pre-populate weight + unit from Athlete Profile when wizard opens
  useEffect(() => {
    if (!open) return;
    getUserSettings().then((s) => {
      if (s?.bodyWeight) setBodyWeight(String(s.bodyWeight));
      if (s?.weightUnit) setBodyWeightUnit(s.weightUnit as 'lbs' | 'kg');
    });
  }, [open, getUserSettings]);

  /** Always returns kg regardless of the entered unit */
  const bodyWeightKgCalc = (() => {
    const n = parseFloat(bodyWeight);
    if (isNaN(n) || n <= 0) return 0;
    return bodyWeightUnit === 'lbs' ? lbsToKg(n) : n;
  })();

  const primaryDisplayId = varietyMode ? (preferredExerciseIds[0] ?? '') : exerciseId;
  const selectedExercise = CARDIO_EXERCISES.find((e) => e.id === primaryDisplayId) ?? null;

  const preview = useMemo(() => {
    if (!level || !goal) return [];
    const effectiveIds = varietyMode ? preferredExerciseIds : (exerciseId ? [exerciseId] : []);
    if (effectiveIds.length === 0) return [];
    const primaryId = effectiveIds[0];
    const primaryEx = CARDIO_EXERCISES.find((e) => e.id === primaryId) ?? CARDIO_EXERCISES[0];
    return generateCardioProgram({
      fitnessLevel: level,
      goal,
      primaryExerciseId: primaryId,
      primaryExerciseName: primaryEx.name,
      daysPerWeek,
      durationWeeks,
      preferredExerciseIds: effectiveIds,
      varietyMode,
      maxModeEnabled: maxMode,
    }).filter((s) => s.week === 1);
  }, [level, goal, exerciseId, daysPerWeek, durationWeeks, varietyMode, preferredExerciseIds, maxMode]);

  const programName = level && goal
    ? varietyMode
      ? `${level} ${goal} Engine`
      : selectedExercise
        ? `${level} ${goal} Engine — ${selectedExercise.name}`
        : `${level} ${goal} Engine`
    : '';

  const [customProgramName, setCustomProgramName] = useState('');

  // Auto-seed the editable name when the user reaches step 4
  useEffect(() => {
    if (step === 3 && programName && !customProgramName) {
      setCustomProgramName(programName);
    }
  }, [step, programName]); // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveProgramName = customProgramName.trim() || programName;

  const canNext = [
    !!level,
    !!goal,
    // step 2: must have at least one exercise selected
    varietyMode ? preferredExerciseIds.length >= 1 : !!exerciseId,
    true,
  ][step];

  const handleNext = () => {
    if (step < 3) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else { resetAndClose(); }
  };

  const resetAndClose = () => {
    setStep(0);
    setLevel(null);
    setGoal(null);
    setExerciseId('');
    setVarietyMode(false);
    setPreferredExerciseIds([]);
    setMaxMode(false);
    setMaxGlitch(false);
    setDaysPerWeek(3);
    setDurationWeeks(6);
    setBodyWeight('');
    setCustomProgramName('');
    onClose();
  };

  // Calorie estimate for full program (used in Step 4)
  const programCalorieEstimate = useMemo(() => {
    if (!level || !goal) return 0;
    const bw = bodyWeightKgCalc;
    if (bw < 20) return 0;  // sanity check: < 20 kg is implausible
    const effectiveIds = varietyMode ? preferredExerciseIds : (exerciseId ? [exerciseId] : []);
    if (effectiveIds.length === 0) return 0;
    const primaryId = effectiveIds[0];
    const primaryEx = CARDIO_EXERCISES.find((e) => e.id === primaryId) ?? CARDIO_EXERCISES[0];
    const allSessions = generateCardioProgram({
      fitnessLevel: level,
      goal,
      primaryExerciseId: primaryId,
      primaryExerciseName: primaryEx.name,
      daysPerWeek,
      durationWeeks,
      preferredExerciseIds: effectiveIds,
      varietyMode,
      maxModeEnabled: maxMode,
    });
    return allSessions.reduce((sum, s) => {
      const ex = CARDIO_EXERCISES.find((e) => e.id === s.slot.exerciseId) ?? CARDIO_EXERCISES[0];
      const met = s.slot.targetRPE >= 7 ? ex.metHigh : ex.metModerate;
      const sessionCal = estimateCalories(met, bw, s.estimatedMinutes);
      const finisherCal = s.maxFinisher
        ? estimateCalories(11, bw, (s.maxFinisher.rounds * s.maxFinisher.repsPerRound) / 10)
        : 0;
      return sum + sessionCal + finisherCal;
    }, 0);
  }, [level, goal, exerciseId, daysPerWeek, durationWeeks, varietyMode, preferredExerciseIds, maxMode, bodyWeightKgCalc]);

  const handleMaxModeToggle = () => {
    const next = !maxMode;
    setMaxMode(next);
    if (next) {
      playMaxModeSound();
      setMaxGlitch(true);
      setTimeout(() => setMaxGlitch(false), 500);
    }
  };

  const handleCreate = async () => {
    if (!user || !level || !goal) return;
    setSaving(true);
    try {
      const bwKg = bodyWeightKgCalc > 0 ? bodyWeightKgCalc : undefined;
      // Save back to Athlete Profile in kg (canonical unit for calorie math)
      if (bwKg) {
        updateUserSettings({ bodyWeight: bwKg, weightUnit: 'kg' }).catch(() => {/* non-critical */});
      }
      const effectivePreferredIds = varietyMode
        ? preferredExerciseIds
        : (exerciseId ? [exerciseId] : [CARDIO_EXERCISES[0].id]);
      const effectivePrimaryId = effectivePreferredIds[0];
      const effectivePrimaryExercise = CARDIO_EXERCISES.find((e) => e.id === effectivePrimaryId) ?? CARDIO_EXERCISES[0];
      await addProgram({
        userId: user.uid,
        name: effectiveProgramName,
        fitnessLevel: level,
        goal,
        primaryExerciseId: effectivePrimaryId,
        primaryExerciseName: effectivePrimaryExercise.name,
        daysPerWeek,
        durationWeeks,
        createdAt: format(new Date(), 'yyyy-MM-dd'),
        startDate: null,
        lastSessionDate: null,
        lastSessionIndex: -1,
        sessionsCompleted: 0,
        totalSessions: daysPerWeek * durationWeeks,
        weeklyLog: { weekStr: '', count: 0 },
        bodyWeightKg: bwKg,   // always kg
        preferredExerciseIds: effectivePreferredIds,
        varietyMode,
        maxModeEnabled: maxMode,
      });
      toast({ title: 'ENGINE FORGED', description: effectiveProgramName });
      resetAndClose();
    } catch (err) {
      console.error('[Wizard] create failed:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error creating program', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const INTERVAL_BADGE: Record<string, string> = {
    Zone2: 'text-blue-300 border-blue-700/50 bg-blue-950/20',
    LSD: 'text-blue-400 border-blue-600/50 bg-blue-950/20',
    HIIT: 'text-red-300 border-red-700/50 bg-red-950/20',
    Tabata: 'text-orange-300 border-orange-700/50 bg-orange-950/20',
    Tempo: 'text-yellow-300 border-yellow-700/50 bg-yellow-950/20',
    Pyramid: 'text-purple-300 border-purple-700/50 bg-purple-950/20',
    EMOM: 'text-cyan-300 border-cyan-700/50 bg-cyan-950/20',
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#060810]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-red-900/40 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-red-400" />
          <h2 className="font-headline text-red-300 text-base uppercase tracking-widest">
            Endurance Engine
          </h2>
        </div>
        <button onClick={resetAndClose} className="p-1.5 rounded text-zinc-400 active:scale-90 transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      <StepDots current={step} total={4} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">

        {/* ── STEP 0: LEVEL ── */}
        {step === 0 && (
          <>
            <div className="text-center pt-2">
              <p className="text-xs font-headline uppercase tracking-[0.3em] text-zinc-300">Step 1 of 4</p>
              <h3 className="font-headline text-red-200 text-lg uppercase tracking-widest mt-1">Select Your Level</h3>
              <p className="text-sm text-zinc-300 mt-1">This determines your work-to-rest ratios and intensity targets.</p>
            </div>
            <div className="space-y-3 pt-2">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLevel(l.id)}
                  className={cn(
                    'w-full rounded-xl border-2 p-4 text-left transition-all active:scale-[0.98]',
                    level === l.id ? LEVEL_SELECTED[l.id] : LEVEL_COLORS[l.id],
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{l.icon}</span>
                    <span className="font-headline text-sm uppercase tracking-widest">{l.label}</span>
                    {level === l.id && <Check className="w-4 h-4 ml-auto text-current" />}
                  </div>
                  <p className="text-sm text-zinc-300 leading-snug">{l.desc}</p>
                  {level === l.id && (
                    <p className="text-sm text-zinc-300 mt-2 leading-snug border-t border-zinc-700/50 pt-2">{l.detail}</p>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── STEP 1: GOAL ── */}
        {step === 1 && (
          <>
            <div className="text-center pt-2">
              <p className="text-xs font-headline uppercase tracking-[0.3em] text-zinc-300">Step 2 of 4</p>
              <h3 className="font-headline text-red-200 text-lg uppercase tracking-widest mt-1">Primary Goal</h3>
              <p className="text-sm text-zinc-300 mt-1">Shapes volume, intensity distribution, and interval structure.</p>
            </div>
            <div className="space-y-3 pt-2">
              {GOALS.map((g) => {
                const isSelected = goal === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={cn(
                      'w-full rounded-xl border-2 p-4 text-left transition-all active:scale-[0.98]',
                      isSelected
                        ? 'border-red-400 bg-red-950/40 text-red-200 shadow-[0_0_14px_rgba(239,68,68,0.4)]'
                        : 'border-zinc-700 bg-zinc-900/40 text-zinc-300',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{g.icon}</span>
                      <span className="font-headline text-sm uppercase tracking-widest">{g.label}</span>
                      {isSelected && <Check className="w-4 h-4 ml-auto text-red-400" />}
                    </div>
                    <p className="text-sm text-zinc-300 leading-snug">{g.desc}</p>
                    {isSelected && (
                      <p className="text-sm text-zinc-300 mt-2 leading-snug border-t border-zinc-700/50 pt-2">{g.detail}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── STEP 2: SETUP ── */}
        {step === 2 && (
          <>
            <div className="text-center pt-2">
              <p className="text-xs font-headline uppercase tracking-[0.3em] text-zinc-300">Step 3 of 4</p>
              <h3 className="font-headline text-red-200 text-lg uppercase tracking-widest mt-1">Program Setup</h3>
            </div>

            {/* Days per week */}
            <div className="space-y-2">
              <label className="text-sm font-headline uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" /> Days Per Week (min. 3)
              </label>
              <div className="flex gap-2">
                {DAYS_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDaysPerWeek(d)}
                    className={cn(
                      'flex-1 py-2.5 rounded-lg border font-headline text-sm uppercase tracking-widest transition-all active:scale-95',
                      daysPerWeek === d
                        ? 'border-red-500 bg-red-950/40 text-red-200 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                        : 'border-zinc-700 bg-zinc-900 text-zinc-500',
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-sm font-headline uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Program Duration (weeks)
              </label>
              <div className="flex gap-2">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDurationWeeks(d)}
                    className={cn(
                      'flex-1 py-2.5 rounded-lg border font-headline text-sm uppercase tracking-widest transition-all active:scale-95',
                      durationWeeks === d
                        ? 'border-red-500 bg-red-950/40 text-red-200 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                        : 'border-zinc-700 bg-zinc-900 text-zinc-500',
                    )}
                  >
                    {d}w
                  </button>
                ))}
              </div>
            </div>

            {/* Body weight */}
            <div className="space-y-2">
              <label className="text-xs font-headline uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Body Weight
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  step={0.5}
                  value={bodyWeight}
                  onChange={(e) => setBodyWeight(e.target.value)}
                  placeholder={bodyWeightUnit === 'lbs' ? 'e.g. 185' : 'e.g. 84'}
                  className="flex-1 h-11 bg-black border border-zinc-700 rounded-lg px-3 text-base text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
                />
                <div className="flex rounded-lg overflow-hidden border border-zinc-700">
                  {(['lbs', 'kg'] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => setBodyWeightUnit(u)}
                      className={cn(
                        'px-3 py-2 text-sm font-headline uppercase tracking-widest transition-all',
                        bodyWeightUnit === u
                          ? 'bg-red-950/50 text-red-200 border-red-600/50'
                          : 'bg-zinc-900 text-zinc-400 active:bg-zinc-800',
                      )}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              {bodyWeightKgCalc > 0 && (
                <p className="text-xs text-zinc-400">
                  = {bodyWeightKgCalc.toFixed(1)} kg — used for calorie estimates
                </p>
              )}
              {!bodyWeight && (
                <p className="text-sm text-zinc-300">Used only for calorie estimates. Saves to your Athlete Profile.</p>
              )}
            </div>

            {/* Exercise picker */}
            <div className="space-y-2">
              <label className="text-sm font-headline uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Training Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setVarietyMode(false)}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-all active:scale-[0.98]',
                    !varietyMode ? 'border-red-500 bg-red-950/30 text-red-200' : 'border-zinc-700 bg-zinc-900/50 text-zinc-400',
                  )}
                >
                  <p className="text-sm font-headline uppercase tracking-widest">One Modality</p>
                  <p className="text-sm text-zinc-300 mt-1 leading-snug">Master one exercise. Clear linear progress tracking.</p>
                </button>
                <button
                  onClick={() => {
                    setVarietyMode(true);
                    // Don’t seed from an empty exerciseId — let the user pick
                    if (preferredExerciseIds.length === 0 && exerciseId) {
                      setPreferredExerciseIds([exerciseId]);
                    }
                  }}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-all active:scale-[0.98]',
                    varietyMode ? 'border-red-500 bg-red-950/30 text-red-200' : 'border-zinc-700 bg-zinc-900/50 text-zinc-400',
                  )}
                >
                  <p className="text-sm font-headline uppercase tracking-widest">Cross-Train</p>
                  <p className="text-sm text-zinc-300 mt-1 leading-snug">Mix modalities. Prevents overuse, builds a complete engine.</p>
                </button>
              </div>
              {varietyMode && (
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Science-based assignment: low-impact exercises go to Zone 2 recovery days; high-impact to HIIT
                  and Tabata days. Select 2–5 exercises below.
                </p>
              )}
            </div>

            {/* Exercise grid */}
            <div className="space-y-2">
              {/* Empty-state prompt */}
              {!varietyMode && !exerciseId && (
                <div className="rounded-xl border-2 border-dashed border-red-700/50 bg-red-950/10 px-4 py-4 text-center">
                  <p className="text-sm font-headline text-red-300 uppercase tracking-widest">Choose Your Exercise</p>
                  <p className="text-sm text-zinc-300 mt-1">Select the primary modality for your program below.</p>
                </div>
              )}
              {/* Big counter when in variety mode */}
              {varietyMode && (
                <div className={cn(
                  'rounded-xl border px-4 py-3 flex items-center justify-between',
                  preferredExerciseIds.length === 0
                    ? 'border-dashed border-red-700/50 bg-red-950/10'
                    : 'border-red-900/40 bg-red-950/10',
                )}>
                  <div>
                    {preferredExerciseIds.length === 0 ? (
                      <>
                        <p className="text-sm font-headline text-red-300 uppercase tracking-widest">Pick 2–5 Exercises</p>
                        <p className="text-sm text-zinc-300 mt-0.5">Select from the grid below to begin.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-headline uppercase tracking-widest text-zinc-300">Selected</p>
                        <p className="text-4xl font-headline text-red-300 leading-none tabular-nums">
                          {preferredExerciseIds.length}<span className="text-xl text-zinc-400">/5</span>
                        </p>
                      </>
                    )}
                  </div>
                  <div className="text-right max-w-[180px]">
                      <p className="text-sm text-zinc-300 leading-snug">
                      {preferredExerciseIds.length === 0
                        ? 'Tap any exercise to add it. You can change these any time mid-session.'
                        : 'You can swap any exercise mid-session using the Alternate button.'}
                    </p>
                  </div>
                </div>
              )}
              <label className="text-sm font-headline uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                {varietyMode
                  ? 'Preferred Exercises — science-based rotation'
                  : 'Primary Exercise / Modality'}
              </label>
              <div className="space-y-3">
                {CATEGORY_ORDER.map((cat) => {
                  const exercises = CARDIO_EXERCISES.filter((e) => e.category === cat);
                  return (
                    <div key={cat}>
                      <p className="text-xs font-headline uppercase tracking-widest text-zinc-400 mb-1.5">{cat}</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {exercises.map((ex) => {
                          const isSelected = varietyMode
                            ? preferredExerciseIds.includes(ex.id)
                            : exerciseId === ex.id;
                          return (
                            <button
                              key={ex.id}
                              onClick={() => {
                                if (varietyMode) {
                                  setPreferredExerciseIds((prev) => {
                                    if (prev.includes(ex.id)) {
                                      return prev.length > 1 ? prev.filter((id) => id !== ex.id) : prev;
                                    }
                                    return prev.length < 5 ? [...prev, ex.id] : prev;
                                  });
                                } else {
                                  setExerciseId(ex.id);
                                  setPreferredExerciseIds([ex.id]);
                                }
                              }}
                              className={cn(
                                'rounded-lg border px-3 py-2 text-left transition-all active:scale-[0.98] relative',
                                isSelected
                                  ? 'border-red-500/70 bg-red-950/30 text-red-200'
                                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-400',
                              )}
                            >
                              <p className="text-sm font-headline leading-tight pr-5">{ex.name}</p>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                {ex.metModerate < 6 ? 'Low Intensity' : ex.metModerate < 9 ? 'Moderate' : ex.metModerate < 12 ? 'High Intensity' : 'Very High'}
                              </p>
                              {isSelected && (
                                <div className={cn(
                                  'absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center',
                                  'bg-red-500',
                                )}>
                                  {varietyMode
                                    ? <span className="text-[8px] font-bold text-white leading-none">{preferredExerciseIds.indexOf(ex.id) + 1}</span>
                                    : <Check className="w-2.5 h-2.5 text-white" />}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Max Mode toggle */}
            <button
              onClick={handleMaxModeToggle}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-all text-left',
                maxMode
                  ? 'border-red-400 bg-red-950/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                  : 'border-zinc-600 bg-zinc-900',
                maxGlitch && 'animate-max-glitch',
              )}
            >
              <Zap className={cn('w-5 h-5 flex-shrink-0', maxMode ? 'text-red-400' : 'text-zinc-500')} />
              <div className="flex-1">
                <p className={cn('text-sm font-headline uppercase tracking-wider', maxMode ? 'text-red-300' : 'text-zinc-400')}>
                  Max Mode
                </p>
                <p className="text-sm text-zinc-300 mt-0.5 leading-relaxed">
                  {maxMode
                    ? '⚡ Burpee finisher added to every session. No mercy.'
                    : 'Adds a burpee finisher to every session — scales with your level. Brutal by design.'}
                </p>
              </div>
              <div className={cn(
                'w-10 h-6 rounded-full border-2 flex items-center px-0.5 transition-all duration-300 flex-shrink-0',
                maxMode ? 'border-red-500 bg-red-500' : 'border-zinc-600 bg-zinc-800',
              )}>
                <div className={cn(
                  'w-4 h-4 rounded-full bg-white transition-transform duration-300',
                  maxMode ? 'translate-x-4' : 'translate-x-0',
                )} />
              </div>
            </button>
          </>
        )}

        {/* ── STEP 3: PREVIEW ── */}
        {step === 3 && (
          <>
            <div className="text-center pt-2">
              <p className="text-xs font-headline uppercase tracking-[0.3em] text-zinc-300">Step 4 of 4</p>
              <h3 className="font-headline text-red-200 text-lg uppercase tracking-widest mt-1">Program Preview</h3>
            </div>

            {/* Program name card */}
            <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
              <p className="text-xs font-headline uppercase tracking-widest text-red-400 mb-2">Program Name</p>
              <input
                type="text"
                value={customProgramName}
                onChange={(e) => setCustomProgramName(e.target.value)}
                placeholder={programName || 'Name your program…'}
                maxLength={60}
                className="w-full bg-transparent border-b border-red-800/50 focus:border-red-400 outline-none font-headline text-red-200 text-base leading-tight pb-1 placeholder:text-red-900/70 transition-colors"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-sm font-headline uppercase px-2 py-1 rounded border border-zinc-600 text-zinc-300">
                  {daysPerWeek} days/week
                </span>
                <span className="text-sm font-headline uppercase px-2 py-1 rounded border border-zinc-600 text-zinc-300">
                  {durationWeeks} weeks
                </span>
                <span className="text-sm font-headline uppercase px-2 py-1 rounded border border-zinc-600 text-zinc-300">
                  {daysPerWeek * durationWeeks} sessions
                </span>
              </div>
            </div>

            {/* Week 1 schedule */}
            <div className="space-y-2">
              <p className="text-sm font-headline uppercase tracking-[0.3em] text-zinc-300">Week 1 Schedule</p>
              {preview.map((session) => (
                <div
                  key={session.index}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-headline text-zinc-200">{session.focus}</span>
                      <span className={cn(
                        'text-xs font-headline uppercase px-1.5 py-0.5 rounded border',
                        INTERVAL_BADGE[session.slot.intervalType] ?? 'text-zinc-300 border-zinc-600',
                      )}>
                        {session.slot.intervalType}
                      </span>
                      {varietyMode && (
                        <span className="text-xs font-headline text-cyan-300">{session.slot.exerciseName}</span>
                      )}
                    </div>
                    {session.slot.interval && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {session.slot.interval.workSeconds}s work / {session.slot.interval.restSeconds}s rest × {session.slot.interval.rounds} rounds
                      </p>
                    )}
                    {session.maxFinisher && (
                      <p className="text-xs text-red-400 mt-0.5">
                        + {session.maxFinisher.rounds}×{session.maxFinisher.repsPerRound} Burpee Finisher
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-headline text-red-300">{session.estimatedMinutes}m</p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <p className="text-xs text-zinc-400">RPE {session.slot.targetRPE}</p>
                      <RPEInfoPopover targetRPE={session.slot.targetRPE} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Calorie estimate card */}
            {programCalorieEstimate > 0 ? (
              <div className="rounded-xl border border-orange-800/50 bg-orange-950/15 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-headline uppercase tracking-widest text-orange-400 mb-1">Estimated Total Burn</p>
                    <p className="text-3xl font-headline text-orange-300 leading-none tabular-nums">
                      {programCalorieEstimate.toLocaleString()}
                      <span className="text-base font-headline text-orange-400 ml-1">kcal</span>
                    </p>
                    <div className="flex gap-4 mt-2">
                      <div>
                        <p className="text-xs font-headline uppercase tracking-widest text-zinc-400">Per Session</p>
                        <p className="text-lg font-headline text-orange-200 leading-none tabular-nums">
                          ~{Math.round(programCalorieEstimate / (daysPerWeek * durationWeeks)).toLocaleString()}
                          <span className="text-xs text-orange-400 ml-0.5">kcal</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-headline uppercase tracking-widest text-zinc-400">Per Week</p>
                        <p className="text-lg font-headline text-orange-200 leading-none tabular-nums">
                          ~{Math.round(programCalorieEstimate / durationWeeks).toLocaleString()}
                          <span className="text-xs text-orange-400 ml-0.5">kcal</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <Flame className="w-8 h-8 text-orange-500 flex-shrink-0 mt-1" />
                </div>
                <p className="text-sm text-zinc-300 mt-3 leading-relaxed border-t border-orange-900/30 pt-2.5">
                  Want to burn more? Use the Alternate button mid-session to swap in higher-intensity exercises.
                  You can also add extra segments to any session, or log additional
                  cardio separately using the <span className="text-orange-400">Log Cardio</span> button on the dashboard.
                </p>
              </div>
            ) : (
              <p className="text-sm text-zinc-400 text-center px-4">
                Add your body weight in Step 3 to see an estimated calorie burn for the full program.
              </p>
            )}
          </>
        )}
      </div>

      {/* Footer nav */}
      <div className="px-4 py-4 border-t border-zinc-800 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={handleBack}
            className="flex items-center gap-1 px-4 py-2.5 rounded-lg border border-zinc-600 text-zinc-300 text-sm font-headline uppercase tracking-wider transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          {step === 0 ? 'Cancel' : 'Back'}
        </button>

        {step < 3 ? (
          <button
            onClick={handleNext}
            disabled={!canNext}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-600/60 bg-red-950/30 text-red-200 text-sm font-headline uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-500 bg-red-600/25 text-red-100 text-sm font-headline uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 shadow-[0_0_16px_rgba(239,68,68,0.35)]"
          >
            <Flame className="w-4 h-4" />
            {saving ? 'Forging…' : 'Forge Program'}
          </button>
        )}
      </div>
    </div>
  );
}
