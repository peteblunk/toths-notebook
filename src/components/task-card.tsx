import { useState, useRef } from 'react';
import { type Task } from '@/lib/types';
import { format } from 'date-fns';
import { Calendar, Clock, Tag, Trash2, Pencil, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { EditRitualDialog } from './edit-ritual-dialog';
// 👇 NEW IMPORTS for updating subtasks
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TaskCardProps {
  task: Task;
  onTaskCompletionChange?: (taskId: string, completed: boolean) => void;
  onTaskDelete?: (taskId: string) => void;
}

export function TaskCard({ task, onTaskCompletionChange, onTaskDelete }: TaskCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCheckboxChange = (checked: boolean) => {
    if (onTaskCompletionChange) {
      onTaskCompletionChange(task.id, checked);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTaskDelete) {
      onTaskDelete(task.id);
    }
    setIsDialogOpen(false);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditOpen(true);
    setIsDialogOpen(false);
  }
  
  const handleDetailsClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDialogOpen(true);
  }

  // 👇 NEW: Handle Subtask Toggling directly in the View Dialog
  const handleSubtaskToggle = async (index: number) => {
    if (!task.subtasks) return;
    
    // Create a copy of the subtasks array
    const newSubtasks = [...task.subtasks];
    // Toggle the specific subtask
    newSubtasks[index] = { 
        ...newSubtasks[index], 
        completed: !newSubtasks[index].completed 
    };

    try {
        // Update Firestore immediately
        const taskRef = doc(db, 'tasks', task.id);
        await updateDoc(taskRef, { subtasks: newSubtasks });
    } catch (error) {
        console.error("Error toggling subtask:", error);
    }
  };

  // --- STYLING LOGIC ---
  const containerClasses = cn(
    "rounded-lg border transition-all duration-500 cursor-pointer group relative overflow-hidden",
    
    // NUN (Incomplete)
    !task.completed && [
        "p-4",
        "bg-slate-900/80 border-cyan-800/50 hover:border-cyan-500/80 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
    ],
    
    // MA'AT (Complete)
    task.completed && [
        "py-5 px-6", 
        "bg-gradient-to-br from-amber-100 via-white to-amber-200", 
        "border-amber-400 border-2",                         
        "shadow-[0_0_30px_rgba(251,191,36,0.5)]",       
        "hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(251,191,36,0.7)]",
        "flex flex-col items-center text-center justify-center"
    ]
  );

  const titleClasses = cn(
    "transition-all duration-500 font-display tracking-wider w-full",
    !task.completed && "font-medium text-lg text-slate-100 text-left",
    task.completed && "text-2xl font-black text-amber-800 uppercase tracking-[0.1em] drop-shadow-sm text-center mb-2"
  );

  return (
    <>
      <div ref={cardRef} className={containerClasses} onClick={handleDetailsClick}>
        {!task.completed && (
             <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 mix-blend-overlay"></div>
        )}
        {task.completed && (
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shine z-0" />
        )}

        <div className={cn("relative z-10 w-full", !task.completed ? "flex items-center justify-between gap-4" : "flex flex-col items-center gap-1")}>
           
           <div className={cn("flex items-start gap-4 flex-1", task.completed && "w-full justify-center")}>
                <Checkbox
                    checked={task.completed}
                    onCheckedChange={handleCheckboxChange}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                        "transition-all duration-500 border-2 mt-1",
                        !task.completed && "data-[state=checked]:bg-cyan-500 border-cyan-700",
                        task.completed && "data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-600 border-amber-600 data-[state=checked]:text-white w-8 h-8 rounded-full shadow-sm mb-2"
                    )}
                />
                
                <div className={cn("flex-1 space-y-1 w-full", task.completed && "flex flex-col items-center")}>
                    <h3 className={titleClasses}>
                        {task.title}
                    </h3>

                    {!task.completed && (
                        <div className="flex flex-wrap items-center gap-3 justify-start">
                            {task.dueDate && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4 text-cyan-500" />
                                    <span className="text-xs font-mono text-slate-400">{format(task.dueDate, 'MMM d')}</span>
                                </div>
                            )}
                            {task.estimatedTime && (
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-cyan-500" />
                                    <span className="text-xs font-mono text-slate-400">{task.estimatedTime}m</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <Tag className="w-4 h-4 text-cyan-500" />
                                <Badge variant="outline" className="border-cyan-800 text-cyan-400 bg-cyan-950/30">
                                    {task.category}
                                </Badge>
                            </div>
                        </div>
                    )}
                </div>
           </div>

           {!task.completed && (
               <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleDetailsClick} 
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/50 hidden sm:flex"
                    >
                        <ExternalLink className="w-4 h-4 mr-2" /> Details
                    </Button>

                    <Button variant="ghost" size="icon" onClick={handleDeleteClick} className="text-red-400 hover:text-red-300 hover:bg-red-950/50">
                        <Trash2 className="w-4 h-4" />
                    </Button>
               </div>
           )}
        </div>
      </div>

      {/* VIEW DETAILS DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-950 border-cyan-800 text-slate-100">
             <DialogTitle className="sr-only">Task Details: {task.title}</DialogTitle>

             <div className="grid gap-4 py-4">
                 <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4">
                    <h2 className={cn("text-2xl font-headline tracking-wider", task.completed ? "text-amber-400" : "text-cyan-400")}>
                        {task.title}
                    </h2>
                 </div>
                 
                  <div className="grid gap-6">
                    {/* Details/Notes Section */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-cyan-600 uppercase tracking-widest">Scribe Notes</h4>
                        <div className="bg-slate-900/50 p-4 rounded-md border border-cyan-900/30 min-h-[80px]">
                            {task.details ? (
                                <p className="text-slate-300 font-mono text-sm whitespace-pre-wrap leading-relaxed">{task.details}</p>
                            ) : (
                                <p className="text-slate-600 italic text-sm">No additional details scribed.</p>
                            )}
                        </div>
                    </div>

                    {/* 👇 NEW: INTERACTIVE SUBTASKS SECTION */}
                    {task.subtasks && task.subtasks.length > 0 && (
                        <div className="space-y-2">
                             <h4 className="text-xs font-bold text-cyan-600 uppercase tracking-widest">Ritual Steps</h4>
                             <div className="space-y-2">
                                {task.subtasks.map((st, idx) => (
                                    <div 
                                        key={idx} 
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded border transition-all",
                                            st.completed 
                                                ? "bg-slate-900/30 border-slate-800" 
                                                : "bg-slate-900/50 border-cyan-900/30 hover:border-cyan-500/50"
                                        )}
                                    >
                                        {/* Interactive Radio/Checkbox */}
                                        <Checkbox 
                                            checked={st.completed} 
                                            onCheckedChange={() => handleSubtaskToggle(idx)}
                                            className="rounded-full w-5 h-5 border-cyan-500 data-[state=checked]:bg-cyan-500 data-[state=checked]:text-black"
                                        />
                                        
                                        <span className={cn(
                                            "text-sm transition-all",
                                            st.completed ? 'line-through text-slate-600' : 'text-slate-200'
                                        )}>
                                            {st.text}
                                        </span>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}

                    {/* Action Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-cyan-900/30">
                         <Button variant="outline" onClick={handleEditClick} className="border-cyan-700 text-cyan-400 hover:bg-cyan-950">
                            <Pencil className="w-4 h-4 mr-2" /> Edit Task
                         </Button>

                         <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400 hover:bg-red-950/30" onClick={handleDeleteClick}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                    </div>
                  </div>
            </div>
        </DialogContent>
      </Dialog>

      <EditRitualDialog
        task={task}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
}