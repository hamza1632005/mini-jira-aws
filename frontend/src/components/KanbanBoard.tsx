"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Task, TaskStatus } from "@/lib/types";
import { TaskCard } from "./TaskCard";

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  canDragTask: (task: Task) => boolean;
}

function KanbanColumn({
  status,
  label,
  tasks,
  onTaskClick,
  canDragTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[400px] flex-1 flex-col rounded-xl border bg-zinc-50 p-3 ${
        isOver ? "border-blue-400 bg-blue-50" : "border-zinc-200"
      }`}
    >
      <h3 className="mb-3 text-sm font-bold text-zinc-900">
        {label}
        <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs">
          {tasks.length}
        </span>
      </h3>
      <div className="flex flex-1 flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.taskId}
            task={task}
            onClick={() => onTaskClick(task)}
            disabled={!canDragTask(task)}
          />
        ))}
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

export function KanbanBoard({
  tasks,
  onTaskClick,
  canDragTask,
  loading,
}: KanbanBoardProps) {
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
          <div
            key={col.id}
            className="h-96 animate-pulse rounded-xl bg-zinc-100"
          />
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

// Export for DndContext wrapper usage in parent
export { KanbanColumn };
