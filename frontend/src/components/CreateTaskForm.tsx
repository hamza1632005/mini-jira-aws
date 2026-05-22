"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import * as api from "@/lib/api";
import type { Project, Task, Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";

interface CreateTaskFormProps {
  token: string;
  teams: Team[];
  projects: Project[];
  onCreated: (task: Task) => void;
}

interface Member { userId: string; username: string; email: string; }

export function CreateTaskForm({ token, teams, projects, onCreated }: CreateTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [deadline, setDeadline] = useState("");
  const [teamId, setTeamId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const teamProjects = projects.filter((p) => !teamId || p.teamId === teamId);

  useEffect(() => {
    if (!teamId) { setMembers([]); setAssigneeUserId(""); return; }
    api.getTeamMembers(token, teamId).then(setMembers).catch(() => setMembers([]));
  }, [teamId, token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title || !teamId) { toast.error("Title and team are required"); return; }
    setSubmitting(true);
    try {
      const selectedMember = members.find((m) => m.userId === assigneeUserId);
      const task = await api.createTask(token, {
        title, description: description || undefined, priority,
        deadline: deadline || undefined, teamId,
        assigneeId: selectedMember?.userId,
        assigneeUsername: selectedMember?.email,
        projectId: projectId || undefined,
      });
      toast.success("Task created successfully");
      onCreated(task);
      setTitle(""); setDescription(""); setDeadline(""); setAssigneeUserId(""); setProjectId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="h-4 w-4 text-primary" />
          Create Task
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title <span className="text-destructive">*</span></Label>
            <Input id="task-title" placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea id="task-desc" placeholder="Optional description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v ?? "Medium")}>
                <SelectTrigger><SelectValue>{priority === "High" ? "🔴 High" : priority === "Low" ? "🟢 Low" : "🟡 Medium"}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">🔴 High</SelectItem>
                  <SelectItem value="Medium">🟡 Medium</SelectItem>
                  <SelectItem value="Low">🟢 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-deadline">Deadline</Label>
              <Input id="task-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Team <span className="text-destructive">*</span></Label>
            <Select value={teamId} onValueChange={(v) => { setTeamId(v ?? ""); setProjectId(""); setAssigneeUserId(""); }} required>
              <SelectTrigger><SelectValue placeholder="Select team">{teamId ? teams.find(t => t.teamId === teamId)?.name : undefined}</SelectValue></SelectTrigger>
              <SelectContent>
                {teams.map((t) => <SelectItem key={t.teamId} value={t.teamId}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={(v) => setProjectId(v ?? "")} disabled={!teamId}>
              <SelectTrigger><SelectValue placeholder="No project">{projectId ? (teamProjects.find(p => p.projectId === projectId)?.name ?? "No project") : "No project"}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No project</SelectItem>
                {teamProjects.map((p) => <SelectItem key={p.projectId} value={p.projectId}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Assignee</Label>
            <Select value={assigneeUserId} onValueChange={(v) => setAssigneeUserId(v ?? "")} disabled={!teamId}>
              <SelectTrigger><SelectValue placeholder={teamId ? "No assignee" : "Select a team first"}>{assigneeUserId ? (members.find(m => m.userId === assigneeUserId)?.email ?? "No assignee") : (teamId ? "No assignee" : "Select a team first")}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No assignee</SelectItem>
                {members.map((m) => <SelectItem key={m.userId} value={m.userId}>{m.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : "Create Task"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
