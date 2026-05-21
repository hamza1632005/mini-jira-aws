"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Task } from "@/lib/types";
import { PRIORITY_COLORS } from "@/lib/types";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  disabled?: boolean;
}

export function TaskCard({ task, onClick, disabled }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.taskId,
      disabled,
    });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const priorityClass =
    PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-zinc-200 bg-white p-3 shadow-sm ${
        isDragging ? "opacity-50 shadow-lg" : ""
      } ${disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
      {...listeners}
      {...attributes}
    >
      <button type="button" onClick={onClick} className="w-full text-left">
        <p className="font-medium text-zinc-900">{task.title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`rounded border px-1.5 py-0.5 text-xs ${priorityClass}`}>
            {task.priority}
          </span>
          {task.deadline && (
            <span className="text-xs text-zinc-500">
              Due {new Date(task.deadline).toLocaleDateString()}
            </span>
          )}
        </div>
        {task.assigneeId && (
          <p className="mt-1 truncate text-xs text-zinc-400">
            Assignee: {task.assigneeId.slice(0, 8)}…
          </p>
        )}
      </button>
    </div>
  );
}
