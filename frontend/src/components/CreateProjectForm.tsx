"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import * as api from "@/lib/api";
import type { Project, Team } from "@/lib/types";
import { inputClass, selectClass } from "@/lib/styles";

interface CreateProjectFormProps {
  token: string;
  teams: Team[];
  onCreated: (project: Project) => void;
}

export function CreateProjectForm({
  token,
  teams,
  onCreated,
}: CreateProjectFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name || !teamId) {
      toast.error("Name and team are required");
      return;
    }
    setSubmitting(true);
    try {
      const project = await api.createProject(token, {
        name,
        description: description || undefined,
        teamId,
      });
      toast.success("Project created");
      onCreated(project);
      setName("");
      setDescription("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="font-semibold text-zinc-900">Create Project</h3>

      <input
        type="text"
        placeholder="Project name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
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
      <select
        value={teamId}
        onChange={(e) => setTeamId(e.target.value)}
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
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create Project"}
      </button>
    </form>
  );
}
