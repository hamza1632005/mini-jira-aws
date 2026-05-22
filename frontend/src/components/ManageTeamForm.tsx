"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import * as api from "@/lib/api";
import type { Team } from "@/lib/types";
import { inputClass, selectClass } from "@/lib/styles";

interface ManageTeamFormProps {
  token: string;
  teams: Team[];
  onTeamCreated: (team: Team) => void;
  onTeamUpdated: (team: Team) => void;
  onTeamDeleted: (teamId: string) => void;
}

export function ManageTeamForm({ token, teams, onTeamCreated, onTeamUpdated, onTeamDeleted }: ManageTeamFormProps) {
  const [teamName, setTeamName] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [memberUsername, setMemberUsername] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [savingTeam, setSavingTeam] = useState(false);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  async function handleCreateTeam(e: FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setCreatingTeam(true);
    try {
      const team = await api.createTeam(token, { name: teamName.trim() });
      toast.success("Team created");
      onTeamCreated(team);
      setTeamName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setCreatingTeam(false);
    }
  }

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    if (!selectedTeamId || !memberUsername.trim()) {
      toast.error("Team and username are required");
      return;
    }
    setAddingMember(true);
    try {
      await api.addTeamMember(token, selectedTeamId, memberUsername.trim());
      toast.success("Member added to team");
      setMemberUsername("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAddingMember(false);
    }
  }

  async function handleSaveTeam(teamId: string) {
    if (!editingName.trim()) return;
    setSavingTeam(true);
    try {
      const updated = await api.updateTeam(token, teamId, { name: editingName.trim() });
      toast.success("Team renamed");
      onTeamUpdated(updated);
      setEditingTeamId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename team");
    } finally {
      setSavingTeam(false);
    }
  }

  async function handleDeleteTeam(teamId: string) {
    if (!confirm("Delete this team? This cannot be undone.")) return;
    setDeletingTeamId(teamId);
    try {
      await api.deleteTeam(token, teamId);
      toast.success("Team deleted");
      onTeamDeleted(teamId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete team");
    } finally {
      setDeletingTeamId(null);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="font-semibold text-zinc-900">Manage Teams</h3>

      <form onSubmit={handleCreateTeam} className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">New Team</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Team name *"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className={inputClass}
            required
          />
          <button
            type="submit"
            disabled={creatingTeam}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {creatingTeam ? "…" : "Create"}
          </button>
        </div>
      </form>

      <form onSubmit={handleAddMember} className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Add Member</p>
        <select
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          className={selectClass + " w-full"}
          required
        >
          <option value="">Select team *</option>
          {teams.map((t) => (
            <option key={t.teamId} value={t.teamId}>{t.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Username *"
            value={memberUsername}
            onChange={(e) => setMemberUsername(e.target.value)}
            className={inputClass}
            required
          />
          <button
            type="submit"
            disabled={addingMember}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {addingMember ? "…" : "Add"}
          </button>
        </div>
      </form>

      {teams.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Existing Teams</p>
          <ul className="space-y-1">
            {teams.map((t) => (
              <li key={t.teamId} className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                {editingTeamId === t.teamId ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className={inputClass}
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveTeam(t.teamId)}
                      disabled={savingTeam}
                      className="shrink-0 rounded-lg bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {savingTeam ? "…" : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingTeamId(null)}
                      className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-800">{t.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingTeamId(t.teamId); setEditingName(t.name); }}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(t.teamId)}
                        disabled={deletingTeamId === t.teamId}
                        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        {deletingTeamId === t.teamId ? "…" : "Delete"}
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
