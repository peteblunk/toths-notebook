"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Task, Subtask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, X } from 'lucide-react';
import { CyberStylus } from './icons/cyber-stylus';
import { DuamatefHead } from './icons/duamatef-head';
import { cn } from '@/lib/utils';

interface EditRitualTemplateDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRitualTemplateDialog({ task, open, onOpenChange }: EditRitualTemplateDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [details, setDetails] = useState(task.details || '');
  const [estimatedTime, setEstimatedTime] = useState(task.estimatedTime?.toString() || '');
  const [importance, setImportance] = useState(task.importance);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  
  const { toast } = useToast();

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    setSubtasks([...subtasks, { text: newSubtaskText, completed: false }]);
    setNewSubtaskText('');
  };

  const handleDeleteSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      const ritualRef = doc(db, "dailyRituals", task.id);
      await updateDoc(ritualRef, {
        title,
        details,
        estimatedTime: parseInt(estimatedTime) || 0,
        importance,
        subtasks,
      });

      toast({ title: "Template Recorded", description: "The blueprint is secured." });
      onOpenChange(false);
    } catch (error) {
      console.error("Blueprint failure:", error);
      toast({ 
        title: "Error", 
        description: "The scribe failed to record the changes.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[400px] bg-black border-cyan-900/50 p-6 rounded-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-center font-headline text-2xl text-primary uppercase tracking-widest">
            Edit Ritual Template
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-primary opacity-70">Ritual Identity</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="cyber-input" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-primary opacity-70">Est. Time (min)</Label>
              <Input type="number" value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} className="cyber-input" />
            </div>
            <div className="grid gap-2">
              <Label className="text-primary opacity-70">Importance</Label>
              <select value={importance} onChange={(e) => setImportance(e.target.value as any)} className="cyber-input bg-black">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-cyan-400 opacity-70">Details / Wisdom</Label>
            <Textarea value={details} onChange={(e) => setDetails(e.target.value)} className="bg-slate-900 border-cyan-900 min-h-[100px]" />
          </div>

          <div className="grid gap-2">
            <Label className="text-cyan-400 opacity-70">Blueprint Steps</Label>
            <div className="flex gap-2">
              <Input value={newSubtaskText} onChange={(e) => setNewSubtaskText(e.target.value)} placeholder="Add a step..." className="bg-slate-900 border-cyan-900" onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()} />
              <Button onClick={handleAddSubtask} size="icon" variant="outline" className="border-cyan-700 text-cyan-400"><Plus className="h-4 w-4" /></Button>
            </div>
           <div className="space-y-2 mt-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
  {subtasks.map((subtask, index) => (
    <div
      key={index}
      className="flex items-center gap-3 bg-slate-900/30 p-2 pl-4 rounded border border-cyan-900/30 group transition-all"
    >
      <span className="flex-1 text-sm font-body text-slate-300 truncate">
        {subtask.text}
      </span>

      {/* THE UNBOUND SENTINEL: Restored for Template Banishment */}
      <div
        role="button"
        onClick={() => handleDeleteSubtask(index)}
        className="w-12 h-12 flex items-center justify-center cursor-pointer transition-all active:scale-75 active:opacity-100 shrink-0 select-none"
      >
        <DuamatefHead
          className={cn(
            "w-10 h-10 transition-all duration-200",
            "text-red-600 active:drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]",
            "active:text-red-600 active:drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]"
          )}
        />
      </div>
    </div>
  ))}
</div>
          </div>
        </div>

        <DialogFooter className="pt-4 mt-2 border-t border-cyan-900/30">
          <div role="button" onClick={handleSave} className="w-full h-16 rounded-md flex items-center justify-center gap-4 cursor-pointer border-2 border-cyan-400 bg-black text-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all active:scale-95">
            <CyberStylus className="w-10 h-10 animate-pulse" />
            <span className="font-headline font-bold uppercase tracking-[0.3em]">save blueprint</span>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}