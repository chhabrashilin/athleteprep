/**
 * Normalizes and validates AI-generated report output before database persistence.
 *
 * Hallucination guardrails:
 * - Removes unknown player IDs (not in the provided roster)
 * - Removes unknown event IDs (not in the provided events)
 * - Ensures every coaching insight has at least one evidence reference
 * - Assigns sort orders if missing
 * - Assigns practice priorities if missing
 * - Ensures limitations mention v1 data constraints
 * - Adds normalization notes as limitations if IDs were stripped
 */
import type {
  GeneratedGameReport,
  GeneratedCoachingInsight,
  GeneratedPlayerReport,
  GeneratedPracticeRecommendation,
  GeneratedOpponentTendency,
  EvidenceReference,
  AnalysisInputSnapshot,
} from "@/types/analysis";

export interface NormalizationResult {
  report: GeneratedGameReport;
  warnings: string[];
}

const V1_LIMITATION =
  "Analysis is based on manually tagged key moments, coach notes, and structured game metadata. No automated video tracking or computer vision was performed.";

function normalizeEvidence(
  evidence: EvidenceReference[],
  validEventIds: Set<string>,
  validPlayerIds: Set<string>,
  warnings: string[]
): EvidenceReference[] {
  return evidence.map((ev) => {
    let stripped = { ...ev };

    if (stripped.eventId && !validEventIds.has(stripped.eventId)) {
      warnings.push(`Stripped unknown eventId "${stripped.eventId}" from evidence "${ev.label}".`);
      stripped = { ...stripped, eventId: undefined };
    }

    if (stripped.playerIds && stripped.playerIds.length > 0) {
      const filteredPlayerIds = stripped.playerIds.filter((id) => {
        if (!validPlayerIds.has(id)) {
          warnings.push(`Stripped unknown playerId "${id}" from evidence "${ev.label}".`);
          return false;
        }
        return true;
      });
      stripped = { ...stripped, playerIds: filteredPlayerIds };
    }

    return stripped;
  });
}

function normalizeInsight(
  insight: GeneratedCoachingInsight,
  index: number,
  validEventIds: Set<string>,
  validPlayerIds: Set<string>,
  warnings: string[]
): GeneratedCoachingInsight {
  const evidence = normalizeEvidence(insight.evidence, validEventIds, validPlayerIds, warnings);

  const affectedPlayerIds = insight.affectedPlayerIds.filter((id) => {
    if (!validPlayerIds.has(id)) {
      warnings.push(`Stripped unknown affectedPlayerId "${id}" from insight "${insight.title}".`);
      return false;
    }
    return true;
  });

  const relatedEventIds = insight.relatedEventIds.filter((id) => {
    if (!validEventIds.has(id)) {
      warnings.push(`Stripped unknown relatedEventId "${id}" from insight "${insight.title}".`);
      return false;
    }
    return true;
  });

  // Ensure every insight has at least one evidence item
  const normalizedEvidence =
    evidence.length > 0
      ? evidence
      : [
          {
            id: `fallback-${insight.title.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`,
            type: "game_metadata" as const,
            label: "Game context",
            description: "Evidence reference removed during normalization — based on game metadata and notes.",
          },
        ];

  return {
    ...insight,
    evidence: normalizedEvidence,
    affectedPlayerIds,
    relatedEventIds,
    sortOrder: typeof insight.sortOrder === "number" ? insight.sortOrder : index,
  };
}

function normalizePlayerReport(
  report: GeneratedPlayerReport,
  validEventIds: Set<string>,
  validPlayerIds: Set<string>,
  warnings: string[]
): GeneratedPlayerReport {
  // Validate playerId
  let playerId = report.playerId;
  if (playerId && !validPlayerIds.has(playerId)) {
    warnings.push(`Stripped unknown playerId "${playerId}" from player report "${report.playerDisplayName}".`);
    playerId = null;
  }

  // Normalize keyMoments event IDs
  const keyMoments = report.keyMoments.map((km) => {
    if (km.eventId && !validEventIds.has(km.eventId)) {
      warnings.push(`Stripped unknown eventId "${km.eventId}" from player report "${report.playerDisplayName}" key moment.`);
      return { ...km, eventId: undefined };
    }
    return km;
  });

  return { ...report, playerId, keyMoments };
}

function normalizePracticeRecommendation(
  rec: GeneratedPracticeRecommendation,
  index: number,
  validPlayerIds: Set<string>,
  warnings: string[]
): GeneratedPracticeRecommendation {
  const playerIds = rec.playerIds.filter((id) => {
    if (!validPlayerIds.has(id)) {
      warnings.push(`Stripped unknown playerId "${id}" from practice rec "${rec.title}".`);
      return false;
    }
    return true;
  });

  return {
    ...rec,
    playerIds,
    priority: typeof rec.priority === "number" && rec.priority >= 1 ? rec.priority : index + 1,
  };
}

function normalizeOpponentTendency(
  tendency: GeneratedOpponentTendency,
  validEventIds: Set<string>,
  validPlayerIds: Set<string>,
  warnings: string[]
): GeneratedOpponentTendency {
  const evidence = normalizeEvidence(tendency.evidence, validEventIds, validPlayerIds, warnings);
  return { ...tendency, evidence };
}

function ensureV1Limitation(limitations: string[]): string[] {
  const hasV1Limitation = limitations.some(
    (l) => l.toLowerCase().includes("automated") || l.toLowerCase().includes("manually tagged")
  );
  if (!hasV1Limitation) {
    return [...limitations, V1_LIMITATION];
  }
  return limitations;
}

export function normalizeGeneratedReport(
  report: GeneratedGameReport,
  snapshot: AnalysisInputSnapshot
): NormalizationResult {
  const warnings: string[] = [];

  const validPlayerIds = new Set(snapshot.roster.map((p) => p.id));
  const validEventIds = new Set(snapshot.events.map((e) => e.id));

  const coachingInsights = report.coachingInsights.map((insight, i) =>
    normalizeInsight(insight, i, validEventIds, validPlayerIds, warnings)
  );

  const playerReports = report.playerReports.map((pr) =>
    normalizePlayerReport(pr, validEventIds, validPlayerIds, warnings)
  );

  const practiceRecommendations = report.practiceRecommendations.map((rec, i) =>
    normalizePracticeRecommendation(rec, i, validPlayerIds, warnings)
  );

  const opponentTendencies = report.opponentTendencies.map((t) =>
    normalizeOpponentTendency(t, validEventIds, validPlayerIds, warnings)
  );

  let limitations = ensureV1Limitation(report.limitations);
  if (warnings.length > 0) {
    limitations = [
      ...limitations,
      `${warnings.length} AI-generated reference${warnings.length !== 1 ? "s" : ""} to unknown player/event IDs were removed during normalization.`,
    ];
  }

  const normalized: GeneratedGameReport = {
    ...report,
    coachingInsights,
    playerReports,
    practiceRecommendations,
    opponentTendencies,
    limitations,
  };

  return { report: normalized, warnings };
}
