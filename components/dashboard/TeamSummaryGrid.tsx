import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { TeamCard } from "@/components/teams/TeamCard";
import { Button } from "@/components/ui/Button";
import type { TeamWithMembership } from "@/lib/db/teams";

interface TeamSummaryGridProps {
  teams: TeamWithMembership[];
  playerCounts?: Record<string, { total: number; active: number }>;
  gameCounts?:   Record<string, { total: number; draft: number }>;
}

export function TeamSummaryGrid({
  teams,
  playerCounts = {},
  gameCounts = {},
}: TeamSummaryGridProps) {
  if (teams.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-300">Your teams</h2>
        <Link href="/teams/new">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New team
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map(({ team, membership }) => (
          <TeamCard
            key={team.id}
            team={team}
            membership={membership}
            playerCount={playerCounts[team.id]}
            gameCount={gameCounts[team.id]}
          />
        ))}
      </div>

      {teams.length > 0 && (
        <div className="mt-4 text-right">
          <Link
            href="/teams"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            View all teams
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
