"use client";

import { useState } from "react";
import { useFranklin, getWeekKey } from "@/hooks/use-franklin";
import { SpotModal } from "@/components/franklin/spot-modal";
import { AuditLockBanner } from "@/components/franklin/audit-gate";
import { StrategyViewer } from "@/components/franklin/strategy-viewer";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { FranklinVirtue, FranklinWeekRecord } from "@/lib/franklin-types";

// ── Dot strip ─────────────────────────────────────────────────────────────────

function SpotDots({
  count,
  variant,
}: {
  count: number;
  variant: "lapse" | "alignment";
}) {
  const MAX_VISIBLE = 13;
  const visible = Math.min(count, MAX_VISIBLE);
  const overflow = count > MAX_VISIBLE ? count - MAX_VISIBLE : 0;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Array.from({ length: visible }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-2 h-2 rounded-full block flex-shrink-0",
            variant === "lapse"
              ? "bg-rose-700 shadow-[0_0_4px_rgba(225,29,72,0.5)]"
              : "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]"
          )}
        />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            "text-[9px] font-headline",
            variant === "lapse" ? "text-rose-600" : "text-emerald-500"
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

// ── Virtue row (expanded list) ──────────────────────────────────────────────

function VirtueRow({
  virtue,
  weekRecord,
  onLog,
}: {
  virtue: FranklinVirtue;
  weekRecord: FranklinWeekRecord | undefined;
  onLog: (virtue: FranklinVirtue, type: "lapse" | "alignment") => void;
}) {
  const lapses = weekRecord?.lapseCount ?? 0;
  const aligns = weekRecord?.alignmentCount ?? 0;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-3">
      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-headline uppercase tracking-wider text-zinc-300 leading-tight">
          {virtue.name}
        </p>
        <p className="text-xs text-zinc-500 mt-1 leading-snug">{virtue.command}</p>
        <div className="flex items-center gap-3 mt-1.5 text-xs">
          <span className={cn("tabular-nums", lapses > 0 ? "text-rose-400" : "text-zinc-700")}>
            ⬛ {lapses}
          </span>
          <span className={cn("tabular-nums", aligns > 0 ? "text-emerald-400" : "text-zinc-700")}>
            ★ {aligns}
          </span>
        </div>
      </div>
      {/* Pip buttons */}
      <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
        <button
          onClick={() => onLog(virtue, "lapse")}
          className="h-9 w-9 flex items-center justify-center border border-rose-800 text-rose-400 rounded active:bg-rose-950/40 transition-colors text-sm"
        >
          ⬛
        </button>
        <button
          onClick={() => onLog(virtue, "alignment")}
          className="h-9 w-9 flex items-center justify-center border border-emerald-800 text-emerald-400 rounded active:bg-emerald-950/40 transition-colors text-sm"
        >
          ★
        </button>
      </div>
    </div>
  );
}

// ── Crown Card ─────────────────────────────────────────────────────────────────

export function CrownCard() {
  const {
    settings,
    currentVirtue,
    currentWeekNumber,
    weekRecord,
    allWeekRecords,
    auditPending,
    auditVirtue,
    latestAuditForCurrentVirtue,
    notes,
    logSpot,
    logSpotForVirtue,
  } = useFranklin();

  // modal: null = closed | { type, virtue: null = current virtue | specific virtue }
  const [modal, setModal] = useState<{
    type: "lapse" | "alignment";
    virtue: FranklinVirtue | null;
  } | null>(null);
  const [showVirtues, setShowVirtues] = useState(false);

  if (!settings?.franklinActive || !currentVirtue) return null;

  const lapseCount = weekRecord?.lapseCount ?? 0;
  const alignmentCount = weekRecord?.alignmentCount ?? 0;
  const weekKey = getWeekKey();

  // Current virtue's notes this week, newest first (hook already sorts desc)
  const currentWeekNotes = notes.filter(
    (n) => n.virtueId === currentVirtue.id && n.weekKey === weekKey
  );
  const visibleNotes = currentWeekNotes.slice(0, 5);
  const hasMoreNotes = currentWeekNotes.length > 5;

  const otherVirtues = settings.virtues.filter((v) => v.id !== currentVirtue.id);

  const handleLog = (virtue: FranklinVirtue | null, type: "lapse" | "alignment") => {
    if (auditPending) return; // locked
    setModal({ type, virtue });
  };

  const handleConfirm = async (note: string) => {
    if (!modal) return;
    if (modal.virtue === null) {
      await logSpot(modal.type, note);
    } else {
      await logSpotForVirtue(modal.virtue, modal.type, note);
    }
    setModal(null);
  };

  const modalVirtue = modal?.virtue ?? currentVirtue;

  return (
    <>
      {/* ── Crown Card — neon cyber ── */}
      <div
        className={cn(
          "relative rounded-xl border-2 bg-zinc-950 px-4 py-4 space-y-4 transition-all duration-500",
          "border-cyan-500 shadow-[0_0_28px_rgba(6,182,212,0.3),0_0_56px_rgba(6,182,212,0.1),inset_0_0_14px_rgba(6,182,212,0.05)]"
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-headline uppercase tracking-[0.4em] text-cyan-400/80 mb-0.5">
              Week {currentWeekNumber}
            </p>
            <p className="text-xs font-headline uppercase tracking-[0.4em] text-cyan-400/60 mb-1">
              Primary Virtue
            </p>
            <h2 className="text-xl font-headline uppercase tracking-widest text-cyan-100 leading-tight drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]">
              {currentVirtue.name}
            </h2>
            <p className="text-sm text-zinc-300 mt-1 leading-snug">
              {currentVirtue.command}
            </p>
          </div>
        </div>

        {/* Strategy Bank ⓘ glyph */}
        <StrategyViewer virtueId={currentVirtue.id} virtueName={currentVirtue.name} />

        {/* Audit lock banner — replaces spot counters when pending */}
        {auditPending && auditVirtue ? (
          <Link href="/franklin">
            <AuditLockBanner virtueName={auditVirtue.name} />
          </Link>
        ) : (
          /* Spot counters — outlined rows with inline + buttons */
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-700 px-3 py-2.5">
              <div className="space-y-1.5 flex-1 min-w-0">
                <p className="text-xs font-headline uppercase tracking-[0.3em] text-rose-400">
                  ⬛ Black Spots ({lapseCount})
                </p>
                {lapseCount > 0 ? (
                  <SpotDots count={lapseCount} variant="lapse" />
                ) : (
                  <p className="text-xs text-zinc-600 italic">Clear this week</p>
                )}
              </div>
              <button
                onClick={() => handleLog(null, "lapse")}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full border-2 border-rose-600 text-rose-400 text-lg font-bold active:bg-rose-950/40 transition-colors"
                aria-label="Log black spot"
              >
                +
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-700 px-3 py-2.5">
              <div className="space-y-1.5 flex-1 min-w-0">
                <p className="text-xs font-headline uppercase tracking-[0.3em] text-emerald-400">
                  ★ Bright Spots ({alignmentCount})
                </p>
                {alignmentCount > 0 ? (
                  <SpotDots count={alignmentCount} variant="alignment" />
                ) : (
                  <p className="text-xs text-zinc-600 italic">None yet</p>
                )}
              </div>
              <button
                onClick={() => handleLog(null, "alignment")}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full border-2 border-emerald-600 text-emerald-400 text-lg font-bold active:bg-emerald-950/40 transition-colors"
                aria-label="Log bright spot"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Inline notes — this week's context notes for the current virtue */}
        {visibleNotes.length > 0 && (
          <div className="border-t border-zinc-800/60 pt-3 space-y-2">
            <p className="text-xs font-headline uppercase tracking-[0.4em] text-zinc-200">
              This Week's Notes
            </p>
            {visibleNotes.map((n) => (
              <div key={n.id} className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-0.5 flex-shrink-0 text-[11px]",
                    n.type === "lapse" ? "text-rose-500" : "text-emerald-400"
                  )}
                >
                  {n.type === "lapse" ? "⬛" : "★"}
                </span>
                <p className="text-xs text-zinc-300 leading-snug">{n.note}</p>
              </div>
            ))}
            {hasMoreNotes && (
              <Link
                href="/franklin"
                className="text-[10px] font-headline uppercase tracking-widest text-cyan-500/60"
              >
                View all →
              </Link>
            )}
          </div>
        )}

        {/* Previous Cycle Directive — shown when this virtue has a prior sealed audit */}
        {latestAuditForCurrentVirtue && (
          <div className="border-t border-zinc-800/60 pt-3 space-y-2">
            <p className="text-[10px] font-headline uppercase tracking-[0.4em] text-zinc-500 uppercase">
              Previous Cycle — Week of {latestAuditForCurrentVirtue.weekKey}
            </p>
            {latestAuditForCurrentVirtue.strategySelected && (
              <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/40 px-3 py-2.5">
                <p className="text-[10px] font-headline uppercase tracking-[0.3em] text-cyan-400/70 mb-1">
                  Standing Directive
                </p>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {latestAuditForCurrentVirtue.strategySelected}
                </p>
              </div>
            )}
            {latestAuditForCurrentVirtue.triggerAnalysis && (
              <div className="rounded-lg border border-zinc-700/40 bg-zinc-900/20 px-3 py-2.5">
                <p className="text-[10px] font-headline uppercase tracking-[0.3em] text-rose-400/60 mb-1">
                  Known Trigger Pattern
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {latestAuditForCurrentVirtue.triggerAnalysis}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Access All Virtues — inside the card, below notes */}
        {otherVirtues.length > 0 && (
          <button
            onClick={() => setShowVirtues((v) => !v)}
            className="w-full flex items-center justify-center gap-2 h-11 text-sm font-headline uppercase tracking-[0.3em] text-cyan-300 border-2 border-cyan-500 rounded-lg active:bg-cyan-950/30 transition-colors shadow-[0_0_12px_rgba(6,182,212,0.2)]"
          >
            Access All Virtues
            <span>{showVirtues ? "↑" : "↓"}</span>
          </button>
        )}
      </div>

      {/* Shared modal — works for both crown and virtue rows */}
      {modal && (
        <SpotModal
          open
          type={modal.type}
          virtueName={modalVirtue.name}
          onConfirm={handleConfirm}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── Slide-down virtue list ── */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          showVirtues ? "max-h-[4000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="space-y-1.5 pt-1">
          {otherVirtues.map((v) => {
            const rec = allWeekRecords.find((r) => r.virtueId === v.id);
            return (
              <VirtueRow
                key={v.id}
                virtue={v}
                weekRecord={rec}
                onLog={(virtue, type) => handleLog(virtue, type)}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
