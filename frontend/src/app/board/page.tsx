"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { KanbanView } from "@/components/KanbanView";
import { Kanban } from "lucide-react";

export default function BoardPage() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 px-4 py-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Kanban className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">My Team&apos;s Board</h1>
                <p className="text-sm text-muted-foreground">View and update your team&apos;s tasks</p>
              </div>
            </div>
            <KanbanView />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
