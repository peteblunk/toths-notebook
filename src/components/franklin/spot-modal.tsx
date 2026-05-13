"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface SpotModalProps {
  open: boolean;
  type: "lapse" | "alignment";
  virtueName: string;
  onConfirm: (note: string) => void;
  onClose: () => void;
}

export function SpotModal({
  open,
  type,
  virtueName,
  onConfirm,
  onClose,
}: SpotModalProps) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isLapse = type === "lapse";

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onConfirm(note);
    } finally {
      setSubmitting(false);
      setNote("");
      onClose();
    }
  };

  const handleClose = () => {
    setNote("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className={cn(
          "max-w-sm bg-black border-2 p-0 overflow-hidden",
          isLapse ? "border-rose-800/70" : "border-emerald-700/70"
        )}
      >
        <DialogTitle className="sr-only">
          Log {isLapse ? "Black Spot" : "Bright Spot"} for {virtueName}
        </DialogTitle>

        {/* Header band */}
        <div
          className={cn(
            "px-5 py-4 border-b",
            isLapse
              ? "border-rose-900/50 bg-rose-950/30"
              : "border-emerald-900/50 bg-emerald-950/30"
          )}
        >
          <p
            className={cn(
              "text-xs font-headline uppercase tracking-[0.35em] mb-0.5",
              isLapse ? "text-rose-400" : "text-emerald-400"
            )}
          >
            {isLapse ? "⬛ Black Spot — Lapse Logged" : "★ Bright Spot — Alignment"}
          </p>
          <h2 className="text-base font-headline uppercase tracking-widest text-zinc-100">
            {virtueName}
          </h2>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-zinc-300 leading-relaxed">
            {isLapse
              ? "Record the context of this failure. Specificity breeds correction."
              : "Note what produced this alignment. Specificity breeds repetition."}
          </p>
          <Textarea
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              isLapse
                ? "Failed Order: desk was a mess after shift…"
                : "Industry: finished module 2 hours ahead of schedule…"
            }
            className={cn(
              "bg-zinc-950 border resize-none text-sm text-zinc-200 placeholder:text-zinc-700 min-h-[90px]",
              isLapse ? "border-rose-900/50" : "border-emerald-900/50"
            )}
          />
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-zinc-400 text-sm h-10 px-4 font-headline uppercase tracking-wider"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={submitting}
            onClick={handleSubmit}
            className={cn(
              "text-sm h-10 px-4 font-headline uppercase tracking-[0.2em] border-2",
              isLapse
                ? "bg-black border-rose-700 text-rose-400"
                : "bg-black border-emerald-700 text-emerald-400"
            )}
          >
            {submitting ? "Sealing…" : "Record"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
