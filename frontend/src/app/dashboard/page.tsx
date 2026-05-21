"use client";

import { useCallback, useEffect, useState } from "react";

const CLOUDWATCH_IMAGE =
  process.env.NEXT_PUBLIC_CLOUDWATCH_IMAGE || "/cloudwatch-dashboard.png";
import { toast } from "sonner";
import * as api from "@/lib/api";
import type { Project, Task, Team } from "@/lib/types";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { KanbanView } from "@/components/KanbanView";
import { TeamFilter } from "@/components/TeamFilter";
import { CreateTaskForm } from "@/components/CreateTaskForm";
import { CreateProjectForm } from "@/components/CreateProjectForm";
import { useAuth } from "@/context/AuthContext";

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
      const [teamsData, projectsData] = await Promise.all([
        api.getTeams(token),
        api.getProjects(token),
      ]);
      setTeams(teamsData);
      setProjects(projectsData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load data");
    }
  }, [token]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  function handleTaskCreated(_task: Task) {
    setRefreshKey((k) => k + 1);
  }

  function handleProjectCreated(project: Project) {
    setProjects((prev) => [...prev, project]);
  }

  return (
    <ProtectedRoute managerOnly>
      <Navbar />
      <main className="mx-auto max-w-7xl flex-1 bg-zinc-50 px-4 py-6 text-zinc-900">
        <div className="mb-6 flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Manager Dashboard</h1>
          <TeamFilter
            teams={teams}
            selectedTeamId={selectedTeamId}
            onChange={setSelectedTeamId}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <CreateTaskForm
              token={token!}
              teams={teams}
              projects={projects}
              onCreated={handleTaskCreated}
            />
            <CreateProjectForm
              token={token!}
              teams={teams}
              onCreated={handleProjectCreated}
            />

            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h3 className="font-semibold text-zinc-900">CloudWatch Metrics</h3>
              {!cloudwatchError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={CLOUDWATCH_IMAGE}
                  alt="CloudWatch dashboard"
                  className="mt-2 w-full rounded-lg border border-zinc-200"
                  onError={() => setCloudwatchError(true)}
                />
              ) : (
                <p className="mt-2 text-sm text-zinc-700">
                  Add a dashboard screenshot from M1 to{" "}
                  <code className="rounded bg-zinc-100 px-1 text-xs">
                    public/cloudwatch-dashboard.png
                  </code>{" "}
                  and set{" "}
                  <code className="rounded bg-zinc-100 px-1 text-xs">
                    NEXT_PUBLIC_CLOUDWATCH_IMAGE=/cloudwatch-dashboard.png
                  </code>
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2" key={refreshKey}>
            <KanbanView teamFilter={selectedTeamId || undefined} />
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
