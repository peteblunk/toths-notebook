"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { X, Zap, Flame, Search, Check, ArrowLeftRight, Play, Pause, RotateCcw, Timer, Plus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCardio } from '@/hooks/use-cardio';
import { useKhet } from '@/hooks/use-khet';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  CARDIO_EXERCISES,
  estimateCaloriesForExercise,
  lbsToKg,
  type CardioExerciseCategory,
  type CardioSegment,
} from '@/lib/endurance-types';
import { loadRawDraft, clearRawDraft, useLocalDraft } from '@/hooks/use-session-persistence';

const QUICK_LOG_DRAFT_KEY = 'khet_quick_cardio_draft';

const CATEGORY_ORDER: CardioExerciseCategory[] = ['Machine', 'Bodyweight', 'Outdoor', 'Water'];

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type SegmentDraft = {
  exerciseId: string;
  exerciseName: string;
  duration: string;
  done: boolean;
  repTally: number;
  roundCount: number;
  roundSize: number;
  /** Contextual meta fields — shown immediately when Done is tapped */
  showMeta: boolean;
  segBpm: string;
  segRpe: number | null;
  segDistance: string;
  /** Actual HIIT work minutes (active seconds only) — used for accurate calorie calc */
  hiitWorkMins?: number;
};

const TALLY_EXERCISE_IDS = new Set([
  'burpees', 'box-jumps', 'kettlebell-swings', 'jump-squats',
  'thrusters', 'medicine-ball-slams', 'mountain-climbers',
]);

type TimerMode = 'stopwatch' | 'hiit';

// ─────────────────────────────────────────────────────────────
// RPE Scale — Clinical 10-point
// ─────────────────────────────────────────────────────────────
const RPE_SCALE = [
  { value: 1,  label: 'Very Light',    desc: 'Very slow stroll' },
  { value: 2,  label: 'Light',         desc: 'Can sing' },
  { value: 3,  label: 'Easy',          desc: 'Full conversation' },
  { value: 4,  label: 'Brisk',         desc: 'Talking is easy' },
  { value: 5,  label: 'Strong',        desc: 'Conversation more difficult' },
  { value: 6,  label: 'Firm',          desc: 'Full sentences with effort' },
  { value: 7,  label: 'Vigorous',      desc: 'Heavy breathing. Choppy sentences' },
  { value: 8,  label: 'Very Hard',     desc: 'Only one or two words' },
  { value: 9,  label: 'Near Maximal',  desc: 'Gasping for air. Talking almost impossible' },
  { value: 10, label: 'Maximal',       desc: 'Absolute 100% effort. Cannot talk at all' },
];

// ─────────────────────────────────────────────────────────────
// RPE Selector — selectable list, fully opaque & touch-friendly
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// RPE Info Modal
// ─────────────────────────────────────────────────────────────
function RPEInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70" onClick={onClose} />
      <div className="fixed left-4 right-4 bottom-6 z-50 rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl p-5 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-base font-headline uppercase tracking-widest text-white">Rate of Perceived Exertion</p>
          <button onClick={onClose} className="p-2 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-200 active:scale-90 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-zinc-300 mb-4 leading-relaxed">
          RPE measures how hard a session <em>feels</em> on a 1–10 scale — no heart-rate monitor needed.
          We use it to <span className="text-red-300">calibrate calorie estimates</span> and track training load over time.
        </p>
        <div className="space-y-1">
          {RPE_SCALE.map(({ value: v, label, desc }) => (
            <div key={v} className="flex items-start gap-3 rounded-lg px-2.5 py-2 bg-zinc-800/40">
              <span className="text-base font-headline tabular-nums w-6 text-center flex-shrink-0 text-zinc-300">{v}</span>
              <div>
                <p className="text-sm font-headline text-zinc-100">{label}</p>
                <p className="text-sm text-zinc-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function RPESelector({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const selected = RPE_SCALE.find((r) => r.value === value);
  return (
    <div className="space-y-1.5">
      {showInfo && <RPEInfoModal onClose={() => setShowInfo(false)} />}
      <div className="flex items-center gap-2">
        <label className="text-sm font-headline uppercase tracking-widest text-zinc-200">RPE (1–10)</label>
        <button
          onClick={() => setShowInfo(true)}
          className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-zinc-500 bg-zinc-700 text-zinc-200 text-xs font-bold leading-none active:scale-90 transition-all flex-shrink-0"
          aria-label="What is RPE?"
        >i</button>
      </div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full h-11 rounded-lg border px-4 text-left flex items-center justify-between transition-all active:scale-[0.98]',
          value !== null
            ? 'border-red-500/60 bg-red-950/20 text-red-200'
            : 'border-zinc-600 bg-zinc-900 text-zinc-400',
        )}
      >
        <span className="text-sm font-headline">
          {value !== null && selected ? `${value} — ${selected.label}` : 'Tap to rate RPE…'}
        </span>
        {value !== null && <Check className="w-4 h-4 text-red-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden divide-y divide-zinc-800">
          {RPE_SCALE.map(({ value: v, label, desc }) => (
            <button
              key={v}
              onClick={() => { onChange(v); setOpen(false); }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 text-left transition-colors active:bg-zinc-700',
                value === v ? 'bg-red-950/40' : '',
              )}
            >
              <span className={cn(
                'text-base font-headline tabular-nums w-6 text-center flex-shrink-0',
                value === v ? 'text-red-300' : 'text-zinc-300',
              )}>{v}</span>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-headline', value === v ? 'text-red-200' : 'text-zinc-100')}>{label}</p>
                <p className="text-sm text-zinc-400">{desc}</p>
              </div>
              {value === v && <Check className="w-4 h-4 text-red-400 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HIIT Info Modal
// ─────────────────────────────────────────────────────────────
function HIITInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70" onClick={onClose} />
      <div className="fixed left-4 right-4 bottom-6 z-50 rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-base font-headline uppercase tracking-widest text-white">HIIT Protocols</p>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-200 active:scale-90 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-blue-700/50 bg-blue-950/20 p-4">
            <p className="text-base font-headline text-blue-300 mb-2">Standard — 30s Active / 60s Rest</p>
            <p className="text-sm text-zinc-200 leading-relaxed">
              Focuses on <strong className="text-blue-200">peak intensity and HR recovery</strong>. The longer rest window
              allows full oxygen debt repayment so each interval can be executed at true maximum effort.
            </p>
          </div>
          <div className="rounded-xl border border-red-600/60 bg-red-950/20 p-4">
            <p className="text-base font-headline text-red-300 mb-2">Savage — 40s Active / 20s Rest</p>
            <p className="text-sm text-zinc-200 leading-relaxed">
              Focuses on <strong className="text-red-200">metabolic density and fatigue management</strong>. Compressed rest
              keeps lactate elevated throughout, training your body to perform under accumulated fatigue.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// HIIT Engine — pause support, audio beeps, custom intervals,
//   reset round / reset session with confirm
// ─────────────────────────────────────────────────────────────
type HIITPhase = 'idle' | 'active' | 'rest' | 'done';

const MAX_HIIT_ROUNDS = 99;

function calcHIITRoundsCustom(durationMinutes: number, activeSec: number, restSec: number): number {
  const raw = Math.floor((durationMinutes * 60) / (activeSec + restSec));
  return Math.min(MAX_HIIT_ROUNDS, Math.max(1, raw));
}

function HIITEngine({
  onActivePhaseComplete,
  onSessionDone,
}: {
  onActivePhaseComplete: () => void;
  onSessionDone: (totalSeconds: number, activeWorkSecs: number) => void;
}) {
  const [showInfo, setShowInfo]                     = useState(false);
  const [durationInput, setDurationInput]           = useState('');
  const [customActive, setCustomActive]             = useState('30');
  const [customRest, setCustomRest]                 = useState('60');
  const [phase, setPhase]                           = useState<HIITPhase>('idle');
  const [running, setRunning]                       = useState(false);
  const [round, setRound]                           = useState(1);
  const [remaining, setRemaining]                   = useState(0);
  const [totalRoundsDisplay, setTotalRoundsDisplay] = useState(0);
  const [confirmReset, setConfirmReset]             = useState(false);

  const phaseEndRef     = useRef<number>(0);
  const pausedRemRef    = useRef<number>(0);
  const roundRef        = useRef<number>(1);
  const totalRoundsRef  = useRef<number>(0);
  const phaseRef        = useRef<HIITPhase>('idle');
  const activeSecRef    = useRef<number>(30);
  const restSecRef      = useRef<number>(60);
  const sessionStartRef = useRef<number>(0);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef     = useRef<AudioContext | null>(null);

  const onActiveRef = useRef(onActivePhaseComplete);
  const onDoneRef   = useRef(onSessionDone);
  useEffect(() => { onActiveRef.current = onActivePhaseComplete; }, [onActivePhaseComplete]);
  useEffect(() => { onDoneRef.current   = onSessionDone;         }, [onSessionDone]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const vibrate = (pattern: number[]) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  };

  const beep = useCallback((freq: number, dur: number, vol = 0.4) => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch { /* silent fail */ }
  }, []);

  // tickRef always holds a fresh closure — interval just calls it
  const tickRef = useRef<() => void>(() => {});
  tickRef.current = () => {
    const rem = Math.max(0, Math.ceil((phaseEndRef.current - Date.now()) / 1000));
    setRemaining(rem);

    // countdown ticks
    if (rem === 3 || rem === 2 || rem === 1) beep(880, 0.1);

    if (rem > 0) return;
    stopInterval();

    if (phaseRef.current === 'active') {
      beep(660, 0.25, 0.5);
      onActiveRef.current();
      vibrate([500]);

      if (roundRef.current >= totalRoundsRef.current) {
        // Final active phase — terminate immediately, skip final rest
        phaseRef.current = 'done';
        setPhase('done');
        setRunning(false);
        beep(1047, 0.3, 0.6);
        setTimeout(() => beep(1319, 0.4, 0.55), 300);
        vibrate([500, 200, 500, 200, 500]);
        const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
        const activeWorkSecs = totalRoundsRef.current * activeSecRef.current;
        onDoneRef.current(elapsed, activeWorkSecs);
      } else {
        phaseRef.current = 'rest';
        setPhase('rest');
        const restDur = restSecRef.current;
        phaseEndRef.current = Date.now() + restDur * 1000;
        setRemaining(restDur);
        intervalRef.current = setInterval(() => tickRef.current(), 250);
      }
    } else if (phaseRef.current === 'rest') {
      beep(1047, 0.2, 0.5);
      vibrate([200, 100, 200]);
      const nextRound = roundRef.current + 1;
      roundRef.current = nextRound;
      setRound(nextRound);
      phaseRef.current = 'active';
      setPhase('active');
      const activeDur = activeSecRef.current;
      phaseEndRef.current = Date.now() + activeDur * 1000;
      setRemaining(activeDur);
      intervalRef.current = setInterval(() => tickRef.current(), 250);
    }
  };

  const resumeTick = useCallback(() => {
    phaseEndRef.current = Date.now() + pausedRemRef.current * 1000;
    intervalRef.current = setInterval(() => tickRef.current(), 250);
  }, []);

  const pauseSession = useCallback(() => {
    pausedRemRef.current = remaining;
    stopInterval();
    setRunning(false);
  }, [remaining, stopInterval]);

  const togglePause = useCallback(() => {
    if (phase === 'done' || phase === 'idle') return;
    if (running) {
      pauseSession();
    } else {
      setRunning(true);
      resumeTick();
    }
  }, [phase, running, pauseSession, resumeTick]);

  const startSession = () => {
    const durationMins = parseFloat(durationInput) || 0;
    const activeSec    = Math.max(5, parseInt(customActive) || 30);
    const restSec      = Math.max(5, parseInt(customRest) || 60);
    if (durationMins <= 0) return;
    const rounds = calcHIITRoundsCustom(durationMins, activeSec, restSec);
    activeSecRef.current   = activeSec;
    restSecRef.current     = restSec;
    totalRoundsRef.current = rounds;
    roundRef.current = 1;
    sessionStartRef.current = Date.now();
    setTotalRoundsDisplay(rounds);
    setRound(1);
    phaseRef.current = 'active';
    setPhase('active');
    setRunning(true);
    phaseEndRef.current = Date.now() + activeSec * 1000;
    setRemaining(activeSec);
    vibrate([200, 100, 200]);
    stopInterval();
    intervalRef.current = setInterval(() => tickRef.current(), 250);
  };

  const resetRound = useCallback(() => {
    if (phaseRef.current === 'idle' || phaseRef.current === 'done') return;
    stopInterval();
    const activeDur = activeSecRef.current;
    phaseRef.current = 'active';
    setPhase('active');
    phaseEndRef.current = Date.now() + activeDur * 1000;
    pausedRemRef.current = activeDur;
    setRemaining(activeDur);
    setRunning(true);
    intervalRef.current = setInterval(() => tickRef.current(), 250);
  }, [stopInterval]);

  const doResetSession = useCallback(() => {
    stopInterval();
    phaseRef.current = 'idle';
    roundRef.current = 1;
    totalRoundsRef.current = 0;
    pausedRemRef.current = 0;
    setPhase('idle');
    setRunning(false);
    setRound(1);
    setRemaining(0);
    setTotalRoundsDisplay(0);
    setConfirmReset(false);
  }, [stopInterval]);

  useEffect(() => () => stopInterval(), [stopInterval]);

  const activeSec      = Math.max(5, parseInt(customActive) || 30);
  const restSec        = Math.max(5, parseInt(customRest) || 60);
  const durationMins   = parseFloat(durationInput) || 0;
  const rawPreview     = durationMins > 0 ? Math.floor((durationMins * 60) / (activeSec + restSec)) : 0;
  const previewRounds  = Math.min(MAX_HIIT_ROUNDS, Math.max(1, rawPreview));

  return (
    <div className="space-y-4">
      {showInfo && <HIITInfoModal onClose={() => setShowInfo(false)} />}

      {/* Reset session confirmation overlay */}
      {confirmReset && (
        <>
          <div className="fixed inset-0 z-40 bg-black/70" onClick={() => setConfirmReset(false)} />
          <div className="fixed left-4 right-4 bottom-6 z-50 rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl p-5">
            <p className="text-base font-headline text-white mb-2">Reset Session to first round?</p>
            <p className="text-sm text-zinc-400 mb-4">This will stop the timer and restart from Round 1.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmReset(false)} className="flex-1 h-12 rounded-xl border border-zinc-600 bg-zinc-800 text-zinc-200 text-sm font-headline uppercase tracking-widest active:scale-[0.97] transition-all">Cancel</button>
              <button onClick={doResetSession} className="flex-1 h-12 rounded-xl border border-red-500 bg-red-600/25 text-red-100 text-sm font-headline uppercase tracking-widest active:scale-[0.97] transition-all">Reset</button>
            </div>
          </div>
        </>
      )}

      {phase === 'idle' && (
        <>
          <div className="flex items-center gap-2">
            <p className="text-sm font-headline uppercase tracking-widest text-zinc-200 flex-1">Protocol</p>
            <button
              onClick={() => setShowInfo(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-200 text-sm font-headline active:scale-90 transition-all"
            >
              <Info className="w-4 h-4 text-cyan-400" /> What&apos;s this?
            </button>
          </div>

          {/* Preset buttons — populate custom interval fields */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setCustomActive('30'); setCustomRest('60'); }}
              className={cn(
                'rounded-xl border p-3.5 text-left transition-all active:scale-[0.97]',
                customActive === '30' && customRest === '60'
                  ? 'border-blue-500/70 bg-blue-950/30'
                  : 'border-zinc-700 bg-zinc-900',
              )}
            >
              <p className={cn('text-sm font-headline', customActive === '30' && customRest === '60' ? 'text-blue-300' : 'text-zinc-200')}>Standard</p>
              <p className="text-sm text-zinc-400 mt-0.5">30s active / 60s rest</p>
            </button>
            <button
              onClick={() => { setCustomActive('40'); setCustomRest('20'); }}
              className={cn(
                'rounded-xl border p-3.5 text-left transition-all active:scale-[0.97]',
                customActive === '40' && customRest === '20'
                  ? 'border-red-500/70 bg-red-950/30'
                  : 'border-zinc-600 bg-zinc-900',
              )}
            >
              <p className={cn('text-sm font-headline', customActive === '40' && customRest === '20' ? 'text-red-300' : 'text-zinc-200')}>Savage</p>
              <p className="text-sm text-zinc-400 mt-0.5">40s active / 20s rest</p>
            </button>
          </div>

          {/* Custom interval inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-headline uppercase tracking-widest text-zinc-200 block">Active (sec)</label>
              <input
                type="number" min={5} value={customActive}
                onChange={(e) => setCustomActive(e.target.value)}
                className="w-full h-11 bg-black border border-zinc-600 rounded-lg px-3 text-sm text-white text-center focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-headline uppercase tracking-widest text-zinc-200 block">Rest (sec)</label>
              <input
                type="number" min={5} value={customRest}
                onChange={(e) => setCustomRest(e.target.value)}
                className="w-full h-11 bg-black border border-zinc-600 rounded-lg px-3 text-sm text-white text-center focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-headline uppercase tracking-widest text-zinc-200 block">Session Duration (min)</label>
            <input
              type="number"
              min={1}
              value={durationInput}
              onChange={(e) => setDurationInput(e.target.value)}
              placeholder="e.g. 20"
              className="w-full h-12 bg-black border border-zinc-600 rounded-xl px-4 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500"
            />
            {previewRounds > 0 && (
              <div className="space-y-1">
                <p className="text-sm text-zinc-300">
                  {'→ '}<span className="text-white font-headline">{previewRounds} rounds</span>
                  <span className="text-zinc-500 ml-2">({activeSec}s / {restSec}s)</span>
                </p>
                {rawPreview > MAX_HIIT_ROUNDS && (
                  <p className="text-sm text-yellow-500">
                    Capped at {MAX_HIIT_ROUNDS} rounds — reduce duration or increase interval length.
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            onClick={startSession}
            disabled={durationMins <= 0}
            className={cn(
              'w-full h-14 rounded-xl border font-headline uppercase tracking-widest text-base flex items-center justify-center gap-2 transition-all active:scale-[0.97]',
              durationMins > 0
                ? 'border-red-500 bg-red-600/25 text-red-100'
                : 'border-zinc-700 bg-zinc-900 text-zinc-500 cursor-not-allowed',
            )}
          >
            <Zap className="w-5 h-5" /> Launch HIIT
          </button>
        </>
      )}

      {phase !== 'idle' && (
        <>
          {/* Tap entire countdown area to pause / resume */}
          <button
            onClick={togglePause}
            disabled={phase === 'done'}
            className={cn(
              'w-full rounded-2xl border-2 p-5 transition-all text-left focus:outline-none',
              phase === 'active' ? 'border-red-600/70 bg-red-950/20 shadow-[0_0_30px_rgba(239,68,68,0.2)] active:bg-red-950/30'
                : phase === 'rest' ? 'border-zinc-600/60 bg-zinc-900/50 active:bg-zinc-900'
                : 'border-green-600/60 bg-green-950/20 cursor-default',
            )}
          >
            <p className={cn(
              'text-sm font-headline uppercase tracking-[0.4em] text-center mb-1',
              phase === 'active' ? 'text-red-400' : phase === 'rest' ? 'text-zinc-300' : 'text-green-400',
            )}>
              {phase === 'active'
                ? (running ? '⚡ Active — Tap to Pause' : '⏸ Paused')
                : phase === 'rest'
                ? (running ? '— Rest — Tap to Pause' : '⏸ Paused')
                : '✓ Session Complete'}
            </p>

            {phase !== 'done' && (
              <p className="text-center text-zinc-200 font-headline mb-1" style={{ fontSize: '1.5rem' }}>
                Round {round} / {totalRoundsDisplay}
              </p>
            )}

            {phase !== 'done' && (
              <div
                className={cn(
                  'text-center font-headline tabular-nums leading-none mb-4',
                  phase === 'active' ? 'text-red-200' : 'text-zinc-200',
                )}
                style={{ fontSize: '5rem' }}
              >
                {fmtTime(remaining)}
              </div>
            )}

            {phase !== 'done' && (
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-none', phase === 'active' ? 'bg-red-500' : 'bg-zinc-400')}
                  style={{
                    width: phase === 'active'
                      ? `${Math.min(100, (1 - remaining / activeSecRef.current) * 100)}%`
                      : `${Math.min(100, (1 - remaining / restSecRef.current) * 100)}%`,
                  }}
                />
              </div>
            )}
          </button>

          {/* Pause / Resume explicit button */}
          {phase !== 'done' && (
            <button
              onClick={togglePause}
              className={cn(
                'w-full h-12 rounded-xl border font-headline uppercase tracking-widest text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-all',
                running
                  ? 'border-zinc-500 bg-zinc-700 text-zinc-100'
                  : 'border-red-500 bg-red-600/25 text-red-100',
              )}
            >
              {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Resume</>}
            </button>
          )}

          {/* Reset Round / Reset Session row */}
          <div className="flex gap-2">
            {phase !== 'done' && (
              <button
                onClick={resetRound}
                className="flex-1 h-10 rounded-xl border border-zinc-600 bg-zinc-800 text-zinc-200 text-sm font-headline uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Round
              </button>
            )}
            <button
              onClick={() => phase === 'done' ? doResetSession() : setConfirmReset(true)}
              className="flex-1 h-10 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 text-sm font-headline uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> {phase === 'done' ? 'New Session' : 'Reset Session'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// QuickTimer — stopwatch with timestamp drift prevention
//   • Full-width card area is the Start/Pause hit box
//   • Done button is persistent once timer has started
//   • Remounts clean on key change (timer reset between exercises)
// ─────────────────────────────────────────────────────────────
function QuickTimer({ onCapture, forceStop }: { onCapture: (minutes: number) => void; forceStop?: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  const startTimeRef     = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);
  const intervalRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stop timer when parent signals Done (e.g. outer Done / Log Manually button pressed)
  useEffect(() => {
    if (forceStop) {
      pausedElapsedRef.current = elapsed;
      setRunning(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceStop]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    startTimeRef.current = Date.now() - pausedElapsedRef.current * 1000;
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 250);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const pause = () => {
    pausedElapsedRef.current = elapsed;
    setRunning(false);
  };

  const handleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    pausedElapsedRef.current = elapsed;
    setRunning(false);
    // Pass 0 when never started so parent can skip auto-fill of duration
    onCapture(elapsed > 0 ? Math.max(0.1, Math.round(elapsed / 6) / 10) : 0);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setElapsed(0);
    pausedElapsedRef.current = 0;
    startTimeRef.current = 0;
  };

  const hasStarted = elapsed > 0 || running;

  return (
    <div className="rounded-2xl border border-red-800/50 bg-red-950/10 overflow-hidden">
      {/* Full-width hit box for Start / Pause */}
      <button
        className="w-full px-4 pt-4 pb-2 text-left focus:outline-none active:bg-red-950/20 transition-colors"
        onClick={() => { if (!running) setRunning(true); else pause(); }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Timer className="w-4 h-4 text-red-400" />
          <span className="text-sm font-headline uppercase tracking-widest text-red-300">Session Timer</span>
          {running      && <span className="ml-auto text-sm text-red-400 font-headline animate-pulse">LIVE</span>}
          {!running && hasStarted  && <span className="ml-auto text-sm text-zinc-300 font-headline">PAUSED</span>}
          {!running && !hasStarted && <span className="ml-auto text-sm text-zinc-400 font-headline">Tap to start</span>}
        </div>
        <div className="text-center font-headline tabular-nums text-red-200 leading-none" style={{ fontSize: '4rem' }}>
          {fmtTime(elapsed)}
        </div>
      </button>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-800 mx-4 rounded-full overflow-hidden mb-3 mt-2">
        <div
          className="h-full rounded-full bg-red-600 transition-none"
          style={{ width: elapsed > 0 ? `${Math.min(100, (elapsed % 3600) / 36)}%` : '0%' }}
        />
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 px-4 pb-4">
        {!running && !hasStarted && (
          <button
            onClick={() => setRunning(true)}
            className="flex-1 h-12 rounded-xl border border-red-500 bg-red-600/25 text-red-100 text-sm font-headline uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
          >
            <Play className="w-4 h-4" /> Start
          </button>
        )}
        {running && (
          <button
            onClick={(e) => { e.stopPropagation(); pause(); }}
            className="flex-1 h-12 rounded-xl border border-zinc-500 bg-zinc-700 text-zinc-100 text-sm font-headline uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
          >
            <Pause className="w-4 h-4" /> Pause
          </button>
        )}
        {!running && hasStarted && (
          <button
            onClick={() => setRunning(true)}
            className="flex-1 h-12 rounded-xl border border-red-600 bg-red-600/20 text-red-200 text-sm font-headline uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
          >
            <Play className="w-4 h-4" /> Resume
          </button>
        )}
        {/* Done — always visible; captures elapsed if running, otherwise 0 */}
        <button
          onClick={handleDone}
          className="flex-1 h-12 rounded-xl border border-red-400 bg-red-500/30 text-white text-sm font-headline uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.97] transition-all shadow-[0_0_12px_rgba(239,68,68,0.25)]"
        >
          <Check className="w-4 h-4" /> Done
        </button>
        {hasStarted && (
          <button
            onClick={handleReset}
            className="w-12 h-12 rounded-xl border border-zinc-600 bg-zinc-700 text-zinc-200 flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {hasStarted && elapsed > 0 && (
        <p className="text-sm text-zinc-400 text-center pb-3 px-4">
          Tap <span className="text-red-300">Done</span> to auto-fill duration&nbsp;
          <span className="text-zinc-200">({Math.max(0.1, Math.round(elapsed / 6) / 10)} min)</span>
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ExercisePicker
// ─────────────────────────────────────────────────────────────
function ExercisePicker({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string, name: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(!selectedId);
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
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-zinc-600 bg-zinc-900 text-sm text-zinc-100 font-headline active:scale-[0.98] active:bg-zinc-800 transition-all"
      >
        <span className={selected ? '' : 'text-zinc-400'}>{selected?.name ?? 'Choose exercise…'}</span>
        <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-400" />
      </button>

      {open && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-800">
            <div className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-1.5">
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search exercises…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto divide-y divide-zinc-800/60">
            {CATEGORY_ORDER.map((cat) => {
              const exercises = filtered.filter((e) => e.category === cat);
              if (exercises.length === 0) return null;
              return (
                <div key={cat}>
                  <p className="text-xs font-headline uppercase tracking-widest text-zinc-400 px-4 py-1.5 bg-zinc-900/50">{cat}</p>
                  {exercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => { onSelect(ex.id, ex.name); setOpen(false); setSearch(''); }}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 text-left active:bg-zinc-800/60 transition-colors',
                        ex.id === selectedId && 'bg-red-950/20',
                      )}
                    >
                      <span className="text-sm text-zinc-200 font-headline">{ex.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-400">MET {ex.metModerate}–{ex.metHigh}</span>
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
// QuickLogCardio — main component
// ─────────────────────────────────────────────────────────────
interface QuickLogCardioProps {
  onClose: () => void;
}

const EMPTY_SEGMENT = (): SegmentDraft => ({
  exerciseId: '',
  exerciseName: '',
  duration: '',
  done: false,
  repTally: 0,
  roundCount: 0,
  roundSize: 10,
  showMeta: false,
  segBpm: '',
  segRpe: null,
  segDistance: '',
  hiitWorkMins: undefined,
});

export function QuickLogCardio({ onClose }: QuickLogCardioProps) {
  const { logSession }                     = useCardio();
  const { getUserSettings, distanceUnit }  = useKhet();
  const { user }                           = useAuth();
  const { toast }                          = useToast();

  // ── Draft hydration from localStorage ──
  const initDraft = loadRawDraft<{ segments: SegmentDraft[]; notes: string; caloriesOverride: string; timerMode: TimerMode }>(QUICK_LOG_DRAFT_KEY);

  const [segments, setSegments]                     = useState<SegmentDraft[]>(initDraft?.segments ?? [EMPTY_SEGMENT()]);
  const [timerMode, setTimerMode]                   = useState<TimerMode>(initDraft?.timerMode ?? 'stopwatch');
  const [notes, setNotes]                           = useState(initDraft?.notes ?? '');
  const [caloriesOverride, setCaloriesOverride]     = useState<string>(initDraft?.caloriesOverride ?? '');
  const [saving, setSaving]                         = useState(false);
  const [errors, setErrors]                         = useState<Record<string, string>>({});
  const [bodyWeightKg, setBodyWeightKg]             = useState(80);

  const durationRef  = useRef<HTMLInputElement>(null);
  const lastTallyRef = useRef<Record<number, number>>({});

  useEffect(() => {
    getUserSettings().then((s) => {
      if (!s?.bodyWeight) return;
      const bw = s.weightUnit === 'lbs' ? lbsToKg(s.bodyWeight) : s.bodyWeight;
      setBodyWeightKg(bw);
    });
  }, [getUserSettings]);

  const handleSegmentTally = useCallback((idx: number) => {
    const now = Date.now();
    if (now - (lastTallyRef.current[idx] ?? 0) < 250) return;
    lastTallyRef.current[idx] = now;
    setSegments((prev) =>
      prev.map((s, i) => i === idx ? { ...s, roundCount: s.roundCount + 1, repTally: s.repTally + s.roundSize } : s),
    );
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(50);
    }
  }, []);

  const handleHIITActivePhaseComplete = useCallback(() => {
    // Auto-increment tally for the first un-done high-volume exercise
    setSegments((prev) => {
      const idx = prev.findIndex((s) => !s.done && TALLY_EXERCISE_IDS.has(s.exerciseId));
      if (idx === -1) return prev;
      return prev.map((s, i) =>
        i === idx ? { ...s, roundCount: s.roundCount + 1, repTally: s.repTally + s.roundSize } : s,
      );
    });
  }, []);

  const handleHIITSessionDone = useCallback((totalSeconds: number, activeWorkSecs: number) => {
    const mins = Math.max(1, Math.round(totalSeconds / 60));
    const workMins = Math.max(0.1, activeWorkSecs / 60);
    setSegments((prev) => {
      const emptyIdx = prev.findIndex((s) => !s.duration);
      if (emptyIdx !== -1) return prev.map((s, i) => i === emptyIdx ? { ...s, duration: String(mins), hiitWorkMins: workMins, showMeta: true } : s);
      return prev.map((s, i) => i === 0 ? { ...s, duration: String(mins), hiitWorkMins: workMins, showMeta: true } : s);
    });
  }, []);

  // Mark done: reveal contextual meta fields without sealing the exercise yet
  const openSegmentMeta = (idx: number) => {
    setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, showMeta: true } : s));
  };

  // Seal as complete (green checkmark) — only called from Complete button inside meta panel
  const completeSegment = (idx: number) => {
    setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, done: true, showMeta: true } : s));
  };

  // Use first segment's RPE for calorie calculation, or default 5
  const rpeForCalc = segments.find((s) => s.segRpe !== null)?.segRpe ?? 5;

  // ── Draft persistence ──────────────────────────────────────────────────────
  const draftData = useMemo(
    () => ({ segments, notes, caloriesOverride, timerMode }),
    [segments, notes, caloriesOverride, timerMode],
  );
  const { persistNow } = useLocalDraft(QUICK_LOG_DRAFT_KEY, draftData);

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      persistNow();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [persistNow]);

  const segmentEstimates = segments.map((seg) => {
    const ex = CARDIO_EXERCISES.find((e) => e.id === seg.exerciseId) ?? CARDIO_EXERCISES[0];
    // Use actual HIIT work minutes if available (active seconds only, not rest)
    // This makes 30s/60s and 40s/20s protocols equally accurate
    const effectiveMins = seg.hiitWorkMins ?? (parseFloat(seg.duration) || 0);
    return effectiveMins > 0 && bodyWeightKg > 0 ? estimateCaloriesForExercise(ex, bodyWeightKg, effectiveMins, rpeForCalc) : 0;
  });

  const totalDurationMins  = segments.reduce((sum, s) => sum + (parseFloat(s.duration) || 0), 0);
  const totalEstimatedCals = segmentEstimates.reduce((a, b) => a + b, 0);
  const effectiveCalories  = caloriesOverride !== '' ? (parseInt(caloriesOverride) || 0) : totalEstimatedCals;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (totalDurationMins <= 0) errs.duration = 'Add a duration to at least one exercise';
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
      const builtSegments: CardioSegment[] = segments
        .map((seg, i) => ({
          exerciseId: seg.exerciseId,
          exerciseName: seg.exerciseName,
          durationMinutes: parseFloat(seg.duration),
          calories: segmentEstimates[i] ?? 0,
        }))
        .filter((s) => s.durationMinutes > 0);

      const tallyNotes = segments
        .filter((s) => s.repTally > 0)
        .map((s) =>
          s.roundCount > 0
            ? `${s.exerciseName}: ${s.roundCount} rounds × ${s.roundSize} = ${s.repTally} reps`
            : `${s.exerciseName}: ${s.repTally} reps`,
        )
        .join(', ');

      const finalNotes      = [notes.trim(), tallyNotes].filter(Boolean).join(' · ');
      const primaryExercise = segments[0];
      const logExerciseName = segments.length > 1
        ? segments.map((s) => s.exerciseName).join(' + ')
        : primaryExercise.exerciseName;

      // Aggregate per-segment meta
      const aggBpm      = segments.find((s) => s.segBpm)?.segBpm;
      const aggRpe      = segments.find((s) => s.segRpe !== null)?.segRpe;
      const aggDistance = segments.find((s) => s.segDistance)?.segDistance;

      await logSession({
        userId: user.uid,
        programId: 'standalone',
        programName: 'Quick Log',
        sessionIndex: 0,
        week: 1,
        label: 'Quick Log',
        date: format(new Date(), 'yyyy-MM-dd'),
        exerciseId: primaryExercise.exerciseId,
        exerciseName: logExerciseName,
        durationMinutes: totalDurationMins,
        distance: parseFloat(aggDistance ?? '') || undefined,
        distanceUnit,
        calories: effectiveCalories || undefined,
        avgBPM: parseInt(aggBpm ?? '') || undefined,
        rpe: aggRpe ?? undefined,
        completed: true,
        notes: finalNotes || undefined,
        segments: builtSegments.length > 0 ? builtSegments : undefined,
      });

      toast({
        title: 'CARDIO LOGGED',
        description: `${logExerciseName} · ${totalDurationMins}m${effectiveCalories ? ` · ~${effectiveCalories} kcal` : ''}`,
      });

      // Non-critical: stamp a completed task tile
      try {
        await addDoc(collection(db, 'tasks'), {
          userId: user.uid,
          title: `Cardio — ${logExerciseName}`,
          iv: null,
          isEncrypted: false,
          category: 'Khet',
          importance: 'medium',
          estimatedTime: totalDurationMins ?? 0,
          completed: true,
          completedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          dueDate: new Date(),
          isRitual: false,
          originRitualId: null,
          khetProgramId: 'standalone',
          tags: ['Cardio', 'Khet-Station'],
        });
      } catch { /* Non-critical */ }

      clearRawDraft(QUICK_LOG_DRAFT_KEY);
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
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-red-900/40 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-red-400" />
          <div>
            <h2 className="font-headline text-red-300 text-base uppercase tracking-widest leading-none">Log Cardio</h2>
            <p className="text-sm text-zinc-300 mt-0.5">Standalone session</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 active:scale-90 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* ── Exercise Cards ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-headline uppercase tracking-widest text-zinc-200">Exercises</label>
            {errors.duration && (
              <span className="text-sm text-red-400 font-headline">{errors.duration}</span>
            )}
          </div>

          {segments.map((seg, idx) => {
            const segCals = segmentEstimates[idx] ?? 0;

            if (seg.done) {
              return (
                <div key={idx} className="space-y-3">
                  {/* Done chip — green sealed state */}
                  <div className="rounded-xl border border-green-700/60 bg-green-950/15 px-3 py-3 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border border-green-500/60 bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-headline text-green-300 leading-none">{seg.exerciseName}</p>
                      <p className="text-sm text-green-600 mt-0.5">
                        {seg.duration} min
                        {segCals > 0 ? ` · ~${segCals} kcal` : ''}
                        {seg.roundCount > 0 ? ` · ${seg.roundCount} rounds` : ''}
                        {seg.repTally > 0 ? ` · ${seg.repTally} reps` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, done: false, showMeta: true } : s))}
                      className="text-sm text-zinc-300 font-headline active:text-zinc-100 flex-shrink-0 px-2.5 py-1.5 rounded border border-zinc-600 bg-zinc-800 transition-colors"
                    >
                      Undo
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={idx} className="rounded-xl border border-blue-900/50 bg-blue-950/10 p-3 space-y-2.5">
                {/* Exercise name always on top */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-headline text-zinc-400 w-5 flex-shrink-0 text-center">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <ExercisePicker
                      selectedId={seg.exerciseId}
                      onSelect={(id, name) =>
                        setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, exerciseId: id, exerciseName: name } : s))
                      }
                    />
                  </div>
                </div>

                {/* Stopwatch / HIIT toggle — inline below exercise name */}
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl border border-blue-900/50 bg-blue-950/20">
                  {(['stopwatch', 'hiit'] as TimerMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTimerMode(mode)}
                      className={cn(
                        'h-9 rounded-lg text-sm font-headline uppercase tracking-widest transition-all active:scale-[0.97]',
                        timerMode === mode
                          ? 'bg-red-600/30 border border-red-500/60 text-red-200'
                          : 'text-zinc-400',
                      )}
                    >
                      {mode === 'stopwatch' ? 'Stopwatch' : 'HIIT'}
                    </button>
                  ))}
                </div>

                {/* Per-exercise stopwatch timer (stopwatch mode only) */}
                {timerMode === 'stopwatch' && (
                  <QuickTimer
                    forceStop={seg.showMeta}
                    onCapture={(mins) => {
                      setSegments((prev) =>
                        prev.map((s, i) => i === idx ? { ...s, ...(mins > 0 ? { duration: String(mins) } : {}), showMeta: true } : s)
                      );
                    }}
                  />
                )}

                {/* HIIT Engine — shown inside every exercise card in HIIT mode */}
                {timerMode === 'hiit' && (
                  <HIITEngine
                    onActivePhaseComplete={() => {
                      if (TALLY_EXERCISE_IDS.has(seg.exerciseId)) {
                        setSegments((prev) => prev.map((s, i) =>
                          i === idx ? { ...s, roundCount: s.roundCount + 1, repTally: s.repTally + s.roundSize } : s,
                        ));
                      }
                    }}
                    onSessionDone={(totalSeconds, activeWorkSecs) => {
                      const mins = Math.max(1, Math.round(totalSeconds / 60));
                      const workMins = Math.max(0.1, activeWorkSecs / 60);
                      setSegments((prev) => prev.map((s, i) =>
                        i === idx ? {
                          ...s,
                          duration: String((parseFloat(s.duration) || 0) + mins),
                          hiitWorkMins: (s.hiitWorkMins || 0) + workMins,
                          showMeta: true,
                        } : s,
                      ));
                    }}
                  />
                )}

                {/* Duration row: narrow input + static "min" + calorie badge */}
                <div className="flex items-center gap-2">
                  <input
                    ref={idx === 0 ? durationRef : undefined}
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={seg.duration}
                    placeholder="0.0"
                    onChange={(e) => {
                      setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, duration: e.target.value } : s));
                      setErrors((p) => ({ ...p, duration: '' }));
                    }}
                    className={cn(
                      'w-20 h-11 bg-black border rounded-lg px-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none transition-all text-center',
                      errors.duration && !seg.duration
                        ? 'border-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]'
                        : 'border-zinc-600 focus:border-red-500',
                    )}
                  />
                  <span className="text-sm font-headline text-zinc-400 flex-shrink-0">min</span>
                  {segCals > 0 && (
                    <div className="flex-shrink-0 rounded-lg border border-red-800/50 bg-red-950/20 px-2.5 py-1.5 text-center">
                      <p className="text-sm font-headline text-red-300 tabular-nums leading-none">~{segCals}</p>
                      <p className="text-sm text-red-500">kcal</p>
                    </div>
                  )}
                </div>

                {/* Delete + Done + Log Manually row */}
                <div className="flex items-center gap-2">
                  {segments.length > 1 && (
                    <button
                      onClick={() => setSegments((prev) => prev.filter((_, i) => i !== idx))}
                      className="w-12 h-12 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-300 flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {timerMode === 'hiit' && (
                    <button
                      onClick={() => openSegmentMeta(idx)}
                      className="flex-1 h-12 rounded-lg border border-blue-600/60 bg-blue-950/30 text-blue-100 font-headline uppercase tracking-widest text-sm flex items-center justify-center gap-2 active:scale-[0.98] active:bg-blue-950/50 transition-all"
                    >
                      <Check className="w-4 h-4 text-blue-400" /> Done
                    </button>
                  )}
                  {timerMode === 'stopwatch' && (
                    <button
                      onClick={() => openSegmentMeta(idx)}
                      className="flex-1 h-12 rounded-lg border border-blue-800/50 bg-blue-950/20 text-blue-400 text-sm font-headline uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all"
                    >
                      Log Manually
                    </button>
                  )}
                </div>

                {/* ── Session Data panel — shown when showMeta is open, before Complete is tapped ── */}
                {seg.showMeta && (
                  <div className="rounded-xl border border-blue-700/50 bg-blue-950/10 p-4 space-y-4 border-l-4 border-l-blue-600/60">
                    <div>
                      <p className="text-sm font-headline uppercase tracking-widest text-blue-300">Session Data</p>
                      <p className="text-xs font-headline uppercase tracking-widest text-zinc-400 mt-0.5">{seg.exerciseName || 'Exercise'}</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-headline uppercase tracking-widest text-zinc-300 block">Duration</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number" min={0.1} step={0.1} value={seg.duration} placeholder="0.0"
                          onChange={(e) => {
                            setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, duration: e.target.value } : s));
                            setErrors((p) => ({ ...p, duration: '' }));
                          }}
                          className="w-20 h-11 bg-black border border-zinc-600 rounded-lg px-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 text-center"
                        />
                        <span className="text-sm font-headline text-zinc-400">min</span>
                        {segCals > 0 && (
                          <span className="text-sm font-headline text-red-300 border border-red-800/50 bg-red-950/20 px-2 py-1 rounded-lg">~{segCals} kcal</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-end gap-3 flex-wrap">
                      <div className="space-y-1.5">
                        <label className="text-sm font-headline uppercase tracking-widest text-zinc-300 block">Avg BPM</label>
                        <input
                          type="number" min={0} value={seg.segBpm} placeholder="145"
                          onChange={(e) => setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, segBpm: e.target.value } : s))}
                          className="w-24 h-11 bg-black border border-zinc-600 rounded-lg px-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500 text-center"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-headline uppercase tracking-widest text-zinc-300 block">Distance</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number" min={0} step={0.1} value={seg.segDistance} placeholder="0"
                            onChange={(e) => setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, segDistance: e.target.value } : s))}
                            className="w-24 h-11 bg-black border border-zinc-600 rounded-lg px-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500 text-center"
                          />
                          <span className="text-sm font-headline text-zinc-400">{distanceUnit}</span>
                        </div>
                      </div>
                    </div>
                    <RPESelector
                      value={seg.segRpe}
                      onChange={(v) => setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, segRpe: v } : s))}
                    />
                    <button
                      onClick={() => completeSegment(idx)}
                      className="w-full h-14 rounded-xl border border-green-500 bg-green-600/25 text-green-100 font-headline uppercase tracking-widest text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_0_14px_rgba(34,197,94,0.2)]"
                    >
                      <Check className="w-5 h-5" /> Complete
                    </button>
                    <button
                      onClick={() => setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, showMeta: false } : s))}
                      className="w-full py-2 text-sm text-zinc-500 font-headline uppercase tracking-widest active:text-zinc-300 transition-colors text-center"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* ── Tally Mode (auto-shown for high-volume rep exercises) ── */}
                {TALLY_EXERCISE_IDS.has(seg.exerciseId) && (
                  <div className="rounded-xl border border-red-900/50 bg-red-950/10 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-headline uppercase tracking-widest text-red-400">Round Counter</p>
                      {(seg.roundCount > 0 || seg.repTally > 0) && (
                        <button
                          onClick={() => setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, roundCount: 0, repTally: 0 } : s))}
                          className="text-sm text-zinc-300 font-headline uppercase tracking-wider active:text-zinc-100 px-2 py-1 rounded border border-zinc-600 bg-zinc-800 transition-colors"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-sm font-headline uppercase tracking-wider text-zinc-300 block">Reps / round</span>
                      <div className="flex items-center gap-2">
                        {[5, 10, 15].map((size) => (
                          <button
                            key={size}
                            onClick={() => setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, roundSize: size } : s))}
                            className={cn(
                              'h-10 px-4 rounded-lg border text-sm font-headline transition-all active:scale-95',
                              seg.roundSize === size
                                ? 'border-red-500 bg-red-950/40 text-red-200'
                                : 'border-zinc-600 bg-zinc-800 text-zinc-200',
                            )}
                          >
                            {size}
                          </button>
                        ))}
                        <input
                          type="number"
                          min={1}
                          maxLength={2}
                          value={![5, 10, 15].includes(seg.roundSize) ? seg.roundSize : ''}
                          placeholder="—"
                          onChange={(e) => {
                            const v = parseInt(e.target.value);
                            if (!isNaN(v) && v > 0) setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, roundSize: v } : s));
                          }}
                          className="w-12 flex-shrink-0 h-10 bg-black border border-zinc-600 rounded-lg px-1 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500 text-center"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSegments((prev) => prev.map((s, i) =>
                            i === idx && s.roundCount > 0
                              ? { ...s, roundCount: s.roundCount - 1, repTally: Math.max(0, s.repTally - s.roundSize) }
                              : s,
                          ))}
                          className="w-12 h-12 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-200 text-2xl font-headline flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
                        >−</button>
                        <div className="flex-1 text-center">
                          <p className="text-4xl font-headline text-red-200 tabular-nums leading-none">{seg.roundCount}</p>
                          <p className="text-sm text-zinc-400 uppercase tracking-widest mt-1">Rounds</p>
                        </div>
                        <button
                          onClick={() => setSegments((prev) => prev.map((s, i) =>
                            i === idx ? { ...s, roundCount: s.roundCount + 1, repTally: s.repTally + s.roundSize } : s,
                          ))}
                          className="w-12 h-12 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-200 text-2xl font-headline flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
                        >+</button>
                      </div>
                      <button
                        onClick={() => handleSegmentTally(idx)}
                        className="w-full h-14 rounded-lg border border-red-600 bg-red-700/30 text-red-100 text-base font-headline uppercase tracking-widest flex items-center justify-center active:scale-[0.97] transition-all"
                      >
                        Manual Tally
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-0.5 border-t border-red-900/30">
                      <p className="text-sm font-headline uppercase tracking-widest text-zinc-400">
                        Total Reps
                        {seg.roundCount > 0 && (
                          <span className="text-zinc-500 ml-1">({seg.roundCount} × {seg.roundSize})</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, repTally: Math.max(0, s.repTally - 1) } : s))}
                          className="w-8 h-8 rounded border border-zinc-600 bg-zinc-800 text-zinc-300 text-sm font-headline flex items-center justify-center active:scale-90 transition-all"
                        >−</button>
                        <span className="text-lg font-headline text-red-300 tabular-nums w-10 text-center">{seg.repTally}</span>
                        <button
                          onClick={() => setSegments((prev) => prev.map((s, i) => i === idx ? { ...s, repTally: s.repTally + 1 } : s))}
                          className="w-8 h-8 rounded border border-zinc-600 bg-zinc-800 text-zinc-300 text-sm font-headline flex items-center justify-center active:scale-90 transition-all"
                        >+</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={() => setSegments((prev) => [...prev, EMPTY_SEGMENT()])}
            className="w-full py-3 rounded-xl border border-dashed border-blue-800/60 text-blue-400 text-sm font-headline uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Exercise
          </button>
        </div>

        {/* ── Live calorie estimate ── */}
        {totalEstimatedCals > 0 && (
          <div className="rounded-xl border border-red-900/40 bg-red-950/10 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-headline uppercase tracking-widest text-red-400">
                {segments.length > 1 ? 'Total Estimated Burn' : 'Estimated Burn'}
              </p>
              <p className="text-2xl font-headline text-red-300 tabular-nums leading-none">
                {totalEstimatedCals} <span className="text-sm text-red-500">kcal</span>
              </p>
            </div>
            <Flame className="w-7 h-7 text-red-700/60" />
          </div>
        )}
        {bodyWeightKg < 40 && !totalEstimatedCals && (
          <p className="text-sm text-zinc-400 text-center">
            Set your body weight in Athlete Profile to see calorie estimates.
          </p>
        )}

        {/* ── Calories override + Notes ── */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-headline uppercase tracking-widest text-zinc-200 block">
              Calories Override{' '}
              {totalEstimatedCals > 0 && (
                <span className="text-zinc-400 normal-case font-sans text-sm">(estimated: {totalEstimatedCals})</span>
              )}
            </label>
            <input
              type="number" min={0}
              value={caloriesOverride}
              placeholder={totalEstimatedCals > 0 ? `${totalEstimatedCals}` : '—'}
              onChange={(e) => setCaloriesOverride(e.target.value)}
              className="w-full h-11 bg-black border border-zinc-600 rounded-lg px-3 text-sm text-red-300 placeholder:text-zinc-500 focus:outline-none focus:border-red-500 font-headline"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-headline uppercase tracking-widest text-zinc-200 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it feel? Distance, pace, any notes…"
              rows={2}
              className="w-full bg-black border border-zinc-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 resize-none focus:outline-none focus:border-red-500"
            />
          </div>
        </div>
      </div>

      {/* ── Save footer ── */}
      <div className="px-4 py-4 border-t border-zinc-800 flex-shrink-0 space-y-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-xl border border-red-500 bg-red-600/25 text-red-100 font-headline uppercase tracking-widest text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40 shadow-[0_0_16px_rgba(239,68,68,0.3)]"
        >
          <Flame className="w-5 h-5" />
          {saving ? 'Logging…' : 'Log Session'}
        </button>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl border border-zinc-600 bg-zinc-800 text-zinc-200 text-sm font-headline uppercase tracking-widest active:scale-[0.98] transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
