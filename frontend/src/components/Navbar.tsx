"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const { user, isManager, logout } = useAuth();

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
            <span className="text-sm font-medium text-zinc-800">
              {user.username}{" "}
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold capitalize text-blue-900">
                {user.role}
              </span>
            </span>
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
