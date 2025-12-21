"use client";

import { useState } from 'react';
import { BanishmentPortal } from './banishment-portal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Task, Subtask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus } from 'lucide-react';
import { DuamatefHead } from '@/components/icons/duamatef-head';
import { DuamatefJar } from '@/components/icons/duamatef-jar';
import { CyberJar } from '@/components/icons/cyber-jar';
import { CyberStylus } from './icons/cyber-stylus';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { CATEGORY_LABELS } from "@/lib/types"; // Summon the Sacred Labels
const CYBER_BUTTON_STYLE = `
  font-headline font-bold uppercase tracking-widest 
  bg-black hover:bg-black 
  text-cyan-400 hover:text-cyan-300 
  border-2 border-cyan-400 hover:border-cyan-300 
  shadow-[0_0_10px_rgba(34,211,238,0.5)] 
  hover:shadow-[0_0_20px_rgba(34,211,238,0.8)] 
  transition-all duration-300
`;

interface EditRitualDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionName?: string;
}

export function EditRitualDialog({ task, open, onOpenChange, collectionName = "tasks" }: EditRitualDialogProps) {
  if (!task) return null;

  const [title, setTitle] = useState(task.title);
  const [details, setDetails] = useState(task.details || '');
  const [estimatedTime, setEstimatedTime] = useState(task.estimatedTime?.toString() || '');
  const [importance, setImportance] = useState(task.importance);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [showBanishConfirm, setShowBanishConfirm] = useState(false);

  // Safely handle the date conversion to avoid the toISOString crash
  const [dueDate, setDueDate] = useState<string>(() => {
    if (!task.dueDate) return '';

    try {
      // Convert Firestore Timestamp or String to a JS Date object
      const dateObj = (task.dueDate as any).toDate
        ? (task.dueDate as any).toDate()
        : new Date(task.dueDate);

      // Verify it's a valid date before calling toISOString
      return isNaN(dateObj.getTime()) ? '' : dateObj.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  });
  // Logic to hide the Banish button for instances in the task list
  const isSacredInstance = collectionName === "tasks" && (task.isRitual || !!(task as any).originRitualId) ||
    task.category === CATEGORY_LABELS.RITUAL;

  const { toast } = useToast();

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    setSubtasks([...subtasks, { text: newSubtaskText, completed: false }]);
    setNewSubtaskText('');
  };

  const handleDeleteSubtask = (index: number) => {
    const newSubtasks = [...subtasks];
    newSubtasks.splice(index, 1);
    setSubtasks(newSubtasks);
  };

  const canEditDate = collectionName === "tasks" && !isSacredInstance;
  const handleSave = async () => {
    try {
      const taskRef = doc(db, collectionName, task.id);

      // We build the update payload here
      await updateDoc(taskRef, {
        title,
        details,
        estimatedTime: parseInt(estimatedTime) || 0,
        importance,
        subtasks,

        // --- STEP 3: THE PERSISTENCE PERSUASION ---
        // This only adds 'dueDate' to the update if canEditDate is true
        ...(canEditDate && {
          dueDate: dueDate ? new Date(dueDate) : null
        })
      });

      toast({
        title: "Archives Updated",
        description: "The timeline has been adjusted in the scrolls.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating archive:", error);
      toast({
        title: "Error",
        description: "The scribe failed to record the changes.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRitual = async () => {
    try {
      const taskRef = doc(db, collectionName, task.id);
      await deleteDoc(taskRef);

      toast({ title: "Ritual Banished", description: "Removed from the scrolls." });
      onOpenChange(false);
      setShowBanishConfirm(false);
    } catch (error) {
      console.error("Error deleting ritual:", error);
      toast({ title: "Error", description: "Could not delete.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 1. We apply the scroll logic directly to the DialogContent to match Production */}
      <DialogContent className="w-[95vw] max-w-[400px] bg-black border-cyan-900/50 p-6 rounded-lg max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col gap-0">

        <DialogHeader className="mb-4">
          <DialogTitle className="text-center font-headline text-2xl text-primary">
            Edit Ritual
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-primary">Ritual Name</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="cyber-input font-body"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="time" className="text-primary">Est. Time (min)</Label>
              <Input
                id="time"
                type="number"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                className="cyber-input font-body"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="importance" className="text-primary">Importance</Label>
              <select
                id="importance"
                value={importance}
                onChange={(e) => setImportance(e.target.value as 'low' | 'medium' | 'high')}
                className="cyber-input font-body"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* --- THE TIMELINE GATE (Full-Area Trigger) --- */}
          {canEditDate && (
            <div className="grid gap-2 mb-6 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="dueDate" className="text-primary font-headline text-[10px] uppercase tracking-widest ml-1">
                Adjust Due Date
              </Label>

              {/* The Capture Zone: Now an Altar of Time */}
              <div
                className="relative group cursor-pointer"
                onClick={() => {
                  const input = document.getElementById('dueDate-hidden') as HTMLInputElement;
                  if (input) input.showPicker();
                }}
              >
                <div className="cyber-input flex items-center justify-between h-14 px-4 font-body">
                  <span className="text-foreground tracking-wider">
                    {dueDate ? format(new Date(dueDate), "PPPP") : "NO DATE SET"}
                  </span>
                  <CalendarIcon className="w-6 h-6 text-primary group-hover:text-cyan-300 transition-colors" />
                </div>

                {/* The Hidden Actual Input remains unchanged for logic */}
                <input
                  id="dueDate-hidden"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                />
              </div>
            </div>
          )}


          <div className="grid gap-2">
            <Label htmlFor="details" className="text-cyan-400">Details / Notes</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="bg-slate-900 border-cyan-900 focus:border-cyan-500 min-h-[100px]"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-cyan-400">Subtasks</Label>
            <div className="flex gap-2">
              <Input
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                placeholder="Add a step..."
                className="bg-slate-900 border-cyan-900"
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
              />
              <Button onClick={handleAddSubtask} size="icon" variant="outline" className="border-cyan-700 text-cyan-400 hover:bg-cyan-950">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 mt-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
              {subtasks.map((subtask, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-altar/30 p-2 pl-4 rounded border border-border/30 group transition-all hover:bg-altar/50"
                >
                  <span className="flex-1 text-sm font-body text-slate-300 truncate">
                    {subtask.text}
                  </span>

                  {/* THE UNBOUND SENTINEL: Larger icon, zero-padding hit area */}
                  <div
                    role="button"
                    onClick={() => handleDeleteSubtask(index)}
                    /* Removing 'group' and 'hover' - adding 'active' for tactile feedback */
                    className="w-12 h-12 flex items-center justify-center cursor-pointer transition-all active:scale-75 active:opacity-100 shrink-0 select-none"
                  >
                    <DuamatefHead
                      className={cn(
                        "w-10 h-10 transition-all duration-200",
                        /* Base state: Subtle and respectful of the Void */
                        "text-red-600 active:drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]",
                        /* Active state: The flare of banishment occurs only on touch */
                        "active:text-red-600 active:drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

<DialogFooter className="flex flex-col gap-4 w-full pt-6 mt-4 border-t border-cyan-900/30">
  {/* ROW 1: ESCAPE & BANISH (Desktop: More compact) */}
  <div className="flex flex-row gap-4 w-full items-stretch">
  {/* ESCAPE: Now using the White/Lunar style */}
  <div
    role="button"
    onClick={() => onOpenChange(false)}
    className={cn(
      "cyber-input-white flex items-center justify-center cursor-pointer",
      "h-20 md:h-14", // Shorter on desktop
      isSacredInstance ? "w-full" : "flex-1"
    )}
  >
    <span className="font-headline font-bold uppercase tracking-[0.3em] text-sm md:text-xs">
      ESCAPE
    </span>
  </div>

  {/* BANISH: Keeping the Red-Head Sentinel */}
  {!isSacredInstance && (
    <BanishmentPortal onConfirm={handleDeleteRitual} ritualTitle={title}>
      <div
        role="button"
        className={cn(
          "flex-1 rounded-md border-2 border-red-600 flex items-center justify-center bg-black cursor-pointer transition-all active:scale-95 active:bg-red-950/40",
          "h-20 md:h-14" // Match the Escape button height
        )}
      >
        <DuamatefJar className="w-14 h-14 md:w-8 md:h-8 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
      </div>
    </BanishmentPortal>
  )}
</div>

  {/* ROW 2: SAVE (Desktop: Less massive) */}
  <div
    role="button"
    onClick={handleSave}
    className={cn(
      "w-full h-20 md:h-16 rounded-md flex items-center justify-center gap-6 cursor-pointer",
      CYBER_BUTTON_STYLE,
      "border-2 border-cyan-400 active:scale-95"
    )}
  >
    <CyberStylus className="w-12 h-12 md:w-8 md:h-8 animate-pulse text-cyan-400" />
    <span className="font-headline font-bold uppercase tracking-[0.4em] text-lg md:text-base text-cyan-400">
      SAVE
    </span>
  </div>
</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}