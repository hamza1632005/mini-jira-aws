"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import * as api from "@/lib/api";
import type { Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Users, Loader2, Pencil, Trash2, X, Check, UserPlus, UserMinus } from "lucide-react";

interface ManageTeamFormProps {
  token: string;
  teams: Team[];
  onTeamCreated: (t: Team) => void;
  onTeamUpdated: (t: Team) => void;
  onTeamDeleted: (id: string) => void;
}

interface Employee { userId: string; username: string; email: string; teamId: string | null; }
interface Member   { userId: string; username: string; email: string; }

export function ManageTeamForm({ token, teams, onTeamCreated, onTeamUpdated, onTeamDeleted }: ManageTeamFormProps) {
  const [teamName, setTeamName] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedEmployeeUsername, setSelectedEmployeeUsername] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [savingTeam, setSavingTeam] = useState(false);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  const [teamMembersMap, setTeamMembersMap] = useState<Record<string, Member[]>>({});
  const [loadingMembersFor, setLoadingMembersFor] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  useEffect(() => {
    setLoadingEmployees(true);
    api.getAllEmployees(token)
      .then(setAllEmployees)
      .catch(() => toast.error("Could not load employees"))
      .finally(() => setLoadingEmployees(false));
  }, [token]);

  async function handleCreateTeam(e: FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setCreatingTeam(true);
    try {
      const team = await api.createTeam(token, { name: teamName.trim() });
      toast.success("Team created");
      onTeamCreated(team);
      setTeamName("");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create team"); }
    finally { setCreatingTeam(false); }
  }

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    if (!selectedTeamId || !selectedEmployeeUsername) {
      toast.error("Select a team and an employee");
      return;
    }
    setAddingMember(true);
    try {
      await api.addTeamMember(token, selectedTeamId, selectedEmployeeUsername);
      toast.success("Member added");
      setSelectedEmployeeUsername("");
      // refresh member list if this team is being edited
      if (editingTeamId === selectedTeamId) await loadMembers(selectedTeamId);
      // refresh employee list so their teamId shows updated
      const updated = await api.getAllEmployees(token);
      setAllEmployees(updated);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to add member"); }
    finally { setAddingMember(false); }
  }

  async function loadMembers(teamId: string) {
    setLoadingMembersFor(teamId);
    try {
      const members = await api.getTeamMembers(token, teamId);
      setTeamMembersMap((prev) => ({ ...prev, [teamId]: members }));
    } catch { /* silent */ }
    finally { setLoadingMembersFor(null); }
  }

  function startEditing(team: Team) {
    setEditingTeamId(team.teamId);
    setEditingName(team.name);
    if (!teamMembersMap[team.teamId]) loadMembers(team.teamId);
  }

  async function handleSaveTeam(teamId: string) {
    if (!editingName.trim()) return;
    setSavingTeam(true);
    try {
      const updated = await api.updateTeam(token, teamId, { name: editingName.trim() });
      toast.success("Team renamed");
      onTeamUpdated(updated);
      setEditingTeamId(null);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to rename team"); }
    finally { setSavingTeam(false); }
  }

  async function handleDeleteTeam(teamId: string) {
    if (!confirm("Delete this team?")) return;
    setDeletingTeamId(teamId);
    try {
      await api.deleteTeam(token, teamId);
      toast.success("Team deleted");
      onTeamDeleted(teamId);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete team"); }
    finally { setDeletingTeamId(null); }
  }

  async function handleRemoveMember(teamId: string, userId: string) {
    setRemovingMemberId(userId);
    try {
      await api.removeTeamMember(token, teamId, userId);
      toast.success("Member removed");
      setTeamMembersMap((prev) => ({
        ...prev,
        [teamId]: (prev[teamId] || []).filter((m) => m.userId !== userId),
      }));
      const updated = await api.getAllEmployees(token);
      setAllEmployees(updated);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to remove member"); }
    finally { setRemovingMemberId(null); }
  }

  // Employees not yet in the selected team (for add dropdown)
  const availableEmployees = allEmployees.filter(
    (e) => !selectedTeamId || e.teamId !== selectedTeamId
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-primary" />
          Manage Teams
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Create Team */}
        <form onSubmit={handleCreateTeam} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Team</p>
          <div className="flex gap-2">
            <Input placeholder="Team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} required className="flex-1" />
            <Button type="submit" disabled={creatingTeam} className="shrink-0">
              {creatingTeam ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </div>
        </form>

        <Separator />

        {/* Add Member */}
        <form onSubmit={handleAddMember} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Add Member
          </p>
          <Select value={selectedTeamId} onValueChange={(v) => { setSelectedTeamId(v ?? ""); setSelectedEmployeeUsername(""); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select team">
                {selectedTeamId ? teams.find(t => t.teamId === selectedTeamId)?.name : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>{teams.map((t) => <SelectItem key={t.teamId} value={t.teamId}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedEmployeeUsername} onValueChange={(v) => setSelectedEmployeeUsername(v ?? "")} disabled={!selectedTeamId || loadingEmployees}>
            <SelectTrigger>
              <SelectValue placeholder={loadingEmployees ? "Loading…" : "Select employee"}>
                {selectedEmployeeUsername
                  ? (allEmployees.find(e => e.username === selectedEmployeeUsername)?.email ?? selectedEmployeeUsername)
                  : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableEmployees.length === 0
                ? <SelectItem value="__none__" disabled>No employees available</SelectItem>
                : availableEmployees.map((e) => (
                    <SelectItem key={e.userId} value={e.username}>{e.email}</SelectItem>
                  ))
              }
            </SelectContent>
          </Select>
          <Button type="submit" disabled={addingMember || !selectedTeamId || !selectedEmployeeUsername} variant="secondary" className="w-full">
            {addingMember ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding…</> : "Add to Team"}
          </Button>
        </form>

        {/* Existing Teams */}
        {teams.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Existing Teams</p>
              <ul className="space-y-2">
                {teams.map((t) => (
                  <li key={t.teamId} className="rounded-lg border bg-muted/30 px-3 py-2 space-y-2">
                    {editingTeamId === t.teamId ? (
                      <>
                        {/* Rename row */}
                        <div className="flex gap-2">
                          <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} autoFocus className="h-8 flex-1 text-sm" />
                          <Button size="sm" onClick={() => handleSaveTeam(t.teamId)} disabled={savingTeam} className="h-8 px-2">
                            {savingTeam ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingTeamId(null)} className="h-8 px-2">
                            <X className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Members list */}
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">Members</p>
                          {loadingMembersFor === t.teamId ? (
                            <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" /> Loading members…
                            </div>
                          ) : (teamMembersMap[t.teamId] || []).length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">No members yet</p>
                          ) : (
                            <ul className="space-y-1">
                              {(teamMembersMap[t.teamId] || []).map((m) => (
                                <li key={m.userId} className="flex items-center justify-between rounded-md bg-background px-2 py-1 text-xs border">
                                  <span className="truncate">{m.email}</span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                                    onClick={() => handleRemoveMember(t.teamId, m.userId)}
                                    disabled={removingMemberId === m.userId}
                                  >
                                    {removingMemberId === m.userId
                                      ? <Loader2 className="h-3 w-3 animate-spin" />
                                      : <UserMinus className="h-3 w-3" />}
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t.name}</span>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditing(t)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteTeam(t.teamId)} disabled={deletingTeamId === t.teamId}>
                            {deletingTeamId === t.teamId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
