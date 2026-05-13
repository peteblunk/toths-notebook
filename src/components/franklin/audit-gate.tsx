"use client";

import { useState } from "react";
import { useFranklin } from "@/hooks/use-franklin";
import { getStrategy } from "@/lib/franklin/strategyBank";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// AuditGate — Full weekly audit interface.
// Shown on the /franklin page when auditPending === true.
// The user cannot dismiss this; they must seal or it persists next session.
// ─────────────────────────────────────────────────────────────────────────────

export function AuditGate() {
  const { auditVirtue, auditWeekRecord, auditWeekKey, isManualAudit, sealAudit, notes } = useFranklin();

  const [triggerAnalysis, setTriggerAnalysis] = useState("");
  const [strategySelected, setStrategySelected] = useState("");
  const [sealing, setSealing] = useState(false);
  const [sealed, setSealed] = useState(false);

  const strategy = auditVirtue ? getStrategy(auditVirtue.id) : null;

  const lapseCount = auditWeekRecord?.lapseCount ?? 0;
  const alignmentCount = auditWeekRecord?.alignmentCount ?? 0;

  // Notes logged during the week under audit
  const auditWeekNotes = auditVirtue
    ? notes.filter((n) => n.virtueId === auditVirtue.id && n.weekKey === auditWeekKey)
    : [];
  const lapseNotes = auditWeekNotes.filter((n) => n.type === "lapse");
  const alignmentNotes = auditWeekNotes.filter((n) => n.type === "alignment");

  const handleSeal = async () => {
    if (sealing) return;
    setSealing(true);
    try {
      await sealAudit(triggerAnalysis, strategySelected);
      setSealed(true);
    } catch (err) {
      console.error("[AuditGate] Seal failed:", err);
    } finally {
      setSealing(false);
    }
  };

  if (sealed) {
    return (
      <div className="rounded-xl border-2 border-cyan-500 bg-zinc-950 px-5 py-8 text-center space-y-3 shadow-[0_0_28px_rgba(6,182,212,0.3),inset_0_0_14px_rgba(6,182,212,0.05)]">
        <p className="text-2xl">✦</p>
        <p className="text-sm font-headline uppercase tracking-[0.4em] text-cyan-300">
          Audit Sealed
        </p>
        <p className="text-xs text-zinc-400 italic">
          "Perform without fail what you resolve."
        </p>
      </div>
    );
  }

  if (!auditVirtue) return null;

  return (
    <div className="rounded-xl border-2 border-amber-500 bg-zinc-950 space-y-0 shadow-[0_0_28px_rgba(245,158,11,0.25),0_0_56px_rgba(245,158,11,0.08),inset_0_0_14px_rgba(245,158,11,0.04)] overflow-hidden">
      {/* ── Header ── */}
      <div className="bg-amber-950/30 border-b border-amber-500/40 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-amber-400 text-lg">⚠</span>
          <div>
            <p className="text-xs font-headline uppercase tracking-[0.4em] text-amber-400">
              {isManualAudit ? "Mid-Cycle Review" : "Audit Required"}
            </p>
            <p className="text-[10px] text-amber-400/60 uppercase tracking-wider mt-0.5">
              Week of {auditWeekKey} — {isManualAudit ? "Voluntary Reflection" : "System Locked"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* ── Virtue under review ── */}
        <div className="space-y-1">
          <p className="text-xs font-headline uppercase tracking-[0.4em] text-zinc-400">
            Virtue Under Review
          </p>
          <h2 className="text-xl font-headline uppercase tracking-widest text-amber-100 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
            {auditVirtue.name}
          </h2>
          <p className="text-sm text-zinc-300 italic leading-snug">
            {auditVirtue.command}
          </p>
        </div>

        {/* ── Week summary ── */}
        <div className="flex gap-6 border-t border-zinc-800 pt-4">
          <div>
            <p className="text-2xl font-headline text-rose-400 tabular-nums leading-none">
              {lapseCount}
            </p>
            <p className="text-sm text-zinc-400 uppercase tracking-wider mt-0.5">
              Black Spots
            </p>
          </div>
          <div>
            <p className="text-2xl font-headline text-emerald-400 tabular-nums leading-none">
              {alignmentCount}
            </p>
            <p className="text-sm text-zinc-400 uppercase tracking-wider mt-0.5">
              Bright Spots
            </p>
          </div>
        </div>

        {/* ── Week notes log ── */}
        {auditWeekNotes.length > 0 && (
          <div className="border-t border-zinc-800 pt-4 space-y-3">
            <p className="text-xs font-headline uppercase tracking-[0.4em] text-zinc-400">
              This Week&apos;s Log
            </p>
            {lapseNotes.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-headline uppercase tracking-wider text-rose-400">
                  ⬛ Black Spots
                </p>
                {lapseNotes.map((n) => (
                  <div key={n.id} className="flex items-start gap-2 pl-1">
                    <span className="text-rose-600 flex-shrink-0 mt-0.5 text-xs">›</span>
                    <div className="min-w-0">
                      <span className="text-xs text-zinc-500 mr-1.5">{n.date}</span>
                      <span className="text-sm text-zinc-300 leading-relaxed">{n.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {alignmentNotes.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-headline uppercase tracking-wider text-emerald-400">
                  ★ Bright Spots
                </p>
                {alignmentNotes.map((n) => (
                  <div key={n.id} className="flex items-start gap-2 pl-1">
                    <span className="text-emerald-600 flex-shrink-0 mt-0.5 text-xs">›</span>
                    <div className="min-w-0">
                      <span className="text-xs text-zinc-500 mr-1.5">{n.date}</span>
                      <span className="text-sm text-zinc-300 leading-relaxed">{n.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Trigger Analysis ── */}
        <div className="border-t border-zinc-800 pt-4 space-y-2">
          <label className="block text-xs font-headline uppercase tracking-[0.4em] text-zinc-300">
            Trigger Analysis
          </label>
          <p className="text-sm text-zinc-400 leading-relaxed">
            What environmental or internal factors were common to this week&apos;s
            lapses? Treat each lapse as a system bug — identify the root cause,
            not the symptom.
          </p>
          <textarea
            value={triggerAnalysis}
            onChange={(e) => setTriggerAnalysis(e.target.value)}
            rows={4}
            placeholder="e.g. Late-night fatigue → lowered inhibition threshold. Social pressure at Wednesday dinner. No pre-commitment before the event."
            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-amber-500/60 transition-colors leading-relaxed"
          />
        </div>

        {/* ── Strategy Selection ── */}
        <div className="border-t border-zinc-800 pt-4 space-y-2">
          <label className="block text-xs font-headline uppercase tracking-[0.4em] text-zinc-300">
            Strategy for Next Cycle
          </label>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Select a technical cue below, or write your own. This becomes your
            standing order for the next time this virtue rotates into focus.
          </p>

          {/* Strategy bank cues as selectable chips */}
          {strategy && strategy.technicalCues.length > 0 && (
            <div className="space-y-1.5 py-1">
              {strategy.technicalCues.map((cue, i) => (
                <button
                  key={i}
                  onClick={() =>
                    setStrategySelected((prev) =>
                      prev === cue ? "" : cue
                    )
                  }
                  className={cn(
                    "w-full text-left text-sm rounded-lg border px-3 py-2.5 leading-relaxed transition-colors",
                    strategySelected === cue
                      ? "border-amber-500 text-amber-100 bg-amber-950/30"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                  )}
                >
                  {cue}
                </button>
              ))}
            </div>
          )}

          <textarea
            value={strategySelected}
            onChange={(e) => setStrategySelected(e.target.value)}
            rows={3}
            placeholder="Or write a custom strategy…"
            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-amber-500/60 transition-colors leading-relaxed"
          />
        </div>

        {/* ── Seal button ── */}
        <div className="border-t border-zinc-800 pt-4">
          <button
            onClick={handleSeal}
            disabled={sealing}
            className={cn(
              "w-full h-14 text-sm font-headline uppercase tracking-[0.2em] rounded-lg border-2 transition-all",
              sealing
                ? "border-zinc-600 text-zinc-500 bg-zinc-900/40 cursor-not-allowed"
                : "border-amber-500 text-amber-100 bg-amber-950/20 active:bg-amber-950/40 shadow-[0_0_16px_rgba(245,158,11,0.2)]"
            )}
          >
            {sealing ? "Sealing…" : "Perform Without Fail What You Resolve"}
          </button>
          <p className="text-[10px] text-zinc-600 text-center mt-2 uppercase tracking-wider">
            Trigger analysis and strategy will be encrypted before storage
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AuditLockBanner — Compact indicator shown on the Crown Card when locked.
// ─────────────────────────────────────────────────────────────────────────────

export function AuditLockBanner({ virtueName }: { virtueName: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-500/60 bg-amber-950/20 px-3 py-2.5">
      <span className="text-amber-400 text-base flex-shrink-0">⚠</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-headline uppercase tracking-[0.3em] text-amber-300">
          Audit Required — {virtueName}
        </p>
        <p className="text-[10px] text-amber-400/60 mt-0.5">
          Complete last week&apos;s audit on the Franklin page to unlock.
        </p>
      </div>
    </div>
  );
}
