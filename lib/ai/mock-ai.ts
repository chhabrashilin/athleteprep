/**
 * lib/ai/mock-ai.ts — Data-driven mock AI report generator.
 *
 * This generator is deterministic: given the same AnalysisInputSnapshot it
 * produces the same output. It uses real event labels, player names, timestamps,
 * and notes — it never fabricates data not present in the input.
 *
 * Replaces the old generic stub with a fully evidence-grounded generator.
 * When real LLM integration is added, this file is replaced by lib/ai/openai.ts
 * or lib/ai/anthropic.ts using the same AnalysisInputSnapshot input contract.
 */
import type {
  AnalysisInputSnapshot,
  AnalysisEvent,
  EvidenceReference,
  GeneratedCoachingInsight,
  GeneratedPlayerReport,
  GeneratedPracticeRecommendation,
  GeneratedOpponentTendency,
  GeneratedGameReport,
  GeneratedPlayerKeyMoment,
} from "@/types/analysis";
import type { ConfidenceLevel } from "@/types/core";
import { formatSecondsAsTimestamp } from "@/lib/utils/time";

// ---------------------------------------------------------------------------
// Confidence helpers
// ---------------------------------------------------------------------------

function confidenceFromCount(count: number): ConfidenceLevel {
  if (count >= 4) return "high";
  if (count >= 2) return "medium";
  return "low";
}

// ---------------------------------------------------------------------------
// Executive summary
// ---------------------------------------------------------------------------

function buildExecutiveSummary(input: AnalysisInputSnapshot): string {
  const { game, roster, video, events } = input;

  const parts: string[] = [];

  const titleContext = game.opponentName
    ? `${game.title} (vs. ${game.opponentName})`
    : game.title;

  if (events.length > 0) {
    parts.push(`Based on ${events.length} manually tagged key moment${events.length !== 1 ? "s" : ""}`);
  }
  if (game.coachNotes?.trim()) {
    parts.push("coach notes");
  }
  if (video) {
    parts.push("an uploaded match video");
  }

  const evidencePart = parts.length > 0 ? parts.join(", ") + ", " : "";

  let summary = `${evidencePart}this report analyzes ${titleContext}.`;

  // Result context
  if (game.result && game.result.toLowerCase() !== "n/a" && game.result.toLowerCase() !== "not played") {
    const scoreContext =
      game.teamScore && game.opponentScore
        ? ` (${game.teamScore} – ${game.opponentScore})`
        : "";
    summary += ` Result: ${game.result}${scoreContext}.`;
  }

  // Identify main themes from event types
  const eventTypes = events
    .map((e) => e.eventType)
    .filter((t): t is string => !!t);
  const typeCounts: Record<string, number> = {};
  eventTypes.forEach((t) => { typeCounts[t] = (typeCounts[t] ?? 0) + 1; });
  const topTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type);

  if (topTypes.length > 0) {
    summary += ` Key themes: ${topTypes.join(", ")}.`;
  }

  // Roster context
  if (roster.length > 0) {
    summary += ` ${roster.length} active roster player${roster.length !== 1 ? "s" : ""} included.`;
  }

  // Confidence context
  const highOrCritical = events.filter(
    (e) => e.importance === "high" || e.importance === "critical"
  ).length;
  if (highOrCritical > 0) {
    summary += ` ${highOrCritical} high-impact moment${highOrCritical !== 1 ? "s" : ""} identified.`;
  }

  // Honesty disclaimer
  summary += " All insights are derived from manually entered data — automated video frame analysis is not active in this MVP. Review each insight and adjust as needed.";

  return summary;
}

// ---------------------------------------------------------------------------
// Event grouping helpers
// ---------------------------------------------------------------------------

type EventGroup = {
  label: string;
  events: AnalysisEvent[];
  playerIds: string[];
};

function groupEventsByType(events: AnalysisEvent[]): EventGroup[] {
  const groups: Map<string, AnalysisEvent[]> = new Map();

  for (const e of events) {
    const key = e.eventType ?? "General";
    const group = groups.get(key) ?? [];
    group.push(e);
    groups.set(key, group);
  }

  return Array.from(groups.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([label, evts]) => ({
      label,
      events: evts,
      playerIds: [...new Set(evts.flatMap((e) => e.playerIds))],
    }));
}

function groupEventsByTag(events: AnalysisEvent[]): EventGroup[] {
  const groups: Map<string, AnalysisEvent[]> = new Map();

  for (const e of events) {
    for (const tag of e.tags) {
      const group = groups.get(tag) ?? [];
      group.push(e);
      groups.set(tag, group);
    }
  }

  return Array.from(groups.entries())
    .filter(([, evts]) => evts.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([label, evts]) => ({
      label,
      events: evts,
      playerIds: [...new Set(evts.flatMap((e) => e.playerIds))],
    }));
}

function getHighImpactEvents(events: AnalysisEvent[]): AnalysisEvent[] {
  return events.filter(
    (e) => e.importance === "critical" || e.importance === "high"
  );
}

function getOpponentContextEvents(events: AnalysisEvent[]): AnalysisEvent[] {
  return events.filter(
    (e) => e.teamContext === "opponent" || e.teamContext === "both"
  );
}

// ---------------------------------------------------------------------------
// Evidence reference builders
// ---------------------------------------------------------------------------

function eventToEvidence(e: AnalysisEvent): EvidenceReference {
  return {
    id: `evt_${e.id}`,
    type: "timestamp",
    label: e.label,
    description:
      e.description ??
      (e.eventType ? `Tagged as ${e.eventType}` : "Tagged key moment") +
        (e.importance !== "medium" ? ` (${e.importance} importance)` : "") + ".",
    timestampSeconds: e.timestampSeconds,
    eventId: e.id,
    playerIds: e.playerIds,
  };
}

function coachNoteEvidence(notes: string): EvidenceReference {
  const snippet = notes.length > 120 ? notes.slice(0, 120).trimEnd() + "…" : notes;
  return {
    id: "coach_note",
    type: "coach_note",
    label: "Coach notes",
    description: snippet,
  };
}

function opponentNoteEvidence(notes: string): EvidenceReference {
  const snippet = notes.length > 120 ? notes.slice(0, 120).trimEnd() + "…" : notes;
  return {
    id: "opponent_note",
    type: "opponent_note",
    label: "Opponent notes",
    description: snippet,
  };
}

// ---------------------------------------------------------------------------
// Coaching insight generators
// ---------------------------------------------------------------------------

function buildCoachingInsights(input: AnalysisInputSnapshot): GeneratedCoachingInsight[] {
  const { game, events } = input;
  const insights: GeneratedCoachingInsight[] = [];
  let sortOrder = 0;

  // Strategy: build up to 5 insights from different evidence sources
  // 1. High-impact events cluster
  // 2. Most common event type
  // 3. Tag patterns
  // 4. Coach note theme
  // 5. Own-team vs opponent breakdown

  const highImpact = getHighImpactEvents(events);
  const typeGroups = groupEventsByType(events);
  const tagGroups = groupEventsByTag(events);

  // Insight 1: high-impact events pattern (if 2+ high/critical events)
  if (highImpact.length >= 2) {
    const evidence: EvidenceReference[] = highImpact.slice(0, 5).map(eventToEvidence);
    if (game.coachNotes?.trim()) evidence.push(coachNoteEvidence(game.coachNotes));

    insights.push({
      title: `${highImpact.length} High-Impact Moment${highImpact.length !== 1 ? "s" : ""} Identified`,
      summary: `${highImpact.length} key moment${highImpact.length !== 1 ? "s" : ""} were tagged as high or critical importance. These represent the most significant events in the session and deserve priority attention.`,
      whyItMatters: "High-impact events often reveal the decisive moments in a game — where results are won or lost. Reviewing these directly with players increases learning efficiency.",
      recommendedAction: `Review the ${highImpact.length} high-impact moments with the team. For each, discuss what happened, why it happened, and how to replicate or prevent it.`,
      confidence: confidenceFromCount(highImpact.length),
      evidence,
      assumptions: [
        "Importance ratings were assigned by the coach. Analysis treats them as authoritative.",
        "This insight covers events marked high or critical. Medium/low importance events are analyzed separately.",
      ],
      affectedPlayerIds: [...new Set(highImpact.flatMap((e) => e.playerIds))],
      relatedEventIds: highImpact.map((e) => e.id),
      sortOrder: sortOrder++,
    });
  }

  // Insight 2: top event type pattern (if dominant type has 2+ events)
  const topTypeGroup = typeGroups[0];
  if (topTypeGroup && topTypeGroup.events.length >= 2) {
    const evidence: EvidenceReference[] = topTypeGroup.events.slice(0, 4).map(eventToEvidence);

    const contextNote = topTypeGroup.events.some((e) => e.teamContext === "opponent")
      ? "These events include both own-team and opponent moments."
      : "";

    insights.push({
      title: `Recurring "${topTypeGroup.label}" Pattern (${topTypeGroup.events.length} events)`,
      summary: `"${topTypeGroup.label}" was the most frequently tagged event type with ${topTypeGroup.events.length} instance${topTypeGroup.events.length !== 1 ? "s" : ""}. ${contextNote} This recurrence suggests a systematic pattern worth addressing.`,
      whyItMatters: "When a specific event type repeats, it often signals an underlying tactical or technical issue — or a consistent strength — that systematic coaching can address.",
      recommendedAction: `Review all ${topTypeGroup.events.length} "${topTypeGroup.label}" events. Identify whether they share a common cause, situation, or player involvement.`,
      confidence: confidenceFromCount(topTypeGroup.events.length),
      evidence,
      assumptions: [
        `"${topTypeGroup.label}" events were tagged consistently by the coach.`,
        "Recurrence is interpreted as a pattern, not confirmed causality.",
      ],
      affectedPlayerIds: topTypeGroup.playerIds,
      relatedEventIds: topTypeGroup.events.map((e) => e.id),
      sortOrder: sortOrder++,
    });
  }

  // Insight 3: tag pattern (if a tag appears on 2+ events)
  const topTagGroup = tagGroups[0];
  if (topTagGroup && insights.length < 5) {
    const evidence: EvidenceReference[] = topTagGroup.events.slice(0, 3).map(eventToEvidence);

    insights.push({
      title: `"${topTagGroup.label}" Tag Cluster (${topTagGroup.events.length} events)`,
      summary: `The tag "${topTagGroup.label}" appeared across ${topTagGroup.events.length} events. This cross-cutting theme suggests it may be a recurring pattern worth examining separately from individual event types.`,
      whyItMatters: "Tags applied across multiple event types often reveal underlying tactical themes the coach noticed during the game.",
      recommendedAction: `Examine the ${topTagGroup.events.length} events tagged "${topTagGroup.label}" to identify the common thread and determine if it requires dedicated practice time.`,
      confidence: confidenceFromCount(topTagGroup.events.length),
      evidence,
      assumptions: [
        "Tags were applied consistently and intentionally by the coach.",
        `"${topTagGroup.label}" is interpreted as a coaching-relevant category, not just an administrative label.`,
      ],
      affectedPlayerIds: topTagGroup.playerIds,
      relatedEventIds: topTagGroup.events.map((e) => e.id),
      sortOrder: sortOrder++,
    });
  }

  // Insight 4: coach notes theme (if notes exist and we have room)
  if (game.coachNotes?.trim() && insights.length < 5) {
    const noteEvidence: EvidenceReference[] = [coachNoteEvidence(game.coachNotes)];
    if (events.length > 0) {
      noteEvidence.push(...events.slice(0, 2).map(eventToEvidence));
    }

    const notesSnippet = game.coachNotes.trim().slice(0, 100);

    insights.push({
      title: "Coach Notes Analysis",
      summary: `The coach entered session notes${events.length > 0 ? ` corroborated by ${events.length} tagged event${events.length !== 1 ? "s" : ""}` : ""}. Key context: "${notesSnippet}${game.coachNotes.trim().length > 100 ? "…" : ""}"`,
      whyItMatters: "Coach observations capture tactical and contextual details that tagged events alone may not reveal. These notes represent expert in-game judgment.",
      recommendedAction: "Review the coach notes with the team as context for the other insights. Use the specific observations to guide discussion.",
      confidence: events.length >= 3 ? "medium" : "low",
      evidence: noteEvidence,
      assumptions: [
        "Coach notes reflect the coach's real-time observations and judgment.",
        "Notes are used verbatim — the AI has not interpreted or transformed their meaning.",
      ],
      affectedPlayerIds: [],
      relatedEventIds: events.slice(0, 2).map((e) => e.id),
      sortOrder: sortOrder++,
    });
  }

  // Insight 5: own-team execution vs. opponent patterns split
  const ownTeamEvents = events.filter(
    (e) => e.teamContext === "own_team" || e.teamContext === "both"
  );
  const opponentEvents = getOpponentContextEvents(events);

  if (ownTeamEvents.length >= 2 && insights.length < 5) {
    const evidence: EvidenceReference[] = ownTeamEvents.slice(0, 3).map(eventToEvidence);

    const posEvents = ownTeamEvents.filter(
      (e) => e.eventType?.toLowerCase().includes("strong") ||
        e.eventType?.toLowerCase().includes("goal") ||
        e.eventType?.toLowerCase().includes("scoring")
    );
    const negEvents = ownTeamEvents.filter(
      (e) => e.eventType?.toLowerCase().includes("mistake") ||
        e.eventType?.toLowerCase().includes("error") ||
        e.eventType?.toLowerCase().includes("breakdown") ||
        e.importance === "critical"
    );

    const slant = negEvents.length > posEvents.length
      ? "execution challenges"
      : posEvents.length >= 2
      ? "strong execution moments"
      : "mixed execution";

    insights.push({
      title: `Own-Team Execution: ${ownTeamEvents.length} Tagged Moment${ownTeamEvents.length !== 1 ? "s" : ""}`,
      summary: `${ownTeamEvents.length} event${ownTeamEvents.length !== 1 ? "s" : ""} were tagged in an own-team context, highlighting ${slant}. ${opponentEvents.length > 0 ? `${opponentEvents.length} opponent-related moments were also identified.` : ""}`,
      whyItMatters: "Reviewing your own team's execution — both successes and mistakes — is the foundation of tactical learning. These moments provide direct coaching evidence.",
      recommendedAction: "Walk through each own-team tagged event with players, focusing on decision-making and execution quality.",
      confidence: confidenceFromCount(ownTeamEvents.length),
      evidence,
      assumptions: [
        "Team context was applied accurately by the coach during tagging.",
        "Analysis does not distinguish between individual and team execution issues.",
      ],
      affectedPlayerIds: [...new Set(ownTeamEvents.flatMap((e) => e.playerIds))],
      relatedEventIds: ownTeamEvents.map((e) => e.id),
      sortOrder: sortOrder++,
    });
  }

  // If we have no events at all, generate a meta-insight about the data state
  if (insights.length === 0) {
    const noteEvidence: EvidenceReference[] = [];
    if (game.coachNotes?.trim()) noteEvidence.push(coachNoteEvidence(game.coachNotes));
    if (game.opponentNotes?.trim()) noteEvidence.push(opponentNoteEvidence(game.opponentNotes));

    insights.push({
      title: "Report Generated from Notes Only",
      summary: "This report was generated without tagged event timestamps. Insights are based solely on coach notes and game metadata, which limits the depth of analysis available.",
      whyItMatters: "Evidence-linked insights require tagged timestamps. Without them, the AI can only reflect what was written in notes, not specific game moments.",
      recommendedAction: "Return to this game and tag key moments using the timestamps editor. Even 3–5 events significantly improve report quality and specificity.",
      confidence: "low",
      evidence: noteEvidence,
      assumptions: [
        "No event timestamps were tagged for this game.",
        "All analysis is derived from coach notes and game metadata only.",
      ],
      affectedPlayerIds: [],
      relatedEventIds: [],
      sortOrder: sortOrder++,
    });
  }

  return insights.slice(0, 5);
}

// ---------------------------------------------------------------------------
// Player report generator
// ---------------------------------------------------------------------------

function buildPlayerReports(input: AnalysisInputSnapshot): GeneratedPlayerReport[] {
  const { roster, events } = input;

  const reports: GeneratedPlayerReport[] = [];

  // Find which players are tagged in at least one event
  const taggedPlayerIds = new Set(events.flatMap((e) => e.playerIds));

  // Primary: players tagged in events
  const taggedPlayers = roster.filter((p) => taggedPlayerIds.has(p.id));

  // Secondary: first 2 untagged players (low confidence, if roster exists and tagged < 3)
  const untaggedPlayers = roster
    .filter((p) => !taggedPlayerIds.has(p.id))
    .slice(0, Math.max(0, 3 - taggedPlayers.length));

  const playersToReport = [...taggedPlayers, ...untaggedPlayers].slice(0, 10);

  for (const player of playersToReport) {
    const isTagged = taggedPlayerIds.has(player.id);
    const playerEvents = events.filter((e) => e.playerIds.includes(player.id));
    const eventCount = playerEvents.length;

    const keyMoments: GeneratedPlayerKeyMoment[] = playerEvents.slice(0, 4).map((e) => ({
      description: e.label + (e.description ? ` — ${e.description.slice(0, 80)}` : ""),
      significance: `Marked as ${e.importance} importance at ${formatSecondsAsTimestamp(e.timestampSeconds)}${e.eventType ? ` (${e.eventType})` : ""}.`,
      eventId: e.id,
      timestampSeconds: e.timestampSeconds,
    }));

    const positiveEvents = playerEvents.filter(
      (e) => e.eventType?.toLowerCase().includes("strong") ||
        e.eventType?.toLowerCase().includes("goal") ||
        e.eventType?.toLowerCase().includes("scoring") ||
        e.importance === "high"
    );
    const developmentEvents = playerEvents.filter(
      (e) => e.eventType?.toLowerCase().includes("mistake") ||
        e.eventType?.toLowerCase().includes("error") ||
        e.importance === "critical"
    );

    const strengths = isTagged && positiveEvents.length > 0
      ? positiveEvents.slice(0, 2).map((e) => `Contributed to ${e.label} at ${formatSecondsAsTimestamp(e.timestampSeconds)}`)
      : isTagged
      ? [`Involved in ${eventCount} tagged moment${eventCount !== 1 ? "s" : ""} during the session`]
      : ["No specific moments tagged — requires additional game data for evaluation"];

    const improvementAreas = developmentEvents.length > 0
      ? developmentEvents.slice(0, 2).map((e) => `Review ${e.label} at ${formatSecondsAsTimestamp(e.timestampSeconds)} for improvement`)
      : isTagged
      ? ["Continue tracking key moments for more specific improvement areas"]
      : ["Tag this player in future key moments to generate specific improvement guidance"];

    const confidence: ConfidenceLevel = isTagged
      ? confidenceFromCount(eventCount)
      : "low";

    const dataCoverage = isTagged
      ? `${player.displayName} was involved in ${eventCount} of ${events.length} tagged event${events.length !== 1 ? "s" : ""}.`
      : `${player.displayName} was not tagged in any key moments. Analysis quality will improve with player-specific tagging.`;

    const summary = isTagged
      ? `${player.displayName} was involved in ${eventCount} tagged moment${eventCount !== 1 ? "s" : ""} this session.${eventCount === 0 ? " Additional tagging is needed for a complete assessment." : ""}`
      : `${player.displayName} was not tagged in any key moments. Consider tagging this player in relevant events for a more complete report.`;

    const playerFacingSummary = isTagged && eventCount > 0
      ? `You were tagged in ${eventCount} key moment${eventCount !== 1 ? "s" : ""} this session. Review the timestamps to see specific coaching feedback on your performance.`
      : `No specific moments were tagged for you in this session. Your coach will be able to give you more detailed feedback after reviewing the footage.`;

    reports.push({
      playerId: player.id,
      playerDisplayName: player.displayName,
      summary,
      strengths,
      improvementAreas,
      keyMoments,
      recommendedFocus: isTagged && eventCount > 0
        ? `Focus on the ${developmentEvents.length > 0 ? developmentEvents[0].eventType ?? "highlighted" : "key"} moments identified in this session.`
        : "Work with your coach to identify specific focus areas based on your next game performance.",
      playerFacingSummary,
      confidence,
      dataCoverage,
    });
  }

  return reports;
}

// ---------------------------------------------------------------------------
// Practice recommendation generator
// ---------------------------------------------------------------------------

function buildPracticeRecommendations(
  input: AnalysisInputSnapshot,
  _insights: GeneratedCoachingInsight[]
): GeneratedPracticeRecommendation[] {
  const { game, events, roster } = input;
  const sport = game.sport;
  const recs: GeneratedPracticeRecommendation[] = [];

  const highImpact = getHighImpactEvents(events);
  const typeGroups = groupEventsByType(events);
  const allPlayerIds = roster.map((p) => p.id);

  // Rec 1: address the top-tagged event type
  const topType = typeGroups[0];
  if (topType && topType.events.length >= 2) {
    const drillName = getDrillForEventType(topType.label, sport);
    recs.push({
      title: `${topType.label} — Focused Practice`,
      priority: 1,
      description: `Address the ${topType.events.length} "${topType.label}" moments identified this session with a targeted practice drill.`,
      drillName,
      durationMinutes: 20,
      coachingPoints: [
        `Review the ${topType.events.length} tagged moments before the drill`,
        "Emphasize recognition and decision-making in the relevant situation",
        "Use game-realistic pressure and opposition",
      ],
      playerIds: topType.playerIds.length > 0 ? topType.playerIds : allPlayerIds,
      confidence: confidenceFromCount(topType.events.length),
    });
  }

  // Rec 2: high-impact moments review session
  if (highImpact.length >= 2) {
    recs.push({
      title: "High-Impact Moments Film Review",
      priority: 2,
      description: `Review the ${highImpact.length} high/critical importance moments from this session as a team.`,
      drillName: "Team film session",
      durationMinutes: 15,
      coachingPoints: [
        "Focus on decision-making in the final third/key moments",
        "Ask players to explain what they saw and what they would do differently",
        "Highlight both successful and unsuccessful high-impact moments",
      ],
      playerIds: [...new Set(highImpact.flatMap((e) => e.playerIds))],
      confidence: confidenceFromCount(highImpact.length),
    });
  }

  // Rec 3: based on coach notes (generic recommendation if notes exist)
  if (game.coachNotes?.trim()) {
    recs.push({
      title: "Session Themes from Coach Notes",
      priority: 3,
      description: "Address the key themes the coach identified in their session notes with a focused practice activity.",
      drillName: `${sportDrillContext(sport)} — themed session`,
      durationMinutes: 25,
      coachingPoints: [
        "Use coach notes as the starting brief",
        "Focus on the specific situation or pattern that concerned you most",
        "End with a game-realistic application of the concept",
      ],
      playerIds: allPlayerIds,
      confidence: "medium",
    });
  }

  // Rec 4: opponent preparation (if opponent notes or opponent events exist)
  const opponentEvents = getOpponentContextEvents(events);
  if (game.opponentNotes?.trim() || opponentEvents.length >= 2) {
    recs.push({
      title: "Opponent Preparation",
      priority: 4,
      description: `Prepare for your next opponent using the tendencies identified${opponentEvents.length > 0 ? ` (${opponentEvents.length} opponent moments tagged)` : ""} in your notes.`,
      drillName: "Shadow play — opponent simulation",
      durationMinutes: 20,
      coachingPoints: [
        "Simulate the opponent's identified patterns in small-sided games",
        "Practice your counters to their tendencies",
        "Emphasize recognition and early pressure",
      ],
      playerIds: allPlayerIds,
      confidence: opponentEvents.length >= 2 ? "medium" : "low",
    });
  }

  // Rec 5: general session wrap-up
  if (recs.length < 3) {
    recs.push({
      title: "General Session Review and Physical Conditioning",
      priority: recs.length + 1,
      description: "Use next session to reinforce the main tactical themes from this game with a mix of technical and physical work.",
      drillName: `${sportDrillContext(sport)} — combined session`,
      durationMinutes: 30,
      coachingPoints: [
        "Warm up with technique reinforcement relevant to game issues",
        "Transition to tactical exercises based on identified patterns",
        "Close with a full small-sided game to test adaptations",
      ],
      playerIds: allPlayerIds,
      confidence: "low",
    });
  }

  return recs.slice(0, 5);
}

function getDrillForEventType(eventType: string, sport: string): string {
  const lower = eventType.toLowerCase();

  if (lower.includes("transition")) return "Transition shadow play: ball-loss trigger drill";
  if (lower.includes("set piece")) return `${sportDrillContext(sport)} set piece practice`;
  if (lower.includes("defensive")) return "Defensive shape and recovery drill";
  if (lower.includes("pressing")) return "High-press trigger training";
  if (lower.includes("scoring") || lower.includes("goal")) return "Finishing under pressure drill";
  if (lower.includes("mistake") || lower.includes("error")) return "Decision-making under pressure";
  if (lower.includes("wicket")) return "Bowling spell review and line/length drill";
  if (lower.includes("boundary")) return "Batting shot selection drill";
  if (lower.includes("fast break")) return "Transition offense/defense drill";
  if (lower.includes("rebounding")) return "Box-out and rebounding positioning";

  return `${sportDrillContext(sport)} — pattern-specific drill`;
}

function sportDrillContext(sport: string): string {
  switch (sport) {
    case "soccer": return "Small-sided game";
    case "cricket": return "Practice match scenarios";
    case "basketball": return "Half-court drill";
    case "american_football": return "Position-group drill";
    case "hockey": return "Power play/penalty kill drill";
    case "volleyball": return "Serve-receive drill";
    default: return "Team drill session";
  }
}

// ---------------------------------------------------------------------------
// Opponent tendency generator
// ---------------------------------------------------------------------------

function buildOpponentTendencies(input: AnalysisInputSnapshot): GeneratedOpponentTendency[] {
  const { game, events } = input;
  const tendencies: GeneratedOpponentTendency[] = [];

  const opponentEvents = getOpponentContextEvents(events);

  // From opponent notes
  if (game.opponentNotes?.trim()) {
    const note = game.opponentNotes.trim();
    const snippet = note.length > 150 ? note.slice(0, 150).trimEnd() + "…" : note;

    tendencies.push({
      title: "Opponent Tendencies (from coach notes)",
      description: snippet,
      evidence: [
        opponentNoteEvidence(game.opponentNotes),
        ...opponentEvents.slice(0, 2).map(eventToEvidence),
      ],
      recommendedResponse: "Review the noted opponent tendencies and prepare counter-strategies in training. Shadow-play the opponent's patterns to build team recognition.",
      confidence: opponentEvents.length >= 2 ? "medium" : "low",
      tags: ["opponent", "scouting", "preparation"],
    });
  }

  // From opponent-context events
  if (opponentEvents.length >= 2) {
    const eventTypes = opponentEvents
      .map((e) => e.eventType)
      .filter((t): t is string => !!t);
    const typeSummary =
      eventTypes.length > 0
        ? eventTypes.slice(0, 3).join(", ")
        : "various patterns";

    tendencies.push({
      title: `Opponent Patterns from Tagged Events (${opponentEvents.length} moments)`,
      description: `${opponentEvents.length} key moments were tagged with opponent context, covering: ${typeSummary}. These represent patterns the coach identified as coming from the opponent during the game.`,
      evidence: opponentEvents.slice(0, 4).map(eventToEvidence),
      recommendedResponse: "Use the tagged opponent moments for video review with your team. Focus on how to counter the identified patterns.",
      confidence: confidenceFromCount(opponentEvents.length),
      tags: opponentEvents.flatMap((e) => e.tags).slice(0, 5),
    });
  }

  // If no opponent data, add a low-confidence placeholder
  if (tendencies.length === 0) {
    tendencies.push({
      title: "Opponent Analysis Requires More Data",
      description: "No opponent notes or opponent-context events were found. To generate opponent tendency analysis, add opponent notes in the game details or tag events with 'Opponent' team context.",
      evidence: [],
      recommendedResponse: "Add opponent notes or tag key moments with 'Opponent' team context in the timestamps editor.",
      confidence: "low",
      tags: ["opponent", "incomplete"],
    });
  }

  return tendencies.slice(0, 4);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Generates a fully evidence-grounded mock report from the input snapshot.
 * All content references real events, players, and notes from the input.
 * Never fabricates data not present in the snapshot.
 */
export function generateMockGameReport(
  input: AnalysisInputSnapshot
): GeneratedGameReport {
  const { game, events, video } = input;

  const coachingInsights = buildCoachingInsights(input);
  const playerReports = buildPlayerReports(input);
  const practiceRecommendations = buildPracticeRecommendations(input, coachingInsights);
  const opponentTendencies = buildOpponentTendencies(input);

  // Overall confidence based on evidence richness
  const evidenceScore =
    Math.min(events.length, 10) * 2 +
    (game.coachNotes?.trim() ? 5 : 0) +
    (video ? 3 : 0) +
    (game.opponentNotes?.trim() ? 2 : 0);

  const overallConfidence: ConfidenceLevel =
    evidenceScore >= 20 ? "high" : evidenceScore >= 8 ? "medium" : "low";

  const assumptions: string[] = [
    "All insights are derived from manually entered timestamps and coach notes.",
    "Event importance ratings were applied by the coach and are treated as authoritative.",
    "Player involvement is based solely on player tags entered in the timestamps editor.",
  ];

  if (events.length === 0) {
    assumptions.push("No event timestamps were found. All analysis is based on notes and metadata only.");
  }
  if (!video) {
    assumptions.push("No video asset was uploaded. Video context is not available for this report.");
  }

  const limitations: string[] = [
    "This report is based on manually entered timestamps and notes — not automated video analysis.",
    "Automated player tracking and ball tracking are not active in this MVP.",
    "Video was uploaded, but frame-level computer vision analysis was not performed.",
    "Confidence levels reflect evidence quantity and quality at time of generation.",
  ];

  if (events.length < 5) {
    limitations.push(`Only ${events.length} event${events.length !== 1 ? "s" : ""} were tagged. 5+ events significantly improve insight quality.`);
  }
  if (!game.coachNotes?.trim()) {
    limitations.push("No coach notes were provided. Adding session notes improves report depth.");
  }

  const opponentLabel = game.opponentName ? ` vs. ${game.opponentName}` : "";
  const dateLabel = game.gameDate ? ` (${game.gameDate})` : "";

  return {
    title: `AI Report — ${game.title}${opponentLabel}${dateLabel}`,
    executiveSummary: buildExecutiveSummary(input),
    overallConfidence,
    assumptions,
    limitations,
    coachingInsights,
    playerReports,
    practiceRecommendations,
    opponentTendencies,
  };
}
