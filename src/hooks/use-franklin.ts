"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { encryptData, decryptData, bufferToBase64, base64ToBuffer } from "@/lib/crypto";
import { localDateStr } from "@/lib/utils";
import { startOfWeek, differenceInCalendarWeeks, parseISO, format, subWeeks } from "date-fns";
import type {
  FranklinSettings,
  FranklinVirtue,
  FranklinWeekRecord,
  FranklinNote,
  FranklinAuditRecord,
} from "@/lib/franklin-types";
import { DEFAULT_VIRTUES } from "@/lib/franklin-types";

// ─────────────────────────────────────────────────────────────
// Week utilities
// ─────────────────────────────────────────────────────────────

/** Returns YYYY-MM-DD of the Monday of the given date's week. */
export function getWeekKey(date: Date = new Date()): string {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return format(monday, "yyyy-MM-dd");
}

/**
 * Returns the 0-based index into the virtues array for the current week,
 * based on weeks elapsed since cycleStartDate.
 */
export function getCurrentVirtueIndex(
  virtues: FranklinVirtue[],
  cycleStartDate: string
): number {
  if (!cycleStartDate || virtues.length === 0) return 0;
  try {
    const cycleStart = parseISO(cycleStartDate);
    const today = new Date();
    const weeksSince = differenceInCalendarWeeks(today, cycleStart, {
      weekStartsOn: 1,
    });
    return Math.max(0, weeksSince) % virtues.length;
  } catch {
    return 0;
  }
}

const DEFAULT_SETTINGS: Omit<FranklinSettings, "userId"> = {
  virtues: DEFAULT_VIRTUES,
  franklinActive: false,
  cycleStartDate: getWeekKey(),
  auditWindowHour: 22,
  auditWindowMinute: 0,
  lastSealedWeekKey: null,
  manualAuditWeekKey: null,
};

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export function useFranklin() {
  const { user, masterKey } = useAuth();
  const [settings, setSettings] = useState<FranklinSettings | null>(null);
  const [weekRecord, setWeekRecord] = useState<FranklinWeekRecord | null>(null);
  const [notes, setNotes] = useState<FranklinNote[]>([]);
  const [allWeekRecords, setAllWeekRecords] = useState<FranklinWeekRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditWeekRecord, setAuditWeekRecord] = useState<FranklinWeekRecord | null>(null);
  const [latestAuditForCurrentVirtue, setLatestAuditForCurrentVirtue] = useState<FranklinAuditRecord | null>(null);

  // ── Settings listener ──────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    const docRef = doc(db, "franklinSettings", user.uid);
    const unsub = onSnapshot(
      docRef,
      async (snap) => {
        if (snap.exists()) {
          setSettings(snap.data() as FranklinSettings);
        } else {
          const initial: FranklinSettings = {
            ...DEFAULT_SETTINGS,
            userId: user.uid,
          };
          await setDoc(docRef, initial);
          setSettings(initial);
        }
        setLoading(false);
      },
      (error) => {
        console.error("[Franklin] Settings listener error:", error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  // ── Week record listener ───────────────────────────────────
  // Re-subscribes whenever the cycle start or virtue list changes
  useEffect(() => {
    if (!user || !settings) return;

    const virtueIdx = getCurrentVirtueIndex(
      settings.virtues,
      settings.cycleStartDate
    );
    const virtueId = settings.virtues[virtueIdx]?.id ?? 0;
    const weekKey = getWeekKey();
    const recordId = `${user.uid}_${virtueId}_${weekKey}`;
    const docRef = doc(db, "franklinWeekRecords", recordId);

    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          setWeekRecord(snap.data() as FranklinWeekRecord);
        } else {
          setWeekRecord({
            id: recordId,
            userId: user.uid,
            virtueId,
            weekKey,
            lapseCount: 0,
            alignmentCount: 0,
          });
        }
      },
      (error) => {
        console.error("[Franklin] Week record listener error:", error);
      }
    );
    return () => unsub();
  }, [user, settings?.cycleStartDate, settings?.virtues]);

  // ── Notes / archive listener ───────────────────────────────
  // orderBy is intentionally omitted — we sort client-side to avoid
  // requiring a composite index on (userId, createdAt).
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "franklinNotes"),
      where("userId", "==", user.uid)
    );
    const unsub = onSnapshot(
      q,
      async (snap) => {
        const sorted = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => {
            const ta = a.createdAt?.toMillis?.() ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? 0;
            return tb - ta;
          });
        const decrypted = await Promise.all(
          sorted.map(async (n: any) => {
            if (n.isEncrypted && masterKey && n.noteIv) {
              try {
                const plain = await decryptData(
                  masterKey,
                  base64ToBuffer(n.note),
                  new Uint8Array(base64ToBuffer(n.noteIv))
                );
                return { ...n, note: plain } as FranklinNote;
              } catch {
                return { ...n, note: "[encrypted]" } as FranklinNote;
              }
            }
            return n as FranklinNote;
          })
        );
        setNotes(decrypted);
      },
      (error) => {
        console.error("[Franklin] Notes listener error:", error);
      }
    );
    return () => unsub();
  }, [user, masterKey]);

  // ── All week records for current week (for mini-card display) ────────────
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "franklinWeekRecords"),
      where("userId", "==", user.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const weekKey = getWeekKey();
        setAllWeekRecords(
          snap.docs
            .map((d) => d.data() as FranklinWeekRecord)
            .filter((r) => r.weekKey === weekKey)
        );
      },
      (error) => {
        console.error("[Franklin] All week records listener error:", error);
      }
    );
    return () => unsub();
  }, [user]);

  // ── Derived values ─────────────────────────────────────────

  const currentVirtue = useMemo<FranklinVirtue | null>(() => {
    if (!settings || settings.virtues.length === 0) return null;
    const idx = getCurrentVirtueIndex(
      settings.virtues,
      settings.cycleStartDate
    );
    return settings.virtues[idx] ?? null;
  }, [settings]);

  /** 1-based week number within the 13-week cycle */
  const currentWeekNumber = useMemo<number>(() => {
    if (!settings) return 1;
    try {
      const cycleStart = parseISO(settings.cycleStartDate);
      const weeksSince = differenceInCalendarWeeks(new Date(), cycleStart, {
        weekStartsOn: 1,
      });
      return (Math.max(0, weeksSince) % settings.virtues.length) + 1;
    } catch {
      return 1;
    }
  }, [settings]);

  /**
   * YYYY-MM-DD of the Monday one week before the current week.
   * This is the week that needs to be audited once we advance past it.
   */
  const prevWeekKey = useMemo<string>(() => {
    return format(subWeeks(parseISO(getWeekKey()), 1), "yyyy-MM-dd");
  }, []);

  /**
   * True when the user has completed at least one full virtue-week and
   * has not yet sealed the audit for the most recently completed week,
   * OR when a manual mid-cycle audit has been forced.
   */
  const auditPending = useMemo<boolean>(() => {
    if (!settings?.franklinActive) return false;
    // Manual override always wins
    if (settings.manualAuditWeekKey) return true;
    const currentWeekKey = getWeekKey();
    // Still in the first week of the cycle — no prior week to audit
    if (currentWeekKey <= settings.cycleStartDate) return false;
    const sealed = settings.lastSealedWeekKey ?? null;
    return sealed !== prevWeekKey;
  }, [settings, prevWeekKey]);

  /**
   * The weekKey that is currently under audit.
   * For forced audits this is the current week; for natural rollovers it's prevWeekKey.
   */
  const auditWeekKey = useMemo<string>(() => {
    if (settings?.manualAuditWeekKey) return settings.manualAuditWeekKey;
    return prevWeekKey;
  }, [settings, prevWeekKey]);

  /** Whether the current audit was manually triggered (mid-cycle). */
  const isManualAudit = useMemo<boolean>(() => {
    return !!settings?.manualAuditWeekKey;
  }, [settings]);

  /** The virtue that was active during the audit week. */
  const auditVirtue = useMemo<FranklinVirtue | null>(() => {
    if (!settings || !auditPending || settings.virtues.length === 0) return null;
    // For a manual audit the virtue is the one active in that week
    const targetWeekKey = settings.manualAuditWeekKey ?? prevWeekKey;
    const weeksFromStart = differenceInCalendarWeeks(
      parseISO(targetWeekKey),
      parseISO(settings.cycleStartDate),
      { weekStartsOn: 1 }
    );
    const idx = Math.max(0, weeksFromStart) % settings.virtues.length;
    return settings.virtues[idx] ?? null;
  }, [settings, auditPending, prevWeekKey]);

  // ── Audit week record listener ─────────────────────────────────
  useEffect(() => {
    if (!user || !auditVirtue) {
      setAuditWeekRecord(null);
      return;
    }
    const recordId = `${user.uid}_${auditVirtue.id}_${auditWeekKey}`;
    const unsub = onSnapshot(
      doc(db, "franklinWeekRecords", recordId),
      (snap) => {
        if (snap.exists()) {
          setAuditWeekRecord(snap.data() as FranklinWeekRecord);
        } else {
          setAuditWeekRecord({ id: recordId, userId: user.uid, virtueId: auditVirtue.id, weekKey: auditWeekKey, lapseCount: 0, alignmentCount: 0 });
        }
      },
      (error) => { console.error("[Franklin] Audit week record listener error:", error); }
    );
    return () => unsub();
  }, [user, auditVirtue, auditWeekKey]);

  // ── Latest sealed audit for the current virtue (for Crown Card recall) ────
  useEffect(() => {
    if (!user || !currentVirtue) {
      setLatestAuditForCurrentVirtue(null);
      return;
    }
    const q = query(
      collection(db, "franklinAudits"),
      where("userId", "==", user.uid),
      where("virtueId", "==", currentVirtue.id)
    );
    const unsub = onSnapshot(
      q,
      async (snap) => {
        if (snap.empty) { setLatestAuditForCurrentVirtue(null); return; }
        // Sort client-side by sealedAt desc, pick first
        const sorted = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as FranklinAuditRecord))
          .sort((a, b) => {
            const ta = (a.sealedAt as any)?.toMillis?.() ?? 0;
            const tb = (b.sealedAt as any)?.toMillis?.() ?? 0;
            return tb - ta;
          });
        const latest = sorted[0];
        if (!latest) { setLatestAuditForCurrentVirtue(null); return; }
        // Decrypt if needed
        if (latest.isEncrypted && masterKey) {
          try {
            const decryptedStrategy = latest.strategyIv
              ? await decryptData(masterKey, base64ToBuffer(latest.strategySelected), new Uint8Array(base64ToBuffer(latest.strategyIv)))
              : latest.strategySelected;
            const decryptedTrigger = latest.triggerIv
              ? await decryptData(masterKey, base64ToBuffer(latest.triggerAnalysis), new Uint8Array(base64ToBuffer(latest.triggerIv)))
              : latest.triggerAnalysis;
            setLatestAuditForCurrentVirtue({ ...latest, strategySelected: decryptedStrategy, triggerAnalysis: decryptedTrigger });
            return;
          } catch {
            // fall through to show raw
          }
        }
        setLatestAuditForCurrentVirtue(latest);
      },
      (error) => { console.error("[Franklin] Latest audit listener error:", error); }
    );
    return () => unsub();
  }, [user, currentVirtue, masterKey]);

  /**
   * Log a Black Spot (lapse) or Bright Spot (alignment).
   * Increments the week record counter and permanently archives the note.
   */
  const logSpot = useCallback(
    async (type: "lapse" | "alignment", note: string) => {
      if (!user || !settings || !currentVirtue) return;

      const weekKey = getWeekKey();
      const virtueIdx = getCurrentVirtueIndex(
        settings.virtues,
        settings.cycleStartDate
      );
      const virtueId = settings.virtues[virtueIdx]?.id ?? 0;
      const virtueName = settings.virtues[virtueIdx]?.name ?? "";
      const recordId = `${user.uid}_${virtueId}_${weekKey}`;

      // Permanently archive the note (even if empty string is skipped)
      if (note.trim()) {
        let finalNote = note.trim();
        let noteIv: string | null = null;
        let isEncrypted = false;
        if (masterKey) {
          try {
            const { ciphertext, iv } = await encryptData(masterKey, note.trim());
            finalNote = bufferToBase64(ciphertext);
            noteIv = bufferToBase64(iv.buffer as ArrayBuffer);
            isEncrypted = true;
          } catch (err) {
            console.error("[Franklin] Failed to encrypt note:", err);
          }
        }
        await addDoc(collection(db, "franklinNotes"), {
          userId: user.uid,
          virtueId,
          virtueName,
          type,
          note: finalNote,
          noteIv,
          isEncrypted,
          date: localDateStr(),
          weekKey,
          createdAt: serverTimestamp(),
        });
      }

      // Update (or create) the week record count
      const recordRef = doc(db, "franklinWeekRecords", recordId);
      const snap = await getDoc(recordRef);
      const field = type === "lapse" ? "lapseCount" : "alignmentCount";

      if (snap.exists()) {
        await updateDoc(recordRef, {
          [field]: ((snap.data()[field] as number) ?? 0) + 1,
        });
      } else {
        await setDoc(recordRef, {
          id: recordId,
          userId: user.uid,
          virtueId,
          weekKey,
          lapseCount: type === "lapse" ? 1 : 0,
          alignmentCount: type === "alignment" ? 1 : 0,
        });
      }
    },
    [user, settings, currentVirtue]
  );

  /** Log a spot against any virtue (not just the current week's focus). */
  const logSpotForVirtue = useCallback(
    async (virtue: FranklinVirtue, type: "lapse" | "alignment", note: string) => {
      if (!user || !settings) return;
      const weekKey = getWeekKey();
      const recordId = `${user.uid}_${virtue.id}_${weekKey}`;

      if (note.trim()) {
        let finalNote = note.trim();
        let noteIv: string | null = null;
        let isEncrypted = false;
        if (masterKey) {
          try {
            const { ciphertext, iv } = await encryptData(masterKey, note.trim());
            finalNote = bufferToBase64(ciphertext);
            noteIv = bufferToBase64(iv.buffer as ArrayBuffer);
            isEncrypted = true;
          } catch (err) {
            console.error("[Franklin] Failed to encrypt note:", err);
          }
        }
        await addDoc(collection(db, "franklinNotes"), {
          userId: user.uid,
          virtueId: virtue.id,
          virtueName: virtue.name,
          type,
          note: finalNote,
          noteIv,
          isEncrypted,
          date: localDateStr(),
          weekKey,
          createdAt: serverTimestamp(),
        });
      }

      const recordRef = doc(db, "franklinWeekRecords", recordId);
      const snap = await getDoc(recordRef);
      const field = type === "lapse" ? "lapseCount" : "alignmentCount";

      if (snap.exists()) {
        await updateDoc(recordRef, {
          [field]: ((snap.data()[field] as number) ?? 0) + 1,
        });
      } else {
        await setDoc(recordRef, {
          id: recordId,
          userId: user.uid,
          virtueId: virtue.id,
          weekKey,
          lapseCount: type === "lapse" ? 1 : 0,
          alignmentCount: type === "alignment" ? 1 : 0,
        });
      }
    },
    [user, settings]
  );

  const updateSettings = useCallback(
    async (partial: Partial<Omit<FranklinSettings, "userId">>) => {
      if (!user) return;
      await updateDoc(doc(db, "franklinSettings", user.uid), partial);
    },
    [user]
  );

  const updateVirtues = useCallback(
    async (virtues: FranklinVirtue[]) => {
      if (!user) return;
      await updateDoc(doc(db, "franklinSettings", user.uid), { virtues });
    },
    [user]
  );

  /**
   * Toggle Franklin Mode on/off.
   * When activating, resets the cycle start to the current Monday so the
   * rotation begins fresh.
   */
  const toggleFranklinMode = useCallback(async () => {
    if (!user || !settings) return;
    const newActive = !settings.franklinActive;
    const updates: Partial<FranklinSettings> = { franklinActive: newActive };
    if (newActive) {
      updates.cycleStartDate = getWeekKey();
    }
    await updateDoc(doc(db, "franklinSettings", user.uid), updates);
  }, [user, settings]);

  const deleteNote = useCallback(async (noteId: string) => {
    await deleteDoc(doc(db, "franklinNotes", noteId));
  }, []);

  const updateNote = useCallback(
    async (noteId: string, nextNote: string) => {
      const trimmed = nextNote.trim();
      if (!trimmed) return;

      let finalNote = trimmed;
      let noteIv: string | null = null;
      let isEncrypted = false;

      if (masterKey) {
        try {
          const { ciphertext, iv } = await encryptData(masterKey, trimmed);
          finalNote = bufferToBase64(ciphertext);
          noteIv = bufferToBase64(iv.buffer as ArrayBuffer);
          isEncrypted = true;
        } catch (err) {
          console.error("[Franklin] Failed to encrypt note update:", err);
        }
      }

      await updateDoc(doc(db, "franklinNotes", noteId), {
        note: finalNote,
        noteIv,
        isEncrypted,
      });
    },
    [masterKey]
  );

  /** Force a mid-cycle audit for the current week's virtue. */
  const forceAudit = useCallback(async () => {
    if (!user) return;
    await updateDoc(doc(db, "franklinSettings", user.uid), {
      manualAuditWeekKey: getWeekKey(),
    });
  }, [user]);

  /**
   * Seal the weekly audit.
   * Writes to franklinAudits and advances lastSealedWeekKey in settings.
   */
  const sealAudit = useCallback(
    async (triggerAnalysis: string, strategySelected: string) => {
      if (!user || !settings || !auditVirtue) return;

      let finalTrigger = triggerAnalysis.trim();
      let finalStrategy = strategySelected.trim();
      let triggerIv: string | null = null;
      let strategyIv: string | null = null;
      let isEncrypted = false;

      if (masterKey) {
        try {
          const { ciphertext: tCipher, iv: tIv } = await encryptData(masterKey, finalTrigger);
          finalTrigger = bufferToBase64(tCipher);
          triggerIv = bufferToBase64(tIv.buffer as ArrayBuffer);
          const { ciphertext: sCipher, iv: sIv } = await encryptData(masterKey, finalStrategy);
          finalStrategy = bufferToBase64(sCipher);
          strategyIv = bufferToBase64(sIv.buffer as ArrayBuffer);
          isEncrypted = true;
        } catch (err) {
          console.error("[Franklin] Failed to encrypt audit fields:", err);
        }
      }

      const auditId = `${user.uid}_${auditVirtue.id}_${auditWeekKey}`;
      const lapseCount = auditWeekRecord?.lapseCount ?? 0;
      const alignmentCount = auditWeekRecord?.alignmentCount ?? 0;

      await setDoc(doc(db, "franklinAudits", auditId), {
        id: auditId,
        userId: user.uid,
        virtueId: auditVirtue.id,
        virtueName: auditVirtue.name,
        weekKey: auditWeekKey,
        lapseCount,
        alignmentCount,
        triggerAnalysis: finalTrigger,
        strategySelected: finalStrategy,
        triggerIv,
        strategyIv,
        isEncrypted,
        sealedAt: serverTimestamp(),
      } satisfies Omit<FranklinAuditRecord, 'sealedAt'> & { sealedAt: ReturnType<typeof serverTimestamp> });

      // Clear manual flag if set; otherwise advance lastSealedWeekKey
      if (settings.manualAuditWeekKey) {
        await updateDoc(doc(db, "franklinSettings", user.uid), {
          manualAuditWeekKey: null,
        });
      } else {
        await updateDoc(doc(db, "franklinSettings", user.uid), {
          lastSealedWeekKey: auditWeekKey,
        });
      }
    },
    [user, settings, auditVirtue, auditWeekKey, auditWeekRecord, masterKey]
  );

  return {
    settings,
    currentVirtue,
    currentWeekNumber,
    weekRecord,
    allWeekRecords,
    auditPending,
    auditVirtue,
    auditWeekRecord,
    auditWeekKey,
    isManualAudit,
    latestAuditForCurrentVirtue,
    prevWeekKey,
    notes,
    loading,
    logSpot,
    logSpotForVirtue,
    updateSettings,
    updateVirtues,
    toggleFranklinMode,
    deleteNote,
    updateNote,
    sealAudit,
    forceAudit,
  };
}
