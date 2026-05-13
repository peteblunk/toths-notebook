"use client";

import { useState } from "react";
import { getStrategy } from "@/lib/franklin/strategyBank";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// StrategyViewer — inline expandable panel showing technical cues
// and further-study links for the given virtue.
// Used by: CrownCard (ⓘ glyph), /franklin page.
// ─────────────────────────────────────────────────────────────────────────────

interface StrategyViewerProps {
  virtueId: number;
  virtueName: string;
}

export function StrategyViewer({ virtueId, virtueName }: StrategyViewerProps) {
  const [open, setOpen] = useState(false);
  const strategy = getStrategy(virtueId);

  return (
    <div className="w-full">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-center h-11 text-sm font-headline uppercase tracking-[0.3em] text-cyan-300 border-2 border-cyan-500 rounded-lg transition-colors active:bg-cyan-950/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
        aria-label={open ? "Close Strategy Bank" : "Open Strategy Bank"}
      >
        Strategy Bank
      </button>

      {/* Slide-down panel */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          open ? "max-h-[2000px] opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"
        )}
      >
        {strategy ? (
          <div className="rounded-lg border border-zinc-700 bg-zinc-950/60 px-4 py-4 space-y-4">
            {/* Technical Cues */}
            <div className="space-y-2">
              <p className="text-[10px] font-headline uppercase tracking-[0.4em] text-zinc-400">
                Technical Cues
              </p>
              <ul className="space-y-2">
                {strategy.technicalCues.map((cue, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-cyan-600 flex-shrink-0 mt-0.5 text-xs">›</span>
                    <p className="text-xs text-zinc-300 leading-relaxed">{cue}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Further Study */}
            {strategy.furtherStudy.length > 0 && (
              <div className="border-t border-zinc-800 pt-3 space-y-2">
                <p className="text-[10px] font-headline uppercase tracking-[0.4em] text-zinc-400">
                  Further Study
                </p>
                <ul className="space-y-1.5">
                  {strategy.furtherStudy.map((ref, i) => (
                    <li key={i}>
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(ref.query)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-cyan-500/80 hover:text-cyan-400 transition-colors"
                      >
                        <span className="text-[10px]">↗</span>
                        {ref.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3">
            <p className="text-xs text-zinc-500 italic">
              No strategy data found for {virtueName}. Add an entry to{" "}
              <code className="text-zinc-400">src/lib/franklin/strategyBank.ts</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
