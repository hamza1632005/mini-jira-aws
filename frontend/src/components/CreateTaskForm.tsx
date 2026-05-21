"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import * as api from "@/lib/api";
import type { Project, Task, Team } from "@/lib/types";
import { inputClass, selectClass } from "@/lib/styles";

interface CreateTaskFormProps {
  token: string;
  teams: Team[];
  projects: Project[];
  onCreated: (task: Task) => void;
}

export function CreateTaskForm({
  token,
  teams,
  projects,
  onCreated,
}: CreateTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [deadline, setDeadline] = useState("");
  const [teamId, setTeamId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const teamProjects = projects.filter((p) => !teamId || p.teamId === teamId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title || !teamId) {
      toast.error("Title and team are required");
      return;
    }
    setSubmitting(true);
    try {
      const task = await api.createTask(token, {
        title,
        description: description || undefined,
        priority,
        deadline: deadline || undefined,
        teamId,
        assigneeId: assigneeId || undefined,
        projectId: projectId || undefined,
      });
      toast.success("Task created");
      onCreated(task);
      setTitle("");
      setDescription("");
      setDeadline("");
      setAssigneeId("");
      setProjectId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="font-semibold text-zinc-900">Create Task</h3>

      <input
        type="text"
        placeholder="Title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={inputClass}
        required
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className={inputClass}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className={selectClass}
        >
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className={inputClass}
        />
      </div>
      <select
        value={teamId}
        onChange={(e) => {
          setTeamId(e.target.value);
          setProjectId("");
        }}
        className={selectClass + " w-full"}
        required
      >
        <option value="">Select team *</option>
        {teams.map((t) => (
          <option key={t.teamId} value={t.teamId}>
            {t.name}
          </option>
        ))}
      </select>
      <select
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
        className={selectClass + " w-full"}
      >
        <option value="">No project</option>
        {teamProjects.map((p) => (
          <option key={p.projectId} value={p.projectId}>
            {p.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Assignee ID"
        value={assigneeId}
        onChange={(e) => setAssigneeId(e.target.value)}
        className={inputClass}
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create Task"}
      </button>
    </form>
  );
}
