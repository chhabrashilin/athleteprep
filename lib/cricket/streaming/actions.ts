"use server";

/**
 * lib/cricket/streaming/actions.ts
 * Server actions for match stream configuration, status, checklists, health.
 */

import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import {
  matchStreamSchema,
  streamChannelSchema,
  updateMatchStreamStatusSchema,
  streamHealthCheckSchema,
  streamEventSchema,
  checklistUpdateSchema,
  type MatchStreamInput,
} from "@/lib/cricket/validation/streaming";
import { getProviderAdapter } from "./providers/index";
import { userCanManageMatchBroadcast } from "./queries";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

// ─── Checklist defaults ───────────────────────────────────────────────────────

const DEFAULT_CHECKLIST = [
  { key: "match_setup_complete",      label: "Match setup complete",              sort: 0 },
  { key: "squads_confirmed",          label: "Squads confirmed",                  sort: 1 },
  { key: "scorer_assigned",           label: "Scorer assigned",                   sort: 2 },
  { key: "live_scoring_tested",       label: "Live scoring tested",               sort: 3 },
  { key: "overlay_url_copied",        label: "Overlay URL copied",                sort: 4 },
  { key: "obs_browser_source_added",  label: "OBS/vMix browser source added",     sort: 5 },
  { key: "sponsor_logo_checked",      label: "Sponsor logo checked",              sort: 6 },
  { key: "audio_video_checked",       label: "Audio/video checked",               sort: 7 },
  { key: "stream_url_verified",       label: "Stream URL verified",               sort: 8 },
  { key: "public_watch_page_checked", label: "Public watch page checked",         sort: 9 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireBroadcastManager(matchId: string): Promise<{ userId: string } | { error: string }> {
  const user = await getServerUser();
  if (!user) return { error: "Not authenticated" };

  const canManage = await userCanManageMatchBroadcast(user.id, matchId);
  if (!canManage) return { error: "You do not have permission to manage this broadcast" };

  return { userId: user.id };
}

// ─── createOrUpdateMatchStream ────────────────────────────────────────────────

export async function createOrUpdateMatchStream(
  input: MatchStreamInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = matchStreamSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const auth = await requireBroadcastManager(parsed.data.match_id);
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const d = parsed.data;
  const embedUrl = d.embed_url || null;
  const watchUrl = d.public_watch_url || null;

  const provider = getProviderAdapter(d.provider, { embedUrl, watchUrl });
  const warnings: string[] = [];
  if (!provider.isConfigured()) {
    warnings.push(`Provider '${d.provider}' is not configured. Overlay-only mode will be used.`);
  }

  // Upsert: if stream exists for match, update; else insert.
  const { data: existing } = await supabase
    .from("cricket_match_streams")
    .select("id")
    .eq("match_id", d.match_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    match_id:            d.match_id,
    league_id:           d.league_id ?? null,
    channel_id:          d.channel_id ?? null,
    title:               d.title,
    description:         d.description ?? null,
    provider:            d.provider,
    public_watch_url:    watchUrl,
    embed_url:           embedUrl,
    scheduled_start:     d.scheduled_start ?? null,
    visibility:          d.visibility,
    allow_public_embed:  d.allow_public_embed,
    overlay_theme_id:    d.overlay_theme_id ?? null,
    created_by:          auth.userId,
  };

  let streamId: string;

  if (existing?.id) {
    const { error } = await supabase
      .from("cricket_match_streams")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
    streamId = existing.id;
  } else {
    const { data: inserted, error } = await supabase
      .from("cricket_match_streams")
      .insert(payload)
      .select("id")
      .single();
    if (error || !inserted) return { success: false, error: error?.message ?? "Insert failed" };
    streamId = inserted.id;
  }

  // Log event.
  await logStreamEventInternal({
    match_stream_id: streamId,
    match_id: d.match_id,
    league_id: d.league_id ?? null,
    actor_user_id: auth.userId,
    event_type: existing ? "stream.configured" : "stream.configured",
    event_payload: { provider: d.provider, visibility: d.visibility },
  }, supabase);

  return { success: true, data: { id: streamId }, warnings };
}

// ─── updateMatchStreamStatus ──────────────────────────────────────────────────

export async function updateMatchStreamStatus(
  matchStreamId: string,
  status: string
): Promise<ActionResult> {
  const parsed = updateMatchStreamStatusSchema.safeParse({ match_stream_id: matchStreamId, status });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid status" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: stream } = await supabase
    .from("cricket_match_streams")
    .select("match_id, league_id")
    .eq("id", matchStreamId)
    .maybeSingle();

  if (!stream) return { success: false, error: "Stream not found" };

  const auth = await requireBroadcastManager(stream.match_id);
  if ("error" in auth) return { success: false, error: auth.error };

  const extra: Record<string, unknown> = {};
  if (status === "live") extra.actual_start = new Date().toISOString();
  if (status === "ended") extra.actual_end = new Date().toISOString();

  const { error } = await supabase
    .from("cricket_match_streams")
    .update({ status, ...extra, updated_at: new Date().toISOString() })
    .eq("id", matchStreamId);

  if (error) return { success: false, error: error.message };

  // Sync broadcast_status on cricket_matches.
  const broadcastStatusMap: Record<string, string> = {
    not_configured: "not_configured",
    scheduled: "setup",
    ready: "ready",
    live: "live",
    paused: "live",
    ended: "ended",
    failed: "failed",
    archived: "ended",
  };
  const broadcastStatus = broadcastStatusMap[status] ?? "not_configured";
  await supabase
    .from("cricket_matches")
    .update({ broadcast_status: broadcastStatus })
    .eq("id", stream.match_id);

  await logStreamEventInternal({
    match_stream_id: matchStreamId,
    match_id: stream.match_id,
    league_id: stream.league_id,
    actor_user_id: auth.userId,
    event_type: `stream.${status}`,
    event_payload: { status },
  }, supabase);

  return { success: true };
}

// ─── createStreamingChannel ───────────────────────────────────────────────────

export async function createStreamingChannel(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = streamChannelSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const d = parsed.data;

  const { data, error } = await supabase
    .from("cricket_streaming_channels")
    .insert({
      league_id:           d.league_id,
      team_id:             d.team_id ?? null,
      name:                d.name,
      slug:                d.slug,
      provider:            d.provider,
      provider_channel_id: d.provider_channel_id ?? null,
      public_watch_url:    d.public_watch_url || null,
      embed_url:           d.embed_url || null,
      rtmp_ingest_url:     d.rtmp_ingest_url ?? null,
      is_active:           d.is_active ?? true,
      created_by:          user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { success: false, error: error?.message ?? "Insert failed" };
  return { success: true, data: { id: data.id } };
}

// ─── initializeBroadcastChecklist ─────────────────────────────────────────────

export async function initializeBroadcastChecklist(
  matchId: string,
  matchStreamId?: string
): Promise<ActionResult> {
  const auth = await requireBroadcastManager(matchId);
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const rows = DEFAULT_CHECKLIST.map((item) => ({
    match_id:        matchId,
    match_stream_id: matchStreamId ?? null,
    checklist_key:   item.key,
    label:           item.label,
    sort_order:      item.sort,
    completed:       false,
  }));

  // Upsert — skip already existing items.
  const { error } = await supabase
    .from("cricket_broadcast_checklists")
    .upsert(rows, { onConflict: "match_id,checklist_key", ignoreDuplicates: true });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── updateBroadcastChecklistItem ─────────────────────────────────────────────

export async function updateBroadcastChecklistItem(
  matchId: string,
  checklistKey: string,
  completed: boolean
): Promise<ActionResult> {
  const parsed = checklistUpdateSchema.safeParse({ checklist_key: checklistKey, completed });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const auth = await requireBroadcastManager(matchId);
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const update: Record<string, unknown> = {
    completed,
    updated_at: new Date().toISOString(),
  };
  if (completed) {
    update.completed_by = auth.userId;
    update.completed_at = new Date().toISOString();
  } else {
    update.completed_by = null;
    update.completed_at = null;
  }

  const { error } = await supabase
    .from("cricket_broadcast_checklists")
    .update(update)
    .eq("match_id", matchId)
    .eq("checklist_key", checklistKey);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── recordStreamHealthCheck ──────────────────────────────────────────────────

export async function recordStreamHealthCheck(input: unknown): Promise<ActionResult> {
  const parsed = streamHealthCheckSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const auth = await requireBroadcastManager(parsed.data.match_id);
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const d = parsed.data;
  const { error } = await supabase.from("cricket_stream_health_checks").insert({
    match_stream_id: d.match_stream_id,
    match_id:        d.match_id,
    status:          d.status,
    latency_ms:      d.latency_ms ?? null,
    dropped_frames:  d.dropped_frames ?? null,
    bitrate_kbps:    d.bitrate_kbps ?? null,
    viewer_count:    d.viewer_count ?? null,
    message:         d.message ?? null,
    checked_at:      new Date().toISOString(),
    created_by:      auth.userId,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── logStreamEvent ───────────────────────────────────────────────────────────

export async function logStreamEvent(input: unknown): Promise<ActionResult> {
  const parsed = streamEventSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const auth = await requireBroadcastManager(parsed.data.match_id);
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const d = parsed.data;
  const { error } = await supabase.from("cricket_stream_events").insert({
    match_stream_id: d.match_stream_id ?? null,
    match_id:        d.match_id,
    league_id:       d.league_id ?? null,
    actor_user_id:   auth.userId,
    event_type:      d.event_type,
    event_payload:   d.event_payload ?? {},
    created_at:      new Date().toISOString(),
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// Internal fire-and-forget helper (no auth check needed since caller already verified).
async function logStreamEventInternal(
  payload: {
    match_stream_id: string | null;
    match_id: string;
    league_id: string | null;
    actor_user_id: string;
    event_type: string;
    event_payload: Record<string, unknown>;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<void> {
  await supabase.from("cricket_stream_events").insert({
    match_stream_id: payload.match_stream_id,
    match_id:        payload.match_id,
    league_id:       payload.league_id,
    actor_user_id:   payload.actor_user_id,
    event_type:      payload.event_type,
    event_payload:   payload.event_payload,
    created_at:      new Date().toISOString(),
  });
}
