"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import * as api from "@/lib/api";
import type { Project, Task, Team } from "@/lib/types";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { KanbanView } from "@/components/KanbanView";
import { TeamFilter } from "@/components/TeamFilter";
import { CreateTaskForm } from "@/components/CreateTaskForm";
import { CreateProjectForm } from "@/components/CreateProjectForm";
import { ManageTeamForm } from "@/components/ManageTeamForm";
import { useAuth } from "@/context/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Image as ImageIcon } from "lucide-react";

const CLOUDWATCH_IMAGE = process.env.NEXT_PUBLIC_CLOUDWATCH_IMAGE || "/cloudwatch-dashboard.png";

export default function DashboardPage() {
  const { token } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [cloudwatchError, setCloudwatchError] = useState(false);

  const loadMeta = useCallback(async () => {
    if (!token) return;
    try {
      const [teamsData, projectsData] = await Promise.all([api.getTeams(token), api.getProjects(token)]);
      setTeams(teamsData); setProjects(projectsData);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to load data"); }
  }, [token]);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  return (
    <ProtectedRoute managerOnly>
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 px-4 py-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Manager Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Manage tasks, projects, and teams</p>
                </div>
              </div>
              <TeamFilter teams={teams} selectedTeamId={selectedTeamId} onChange={setSelectedTeamId} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
              <ScrollArea className="lg:col-span-1 h-[calc(100vh-10rem)]">
                <div className="space-y-4 pr-2">
                  <CreateTaskForm token={token!} teams={teams} projects={projects} onCreated={() => setRefreshKey((k) => k + 1)} />
                  <CreateProjectForm
                    token={token!} teams={teams} projects={projects}
                    onCreated={(p) => setProjects((prev) => [...prev, p])}
                    onUpdated={(p) => setProjects((prev) => prev.map((x) => (x.projectId === p.projectId ? p : x)))}
                    onDeleted={(id) => setProjects((prev) => prev.filter((x) => x.projectId !== id))}
                  />
                  <ManageTeamForm
                    token={token!} teams={teams}
                    onTeamCreated={(t) => setTeams((prev) => [...prev, t])}
                    onTeamUpdated={(t) => setTeams((prev) => prev.map((x) => (x.teamId === t.teamId ? t : x)))}
                    onTeamDeleted={(id) => setTeams((prev) => prev.filter((x) => x.teamId !== id))}
                  />
                  <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm text-foreground">CloudWatch Metrics</h3>
                      <Badge variant="secondary" className="ml-auto text-[10px]">Live</Badge>
                    </div>
                    {!cloudwatchError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={CLOUDWATCH_IMAGE} alt="CloudWatch dashboard" className="w-full rounded-lg border" onError={() => setCloudwatchError(true)} />
                    ) : (
                      <div className="rounded-lg border-2 border-dashed border-border p-4 text-center">
                        <p className="text-xs text-muted-foreground">
                          Add a screenshot to <code className="rounded bg-muted px-1">public/cloudwatch-dashboard.png</code>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>

              <div className="lg:col-span-3" key={refreshKey}>
                <KanbanView teamFilter={selectedTeamId || undefined} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
