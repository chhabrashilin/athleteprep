import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { TeamOverviewHeader } from "@/components/teams/TeamOverviewHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Users,
  Film,
  BarChart3,
  Zap,
  ArrowRight,
  Plus,
  Lock,
} from "lucide-react";
import {
  getTeamByIdForCurrentUser,
  getCurrentUserTeamMembership,
} from "@/lib/db/teams";
import { getTeamPlayerCount } from "@/lib/db/players";
import { getTeamGameCount } from "@/lib/db/games";

export const metadata: Metadata = { title: "Team Workspace — GameIQ" };

const STAFF_ROLES = ["owner", "coach", "analyst"];

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  const [team, membership, playerCount, gameCount] = await Promise.all([
    getTeamByIdForCurrentUser(teamId),
    getCurrentUserTeamMembership(teamId),
    getTeamPlayerCount(teamId),
    getTeamGameCount(teamId),
  ]);

  if (!team || !membership) notFound();

  const canEdit    = STAFF_ROLES.includes(membership.role);
  const hasPlayers = playerCount.total > 0;
  const hasGames   = gameCount.total > 0;

  const rosterLabel = hasPlayers
    ? `${playerCount.active} active · ${playerCount.total} total`
    : "No players yet";

  const gamesLabel = hasGames
    ? `${gameCount.draft} in progress · ${gameCount.analyzed} analyzed`
    : "No analyses yet";

  return (
    <AppShell teamContext={{ teamId: team.id, teamName: team.name }}>
      <PageHeader
        title={team.name}
        breadcrumbs={[{ label: "Teams", href: "/teams" }, { label: team.name }]}
        action={
          canEdit ? (
            <Link href={`/teams/${teamId}/games/new`}>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                New analysis
              </Button>
            </Link>
          ) : undefined
        }
      />

      <TeamOverviewHeader team={team} membership={membership} />

      {/* Workspace progress cards */}
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Workspace
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Roster card — live */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-5 w-5 text-sky-400" />
              Roster
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 pt-2">
            <p className="text-2xl font-bold text-slate-100">{playerCount.total}</p>
            <p className="text-xs text-slate-500 mt-1 flex-1">{rosterLabel}</p>
            <div className="mt-4">
              <Link href={`/teams/${teamId}/players`}>
                <Button variant="ghost" size="sm" className="px-0">
                  {hasPlayers ? "Manage roster" : canEdit ? "Add players" : "View roster"}
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Games card — live */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Film className="h-5 w-5 text-sky-400" />
              Games
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 pt-2">
            <p className="text-2xl font-bold text-slate-100">{gameCount.total}</p>
            <p className="text-xs text-slate-500 mt-1 flex-1">{gamesLabel}</p>
            <div className="mt-4">
              <Link href={`/teams/${teamId}/games`}>
                <Button variant="ghost" size="sm" className="px-0">
                  {hasGames ? "View games" : canEdit ? "Create first game" : "View games"}
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Reports — coming soon */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-5 w-5 text-sky-400" />
              Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 pt-2">
            <p className="text-2xl font-bold text-slate-100">0</p>
            <p className="text-xs text-slate-500 mt-1 flex-1">
              AI-generated game analysis.
            </p>
            <div className="mt-4">
              <Button variant="ghost" size="sm" className="px-0 text-slate-500 cursor-default" disabled>
                <Lock className="h-3 w-3 mr-1" />
                Coming soon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis — coming soon */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="h-5 w-5 text-sky-400" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 pt-2">
            <p className="text-2xl font-bold text-slate-100">—</p>
            <p className="text-xs text-slate-500 mt-1 flex-1">
              Coaching insights, player feedback, recommendations.
            </p>
            <div className="mt-4">
              <Button variant="ghost" size="sm" className="px-0 text-slate-500 cursor-default" disabled>
                <Lock className="h-3 w-3 mr-1" />
                Coming soon
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next steps — smart based on progress */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Next steps</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Roster next step */}
          <div className="flex items-start gap-3 rounded-lg border border-slate-700/50 bg-slate-800/40 p-4">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${hasPlayers ? "bg-sky-500/15 border border-sky-500/20" : "bg-slate-700"}`}>
              <Users className={`h-4 w-4 ${hasPlayers ? "text-sky-400" : "text-slate-400"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200">
                {hasPlayers ? "Manage roster" : "Add your roster"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {hasPlayers
                  ? `${playerCount.active} active player${playerCount.active !== 1 ? "s" : ""} · Linked to AI player reports.`
                  : "Player data powers AI report accuracy and player-specific feedback."}
              </p>
              <Link href={`/teams/${teamId}/players`} className="mt-2 inline-block">
                <Button variant="secondary" size="sm">
                  {hasPlayers ? "Manage roster" : canEdit ? "Add players" : "View roster"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Games next step */}
          <div className="flex items-start gap-3 rounded-lg border border-slate-700/50 bg-slate-800/40 p-4">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${hasGames ? "bg-sky-500/15 border border-sky-500/20" : "bg-slate-700"}`}>
              <Film className={`h-4 w-4 ${hasGames ? "text-sky-400" : "text-slate-400"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200">
                {hasGames ? "Continue analysis" : "Create your first game"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {hasGames
                  ? `${gameCount.total} game${gameCount.total !== 1 ? "s" : ""} recorded · ${gameCount.draft} awaiting analysis.`
                  : "Log a match or practice, then upload video and add timestamps."}
              </p>
              <Link href={`/teams/${teamId}/games`} className="mt-2 inline-block">
                <Button variant="secondary" size="sm">
                  {hasGames ? "View games" : canEdit ? "Create first game" : "View games"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/5 p-5">
        <p className="text-sm text-sky-400 font-medium mb-1">Your team intelligence hub</p>
        <p className="text-sm text-slate-400">
          This workspace will become the hub for {team.name}&apos;s film library,
          player roster, game analysis, and AI-generated coaching reports.
        </p>
      </div>
    </AppShell>
  );
}
