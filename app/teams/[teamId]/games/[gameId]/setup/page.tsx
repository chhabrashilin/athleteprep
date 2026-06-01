import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { GameSetupChecklist } from "@/components/games/GameSetupChecklist";
import { AnalysisReadinessCard } from "@/components/analysis/AnalysisReadinessCard";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ArrowRight, BarChart3 } from "lucide-react";
import {
  getTeamByIdForCurrentUser,
  getCurrentUserTeamMembership,
} from "@/lib/db/teams";
import { getGameByIdForTeam, getGameSetupStatus } from "@/lib/db/games";
import { buildAnalysisInputSnapshot } from "@/lib/analysis/build-input-snapshot";
import { getAnalysisReadiness } from "@/lib/analysis/readiness";
import { getCurrentGameReport } from "@/lib/db/reports";

export const metadata: Metadata = { title: "Analysis Setup — GameIQ" };

const STAFF_ROLES = ["owner", "coach", "analyst"];

export default async function GameSetupPage({
  params,
}: {
  params: Promise<{ teamId: string; gameId: string }>;
}) {
  const { teamId, gameId } = await params;

  const [team, membership, game] = await Promise.all([
    getTeamByIdForCurrentUser(teamId),
    getCurrentUserTeamMembership(teamId),
    getGameByIdForTeam(teamId, gameId),
  ]);

  if (!team || !membership) notFound();
  if (!game) notFound();

  const canGenerate = STAFF_ROLES.includes(membership.role);

  const [setupStatus, snapshot, currentReport] = await Promise.all([
    getGameSetupStatus(teamId, gameId),
    buildAnalysisInputSnapshot(teamId, gameId),
    getCurrentGameReport(teamId, gameId),
  ]);

  if (!setupStatus) notFound();

  const readiness = getAnalysisReadiness(snapshot);

  return (
    <AppShell teamContext={{ teamId: team.id, teamName: team.name }}>
      <PageHeader
        title="Analysis setup"
        description={`Prepare ${game.title} for AI analysis.`}
        breadcrumbs={[
          { label: "Teams", href: "/teams" },
          { label: team.name, href: `/teams/${teamId}` },
          { label: "Games", href: `/teams/${teamId}/games` },
          { label: game.title, href: `/teams/${teamId}/games/${gameId}` },
          { label: "Setup" },
        ]}
      />

      <div className="max-w-2xl space-y-6">
        {/* Product context */}
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
          <p className="text-sm text-sky-300 font-medium mb-1">The analysis workflow</p>
          <p className="text-sm text-slate-400">
            Complete these steps to prepare your game for AI analysis. GameIQ uses your game
            details, roster, video, and key moment timestamps to generate coaching insights,
            player feedback, and practice recommendations.
          </p>
        </div>

        {/* Checklist */}
        <GameSetupChecklist
          teamId={teamId}
          gameId={gameId}
          setupStatus={setupStatus}
        />

        {/* AI readiness card */}
        <AnalysisReadinessCard readiness={readiness} />

        {/* Key moments guidance */}
        {setupStatus.hasVideo && !setupStatus.hasTimestamps && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-amber-400 mb-1">Add key moments</p>
            <p className="text-sm text-slate-400 mb-3">
              Video is uploaded. Now tag key events — transitions, mistakes, scoring chances,
              tactical moments — so the AI has evidence to build insights from.
            </p>
            <p className="text-xs text-slate-500">
              5–10 key moments give the AI the best evidence for a strong, evidence-linked report.
            </p>
            <Link
              href={`/teams/${teamId}/games/${gameId}/timestamps`}
              className="mt-3 inline-flex items-center gap-1 text-sm text-sky-400 hover:text-sky-300 transition-colors"
            >
              Tag key moments →
            </Link>
          </div>
        )}

        {/* Report CTA */}
        {currentReport ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p className="text-sm font-semibold text-emerald-400 mb-1">
              AI Report v{currentReport.reportVersion} — Ready
            </p>
            <p className="text-sm text-slate-400 mb-3">
              Your AI report has been generated. View insights, player reports, and practice
              recommendations.
            </p>
            <Link href={`/teams/${teamId}/games/${gameId}/report`}>
              <Button size="sm">
                <BarChart3 className="h-3.5 w-3.5" />
                View AI report
              </Button>
            </Link>
          </div>
        ) : readiness.canGenerate && canGenerate ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm font-semibold text-slate-200 mb-1">Ready to generate</p>
            <p className="text-sm text-slate-400 mb-3">
              You have enough data to generate an AI report.
              {readiness.warnings.length > 0 && (
                <span className="text-amber-400"> See warnings above for ways to improve report quality.</span>
              )}
            </p>
            <Link href={`/teams/${teamId}/games/${gameId}/report`}>
              <Button size="sm">
                <BarChart3 className="h-3.5 w-3.5" />
                Generate AI report
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        ) : null}

        {/* Footer navigation */}
        <div className="flex items-center justify-between">
          <Link href={`/teams/${teamId}/games/${gameId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to game
            </Button>
          </Link>
          <Link href={`/teams/${teamId}/games/${gameId}/report`}>
            <Button
              size="sm"
              variant={currentReport ? "primary" : "secondary"}
            >
              {currentReport ? "View report" : "Go to report page"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
