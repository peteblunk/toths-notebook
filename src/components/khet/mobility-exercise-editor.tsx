"use client";

import { useState, useRef } from 'react';
import { GripVertical, Trash2, Pencil, Search, Plus, X, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MobilityExercise } from '@/lib/mobility-types';
import mobilityExercisesData from '@/../public/docs/mobility-exercises.json';

const ALL_EXERCISES = mobilityExercisesData as MobilityExercise[];

type SessionType = 'single' | 'A' | 'B';

export interface MobilityExerciseEditorProps {
  structure: 'single' | 'AB';
  exercises: Record<SessionType, MobilityExercise[]>;
  onChange: (updated: Record<SessionType, MobilityExercise[]>) => void;
}

export function MobilityExerciseEditor({
  structure,
  exercises,
  onChange,
}: MobilityExerciseEditorProps) {
  const [activeType, setActiveType] = useState<SessionType>(
    structure === 'AB' ? 'A' : 'single',
  );
  const [swappingIdx, setSwappingIdx] = useState<number | null>(null);
  const [addingMode, setAddingMode] = useState(false);
  const [swapSearch, setSwapSearch] = useState('');
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dragIdx = useRef<number | null>(null);

  const currentList = exercises[activeType] ?? [];

  // Exclude already-in-list exercises (except the one being swapped out)
  const alreadyIds = new Set(
    currentList.filter((_, i) => i !== swappingIdx).map((e) => e.id),
  );

  const swappingEx = swappingIdx !== null ? currentList[swappingIdx] : null;

  // Near-equivalents: same targets, not already in list
  const nearEquivalents = swappingEx
    ? ALL_EXERCISES.filter(
        (ex) =>
          !alreadyIds.has(ex.id) &&
          ex.targets.some((t) => swappingEx.targets.includes(t)),
      ).slice(0, 8)
    : [];

  // Search results
  const searchResults =
    swapSearch.trim().length > 1
      ? ALL_EXERCISES.filter(
          (ex) =>
            !alreadyIds.has(ex.id) &&
            ex.name.toLowerCase().includes(swapSearch.toLowerCase()),
        ).slice(0, 12)
      : [];

  const update = (type: SessionType, list: MobilityExercise[]) =>
    onChange({ ...exercises, [type]: list });

  const reorder = (type: SessionType, from: number, to: number) => {
    if (from === to) return;
    const list = [...exercises[type]];
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    update(type, list);
  };

  const removeExercise = (type: SessionType, idx: number) => {
    update(
      type,
      exercises[type].filter((_, i) => i !== idx),
    );
    if (swappingIdx === idx) closePanel();
  };

  const replaceExercise = (type: SessionType, idx: number, newEx: MobilityExercise) => {
    const list = [...exercises[type]];
    list[idx] = newEx;
    update(type, list);
    closePanel();
  };

  const appendExercise = (type: SessionType, newEx: MobilityExercise) => {
    update(type, [...exercises[type], newEx]);
    closePanel();
  };

  const closePanel = () => {
    setSwappingIdx(null);
    setAddingMode(false);
    setSwapSearch('');
  };

  const handleSelect = (ex: MobilityExercise) => {
    if (addingMode) appendExercise(activeType, ex);
    else if (swappingIdx !== null) replaceExercise(activeType, swappingIdx, ex);
  };

  return (
    <div className="space-y-3">
      {/* Day A / Day B tabs for AB structure */}
      {structure === 'AB' && (
        <div className="flex gap-2">
          {(['A', 'B'] as SessionType[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setActiveType(t);
                closePanel();
              }}
              className={cn(
                'flex-1 py-2 rounded-lg border text-sm font-headline uppercase tracking-widest transition-all',
                activeType === t
                  ? 'border-blue-500 bg-blue-950/40 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500',
              )}
            >
              Day {t}
            </button>
          ))}
        </div>
      )}

      {/* Exercise list */}
      <div className="space-y-1.5">
        {currentList.map((ex, idx) => (
          <div
            key={`${ex.id}-${idx}`}
            draggable
            onDragStart={() => {
              dragIdx.current = idx;
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(idx);
            }}
            onDragEnd={() => {
              if (dragIdx.current !== null && dragOver !== null) {
                reorder(activeType, dragIdx.current, dragOver);
              }
              dragIdx.current = null;
              setDragOver(null);
            }}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-lg border bg-zinc-900/60 transition-all cursor-grab active:cursor-grabbing',
              dragOver === idx
                ? 'border-blue-500/60 bg-blue-950/20 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                : swappingIdx === idx
                  ? 'border-amber-500/50 bg-amber-950/10'
                  : 'border-zinc-800 hover:border-zinc-700',
            )}
          >
            {/* Grip */}
            <GripVertical className="w-4 h-4 text-zinc-600 flex-shrink-0" />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm text-zinc-100 font-medium leading-tight">
                  {ex.name}
                </span>
                {ex.sides === 'left-right' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-headline uppercase tracking-widest border border-cyan-800 text-cyan-400 bg-cyan-950/20 flex-shrink-0">
                    Each Side
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Timer className="w-3 h-3 text-zinc-600" />
                <span className="text-xs text-zinc-500">
                  {ex.isDynamic ? `${ex.reps ?? 10} reps` : `${ex.baseHoldSeconds}s`}
                </span>
                {ex.targets.length > 0 && (
                  <span className="text-zinc-700 text-xs ml-0.5">
                    · {ex.targets.slice(0, 2).join(', ')}
                  </span>
                )}
              </div>
            </div>

            {/* Order */}
            <span className="text-[10px] text-zinc-700 font-headline flex-shrink-0">
              #{idx + 1}
            </span>

            {/* Swap (pencil) */}
            <button
              onClick={() => {
                if (swappingIdx === idx) closePanel();
                else {
                  setSwappingIdx(idx);
                  setAddingMode(false);
                  setSwapSearch('');
                }
              }}
              className={cn(
                'p-1.5 rounded transition-colors flex-shrink-0',
                swappingIdx === idx
                  ? 'text-amber-400 bg-amber-950/30'
                  : 'text-zinc-500 hover:text-blue-400 hover:bg-zinc-800',
              )}
              title="Swap exercise"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            {/* Delete (trash) */}
            <button
              onClick={() => removeExercise(activeType, idx)}
              className="p-1.5 rounded transition-colors text-zinc-600 hover:text-red-400 hover:bg-zinc-800 flex-shrink-0"
              title="Remove exercise"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Exercise button */}
      <button
        onClick={() => {
          setAddingMode((v) => !v);
          setSwappingIdx(null);
          setSwapSearch('');
        }}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-headline uppercase tracking-widest transition-all',
          addingMode
            ? 'border-blue-500 bg-blue-950/30 text-blue-300'
            : 'border-dashed border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300',
        )}
      >
        <Plus className="w-3.5 h-3.5" />
        Add Exercise
      </button>

      {/* Swap / Add Panel */}
      {(swappingIdx !== null || addingMode) && (
        <div className="rounded-xl border border-blue-500/30 bg-zinc-900/90 p-4 space-y-3 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
          {/* Panel header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-headline uppercase tracking-widest text-blue-400">
              {addingMode
                ? 'Add Exercise'
                : `Swap: ${swappingIdx !== null ? currentList[swappingIdx]?.name : ''}`}
            </span>
            <button
              onClick={closePanel}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              value={swapSearch}
              onChange={(e) => setSwapSearch(e.target.value)}
              placeholder="Search any exercise…"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Near equivalents (shown when swapping + no search typed) */}
          {!addingMode && !swapSearch && nearEquivalents.length > 0 && (
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
                Near Equivalents
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {nearEquivalents.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => handleSelect(ex)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-800/50 hover:border-blue-500/50 hover:bg-blue-950/20 transition-all text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-zinc-200">{ex.name}</span>
                      {ex.targets.length > 0 && (
                        <span className="text-xs text-zinc-500 ml-2">
                          {ex.targets.slice(0, 2).join(', ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {ex.sides === 'left-right' && (
                        <span className="text-[9px] font-headline text-cyan-500 uppercase">
                          Each Side
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-600">
                        {ex.isDynamic ? `${ex.reps ?? 10}r` : `${ex.baseHoldSeconds}s`}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          {swapSearch.trim().length > 1 && (
            <div>
              {searchResults.length > 0 ? (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {searchResults.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => handleSelect(ex)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-800/50 hover:border-blue-500/50 hover:bg-blue-950/20 transition-all text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-sm text-zinc-200">{ex.name}</span>
                        {ex.targets.length > 0 && (
                          <span className="text-xs text-zinc-500 ml-2">
                            {ex.targets.slice(0, 2).join(', ')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {ex.sides === 'left-right' && (
                          <span className="text-[9px] font-headline text-cyan-500 uppercase">
                            Each Side
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-600">
                          {ex.isDynamic ? `${ex.reps ?? 10}r` : `${ex.baseHoldSeconds}s`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-600 text-center py-2">No results found</p>
              )}
            </div>
          )}

          {/* Hint when adding + no search */}
          {addingMode && !swapSearch && (
            <p className="text-xs text-zinc-600 text-center">
              Type to search the full exercise library
            </p>
          )}
        </div>
      )}
    </div>
  );
}
