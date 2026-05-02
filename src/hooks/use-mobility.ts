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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import type { MobilityProgram, MobilitySessionLog, MobilityStats } from '@/lib/mobility-types';
import { format, startOfWeek, parseISO } from 'date-fns';

function getWeekStr(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

interface UseMobilityReturn {
  programs: MobilityProgram[];
  loading: boolean;
  addProgram: (data: Omit<MobilityProgram, 'id'>) => Promise<string>;
  updateProgram: (id: string, updates: Partial<Omit<MobilityProgram, 'id'>>) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;
  logSession: (log: Omit<MobilitySessionLog, 'id'>, programId: string) => Promise<void>;
  getMobilityStats: () => Promise<MobilityStats | null>;
}

export function useMobility(): UseMobilityReturn {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<MobilityProgram[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener for mobility programs
  useEffect(() => {
    if (!user) {
      setPrograms([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'mobilityPrograms'),
      where('userId', '==', user.uid),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const progs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MobilityProgram));
        progs.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
        setPrograms(progs);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsub();
  }, [user]);

  const addProgram = useCallback(
    async (data: Omit<MobilityProgram, 'id'>): Promise<string> => {
      if (!user) throw new Error('Not authenticated');
      const ref = await addDoc(collection(db, 'mobilityPrograms'), {
        ...data,
        userId: user.uid,
      });
      return ref.id;
    },
    [user],
  );

  const updateProgram = useCallback(
    async (id: string, updates: Partial<Omit<MobilityProgram, 'id'>>): Promise<void> => {
      await updateDoc(doc(db, 'mobilityPrograms', id), updates as Record<string, unknown>);
    },
    [],
  );

  const deleteProgram = useCallback(async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'mobilityPrograms', id));
  }, []);

  const logSession = useCallback(
    async (log: Omit<MobilitySessionLog, 'id'>, programId: string): Promise<void> => {
      if (!user) throw new Error('Not authenticated');

      // 1. Save session log
      await addDoc(collection(db, 'mobilitySessions'), { ...log, userId: user.uid });

      // 2. Compute weekly log update
      const weekStr = getWeekStr();
      const program = programs.find((p) => p.id === programId);
      const currentWeekLog = program?.weeklyLog;
      const newWeeklyLog =
        currentWeekLog?.weekStr === weekStr
          ? { weekStr, count: currentWeekLog.count + 1 }
          : { weekStr, count: 1 };

      // 3. Update program stats
      const updates: Record<string, unknown> = {
        lastSessionDate: log.date,
        sessionsCompleted: increment(1),
        weeklyLog: newWeeklyLog,
      };
      if (log.type === 'main') {
        updates.lastSessionIndex = log.sessionIndex;
        if (!program?.startDate) {
          updates.startDate = log.date;
        }
      }

      await updateDoc(doc(db, 'mobilityPrograms', programId), updates);

      // 4. Stamp a completed task tile (non-critical)
      try {
        await addDoc(collection(db, 'tasks'), {
          userId: user.uid,
          title: `${log.programName} — ${log.label}`,
          iv: null,
          isEncrypted: false,
          category: 'Khet',
          importance: 'medium',
          estimatedTime: 0,
          completed: true,
          completedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          dueDate: new Date(),
          isRitual: false,
          originRitualId: null,
          khetProgramId: programId,
          tags: ['Mobility', 'Khet-Station'],
        });
      } catch {
        // Non-critical — don't surface task stamping errors
      }
    },
    [user, programs],
  );

  const getMobilityStats = useCallback(async (): Promise<MobilityStats | null> => {
    if (!user) return null;
    try {
      const snap = await getDocs(
        query(collection(db, 'mobilitySessions'), where('userId', '==', user.uid)),
      );
      const logs = snap.docs.map((d) => d.data() as MobilitySessionLog);
      if (logs.length === 0) return null;

      // 90-day heatmap
      const today = new Date();
      const heatmapMap = new Map<string, number>();
      const heatmapLevelUp = new Map<string, boolean>();
      for (let i = 89; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const ds = format(d, 'yyyy-MM-dd');
        heatmapMap.set(ds, 0);
        heatmapLevelUp.set(ds, false);
      }

      let totalMinutes = 0;
      let levelUpSessions = 0;
      const programMap = new Map<string, number>();
      const weekSet = new Set<string>();

      for (const log of logs) {
        if (heatmapMap.has(log.date)) {
          heatmapMap.set(log.date, (heatmapMap.get(log.date) ?? 0) + 1);
          if (log.levelUpMode) heatmapLevelUp.set(log.date, true);
        }
        totalMinutes += log.durationMinutes ?? 0;
        if (log.levelUpMode) levelUpSessions++;
        programMap.set(log.programName, (programMap.get(log.programName) ?? 0) + 1);
        const wk = format(startOfWeek(parseISO(log.date), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        weekSet.add(wk);
      }

      const heatmap = Array.from(heatmapMap.entries()).map(([date, count]) => ({
        date,
        count,
        hasLevelUp: heatmapLevelUp.get(date) ?? false,
      }));

      // Current streak (consecutive weeks ending at this week)
      let currentStreakWeeks = 0;
      let checkWeek = startOfWeek(today, { weekStartsOn: 1 });
      while (weekSet.has(format(checkWeek, 'yyyy-MM-dd'))) {
        currentStreakWeeks++;
        checkWeek = new Date(checkWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Longest streak
      const sortedWeeks = Array.from(weekSet).sort();
      let longestStreakWeeks = 0;
      let streak = 0;
      let prevMs: number | null = null;
      for (const w of sortedWeeks) {
        const ms = parseISO(w).getTime();
        if (prevMs !== null && ms - prevMs === 7 * 24 * 60 * 60 * 1000) {
          streak++;
        } else {
          streak = 1;
        }
        longestStreakWeeks = Math.max(longestStreakWeeks, streak);
        prevMs = ms;
      }

      const programBreakdown = Array.from(programMap.entries())
        .map(([programName, sessions]) => ({ programName, sessions }))
        .sort((a, b) => b.sessions - a.sessions);

      return { totalSessions: logs.length, levelUpSessions, totalMinutes, currentStreakWeeks, longestStreakWeeks, heatmap, programBreakdown };
    } catch {
      return null;
    }
  }, [user]);

  return { programs, loading, addProgram, updateProgram, deleteProgram, logSession, getMobilityStats };
}
