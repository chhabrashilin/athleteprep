/**
 * lib/analysis/evidence.ts — Utilities for resolving and rendering evidence references.
 *
 * Evidence items are stored as JSONB on coaching_insights.evidence and
 * opponent_tendencies.evidence. They may reference event_timestamp IDs,
 * coach note text, game metadata, etc.
 *
 * These helpers resolve raw evidence items to display-ready data.
 */
import type { EvidenceItem, EventTimestamp, Player } from "@/types/database";
import { formatSecondsAsTimestamp } from "@/lib/utils/time";

export type EvidenceType = EvidenceItem["type"];

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

export interface ResolvedEvidenceItem {
  id: string;
  type: EvidenceType;
  label: string;
  description: string;
  timestampSeconds: number | null;
  formattedTimestamp: string | null;
  eventId: string | null;
  playerIds: string[];
  playerNames: string[];
  event: EventTimestamp | null;
}

/**
 * Resolves a single evidence item, enriching it with event data if available.
 */
export function resolveEvidenceItem(
  item: EvidenceItem,
  eventMap: Map<string, EventTimestamp>,
  playerMap: Map<string, Player>
): ResolvedEvidenceItem {
  const eventId = item.eventId ?? null;
  const event = eventId ? (eventMap.get(eventId) ?? null) : null;

  const rawPlayerIds = item.playerIds ?? [];
  const eventPlayerIds = event?.playerIds ?? [];
  const allPlayerIds = [...new Set([...rawPlayerIds, ...eventPlayerIds])];

  const playerNames = allPlayerIds
    .map((id) => {
      const p = playerMap.get(id);
      return p ? (p.displayName?.trim() || `${p.firstName} ${p.lastName ?? ""}`.trim()) : null;
    })
    .filter((n): n is string => !!n);

  const ts = item.timestampSeconds ?? event?.timestampSeconds ?? null;

  let description = item.description ?? "";
  if (!description && event) {
    description = event.label;
    if (event.description) description += ` — ${event.description.slice(0, 100)}`;
  }

  return {
    id: item.id,
    type: item.type,
    label: item.label || (event?.label ?? "Evidence item"),
    description,
    timestampSeconds: ts,
    formattedTimestamp: ts != null ? formatSecondsAsTimestamp(ts) : null,
    eventId,
    playerIds: allPlayerIds,
    playerNames,
    event,
  };
}

/**
 * Resolves all evidence items in a list.
 */
export function resolveEvidenceList(
  evidence: EvidenceItem[],
  eventMap: Map<string, EventTimestamp>,
  playerMap: Map<string, Player>
): ResolvedEvidenceItem[] {
  return evidence.map((item) => resolveEvidenceItem(item, eventMap, playerMap));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function buildEventMap(events: EventTimestamp[]): Map<string, EventTimestamp> {
  return new Map(events.map((e) => [e.id, e]));
}

export function buildPlayerMap(players: Player[]): Map<string, Player> {
  return new Map(players.map((p) => [p.id, p]));
}

export function getEvidenceTypeLabel(type: EvidenceType): string {
  const labels: Record<EvidenceType, string> = {
    timestamp: "Key moment",
    coach_note: "Coach note",
    opponent_note: "Opponent note",
    game_metadata: "Game data",
    roster: "Roster",
    video_status: "Video",
    manual_input: "Manual input",
    stat: "Statistic",
    video: "Video",
  };
  return labels[type] ?? "Evidence";
}

export function hasTimestampEvidence(evidence: EvidenceItem[]): boolean {
  return evidence.some((e) => e.type === "timestamp" && (e.timestampSeconds != null || e.eventId));
}

export function getTimestampEvidence(evidence: ResolvedEvidenceItem[]): ResolvedEvidenceItem[] {
  return evidence.filter((e) => e.type === "timestamp" && e.timestampSeconds != null);
}
