import type { AnalysisInputSnapshot } from "@/types/analysis";
import { formatSecondsAsTimestamp } from "@/lib/utils/time";

// ---------------------------------------------------------------------------
// Cost-control constants
// ---------------------------------------------------------------------------

export const MAX_ANALYSIS_EVENTS = 80;
export const MAX_ANALYSIS_PLAYERS = 40;
export const MAX_NOTE_CHARS = 6000;

// ---------------------------------------------------------------------------
// Sport-specific guidance
// ---------------------------------------------------------------------------

function getSportGuidance(sport: string): string {
  const s = sport.toLowerCase().replace(/[_\s]+/g, " ");

  if (s.includes("soccer") || s.includes("football")) {
    return `For soccer/football, consider: pressing shape and triggers, buildup patterns, defensive block and compactness, transition defense and attack speed, off-ball movement and spacing, set piece organization, chance creation and finishing, and recovery run discipline.`;
  }
  if (s.includes("basketball")) {
    return `For basketball, consider: half-court offensive execution, transition offense and defense, rebounding positioning, pick-and-roll coverage, defensive help-side principles, free throw situations, and end-of-quarter execution.`;
  }
  if (s.includes("cricket")) {
    return `For cricket, consider: batting decision-making under pressure, bowling plans and execution, field placements and match-ups, powerplay and death-over tactics, strike rotation and dot-ball pressure, running between wickets, and fielding discipline.`;
  }
  if (s.includes("baseball") || s.includes("softball")) {
    return `For baseball/softball, consider: pitch selection tendencies, baserunning decisions, infield and outfield positioning, bullpen management, batting order execution, and defensive positioning in key situations.`;
  }
  if (s.includes("hockey") || s.includes("ice")) {
    return `For hockey, consider: zone entry and exit efficiency, power play and penalty kill structure, faceoff performance, line matchup effectiveness, defensive zone coverage, and transition speed.`;
  }
  if (s.includes("rugby")) {
    return `For rugby, consider: set piece execution, breakdown discipline, defensive line speed, kicking game and territory, lineout variation, and transition from turnover.`;
  }
  if (s.includes("volleyball")) {
    return `For volleyball, consider: serve receive patterns, attacking efficiency by rotation, blocking assignments, defensive positioning, and serving strategy targeting opponent weaknesses.`;
  }

  return `Use the event labels, types, importance levels, and tags as your primary evidence. Keep tactical analysis tied to what was explicitly observed and noted.`;
}

// ---------------------------------------------------------------------------
// Schema summary for the prompt
// ---------------------------------------------------------------------------

function getSchemaInstructions(): string {
  return `
OUTPUT SCHEMA (return this exact JSON structure — no other text):
{
  "title": "string (5-180 chars)",
  "executiveSummary": "string (50-3000 chars)",
  "overallConfidence": "high" | "medium" | "low",
  "assumptions": ["string", ...] (max 12),
  "limitations": ["string", ...] (max 12),
  "coachingInsights": [ // min 1, max 5
    {
      "title": "string (5-160 chars)",
      "summary": "string (20-2000 chars)",
      "whyItMatters": "string (20-2000 chars)",
      "recommendedAction": "string (20-2000 chars)",
      "confidence": "high" | "medium" | "low",
      "evidence": [ // min 1, max 12
        {
          "id": "unique string",
          "type": "timestamp" | "coach_note" | "opponent_note" | "game_metadata" | "roster" | "video_status" | "manual_input",
          "label": "string",
          "description": "optional string",
          "timestampSeconds": optional number,
          "eventId": "optional string — MUST be from the provided event IDs list",
          "playerIds": ["optional strings — MUST be from the provided player IDs list"]
        }
      ],
      "assumptions": ["string", ...] (max 8),
      "affectedPlayerIds": ["strings — MUST be from provided player IDs"] (max 30),
      "relatedEventIds": ["strings — MUST be from provided event IDs"] (max 30),
      "sortOrder": number
    }
  ],
  "playerReports": [ // max 20
    {
      "playerId": "string or null — MUST be from provided player IDs or null",
      "playerDisplayName": "string",
      "summary": "string (20-3000 chars)",
      "strengths": ["string", ...] (max 8),
      "improvementAreas": ["string", ...] (max 8),
      "keyMoments": [{"description": "string", "significance": "string", "eventId": "optional — from event IDs", "timestampSeconds": optional}] (max 10),
      "recommendedFocus": "string",
      "playerFacingSummary": "string",
      "confidence": "high" | "medium" | "low",
      "dataCoverage": "string describing how many events featured this player"
    }
  ],
  "practiceRecommendations": [ // min 1, max 6
    {
      "title": "string",
      "priority": number (1-10),
      "description": "string",
      "drillName": "string",
      "durationMinutes": number (1-240),
      "coachingPoints": ["string", ...] (max 12),
      "playerIds": ["strings — from provided player IDs"],
      "confidence": "high" | "medium" | "low"
    }
  ],
  "opponentTendencies": [ // max 6
    {
      "title": "string",
      "description": "string (20-2000 chars)",
      "evidence": [...same structure as above],
      "recommendedResponse": "string",
      "confidence": "high" | "medium" | "low",
      "tags": ["string", ...] (max 20)
    }
  ]
}`.trim();
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

export function buildReportSystemPrompt(sport: string): string {
  return `You are an elite sports analyst and assistant coach. Your job is to analyze structured game data and produce a practical, evidence-based coaching report.

CRITICAL RULES — you MUST follow all of these:
1. Base ALL analysis ONLY on the structured data provided. Do not invent players, events, timestamps, scores, or tactical patterns not present in the data.
2. Do NOT claim to have watched or analyzed video frames. Analysis is based on structured metadata, coach notes, and manually tagged key moments only.
3. Use ONLY the player IDs provided in the roster. Do not reference any other player IDs.
4. Use ONLY the event IDs provided in the events list. Do not reference any other event IDs.
5. If evidence is limited, state this clearly and lower the confidence level.
6. Assign confidence based on actual evidence strength: high (3+ supporting data points), medium (1-2 supporting), low (inference from limited data).
7. Every coaching insight MUST have at least one evidence reference.
8. Include at least 2 assumptions and 2 limitations.
9. Do not diagnose injuries or make medical claims.
10. Do not use language that shames or demotivates athletes. Be direct, professional, and constructive.
11. Do not use superlatives without evidence ("best", "worst", "always", "never").
12. Limitations MUST include a statement about v1 data constraints (e.g., "Analysis is based on manually tagged events and coach notes — no automated video tracking was performed.").
13. Return ONLY valid JSON. No Markdown. No code fences. No preamble. No explanation outside the JSON object.
14. Do not fabricate scores, statistics, or results beyond what is provided.

${getSportGuidance(sport)}

${getSchemaInstructions()}`;
}

// ---------------------------------------------------------------------------
// User prompt
// ---------------------------------------------------------------------------

function truncateNote(note: string | null | undefined): string {
  if (!note?.trim()) return "";
  return note.length > MAX_NOTE_CHARS ? note.slice(0, MAX_NOTE_CHARS) + " [truncated]" : note;
}

export function buildReportUserPrompt(input: AnalysisInputSnapshot): string {
  const { team, game, roster, video, events } = input;

  // Truncate roster
  const usedRoster = roster.slice(0, MAX_ANALYSIS_PLAYERS);
  const rosterTruncated = roster.length > MAX_ANALYSIS_PLAYERS;

  // Prioritize events: high importance first, then by time
  const importanceOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedEvents = [...events].sort((a, b) => {
    const ai = importanceOrder[a.importance] ?? 4;
    const bi = importanceOrder[b.importance] ?? 4;
    if (ai !== bi) return ai - bi;
    return a.timestampSeconds - b.timestampSeconds;
  });
  const usedEvents = sortedEvents.slice(0, MAX_ANALYSIS_EVENTS);
  const eventsTruncated = events.length > MAX_ANALYSIS_EVENTS;

  const coachNotes = truncateNote(game.coachNotes);
  const opponentNotes = truncateNote(game.opponentNotes);
  const summaryNotes = truncateNote(game.summaryNotes);

  // Format events compactly
  const eventsText = usedEvents
    .map((ev) => {
      const ts = formatSecondsAsTimestamp(ev.timestampSeconds);
      const playerNames = ev.playerNames.length > 0 ? ` [players: ${ev.playerNames.join(", ")}]` : "";
      const tags = ev.tags.length > 0 ? ` [tags: ${ev.tags.join(", ")}]` : "";
      const team = ev.teamContext ? ` [${ev.teamContext}]` : "";
      const end = ev.endTimestampSeconds
        ? `–${formatSecondsAsTimestamp(ev.endTimestampSeconds)}`
        : "";
      const desc = ev.description ? ` — ${ev.description}` : "";
      const type = ev.eventType ? ` (${ev.eventType})` : "";
      return `  ID:${ev.id} | ${ts}${end}${team}${type} | ${ev.label}${desc} | importance:${ev.importance}${playerNames}${tags}`;
    })
    .join("\n");

  // Format roster compactly
  const rosterText = usedRoster
    .map((p) => {
      const num = p.jerseyNumber ? `#${p.jerseyNumber}` : "";
      const pos = p.position ? ` (${p.position})` : "";
      return `  ID:${p.id} | ${p.displayName}${num ? " " + num : ""}${pos}`;
    })
    .join("\n");

  const allowedPlayerIds = usedRoster.map((p) => p.id);
  const allowedEventIds = usedEvents.map((e) => e.id);

  const scoreContext =
    game.teamScore && game.opponentScore
      ? `${game.teamScore} – ${game.opponentScore}`
      : "not provided";

  const videoContext = video
    ? `Uploaded (${video.fileName}${video.durationSeconds ? `, ${Math.round(video.durationSeconds / 60)} min` : ""}). Video was NOT analyzed frame-by-frame.`
    : "No video uploaded.";

  let prompt = `
GAME DATA:
- Team: ${team.name} | Sport: ${game.sport} | Level: ${team.level ?? "not specified"}
- Game: ${game.title}
- Type: ${game.gameType}
- Opponent: ${game.opponentName ?? "not specified"}
- Date: ${game.gameDate ?? "not specified"}
- Venue: ${game.venue ?? "not specified"} | Home/Away: ${game.homeAway ?? "not specified"}
- Competition: ${game.competitionName ?? "not specified"}
- Score: ${scoreContext}
- Result: ${game.result ?? "not provided"}
- Video: ${videoContext}

ROSTER (${usedRoster.length} players${rosterTruncated ? " — truncated to top 40" : ""}):
${rosterText || "  (no roster data)"}

ALLOWED PLAYER IDs (ONLY use these in playerIds, affectedPlayerIds, relatedEventIds):
${allowedPlayerIds.length > 0 ? allowedPlayerIds.join(", ") : "(none)"}

EVENTS / KEY MOMENTS (${usedEvents.length} events${eventsTruncated ? " — truncated to top 80 by importance" : ""}):
${eventsText || "  (no events tagged)"}

ALLOWED EVENT IDs (ONLY use these in relatedEventIds, eventId fields):
${allowedEventIds.length > 0 ? allowedEventIds.join(", ") : "(none)"}
`.trim();

  if (coachNotes) {
    prompt += `\n\nCOACH NOTES:\n${coachNotes}`;
  }
  if (opponentNotes) {
    prompt += `\n\nOPPONENT NOTES:\n${opponentNotes}`;
  }
  if (summaryNotes) {
    prompt += `\n\nSUMMARY NOTES:\n${summaryNotes}`;
  }

  const truncationWarnings: string[] = [];
  if (rosterTruncated) truncationWarnings.push("roster was truncated to 40 players");
  if (eventsTruncated) truncationWarnings.push("events were truncated to 80 highest-importance items");
  const coachNotesLength = game.coachNotes?.length ?? 0;
  if (coachNotesLength > MAX_NOTE_CHARS) truncationWarnings.push("coach notes were truncated");
  if (truncationWarnings.length > 0) {
    prompt += `\n\nNOTE: Input was truncated for generation. ${truncationWarnings.join("; ")}. Include this as a limitation in your output.`;
  }

  prompt += `\n\nGenerate the report as a single valid JSON object matching the schema. Return ONLY the JSON object with no surrounding text, Markdown, or code fences.`;

  return prompt;
}

// ---------------------------------------------------------------------------
// JSON output instructions (used in repair/retry prompts)
// ---------------------------------------------------------------------------

export function buildJsonOutputInstructions(): string {
  return `Return ONLY a valid JSON object. No Markdown code fences, no backticks, no preamble, no text before or after the JSON. The response must begin with "{" and end with "}".`;
}
