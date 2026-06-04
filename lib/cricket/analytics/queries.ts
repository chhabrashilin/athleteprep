/**
 * lib/cricket/analytics/queries.ts
 * Data access layer for cricket visual analytics.
 * Call only from Server Components, Server Actions, or Route Handlers.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CricketBallEventAnalytics,
  CricketMatchAnalyticsSnapshot,
  WagonZone,
  BattingPhase,
  BowlingPhase,
  BatContactType,
  CricketPartnership,
  CricketBattingEntryWithPlayer,
  CricketBowlingEntryWithPlayer,
  CricketInnings,
  CricketMatchFull,
  CricketTeam,
} from "@/lib/cricket/types";

// ─── Row transforms ───────────────────────────────────────────────────────────

function rowToBallEventAnalytics(row: Record<string, unknown>): CricketBallEventAnalytics {
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    inningsId: row.innings_id as string,
    battingTeamId: row.batting_team_id as string,
    bowlingTeamId: row.bowling_team_id as string,
    overNumber: (row.over_number as number) ?? 0,
    ballInOver: (row.ball_in_over as number) ?? 0,
    legalBallNumber: (row.legal_ball_number as number | null) ?? null,
    inningsBallNumber: (row.innings_ball_number as number | null) ?? null,
    strikerId: (row.striker_id as string | null) ?? null,
    nonStrikerId: (row.non_striker_id as string | null) ?? null,
    bowlerId: (row.bowler_id as string | null) ?? null,
    runsBatter: (row.runs_batter as number) ?? 0,
    runsExtras: (row.runs_extras as number) ?? 0,
    runsTotal: (row.runs_total as number) ?? 0,
    extraType: (row.extra_type as string | null) ?? null,
    wicketType: (row.wicket_type as string | null) ?? null,
    playerOutId: (row.player_out_id as string | null) ?? null,
    isLegalDelivery: (row.is_legal_delivery as boolean) ?? true,
    isWicket: (row.is_wicket as boolean) ?? false,
    isBoundaryFour: (row.is_boundary_four as boolean) ?? false,
    isBoundarySix: (row.is_boundary_six as boolean) ?? false,
    isDotBall: (row.is_dot_ball as boolean) ?? false,
    shotType: (row.shot_type as string | null) ?? null,
    lineLengthText: (row.line_length as string | null) ?? null,
    fieldingPosition: (row.fielding_position as string | null) ?? null,
    shotX: (row.shot_x as number | null) ?? null,
    shotY: (row.shot_y as number | null) ?? null,
    wagonZone: (row.wagon_zone as WagonZone | null) ?? null,
    wagonAngleDegrees: (row.wagon_angle_degrees as number | null) ?? null,
    wagonDistanceMeters: (row.wagon_distance_meters as number | null) ?? null,
    batContactType: (row.bat_contact_type as BatContactType | null) ?? null,
    battingPhase: (row.batting_phase as BattingPhase | null) ?? null,
    bowlingPhase: (row.bowling_phase as BowlingPhase | null) ?? null,
    pressureIndex: (row.pressure_index as number | null) ?? null,
    momentumDelta: (row.momentum_delta as number | null) ?? null,
    expectedRuns: (row.expected_runs as number | null) ?? null,
    expectedWicketProbability: (row.expected_wicket_probability as number | null) ?? null,
    isDeleted: (row.is_deleted as boolean) ?? false,
    createdAt: row.created_at as string,
  };
}

// ─── Full analytics data bundle ───────────────────────────────────────────────

export interface MatchAnalyticsBundle {
  match: CricketMatchFull | null;
  innings: CricketInnings[];
  ballEvents: CricketBallEventAnalytics[];
  partnerships: CricketPartnership[];
  battingEntries: CricketBattingEntryWithPlayer[];
  bowlingEntries: CricketBowlingEntryWithPlayer[];
  homeTeam: CricketTeam | null;
  awayTeam: CricketTeam | null;
  hasBallByBallData: boolean;
  hasManualScorecardData: boolean;
}

export async function getMatchAnalyticsData(matchId: string): Promise<MatchAnalyticsBundle> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { match: null, innings: [], ballEvents: [], partnerships: [], battingEntries: [], bowlingEntries: [], homeTeam: null, awayTeam: null, hasBallByBallData: false, hasManualScorecardData: false };
  }

  const [matchRes, inningsRes, ballEventsRes, partnershipsRes, battingRes, bowlingRes] = await Promise.all([
    supabase.from("cricket_matches").select("*").eq("id", matchId).single(),
    supabase.from("cricket_innings").select("*").eq("match_id", matchId).order("innings_number"),
    supabase.from("cricket_ball_events").select("*").eq("match_id", matchId).eq("is_deleted", false).order("over_number").order("ball_in_over"),
    supabase.from("cricket_partnerships").select("*").eq("match_id", matchId).order("wicket_number"),
    supabase.from("cricket_batting_scorecard_entries").select(`*, player:cricket_players!cricket_batting_scorecard_entries_player_id_fkey(display_name, slug)`).eq("match_id", matchId),
    supabase.from("cricket_bowling_scorecard_entries").select(`*, player:cricket_players!cricket_bowling_scorecard_entries_player_id_fkey(display_name, slug)`).eq("match_id", matchId),
  ]);

  const match = matchRes.data as CricketMatchFull | null;
  const ballEvents = (ballEventsRes.data ?? []).map((r) => rowToBallEventAnalytics(r as Record<string, unknown>));

  // Fetch teams if match exists
  let homeTeam: CricketTeam | null = null;
  let awayTeam: CricketTeam | null = null;
  if (match?.homeTeamId) {
    const { data } = await supabase.from("cricket_teams").select("*").eq("id", match.homeTeamId).single();
    homeTeam = data as CricketTeam | null;
  }
  if (match?.awayTeamId) {
    const { data } = await supabase.from("cricket_teams").select("*").eq("id", match.awayTeamId).single();
    awayTeam = data as CricketTeam | null;
  }

  const battingEntries = (battingRes.data ?? []).map((row) => {
    const player = (row as Record<string, unknown>).player as Record<string, unknown> | null;
    return {
      ...(row as Record<string, unknown>),
      playerName: player?.display_name ?? "Unknown",
      playerSlug: player?.slug ?? null,
      bowlerName: null,
      fielderName: null,
    } as CricketBattingEntryWithPlayer;
  });

  const bowlingEntries = (bowlingRes.data ?? []).map((row) => {
    const player = (row as Record<string, unknown>).player as Record<string, unknown> | null;
    return {
      ...(row as Record<string, unknown>),
      playerName: player?.display_name ?? "Unknown",
      playerSlug: player?.slug ?? null,
    } as CricketBowlingEntryWithPlayer;
  });

  return {
    match,
    innings: (inningsRes.data ?? []) as CricketInnings[],
    ballEvents,
    partnerships: (partnershipsRes.data ?? []) as CricketPartnership[],
    battingEntries,
    bowlingEntries,
    homeTeam,
    awayTeam,
    hasBallByBallData: ballEvents.length > 0,
    hasManualScorecardData: battingEntries.length > 0 || (inningsRes.data?.length ?? 0) > 0,
  };
}

export async function getMatchBallEvents(matchId: string): Promise<CricketBallEventAnalytics[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("cricket_ball_events")
    .select("*")
    .eq("match_id", matchId)
    .eq("is_deleted", false)
    .order("innings_id")
    .order("over_number")
    .order("ball_in_over");
  return (data ?? []).map((r) => rowToBallEventAnalytics(r as Record<string, unknown>));
}

export async function getPlayerBallEvents(
  playerId: string,
  leagueId?: string
): Promise<CricketBallEventAnalytics[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("cricket_ball_events")
    .select("*")
    .eq("striker_id", playerId)
    .eq("is_deleted", false)
    .eq("is_legal_delivery", true);

  if (leagueId) {
    query = query.eq("match_id",
      supabase.from("cricket_matches").select("id").eq("league_id", leagueId)
    );
  }

  const { data } = await query.order("created_at").limit(500);
  return (data ?? []).map((r) => rowToBallEventAnalytics(r as Record<string, unknown>));
}

export async function getLatestMatchAnalyticsSnapshot(
  matchId: string,
  snapshotType?: string
): Promise<CricketMatchAnalyticsSnapshot | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  let query = supabase
    .from("cricket_match_analytics_snapshots")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (snapshotType) query = query.eq("snapshot_type", snapshotType);

  const { data } = await query.single();
  if (!data) return null;

  return {
    id: data.id as string,
    matchId: data.match_id as string,
    leagueId: (data.league_id as string | null) ?? null,
    snapshotType: data.snapshot_type as string,
    generatedBy: (data.generated_by as string | null) ?? null,
    data: (data.data as Record<string, unknown>) ?? {},
    summary: (data.summary as Record<string, unknown>) ?? {},
    createdAt: data.created_at as string,
  };
}

export async function getLeagueMatchesForAnalytics(leagueId: string): Promise<Array<{
  id: string;
  matchStatus: string;
  scorecardStatus: string;
  hasBallByBallData: boolean;
}>> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data: matches } = await supabase
    .from("cricket_matches")
    .select("id, match_status, scorecard_status")
    .eq("league_id", leagueId)
    .in("match_status", ["completed", "live"]);

  if (!matches || matches.length === 0) return [];

  const matchIds = matches.map((m) => m.id as string);
  const { data: eventCounts } = await supabase
    .from("cricket_ball_events")
    .select("match_id")
    .in("match_id", matchIds)
    .eq("is_deleted", false)
    .limit(1);

  const hasEventsSet = new Set((eventCounts ?? []).map((e) => e.match_id as string));

  return matches.map((m) => ({
    id: m.id as string,
    matchStatus: m.match_status as string,
    scorecardStatus: m.scorecard_status as string,
    hasBallByBallData: hasEventsSet.has(m.id as string),
  }));
}
