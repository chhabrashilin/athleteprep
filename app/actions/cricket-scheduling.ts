"use server";

import { getServerUser, createServerSupabaseClient } from "@/lib/supabase/server";
import { generateScheduleSchema } from "@/lib/cricket/validation/schedule";
import { generateMatchSlug } from "@/lib/cricket/validation/match";
import {
  generateRoundRobinPairings,
  assignMatchesToDates,
  summarizeSchedule,
} from "@/lib/cricket/scheduling/round-robin";
import { userCanManageCricketLeague } from "@/lib/cricket/matches/queries";
import type { ScheduledFixture } from "@/lib/cricket/scheduling/round-robin";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

interface GeneratedFixturePreview extends ScheduledFixture {
  id?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  venueName?: string;
}

// ─── generateCricketLeagueFixtures ───────────────────────────────────────────

export async function generateCricketLeagueFixtures(
  leagueId: string,
  rawInput: unknown
): Promise<ActionResult<{ fixtures: GeneratedFixturePreview[]; summary: ReturnType<typeof summarizeSchedule> }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketLeague(user.id, leagueId);
  if (!canManage) return { success: false, error: "Permission denied." };

  const parsed = generateScheduleSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed.";
    return { success: false, error: firstError };
  }

  const input = parsed.data;

  // Generate pairings
  let pairings;
  try {
    pairings = generateRoundRobinPairings(input.teamIds);
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }

  // Assign to dates
  const fixtures = assignMatchesToDates(pairings, {
    startDate: input.startDate,
    preferredDays: input.preferredDays,
    matchStartTime: input.matchStartTime,
    matchDurationMinutes: input.matchDurationMinutes,
    venueIds: input.venueIds,
    maxMatchesPerDay: input.maxMatchesPerDay,
    timezone: input.timezone,
  });

  const summary = summarizeSchedule(fixtures);

  // Enrich with team/venue names for preview
  const supabase = await createServerSupabaseClient();
  const enriched: GeneratedFixturePreview[] = fixtures;

  if (supabase && fixtures.length > 0) {
    const teamIds = Array.from(new Set(fixtures.flatMap((f) => [f.homeTeamId, f.awayTeamId])));
    const venueIds = Array.from(new Set(fixtures.map((f) => f.venueId).filter(Boolean))) as string[];

    const [teamsResult, venuesResult] = await Promise.all([
      supabase.from("cricket_teams").select("id, name").in("id", teamIds),
      venueIds.length > 0
        ? supabase.from("cricket_venues").select("id, name").in("id", venueIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const teamMap = new Map(
      ((teamsResult.data ?? []) as Array<{ id: string; name: string }>).map((t) => [t.id, t.name])
    );
    const venueMap = new Map(
      ((venuesResult.data ?? []) as Array<{ id: string; name: string }>).map((v) => [v.id, v.name])
    );

    enriched.splice(
      0,
      enriched.length,
      ...fixtures.map((f) => ({
        ...f,
        homeTeamName: teamMap.get(f.homeTeamId),
        awayTeamName: teamMap.get(f.awayTeamId),
        venueName: f.venueId ? venueMap.get(f.venueId) : undefined,
      }))
    );
  }

  return { success: true, data: { fixtures: enriched, summary } };
}

// ─── saveGeneratedCricketFixtures ─────────────────────────────────────────────

export async function saveGeneratedCricketFixtures(
  leagueId: string,
  fixtures: ScheduledFixture[],
  oversPerInnings: number = 20
): Promise<ActionResult<{ created: number }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketLeague(user.id, leagueId);
  if (!canManage) return { success: false, error: "Permission denied." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  // Get league overs
  const { data: league } = await supabase
    .from("cricket_leagues")
    .select("overs_per_innings")
    .eq("id", leagueId)
    .single();
  const leagueOvers = (league as Record<string, unknown> | null)?.overs_per_innings as number | undefined;

  let created = 0;
  const errors: string[] = [];

  for (const fixture of fixtures) {
    try {
      // Generate slug
      const [homeRes, awayRes] = await Promise.all([
        supabase.from("cricket_teams").select("slug").eq("id", fixture.homeTeamId).single(),
        supabase.from("cricket_teams").select("slug").eq("id", fixture.awayTeamId).single(),
      ]);
      const homeSlug = (homeRes.data as Record<string, unknown> | null)?.slug as string | undefined;
      const awaySlug = (awayRes.data as Record<string, unknown> | null)?.slug as string | undefined;

      let slug: string | null = null;
      if (homeSlug && awaySlug) {
        const dateStr = fixture.scheduledStart
          ? new Date(fixture.scheduledStart).toISOString().split("T")[0]
          : undefined;
        const base = generateMatchSlug(homeSlug, awaySlug, dateStr);
        // Quick uniqueness check
        const { data: existing } = await supabase
          .from("cricket_matches")
          .select("id")
          .eq("slug", base)
          .maybeSingle();
        slug = existing ? `${base}-${Date.now()}` : base;
      }

      const { error } = await supabase.from("cricket_matches").insert({
        league_id: leagueId,
        home_team_id: fixture.homeTeamId,
        away_team_id: fixture.awayTeamId,
        venue_id: fixture.venueId,
        scheduled_start: fixture.scheduledStart,
        scheduled_end: fixture.scheduledEnd,
        round_name: `Round ${fixture.roundNumber}`,
        overs_per_innings: leagueOvers ?? oversPerInnings,
        match_status: "scheduled",
        schedule_status: fixture.scheduledStart ? "scheduled" : "unscheduled",
        publish_status: "draft",
        slug,
        created_by: user.id,
      });

      if (!error) {
        created++;
      } else {
        errors.push(error.message);
      }
    } catch (err) {
      errors.push((err as Error).message);
    }
  }

  // Log the generation run
  const summary = summarizeSchedule(fixtures);
  await supabase.from("cricket_schedule_generation_runs").insert({
    league_id: leagueId,
    generated_by: user.id,
    algorithm: "round_robin_v1",
    input: { fixturesCount: fixtures.length },
    output_summary: { created, errors: errors.length, ...summary },
    status: errors.length > 0 && created === 0 ? "failed" : errors.length > 0 ? "partial" : "completed",
  });

  // Log action
  await supabase.from("cricket_schedule_change_logs").insert({
    league_id: leagueId,
    match_id: null,
    actor_user_id: user.id,
    action: "fixture.generated",
    old_value: {},
    new_value: { created, total: fixtures.length },
  });

  if (created === 0 && errors.length > 0) {
    return { success: false, error: `Failed to save fixtures: ${errors[0]}` };
  }

  return { success: true, data: { created } };
}

// ─── detectLeagueScheduleConflicts ────────────────────────────────────────────

export async function detectLeagueScheduleConflicts(leagueId: string): Promise<
  ActionResult<{ conflicts: Array<{ type: string; description: string; suggestion: string }> }>
> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketLeague(user.id, leagueId);
  if (!canManage) return { success: false, error: "Permission denied." };

  const { getCricketScheduleConflictsForLeague } = await import("@/lib/cricket/matches/queries");
  const conflicts = await getCricketScheduleConflictsForLeague(leagueId);

  return {
    success: true,
    data: {
      conflicts: conflicts.map((c) => ({
        type: c.type,
        description: c.description,
        suggestion: c.suggestion,
      })),
    },
  };
}

// ─── publishLeagueSchedule ────────────────────────────────────────────────────

export async function publishLeagueSchedule(leagueId: string): Promise<ActionResult<{ published: number }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketLeague(user.id, leagueId);
  if (!canManage) return { success: false, error: "Permission denied." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { error, count } = await supabase
    .from("cricket_matches")
    .update({ publish_status: "published", published_at: new Date().toISOString() })
    .eq("league_id", leagueId)
    .eq("publish_status", "draft")
    .neq("schedule_status", "cancelled");

  if (error) return { success: false, error: "Failed to publish schedule." };

  await supabase.from("cricket_schedule_change_logs").insert({
    league_id: leagueId,
    match_id: null,
    actor_user_id: user.id,
    action: "match.published",
    old_value: {},
    new_value: { published: count ?? 0 },
  });

  return { success: true, data: { published: count ?? 0 } };
}

// ─── unpublishLeagueSchedule ──────────────────────────────────────────────────

export async function unpublishLeagueSchedule(leagueId: string): Promise<ActionResult<{ unpublished: number }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketLeague(user.id, leagueId);
  if (!canManage) return { success: false, error: "Permission denied." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { error, count } = await supabase
    .from("cricket_matches")
    .update({ publish_status: "draft" })
    .eq("league_id", leagueId)
    .eq("publish_status", "published");

  if (error) return { success: false, error: "Failed to unpublish schedule." };

  await supabase.from("cricket_schedule_change_logs").insert({
    league_id: leagueId,
    match_id: null,
    actor_user_id: user.id,
    action: "match.unpublished",
    old_value: {},
    new_value: { unpublished: count ?? 0 },
  });

  return { success: true, data: { unpublished: count ?? 0 } };
}
