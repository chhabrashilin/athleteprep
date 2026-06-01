"use server";

import { revalidatePath } from "next/cache";
import { generateReportForGame } from "@/lib/analysis/generate-report";
import { submitVerificationFeedback } from "@/lib/db/verification";
import {
  updateCoachingInsight,
  updatePlayerReport,
  updatePracticeRecommendation,
  updateOpponentTendency,
  updateGameReportSummary,
} from "@/lib/db/report-editing";
import { createShareLink, revokeShareLink } from "@/lib/db/share-links";
import type { GenerateReportResult, GenerateReportError } from "@/types/analysis";
import type {
  SubmitVerificationFeedbackInput,
  UpdateCoachingInsightInput,
  UpdatePlayerReportInput,
  UpdatePracticeRecommendationInput,
  UpdateOpponentTendencyInput,
  UpdateGameReportSummaryInput,
  ActionResult,
} from "@/types/verification";
import type { CreateShareLinkInput, ShareLink } from "@/types/sharing";

// ---------------------------------------------------------------------------
// Generate report (existing)
// ---------------------------------------------------------------------------

export async function generateReportAction(
  teamId: string,
  gameId: string
): Promise<GenerateReportResult | GenerateReportError> {
  const result = await generateReportForGame(teamId, gameId);

  if (result.success) {
    revalidatePath(`/teams/${teamId}/games/${gameId}/report`);
    revalidatePath(`/teams/${teamId}/games/${gameId}/setup`);
    revalidatePath(`/teams/${teamId}/games/${gameId}`);
    revalidatePath(`/teams/${teamId}/games`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export async function verifyReportItemAction(
  input: SubmitVerificationFeedbackInput
): Promise<ActionResult> {
  try {
    await submitVerificationFeedback(input);
    revalidatePath(`/teams/${input.teamId}/games/${input.gameId ?? ""}/report`);
    revalidatePath(
      `/teams/${input.teamId}/games/${input.gameId ?? ""}/report/insights/${input.targetId}`
    );
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed.";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Editing
// ---------------------------------------------------------------------------

export async function updateCoachingInsightAction(
  input: UpdateCoachingInsightInput
): Promise<ActionResult> {
  try {
    await updateCoachingInsight(input);
    revalidatePath(`/teams/${input.teamId}/games/${input.gameId}/report`);
    revalidatePath(
      `/teams/${input.teamId}/games/${input.gameId}/report/insights/${input.insightId}`
    );
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save insight.";
    return { success: false, error: message };
  }
}

export async function updatePlayerReportAction(
  input: UpdatePlayerReportInput
): Promise<ActionResult> {
  try {
    await updatePlayerReport(input);
    revalidatePath(`/teams/${input.teamId}/games/${input.gameId}/report`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save player report.";
    return { success: false, error: message };
  }
}

export async function updatePracticeRecommendationAction(
  input: UpdatePracticeRecommendationInput
): Promise<ActionResult> {
  try {
    await updatePracticeRecommendation(input);
    revalidatePath(`/teams/${input.teamId}/games/${input.gameId}/report`);
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save practice recommendation.";
    return { success: false, error: message };
  }
}

export async function updateOpponentTendencyAction(
  input: UpdateOpponentTendencyInput
): Promise<ActionResult> {
  try {
    await updateOpponentTendency(input);
    revalidatePath(`/teams/${input.teamId}/games/${input.gameId}/report`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save opponent tendency.";
    return { success: false, error: message };
  }
}

export async function updateGameReportSummaryAction(
  input: UpdateGameReportSummaryInput
): Promise<ActionResult> {
  try {
    await updateGameReportSummary(input);
    revalidatePath(`/teams/${input.teamId}/games/${input.gameId}/report`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save report summary.";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Sharing
// ---------------------------------------------------------------------------

export async function createShareLinkAction(
  input: CreateShareLinkInput
): Promise<ActionResult<ShareLink>> {
  try {
    const link = await createShareLink(input);
    revalidatePath(`/teams/${input.teamId}/games/${input.gameId}/report`);
    return { success: true, data: link };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create share link.";
    return { success: false, error: message };
  }
}

export async function revokeShareLinkAction(
  teamId: string,
  gameId: string,
  shareLinkId: string
): Promise<ActionResult> {
  try {
    await revokeShareLink(teamId, shareLinkId);
    revalidatePath(`/teams/${teamId}/games/${gameId}/report`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to revoke share link.";
    return { success: false, error: message };
  }
}
