/**
 * lib/sharing/sanitize-report.ts — Server-side sanitization for shared report views.
 *
 * Builds a SharedReportViewModel from full report data, filtered to only include
 * content allowed by the share link's visibility mode. This runs on the server
 * before any data reaches the client, so visibility is enforced at the data layer
 * rather than just the UI layer.
 *
 * Visibility rules:
 *   private_link   — most content, no video, no edit metadata, no raw AI output
 *   staff_only     — same as private_link (auth enforced separately at route level)
 *   public_summary — executive summary + insight titles/summaries, no player details
 *   player_specific — one player's report + their relevant practice recs only
 */
import type { FullGameReportData } from "@/lib/db/reports";
import type {
  ShareLink,
  SharedReportViewModel,
  SharedInsight,
  SharedPlayerReport,
  SharedPracticeRecommendation,
  SharedOpponentTendency,
} from "@/types/sharing";
import type { CoachingInsight, PlayerReport, PracticeRecommendation, OpponentTendency } from "@/types/database";

export function buildSharedReportViewModel(
  data: FullGameReportData,
  shareLink: ShareLink
): SharedReportViewModel {
  const { report, game, insights, playerReports, practiceRecommendations, opponentTendencies } = data;

  const baseFields = {
    shareLink,
    visibility: shareLink.visibility,
    reportTitle: report.title,
    reportCreatedAt: report.createdAt,
    overallConfidence: report.overallConfidence,
    gameContext: {
      title: game.title,
      sport: game.sport,
      opponentName: game.opponentName,
      gameDate: game.gameDate,
      result: game.result,
      homeAway: game.homeAway,
    },
    executiveSummary: report.executiveSummary,
    canShowVideo: false as const,
    allowedPlayerId: shareLink.allowedPlayerId,
  };

  switch (shareLink.visibility) {
    case "private_link":
    case "staff_only":
      return {
        ...baseFields,
        coachingInsights: insights.map(toSharedInsight),
        playerReports: playerReports.map(toSharedPlayerReport),
        practiceRecommendations: practiceRecommendations.map(toSharedPracticeRec),
        opponentTendencies: opponentTendencies.map(toSharedOpponentTendency),
        assumptions: report.assumptions,
        limitations: report.limitations,
      };

    case "public_summary":
      return {
        ...baseFields,
        // Insight titles + summaries only — tactical details hidden
        coachingInsights: insights.map((i) => ({
          id: i.id,
          title: i.title,
          summary: i.summary,
          whyItMatters: null,
          recommendedAction: null,
          confidence: i.confidence,
          isEdited: i.isEdited,
        })),
        playerReports: [], // no player data on public summary
        // Practice rec titles only — no coaching points or player IDs
        practiceRecommendations: practiceRecommendations.map((rec) => ({
          id: rec.id,
          title: rec.title,
          description: rec.description,
          drillName: null,
          durationMinutes: rec.durationMinutes,
          coachingPoints: [],
          priority: rec.priority,
          confidence: rec.confidence,
          playerIds: [],
        })),
        opponentTendencies: [], // no opponent tactics on public summary
        assumptions: [],
        limitations: report.limitations,
      };

    case "player_specific": {
      const pid = shareLink.allowedPlayerId;
      const playerReport = pid
        ? (playerReports.find((pr) => pr.playerId === pid) ?? playerReports.find((pr) => pr.id === pid))
        : undefined;
      const playerRecs = pid
        ? practiceRecommendations.filter((rec) => rec.playerIds.includes(pid))
        : [];

      return {
        ...baseFields,
        coachingInsights: [], // no team tactics in player view
        playerReports: playerReport ? [toSharedPlayerReport(playerReport)] : [],
        practiceRecommendations: playerRecs.map((rec) => ({
          id: rec.id,
          title: rec.title,
          description: rec.description,
          drillName: rec.drillName,
          durationMinutes: rec.durationMinutes,
          coachingPoints: rec.coachingPoints,
          priority: rec.priority,
          confidence: rec.confidence,
          playerIds: [],
        })),
        opponentTendencies: [],
        assumptions: [],
        limitations: report.limitations,
      };
    }

    default:
      // Fallback: treat as private_link
      return {
        ...baseFields,
        coachingInsights: insights.map(toSharedInsight),
        playerReports: playerReports.map(toSharedPlayerReport),
        practiceRecommendations: practiceRecommendations.map(toSharedPracticeRec),
        opponentTendencies: opponentTendencies.map(toSharedOpponentTendency),
        assumptions: report.assumptions,
        limitations: report.limitations,
      };
  }
}

// ---------------------------------------------------------------------------
// Entity projections — only expose safe fields
// ---------------------------------------------------------------------------

function toSharedInsight(i: CoachingInsight): SharedInsight {
  return {
    id: i.id,
    title: i.title,
    summary: i.summary,
    whyItMatters: i.whyItMatters,
    recommendedAction: i.recommendedAction,
    confidence: i.confidence,
    isEdited: i.isEdited,
  };
}

function toSharedPlayerReport(pr: PlayerReport): SharedPlayerReport {
  return {
    id: pr.id,
    playerDisplayName: pr.playerDisplayName,
    summary: pr.summary,
    strengths: pr.strengths,
    improvementAreas: pr.improvementAreas,
    recommendedFocus: pr.recommendedFocus,
    playerFacingSummary: pr.playerFacingSummary,
    confidence: pr.confidence,
  };
}

function toSharedPracticeRec(rec: PracticeRecommendation): SharedPracticeRecommendation {
  return {
    id: rec.id,
    title: rec.title,
    description: rec.description,
    drillName: rec.drillName,
    durationMinutes: rec.durationMinutes,
    coachingPoints: rec.coachingPoints,
    priority: rec.priority,
    confidence: rec.confidence,
    playerIds: rec.playerIds,
  };
}

function toSharedOpponentTendency(ot: OpponentTendency): SharedOpponentTendency {
  return {
    id: ot.id,
    title: ot.title,
    description: ot.description,
    recommendedResponse: ot.recommendedResponse,
    tags: ot.tags,
    confidence: ot.confidence,
  };
}
