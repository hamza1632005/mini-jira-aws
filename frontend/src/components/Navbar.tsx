"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LayoutDashboard, Kanban, LogOut } from "lucide-react";

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

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href={isManager ? "/dashboard" : "/board"} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Kanban className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-foreground">Mini Jira</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/board" className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              <Kanban className="h-4 w-4" />
              Board
            </Link>
            {isManager && (
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-medium text-foreground">{user.username}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge variant={isManager ? "default" : "secondary"} className="h-4 px-1.5 text-[10px] capitalize">
                    {user.role}
                  </Badge>
                  {teamName && (
                    <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                      {teamName}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 text-muted-foreground">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
