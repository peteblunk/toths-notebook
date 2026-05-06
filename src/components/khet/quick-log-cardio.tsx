"use client";

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { X, Zap, Flame, Search, Check, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCardio } from '@/hooks/use-cardio';
import { useKhet } from '@/hooks/use-khet';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  CARDIO_EXERCISES,
  estimateCalories,
  lbsToKg,
  type CardioExerciseCategory,
} from '@/lib/endurance-types';

const CATEGORY_ORDER: CardioExerciseCategory[] = ['Machine', 'Bodyweight', 'Outdoor', 'Water'];

// ─────────────────────────────────────────────────────────────
// RPE Info Popover
// ─────────────────────────────────────────────────────────────
const RPE_SCALE_QL = [
  { range: '1–2', label: 'Very Easy',  desc: 'Barely breathing — full conversation' },
  { range: '3–4', label: 'Light',       desc: 'Comfortable, can sing or chat freely' },
  { range: '5–6', label: 'Moderate',    desc: 'Zone 2 — slightly winded, still talking' },
  { range: '7–8', label: 'Hard',        desc: 'Short phrases only, pushing effort' },
  { range: '9',    label: 'Very Hard',   desc: 'Near max — barely 1–2 words' },
  { range: '10',   label: 'Max Effort',  desc: 'All-out sprint — cannot speak' },
];
function rpeMatchesRangeQL(rpe: number, range: string): boolean {
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
            </p>
            <div className="space-y-1">
              {RPE_SCALE_QL.map(({ range, label, desc }) => {
                const isTarget = targetRPE !== undefined && rpeMatchesRangeQL(targetRPE, range);
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
function ExercisePicker({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string, name: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const selected = CARDIO_EXERCISES.find((e) => e.id === selectedId);
  const filtered = CARDIO_EXERCISES.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-1.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-zinc-300 font-headline active:scale-[0.98] active:bg-zinc-800 transition-all"
      >
        <span>{selected?.name ?? 'Select exercise…'}</span>
        <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-600" />
      </button>

      {open && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-800">
            <div className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-1.5">
              <Search className="w-3.5 h-3.5 text-zinc-600" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search exercises…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-700 focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto divide-y divide-zinc-800/60">
            {CATEGORY_ORDER.map((cat) => {
              const exercises = filtered.filter((e) => e.category === cat);
              if (exercises.length === 0) return null;
              return (
                <div key={cat}>
                  <p className="text-[9px] font-headline uppercase tracking-widest text-zinc-600 px-4 py-1.5 bg-zinc-900/50">{cat}</p>
                  {exercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => { onSelect(ex.id, ex.name); setOpen(false); setSearch(''); }}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-2.5 text-left active:bg-zinc-800/60 transition-colors',
                        ex.id === selectedId && 'bg-red-950/20',
                      )}
                    >
                      <span className="text-sm text-zinc-300 font-headline">{ex.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-zinc-600">MET {ex.metModerate}–{ex.metHigh}</span>
                        {ex.id === selectedId && <Check className="w-3 h-3 text-red-400" />}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// QuickLogCardio — standalone quick session logger
// ─────────────────────────────────────────────────────────────

interface QuickLogCardioProps {
  onClose: () => void;
}

export function QuickLogCardio({ onClose }: QuickLogCardioProps) {
  const { logSession } = useCardio();
  const { getUserSettings, distanceUnit } = useKhet();
  const { user } = useAuth();
  const { toast } = useToast();

  const [exerciseId, setExerciseId] = useState('treadmill-run');
  const [exerciseName, setExerciseName] = useState('Treadmill Run');
  const [duration, setDuration] = useState('');
  const [bpm, setBpm] = useState('');
  const [rpe, setRpe] = useState('');
  const [distance, setDistance] = useState('');
  const [notes, setNotes] = useState('');
  const [caloriesOverride, setCaloriesOverride] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bodyWeightKg, setBodyWeightKg] = useState(80);
  const durationRef = useRef<HTMLInputElement>(null);

  // Load body weight from Athlete Profile
  useEffect(() => {
    getUserSettings().then((s) => {
      if (!s?.bodyWeight) return;
      const bw = s.weightUnit === 'lbs' ? lbsToKg(s.bodyWeight) : s.bodyWeight;
      setBodyWeightKg(bw);
    });
  }, [getUserSettings]);

  const exercise = CARDIO_EXERCISES.find((e) => e.id === exerciseId) ?? CARDIO_EXERCISES[0];
  const durationMins = parseFloat(duration) || 0;
  const rpeNum = parseInt(rpe) || 5;
  const met = rpeNum >= 7 ? exercise.metHigh : exercise.metModerate;
  const estimatedCals = bodyWeightKg > 0 && durationMins > 0
    ? estimateCalories(met, bodyWeightKg, durationMins)
    : 0;
  const effectiveCalories = caloriesOverride !== '' ? (parseInt(caloriesOverride) || 0) : estimatedCals;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (durationMins <= 0) errs.duration = 'Duration is required';
    setErrors(errs);
    if (errs.duration) {
      durationRef.current?.focus();
      durationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !user) return;
    setSaving(true);
    try {
      await logSession({
        userId: user.uid,
        programId: 'standalone',
        programName: 'Quick Log',
        sessionIndex: 0,
        week: 1,
        label: 'Quick Log',
        date: format(new Date(), 'yyyy-MM-dd'),
        exerciseId,
        exerciseName,
        durationMinutes: durationMins,
        distance: parseFloat(distance) || undefined,
        distanceUnit,
        calories: effectiveCalories || undefined,
        avgBPM: parseInt(bpm) || undefined,
        rpe: rpeNum || undefined,
        completed: true,
        notes: notes.trim() || undefined,
      });
      toast({ title: 'CARDIO LOGGED', description: `${exerciseName} · ${durationMins}m${effectiveCalories ? ` · ~${effectiveCalories} kcal` : ''}` });
      // Stamp a completed task tile on the main task list (non-critical)
      try {
        await addDoc(collection(db, 'tasks'), {
          userId: user.uid,
          title: `Cardio — ${exerciseName}`,
          iv: null,
          isEncrypted: false,
          category: 'Khet',
          importance: 'medium',
          estimatedTime: durationMins ?? 0,
          completed: true,
          completedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          dueDate: new Date(),
          isRitual: false,
          originRitualId: null,
          khetProgramId: 'standalone',
          tags: ['Cardio', 'Khet-Station'],
        });
      } catch {
        // Non-critical — don't block the session save
      }
      onClose();
    } catch (err) {
      console.error('[QuickLogCardio] save failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: 'Save failed', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#060810]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-red-900/40 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-red-400" />
          <div>
            <h2 className="font-headline text-red-300 text-base uppercase tracking-widest leading-none">Log Cardio</h2>
            <p className="text-[9px] text-zinc-600 mt-0.5">Quick standalone session</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded text-zinc-400 active:scale-90 transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Exercise picker */}
        <div className="space-y-1.5">
          <label className="text-sm font-headline uppercase tracking-[0.2em] text-zinc-300 block">
            Exercise
          </label>
          <ExercisePicker
            selectedId={exerciseId}
            onSelect={(id, name) => { setExerciseId(id); setExerciseName(name); }}
          />
        </div>

        {/* Duration — required */}
        <div className="space-y-1.5">
          <label className="text-sm font-headline uppercase tracking-[0.2em] block flex items-center justify-between">
            <span className={cn(errors.duration ? 'text-red-400' : 'text-zinc-300')}>
              Duration (min){errors.duration ? ' *' : ''}
            </span>
            {errors.duration && (
              <span className="text-[9px] text-red-400 font-headline">{errors.duration}</span>
            )}
          </label>
          <input
            ref={durationRef}
            type="number"
            min={1}
            value={duration}
            placeholder="e.g. 30"
            onChange={(e) => { setDuration(e.target.value); setErrors((p) => ({ ...p, duration: '' })); }}
            className={cn(
              'w-full h-11 bg-black border rounded-lg px-4 text-base text-white placeholder:text-zinc-700 focus:outline-none transition-all',
              errors.duration
                ? 'border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] focus:border-red-400'
                : 'border-zinc-700 focus:border-red-500',
            )}
          />
        </div>

        {/* Live calorie estimate */}
        {estimatedCals > 0 && (
          <div className="rounded-xl border border-red-900/40 bg-red-950/10 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-headline uppercase tracking-widest text-red-700">Estimated Burn</p>
              <p className="text-2xl font-headline text-red-300 tabular-nums leading-none">{estimatedCals} <span className="text-sm text-red-600">kcal</span></p>
            </div>
            <Flame className="w-7 h-7 text-red-800/60" />
          </div>
        )}
        {bodyWeightKg < 40 && !estimatedCals && (
          <p className="text-[9px] text-zinc-700 text-center">Set your body weight in Athlete Profile to see calorie estimates.</p>
        )}

        {/* Secondary stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-headline uppercase tracking-[0.2em] text-zinc-300 block">Avg BPM</label>
            <input
              type="number" min={0} value={bpm} placeholder="e.g. 145"
              onChange={(e) => setBpm(e.target.value)}
              className="w-full h-10 bg-black border border-zinc-700 rounded-lg px-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-headline uppercase tracking-[0.2em] text-zinc-300">RPE (1–10)</label>
              <RPEInfoPopover />
            </div>
            <input
              type="number" min={1} max={10} value={rpe} placeholder="5"
              onChange={(e) => setRpe(e.target.value)}
              className="w-full h-10 bg-black border border-zinc-700 rounded-lg px-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-headline uppercase tracking-[0.2em] text-zinc-300 block">Distance ({distanceUnit})</label>
            <input
              type="number" min={0} step={0.1} value={distance} placeholder="0"
              onChange={(e) => setDistance(e.target.value)}
              className="w-full h-10 bg-black border border-zinc-700 rounded-lg px-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-headline uppercase tracking-[0.2em] text-zinc-300 block">Calories</label>
            <input
              type="number" min={0}
              value={caloriesOverride}
              placeholder={estimatedCals > 0 ? `${estimatedCals}` : '—'}
              onChange={(e) => setCaloriesOverride(e.target.value)}
              className="w-full h-10 bg-black border border-zinc-700 rounded-lg px-3 text-sm text-red-300 placeholder:text-zinc-600 focus:outline-none focus:border-red-500 font-headline"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-headline uppercase tracking-[0.2em] text-zinc-300 block">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Distance, pace, any notes…"
            rows={2}
            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-700 resize-none focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Exercise info card */}
        {exercise.description && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
            <p className="text-[9px] font-headline uppercase tracking-widest text-zinc-600 mb-1">{exercise.name}</p>
            <p className="text-xs text-zinc-400 leading-snug">{exercise.description}</p>
            {exercise.cues.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {exercise.cues.slice(0, 2).map((cue, i) => (
                  <li key={i} className="text-[9px] text-zinc-600 flex items-start gap-1.5">
                    <span className="text-red-700 flex-shrink-0">›</span>{cue}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Save footer */}
      <div className="px-4 py-4 border-t border-zinc-800 flex-shrink-0 space-y-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-xl border border-red-500 bg-red-600/20 text-red-100 font-headline uppercase tracking-widest text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40 shadow-[0_0_16px_rgba(239,68,68,0.3)]"
        >
          <Flame className="w-4 h-4" />
          {saving ? 'Logging…' : 'Log Session'}
        </button>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-zinc-800 text-zinc-600 text-xs font-headline uppercase tracking-widest active:scale-[0.98] transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
