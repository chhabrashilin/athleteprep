import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CricketMatch,
  CricketMatchFull,
  CricketMatchWithTeams,
  CricketMatchOfficial,
  CricketScheduleChangeLog,
  ScheduleConflict,
} from "@/lib/cricket/types";

// ─── Row mappers ──────────────────────────────────────────────────────────────

function rowToMatchBase(row: Record<string, unknown>): CricketMatch {
  return {
    id: row.id as string,
    leagueId: (row.league_id as string | null) ?? null,
    homeTeamId: (row.home_team_id as string | null) ?? null,
    awayTeamId: (row.away_team_id as string | null) ?? null,
    venueId: (row.venue_id as string | null) ?? null,
    matchType: (row.match_type as string) ?? "T20",
    matchStatus: (row.match_status as CricketMatch["matchStatus"]) ?? "scheduled",
    scheduledStart: (row.scheduled_start as string | null) ?? null,
    oversPerInnings: (row.overs_per_innings as number) ?? 20,
    tossWinnerTeamId: (row.toss_winner_team_id as string | null) ?? null,
    tossDecision: (row.toss_decision as string | null) ?? null,
    winnerTeamId: (row.winner_team_id as string | null) ?? null,
    resultSummary: (row.result_summary as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToMatchFull(row: Record<string, unknown>): CricketMatchFull {
  return {
    ...rowToMatchBase(row),
    slug: (row.slug as string | null) ?? null,
    matchNumber: (row.match_number as number | null) ?? null,
    roundName: (row.round_name as string | null) ?? null,
    groupName: (row.group_name as string | null) ?? null,
    stage: (row.stage as string | null) ?? null,
    title: (row.title as string | null) ?? null,
    scheduledEnd: (row.scheduled_end as string | null) ?? null,
    timezone: (row.timezone as string) ?? "America/New_York",
    publishStatus: (row.publish_status as CricketMatchFull["publishStatus"]) ?? "draft",
    scheduleStatus: (row.schedule_status as CricketMatchFull["scheduleStatus"]) ?? "unscheduled",
    homeTeamLabel: (row.home_team_label as string | null) ?? null,
    awayTeamLabel: (row.away_team_label as string | null) ?? null,
    neutralMatch: (row.neutral_match as boolean) ?? false,
    scorerUserId: (row.scorer_user_id as string | null) ?? null,
    primaryUmpireName: (row.primary_umpire_name as string | null) ?? null,
    secondaryUmpireName: (row.secondary_umpire_name as string | null) ?? null,
    matchRefereeName: (row.match_referee_name as string | null) ?? null,
    livestreamUrl: (row.livestream_url as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    internalNotes: (row.internal_notes as string | null) ?? null,
    weatherNotes: (row.weather_notes as string | null) ?? null,
    cancellationReason: (row.cancellation_reason as string | null) ?? null,
    rescheduledFrom: (row.rescheduled_from as string | null) ?? null,
    publishedAt: (row.published_at as string | null) ?? null,
    archivedAt: (row.archived_at as string | null) ?? null,
    // Scorecard fields (migration 0018)
    tossWinnerTeamId: (row.toss_winner_team_id as string | null) ?? null,
    tossDecision: (row.toss_decision as string | null) ?? null,
    matchResultType: (row.match_result_type as string | null) ?? null,
    resultMarginRuns: (row.result_margin_runs as number | null) ?? null,
    resultMarginWickets: (row.result_margin_wickets as number | null) ?? null,
    resultMarginBallsRemaining: (row.result_margin_balls_remaining as number | null) ?? null,
    playerOfMatchId: (row.player_of_match_id as string | null) ?? null,
    resultConfirmedBy: (row.result_confirmed_by as string | null) ?? null,
    resultConfirmedAt: (row.result_confirmed_at as string | null) ?? null,
    scorecardStatus: (row.scorecard_status as CricketMatchFull["scorecardStatus"]) ?? "not_started",
    scoringMode: (row.scoring_mode as string) ?? "manual_scorecard",
    targetRuns: (row.target_runs as number | null) ?? null,
    winningTeamId: (row.winning_team_id as string | null) ?? null,
    losingTeamId: (row.losing_team_id as string | null) ?? null,
    resultSummary: (row.result_summary as string | null) ?? null,
  };
}

function rowToMatchOfficial(row: Record<string, unknown>): CricketMatchOfficial {
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    userId: (row.user_id as string | null) ?? null,
    name: (row.name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    role: row.role as string,
    status: row.status as string,
    assignedBy: (row.assigned_by as string | null) ?? null,
    assignedAt: row.assigned_at as string,
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToChangeLog(row: Record<string, unknown>): CricketScheduleChangeLog {
  return {
    id: row.id as string,
    leagueId: (row.league_id as string | null) ?? null,
    matchId: (row.match_id as string | null) ?? null,
    actorUserId: (row.actor_user_id as string | null) ?? null,
    action: row.action as string,
    oldValue: (row.old_value as Record<string, unknown>) ?? {},
    newValue: (row.new_value as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getCricketMatchesForLeague(
  leagueId: string
): Promise<CricketMatchFull[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_matches")
    .select("*")
    .eq("league_id", leagueId)
    .is("archived_at", null)
    .order("scheduled_start", { ascending: true, nullsFirst: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToMatchFull);
}

export async function getCricketMatchById(matchId: string): Promise<CricketMatchFull | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cricket_matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (error || !data) return null;
  return rowToMatchFull(data as Record<string, unknown>);
}

export async function getCricketMatchBySlug(slug: string): Promise<CricketMatchFull | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cricket_matches")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return rowToMatchFull(data as Record<string, unknown>);
}

export async function getCricketMatchBySlugOrId(
  slugOrId: string
): Promise<CricketMatchFull | null> {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(slugOrId)) {
    return getCricketMatchById(slugOrId);
  }
  return getCricketMatchBySlug(slugOrId);
}

export async function getUpcomingCricketMatchesForLeague(
  leagueId: string,
  limit = 10
): Promise<CricketMatchFull[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_matches")
    .select("*")
    .eq("league_id", leagueId)
    .gte("scheduled_start", new Date().toISOString())
    .is("archived_at", null)
    .order("scheduled_start", { ascending: true })
    .limit(limit);

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToMatchFull);
}

export async function getCricketMatchesForTeam(
  teamId: string
): Promise<CricketMatchFull[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_matches")
    .select("*")
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .is("archived_at", null)
    .order("scheduled_start", { ascending: true, nullsFirst: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToMatchFull);
}

export async function getCricketMatchWithTeams(
  slugOrId: string
): Promise<CricketMatchWithTeams | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const match = await getCricketMatchBySlugOrId(slugOrId);
  if (!match) return null;

  // Fetch related data in parallel
  const [homeTeamResult, awayTeamResult, venueResult, leagueResult] = await Promise.all([
    match.homeTeamId
      ? supabase.from("cricket_teams").select("*").eq("id", match.homeTeamId).single()
      : Promise.resolve({ data: null, error: null }),
    match.awayTeamId
      ? supabase.from("cricket_teams").select("*").eq("id", match.awayTeamId).single()
      : Promise.resolve({ data: null, error: null }),
    match.venueId
      ? supabase.from("cricket_venues").select("*").eq("id", match.venueId).single()
      : Promise.resolve({ data: null, error: null }),
    match.leagueId
      ? supabase.from("cricket_leagues").select("name, slug").eq("id", match.leagueId).single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  return {
    ...match,
    homeTeam: homeTeamResult.data ? (homeTeamResult.data as Record<string, unknown>) as unknown as import("@/lib/cricket/types").CricketTeam : null,
    awayTeam: awayTeamResult.data ? (awayTeamResult.data as Record<string, unknown>) as unknown as import("@/lib/cricket/types").CricketTeam : null,
    venue: venueResult.data ? (venueResult.data as Record<string, unknown>) as unknown as import("@/lib/cricket/types").CricketVenueFull : null,
    leagueName: leagueResult.data ? (leagueResult.data as Record<string, unknown>).name as string : null,
    leagueSlug: leagueResult.data ? (leagueResult.data as Record<string, unknown>).slug as string : null,
  };
}

export async function getCricketMatchOfficials(
  matchId: string
): Promise<CricketMatchOfficial[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_match_officials")
    .select("*")
    .eq("match_id", matchId)
    .not("status", "eq", "removed")
    .order("role", { ascending: true });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToMatchOfficial);
}

export async function getCricketScheduleChangeLogsForLeague(
  leagueId: string,
  limit = 50
): Promise<CricketScheduleChangeLog[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_schedule_change_logs")
    .select("*")
    .eq("league_id", leagueId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToChangeLog);
}

export async function getCricketScheduleConflictsForLeague(
  leagueId: string
): Promise<ScheduleConflict[]> {
  const matches = await getCricketMatchesForLeague(leagueId);
  const { detectScheduleConflicts } = await import("@/lib/cricket/scheduling/round-robin");

  const raw = detectScheduleConflicts(
    matches.map((m) => ({
      homeTeamId: m.homeTeamId ?? "",
      awayTeamId: m.awayTeamId ?? "",
      scheduledStart: m.scheduledStart,
      scheduledEnd: m.scheduledEnd,
      venueId: m.venueId,
      publishStatus: m.publishStatus,
    }))
  );

  return raw.map((c, _i) => ({
    type: c.type,
    matchA: c.fixtureIndexA !== undefined ? matches[c.fixtureIndexA] : undefined,
    matchB: c.fixtureIndexB !== undefined ? matches[c.fixtureIndexB] : undefined,
    description: c.description,
    suggestion: getSuggestion(c.type),
  }));
}

function getSuggestion(type: string): string {
  switch (type) {
    case "team_double_booked":
      return "Reschedule one of the matches to a different date or time.";
    case "venue_double_booked":
      return "Assign a different venue to one of the matches.";
    case "same_team":
      return "Edit the match to assign different home and away teams.";
    case "invalid_time_range":
      return "Correct the scheduled end time to be after the start time.";
    case "missing_start":
      return "Add a scheduled start time before publishing this match.";
    default:
      return "Review and edit the affected match.";
  }
}

export async function userCanManageCricketLeague(
  userId: string,
  leagueId: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const { data, error } = await supabase.rpc("user_can_manage_cricket_league", {
    _league_id: leagueId,
    _user_id: userId,
  });

  if (error) return false;
  return !!data;
}
