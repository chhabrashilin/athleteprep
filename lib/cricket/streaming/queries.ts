/**
 * lib/cricket/streaming/queries.ts
 * Read-only queries for match streams, channels, health, events, checklists.
 * All queries run server-side only.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CricketMatchStream,
  CricketStreamingChannel,
  CricketStreamEvent,
  CricketStreamHealthCheck,
  CricketBroadcastChecklist,
  StreamStatus,
  StreamVisibility,
  StreamProvider,
  StreamHealthStatus,
} from "@/lib/cricket/types";

// ─── Row mappers ──────────────────────────────────────────────────────────────

function toMatchStream(row: Record<string, unknown>): CricketMatchStream {
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    leagueId: (row.league_id as string | null) ?? null,
    channelId: (row.channel_id as string | null) ?? null,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    status: (row.status as StreamStatus) ?? "not_configured",
    provider: (row.provider as StreamProvider) ?? "overlay_only",
    publicWatchUrl: (row.public_watch_url as string | null) ?? null,
    embedUrl: (row.embed_url as string | null) ?? null,
    scheduledStart: (row.scheduled_start as string | null) ?? null,
    actualStart: (row.actual_start as string | null) ?? null,
    actualEnd: (row.actual_end as string | null) ?? null,
    visibility: (row.visibility as StreamVisibility) ?? "league",
    allowPublicEmbed: (row.allow_public_embed as boolean) ?? false,
    overlayThemeId: (row.overlay_theme_id as string | null) ?? null,
    streamOperatorUserId: (row.stream_operator_user_id as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toChannel(row: Record<string, unknown>): CricketStreamingChannel {
  return {
    id: row.id as string,
    leagueId: (row.league_id as string | null) ?? null,
    teamId: (row.team_id as string | null) ?? null,
    name: row.name as string,
    slug: row.slug as string,
    provider: (row.provider as StreamProvider) ?? "overlay_only",
    providerChannelId: (row.provider_channel_id as string | null) ?? null,
    publicWatchUrl: (row.public_watch_url as string | null) ?? null,
    embedUrl: (row.embed_url as string | null) ?? null,
    rtmpIngestUrl: (row.rtmp_ingest_url as string | null) ?? null,
    isActive: (row.is_active as boolean) ?? true,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toStreamEvent(row: Record<string, unknown>): CricketStreamEvent {
  return {
    id: row.id as string,
    matchStreamId: (row.match_stream_id as string | null) ?? null,
    matchId: (row.match_id as string | null) ?? null,
    leagueId: (row.league_id as string | null) ?? null,
    actorUserId: (row.actor_user_id as string | null) ?? null,
    eventType: row.event_type as string,
    eventPayload: (row.event_payload as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  };
}

function toHealthCheck(row: Record<string, unknown>): CricketStreamHealthCheck {
  return {
    id: row.id as string,
    matchStreamId: (row.match_stream_id as string | null) ?? null,
    matchId: (row.match_id as string | null) ?? null,
    status: (row.status as StreamHealthStatus) ?? "unknown",
    latencyMs: (row.latency_ms as number | null) ?? null,
    droppedFrames: (row.dropped_frames as number | null) ?? null,
    bitrateKbps: (row.bitrate_kbps as number | null) ?? null,
    viewerCount: (row.viewer_count as number | null) ?? null,
    message: (row.message as string | null) ?? null,
    checkedAt: row.checked_at as string,
    createdBy: (row.created_by as string | null) ?? null,
  };
}

function toChecklist(row: Record<string, unknown>): CricketBroadcastChecklist {
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    matchStreamId: (row.match_stream_id as string | null) ?? null,
    checklistKey: row.checklist_key as string,
    label: row.label as string,
    completed: (row.completed as boolean) ?? false,
    completedBy: (row.completed_by as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── getMatchStream ───────────────────────────────────────────────────────────

export async function getMatchStream(matchId: string): Promise<CricketMatchStream | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("cricket_match_streams")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? toMatchStream(data as Record<string, unknown>) : null;
}

// ─── getMatchStreams ──────────────────────────────────────────────────────────

export async function getMatchStreams(matchId: string): Promise<CricketMatchStream[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_match_streams")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => toMatchStream(r as Record<string, unknown>));
}

// ─── getLeagueStreamingChannels ───────────────────────────────────────────────

export async function getLeagueStreamingChannels(leagueId: string): Promise<CricketStreamingChannel[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_streaming_channels")
    .select("*")
    .eq("league_id", leagueId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => toChannel(r as Record<string, unknown>));
}

// ─── getBroadcastChecklist ────────────────────────────────────────────────────

export async function getBroadcastChecklist(matchId: string): Promise<CricketBroadcastChecklist[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_broadcast_checklists")
    .select("*")
    .eq("match_id", matchId)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((r) => toChecklist(r as Record<string, unknown>));
}

// ─── getStreamEvents ──────────────────────────────────────────────────────────

export async function getStreamEvents(matchId: string, limit = 50): Promise<CricketStreamEvent[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_stream_events")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((r) => toStreamEvent(r as Record<string, unknown>));
}

// ─── getLatestStreamHealth ────────────────────────────────────────────────────

export async function getLatestStreamHealth(matchStreamId: string): Promise<CricketStreamHealthCheck | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("cricket_stream_health_checks")
    .select("*")
    .eq("match_stream_id", matchStreamId)
    .order("checked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? toHealthCheck(data as Record<string, unknown>) : null;
}

// ─── userCanManageMatchBroadcast ──────────────────────────────────────────────

export async function userCanManageMatchBroadcast(
  userId: string,
  matchId: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const { data: match } = await supabase
    .from("cricket_matches")
    .select("league_id")
    .eq("id", matchId)
    .maybeSingle();

  if (!match?.league_id) return false;

  const { data } = await supabase.rpc("has_cricket_league_role", {
    _league_id: match.league_id,
    _user_id: userId,
    _roles: ["owner", "admin", "manager"],
  });

  return data === true;
}
