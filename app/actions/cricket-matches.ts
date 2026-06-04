"use server";

import { getServerUser, createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createMatchSchema,
  updateMatchSchema,
  scheduleMatchSchema,
  assignOfficialSchema,
  generateMatchSlug,
} from "@/lib/cricket/validation/match";
import { userCanManageCricketLeague } from "@/lib/cricket/matches/queries";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function isMatchSlugAvailable(slug: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;
  const { data } = await supabase
    .from("cricket_matches")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return !data;
}

async function ensureUniqueMatchSlug(base: string): Promise<string> {
  const available = await isMatchSlugAvailable(base);
  if (available) return base;
  for (let i = 2; i <= 99; i++) {
    const candidate = `${base}-${i}`;
    if (await isMatchSlugAvailable(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

async function insertScheduleChangeLog(
  leagueId: string | null,
  matchId: string | null,
  actorUserId: string,
  action: string,
  oldValue: Record<string, unknown> = {},
  newValue: Record<string, unknown> = {}
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;
  await supabase.from("cricket_schedule_change_logs").insert({
    league_id: leagueId,
    match_id: matchId,
    actor_user_id: actorUserId,
    action,
    old_value: oldValue,
    new_value: newValue,
  });
}

// ─── createCricketMatch ───────────────────────────────────────────────────────

export async function createCricketMatch(
  rawInput: unknown
): Promise<ActionResult<{ id: string; slug: string | null }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "You must be signed in to create a match." };

  const parsed = createMatchSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed.";
    return { success: false, error: firstError };
  }

  const input = parsed.data;

  // Check permission
  const canManage = await userCanManageCricketLeague(user.id, input.leagueId);
  if (!canManage) {
    return { success: false, error: "You do not have permission to create matches for this league." };
  }

  // Generate slug from team names and date
  let slug: string | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const [homeRes, awayRes] = await Promise.all([
        supabase.from("cricket_teams").select("slug").eq("id", input.homeTeamId).single(),
        supabase.from("cricket_teams").select("slug").eq("id", input.awayTeamId).single(),
      ]);
      const homeSlug = (homeRes.data as Record<string, unknown> | null)?.slug as string | undefined;
      const awaySlug = (awayRes.data as Record<string, unknown> | null)?.slug as string | undefined;
      if (homeSlug && awaySlug) {
        const dateStr = input.scheduledStart
          ? new Date(input.scheduledStart).toISOString().split("T")[0]
          : undefined;
        const baseSlug = generateMatchSlug(homeSlug, awaySlug, dateStr);
        slug = await ensureUniqueMatchSlug(baseSlug);
      }
    }
  } catch {
    // slug generation is best-effort
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { data, error } = await supabase
    .from("cricket_matches")
    .insert({
      league_id: input.leagueId,
      home_team_id: input.homeTeamId,
      away_team_id: input.awayTeamId,
      venue_id: input.venueId ?? null,
      match_type: input.matchType ?? "T20",
      overs_per_innings: input.oversPerInnings,
      scheduled_start: input.scheduledStart ?? null,
      scheduled_end: input.scheduledEnd ?? null,
      timezone: input.timezone ?? "America/New_York",
      match_number: input.matchNumber ?? null,
      round_name: input.roundName ?? null,
      group_name: input.groupName ?? null,
      stage: input.stage ?? null,
      title: input.title ?? null,
      neutral_match: input.neutralMatch ?? false,
      scorer_user_id: input.scorerUserId ?? null,
      primary_umpire_name: input.primaryUmpireName ?? null,
      secondary_umpire_name: input.secondaryUmpireName ?? null,
      match_referee_name: input.matchRefereeName ?? null,
      notes: input.notes ?? null,
      internal_notes: input.internalNotes ?? null,
      publish_status: input.publishStatus ?? "draft",
      schedule_status: input.scheduledStart ? "scheduled" : "unscheduled",
      slug,
      match_status: "scheduled",
      created_by: user.id,
    })
    .select("id, slug")
    .single();

  if (error) {
    console.error("[cricket-matches/actions] createCricketMatch:", error.message);
    return { success: false, error: "Failed to create match. Please try again." };
  }

  const match = data as { id: string; slug: string | null };
  await insertScheduleChangeLog(
    input.leagueId,
    match.id,
    user.id,
    "match.created",
    {},
    { homeTeamId: input.homeTeamId, awayTeamId: input.awayTeamId }
  );

  return { success: true, data: { id: match.id, slug: match.slug } };
}

// ─── updateCricketMatch ───────────────────────────────────────────────────────

export async function updateCricketMatch(
  matchId: string,
  rawInput: unknown
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { data: existing } = await supabase
    .from("cricket_matches")
    .select("league_id, created_by")
    .eq("id", matchId)
    .single();

  if (!existing) return { success: false, error: "Match not found." };

  const row = existing as Record<string, unknown>;
  const leagueId = row.league_id as string | null;
  const canManage = leagueId
    ? await userCanManageCricketLeague(user.id, leagueId)
    : row.created_by === user.id;

  if (!canManage) {
    return { success: false, error: "You do not have permission to edit this match." };
  }

  const parsed = updateMatchSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed.";
    return { success: false, error: firstError };
  }

  const input = parsed.data;
  const updates: Record<string, unknown> = {};

  if (input.homeTeamId !== undefined) updates.home_team_id = input.homeTeamId;
  if (input.awayTeamId !== undefined) updates.away_team_id = input.awayTeamId;
  if (input.venueId !== undefined) updates.venue_id = input.venueId ?? null;
  if (input.matchType !== undefined) updates.match_type = input.matchType;
  if (input.oversPerInnings !== undefined) updates.overs_per_innings = input.oversPerInnings;
  if (input.scheduledStart !== undefined) updates.scheduled_start = input.scheduledStart ?? null;
  if (input.scheduledEnd !== undefined) updates.scheduled_end = input.scheduledEnd ?? null;
  if (input.timezone !== undefined) updates.timezone = input.timezone;
  if (input.matchNumber !== undefined) updates.match_number = input.matchNumber ?? null;
  if (input.roundName !== undefined) updates.round_name = input.roundName ?? null;
  if (input.groupName !== undefined) updates.group_name = input.groupName ?? null;
  if (input.stage !== undefined) updates.stage = input.stage ?? null;
  if (input.title !== undefined) updates.title = input.title ?? null;
  if (input.neutralMatch !== undefined) updates.neutral_match = input.neutralMatch;
  if (input.scorerUserId !== undefined) updates.scorer_user_id = input.scorerUserId ?? null;
  if (input.primaryUmpireName !== undefined) updates.primary_umpire_name = input.primaryUmpireName ?? null;
  if (input.secondaryUmpireName !== undefined) updates.secondary_umpire_name = input.secondaryUmpireName ?? null;
  if (input.matchRefereeName !== undefined) updates.match_referee_name = input.matchRefereeName ?? null;
  if (input.notes !== undefined) updates.notes = input.notes ?? null;
  if (input.internalNotes !== undefined) updates.internal_notes = input.internalNotes ?? null;
  if (input.cancellationReason !== undefined) updates.cancellation_reason = input.cancellationReason ?? null;
  if (input.weatherNotes !== undefined) updates.weather_notes = input.weatherNotes ?? null;
  if (input.publishStatus !== undefined) updates.publish_status = input.publishStatus;
  if (input.scheduleStatus !== undefined) updates.schedule_status = input.scheduleStatus;

  const { error } = await supabase
    .from("cricket_matches")
    .update(updates)
    .eq("id", matchId);

  if (error) {
    console.error("[cricket-matches/actions] updateCricketMatch:", error.message);
    return { success: false, error: "Failed to update match." };
  }

  await insertScheduleChangeLog(leagueId, matchId, user.id, "match.updated", {}, updates);
  return { success: true, data: undefined };
}

// ─── scheduleCricketMatch ─────────────────────────────────────────────────────

export async function scheduleCricketMatch(
  matchId: string,
  rawInput: unknown
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const parsed = scheduleMatchSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed.";
    return { success: false, error: firstError };
  }

  const input = parsed.data;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { data: existing } = await supabase
    .from("cricket_matches")
    .select("league_id, created_by, scheduled_start")
    .eq("id", matchId)
    .single();

  if (!existing) return { success: false, error: "Match not found." };
  const row = existing as Record<string, unknown>;
  const leagueId = row.league_id as string | null;
  const canManage = leagueId
    ? await userCanManageCricketLeague(user.id, leagueId)
    : row.created_by === user.id;
  if (!canManage) return { success: false, error: "Permission denied." };

  const { error } = await supabase
    .from("cricket_matches")
    .update({
      venue_id: input.venueId ?? null,
      scheduled_start: input.scheduledStart,
      scheduled_end: input.scheduledEnd ?? null,
      timezone: input.timezone,
      schedule_status: "scheduled",
    })
    .eq("id", matchId);

  if (error) return { success: false, error: "Failed to schedule match." };

  await insertScheduleChangeLog(leagueId, matchId, user.id, "match.scheduled", {
    scheduledStart: row.scheduled_start,
  }, { scheduledStart: input.scheduledStart });

  return { success: true, data: undefined };
}

// ─── rescheduleCricketMatch ───────────────────────────────────────────────────

export async function rescheduleCricketMatch(
  matchId: string,
  rawInput: unknown
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const parsed = scheduleMatchSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed.";
    return { success: false, error: firstError };
  }

  const input = parsed.data;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { data: existing } = await supabase
    .from("cricket_matches")
    .select("league_id, created_by, scheduled_start")
    .eq("id", matchId)
    .single();

  if (!existing) return { success: false, error: "Match not found." };
  const row = existing as Record<string, unknown>;
  const leagueId = row.league_id as string | null;
  const canManage = leagueId
    ? await userCanManageCricketLeague(user.id, leagueId)
    : row.created_by === user.id;
  if (!canManage) return { success: false, error: "Permission denied." };

  const { error } = await supabase
    .from("cricket_matches")
    .update({
      venue_id: input.venueId ?? null,
      scheduled_start: input.scheduledStart,
      scheduled_end: input.scheduledEnd ?? null,
      timezone: input.timezone,
      schedule_status: "rescheduled",
      rescheduled_from: row.scheduled_start as string | null,
    })
    .eq("id", matchId);

  if (error) return { success: false, error: "Failed to reschedule match." };

  await insertScheduleChangeLog(leagueId, matchId, user.id, "match.rescheduled", {
    scheduledStart: row.scheduled_start,
  }, { scheduledStart: input.scheduledStart });

  return { success: true, data: undefined };
}

// ─── cancelCricketMatch ───────────────────────────────────────────────────────

export async function cancelCricketMatch(
  matchId: string,
  reason: string
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { data: existing } = await supabase
    .from("cricket_matches")
    .select("league_id, created_by")
    .eq("id", matchId)
    .single();

  if (!existing) return { success: false, error: "Match not found." };
  const row = existing as Record<string, unknown>;
  const leagueId = row.league_id as string | null;
  const canManage = leagueId
    ? await userCanManageCricketLeague(user.id, leagueId)
    : row.created_by === user.id;
  if (!canManage) return { success: false, error: "Permission denied." };

  const { error } = await supabase
    .from("cricket_matches")
    .update({ schedule_status: "cancelled", cancellation_reason: reason })
    .eq("id", matchId);

  if (error) return { success: false, error: "Failed to cancel match." };

  await insertScheduleChangeLog(leagueId, matchId, user.id, "match.cancelled", {}, { reason });
  return { success: true, data: undefined };
}

// ─── publishCricketMatch ──────────────────────────────────────────────────────

export async function publishCricketMatch(matchId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { data: existing } = await supabase
    .from("cricket_matches")
    .select("league_id, created_by")
    .eq("id", matchId)
    .single();

  if (!existing) return { success: false, error: "Match not found." };
  const row = existing as Record<string, unknown>;
  const leagueId = row.league_id as string | null;
  const canManage = leagueId
    ? await userCanManageCricketLeague(user.id, leagueId)
    : row.created_by === user.id;
  if (!canManage) return { success: false, error: "Permission denied." };

  const { error } = await supabase
    .from("cricket_matches")
    .update({ publish_status: "published", published_at: new Date().toISOString() })
    .eq("id", matchId);

  if (error) return { success: false, error: "Failed to publish match." };

  await insertScheduleChangeLog(leagueId, matchId, user.id, "match.published", {}, {});
  return { success: true, data: undefined };
}

// ─── unpublishCricketMatch ────────────────────────────────────────────────────

export async function unpublishCricketMatch(matchId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { data: existing } = await supabase
    .from("cricket_matches")
    .select("league_id, created_by")
    .eq("id", matchId)
    .single();

  if (!existing) return { success: false, error: "Match not found." };
  const row = existing as Record<string, unknown>;
  const leagueId = row.league_id as string | null;
  const canManage = leagueId
    ? await userCanManageCricketLeague(user.id, leagueId)
    : row.created_by === user.id;
  if (!canManage) return { success: false, error: "Permission denied." };

  const { error } = await supabase
    .from("cricket_matches")
    .update({ publish_status: "draft" })
    .eq("id", matchId);

  if (error) return { success: false, error: "Failed to unpublish match." };

  await insertScheduleChangeLog(leagueId, matchId, user.id, "match.unpublished", {}, {});
  return { success: true, data: undefined };
}

// ─── assignCricketMatchOfficial ───────────────────────────────────────────────

export async function assignCricketMatchOfficial(
  matchId: string,
  rawInput: unknown
): Promise<ActionResult<{ id: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const parsed = assignOfficialSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed.";
    return { success: false, error: firstError };
  }

  const input = parsed.data;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { data: existing } = await supabase
    .from("cricket_matches")
    .select("league_id, created_by")
    .eq("id", matchId)
    .single();

  if (!existing) return { success: false, error: "Match not found." };
  const row = existing as Record<string, unknown>;
  const leagueId = row.league_id as string | null;
  const canManage = leagueId
    ? await userCanManageCricketLeague(user.id, leagueId)
    : row.created_by === user.id;
  if (!canManage) return { success: false, error: "Permission denied." };

  const { data, error } = await supabase
    .from("cricket_match_officials")
    .insert({
      match_id: matchId,
      user_id: input.userId ?? null,
      name: input.name ?? null,
      email: input.email || null,
      role: input.role,
      notes: input.notes ?? null,
      assigned_by: user.id,
      status: "assigned",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[cricket-matches/actions] assignCricketMatchOfficial:", error.message);
    return { success: false, error: "Failed to assign official." };
  }

  await insertScheduleChangeLog(leagueId, matchId, user.id, "official.assigned", {}, { role: input.role });
  return { success: true, data: { id: (data as { id: string }).id } };
}

// ─── removeCricketMatchOfficial ───────────────────────────────────────────────

export async function removeCricketMatchOfficial(officialId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { error } = await supabase
    .from("cricket_match_officials")
    .update({ status: "removed" })
    .eq("id", officialId);

  if (error) return { success: false, error: "Failed to remove official." };

  await insertScheduleChangeLog(null, null, user.id, "official.removed", {}, { officialId });
  return { success: true, data: undefined };
}
