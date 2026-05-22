"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { KanbanView } from "@/components/KanbanView";
import { useAuth } from "@/context/AuthContext";

export default function BoardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="mx-auto max-w-7xl flex-1 bg-zinc-50 px-4 py-6 text-zinc-900">
        <h1 className="mb-6 rounded-xl bg-white p-4 text-2xl font-bold text-zinc-900 shadow-sm">
          My Tasks
        </h1>
        <KanbanView assigneeFilter={user?.userId} />
      </main>
    </ProtectedRoute>
  );
}
