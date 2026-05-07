"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { format, differenceInCalendarDays } from 'date-fns';

// ─────────────────────────────────────────────────────────────
// 75 HARD MODE — Types
// ─────────────────────────────────────────────────────────────

export type HardMode75 = 'super' | 'easy';

/** Persistent definition — lives on the program, not on a daily log */
export interface CustomObjectiveDefinition {
  id: string;
  label: string;
  /** If true, failing this objective triggers a Day 1 reset in Super Hard mode */
  criticalFailure: boolean;
}

/** Merged view of definition + today's completion state — used by the UI */
export interface CustomObjective extends CustomObjectiveDefinition {
  completed: boolean;
}

export interface DayLog75 {
  date: string;            // YYYY-MM-DD
  indoorWorkout: boolean;
  outdoorWorkout: boolean;
  waterOz: number;         // running daily total (target: 128) — plain water only
  readPages: boolean;      // 10 pages non-fiction physical book
  isPhysicalBook: boolean; // true = physical book (required for Hard Mode strictness)
  pictureTaken: boolean;
  noCheatMeals: boolean;
  soberProtocol: boolean;  // alcohol & substance abstinence — hard requirement for success
  /** id → completed for this specific day */
  customObjectiveResults?: Record<string, boolean>;
  complete: boolean;       // all core tasks done for the day
}

export interface HardMode75Completion {
  date: string;       // YYYY-MM-DD when the 75th day was sealed
  mode: HardMode75;
}

export interface HardMode75Data {
  userId: string;
  active: boolean;
  mode: HardMode75;
  startDate: string | null; // YYYY-MM-DD
  days: Record<string, DayLog75>;
  completions: HardMode75Completion[];
  /** Custom objective definitions — persist for the entire run */
  customObjectives?: CustomObjectiveDefinition[];
}

// ─────────────────────────────────────────────────────────────
// Completion threshold
// ─────────────────────────────────────────────────────────────
export const BADGE_THRESHOLD = 75;

// ─────────────────────────────────────────────────────────────
// Device-local 3am day boundary helpers
// ─────────────────────────────────────────────────────────────

/** Returns YYYY-MM-DD for "today" — day rolls over at 3am local device time */
function get3amToday(): string {
  const now = new Date();
  if (now.getHours() < 3) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return format(d, 'yyyy-MM-dd');
  }
  return format(now, 'yyyy-MM-dd');
}

/** Returns YYYY-MM-DD for "yesterday" using 3am boundary */
function get3amYesterday(): string {
  const now = new Date();
  const d = new Date(now);
  if (now.getHours() < 3) {
    d.setDate(d.getDate() - 2);
  } else {
    d.setDate(d.getDate() - 1);
  }
  return format(d, 'yyyy-MM-dd');
}

// ─────────────────────────────────────────────────────────────
// Easy-mode: count days before today that weren't completed
// ─────────────────────────────────────────────────────────────

function countMissedDays(data: HardMode75Data, today: string): number {
  if (!data.startDate) return 0;
  const startDate = new Date(data.startDate + 'T12:00:00');
  const todayDate = new Date(today + 'T12:00:00');
  const total = differenceInCalendarDays(todayDate, startDate);
  if (total <= 0) return 0;
  let missed = 0;
  for (let i = 0; i < total; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = format(d, 'yyyy-MM-dd');
    if (!data.days[dateStr]?.complete) missed++;
  }
  return missed;
}

const EMPTY_DAY = (date: string): DayLog75 => ({
  date,
  indoorWorkout: false,
  outdoorWorkout: false,
  waterOz: 0,
  readPages: false,
  isPhysicalBook: false,
  pictureTaken: false,
  noCheatMeals: false,
  soberProtocol: false,
  customObjectiveResults: {},
  complete: false,
});

function isDayComplete(day: DayLog75, programObjectives: CustomObjectiveDefinition[]): boolean {
  const criticalCustomFailed = programObjectives.some(
    (o) => o.criticalFailure && !(day.customObjectiveResults?.[o.id] ?? false)
  );
  return (
    day.indoorWorkout &&
    day.outdoorWorkout &&
    day.waterOz >= 128 &&
    day.readPages &&
    day.pictureTaken &&
    day.noCheatMeals &&
    day.soberProtocol &&
    !criticalCustomFailed
  );
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export function use75Hard() {
  const { user } = useAuth();
  const [data, setData] = useState<HardMode75Data | null>(null);
  const [loading, setLoading] = useState(true);
  // Track which date we last ran the Super Hard reset check so it fires once per day
  const resetCheckedRef = useRef<string | null>(null);

  const today = get3amToday();

  // ── Firestore listener ──────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }

    const ref = doc(db, 'hardMode75', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const raw = snap.data() as HardMode75Data;
        // Backwards-compat: default fields if missing
        setData({ ...raw, mode: raw.mode ?? 'super', completions: raw.completions ?? [] });
      } else {
        setData({ userId: user.uid, active: false, mode: 'super', startDate: null, days: {}, completions: [] });
      }
      setLoading(false);
    });

    return unsub;
  }, [user]);

  // ── Super Hard: auto-reset when a day was missed ────────────
  useEffect(() => {
    if (!user || !data || !data.active || data.mode !== 'super' || !data.startDate) return;
    if (resetCheckedRef.current === today) return; // already checked today
    resetCheckedRef.current = today;

    const yesterday = get3amYesterday();
    const startDate = new Date(data.startDate + 'T12:00:00');
    const yesterdayDate = new Date(yesterday + 'T12:00:00');
    const totalPastDays = differenceInCalendarDays(yesterdayDate, startDate) + 1;

    if (totalPastDays <= 0) return; // first day — nothing to check yet

    let needsReset = false;
    for (let i = 0; i < totalPastDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = format(d, 'yyyy-MM-dd');
      if (!data.days[dateStr]?.complete) {
        needsReset = true;
        break;
      }
    }

    if (needsReset) {
      const ref = doc(db, 'hardMode75', user.uid);
      updateDoc(ref, { active: false, startDate: null, days: {} }).catch(console.error);
    }
  }, [data, user, today]);

  // ── Derived values ──────────────────────────────────────────

  const programObjectives: CustomObjectiveDefinition[] = data?.customObjectives ?? [];
  const todayLog: DayLog75 = data?.days[today] ?? EMPTY_DAY(today);

  /** Merged list of definitions + today's completion state — ready for the UI */
  const todayObjectives: CustomObjective[] = programObjectives.map((def) => ({
    ...def,
    completed: todayLog.customObjectiveResults?.[def.id] ?? false,
  }));

  const daysCompleted = data
    ? Object.values(data.days).filter((d) => d.complete).length
    : 0;

  const missedDays =
    data?.active && data.mode === 'easy' && data.startDate
      ? countMissedDays(data, today)
      : 0;

  const effectiveDays = Math.max(0, daysCompleted - missedDays);

  const dayNumber =
    data?.active && data.startDate
      ? differenceInCalendarDays(
          new Date(today + 'T12:00:00'),
          new Date(data.startDate + 'T12:00:00')
        ) + 1
      : 0;

  const completions = data?.completions ?? [];

  // ── Auto-complete: record badge when threshold reached ───────
  useEffect(() => {
    if (!user || !data?.active) return;
    if (effectiveDays < BADGE_THRESHOLD) return;
    // Seal the completion and reset
    const ref = doc(db, 'hardMode75', user.uid);
    const newCompletion: HardMode75Completion = { date: today, mode: data.mode };
    updateDoc(ref, {
      active: false,
      startDate: null,
      days: {},
      completions: [...(data.completions ?? []), newCompletion],
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveDays]);

  // ── Mutations ──────────────────────────────────────────────

  const startProtocol = useCallback(
    async (mode: HardMode75, initialObjectives: CustomObjectiveDefinition[] = []) => {
      if (!user) return;
      const ref = doc(db, 'hardMode75', user.uid);
      // Preserve existing completions (badges) when restarting
      await updateDoc(ref, {
        active: true,
        mode,
        startDate: today,
        days: {},
        customObjectives: initialObjectives,
      }).catch(async () => {
        // Doc doesn't exist yet — create it
        await setDoc(ref, {
          userId: user.uid,
          active: true,
          mode,
          startDate: today,
          days: {},
          completions: [],
          customObjectives: initialObjectives,
        });
      });
    },
    [user, today]
  );

  const stopProtocol = useCallback(async () => {
    if (!user) return;
    const ref = doc(db, 'hardMode75', user.uid);
    await updateDoc(ref, { active: false });
  }, [user]);

  const logItem = useCallback(
    async (
      field: keyof Omit<DayLog75, 'date' | 'waterOz' | 'complete' | 'customObjectiveResults'>,
      value: boolean
    ) => {
      if (!user || !data?.active) return;
      const current: DayLog75 = { ...EMPTY_DAY(today), ...data.days[today] };
      const updated: DayLog75 = { ...current, [field]: value };
      updated.complete = isDayComplete(updated, data.customObjectives ?? []);
      const ref = doc(db, 'hardMode75', user.uid);
      await updateDoc(ref, { [`days.${today}`]: updated });
    },
    [user, data, today]
  );

  const addWater = useCallback(
    async (oz: number) => {
      if (!user || !data?.active) return;
      const current: DayLog75 = { ...EMPTY_DAY(today), ...data.days[today] };
      const newOz = Math.min(current.waterOz + oz, 256);
      const updated: DayLog75 = { ...current, waterOz: newOz };
      updated.complete = isDayComplete(updated, data.customObjectives ?? []);
      const ref = doc(db, 'hardMode75', user.uid);
      await updateDoc(ref, { [`days.${today}`]: updated });
    },
    [user, data, today]
  );

  const resetWater = useCallback(async () => {
    if (!user || !data?.active) return;
    const current: DayLog75 = { ...EMPTY_DAY(today), ...data.days[today] };
    const updated: DayLog75 = { ...current, waterOz: 0 };
    updated.complete = isDayComplete(updated, data.customObjectives ?? []);
    const ref = doc(db, 'hardMode75', user.uid);
    await updateDoc(ref, { [`days.${today}`]: updated });
  }, [user, data, today]);

  // ── Custom objectives mutations ────────────────────────────

  /** Add a new objective definition to the program — persists across all future days */
  const addCustomObjective = useCallback(
    async (label: string, criticalFailure: boolean = false) => {
      if (!user || !data) return;
      const newDef: CustomObjectiveDefinition = {
        id: `obj-${Date.now()}`,
        label: label.trim(),
        criticalFailure,
      };
      const ref = doc(db, 'hardMode75', user.uid);
      await updateDoc(ref, {
        customObjectives: [...(data.customObjectives ?? []), newDef],
      });
    },
    [user, data]
  );

  /** Toggle today's completion result for a specific objective */
  const toggleCustomObjective = useCallback(
    async (id: string, completed: boolean) => {
      if (!user || !data?.active) return;
      const current: DayLog75 = { ...EMPTY_DAY(today), ...data.days[today] };
      const updated: DayLog75 = {
        ...current,
        customObjectiveResults: {
          ...(current.customObjectiveResults ?? {}),
          [id]: completed,
        },
      };
      updated.complete = isDayComplete(updated, data.customObjectives ?? []);
      const ref = doc(db, 'hardMode75', user.uid);
      await updateDoc(ref, { [`days.${today}`]: updated });
    },
    [user, data, today]
  );

  return {
    data,
    loading,
    todayLog,
    todayObjectives,
    programObjectives,
    daysCompleted,
    effectiveDays,
    missedDays,
    dayNumber,
    completions,
    today,
    startProtocol,
    stopProtocol,
    logItem,
    addWater,
    resetWater,
    addCustomObjective,
    toggleCustomObjective,
  };
}
