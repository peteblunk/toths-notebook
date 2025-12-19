"use client";

import { useState } from 'react';
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
    if (!confirm("Are you sure you want to banish this ritual?")) return;

    try {
      const taskRef = doc(db, collectionName, task.id);
      await deleteDoc(taskRef);

      toast({ title: "Ritual Banished", description: "Removed from the scrolls." });
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting ritual:", error);
      toast({ title: "Error", description: "Could not delete.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-headline text-cyan-400 tracking-wide">Edit Ritual</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-cyan-400">Ritual Name</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-900 border-cyan-900 focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="time" className="text-cyan-400">Est. Time (min)</Label>
              <Input
                id="time"
                type="number"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                className="bg-slate-900 border-cyan-900 focus:border-cyan-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="importance" className="text-cyan-400">Importance</Label>
              <select
                id="importance"
                value={importance}
                onChange={(e) => setImportance(e.target.value as 'low' | 'medium' | 'high')}
                className="flex h-10 w-full rounded-md border border-cyan-900 bg-slate-900 px-3 py-2 text-sm text-white"
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
    <Label htmlFor="dueDate" className="text-cyan-400 font-display text-[10px] uppercase tracking-widest ml-1">
      Adjust Due Date
    </Label>
    
    {/* The Capture Zone: Clicking ANYWHERE in this div triggers the date picker */}
    <div 
      className="relative group cursor-pointer"
      onClick={() => {
        // Find the hidden input and trigger the browser's native picker
        const input = document.getElementById('dueDate-hidden') as HTMLInputElement;
        if (input) input.showPicker();
      }}
    >
      <div className="flex items-center justify-between h-14 px-4 bg-black border-2 border-cyan-900/50 rounded-md group-hover:border-cyan-500 transition-all duration-300 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] group-hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]">
        <span className="text-white font-mono tracking-wider">
          {dueDate ? format(new Date(dueDate), "PPPP") : "NO DATE SET"}
        </span>
        <CalendarIcon className="w-6 h-6 text-cyan-500 group-hover:text-cyan-300 transition-colors" />
      </div>

      {/* The Hidden Actual Input: We hide it visually but keep it for the showPicker() functionality */}
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

            <div className="space-y-2 mt-2 max-h-[150px] overflow-y-auto pr-1">
              {subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-cyan-900/30 group">
                  <span className="flex-1 text-sm truncate">{subtask.text}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                    onClick={() => handleDeleteSubtask(index)}
                  >
                    <CyberJar className="w-5 h-5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

<DialogFooter className="flex !flex-col gap-4 w-full pt-6 mt-4 border-t border-cyan-900/30">
  
  {/* TOP ROW: SECONDARY OPTIONS */}
  <div className="flex flex-row gap-4 w-full">
    
    {/* CANCEL - Now flex-1 by default, but visually stable */}
    <div 
      role="button"
      onClick={() => onOpenChange(false)} 
      className={cn(
        "h-16 rounded-md border-2 border-slate-800 flex items-center justify-center bg-black cursor-pointer transition-all duration-300 group hover:border-slate-400",
        isSacredInstance ? "w-full" : "flex-1" // Spans full width if Banish is hidden
      )}
    >
      <span className="font-display font-bold uppercase tracking-[0.3em] text-slate-500 group-hover:text-white text-sm">
        CANCEL
      </span>
    </div>

    {/* BANISH - THE SACRED GUARD FIX */}
    {!isSacredInstance && (
      <div
        role="button"
        onClick={handleDeleteRitual}
        className="flex-1 h-16 bg-black border-2 border-red-900/20 hover:border-red-500 text-red-900 hover:text-red-500 font-display font-bold uppercase tracking-[0.3em] text-sm transition-all duration-300 rounded-md flex items-center justify-center gap-4 p-0 shadow-[0_0_15px_rgba(153,27,27,0.1)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] cursor-pointer group"
      >
        <CyberJar className="w-10 h-10 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
        <span className="leading-none">BANISH</span>
      </div>
    )}
  </div>

  {/* BOTTOM ROW: THE FULL-WIDTH SAVE DECREE */}
  <div 
    role="button"
    onClick={handleSave} 
    className={cn(
      "w-full h-20 rounded-md flex items-center justify-center gap-6 cursor-pointer", 
      CYBER_BUTTON_STYLE,
      "!bg-black hover:!bg-black p-0"
    )}
  >
    <CyberStylus className="w-12 h-12 animate-pulse shrink-0" />
    <span className="font-display font-bold uppercase tracking-[0.4em] text-base leading-none">
      SAVE
    </span>
  </div>
</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}