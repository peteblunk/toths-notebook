"use client";

import { useState, useRef } from 'react';
import { type Task } from '@/lib/types';
import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { EditRitualDialog } from './edit-ritual-dialog';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CyberJar } from '@/components/icons/cyber-jar';
import { CyberStylus } from '@/components/icons/cyber-stylus';
import { CyberAnkh } from '@/components/icons/cyber-ankh';

interface TaskCardProps {
  task: Task;
  onTaskCompletionChange?: (taskId: string, completed: boolean) => void;
  onTaskDelete?: (taskId: string) => void;
  onToggle?: () => void;
  collectionName?: string; 
}

export function TaskCard({ 
  task, 
  onTaskCompletionChange, 
  onTaskDelete, 
  onToggle, 
  collectionName = "tasks" 
}: TaskCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // --- LOGIC ---
  const isPtah = (task as any).tags?.includes('Gift of Ptah');
  const isPink = task.id.charCodeAt(task.id.length - 1) % 2 !== 0;
  const isChronicle = (task as any).category === "Chronicle";

  const handleCheckboxChange = (checked: boolean) => {
    if (onTaskCompletionChange) {
      onTaskCompletionChange(task.id, checked);
    }
    if (onToggle) {
        onToggle();
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

  const handleToggleStatus = () => {
    handleCheckboxChange(!task.completed);
    setIsDialogOpen(false);
  };

  const handleSubtaskToggle = async (index: number) => {
    if (!task.subtasks) return;
    
    const newSubtasks = [...task.subtasks];
    newSubtasks[index] = { 
        ...newSubtasks[index], 
        completed: !newSubtasks[index].completed 
    };

    try {
        const taskRef = doc(db, collectionName, task.id);
        await updateDoc(taskRef, { subtasks: newSubtasks });
    } catch (error) {
        console.error("Error toggling subtask:", error);
    }
  };

  // --- STYLING ---
  const containerClasses = cn(
    "rounded-xl border transition-all duration-500 cursor-pointer group relative overflow-hidden backdrop-blur-md",
    !task.completed && [
        "p-5",
        "bg-gradient-to-br from-slate-950 via-[#0a0f1e] to-[#0f0518]", 
        "border-l-4", 
        "hover:scale-[1.01]",
        isPtah && [
            "border-l-emerald-500",
            "border-y border-y-emerald-500/50 border-r border-r-emerald-500/50",
            "shadow-[0_0_20px_rgba(16,185,129,0.25)]",
            "hover:border-l-emerald-400 hover:border-y-emerald-500 hover:border-r-emerald-500",
            "hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
        ],
        !isPtah && !isPink && [
            "border-l-purple-500",
            "border-y border-y-purple-500/50 border-r border-r-purple-500/50",
            "shadow-[0_0_20px_rgba(168,85,247,0.25)]",
            "hover:border-l-purple-400 hover:border-y-purple-500 hover:border-r-purple-500",
            "hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
        ],
        !isPtah && isPink && [
            "border-l-fuchsia-500",
            "border-y border-y-fuchsia-500/50 border-r border-r-fuchsia-500/50",
            "shadow-[0_0_20px_rgba(217,70,239,0.25)]",
            "hover:border-l-fuchsia-400 hover:border-y-fuchsia-500 hover:border-r-fuchsia-500",
            "hover:shadow-[0_0_30px_rgba(217,70,239,0.5)]"
        ]
    ],
    task.completed && [
        "py-5 px-6", 
        "flex flex-col items-center text-center justify-center", 
        task.title !== "Oath of Commitment" && [
            "bg-gradient-to-br from-amber-50 via-white to-amber-100", 
            "border-amber-400 border-2",                         
            "shadow-[0_0_30px_rgba(251,191,36,0.4)]",       
            "hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(251,191,36,0.6)]",
        ],
        task.title === "Oath of Commitment" && [
            "bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200", 
            "border-amber-500 border-4", 
            "shadow-[0_0_60px_rgba(251,191,36,0.8)]", 
            "scale-[1.0]", 
            "mb-6", 
            "z-20" 
        ],
        isChronicle && [
            "bg-slate-950", 
            "border-2 border-cyan-500", 
            "shadow-[0_0_30px_rgba(34,211,238,0.4)]", 
            "hover:shadow-[0_0_50px_rgba(34,211,238,0.6)]",
            "hover:scale-[1.01]",
            "mb-4"
        ]
    ]
  );

  const titleClasses = cn(
    "transition-all duration-500 font-display tracking-wider w-full",
    !task.completed && "font-medium text-lg text-slate-100 text-left",
    task.completed && "text-2xl font-black text-amber-800 uppercase tracking-[0.1em] drop-shadow-sm text-center mb-2",
    task.completed && task.title === "Oath of Commitment" && "font-black text-amber-950 drop-shadow-md",
    task.completed && isChronicle && "text-cyan-400 font-display tracking-[0.2em]"
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
                        !task.completed && isPtah && "data-[state=checked]:bg-emerald-500 border-emerald-500",
                        !task.completed && !isPtah && !isPink && "data-[state=checked]:bg-purple-500 border-purple-500",
                        !task.completed && !isPtah && isPink && "data-[state=checked]:bg-fuchsia-500 border-fuchsia-500",
                        task.completed && "data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-600 border-amber-600 data-[state=checked]:text-white w-8 h-8 rounded-full shadow-sm mb-2"
                    )}
                />
                
                <div className={cn("flex-1 space-y-1 w-full", task.completed && "flex flex-col items-center")}>
                    <h3 className={titleClasses}>
                        {task.completed && task.title === "Oath of Commitment" ? (
                            <span className={cn("flex items-center justify-center gap-4", "pl-2")}>
                                <CyberAnkh className="w-8 h-8 text-amber-900/80" />
                                <span>{task.title}</span>
                                <CyberAnkh className="w-8 h-8 text-amber-900/80" />
                            </span>
                        ) : (
                            task.title
                        )}
                    </h3>

                    {!task.completed && (
                        <div className="flex flex-wrap items-center gap-3 justify-start">
                            <Badge 
                                variant="outline" 
                                className={cn(
                                    "bg-opacity-30 border", 
                                    isPtah && "border-emerald-800 text-emerald-400 bg-emerald-950",
                                    !isPtah && !isPink && "border-purple-800 text-purple-400 bg-purple-950",
                                    !isPtah && isPink && "border-fuchsia-800 text-fuchsia-400 bg-fuchsia-950"
                                )}
                            >
                                {task.category}
                            </Badge>

                            {/* SAFETY FIX: Wrap task.dueDate in 'new Date()' 
   This ensures that whether it's a string, number, or Date object,
   date-fns receives a valid object it can understand.
*/}
{task.dueDate && !isNaN(new Date(task.dueDate).getTime()) && (
    <span className="text-xs font-mono text-slate-200 font-medium">
        {format(new Date(task.dueDate), 'MMM d')}
    </span>
)}

                            {task.estimatedTime && (
                                <span className="text-xs font-mono text-slate-200 font-medium">
                                    {task.estimatedTime}m
                                </span>
                            )}
                        </div>
                    )}
                </div>
           </div>

           {/* ACTION FOOTER */}
           {!task.completed && (
               <div className="mt-2 flex items-center justify-start relative z-10">
                   <Button 
                       variant="ghost" 
                       size="sm" 
                       onClick={handleDetailsClick} 
                       className={cn(
                           "pl-0 transition-colors duration-300",
                           isPtah && "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50",
                           !isPtah && !isPink && "text-purple-400 hover:text-purple-300 hover:bg-purple-950/50",
                           !isPtah && isPink && "text-fuchsia-400 hover:text-fuchsia-300 hover:bg-fuchsia-950/50"
                       )}
                   >
                       <ExternalLink className="w-3 h-3 mr-2" /> 
                       <span className="font-mono text-xs tracking-wider font-bold">DETAILS</span>
                   </Button>
               </div>
           )}
        </div>
      </div>

      {/* VIEW DETAILS DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
             <DialogTitle className="sr-only">Task Details: {task.title}</DialogTitle>

             <div className="grid gap-4 py-4">
                 <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4">
                    <h2 className={cn("text-2xl font-headline tracking-wider", task.completed ? "text-amber-400" : "text-cyan-400")}>
                        {task.title}
                    </h2>
                 </div>
                 
                 <div className="grid gap-6">
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

                    {/* INTERACTIVE SUBTASKS SECTION */}
                    {task.subtasks && task.subtasks.length > 0 && (
                        <div className="space-y-2">
                             <h4 className="text-xs font-bold text-cyan-600 uppercase tracking-widest">Ritual Steps</h4>
                             <div className="space-y-2">
                                {task.subtasks.map((st, idx) => (
                                    <div 
                                        key={idx} 
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded border transition-all duration-500",
                                            st.completed 
                                                ? "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.3)]" 
                                                : "bg-slate-900/50 border-cyan-900/30 hover:border-cyan-500/50"
                                        )}
                                    >
                                        <Checkbox 
                                            checked={st.completed} 
                                            onCheckedChange={() => handleSubtaskToggle(idx)}
                                            className={cn(
                                                "rounded-full w-5 h-5 transition-all duration-300",
                                                st.completed
                                                    ? "border-amber-600 data-[state=checked]:bg-amber-600 data-[state=checked]:text-white"
                                                    : "border-cyan-500 data-[state=checked]:bg-cyan-500 data-[state=checked]:text-black"
                                            )}
                                        />
                                        
                                        <span className={cn(
                                            "text-sm transition-all duration-300 flex-1", 
                                            st.completed 
                                                ? "text-amber-900 font-bold text-right tracking-wide" 
                                                : "text-slate-200"
                                        )}>
                                            {st.text}
                                        </span>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}

                    {/* ACTION FOOTER */}
                    <div className="flex items-center justify-between pt-6 border-t border-cyan-900/30 mt-4 gap-2">
                         
                         <div 
                           role="button"
                           onClick={handleEditClick}
                           className={cn(
                               "group/stylus cursor-pointer",
                               "flex flex-col items-center justify-center px-4 py-2 rounded-md", 
                               "text-cyan-500 hover:text-cyan-300 hover:bg-cyan-950/30", 
                               "transition-all duration-300 active:scale-95 border border-transparent hover:border-cyan-500/20",
                               "w-24 h-20"
                           )}
                           title="Edit Ritual"
                         >
                            <CyberStylus className="w-10 h-10 mb-1" /> 
                            <span className="tracking-[0.1em] font-display text-[10px] uppercase opacity-80 group-hover/stylus:opacity-100 font-bold">
                                Edit
                            </span>
                         </div>

                         <div
                           role="button"
                           onClick={handleToggleStatus}
                           className={cn(
                               "group/complete cursor-pointer",
                               "flex flex-col items-center justify-center px-6 py-2 rounded-md border", 
                               "transition-all duration-500 active:scale-95",
                               "w-32 h-24 -mt-2", 
                               task.completed
                                   ? "border-slate-700 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-950/30" 
                                   : "border-amber-500/50 text-amber-500 bg-amber-500/5 hover:bg-amber-500/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]" 
                           )}
                         >
                            <CyberAnkh className={cn(
                                "w-12 h-12 mb-1 transition-transform duration-500",
                                !task.completed && "group-hover/complete:scale-110"
                            )} />
                            
                            <span className={cn(
                                "tracking-[0.15em] font-display text-xs uppercase font-bold",
                                task.completed ? "group-hover/complete:text-cyan-300" : "group-hover/complete:text-amber-300"
                            )}>
                                {task.completed ? "Restore" : "Sanctify"}
                            </span>
                         </div>

                         {/* SAFETY LOCK: ONLY RENDER BANISH IF IT IS NOT A RITUAL */}
                         {!task.isRitual && (
                             <div 
                               role="button"
                               onClick={handleDeleteClick}
                               className={cn(
                                   "group/modal-jar cursor-pointer",
                                   "flex flex-col items-center justify-center px-4 py-2 rounded-md", 
                                   "text-red-500 hover:text-red-400 hover:bg-red-950/30", 
                                   "transition-all duration-300 active:scale-95 border border-transparent hover:border-red-500/20",
                                   "w-24 h-20"
                               )}
                               title="Banish Ritual"
                             >
                                <CyberJar className="w-10 h-10 mb-1" /> 
                                <span className="tracking-[0.1em] font-display text-[10px] uppercase opacity-80 group-hover/modal-jar:opacity-100 font-bold">
                                    Banish
                                </span>
                             </div>
                         )}

                    </div>
                 </div>
            </div>
        </DialogContent>
      </Dialog>

      <EditRitualDialog
        task={task}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        collectionName={collectionName}
      />
    </>
  );
}