"use client";

import { format } from "date-fns";
import { Calendar, Clock, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  task: Task;
  onTaskCompletionChange: (taskId: string, completed: boolean) => void;
};

const importanceStyles = {
  high: "border-l-4 border-accent",
  medium: "border-l-4 border-secondary",
  low: "border-l-4 border-primary",
};

export function TaskCard({ task, onTaskCompletionChange }: TaskCardProps) {
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}
