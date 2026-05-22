"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import * as api from "@/lib/api";
import type { Project, Team } from "@/lib/types";
import { inputClass, selectClass } from "@/lib/styles";

interface CreateProjectFormProps {
  token: string;
  teams: Team[];
  projects: Project[];
  onCreated: (project: Project) => void;
  onUpdated: (project: Project) => void;
  onDeleted: (projectId: string) => void;
}

export function CreateProjectForm({
  token,
  teams,
  projects,
  onCreated,
  onUpdated,
  onDeleted,
}: CreateProjectFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function handleSave(projectId: string) {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const updated = await api.updateProject(token, projectId, {
        name: editName.trim(),
        description: editDescription || undefined,
      });
      toast.success("Project updated");
      onUpdated(updated);
      setEditingId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(projectId: string) {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setDeletingId(projectId);
    try {
      await api.deleteProject(token, projectId);
      toast.success("Project deleted");
      onDeleted(projectId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="font-semibold text-zinc-900">Manage Projects</h3>

      <form onSubmit={handleSubmit} className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">New Project</p>
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
            <option key={t.teamId} value={t.teamId}>{t.name}</option>
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

      {projects.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Existing Projects</p>
          <ul className="space-y-1">
            {projects.map((p) => (
              <li key={p.projectId} className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                {editingId === p.projectId ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={inputClass}
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description"
                      className={inputClass}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(p.projectId)}
                        disabled={saving}
                        className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? "…" : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-800">{p.name}</p>
                      {p.description && (
                        <p className="text-xs text-zinc-500">{p.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingId(p.projectId); setEditName(p.name); setEditDescription(p.description || ""); }}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.projectId)}
                        disabled={deletingId === p.projectId}
                        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        {deletingId === p.projectId ? "…" : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
