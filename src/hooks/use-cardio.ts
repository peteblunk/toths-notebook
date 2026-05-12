"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  increment,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import type { CardioProgram, CardioSessionLog, CardioStats } from '@/lib/endurance-types';

function getWeekStr(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

interface UseCardioReturn {
  programs: CardioProgram[];
  loading: boolean;
  addProgram: (data: Omit<CardioProgram, 'id'>) => Promise<string>;
  updateProgram: (id: string, updates: Partial<Omit<CardioProgram, 'id'>>) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;
  logSession: (log: Omit<CardioSessionLog, 'id'>) => Promise<void>;
  undoSession: (programId: string, sessionIndex: number) => Promise<void>;
  getGhostLog: (programId: string, sessionIndex: number) => Promise<CardioSessionLog | null>;
  getCardioStats: () => Promise<CardioStats | null>;
}

export function useCardio(): UseCardioReturn {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<CardioProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPrograms([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'cardioPrograms'), where('userId', '==', user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const progs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CardioProgram));
        progs.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
        setPrograms(progs);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsub();
  }, [user]);

  const addProgram = useCallback(
    async (data: Omit<CardioProgram, 'id'>): Promise<string> => {
      if (!user) throw new Error('Not authenticated');
      const ref = await addDoc(collection(db, 'cardioPrograms'), { ...data, userId: user.uid });
      return ref.id;
    },
    [user],
  );

  const updateProgram = useCallback(
    async (id: string, updates: Partial<Omit<CardioProgram, 'id'>>): Promise<void> => {
      await updateDoc(doc(db, 'cardioPrograms', id), updates as Record<string, unknown>);
    },
    [],
  );

  const deleteProgram = useCallback(async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'cardioPrograms', id));
  }, []);

  const logSession = useCallback(
    async (log: Omit<CardioSessionLog, 'id'>): Promise<void> => {
      if (!user) throw new Error('Not authenticated');

      // Firestore rejects `undefined` values — strip them before writing
      const clean = Object.fromEntries(
        Object.entries({ ...log, userId: user.uid, completedAt: new Date().toISOString() }).filter(([, v]) => v !== undefined),
      );
      await addDoc(collection(db, 'cardioSessions'), clean);

      // Only update the program doc for real program sessions (not quick-log standalone entries)
      if (log.programId !== 'standalone') {
        const weekStr = getWeekStr();
        const program = programs.find((p) => p.id === log.programId);
        const currentWeekLog = program?.weeklyLog;
        const newWeeklyLog =
          currentWeekLog?.weekStr === weekStr
            ? { weekStr, count: currentWeekLog.count + 1 }
            : { weekStr, count: 1 };

        const updates: Record<string, unknown> = {
          lastSessionDate: log.date,
          lastSessionIndex: log.sessionIndex,
          sessionsCompleted: increment(1),
          weeklyLog: newWeeklyLog,
        };
        if (!program?.startDate) updates.startDate = log.date;

        await updateDoc(doc(db, 'cardioPrograms', log.programId), updates);
      }

      // Write lightweight diary entry (non-critical — missing Firestore rule is OK)
      try {
        await addDoc(collection(db, 'cardioDiaryEntries'), {
          userId: user.uid,
          date: log.date,
          programName: log.programName,
          label: log.label,
          exerciseName: log.exerciseName,
          durationMinutes: log.durationMinutes,
          calories: log.calories ?? 0,
          avgBPM: log.avgBPM ?? null,
          rpe: log.rpe ?? null,
          distance: log.distance ?? null,
          distanceUnit: log.distanceUnit ?? null,
          notes: log.notes ?? null,
          sessionIndex: log.sessionIndex,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[useCardio] diary entry skipped (non-critical):', err);
      }
    },
    [user, programs],
  );

  const undoSession = useCallback(
    async (programId: string, sessionIndex: number): Promise<void> => {
      if (!user) throw new Error('Not authenticated');
      const weekStr = getWeekStr();
      const program = programs.find((p) => p.id === programId);
      const q = query(
        collection(db, 'cardioSessions'),
        where('userId', '==', user.uid),
        where('programId', '==', programId),
        where('sessionIndex', '==', sessionIndex),
        where('completed', '==', true),
        orderBy('date', 'desc'),
        limit(1),
      );
      const snap = await getDocs(q);
      if (snap.empty) return;
      await deleteDoc(snap.docs[0].ref);
      const currentCount = program?.weeklyLog?.weekStr === weekStr ? program.weeklyLog.count : 0;
      const updates: Record<string, unknown> = {
        sessionsCompleted: increment(-1),
        lastSessionIndex: Math.max(-1, sessionIndex - 1),
      };
      if (currentCount > 0) {
        updates.weeklyLog = { weekStr, count: Math.max(0, currentCount - 1) };
      }
      await updateDoc(doc(db, 'cardioPrograms', programId), updates);
    },
    [user, programs],
  );

  /** Returns the most recent completed log for this program + session slot (ghost log) */
  const getGhostLog = useCallback(
    async (programId: string, sessionIndex: number): Promise<CardioSessionLog | null> => {
      if (!user) return null;
      try {
        const q = query(
          collection(db, 'cardioSessions'),
          where('userId', '==', user.uid),
          where('programId', '==', programId),
          where('sessionIndex', '==', sessionIndex),
          where('completed', '==', true),
          orderBy('date', 'desc'),
          limit(1),
        );
        const snap = await getDocs(q);
        if (snap.empty) return null;
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as CardioSessionLog;
      } catch {
        return null;
      }
    },
    [user],
  );

  const getCardioStats = useCallback(async (): Promise<CardioStats | null> => {
    if (!user) return null;
    try {
      const snap = await getDocs(
        query(
          collection(db, 'cardioSessions'),
          where('userId', '==', user.uid),
          where('completed', '==', true),
        ),
      );
      if (snap.empty) return null;

      const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CardioSessionLog));
      let totalMinutes = 0;
      let totalCalories = 0;
      let maxCaloriesSession = 0;
      let bestAvgBPM = 0;
      const heatmapMap: Record<string, number> = {};
      const programMap: Record<string, { name: string; count: number }> = {};

      for (const s of sessions) {
        totalMinutes += s.durationMinutes;
        totalCalories += s.calories ?? 0;
        if ((s.calories ?? 0) > maxCaloriesSession) maxCaloriesSession = s.calories ?? 0;
        if ((s.avgBPM ?? 0) > bestAvgBPM) bestAvgBPM = s.avgBPM ?? 0;
        heatmapMap[s.date] = (heatmapMap[s.date] ?? 0) + 1;
        if (!programMap[s.programId]) programMap[s.programId] = { name: s.programName, count: 0 };
        programMap[s.programId].count++;
      }

      const msPerWeek = 7 * 24 * 3600 * 1000;
      const now = new Date();
      let currentStreakWeeks = 0;
      let longestStreakWeeks = 0;
      let runStreak = 0;
      for (let w = 0; w < 100; w++) {
        const weekStart = new Date(now.getTime() - w * msPerWeek);
        const weekEnd = new Date(now.getTime() - (w - 1) * msPerWeek);
        const hit = sessions.some((s) => { const d = new Date(s.date); return d >= weekStart && d <= weekEnd; });
        if (hit) {
          runStreak++;
          if (w === 0 || currentStreakWeeks > 0) currentStreakWeeks = runStreak;
        } else {
          if (runStreak > longestStreakWeeks) longestStreakWeeks = runStreak;
          if (w === 0) currentStreakWeeks = 0;
          runStreak = 0;
        }
      }
      if (runStreak > longestStreakWeeks) longestStreakWeeks = runStreak;

      const heatmap = Array.from({ length: 90 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (89 - i));
        const iso = format(d, 'yyyy-MM-dd');
        return { date: iso, count: heatmapMap[iso] ?? 0 };
      });

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd   = endOfWeek(new Date(),   { weekStartsOn: 1 });
      const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weekDayMap: Record<string, number> = {};
      for (const s of sessions) {
        const ws = format(weekStart, 'yyyy-MM-dd');
        const we = format(weekEnd,   'yyyy-MM-dd');
        if (s.date >= ws && s.date <= we) weekDayMap[s.date] = (weekDayMap[s.date] ?? 0) + 1;
      }
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).map((d, i) => ({
        date: format(d, 'yyyy-MM-dd'),
        label: DAY_LABELS[i],
        sessions: weekDayMap[format(d, 'yyyy-MM-dd')] ?? 0,
      }));

      return {
        totalSessions: sessions.length,
        totalMinutes,
        totalCalories,
        maxCaloriesSession,
        bestAvgBPM,
        currentStreakWeeks,
        longestStreakWeeks,
        heatmap,
        programBreakdown: Object.values(programMap).map((p) => ({ programName: p.name, sessions: p.count })),
        weekDays,
      };
    } catch {
      return null;
    }
  }, [user]);

  return { programs, loading, addProgram, updateProgram, deleteProgram, logSession, undoSession, getGhostLog, getCardioStats };
}
