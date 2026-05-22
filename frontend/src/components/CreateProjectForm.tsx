"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import * as api from "@/lib/api";
import type { Project, Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { FolderOpen, Loader2, Pencil, Trash2, X, Check } from "lucide-react";

interface CreateProjectFormProps {
  token: string; teams: Team[]; projects: Project[];
  onCreated: (p: Project) => void;
  onUpdated: (p: Project) => void;
  onDeleted: (id: string) => void;
}

export function CreateProjectForm({ token, teams, projects, onCreated, onUpdated, onDeleted }: CreateProjectFormProps) {
  const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [teamId, setTeamId] = useState(""); const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); const [editName, setEditName] = useState(""); const [editDescription, setEditDescription] = useState(""); const [saving, setSaving] = useState(false); const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name || !teamId) { toast.error("Name and team are required"); return; }
    setSubmitting(true);
    try {
      const project = await api.createProject(token, { name, description: description || undefined, teamId });
      toast.success("Project created"); onCreated(project); setName(""); setDescription("");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create project"); }
    finally { setSubmitting(false); }
  }

  async function handleSave(projectId: string) {
    if (!editName.trim()) return; setSaving(true);
    try {
      const updated = await api.updateProject(token, projectId, { name: editName.trim(), description: editDescription || undefined });
      toast.success("Project updated"); onUpdated(updated); setEditingId(null);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to update project"); }
    finally { setSaving(false); }
  }

  async function handleDelete(projectId: string) {
    if (!confirm("Delete this project?")) return; setDeletingId(projectId);
    try { await api.deleteProject(token, projectId); toast.success("Project deleted"); onDeleted(projectId); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete project"); }
    finally { setDeletingId(null); }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderOpen className="h-4 w-4 text-primary" />
          Manage Projects
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Project</p>
          <div className="space-y-1.5">
            <Label htmlFor="proj-name">Name <span className="text-destructive">*</span></Label>
            <Input id="proj-name" placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proj-desc">Description</Label>
            <Textarea id="proj-desc" placeholder="Optional" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="resize-none" />
          </div>
          <div className="space-y-1.5">
            <Label>Team <span className="text-destructive">*</span></Label>
            <Select value={teamId} onValueChange={(v) => setTeamId(v ?? "")} required>
              <SelectTrigger><SelectValue placeholder="Select team">{teamId ? teams.find(t => t.teamId === teamId)?.name : undefined}</SelectValue></SelectTrigger>
              <SelectContent>{teams.map((t) => <SelectItem key={t.teamId} value={t.teamId}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : "Create Project"}
          </Button>
        </form>

        {projects.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Existing Projects</p>
              <ul className="space-y-1.5">
                {projects.map((p) => (
                  <li key={p.projectId} className="rounded-lg border bg-muted/30 px-3 py-2">
                    {editingId === p.projectId ? (
                      <div className="space-y-2">
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus className="h-8 text-sm" />
                        <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" className="h-8 text-sm" />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSave(p.projectId)} disabled={saving} className="h-7 text-xs">
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 text-xs"><X className="h-3 w-3" /> Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          {p.description && <p className="text-xs text-muted-foreground truncate">{p.description}</p>}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(p.projectId); setEditName(p.name); setEditDescription(p.description || ""); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(p.projectId)} disabled={deletingId === p.projectId}>
                            {deletingId === p.projectId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
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
