"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";

export function Navbar() {
  const { user, token, isManager, logout } = useAuth();
  const [teamName, setTeamName] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user?.teamId) { setTeamName(null); return; }
    api.getTeams(token)
      .then((teams) => {
        const match = teams.find((t) => t.teamId === user.teamId);
        setTeamName(match?.name ?? null);
      })
      .catch(() => setTeamName(null));
  }, [token, user?.teamId]);

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href={isManager ? "/dashboard" : "/board"} className="text-lg font-bold text-blue-700">
            Mini Jira
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/board" className="font-medium text-zinc-800 hover:text-blue-700">
              Board
            </Link>
            {isManager && (
              <Link href="/dashboard" className="font-medium text-zinc-800 hover:text-blue-700">
                Dashboard
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-zinc-800">{user.username}</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold capitalize text-blue-900">
                {user.role}
              </span>
              {teamName && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600">
                  {teamName}
                </span>
              )}
            </div>
          )}
          <button
            onClick={logout}
            className="rounded-lg border-2 border-zinc-400 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
