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
  Share2,
  ArrowRight,
  Plus,
} from "lucide-react";
import {
  getTeamByIdForCurrentUser,
  getCurrentUserTeamMembership,
} from "@/lib/db/teams";
import { getTeamPlayerCount } from "@/lib/db/players";
import { getTeamGameCount } from "@/lib/db/games";
import { getTeamReportCount } from "@/lib/db/reports";

export const metadata: Metadata = { title: "Team Workspace — GameIQ" };

const STAFF_ROLES = ["owner", "coach", "analyst"];

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  const [team, membership, playerCount, gameCount, reportCount] = await Promise.all([
    getTeamByIdForCurrentUser(teamId),
    getCurrentUserTeamMembership(teamId),
    getTeamPlayerCount(teamId),
    getTeamGameCount(teamId),
    getTeamReportCount(teamId),
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

        {/* Reports card — live */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-5 w-5 text-sky-400" />
              AI Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 pt-2">
            <p className="text-2xl font-bold text-slate-100">{reportCount}</p>
            <p className="text-xs text-slate-500 mt-1 flex-1">
              {reportCount === 0
                ? "No reports generated yet."
                : `${reportCount} report${reportCount !== 1 ? "s" : ""} generated · coaching insights, player feedback.`}
            </p>
            <div className="mt-4">
              <Link href={`/teams/${teamId}/games`}>
                <Button variant="ghost" size="sm" className="px-0">
                  {reportCount > 0 ? "View reports" : "Generate a report"}
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Sharing card — live */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Share2 className="h-5 w-5 text-sky-400" />
              Sharing
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 pt-2">
            <p className="text-2xl font-bold text-slate-100">
              {reportCount > 0 ? "On" : "—"}
            </p>
            <p className="text-xs text-slate-500 mt-1 flex-1">
              Share reports with players, parents, or coaches via secure link.
            </p>
            <div className="mt-4">
              {reportCount > 0 ? (
                <Link href={`/teams/${teamId}/games`}>
                  <Button variant="ghost" size="sm" className="px-0">
                    Share a report
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              ) : (
                <p className="text-xs text-slate-600">Generate a report first</p>
              )}
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
          {team.name}&apos;s workspace for film review, roster management, AI-generated coaching reports, player feedback, and practice planning.
          {reportCount === 0
            ? " Create a game, tag key moments, and generate your first AI report to get started."
            : " Generate reports, verify insights, and share with your team."}
        </p>
      </div>
    </AppShell>
  );
}
