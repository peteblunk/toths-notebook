"use client";

import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type {
  ActiveSessionState,
  SessionAction,
  ExerciseLog,
  SetLog,
  WorkoutProgram,
  CardioLog,
  ProgramExercise,
  WorkoutSession,
} from '@/lib/khet-types';
import { loadDraft } from '@/hooks/use-session-persistence';

// ─────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────

const BLANK_SET: SetLog = { weight: 0, reps: 0, completed: false };

/**
 * Builds the initial set list for an exercise, seeding weights from the
 * most recent ghost session. Reps are left blank for the user to fill in.
 */
function buildInitialSets(
  exerciseId: string,
  setCount: number,
  ghostSessions: WorkoutSession[],
): SetLog[] {
  const mostRecent = ghostSessions[0];
  const prevLog = mostRecent?.exerciseLogs.find((e) => e.exerciseId === exerciseId);
  const prevCompleted = prevLog?.sets.filter((s) => s.completed) ?? [];

  return Array.from({ length: setCount }, (_, i) => ({
    // Use the matching set's weight if available, else fall back to the last completed set
    weight: prevCompleted[i]?.weight ?? prevCompleted[prevCompleted.length - 1]?.weight ?? 0,
    reps: 0,      // user fills in actual reps
    completed: false,
  }));
}

function sessionReducer(
  state: ActiveSessionState,
  action: SessionAction,
): ActiveSessionState {
  switch (action.type) {
    case 'UPDATE_SET': {
      const logs = [...state.exerciseLogs];
      const sets = [...logs[action.exerciseIdx].sets];
      sets[action.setIdx] = { ...sets[action.setIdx], ...action.updates };
      logs[action.exerciseIdx] = { ...logs[action.exerciseIdx], sets };
      return { ...state, exerciseLogs: logs };
    }
    case 'ADD_SET': {
      const logs = [...state.exerciseLogs];
      const existingSets = logs[action.exerciseIdx].sets;
      const lastSet = existingSets[existingSets.length - 1];
      // Inherit the last set's weight so the user only needs to adjust if needed
      const newSet: SetLog = { weight: lastSet?.weight ?? 0, reps: 0, completed: false };
      logs[action.exerciseIdx] = { ...logs[action.exerciseIdx], sets: [...existingSets, newSet] };
      return { ...state, exerciseLogs: logs };
    }
    case 'REMOVE_SET': {
      const logs = [...state.exerciseLogs];
      const sets = logs[action.exerciseIdx].sets;
      if (sets.length <= 1) return state;
      logs[action.exerciseIdx] = {
        ...logs[action.exerciseIdx],
        sets: sets.slice(0, -1),
      };
      return { ...state, exerciseLogs: logs };
    }
    case 'SWAP_EXERCISE': {
      const logs = [...state.exerciseLogs];
      const current = logs[action.exerciseIdx];
      logs[action.exerciseIdx] = {
        ...current,
        exerciseId: action.newExercise.exerciseId,
        name: action.newExercise.name,
        // Preserve original exercise identity so ghost log still shows prior history
        originalExerciseId: current.originalExerciseId ?? current.exerciseId,
        originalName: current.originalName ?? current.name,
        // Preserve existing sets count structure, reset weights/reps
        sets: current.sets.map(() => ({ ...BLANK_SET })),
      };
      return { ...state, exerciseLogs: logs };
    }
    case 'SET_NOTES':
      return { ...state, notes: action.notes };
    case 'SET_EXERCISE_NOTES': {
      const logs = [...state.exerciseLogs];
      logs[action.exerciseIdx] = { ...logs[action.exerciseIdx], notes: action.notes };
      return { ...state, exerciseLogs: logs };
    }
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────
// Context type
// ─────────────────────────────────────────────────────────────

interface KhetSessionContextValue {
  state: ActiveSessionState;
  dispatch: React.Dispatch<SessionAction>;
  program: WorkoutProgram;
  dayIndex: number;
  totalVolume: number;
  anySetCompleted: boolean;
}

const KhetSessionContext = createContext<KhetSessionContextValue | null>(null);

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

interface KhetSessionProviderProps {
  program: WorkoutProgram;
  dayIndex: number;
  ghostSessions: WorkoutSession[];
  children: React.ReactNode;
}

export function KhetSessionProvider({
  program,
  dayIndex,
  ghostSessions,
  children,
}: KhetSessionProviderProps) {
  const day = program.days[dayIndex];

  const freshState: ActiveSessionState = {
    exerciseLogs: day.exercises.map((ex: ProgramExercise): ExerciseLog => ({
      exerciseId: ex.exerciseId,
      name: ex.name,
      sets: buildInitialSets(ex.exerciseId, ex.sets, ghostSessions),
      notes: '',
    })),
    notes: '',
    startDate: new Date().toISOString(),  // full timestamp, used to compute session duration
  };

  // Hydrate from a persisted draft if one exists for this (program, day) pair.
  // The draft takes precedence over the ghost-seeded fresh state so in-progress
  // work is never lost on reload.
  const initialState = loadDraft(program.id, dayIndex) ?? freshState;

  const [state, dispatch] = useReducer(sessionReducer, initialState);

  const totalVolume = useMemo(() => {
    return state.exerciseLogs.reduce((total, exLog) => {
      return (
        total +
        exLog.sets.reduce((setTotal, s) => {
          return s.completed ? setTotal + s.weight * s.reps : setTotal;
        }, 0)
      );
    }, 0);
  }, [state.exerciseLogs]);

  const anySetCompleted = useMemo(() => {
    return state.exerciseLogs.some((exLog) =>
      exLog.sets.some((s) => s.completed),
    );
  }, [state.exerciseLogs]);

  return (
    <KhetSessionContext.Provider
      value={{ state, dispatch, program, dayIndex, totalVolume, anySetCompleted }}
    >
      {children}
    </KhetSessionContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export function useKhetSession(): KhetSessionContextValue {
  const ctx = useContext(KhetSessionContext);
  if (!ctx) throw new Error('useKhetSession must be used within KhetSessionProvider');
  return ctx;
}
