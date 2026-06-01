/**
 * lib/db/timestamps.ts — Event timestamp data access.
 * All functions use the authenticated server Supabase client.
 * Call only from Server Components, Server Actions, or Route Handlers.
 */
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { EventTimestamp } from "@/types/database";
import type { EventImportance } from "@/types/sports";
import type { ConfidenceLevel } from "@/types/core";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateEventTimestampInput {
  teamId: string;
  gameId: string;
  videoAssetId?: string | null;
  timestampSeconds: number;
  endTimestampSeconds?: number | null;
  label: string;
  eventType?: string | null;
  teamContext?: string | null;
  description?: string | null;
  importance?: EventImportance;
  tags?: string[];
  playerIds?: string[];
  opponentPlayerNames?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateEventTimestampInput {
  teamId: string;
  gameId: string;
  eventId: string;
  timestampSeconds?: number;
  endTimestampSeconds?: number | null;
  label?: string;
  eventType?: string | null;
  teamContext?: string | null;
  description?: string | null;
  importance?: EventImportance;
  tags?: string[];
  playerIds?: string[];
  opponentPlayerNames?: string[];
  metadata?: Record<string, unknown>;
}

export interface TimestampSummary {
  total: number;
  criticalOrHigh: number;
  uniquePlayerCount: number;
  eventTypes: string[];
}

// ---------------------------------------------------------------------------
// Internal transform
// ---------------------------------------------------------------------------

function rowToEventTimestamp(row: Record<string, unknown>): EventTimestamp {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    gameId: row.game_id as string,
    videoAssetId: (row.video_asset_id as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    timestampSeconds: Number(row.timestamp_seconds),
    endTimestampSeconds: row.end_timestamp_seconds != null
      ? Number(row.end_timestamp_seconds)
      : null,
    label: row.label as string,
    eventType: (row.event_type as string | null) ?? null,
    teamContext: (row.team_context as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    importance: (row.importance as EventImportance) ?? "medium",
    tags: (row.tags as string[]) ?? [],
    playerIds: (row.player_ids as string[]) ?? [],
    opponentPlayerNames: (row.opponent_player_names as string[]) ?? [],
    isAiGenerated: (row.is_ai_generated as boolean) ?? false,
    confidence: (row.confidence as ConfidenceLevel | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// Read functions
// ---------------------------------------------------------------------------

/**
 * Returns all event timestamps for a game, ordered by timestamp_seconds ascending.
 * RLS enforces team membership.
 */
export async function getEventTimestampsForGame(
  teamId: string,
  gameId: string
): Promise<EventTimestamp[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("event_timestamps")
    .select("*")
    .eq("team_id", teamId)
    .eq("game_id", gameId)
    .order("timestamp_seconds", { ascending: true });

  if (error) {
    console.error("getEventTimestampsForGame error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => rowToEventTimestamp(row as Record<string, unknown>));
}

/**
 * Returns a single event timestamp by ID, scoped to the team and game.
 */
export async function getEventTimestampById(
  teamId: string,
  gameId: string,
  eventId: string
): Promise<EventTimestamp | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("event_timestamps")
    .select("*")
    .eq("id", eventId)
    .eq("team_id", teamId)
    .eq("game_id", gameId)
    .single();

  if (error || !data) return null;
  return rowToEventTimestamp(data as Record<string, unknown>);
}

/**
 * Returns a summary of event timestamps for a game.
 * Used for the setup checklist, AI readiness indicator, and game detail stats.
 */
export async function getTimestampSummaryForGame(
  teamId: string,
  gameId: string
): Promise<TimestampSummary> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { total: 0, criticalOrHigh: 0, uniquePlayerCount: 0, eventTypes: [] };

  const { data, error } = await supabase
    .from("event_timestamps")
    .select("importance, player_ids, event_type")
    .eq("team_id", teamId)
    .eq("game_id", gameId);

  if (error || !data) {
    return { total: 0, criticalOrHigh: 0, uniquePlayerCount: 0, eventTypes: [] };
  }

  const total = data.length;
  const criticalOrHigh = data.filter(
    (r) => r.importance === "critical" || r.importance === "high"
  ).length;

  // Deduplicate player IDs across all events
  const allPlayerIds = new Set<string>();
  for (const row of data) {
    const ids = (row.player_ids as string[] | null) ?? [];
    ids.forEach((id) => allPlayerIds.add(id));
  }

  // Deduplicate event types
  const eventTypeSet = new Set<string>();
  for (const row of data) {
    if (row.event_type) eventTypeSet.add(row.event_type as string);
  }

  return {
    total,
    criticalOrHigh,
    uniquePlayerCount: allPlayerIds.size,
    eventTypes: Array.from(eventTypeSet),
  };
}

// ---------------------------------------------------------------------------
// Write functions
// Authorization: RLS enforces is_team_staff (owner/coach/analyst) for writes.
// ---------------------------------------------------------------------------

/**
 * Creates a new event timestamp for the game.
 * Requires owner, coach, or analyst role — enforced by RLS.
 * Throws on failure.
 */
export async function createEventTimestampForGame(
  input: CreateEventTimestampInput
): Promise<EventTimestamp> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Database is not configured. Check your environment variables.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to add an event.");

  const normalizedTags = normalizeTags(input.tags ?? []);

  const { data, error } = await supabase
    .from("event_timestamps")
    .insert({
      team_id: input.teamId,
      game_id: input.gameId,
      video_asset_id: input.videoAssetId ?? null,
      created_by: user.id,
      timestamp_seconds: input.timestampSeconds,
      end_timestamp_seconds: input.endTimestampSeconds ?? null,
      label: input.label.trim(),
      event_type: input.eventType?.trim() || null,
      team_context: input.teamContext || null,
      description: input.description?.trim() || null,
      importance: input.importance ?? "medium",
      tags: normalizedTags,
      player_ids: input.playerIds ?? [],
      opponent_player_names: (input.opponentPlayerNames ?? []).map((n) => n.trim()).filter(Boolean),
      is_ai_generated: false,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create event. Please try again.");
  }

  return rowToEventTimestamp(data as Record<string, unknown>);
}

/**
 * Updates an existing event timestamp.
 * Requires owner, coach, or analyst role — enforced by RLS.
 * Throws on failure.
 */
export async function updateEventTimestampForGame(
  input: UpdateEventTimestampInput
): Promise<EventTimestamp> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Database is not configured. Check your environment variables.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to edit an event.");

  const patch: Record<string, unknown> = {};
  if (input.timestampSeconds !== undefined) patch.timestamp_seconds = input.timestampSeconds;
  if (input.endTimestampSeconds !== undefined) patch.end_timestamp_seconds = input.endTimestampSeconds;
  if (input.label !== undefined) patch.label = input.label.trim();
  if (input.eventType !== undefined) patch.event_type = input.eventType?.trim() || null;
  if (input.teamContext !== undefined) patch.team_context = input.teamContext || null;
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
  if (input.importance !== undefined) patch.importance = input.importance;
  if (input.tags !== undefined) patch.tags = normalizeTags(input.tags);
  if (input.playerIds !== undefined) patch.player_ids = input.playerIds;
  if (input.opponentPlayerNames !== undefined) {
    patch.opponent_player_names = input.opponentPlayerNames.map((n) => n.trim()).filter(Boolean);
  }
  if (input.metadata !== undefined) patch.metadata = input.metadata;

  const { data, error } = await supabase
    .from("event_timestamps")
    .update(patch)
    .eq("id", input.eventId)
    .eq("team_id", input.teamId)
    .eq("game_id", input.gameId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update event. Please try again.");
  }

  return rowToEventTimestamp(data as Record<string, unknown>);
}

/**
 * Permanently deletes an event timestamp.
 * Requires owner, coach, or analyst role — enforced by RLS.
 * Throws on failure.
 */
export async function deleteEventTimestampForGame(
  teamId: string,
  gameId: string,
  eventId: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Database is not configured. Check your environment variables.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to delete an event.");

  const { error } = await supabase
    .from("event_timestamps")
    .delete()
    .eq("id", eventId)
    .eq("team_id", teamId)
    .eq("game_id", gameId);

  if (error) {
    throw new Error(error.message ?? "Failed to delete event. Please try again.");
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const t of tags) {
    const normalized = t.trim().toLowerCase();
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
}
