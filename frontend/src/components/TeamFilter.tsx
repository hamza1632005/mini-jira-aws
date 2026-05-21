"use client";

import type { Team } from "@/lib/types";
import { selectClass } from "@/lib/styles";

interface TeamFilterProps {
  teams: Team[];
  selectedTeamId: string;
  onChange: (teamId: string) => void;
}

export function TeamFilter({ teams, selectedTeamId, onChange }: TeamFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="team-filter" className="text-sm font-semibold text-zinc-900">
        Filter by team
      </label>
      <select
        id="team-filter"
        value={selectedTeamId}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
      >
        <option value="">All teams</option>
        {teams.map((team) => (
          <option key={team.teamId} value={team.teamId}>
            {team.name}
          </option>
        ))}
      </select>
    </div>
  );
}
