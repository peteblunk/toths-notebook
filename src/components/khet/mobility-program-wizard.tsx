"use client";

import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Activity, Moon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobility } from '@/hooks/use-mobility';
import { useToast } from '@/hooks/use-toast';
import {
  generateMobilityPlan,
  type TightSpot,
  type MobilityProgram,
  type MobilityExercise,
} from '@/lib/mobility-types';
import { format } from 'date-fns';
import mobilityExercisesData from '@/../public/docs/mobility-exercises.json';
import { MobilityExerciseEditor } from './mobility-exercise-editor';

const ALL_EXERCISES = mobilityExercisesData as MobilityExercise[];

const TIGHT_SPOTS: { id: TightSpot; label: string; icon: string }[] = [
  { id: 'Hips', label: 'Hips', icon: '🔄' },
  { id: 'Lower Back', label: 'Lower Back', icon: '🗜️' },
  { id: 'Hamstrings', label: 'Hamstrings', icon: '🦵' },
  { id: 'Shoulders', label: 'Shoulders', icon: '🏋️' },
  { id: 'Ankles', label: 'Ankles', icon: '🦶' },
];

const DAYS_OPTIONS = [2, 3, 4, 5, 6] as const;

type ReviewType = 'single' | 'A' | 'B';

/** Build the Week-1 exercise list for a given session type */
function buildReviewExercises(
  type: ReviewType,
  tightSpots: TightSpot[],
  structure: 'single' | 'AB',
): MobilityExercise[] {
  const sessions = generateMobilityPlan(
    { tightSpots, daysPerWeek: structure === 'AB' ? 4 : 3, structure, includePreBed: false },
    ALL_EXERCISES,
  );
  const target = sessions.find((s) => {
    if (structure === 'AB') return type === 'A' ? s.label === 'Day A' : s.label === 'Day B';
    return s.label.startsWith('Session');
  });
  if (!target) return [];
  return target.slots
    .map((slot) => ALL_EXERCISES.find((e) => e.id === slot.exerciseId))
    .filter((e): e is MobilityExercise => e !== null && e !== undefined);
}

interface MobilityProgramWizardProps {
  open: boolean;
  onClose: () => void;
}

export function MobilityProgramWizard({ open, onClose }: MobilityProgramWizardProps) {
  const { addProgram } = useMobility();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('Mobility Protocol');
  const [tightSpots, setTightSpots] = useState<TightSpot[]>(['Hips', 'Lower Back', 'Hamstrings']);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [includePreBed, setIncludePreBed] = useState(false);
  const [saving, setSaving] = useState(false);

  // Review step state
  const [reviewExercises, setReviewExercises] = useState<Record<ReviewType, MobilityExercise[]>>({ single: [], A: [], B: [] });

  if (!open) return null;

  const structure = daysPerWeek > 3 ? 'AB' : 'single';
  const totalMainSessions = 6 * daysPerWeek;

  const toggleSpot = (spot: TightSpot) => {
    setTightSpots((prev) =>
      prev.includes(spot) ? prev.filter((s) => s !== spot) : [...prev, spot],
    );
  };

  /** Called when advancing from Step 2 → Step 3 to generate review exercises */
  const buildReview = () => {
    const s = daysPerWeek > 3 ? 'AB' : 'single';
    if (s === 'AB') {
      setReviewExercises({
        single: [],
        A: buildReviewExercises('A', tightSpots, s),
        B: buildReviewExercises('B', tightSpots, s),
      });
    } else {
      setReviewExercises({
        single: buildReviewExercises('single', tightSpots, s),
        A: [],
        B: [],
      });
    }
  };

  const handleCreate = async () => {
    if (tightSpots.length === 0) {
      toast({ title: 'Select at least one tight spot', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      // Build custom slot order from review step
      const customSlotOrder: Record<'single' | 'A' | 'B', string[]> = {
        single: reviewExercises.single.map((e) => e.id),
        A: reviewExercises.A.map((e) => e.id),
        B: reviewExercises.B.map((e) => e.id),
      };

      const data: Omit<MobilityProgram, 'id'> = {
        userId: '',
        name: name.trim() || 'Mobility Protocol',
        tightSpots,
        daysPerWeek,
        includePreBed,
        structure,
        createdAt: format(new Date(), 'yyyy-MM-dd'),
        startDate: null,
        lastSessionDate: null,
        lastSessionIndex: -1,
        sessionsCompleted: 0,
        totalMainSessions,
        weeklyLog: { weekStr: '', count: 0 },
        customSlotOrder,
      };
      await addProgram(data);
      toast({ title: '6-Week Mobility Protocol Created', description: `${totalMainSessions} sessions across 6 weeks.` });
      onClose();
      setStep(1);
    } catch {
      toast({ title: 'Error creating program', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-950 border border-blue-500/40 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="font-headline text-blue-300 text-base uppercase tracking-widest">
              New Mobility Program
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

        {/* Step progress */}
        <div className="flex h-1 bg-zinc-900">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={cn(
                'flex-1 transition-all duration-500',
                step >= s ? 'bg-blue-500' : 'bg-zinc-800',
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* ── Step 1: Name + Tight Spots ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-headline uppercase tracking-widest text-blue-400 block mb-2">
                  Program Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Mobility Protocol"
                  maxLength={40}
                />
              </div>
              <div>
                <label className="text-xs font-headline uppercase tracking-widest text-blue-400 block mb-3">
                  What's Tight? (Select All That Apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIGHT_SPOTS.map(({ id, label, icon }) => (
                    <button
                      key={id}
                      onClick={() => toggleSpot(id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-headline uppercase tracking-wider transition-all',
                        tightSpots.includes(id)
                          ? 'border-blue-500 bg-blue-950/40 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500',
                      )}
                    >
                      <span>{icon}</span>
                      {label}
                      {tightSpots.includes(id) && (
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Days/Week + Pre-Bed ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-headline uppercase tracking-widest text-blue-400 block mb-3">
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
                          ? 'border-blue-500 bg-blue-950/40 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500',
                      )}
                    >
                      {d}x
                    </button>
                  ))}
                </div>

                {/* Structure hint */}
                <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                  {daysPerWeek <= 3 ? (
                    <p className="text-xs text-zinc-400">
                      <span className="text-blue-300 font-headline">Single Structure</span> — Each session covers all your tight spots with the same full-body template.
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400">
                      <span className="text-blue-300 font-headline">A/B Alternating</span> — Day A targets Hips, Hamstrings & Ankles. Day B targets Lower Back & Shoulders. Better for 4+ days.
                    </p>
                  )}
                </div>
              </div>

              {/* Pre-bed toggle */}
              <div>
                <label className="text-xs font-headline uppercase tracking-widest text-blue-400 block mb-3">
                  Pre-Bed Routine
                </label>
                <button
                  onClick={() => setIncludePreBed((v) => !v)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 rounded-lg border transition-all text-left',
                    includePreBed
                      ? 'border-indigo-500/70 bg-indigo-950/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                      : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500',
                  )}
                >
                  <Moon
                    className={cn(
                      'w-5 h-5 flex-shrink-0',
                      includePreBed ? 'text-indigo-400' : 'text-zinc-500',
                    )}
                  />
                  <div className="flex-1">
                    <p
                      className={cn(
                        'text-sm font-headline uppercase tracking-wider',
                        includePreBed ? 'text-indigo-300' : 'text-zinc-400',
                      )}
                    >
                      10-Minute Pre-Bed Routine
                    </p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      Supine spinal twist, happy baby, legs up the wall
                    </p>
                  </div>
                  <div
                    className={cn(
                      'w-10 h-6 rounded-full border-2 flex items-center transition-all duration-300 px-0.5',
                      includePreBed
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-zinc-600 bg-zinc-800',
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full bg-white transition-transform duration-300',
                        includePreBed ? 'translate-x-4' : 'translate-x-0',
                      )}
                    />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Review & Edit Exercises ── */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Drag to reorder. Use the pencil to swap for near-equivalents or search the full library.
                Use the trash to remove. Add anything you want with the button below.
              </p>

              <MobilityExerciseEditor
                structure={structure}
                exercises={reviewExercises}
                onChange={setReviewExercises}
              />

              {includePreBed && (
                <div className="rounded-lg border border-indigo-800/40 bg-indigo-950/20 px-3 py-2.5 flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <p className="text-xs text-indigo-300">
                    Pre-bed routine (fixed): Spinal Twist · Happy Baby · Legs Up the Wall · Child's Pose
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Final Summary + Confirm ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-500/30 bg-blue-950/10 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="font-headline text-blue-300 uppercase tracking-widest text-sm">
                    {name || 'Mobility Protocol'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2.5">
                    <div className="text-xs text-zinc-500 mb-1">Duration</div>
                    <div className="text-blue-300 font-headline">6 Weeks</div>
                  </div>
                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2.5">
                    <div className="text-xs text-zinc-500 mb-1">Frequency</div>
                    <div className="text-blue-300 font-headline">{daysPerWeek}× / Week</div>
                  </div>
                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2.5">
                    <div className="text-xs text-zinc-500 mb-1">Structure</div>
                    <div className="text-blue-300 font-headline">
                      {structure === 'AB' ? 'A/B Split' : 'Full Body'}
                    </div>
                  </div>
                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2.5">
                    <div className="text-xs text-zinc-500 mb-1">Total Sessions</div>
                    <div className="text-blue-300 font-headline">{totalMainSessions}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-zinc-500 mb-2">Target Areas</div>
                  <div className="flex flex-wrap gap-1.5">
                    {tightSpots.map((s) => (
                      <span
                        key={s}
                        className="text-xs font-headline uppercase tracking-wider text-blue-300 border border-blue-500/40 rounded px-2 py-0.5 bg-blue-950/20"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {includePreBed && (
                  <div className="flex items-center gap-2 text-xs text-indigo-400 border-t border-zinc-800 pt-3 mt-1">
                    <Moon className="w-3.5 h-3.5" />
                    <span>Pre-bed routine included (10 min nightly)</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-zinc-500 text-center">
                Exercises progress in intensity across 6 weeks. Sessions get harder — so do you.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-zinc-800">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 text-sm font-headline uppercase tracking-wider transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => {
                if (step === 2) buildReview();
                setStep((s) => s + 1);
              }}
              disabled={step === 1 && tightSpots.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-blue-500 bg-blue-950/30 text-blue-300 hover:bg-blue-950/50 text-sm font-headline uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === 3 ? 'Approve & Continue' : 'Continue'}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-blue-400 bg-blue-600/20 text-blue-200 hover:bg-blue-600/30 text-sm font-headline uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-40"
            >
              {saving ? 'Forging…' : 'Begin 6-Week Protocol'}
              <Activity className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
