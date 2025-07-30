"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Task, TaskImportance, Subtask } from "@/lib/types";
import { Pencil, X } from "lucide-react";

// THE FIX IS HERE: Added subtasks to the schema
const subtaskSchema = z.object({
  text: z.string(),
  completed: z.boolean(),
});

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  importance: z.enum(['low', 'medium', 'high']),
  estimatedTime: z.coerce.number().min(1, "Estimated time must be at least 1 minute."),
  details: z.string().optional(),
  subtasks: z.array(subtaskSchema).optional(),
});

type EditRitualDialogProps = {
  ritual: Task;
};

export function EditRitualDialog({ ritual }: EditRitualDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  // State to manage subtasks within the dialog
  const [subtasks, setSubtasks] = useState<Subtask[]>(ritual.subtasks || []);
  const [subtaskText, setSubtaskText] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: ritual.title,
      importance: ritual.importance,
      estimatedTime: ritual.estimatedTime,
      details: ritual.details || "",
      subtasks: ritual.subtasks || [],
    },
  });

  // Reset form and subtask state when the dialog is opened/closed
  useEffect(() => {
    if (open) {
      form.reset({
        title: ritual.title,
        importance: ritual.importance,
        estimatedTime: ritual.estimatedTime,
        details: ritual.details || "",
      });
      setSubtasks(ritual.subtasks || []);
    }
  }, [open, ritual, form]);

  const handleAddSubtask = () => {
    if (subtaskText.trim()) {
      setSubtasks([...subtasks, { text: subtaskText, completed: false }]);
      setSubtaskText("");
    }
  };

  const handleRemoveSubtask = (indexToRemove: number) => {
    setSubtasks(subtasks.filter((_, index) => index !== indexToRemove));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const ritualDocRef = doc(db, "dailyRituals", ritual.id);
    try {
      // Include the updated subtasks array in the payload
      await updateDoc(ritualDocRef, { ...values, subtasks });
      toast({ title: "Success", description: "Ritual has been updated." });
      setOpen(false);
    } catch (error) {
      console.error("Error updating ritual: ", error);
      toast({ title: "Error", description: "Could not update ritual.", variant: 'destructive' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
            <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">Edit Daily Ritual</DialogTitle>
          <DialogDescription>
            Update the template for this recurring task.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ritual Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details / Prayer Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add the text of a prayer or other notes..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* --- NEW SUBTASK MANAGEMENT SECTION --- */}
            <div>
              <FormLabel>Default Sub-tasks</FormLabel>
              <div className="space-y-2 mt-2">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center gap-2 bg-background/50 p-2 rounded-md">
                    <p className="flex-1 text-sm">{subtask.text}</p>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveSubtask(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={subtaskText}
                  onChange={(e) => setSubtaskText(e.target.value)}
                  placeholder="Add a new sub-task..."
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); }}}
                />
                <Button type="button" onClick={handleAddSubtask}>Add</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="importance"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Importance</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="estimatedTime"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Est. Time (min)</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
