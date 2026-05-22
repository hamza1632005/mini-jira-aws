"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Task, TaskStatus } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { Badge } from "@/components/ui/badge";

const columnColors: Record<TaskStatus, string> = {
  ToDo: "bg-slate-50 border-slate-200",
  InProgress: "bg-blue-50 border-blue-200",
  InReview: "bg-violet-50 border-violet-200",
  Done: "bg-emerald-50 border-emerald-200",
};

const columnBadgeColors: Record<TaskStatus, string> = {
  ToDo: "bg-slate-200 text-slate-700",
  InProgress: "bg-blue-200 text-blue-700",
  InReview: "bg-violet-200 text-violet-700",
  Done: "bg-emerald-200 text-emerald-700",
};

const columnDotColors: Record<TaskStatus, string> = {
  ToDo: "bg-slate-400",
  InProgress: "bg-blue-500",
  InReview: "bg-violet-500",
  Done: "bg-emerald-500",
};

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  canDragTask: (task: Task) => boolean;
}

function KanbanColumn({ status, label, tasks, onTaskClick, canDragTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[500px] flex-1 flex-col rounded-2xl border-2 p-3 transition-colors ${
        isOver ? "border-primary bg-primary/5" : columnColors[status]
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${columnDotColors[status]}`} />
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${columnBadgeColors[status]}`}>
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.taskId}
            task={task}
            onClick={() => onTaskClick(task)}
            disabled={!canDragTask(task)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-border/60 text-xs text-muted-foreground py-8">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  canDragTask: (task: Task) => boolean;
  loading?: boolean;
}

export function KanbanBoard({ tasks, onTaskClick, canDragTask, loading }: KanbanBoardProps) {
  const columns: { id: TaskStatus; label: string }[] = [
    { id: "ToDo", label: "To Do" },
    { id: "InProgress", label: "In Progress" },
    { id: "InReview", label: "In Review" },
    { id: "Done", label: "Done" },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => (
          <div key={col.id} className="h-[500px] animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((col) => (
        <KanbanColumn
          key={col.id}
          status={col.id}
          label={col.label}
          tasks={tasks.filter((t) => t.status === col.id)}
          onTaskClick={onTaskClick}
          canDragTask={canDragTask}
        />
      ))}
    </div>
  );
}

export { KanbanColumn };
