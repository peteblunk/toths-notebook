"use client";

import { useState, useMemo, useEffect } from "react";
import { useFranklin } from "@/hooks/use-franklin";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Trash2, Pencil, Check, X } from "lucide-react";
import type { FranklinNote } from "@/lib/franklin-types";

// ── Filter controls ───────────────────────────────────────────────────────────

interface ArchiveFilters {
  virtueId: number | "all";
  type: "all" | "lapse" | "alignment";
}

// ── Note card ─────────────────────────────────────────────────────────────────

function NoteCard({
  note,
  onDelete,
  onUpdate,
}: {
  note: FranklinNote;
  onDelete: (id: string) => void;
  onUpdate: (id: string, note: string) => Promise<void>;
}) {
  const isLapse = note.type === "lapse";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.note);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(note.note);
  }, [note.note]);

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === note.note) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onUpdate(note.id, trimmed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border px-3 py-2.5 group transition-all",
        isLapse
          ? "border-rose-900/30 bg-rose-950/10"
          : "border-emerald-900/30 bg-emerald-950/10"
      )}
    >
      {/* Type indicator */}
      <div className="flex-shrink-0 mt-0.5">
        <span className={cn("text-sm", isLapse ? "text-rose-500" : "text-emerald-400")}>
          {isLapse ? "⬛" : "★"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span
            className={cn(
              "text-xs font-headline uppercase tracking-widest",
              isLapse ? "text-rose-400" : "text-emerald-400"
            )}
          >
            {note.virtueName}
          </span>
          <span className="text-xs text-zinc-400">
            {format(parseISO(note.date), "MMM d, yyyy")}
          </span>
        </div>
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full min-h-[72px] rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-200"
          />
        ) : (
          <p className="text-sm text-zinc-200 leading-snug">{note.note}</p>
        )}
      </div>

      <div className="flex flex-col gap-1 flex-shrink-0 self-start mt-0.5">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-zinc-400 active:text-emerald-400 transition-colors p-1 disabled:opacity-50"
              aria-label="Save note"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setDraft(note.note);
                setEditing(false);
              }}
              className="text-zinc-500 active:text-zinc-200 transition-colors p-1"
              aria-label="Cancel edit"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="text-zinc-500 active:text-cyan-400 transition-colors p-1"
              aria-label="Edit note"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(note.id)}
              className="text-zinc-500 active:text-rose-400 transition-colors p-1"
              aria-label="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Archive ──────────────────────────────────────────────────────────────

export function FranklinArchive() {
  const { settings, notes, deleteNote, updateNote } = useFranklin();
  const [filters, setFilters] = useState<ArchiveFilters>({
    virtueId: "all",
    type: "all",
  });

  const virtues = settings?.virtues ?? [];

  const filtered = useMemo<FranklinNote[]>(() => {
    return notes.filter((n) => {
      if (filters.virtueId !== "all" && n.virtueId !== filters.virtueId) return false;
      if (filters.type !== "all" && n.type !== filters.type) return false;
      return true;
    });
  }, [notes, filters]);

  // Group by weekKey for visual separation
  const grouped = useMemo(() => {
    const map = new Map<string, FranklinNote[]>();
    for (const n of filtered) {
      const arr = map.get(n.weekKey) ?? [];
      arr.push(n);
      map.set(n.weekKey, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const chipClass = (active: boolean) =>
    cn(
      "text-xs font-headline uppercase tracking-widest px-3 py-1.5 rounded border transition-colors",
      active
        ? "border-zinc-400 text-zinc-100 bg-zinc-800"
        : "border-zinc-600 text-zinc-400 bg-transparent"
    );

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="space-y-2">
        {/* Type filter */}
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "lapse", "alignment"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilters((f) => ({ ...f, type: t }))}
              className={chipClass(filters.type === t)}
            >
              {t === "all" ? "All Types" : t === "lapse" ? "⬛ Lapses" : "★ Alignments"}
            </button>
          ))}
        </div>

        {/* Virtue filter */}
        {virtues.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilters((f) => ({ ...f, virtueId: "all" }))}
              className={chipClass(filters.virtueId === "all")}
            >
              All Virtues
            </button>
            {virtues.map((v) => (
              <button
                key={v.id}
                onClick={() => setFilters((f) => ({ ...f, virtueId: v.id }))}
                className={chipClass(filters.virtueId === v.id)}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      {grouped.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-zinc-700 rounded-lg">
          <p className="text-sm text-zinc-400 uppercase tracking-widest">
            The Archive is empty.
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Log your first spot from the Crown Card.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([weekKey, weekNotes]) => (
            <div key={weekKey}>
              <p className="text-xs font-headline uppercase tracking-[0.4em] text-zinc-400 mb-2">
                Week of {format(parseISO(weekKey), "MMMM d, yyyy")}
              </p>
                <div className="space-y-1.5">
                  {weekNotes.map((n) => (
                    <NoteCard key={n.id} note={n} onDelete={deleteNote} onUpdate={updateNote} />
                  ))}
                </div>
              </div>
          ))}
        </div>
      )}
    </div>
  );
}
