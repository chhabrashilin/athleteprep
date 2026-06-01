import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TeamEmptyState } from "@/components/teams/TeamEmptyState";
import { TeamSummaryGrid } from "@/components/dashboard/TeamSummaryGrid";
import { SetupChecklist } from "@/components/dashboard/SetupChecklist";
import { Film, Plus, BarChart3, ArrowRight, Zap } from "lucide-react";
import { getServerUser } from "@/lib/supabase/server";
import { getTeamsWithMembershipForCurrentUser } from "@/lib/db/teams";
import { getPlayerCountsForTeams } from "@/lib/db/players";
import { getGameCountsForTeams } from "@/lib/db/games";
import { getRecentReportsForTeams } from "@/lib/db/reports";

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

  // Batch queries for player counts, game counts, and recent reports.
  const [playerCounts, gameCounts, recentReports] = teamIds.length > 0
    ? await Promise.all([
        getPlayerCountsForTeams(teamIds),
        getGameCountsForTeams(teamIds),
        getRecentReportsForTeams(teamIds, 5),
      ])
    : [
        {} as Record<string, { total: number; active: number }>,
        {} as Record<string, { total: number; draft: number }>,
        [] as Awaited<ReturnType<typeof getRecentReportsForTeams>>,
      ];

  const hasPlayers = Object.values(playerCounts).some((c) => c.total > 0);
  const hasGames   = Object.values(gameCounts).some((c) => c.total > 0);
  const showDemoCta = process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === "true" && !hasTeam;

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

      {/* Demo CTA — only shown when mock data is enabled and no team exists */}
      {showDemoCta && (
        <div className="mb-6 flex items-start gap-4 rounded-xl border border-sky-500/30 bg-sky-500/5 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/15">
            <Zap className="h-4 w-4 text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sky-400 mb-0.5">Try the demo workspace</p>
            <p className="text-sm text-slate-400">
              Explore GameIQ with a pre-built cricket team, 10 players, a full match, 12 tagged key moments, and an AI coaching report.
            </p>
          </div>
          <Link href="/demo/setup" className="shrink-0">
            <Button size="sm" variant="secondary">
              Set up demo
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
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

        {/* Recent AI reports */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100">Recent AI reports</h3>
            {recentReports.length > 0 && hasTeam && firstTeamId && (
              <Link href={`/teams/${firstTeamId}/games`}>
                <Button variant="ghost" size="sm" className="text-xs">
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>

          {recentReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
                <Film className="h-5 w-5 text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-400">No reports yet</p>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Create a game, tag key moments, and generate an AI analysis to see reports here.
              </p>
              {hasGames && hasTeam && firstTeamId && (
                <Link href={`/teams/${firstTeamId}/games`} className="mt-4">
                  <Button size="sm" variant="secondary">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Go to games
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-800/60">
              {recentReports.map((report) => (
                <li key={report.reportId}>
                  <Link
                    href={`/teams/${report.teamId}/games/${report.gameId}/report`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
                      <BarChart3 className="h-4 w-4 text-sky-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{report.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        v{report.reportVersion} · {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={report.overallConfidence === "high" ? "success" : report.overallConfidence === "low" ? "warning" : "default"}
                      className="shrink-0 capitalize text-xs"
                    >
                      {report.overallConfidence}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Feedback nudge */}
      <div className="mt-8 flex items-center justify-end">
        <Link
          href="/feedback"
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          Have feedback on GameIQ? Share it →
        </Link>
      </div>
    </AppShell>
  );
}
