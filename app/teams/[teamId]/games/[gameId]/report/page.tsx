import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { AppShell } from "@/components/layout/AppShell";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { ReportSectionNav } from "@/components/reports/ReportSectionNav";
import { ReportOverview } from "@/components/reports/ReportOverview";
import { CoachingInsightsSection } from "@/components/reports/CoachingInsightsSection";
import { PlayerReportsSection } from "@/components/reports/PlayerReportsSection";
import { OpponentTendenciesSection } from "@/components/reports/OpponentTendenciesSection";
import { PracticePlanSection } from "@/components/reports/PracticePlanSection";
import { AssumptionsLimitationsCard } from "@/components/reports/AssumptionsLimitationsCard";
import { AnalysisReadinessCard } from "@/components/analysis/AnalysisReadinessCard";
import { AnalysisJobStatusCard } from "@/components/analysis/AnalysisJobStatusCard";
import { GenerateReportButton } from "@/components/analysis/GenerateReportButton";
import { ShareReportButton } from "@/components/sharing/ShareReportButton";
import { ExportReportButton } from "@/components/export/ExportReportButton";
import { getExportsForReport } from "@/lib/db/exports";
import {
  getTeamByIdForCurrentUser,
  getCurrentUserTeamMembership,
} from "@/lib/db/teams";
import { getGameByIdForTeam } from "@/lib/db/games";
import { getFullGameReportData } from "@/lib/db/reports";
import { getLatestAnalysisJobForGame } from "@/lib/db/analysis-jobs";
import { getShareLinksForReport } from "@/lib/db/share-links";
import { buildAnalysisInputSnapshot } from "@/lib/analysis/build-input-snapshot";
import { getAnalysisReadiness } from "@/lib/analysis/readiness";
import { getAIProviderConfig } from "@/lib/ai/provider-factory";

export const metadata: Metadata = { title: "AI Report — GameIQ" };

const STAFF_ROLES = ["owner", "coach", "analyst"];

export default async function ReportPage({
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
  const canEdit = canGenerate;

  // Load full report data and analysis state in parallel
  const [reportData, snapshot, latestJob] = await Promise.all([
    getFullGameReportData(teamId, gameId),
    buildAnalysisInputSnapshot(teamId, gameId),
    getLatestAnalysisJobForGame(teamId, gameId),
  ]);

  const readiness = getAnalysisReadiness(snapshot);
  const isRunning = latestJob?.status === "pending" || latestJob?.status === "running";
  const jobFailed = latestJob?.status === "failed" && !reportData;

  // Resolve provider config for UI display (server-side, never exposes secrets)
  const providerConfig = getAIProviderConfig();
  const providerLabelMap: Record<string, string> = {
    mock: "Mock AI mode (development)",
    openai: `OpenAI · ${providerConfig.model}`,
    anthropic: `Anthropic · ${providerConfig.model}`,
    gemini: `Gemini · ${providerConfig.model}`,
  };
  const providerLabel = providerLabelMap[providerConfig.provider] ?? "Mock AI mode";

  // ── No report yet ──────────────────────────────────────────────────────
  if (!reportData) {
    return (
      <AppShell teamContext={{ teamId: team.id, teamName: team.name }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-50">AI Report</h1>
          <p className="text-sm text-slate-400 mt-1">{game.title}</p>
        </div>

        {isRunning && latestJob && (
          <div className="mb-5">
            <AnalysisJobStatusCard job={latestJob} />
          </div>
        )}
        {jobFailed && latestJob && (
          <div className="mb-5 space-y-4">
            <AnalysisJobStatusCard job={latestJob} />
            {canGenerate && (
              <GenerateReportButton
                teamId={teamId}
                gameId={gameId}
                canGenerate={readiness.canGenerate}
                providerLabel={providerLabel}
              />
            )}
          </div>
        )}

        {!isRunning && !jobFailed && (
          <div className="mb-5 rounded-xl border border-sky-500/30 bg-sky-500/5 p-6 text-center">
            <h3 className="text-base font-semibold text-slate-100 mb-2">
              Generate your first AI report
            </h3>
            <p className="text-sm text-slate-400 mb-5 max-w-md mx-auto">
              GameIQ will analyze your game data, coach notes, key moments, and roster to generate
              coaching insights, player feedback, and a next-practice plan.
              All insights are evidence-linked from your structured inputs.
            </p>
            {canGenerate ? (
              <GenerateReportButton
                teamId={teamId}
                gameId={gameId}
                canGenerate={readiness.canGenerate}
                disabledReason={!readiness.canGenerate ? readiness.reasons.join(" ") : undefined}
                providerLabel={providerLabel}
              />
            ) : (
              <p className="text-xs text-slate-500">Only coaches and analysts can generate reports.</p>
            )}
          </div>
        )}

        <AnalysisReadinessCard readiness={readiness} />
      </AppShell>
    );
  }

  // ── Report exists ──────────────────────────────────────────────────────
  const {
    report,
    insights,
    playerReports,
    practiceRecommendations,
    opponentTendencies,
    players,
  } = reportData;

  // Fetch share links and export history for staff (non-blocking)
  const [shareLinks, exportHistory] = await Promise.all([
    canEdit ? getShareLinksForReport(teamId, report.id) : Promise.resolve([]),
    canEdit ? getExportsForReport(teamId, report.id) : Promise.resolve([]),
  ]);

  // Determine base URL for share links
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${protocol}://${host}`;

  const basis = {
    eventCount: snapshot.events.length,
    hasVideo: snapshot.video !== null,
    rosterCount: snapshot.roster.length,
    hasCoachNotes: !!(snapshot.game.coachNotes?.trim()),
    hasOpponentNotes: !!(snapshot.game.opponentNotes?.trim()),
  };

  const navSections = [
    { id: "overview", label: "Overview" },
    { id: "insights", label: "Insights", count: insights.length },
    { id: "players", label: "Players", count: playerReports.length },
    { id: "opponent", label: "Opponent", count: opponentTendencies.length },
    { id: "practice", label: "Practice", count: practiceRecommendations.length },
    { id: "evidence", label: "Evidence & Limits" },
  ];

  return (
    <AppShell teamContext={{ teamId: team.id, teamName: team.name }}>
      <ReportHeader
        report={report}
        game={game}
        teamId={teamId}
        gameId={gameId}
        canRegenerate={canGenerate}
        canGenerate={readiness.canGenerate}
        providerLabel={providerLabel}
        shareButton={
          canEdit ? (
            <ShareReportButton
              teamId={teamId}
              gameId={gameId}
              gameReportId={report.id}
              reportTitle={report.title}
              players={players}
              initialShareLinks={shareLinks}
              baseUrl={baseUrl}
            />
          ) : undefined
        }
        exportButton={
          canEdit ? (
            <ExportReportButton
              teamId={teamId}
              gameId={gameId}
              gameReportId={report.id}
              reportTitle={report.title}
              initialExports={exportHistory}
            />
          ) : undefined
        }
      />

      <ReportSectionNav sections={navSections} />

      <div className="space-y-12">
        <ReportOverview report={report} basis={basis} />
        <CoachingInsightsSection
          insights={insights}
          players={players}
          teamId={teamId}
          gameId={gameId}
          gameReportId={report.id}
          canEdit={canEdit}
        />
        <PlayerReportsSection
          playerReports={playerReports}
          teamId={teamId}
          gameId={gameId}
          gameReportId={report.id}
          canEdit={canEdit}
        />
        <OpponentTendenciesSection
          tendencies={opponentTendencies}
          teamId={teamId}
          gameId={gameId}
          gameReportId={report.id}
          canEdit={canEdit}
        />
        <PracticePlanSection
          recommendations={practiceRecommendations}
          players={players}
          teamId={teamId}
          gameId={gameId}
          gameReportId={report.id}
          canEdit={canEdit}
        />
        <AssumptionsLimitationsCard report={report} />
      </div>
    </AppShell>
  );
}
