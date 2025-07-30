"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";

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
  FormDescription,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Task, TaskCategory, TaskImportance, Subtask } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const subtaskSchema = z.object({
  text: z.string(),
  completed: z.boolean(),
});

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  category: z.enum(['Today', 'Daily Rituals', 'Sacred Duties', 'Special Missions', 'Grand Expeditions']),
  importance: z.enum(['low', 'medium', 'high']),
  dueDate: z.date(),
  estimatedTime: z.coerce.number().min(1, "Estimated time must be at least 1 minute."),
  details: z.string().optional(),
  subtasks: z.array(subtaskSchema).optional(),
});

const categoryDescriptions: Record<TaskCategory, string> = {
  'Today': 'Tasks to be done today.',
  'Daily Rituals': 'Tasks that repeat every day.',
  'Sacred Duties': 'Core duties and recurring obligations.',
  'Special Missions': 'Unique, one-off objectives with specific goals.',
  'Grand Expeditions': 'Large, long-term projects with multiple phases.',
};

type AddTaskDialogProps = {
  onTaskAdd: (task: Omit<Task, 'id' | 'completed'>) => void;
};

export function AddTaskDialog({ onTaskAdd }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [subtaskText, setSubtaskText] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      category: 'Today',
      importance: 'medium',
      dueDate: new Date(),
      estimatedTime: 30,
      details: "",
      subtasks: [],
    },
  });

  const handleAddSubtask = () => {
    if (subtaskText.trim()) {
      setSubtasks([...subtasks, { text: subtaskText, completed: false }]);
      setSubtaskText("");
    }
  };

  const handleRemoveSubtask = (indexToRemove: number) => {
    setSubtasks(subtasks.filter((_, index) => index !== indexToRemove));
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newTaskData = {
      ...values,
      subtasks, // Make sure the local subtasks state is included
    };
    onTaskAdd(newTaskData);
    form.reset();
    setSubtasks([]);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">Scribe a New Task</DialogTitle>
          <DialogDescription>
            Record your next objective. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Decipher ancient texts" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Today">Today</SelectItem>
                      <SelectItem value="Daily Rituals">Daily Rituals</SelectItem>
                      <SelectItem value="Sacred Duties">Sacred Duties</SelectItem>
                      <SelectItem value="Special Missions">Special Missions</SelectItem>
                      <SelectItem value="Grand Expeditions">Grand Expeditions</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {categoryDescriptions[field.value as TaskCategory]}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes, links, or the text of a prayer..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Sub-tasks</FormLabel>
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
                        </Trigger>
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
                        <Input type="number" placeholder="e.g., 60" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Add Task</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
