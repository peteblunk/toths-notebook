"use client";

import { Flame, Skull, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { use75Hard, type HardMode75Completion } from '@/hooks/use-75hard';
import { format, parseISO } from 'date-fns';

// ─────────────────────────────────────────────────────────────
// Individual badge tile
// ─────────────────────────────────────────────────────────────

function BadgeTile({ completion, index }: { completion: HardMode75Completion; index: number }) {
  const isSuper = completion.mode === 'super';
  const dateLabel = (() => {
    try { return format(parseISO(completion.date), 'MMM d, yyyy'); } catch { return completion.date; }
  })();

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
        isSuper
          ? 'border-red-600/70 bg-red-950/30 shadow-[0_0_18px_rgba(220,38,38,0.25)]'
          : 'border-amber-600/70 bg-amber-950/30 shadow-[0_0_18px_rgba(245,158,11,0.2)]'
      )}
    >
      {/* Ordinal */}
      <span className={cn(
        'absolute top-2 right-2.5 text-[9px] font-headline uppercase tracking-widest',
        isSuper ? 'text-red-700' : 'text-amber-700'
      )}>
        #{index + 1}
      </span>

      {/* Glyph */}
      <div className={cn(
        'relative flex items-center justify-center w-14 h-14 rounded-full border-2',
        isSuper
          ? 'border-red-500/60 bg-red-950/50 shadow-[0_0_14px_rgba(220,38,38,0.5)]'
          : 'border-amber-500/60 bg-amber-950/50 shadow-[0_0_14px_rgba(245,158,11,0.4)]'
      )}>
        {/* Outer flame ring */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 56 56">
          <circle
            cx="28" cy="28" r="24"
            fill="none"
            strokeWidth="1.5"
            stroke={isSuper ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'}
            strokeDasharray="4 3"
          />
        </svg>
        <Flame className={cn(
          'w-6 h-6 relative z-10',
          isSuper ? 'text-red-400' : 'text-amber-400'
        )} />
        {/* Mode icon overlay */}
        <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border border-zinc-900 flex items-center justify-center bg-zinc-950">
          {isSuper
            ? <Skull className="w-2.5 h-2.5 text-red-500" />
            : <Shield className="w-2.5 h-2.5 text-amber-500" />
          }
        </div>
      </div>

      {/* Labels */}
      <div className="text-center">
        <p className={cn(
          'text-[10px] font-headline uppercase tracking-[0.2em] font-bold',
          isSuper ? 'text-red-300' : 'text-amber-300'
        )}>
          75 Hard
        </p>
        <p className={cn(
          'text-[8px] font-headline uppercase tracking-widest mt-0.5',
          isSuper ? 'text-red-600' : 'text-amber-600'
        )}>
          {isSuper ? 'Super Hard' : 'Easy Mode'}
        </p>
        <p className="text-[8px] text-zinc-600 mt-1 font-mono">{dateLabel}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section — rendered in Scribe's Dossier
// ─────────────────────────────────────────────────────────────

export function Hard75BadgeSection() {
  const { completions, loading } = use75Hard();

  if (loading) return null;
  if (completions.length === 0) return null;

  return (
    <div className="w-full space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2 px-1">
        <Flame className="w-4 h-4 text-red-500" />
        <h2 className="text-[11px] font-headline uppercase tracking-[0.3em] text-red-400">
          75 Hard Victories
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-red-800/40 to-transparent" />
        <span className="text-[9px] font-headline text-red-700 tabular-nums">
          {completions.length}× completed
        </span>
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 gap-3">
        {completions.map((c, i) => (
          <BadgeTile key={`${c.date}-${i}`} completion={c} index={i} />
        ))}
      </div>
    </div>
  );
}
