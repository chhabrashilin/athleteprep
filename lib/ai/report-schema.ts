import { z } from "zod";

// ---------------------------------------------------------------------------
// Primitive enums
// ---------------------------------------------------------------------------

const ConfidenceSchema = z.enum(["high", "medium", "low"]);

const EvidenceTypeSchema = z.enum([
  "timestamp",
  "coach_note",
  "opponent_note",
  "game_metadata",
  "roster",
  "video_status",
  "manual_input",
]);

// ---------------------------------------------------------------------------
// Evidence reference
// ---------------------------------------------------------------------------

export const EvidenceReferenceSchema = z.object({
  id: z.string().min(1),
  type: EvidenceTypeSchema,
  label: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  timestampSeconds: z.number().nonnegative().optional(),
  eventId: z.string().optional(),
  playerIds: z.array(z.string()).max(30).optional(),
});

// ---------------------------------------------------------------------------
// Coaching insight
// ---------------------------------------------------------------------------

export const GeneratedCoachingInsightSchema = z.object({
  title: z.string().min(5).max(160),
  summary: z.string().min(20).max(2000),
  whyItMatters: z.string().min(20).max(2000),
  recommendedAction: z.string().min(20).max(2000),
  confidence: ConfidenceSchema,
  evidence: z.array(EvidenceReferenceSchema).min(1).max(12),
  assumptions: z.array(z.string().max(500)).max(8),
  affectedPlayerIds: z.array(z.string()).max(30),
  relatedEventIds: z.array(z.string()).max(30),
  sortOrder: z.number().int().min(0),
});

// ---------------------------------------------------------------------------
// Player report
// ---------------------------------------------------------------------------

const PlayerKeyMomentSchema = z.object({
  description: z.string().min(5).max(1000),
  significance: z.string().min(5).max(500),
  eventId: z.string().optional(),
  timestampSeconds: z.number().nonnegative().optional(),
});

export const GeneratedPlayerReportSchema = z.object({
  playerId: z.string().nullable(),
  playerDisplayName: z.string().min(1).max(120),
  summary: z.string().min(20).max(3000),
  strengths: z.array(z.string().min(5).max(500)).max(8),
  improvementAreas: z.array(z.string().min(5).max(500)).max(8),
  keyMoments: z.array(PlayerKeyMomentSchema).max(10),
  recommendedFocus: z.string().min(10).max(1000),
  playerFacingSummary: z.string().min(10).max(1000),
  confidence: ConfidenceSchema,
  dataCoverage: z.string().min(5).max(500),
});

// ---------------------------------------------------------------------------
// Practice recommendation
// ---------------------------------------------------------------------------

export const GeneratedPracticeRecommendationSchema = z.object({
  title: z.string().min(5).max(160),
  priority: z.number().int().min(1).max(10),
  description: z.string().min(10).max(2000),
  drillName: z.string().min(3).max(200),
  durationMinutes: z.number().int().min(1).max(240),
  coachingPoints: z.array(z.string().min(5).max(500)).max(12),
  playerIds: z.array(z.string()).max(30),
  confidence: ConfidenceSchema,
});

// ---------------------------------------------------------------------------
// Opponent tendency
// ---------------------------------------------------------------------------

export const GeneratedOpponentTendencySchema = z.object({
  title: z.string().min(5).max(160),
  description: z.string().min(20).max(2000),
  evidence: z.array(EvidenceReferenceSchema).max(12),
  recommendedResponse: z.string().min(10).max(2000),
  confidence: ConfidenceSchema,
  tags: z.array(z.string().max(60)).max(20),
});

// ---------------------------------------------------------------------------
// Full game report
// ---------------------------------------------------------------------------

export const GeneratedGameReportSchema = z.object({
  title: z.string().min(5).max(180),
  executiveSummary: z.string().min(50).max(3000),
  overallConfidence: ConfidenceSchema,
  assumptions: z.array(z.string().min(5).max(500)).max(12),
  limitations: z.array(z.string().min(5).max(500)).max(12),
  coachingInsights: z.array(GeneratedCoachingInsightSchema).min(1).max(5),
  playerReports: z.array(GeneratedPlayerReportSchema).max(20),
  practiceRecommendations: z.array(GeneratedPracticeRecommendationSchema).min(1).max(6),
  opponentTendencies: z.array(GeneratedOpponentTendencySchema).max(6),
});

export type ValidatedGeneratedGameReport = z.infer<typeof GeneratedGameReportSchema>;
