import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { GameOverviewHeader } from "@/components/games/GameOverviewHeader";
import { GameSetupChecklist } from "@/components/games/GameSetupChecklist";
import { GameVideoPlayer } from "@/components/video/GameVideoPlayer";
import { VideoAssetSummary } from "@/components/video/VideoAssetSummary";
import { VideoUploadCard } from "@/components/video/VideoUploadCard";
import { AIReadinessBadge } from "@/components/analysis/AIReadinessBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Settings,
  Tag,
  BarChart3,
  Film,
  ArrowRight,
  ChevronRight,
  Clock,
} from "lucide-react";
import {
  getTeamByIdForCurrentUser,
  getCurrentUserTeamMembership,
} from "@/lib/db/teams";
import { getGameByIdForTeam, getGameSetupStatus } from "@/lib/db/games";
import {
  getPrimaryVideoAssetForGame,
  createSignedVideoUrl,
} from "@/lib/db/video-assets";
import { getTimestampSummaryForGame } from "@/lib/db/timestamps";
import { getCurrentGameReport } from "@/lib/db/reports";
import { getLatestAnalysisJobForGame } from "@/lib/db/analysis-jobs";

export const metadata: Metadata = { title: "Game Analysis — GameIQ" };

const STAFF_ROLES = ["owner", "coach", "analyst"];

export default async function GamePage({
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

  const canEdit = STAFF_ROLES.includes(membership.role);

  const [setupStatus, primaryVideo, timestampSummary, currentReport, latestJob] =
    await Promise.all([
      getGameSetupStatus(teamId, gameId),
      getPrimaryVideoAssetForGame(teamId, gameId),
      getTimestampSummaryForGame(teamId, gameId),
      getCurrentGameReport(teamId, gameId),
      getLatestAnalysisJobForGame(teamId, gameId),
    ]);

  const signedUrl = primaryVideo ? await createSignedVideoUrl(primaryVideo) : null;

  return (
    <AppShell teamContext={{ teamId: team.id, teamName: team.name }}>
      <PageHeader
        title={game.title}
        breadcrumbs={[
          { label: "Teams", href: "/teams" },
          { label: team.name, href: `/teams/${teamId}` },
          { label: "Games", href: `/teams/${teamId}/games` },
          { label: game.title },
        ]}
      />

      {/* Game identity header */}
      <GameOverviewHeader game={game} teamId={teamId} canEdit={canEdit} />

      {/* Analysis workflow steps */}
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Analysis workflow
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
        {[
          {
            icon: <Settings className="h-4 w-4 text-sky-400" />,
            label: "1. Setup",
            href: `/teams/${teamId}/games/${gameId}/setup`,
            live: true,
            done: !!(setupStatus?.hasGameDetails && setupStatus?.hasRoster),
          },
          {
            icon: <Film className="h-4 w-4 text-sky-400" />,
            label: "2. Video",
            href: `#video-section`,
            live: true,
            done: !!setupStatus?.hasVideo,
          },
          {
            icon: <Tag className="h-4 w-4 text-sky-400" />,
            label: "3. Key Moments",
            href: `/teams/${teamId}/games/${gameId}/timestamps`,
            live: true,
            done: !!setupStatus?.hasTimestamps,
          },
          {
            icon: <BarChart3 className="h-4 w-4 text-sky-400" />,
            label: currentReport ? "4. View Report" : "4. AI Report",
            href: `/teams/${teamId}/games/${gameId}/report`,
            live: true,
            done: !!setupStatus?.hasReport,
          },
        ].map((step) => (
          <Link key={step.label} href={step.href}>
            <Card
              className={`hover:border-slate-700 transition-colors ${
                step.done ? "border-sky-500/30" : ""
              }`}
            >
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    step.done ? "bg-sky-500/15" : "bg-slate-800"
                  }`}
                >
                  {step.icon}
                </div>
                <span className="text-sm font-medium text-slate-300 truncate">
                  {step.label}
                </span>
                {step.done && (
                  <ChevronRight className="h-3.5 w-3.5 text-sky-500/60 ml-auto shrink-0" />
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* AI Readiness / Report status */}
      <div className="mb-6">
        {currentReport ? (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-emerald-400">
                AI Report v{currentReport.reportVersion} — Generated
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date(currentReport.createdAt).toLocaleDateString()} ·{" "}
                {currentReport.overallConfidence.charAt(0).toUpperCase() +
                  currentReport.overallConfidence.slice(1)}{" "}
                confidence
              </p>
            </div>
            <Link href={`/teams/${teamId}/games/${gameId}/report`}>
              <Button size="sm">
                <BarChart3 className="h-3.5 w-3.5" />
                View report
              </Button>
            </Link>
          </div>
        ) : latestJob?.status === "running" || latestJob?.status === "pending" ? (
          <div className="flex items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-500/5 px-5 py-4">
            <div className="h-4 w-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-sky-400">Generating AI report…</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Refresh in a moment to see your report.
              </p>
            </div>
            <Link href={`/teams/${teamId}/games/${gameId}/report`}>
              <Button variant="secondary" size="sm">View status</Button>
            </Link>
          </div>
        ) : (
          <AIReadinessBadge
            hasVideo={!!primaryVideo}
            timestampCount={timestampSummary.total}
          />
        )}
      </div>

      {/* Two-column layout: checklist + key moments preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        {setupStatus && (
          <GameSetupChecklist
            teamId={teamId}
            gameId={gameId}
            setupStatus={setupStatus}
          />
        )}

        {/* Key moments summary */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Key moments</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {timestampSummary.total === 0
                  ? "No events tagged yet"
                  : `${timestampSummary.total} event${timestampSummary.total !== 1 ? "s" : ""} tagged`}
              </p>
            </div>
            <Link href={`/teams/${teamId}/games/${gameId}/timestamps`}>
              <Button variant="secondary" size="sm">
                <Clock className="h-3.5 w-3.5" />
                {timestampSummary.total === 0 ? "Add moments" : "View all"}
              </Button>
            </Link>
          </div>
          <div className="px-5 py-4">
            {timestampSummary.total === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm text-slate-500 mb-3">
                  Tag key events so the AI has evidence for its insights.
                </p>
                <p className="text-xs text-slate-600">
                  5+ events recommended for a strong report.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-800/60 p-3 text-center">
                  <p className="text-lg font-bold text-slate-100">{timestampSummary.total}</p>
                  <p className="text-xs text-slate-500">Total events</p>
                </div>
                <div className="rounded-lg bg-slate-800/60 p-3 text-center">
                  <p className="text-lg font-bold text-amber-400">{timestampSummary.criticalOrHigh}</p>
                  <p className="text-xs text-slate-500">High impact</p>
                </div>
                <div className="rounded-lg bg-slate-800/60 p-3 text-center">
                  <p className="text-lg font-bold text-emerald-400">{timestampSummary.uniquePlayerCount}</p>
                  <p className="text-xs text-slate-500">Players tagged</p>
                </div>
                <div className="rounded-lg bg-slate-800/60 p-3 text-center">
                  <p className="text-lg font-bold text-violet-400">{timestampSummary.eventTypes.length}</p>
                  <p className="text-xs text-slate-500">Event types</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video section */}
      <div id="video-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Game Film
          </h2>
          {primaryVideo && canEdit && !signedUrl && (
            <p className="text-xs text-slate-500">
              Signed URL unavailable — check storage configuration
            </p>
          )}
        </div>

        {primaryVideo && signedUrl ? (
          <>
            <GameVideoPlayer signedUrl={signedUrl} videoAsset={primaryVideo} />
            <VideoAssetSummary asset={primaryVideo} />
            {canEdit && (
              <VideoUploadCard
                teamId={teamId}
                gameId={gameId}
                canEdit={canEdit}
                existingAsset={primaryVideo}
              />
            )}
          </>
        ) : primaryVideo && !signedUrl ? (
          <>
            <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
              <div className="text-center px-6 py-8">
                <Film className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-400 mb-1">Video unavailable</p>
                <p className="text-xs text-slate-500 max-w-xs">
                  Could not generate a playback URL. The storage bucket read policy may not be applied.
                </p>
              </div>
            </div>
            <VideoAssetSummary asset={primaryVideo} />
          </>
        ) : (
          <VideoUploadCard
            teamId={teamId}
            gameId={gameId}
            canEdit={canEdit}
            existingAsset={null}
          />
        )}

        {/* Honest product context */}
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
          <p className="text-sm text-sky-400 font-medium mb-1">
            How video powers your AI report
          </p>
          <p className="text-sm text-slate-400">
            In v1, GameIQ uses your coach notes, opponent notes, and manual timestamps as evidence
            for AI insights — not automated frame-by-frame video analysis. Upload your film, then
            tag key moments with timestamps. The AI uses those events as evidence references.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Automated full-frame video analysis is a future roadmap item.
          </p>
        </div>

        {/* Next-step CTA: key moments or report */}
        {primaryVideo && !currentReport && (
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-slate-200">
                {timestampSummary.total === 0
                  ? "Next: add key moments"
                  : `${timestampSummary.total} key moment${timestampSummary.total !== 1 ? "s" : ""} tagged`}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {timestampSummary.total === 0
                  ? "Tag important events with timestamps to build AI evidence."
                  : timestampSummary.total < 5
                  ? "Add more events for richer AI insights (5+ recommended)."
                  : "Strong evidence base — generate your AI report now."}
              </p>
            </div>
            {timestampSummary.total >= 1 ? (
              <Link href={`/teams/${teamId}/games/${gameId}/report`}>
                <Button size="sm">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Generate report
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <Link href={`/teams/${teamId}/games/${gameId}/timestamps`}>
                <Button variant="secondary" size="sm">
                  <Tag className="h-3.5 w-3.5" />
                  Tag moments
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
