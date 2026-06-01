/**
 * lib/analysis/readiness.ts
 * Computes analysis readiness from an AnalysisInputSnapshot.
 */
import type { AnalysisInputSnapshot, AnalysisReadiness } from "@/types/analysis";

/**
 * Evaluates analysis readiness from the collected input snapshot.
 *
 * Status levels:
 *   not_ready   — no useful input at all; generation blocked
 *   needs_context — some data but insufficient for a meaningful report
 *   ready       — minimum threshold met; report can be generated
 *   strong      — rich evidence base; report will be high quality
 *
 * Generation is allowed for "ready" and "strong".
 */
export function getAnalysisReadiness(input: AnalysisInputSnapshot): AnalysisReadiness {
  const { game, roster, video, events } = input;

  const hasGameDetails = !!(game.title && game.sport);
  const hasRoster = roster.length > 0;
  const hasVideo = video !== null;
  const hasEvents = events.length > 0;
  const hasNotes = !!(
    game.coachNotes?.trim() ||
    game.opponentNotes?.trim() ||
    game.summaryNotes?.trim()
  );

  const completedChecks = {
    gameDetails: hasGameDetails,
    roster: hasRoster,
    video: hasVideo,
    events: hasEvents,
    notes: hasNotes,
  };

  const reasons: string[] = [];
  const warnings: string[] = [];

  // Always require game details
  if (!hasGameDetails) {
    reasons.push("Game details are missing.");
  }

  const hasAnyUsefulInput = hasEvents || hasNotes;

  if (!hasAnyUsefulInput) {
    reasons.push("No key moments or notes have been added. Add timestamps or coach notes to enable analysis.");
  }

  // Determine status
  let status: AnalysisReadiness["status"];
  let canGenerate: boolean;

  if (!hasGameDetails || !hasAnyUsefulInput) {
    status = "not_ready";
    canGenerate = false;
  } else {
    // We have game details + at least some useful input — we can generate
    canGenerate = true;

    const isStrong =
      hasVideo &&
      hasRoster &&
      events.length >= 5 &&
      hasNotes;

    const isGood =
      (hasVideo || hasEvents) &&
      (hasEvents || hasNotes);

    if (isStrong) {
      status = "strong";
    } else if (isGood) {
      status = "ready";
    } else {
      status = "needs_context";
      // Still allow generation but warn
    }
  }

  // Collect warnings (non-blocking advisory messages)
  if (canGenerate) {
    if (!hasVideo) {
      warnings.push("No video uploaded. The AI report will not reference video context.");
    }
    if (!hasRoster) {
      warnings.push("No players on roster. Player-specific reports will have limited detail.");
    }
    if (!hasEvents && hasNotes) {
      warnings.push("No key moments tagged. Tag specific events to get evidence-linked insights.");
    }
    if (hasEvents && events.length < 5) {
      warnings.push(`Only ${events.length} event${events.length !== 1 ? "s" : ""} tagged. 5+ recommended for a stronger report.`);
    }
    if (!hasNotes) {
      warnings.push("No coach notes added. Adding game notes improves AI report quality.");
    }
  }

  return {
    status,
    canGenerate,
    reasons,
    warnings,
    completedChecks,
  };
}
