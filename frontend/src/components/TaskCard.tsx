"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  disabled?: boolean;
}

const priorityVariant: Record<string, string> = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function TaskCard({ task, onClick, disabled }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.taskId,
    disabled,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-xl border bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? "opacity-40 shadow-xl ring-2 ring-primary/30" : ""
      } ${disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
      {...listeners}
      {...attributes}
    >
      <button type="button" onClick={onClick} className="w-full text-left space-y-2.5">
        <p className="font-semibold text-sm text-card-foreground leading-snug line-clamp-2">
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${priorityVariant[task.priority] ?? priorityVariant.Medium}`}>
            {task.priority}
          </span>
          {task.deadline && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(task.deadline).toLocaleDateString()}
            </span>
          )}
        </div>
        {task.assigneeUsername && (
          <div className="flex items-center gap-1 pt-0.5 border-t border-border">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground truncate">{task.assigneeUsername}</span>
          </div>
        )}
      </button>
    </div>
  );
}
