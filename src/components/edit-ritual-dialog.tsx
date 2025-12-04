import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Task, Subtask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
// 👇 Added deleteDoc to imports
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trash2, Plus } from 'lucide-react';

interface EditRitualDialogProps {
  task: Task; 
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRitualDialog({ task, open, onOpenChange }: EditRitualDialogProps) {
  if (!task) return null;

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
    const newSubtasks = [...subtasks];
    newSubtasks.splice(index, 1);
    setSubtasks(newSubtasks);
  };

  const handleSave = async () => {
    try {
      // 👇 FIX: Changed 'tasks' to 'dailyRituals'
      const taskRef = doc(db, 'dailyRituals', task.id);
      
      await updateDoc(taskRef, {
        title,
        details,
        estimatedTime: parseInt(estimatedTime) || 0,
        importance,
        subtasks
      });

      toast({
        title: "Ritual Updated",
        description: "Your changes have been saved to the archives.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating ritual:", error);
      toast({
        title: "Error",
        description: "Failed to update ritual. Check console.",
        variant: "destructive",
      });
    }
  };

  // 👇 NEW: Handle Delete Logic (Solves Issue #11)
  const handleDeleteRitual = async () => {
    if (!confirm("Are you sure you want to remove this Ritual forever?")) return;

    try {
        const taskRef = doc(db, 'dailyRituals', task.id);
        await deleteDoc(taskRef);
        
        toast({ title: "Ritual Banished", description: "Removed from your daily templates." });
        onOpenChange(false);
    } catch (error) {
        console.error("Error deleting ritual:", error);
        toast({ title: "Error", description: "Could not delete.", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-950 border-cyan-800 text-slate-100">
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
                   <div key={index} className="flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-cyan-900/30">
                      <span className="flex-1 text-sm truncate">{subtask.text}</span>
                      <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                         onClick={() => handleDeleteSubtask(index)}
                      >
                         <Trash2 className="h-3 w-3" />
                      </Button>
                   </div>
                ))}
             </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between w-full">
           {/* 👇 NEW: The Delete Button for Issue #11 */}
          <Button 
            variant="destructive" 
            onClick={handleDeleteRitual}
            className="bg-red-900/50 hover:bg-red-900 border border-red-800 text-red-200 mr-auto"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-cyan-800 text-cyan-400 hover:bg-cyan-950">Cancel</Button>
            <Button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold">Save Changes</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
