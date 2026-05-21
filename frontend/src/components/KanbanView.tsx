"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { toast } from "sonner";
import * as api from "@/lib/api";
import type { Task, TaskStatus } from "@/lib/types";
import { STATUS_TRANSITIONS } from "@/lib/types";
import { KanbanBoard } from "./KanbanBoard";
import { TaskCard } from "./TaskCard";
import { TaskDetailModal } from "./TaskDetailModal";
import { useAuth } from "@/context/AuthContext";

interface KanbanViewProps {
  teamFilter?: string;
}

export function KanbanView({ teamFilter }: KanbanViewProps) {
  const { token, user, isManager } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const loadTasks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.getTasks(token, teamFilter || undefined);
      setTasks(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [token, teamFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  function canDragTask(task: Task): boolean {
    if (isManager) return task.status !== "Done";
    return (
      task.assigneeId === user?.userId &&
      task.status !== "Done" &&
      (STATUS_TRANSITIONS[task.status]?.length ?? 0) > 0
    );
  }

  async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    if (!token) return;
    const task = tasks.find((t) => t.taskId === taskId);
    if (!task) return;

    const allowed = STATUS_TRANSITIONS[task.status] || [];
    if (!allowed.includes(newStatus)) {
      toast.error(`Cannot move from ${task.status} to ${newStatus}`);
      return;
    }

    try {
      const updated = await api.updateTaskStatus(token, taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.taskId === taskId ? updated : t))
      );
      if (selectedTask?.taskId === taskId) setSelectedTask(updated);
      toast.success("Status updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.taskId === taskId);
    if (!task || task.status === newStatus) return;

    if (!canDragTask(task)) {
      toast.error("You cannot move this task");
      return;
    }

    handleStatusChange(taskId, newStatus);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={(e) => {
          const task = tasks.find((t) => t.taskId === e.active.id);
          setActiveTask(task || null);
        }}
        onDragEnd={handleDragEnd}
      >
        <KanbanBoard
          tasks={tasks}
          onTaskClick={setSelectedTask}
          canDragTask={canDragTask}
          loading={loading}
        />
        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              onClick={() => {}}
              disabled
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailModal
        task={selectedTask}
        token={token!}
        onClose={() => setSelectedTask(null)}
        onUpdated={(updated) => {
          setTasks((prev) =>
            prev.map((t) => (t.taskId === updated.taskId ? updated : t))
          );
          setSelectedTask(updated);
        }}
      />
    </>
  );
}
