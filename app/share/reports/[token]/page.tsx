import type { Metadata } from "next";
import { AlertTriangle, Lock, Lightbulb, Users, Target, Swords, Info } from "lucide-react";
import { getShareLinkByToken, incrementShareLinkView } from "@/lib/db/share-links";
import { buildSharedReportViewModel } from "@/lib/sharing/sanitize-report";
import { getShareLinkStatus } from "@/types/sharing";
import { ConfidenceBadge } from "@/components/ui/Badge";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";
import type { SharedReportViewModel } from "@/types/sharing";
import type { FullGameReportData } from "@/lib/db/reports";
import type { SportType } from "@/types/sports";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const link = await getShareLinkByToken(token);
  if (!link) return { title: "Shared Report — GameIQ" };
  return { title: `Shared Report — GameIQ` };
}

// ---------------------------------------------------------------------------
// Error states
// ---------------------------------------------------------------------------

function ErrorPage({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 mb-4">
        <AlertTriangle className="h-6 w-6 text-red-400" />
      </div>
      <h1 className="text-lg font-bold text-slate-100 mb-2">{title}</h1>
      <p className="text-sm text-slate-400 max-w-sm">{message}</p>
    </div>
  );
}

function AccessDeniedPage({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 mb-4">
        <Lock className="h-6 w-6 text-amber-400" />
      </div>
      <h1 className="text-lg font-bold text-slate-100 mb-2">Access restricted</h1>
      <p className="text-sm text-slate-400 max-w-sm">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // 1. Look up share link by token
  const shareLink = await getShareLinkByToken(token);

  if (!shareLink) {
    return <ErrorPage title="Link not found" message="This share link doesn't exist or has been deleted." />;
  }

  // 2. Check status
  const status = getShareLinkStatus(shareLink);
  if (status === "revoked") {
    return <ErrorPage title="Link revoked" message="This share link has been revoked by the team." />;
  }
  if (status === "expired") {
    return <ErrorPage title="Link expired" message="This share link expired and is no longer active." />;
  }

  // 3. staff_only: require authenticated team member
  if (shareLink.visibility === "staff_only") {
    const supabase = await createServerSupabaseClient();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;

    if (!user) {
      return (
        <AccessDeniedPage message="This report is shared with team staff only. Please sign in with your team account to view it." />
      );
    }

    if (shareLink.teamId) {
      const { data: membership } = await supabase!
        .from("team_members")
        .select("role")
        .eq("team_id", shareLink.teamId)
        .eq("user_id", user.id)
        .single();

      if (!membership) {
        return <AccessDeniedPage message="You are not a member of this team. Ask your coach to add you." />;
      }
    }
  }

  // 4. Fetch full report data using service role (bypasses RLS since viewer may not be authed)
  if (!shareLink.teamId || !shareLink.gameId) {
    return <ErrorPage title="Report unavailable" message="The report data for this link is incomplete." />;
  }

  const serviceClient = createServiceSupabaseClient();
  if (!serviceClient) {
    return <ErrorPage title="Service unavailable" message="Report data is temporarily unavailable. Please try again later." />;
  }

  const fullReportData = await getFullGameReportDataWithServiceClient(
    shareLink.teamId,
    shareLink.gameId,
    shareLink.gameReportId ?? undefined,
    serviceClient
  );

  if (!fullReportData) {
    return <ErrorPage title="Report not found" message="The report referenced by this link could not be found." />;
  }

  // 5. Sanitize — build view model based on visibility
  const viewModel = buildSharedReportViewModel(fullReportData, shareLink);

  // 6. Increment view count (fire-and-forget)
  void incrementShareLinkView(token);

  return <SharedReportView model={viewModel} />;
}

// ---------------------------------------------------------------------------
// Fetch report data using the service client (bypasses RLS)
// ---------------------------------------------------------------------------

async function getFullGameReportDataWithServiceClient(
  teamId: string,
  gameId: string,
  gameReportId: string | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: any
) {
  try {
    // Fetch report
    let reportQuery = serviceClient
      .from("game_reports")
      .select("*")
      .eq("team_id", teamId)
      .eq("game_id", gameId);

    if (gameReportId) {
      reportQuery = reportQuery.eq("id", gameReportId);
    } else {
      reportQuery = reportQuery.eq("is_current", true);
    }

    const { data: reportRow, error: reportErr } = await reportQuery
      .order("report_version", { ascending: false })
      .limit(1)
      .single();

    if (reportErr || !reportRow) return null;

    const reportId = reportRow.id as string;

    // Fetch game, insights, player reports, practice recs, opponent tendencies in parallel
    const [
      gameResult,
      insightsResult,
      playerReportsResult,
      pracRecsResult,
      opponentResult,
    ] = await Promise.all([
      serviceClient.from("games").select("*").eq("id", gameId).single(),
      serviceClient
        .from("coaching_insights")
        .select("*")
        .eq("game_report_id", reportId)
        .eq("team_id", teamId)
        .order("sort_order", { ascending: true }),
      serviceClient
        .from("player_reports")
        .select("*")
        .eq("game_report_id", reportId)
        .eq("team_id", teamId),
      serviceClient
        .from("practice_recommendations")
        .select("*")
        .eq("game_report_id", reportId)
        .eq("team_id", teamId)
        .order("priority", { ascending: true }),
      serviceClient
        .from("opponent_tendencies")
        .select("*")
        .eq("game_report_id", reportId)
        .eq("team_id", teamId),
    ]);

    if (!gameResult.data) return null;

    // Build a minimal FullGameReportData shape manually using the service client
    return buildMinimalFullReportData(
      reportRow,
      gameResult.data,
      teamId,
      insightsResult.data ?? [],
      playerReportsResult.data ?? [],
      pracRecsResult.data ?? [],
      opponentResult.data ?? []
    );
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMinimalFullReportData(reportRow: any, gameRow: any, teamId: string, insightRows: any[], playerRows: any[], pracRows: any[], oppRows: any[]): FullGameReportData {
  type ConfidenceLevel = "high" | "medium" | "low";
  type VerificationStatus = "unreviewed" | "accurate" | "partially_accurate" | "inaccurate" | "edited";

  const report = {
    id: reportRow.id as string,
    teamId: reportRow.team_id as string,
    gameId: reportRow.game_id as string,
    analysisJobId: (reportRow.analysis_job_id as string | null) ?? null,
    createdBy: (reportRow.created_by as string | null) ?? null,
    title: reportRow.title as string,
    executiveSummary: (reportRow.executive_summary as string | null) ?? null,
    overallConfidence: ((reportRow.overall_confidence as string) ?? "medium") as ConfidenceLevel,
    reportVersion: (reportRow.report_version as number) ?? 1,
    isCurrent: (reportRow.is_current as boolean) ?? true,
    aiGenerated: (reportRow.ai_generated as boolean) ?? true,
    rawAiOutput: {},
    editedOutput: null,
    assumptions: (reportRow.assumptions as string[]) ?? [],
    limitations: (reportRow.limitations as string[]) ?? [],
    createdAt: reportRow.created_at as string,
    updatedAt: reportRow.updated_at as string,
  };

  const game = {
    id: gameRow.id as string,
    teamId: gameRow.team_id as string,
    createdBy: (gameRow.created_by as string | null) ?? null,
    sport: ((gameRow.sport as string) ?? "soccer") as SportType,
    gameType: (gameRow.game_type as "match" | "practice" | "scrimmage" | "film_session") ?? "match",
    title: gameRow.title as string,
    opponentName: (gameRow.opponent_name as string | null) ?? null,
    gameDate: (gameRow.game_date as string | null) ?? null,
    startTime: (gameRow.start_time as string | null) ?? null,
    homeAway: ((gameRow.home_away as string) ?? "not_applicable") as "home" | "away" | "neutral" | "not_applicable",
    venue: (gameRow.venue as string | null) ?? null,
    competitionName: (gameRow.competition_name as string | null) ?? null,
    teamScore: (gameRow.team_score as string | null) ?? null,
    opponentScore: (gameRow.opponent_score as string | null) ?? null,
    result: (gameRow.result as string | null) ?? null,
    summaryNotes: (gameRow.summary_notes as string | null) ?? null,
    coachNotes: (gameRow.coach_notes as string | null) ?? null,
    opponentNotes: (gameRow.opponent_notes as string | null) ?? null,
    status: ((gameRow.status as string) ?? "analyzed") as "draft" | "ready_for_analysis" | "analysis_running" | "analyzed" | "archived",
    metadata: {},
    createdAt: gameRow.created_at as string,
    updatedAt: gameRow.updated_at as string,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insights = insightRows.map((r: any) => ({
    id: r.id as string,
    teamId: r.team_id as string,
    gameId: r.game_id as string,
    gameReportId: r.game_report_id as string,
    title: r.title as string,
    summary: r.summary as string,
    whyItMatters: (r.why_it_matters as string | null) ?? null,
    recommendedAction: (r.recommended_action as string | null) ?? null,
    confidence: ((r.confidence as string) ?? "medium") as ConfidenceLevel,
    verificationStatus: ((r.verification_status as string) ?? "unreviewed") as VerificationStatus,
    evidence: [],
    assumptions: (r.assumptions as string[]) ?? [],
    affectedPlayerIds: (r.affected_player_ids as string[]) ?? [],
    relatedEventIds: (r.related_event_ids as string[]) ?? [],
    sortOrder: (r.sort_order as number) ?? 0,
    isEdited: (r.is_edited as boolean) ?? false,
    originalAiContent: null,
    metadata: {},
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerReports = playerRows.map((r: any) => ({
    id: r.id as string,
    teamId: r.team_id as string,
    gameId: r.game_id as string,
    gameReportId: r.game_report_id as string,
    playerId: (r.player_id as string | null) ?? null,
    playerDisplayName: (r.player_display_name as string | null) ?? null,
    summary: (r.summary as string | null) ?? null,
    strengths: (r.strengths as string[]) ?? [],
    improvementAreas: (r.improvement_areas as string[]) ?? [],
    keyMoments: [],
    recommendedFocus: (r.recommended_focus as string | null) ?? null,
    playerFacingSummary: (r.player_facing_summary as string | null) ?? null,
    confidence: ((r.confidence as string) ?? "medium") as ConfidenceLevel,
    verificationStatus: ((r.verification_status as string) ?? "unreviewed") as VerificationStatus,
    isEdited: (r.is_edited as boolean) ?? false,
    originalAiContent: null,
    metadata: { dataCoverage: r.metadata?.dataCoverage },
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const practiceRecommendations = pracRows.map((r: any) => ({
    id: r.id as string,
    teamId: r.team_id as string,
    gameId: r.game_id as string,
    gameReportId: r.game_report_id as string,
    title: r.title as string,
    priority: (r.priority as number) ?? 0,
    description: (r.description as string | null) ?? null,
    drillName: (r.drill_name as string | null) ?? null,
    durationMinutes: (r.duration_minutes as number | null) ?? null,
    coachingPoints: (r.coaching_points as string[]) ?? [],
    playerIds: (r.player_ids as string[]) ?? [],
    relatedInsightIds: [],
    confidence: ((r.confidence as string) ?? "medium") as ConfidenceLevel,
    verificationStatus: ((r.verification_status as string) ?? "unreviewed") as VerificationStatus,
    isEdited: (r.is_edited as boolean) ?? false,
    originalAiContent: null,
    metadata: {},
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opponentTendencies = oppRows.map((r: any) => ({
    id: r.id as string,
    teamId: r.team_id as string,
    gameId: r.game_id as string,
    gameReportId: r.game_report_id as string,
    title: r.title as string,
    description: r.description as string,
    evidence: [],
    recommendedResponse: (r.recommended_response as string | null) ?? null,
    confidence: ((r.confidence as string) ?? "medium") as ConfidenceLevel,
    verificationStatus: ((r.verification_status as string) ?? "unreviewed") as VerificationStatus,
    isEdited: (r.is_edited as boolean) ?? false,
    originalAiContent: null,
    tags: (r.tags as string[]) ?? [],
    metadata: {},
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));

  return {
    team: { id: teamId, name: "", sport: game.sport },
    game,
    report,
    videoAsset: null,
    signedVideoUrl: null,
    insights,
    playerReports,
    practiceRecommendations,
    opponentTendencies,
    evidenceEvents: [],
    players: [],
    latestJob: null,
    reportVersions: [],
  };
}

// ---------------------------------------------------------------------------
// Shared report view component
// ---------------------------------------------------------------------------

function SectionHeading({ icon: Icon, title, count }: { icon: React.ElementType; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-5 w-5 text-sky-400" />
      <h2 className="text-base font-semibold text-slate-100">
        {title}
        {count !== undefined && (
          <span className="ml-2 text-sm font-normal text-slate-500">({count})</span>
        )}
      </h2>
    </div>
  );
}

function SharedReportView({ model }: { model: SharedReportViewModel }) {
  const {
    gameContext,
    executiveSummary,
    coachingInsights,
    playerReports,
    practiceRecommendations,
    opponentTendencies,
    assumptions,
    limitations,
    visibility,
    overallConfidence,
    reportCreatedAt,
  } = model;

  const dateLabel = gameContext.gameDate
    ? new Date(gameContext.gameDate).toLocaleDateString("en-US", { dateStyle: "medium" })
    : null;
  const sportLabel =
    gameContext.sport.charAt(0).toUpperCase() + gameContext.sport.slice(1).replace("_", " ");

  return (
    <div className="space-y-8">
      {/* Report header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              AI Report · {sportLabel}
              {visibility === "public_summary" && " · Public summary"}
              {visibility === "player_specific" && " · Player report"}
            </p>
            <h1 className="text-2xl font-bold text-slate-50 mb-1">
              {gameContext.title}
              {gameContext.opponentName && ` vs. ${gameContext.opponentName}`}
            </h1>
            <p className="text-sm text-slate-400">
              {dateLabel && dateLabel}
              {gameContext.result && ` · ${gameContext.result}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <ConfidenceBadge level={overallConfidence} />
          </div>
        </div>
        <div className="text-xs text-slate-600 border-t border-slate-800 pt-3">
          Generated {new Date(reportCreatedAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
        </div>
      </div>

      {/* Executive summary */}
      {executiveSummary && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Executive summary
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">{executiveSummary}</p>
        </div>
      )}

      {/* Coaching insights */}
      {coachingInsights.length > 0 && (
        <section className="space-y-4">
          <SectionHeading icon={Lightbulb} title="Coaching Insights" count={coachingInsights.length} />
          <div className="space-y-3">
            {coachingInsights.map((insight) => (
              <div key={insight.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <h3 className="text-sm font-semibold text-slate-100">{insight.title}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <ConfidenceBadge level={insight.confidence} />
                    {insight.isEdited && (
                      <span className="text-xs text-sky-400 border border-sky-500/30 bg-sky-500/10 rounded-full px-2 py-0.5">
                        Coach-edited
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{insight.summary}</p>
                {insight.whyItMatters && (
                  <div className="mt-3 flex items-start gap-2">
                    <span className="text-xs font-semibold text-amber-400 shrink-0 mt-0.5">Why:</span>
                    <p className="text-sm text-slate-400">{insight.whyItMatters}</p>
                  </div>
                )}
                {insight.recommendedAction && (
                  <div className="mt-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
                    <p className="text-xs font-semibold text-emerald-400 mb-0.5">Recommended action</p>
                    <p className="text-sm text-slate-300">{insight.recommendedAction}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Player reports */}
      {playerReports.length > 0 && (
        <section className="space-y-4">
          <SectionHeading icon={Users} title="Player Reports" count={playerReports.length} />
          <div className="space-y-3">
            {playerReports.map((pr) => (
              <div key={pr.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-400">
                    {(pr.playerDisplayName?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {pr.playerDisplayName ?? "Player"}
                    </p>
                    <ConfidenceBadge level={pr.confidence} className="mt-0.5" />
                  </div>
                </div>

                {pr.playerFacingSummary && (
                  <div className="mb-3 rounded-lg border border-slate-700 bg-slate-800/30 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-500 mb-0.5 uppercase tracking-wider">
                      Your summary
                    </p>
                    <p className="text-sm text-slate-300 italic">&ldquo;{pr.playerFacingSummary}&rdquo;</p>
                  </div>
                )}

                {pr.summary && !pr.playerFacingSummary && (
                  <p className="text-sm text-slate-400 mb-3">{pr.summary}</p>
                )}

                {pr.strengths.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Strengths</p>
                    <ul className="space-y-1">
                      {pr.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                          <span className="text-emerald-400 shrink-0 mt-0.5">+</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {pr.improvementAreas.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Areas to work on
                    </p>
                    <ul className="space-y-1">
                      {pr.improvementAreas.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                          <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {pr.recommendedFocus && (
                  <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2">
                    <p className="text-xs font-semibold text-sky-400 mb-0.5">Focus for next practice</p>
                    <p className="text-sm text-slate-300">{pr.recommendedFocus}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Practice recommendations */}
      {practiceRecommendations.length > 0 && (
        <section className="space-y-4">
          <SectionHeading icon={Target} title="Practice Plan" count={practiceRecommendations.length} />
          <div className="space-y-3">
            {practiceRecommendations.map((rec, i) => (
              <div key={rec.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-start gap-3 mb-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-400">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-100">{rec.title}</h3>
                      <ConfidenceBadge level={rec.confidence} />
                    </div>
                    {rec.description && (
                      <p className="text-sm text-slate-400 mt-1">{rec.description}</p>
                    )}
                  </div>
                </div>
                {rec.drillName && (
                  <p className="text-xs text-emerald-400 ml-10 mb-1">
                    Drill: <span className="font-medium">{rec.drillName}</span>
                    {rec.durationMinutes && ` · ${rec.durationMinutes} min`}
                  </p>
                )}
                {rec.coachingPoints.length > 0 && (
                  <ul className="ml-10 space-y-1">
                    {rec.coachingPoints.map((point, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-sky-400 shrink-0 mt-0.5">·</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Opponent tendencies */}
      {opponentTendencies.length > 0 && (
        <section className="space-y-4">
          <SectionHeading icon={Swords} title="Opponent Tendencies" count={opponentTendencies.length} />
          <div className="space-y-3">
            {opponentTendencies.map((ot) => (
              <div key={ot.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                  <h3 className="text-sm font-semibold text-slate-100">{ot.title}</h3>
                  <ConfidenceBadge level={ot.confidence} />
                </div>
                <p className="text-sm text-slate-400">{ot.description}</p>
                {ot.recommendedResponse && (
                  <div className="mt-2 rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2">
                    <p className="text-xs font-semibold text-amber-400 mb-0.5">Recommended response</p>
                    <p className="text-sm text-slate-300">{ot.recommendedResponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Limitations */}
      {limitations.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-slate-500" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Report limitations
            </p>
          </div>
          <ul className="space-y-1">
            {limitations.map((l, i) => (
              <li key={i} className="text-xs text-slate-500 flex items-start gap-2">
                <span className="text-slate-600 shrink-0 mt-0.5">·</span>
                {l}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Assumptions */}
      {assumptions.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Assumptions</p>
          <ul className="space-y-1">
            {assumptions.map((a, i) => (
              <li key={i} className="text-xs text-slate-500 flex items-start gap-2">
                <span className="text-slate-600 shrink-0 mt-0.5">·</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
