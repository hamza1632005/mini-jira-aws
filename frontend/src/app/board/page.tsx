"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { KanbanView } from "@/components/KanbanView";

export default function BoardPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <main className="mx-auto max-w-7xl flex-1 bg-zinc-50 px-4 py-6 text-zinc-900">
        <h1 className="mb-6 rounded-xl bg-white p-4 text-2xl font-bold text-zinc-900 shadow-sm">
          Task Board
        </h1>
        <KanbanView />
      </main>
    </ProtectedRoute>
  );
}
