"use client";

import { format } from "date-fns";
import { Calendar, Clock, Tag, ExternalLink, Trash2 } from "lucide-react"; // Added Trash2 icon
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

// --- THE FIX IS HERE ---
// We've updated the props to accept the onTaskDelete function
type TaskCardProps = {
  task: Task;
  onTaskCompletionChange: (taskId: string, completed: boolean) => void;
  onTaskDelete: (taskId: string) => void; // Added this line
};

const importanceStyles = {
  high: "border-l-4 border-accent",
  medium: "border-l-4 border-secondary",
  low: "border-l-4 border-primary",
};

// Destructure the new onTaskDelete prop
export function TaskCard({ task, onTaskCompletionChange, onTaskDelete }: TaskCardProps) {
  return (
    <Card
      className={cn(
        "bg-card/50 backdrop-blur-sm transition-all duration-300 hover:bg-card/70",
        importanceStyles[task.importance],
        task.completed && "opacity-50"
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle
          className={cn(
            "text-lg font-medium text-foreground",
            task.completed && "line-through"
          )}
        >
          {task.title}
        </CardTitle>
        <Checkbox
          checked={task.completed}
          onCheckedChange={(checked) => onTaskCompletionChange(task.id, !!checked)}
          aria-label={`Mark task ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
          className="h-6 w-6 rounded-full"
        />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(task.dueDate, "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{task.estimatedTime} min</span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <Badge variant="outline">{task.category}</Badge>
          </div>
        </div>
        <div className="mt-4 flex justify-end items-center gap-2">
           {/* --- THE FIX IS HERE --- */}
           {/* We've added a new button for deleting the task. */}
           <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onTaskDelete(task.id)} // It calls the function passed down from TaskList
           >
             <Trash2 className="h-4 w-4" />
             <span className="sr-only">Delete Task</span>
           </Button>

           <Button asChild variant="ghost" size="sm">
             <Link href={`/task/${task.id}`}>
               Details
               <ExternalLink className="ml-2 h-4 w-4" />
             </Link>
           </Button>
        </div>
      </CardContent>
    </Card>
  );
}
