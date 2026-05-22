"use client";

import type { Team } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

interface TeamFilterProps {
  teams: Team[];
  selectedTeamId: string;
  onChange: (teamId: string) => void;
}

export function TeamFilter({ teams, selectedTeamId, onChange }: TeamFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedTeamId} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger className="w-44 h-9 text-sm">
          <SelectValue placeholder="All teams">{selectedTeamId ? (teams.find(t => t.teamId === selectedTeamId)?.name ?? "All teams") : "All teams"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All teams</SelectItem>
          {teams.map((team) => (
            <SelectItem key={team.teamId} value={team.teamId}>
              {team.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
