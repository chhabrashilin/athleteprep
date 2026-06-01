import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { TeamEmptyState } from "@/components/teams/TeamEmptyState";
import { TeamSummaryGrid } from "@/components/dashboard/TeamSummaryGrid";
import { SetupChecklist } from "@/components/dashboard/SetupChecklist";
import { Film, Plus } from "lucide-react";
import { getServerUser } from "@/lib/supabase/server";
import { getTeamsWithMembershipForCurrentUser } from "@/lib/db/teams";
import { getPlayerCountsForTeams } from "@/lib/db/players";
import { getGameCountsForTeams } from "@/lib/db/games";

export const metadata: Metadata = { title: "Dashboard — GameIQ" };

export default async function DashboardPage() {
  const [user, teamsWithMembership] = await Promise.all([
    getServerUser(),
    getTeamsWithMembershipForCurrentUser(),
  ]);

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "Coach";

  const hasTeam      = teamsWithMembership.length > 0;
  const firstTeamId  = teamsWithMembership[0]?.team.id;
  const teamIds      = teamsWithMembership.map((t) => t.team.id);

  // Batch queries for player and game counts.
  const [playerCounts, gameCounts] = teamIds.length > 0
    ? await Promise.all([
        getPlayerCountsForTeams(teamIds),
        getGameCountsForTeams(teamIds),
      ])
    : [
        {} as Record<string, { total: number; active: number }>,
        {} as Record<string, { total: number; draft: number }>,
      ];

  const hasPlayers = Object.values(playerCounts).some((c) => c.total > 0);
  const hasGames   = Object.values(gameCounts).some((c) => c.total > 0);

  return (
    <AppShell>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your AI game intelligence hub."
        action={
          <Link href="/teams/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New team
            </Button>
          </Link>
        }
      />

      {/* Teams section */}
      {hasTeam ? (
        <div className="mb-8">
          <TeamSummaryGrid
            teams={teamsWithMembership}
            playerCounts={playerCounts}
            gameCounts={gameCounts}
          />
        </div>
      ) : (
        <div className="mb-8">
          <TeamEmptyState />
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SetupChecklist
          hasTeam={hasTeam}
          hasPlayers={hasPlayers}
          hasGames={hasGames}
          firstTeamId={firstTeamId}
        />

        {/* Recent reports placeholder */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100">Recent game reports</h3>
          </div>
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
              <Film className="h-5 w-5 text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-400">No reports yet</p>
            <p className="mt-1 text-xs text-slate-500 max-w-xs">
              Upload a game and generate an AI analysis to see your reports here.
            </p>
            <p className="mt-3 text-xs text-slate-600 italic">
              Coming in Phase 7 — AI Report Generation
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
