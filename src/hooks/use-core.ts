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
import type { CoreProgram, CoreSessionLog, CoreStats } from '@/lib/core-types';
import { format, startOfWeek, parseISO, startOfDay, addDays } from 'date-fns';

function getWeekStr(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

interface UseCoreReturn {
  programs: CoreProgram[];
  loading: boolean;
  addProgram: (data: Omit<CoreProgram, 'id'>) => Promise<string>;
  updateProgram: (id: string, updates: Partial<Omit<CoreProgram, 'id'>>) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;
  logSession: (log: Omit<CoreSessionLog, 'id'>, programId: string) => Promise<void>;
  getCoreStats: () => Promise<CoreStats | null>;
}

export function useCore(): UseCoreReturn {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<CoreProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPrograms([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'corePrograms'),
      where('userId', '==', user.uid),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const progs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CoreProgram));
        progs.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
        setPrograms(progs);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsub();
  }, [user]);

  const addProgram = useCallback(
    async (data: Omit<CoreProgram, 'id'>): Promise<string> => {
      if (!user) throw new Error('Not authenticated');
      const ref = await addDoc(collection(db, 'corePrograms'), {
        ...data,
        userId: user.uid,
      });
      return ref.id;
    },
    [user],
  );

  const updateProgram = useCallback(
    async (id: string, updates: Partial<Omit<CoreProgram, 'id'>>): Promise<void> => {
      await updateDoc(doc(db, 'corePrograms', id), updates as Record<string, unknown>);
    },
    [],
  );

  const deleteProgram = useCallback(async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'corePrograms', id));
  }, []);

  const logSession = useCallback(
    async (log: Omit<CoreSessionLog, 'id'>, programId: string): Promise<void> => {
      if (!user) throw new Error('Not authenticated');

      // 1. Save session log
      await addDoc(collection(db, 'coreSessions'), { ...log, userId: user.uid });

      // 2. Weekly log update
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
        lastSessionIndex: log.sessionIndex,
        sessionsCompleted: increment(1),
        weeklyLog: newWeeklyLog,
      };

      if (!program?.startDate) {
        updates.startDate = log.date;
      }

      await updateDoc(doc(db, 'corePrograms', programId), updates);

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
          tags: ['Core', 'Khet-Station'],
        });
      } catch {
        // Non-critical — don't surface task stamping errors
      }
    },
    [user, programs],
  );

  const getCoreStats = useCallback(async (): Promise<CoreStats | null> => {
    if (!user) return null;

    const snap = await getDocs(
      query(collection(db, 'coreSessions'), where('userId', '==', user.uid)),
    );

    if (snap.empty) return null;

    const logs = snap.docs.map((d) => d.data() as CoreSessionLog);
    logs.sort((a, b) => a.date.localeCompare(b.date));

    const totalSessions = logs.length;
    const totalMinutes = logs.reduce((acc, l) => acc + (l.durationMinutes ?? 0), 0);

    // Streak calculation
    const sessionDates = new Set(logs.map((l) => l.date));
    let currentStreakWeeks = 0;
    let longestStreakWeeks = 0;
    let streak = 0;

    const today = new Date();
    for (let w = 0; w < 52; w++) {
      const weekStart = startOfWeek(addDays(today, -w * 7), { weekStartsOn: 1 });
      const weekDates = Array.from({ length: 7 }, (_, i) =>
        format(addDays(weekStart, i), 'yyyy-MM-dd'),
      );
      const hasSession = weekDates.some((d) => sessionDates.has(d));
      if (hasSession) {
        streak++;
        longestStreakWeeks = Math.max(longestStreakWeeks, streak);
        if (w === 0 || streak > 0) currentStreakWeeks = streak;
      } else {
        if (w > 0) break;
        streak = 0;
        currentStreakWeeks = 0;
      }
    }

    // Heatmap (last 90 days)
    const heatmap: { date: string; count: number }[] = [];
    for (let i = 89; i >= 0; i--) {
      const d = format(addDays(today, -i), 'yyyy-MM-dd');
      heatmap.push({ date: d, count: logs.filter((l) => l.date === d).length });
    }

    // Program breakdown
    const progMap: Record<string, number> = {};
    for (const l of logs) {
      progMap[l.programName] = (progMap[l.programName] ?? 0) + 1;
    }
    const programBreakdown = Object.entries(progMap).map(([programName, sessions]) => ({
      programName,
      sessions,
    }));

    return { totalSessions, totalMinutes, currentStreakWeeks, longestStreakWeeks, heatmap, programBreakdown };
  }, [user]);

  return { programs, loading, addProgram, updateProgram, deleteProgram, logSession, getCoreStats };
}
