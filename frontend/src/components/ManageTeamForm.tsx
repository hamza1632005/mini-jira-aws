"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import * as api from "@/lib/api";
import type { Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Users, Loader2, Pencil, Trash2, X, Check, UserPlus } from "lucide-react";

interface ManageTeamFormProps {
  token: string; teams: Team[];
  onTeamCreated: (t: Team) => void;
  onTeamUpdated: (t: Team) => void;
  onTeamDeleted: (id: string) => void;
}

export function ManageTeamForm({ token, teams, onTeamCreated, onTeamUpdated, onTeamDeleted }: ManageTeamFormProps) {
  const [teamName, setTeamName] = useState(""); const [creatingTeam, setCreatingTeam] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(""); const [memberUsername, setMemberUsername] = useState(""); const [addingMember, setAddingMember] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null); const [editingName, setEditingName] = useState(""); const [savingTeam, setSavingTeam] = useState(false); const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  async function handleCreateTeam(e: FormEvent) {
    e.preventDefault(); if (!teamName.trim()) return; setCreatingTeam(true);
    try { const team = await api.createTeam(token, { name: teamName.trim() }); toast.success("Team created"); onTeamCreated(team); setTeamName(""); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create team"); }
    finally { setCreatingTeam(false); }
  }

  async function handleAddMember(e: FormEvent) {
    e.preventDefault(); if (!selectedTeamId || !memberUsername.trim()) { toast.error("Team and username are required"); return; } setAddingMember(true);
    try { await api.addTeamMember(token, selectedTeamId, memberUsername.trim()); toast.success("Member added"); setMemberUsername(""); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed to add member"); }
    finally { setAddingMember(false); }
  }

  async function handleSaveTeam(teamId: string) {
    if (!editingName.trim()) return; setSavingTeam(true);
    try { const updated = await api.updateTeam(token, teamId, { name: editingName.trim() }); toast.success("Team renamed"); onTeamUpdated(updated); setEditingTeamId(null); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed to rename team"); }
    finally { setSavingTeam(false); }
  }

  async function handleDeleteTeam(teamId: string) {
    if (!confirm("Delete this team?")) return; setDeletingTeamId(teamId);
    try { await api.deleteTeam(token, teamId); toast.success("Team deleted"); onTeamDeleted(teamId); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete team"); }
    finally { setDeletingTeamId(null); }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-primary" />
          Manage Teams
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <form onSubmit={handleAddMember} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Add Member
          </p>
          <Select value={selectedTeamId} onValueChange={(v) => setSelectedTeamId(v ?? "")} required>
            <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
            <SelectContent>{teams.map((t) => <SelectItem key={t.teamId} value={t.teamId}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input placeholder="Username" value={memberUsername} onChange={(e) => setMemberUsername(e.target.value)} required className="flex-1" />
            <Button type="submit" disabled={addingMember} variant="secondary" className="shrink-0">
              {addingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </div>
        </form>

        {teams.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Existing Teams</p>
              <ul className="space-y-1.5">
                {teams.map((t) => (
                  <li key={t.teamId} className="rounded-lg border bg-muted/30 px-3 py-2">
                    {editingTeamId === t.teamId ? (
                      <div className="flex gap-2">
                        <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} autoFocus className="h-8 flex-1 text-sm" />
                        <Button size="sm" onClick={() => handleSaveTeam(t.teamId)} disabled={savingTeam} className="h-8 px-2">
                          {savingTeam ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingTeamId(null)} className="h-8 px-2"><X className="h-3 w-3" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t.name}</span>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingTeamId(t.teamId); setEditingName(t.name); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteTeam(t.teamId)} disabled={deletingTeamId === t.teamId}>
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
