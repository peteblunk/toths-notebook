"use client";

import { useState } from "react";
import { useFranklin } from "@/hooks/use-franklin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { HOLDING_TANK_VIRTUES, type FranklinVirtue } from "@/lib/franklin-types";

// ── Inline virtue row ─────────────────────────────────────────────────────────

interface VirtueRowProps {
  virtue: FranklinVirtue;
  isCurrentVirtue: boolean;
  onEdit: (v: FranklinVirtue) => void;
  onDelete: (id: number) => void;
}

function VirtueRow({ virtue, isCurrentVirtue, onEdit, onDelete }: VirtueRowProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(virtue.name);
  const [command, setCommand] = useState(virtue.command);

  const handleSave = () => {
    if (!name.trim()) return;
    onEdit({ ...virtue, name: name.trim(), command: command.trim() });
    setEditing(false);
  };

  const handleCancel = () => {
    setName(virtue.name);
    setCommand(virtue.command);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-3 space-y-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Virtue name"
          className="bg-black border-zinc-700 text-zinc-100 text-sm h-8 font-headline uppercase tracking-wider"
        />
        <Textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Behavioral directive…"
          className="bg-black border-zinc-700 text-zinc-300 text-xs resize-none min-h-[60px]"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={handleCancel} className="text-zinc-400 active:text-zinc-100 transition-colors p-2">
            <X className="w-4 h-4" />
          </button>
          <button onClick={handleSave} className="text-emerald-400 active:text-emerald-200 transition-colors p-2">
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-all",
        isCurrentVirtue
          ? "border-zinc-600 bg-zinc-900/80 shadow-[inset_0_0_12px_rgba(255,255,255,0.02)]"
          : "border-zinc-800/60 bg-zinc-950/40"
      )}
    >
      {/* Ordinal */}
      <span
        className={cn(
          "text-sm font-headline tabular-nums mt-0.5 w-5 flex-shrink-0",
          isCurrentVirtue ? "text-zinc-200" : "text-zinc-500"
        )}
      >
        {virtue.id}.
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-sm font-headline uppercase tracking-wider leading-tight",
              isCurrentVirtue ? "text-zinc-100" : "text-zinc-300"
            )}
          >
            {virtue.name}
          </p>
          {isCurrentVirtue && (
            <span className="text-[10px] font-headline uppercase tracking-widest text-zinc-400 border border-zinc-600 px-1.5 py-0.5 rounded">
              This Week
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{virtue.command}</p>
      </div>

      {/* Actions — always visible, 44px touch targets */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="text-zinc-400 active:text-zinc-100 transition-colors p-2"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(virtue.id)}
          className="text-zinc-400 active:text-rose-400 transition-colors p-2"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Add virtue form ───────────────────────────────────────────────────────────

function AddVirtueForm({ onAdd }: { onAdd: (v: Omit<FranklinVirtue, "id">) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [command, setCommand] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), command: command.trim() });
    setName("");
    setCommand("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-lg border-2 border-zinc-600 text-zinc-300 bg-zinc-900/40 active:bg-zinc-800/60 transition-colors text-sm font-headline uppercase tracking-widest"
      >
        <Plus className="w-4 h-4" />
        Add Virtue
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-3 space-y-2">
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Virtue name (e.g. Courage)"
        className="bg-black border-zinc-700 text-zinc-100 text-sm h-8 font-headline uppercase tracking-wider"
      />
      <Textarea
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Behavioral directive…"
        className="bg-black border-zinc-700 text-zinc-300 text-xs resize-none min-h-[60px]"
      />
      <div className="flex gap-2 justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setOpen(false); setName(""); setCommand(""); }}
          className="text-zinc-400 text-sm h-9 px-4"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!name.trim()}
          className="text-sm h-9 px-4 font-headline uppercase tracking-wider bg-black border-2 border-zinc-500 text-zinc-100"
        >
          Add
        </Button>
      </div>
    </div>
  );
}

// ── Main VirtueConfig ─────────────────────────────────────────────────────────

export function VirtueConfig() {
  const { settings, currentVirtue, updateVirtues } = useFranklin();

  if (!settings) return null;

  const virtues = settings.virtues;

  const handleEdit = async (updated: FranklinVirtue) => {
    const next = virtues.map((v) => (v.id === updated.id ? updated : v));
    await updateVirtues(next);
  };

  const handleDelete = async (id: number) => {
    const next = virtues
      .filter((v) => v.id !== id)
      .map((v, i) => ({ ...v, id: i + 1 })); // Re-number sequentially
    await updateVirtues(next);
  };

  const handleAdd = async (newVirtue: Omit<FranklinVirtue, "id">) => {
    const maxId = virtues.reduce((m, v) => Math.max(m, v.id), 0);
    const next = [...virtues, { ...newVirtue, id: maxId + 1 }];
    await updateVirtues(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-headline uppercase tracking-[0.4em] text-zinc-400">
          {virtues.length} Virtue{virtues.length !== 1 ? "s" : ""} · {virtues.length}-week cycle
        </p>
      </div>

      <div className="space-y-1.5">
        {virtues.map((v) => (
          <VirtueRow
            key={v.id}
            virtue={v}
            isCurrentVirtue={currentVirtue?.id === v.id}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <div className="pt-1">
        <AddVirtueForm onAdd={handleAdd} />
      </div>

      {virtues.length === 0 && (
        <p className="text-center text-[11px] text-zinc-700 py-4">
          No virtues configured. Add at least one to begin the cycle.
        </p>
      )}

      {/* ── Reserve / Holding Tank ── */}
      {(() => {
        const activeNames = new Set(virtues.map((v) => v.name.toLowerCase()));
        const available = HOLDING_TANK_VIRTUES.filter(
          (t) => !activeNames.has(t.name.toLowerCase())
        );
        if (available.length === 0) return null;
        return (
          <div className="mt-5 border-t border-zinc-800 pt-4 space-y-2">
            <p className="text-xs font-headline uppercase tracking-[0.4em] text-zinc-400 mb-2">
              More Virtues
            </p>
            {available.map((t) => (
              <div
                key={t.name}
                className="flex items-start gap-3 rounded-lg border border-zinc-800/50 bg-zinc-950/30 px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-headline uppercase tracking-wider text-zinc-400 leading-tight">
                    {t.name}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{t.command}</p>
                </div>
                <button
                  onClick={() => handleAdd({ name: t.name, command: t.command })}
                  className="flex-shrink-0 text-zinc-500 active:text-emerald-400 transition-colors p-2"
                  title={`Add ${t.name} to active list`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
