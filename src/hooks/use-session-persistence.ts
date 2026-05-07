"use client";

/**
 * useSessionPersistence
 *
 * Handles durable draft storage for an active khet workout session.
 *
 * localStorage key convention:
 *   khet_session_draft__{programId}__{dayIndex}
 *
 * One slot per (program, day) pair so navigating between days never
 * clobbers another day's in-progress work. The key is removed only after
 * a successful "Seal" (Firebase write), preventing stale data from
 * pre-populating future sessions.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { ActiveSessionState } from '@/lib/khet-types';

const DEBOUNCE_MS = 600;

/** Builds the storage key for a specific program day. */
export function buildDraftKey(programId: string, dayIndex: number): string {
  return `khet_session_draft__${programId}__${dayIndex}`;
}

/**
 * Attempts to retrieve a persisted draft from localStorage.
 * Returns `null` if nothing is stored or the data is malformed.
 */
export function loadDraft(programId: string, dayIndex: number): ActiveSessionState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(buildDraftKey(programId, dayIndex));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveSessionState;
    // Minimal structural validation — ensure required fields exist
    if (
      !Array.isArray(parsed.exerciseLogs) ||
      typeof parsed.cardioEnabled !== 'boolean' ||
      typeof parsed.absEnabled !== 'boolean' ||
      typeof parsed.startDate !== 'string'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Removes the draft key after a successful seal. */
export function clearDraft(programId: string, dayIndex: number): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(buildDraftKey(programId, dayIndex));
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

interface UseSessionPersistenceOptions {
  programId: string;
  dayIndex: number;
  state: ActiveSessionState;
  /** True once at least one set has been completed (controls dirty flag). */
  anySetCompleted: boolean;
}

/**
 * Debounced localStorage writer. Call this after every state change.
 * Returns a stable `persistNow` callback for flushing synchronously
 * (e.g. before beforeunload fires).
 */
export function useSessionPersistence({
  programId,
  dayIndex,
  state,
  anySetCompleted,
}: UseSessionPersistenceOptions): { persistNow: () => void; isDirty: boolean } {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = anySetCompleted;

  const persistNow = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(buildDraftKey(programId, dayIndex), JSON.stringify(state));
    } catch {
      // localStorage may be full or disabled — fail silently
    }
  }, [programId, dayIndex, state]);

  // Debounced write on every state change
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(persistNow, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, persistNow]);

  return { persistNow, isDirty };
}

// ─────────────────────────────────────────────────────────────
// Generic helpers — used by mobility, core, and cardio sessions
// ─────────────────────────────────────────────────────────────

/**
 * localStorage key convention for domain-specific drafts:
 *   khet_mobility_draft__{programId}__{sessionIndex}
 *   khet_core_draft__{programId}__{sessionIndex}
 *   khet_cardio_draft__{programId}__{sessionIndex}
 */
export function buildMobilityDraftKey(programId: string, sessionIndex: string | number): string {
  return `khet_mobility_draft__${programId}__${sessionIndex}`;
}

export function buildCoreDraftKey(programId: string, sessionIndex: number): string {
  return `khet_core_draft__${programId}__${sessionIndex}`;
}

export function buildCardioDraftKey(programId: string, sessionIndex: number): string {
  return `khet_cardio_draft__${programId}__${sessionIndex}`;
}

/** Load an arbitrary draft from localStorage by key. Returns null on miss or parse failure. */
export function loadRawDraft<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Remove an arbitrary draft from localStorage by key. */
export function clearRawDraft(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

/**
 * Generic debounced localStorage draft hook.
 * Writes `data` to `key` after DEBOUNCE_MS of inactivity.
 * Returns `persistNow` for synchronous flushing (e.g. in beforeunload).
 */
export function useLocalDraft<T>(key: string, data: T): { persistNow: () => void } {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistNow = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // localStorage full or unavailable — fail silently
    }
  }, [key, data]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(persistNow, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [persistNow]);

  return { persistNow };
}
