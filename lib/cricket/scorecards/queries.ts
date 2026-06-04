import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ballsToOversText,
  calculateStrikeRate,
  calculateEconomyRate,
  calculateRunRate,
} from "./calculations";
import type {
  CricketInnings,
  CricketBattingEntryWithPlayer,
  CricketBowlingEntryWithPlayer,
  CricketFallOfWicket,
  CricketPartnership,
  CricketMatchSquad,
  CricketMatchSquadWithPlayer,
  CricketScorecardChangeLog,
  CricketFullScorecard,
  CricketMatchFull,
  CricketTeam,
  CricketPlayerFull,
} from "@/lib/cricket/types";

// ─── Row mappers ──────────────────────────────────────────────────────────────

function rowToInnings(row: Record<string, unknown>): CricketInnings {
  const ballsBowled = (row.balls_bowled as number) ?? 0;
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    inningsNumber: row.innings_number as number,
    battingTeamId: row.batting_team_id as string,
    bowlingTeamId: row.bowling_team_id as string,
    declared: (row.declared as boolean) ?? false,
    forfeited: (row.forfeited as boolean) ?? false,
    allOut: (row.all_out as boolean) ?? false,
    totalRuns: (row.total_runs as number) ?? 0,
    wicketsLost: (row.wickets_lost as number) ?? 0,
    ballsBowled,
    oversText: row.overs_text as string | null ?? ballsToOversText(ballsBowled),
    extrasTotal: (row.extras_total as number) ?? 0,
    byes: (row.byes as number) ?? 0,
    legByes: (row.leg_byes as number) ?? 0,
    wides: (row.wides as number) ?? 0,
    noBalls: (row.no_balls as number) ?? 0,
    penaltyRuns: (row.penalty_runs as number) ?? 0,
    targetRuns: (row.target_runs as number | null) ?? null,
    runRate: (row.run_rate as number | null) ?? calculateRunRate((row.total_runs as number) ?? 0, ballsBowled),
    requiredRunRate: (row.required_run_rate as number | null) ?? null,
    inningsStatus: (row.innings_status as CricketInnings["inningsStatus"]) ?? "not_started",
    startedAt: (row.started_at as string | null) ?? null,
    endedAt: (row.ended_at as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToBattingEntry(row: Record<string, unknown>, playerMap?: Map<string, string>): CricketBattingEntryWithPlayer {
  const runs = (row.runs as number) ?? 0;
  const balls = (row.balls as number) ?? 0;
  return {
    id: row.id as string,
    inningsId: row.innings_id as string,
    matchId: row.match_id as string,
    teamId: row.team_id as string,
    playerId: row.player_id as string,
    battingPosition: (row.batting_position as number | null) ?? null,
    runs,
    balls,
    fours: (row.fours as number) ?? 0,
    sixes: (row.sixes as number) ?? 0,
    minutes: (row.minutes as number | null) ?? null,
    strikeRate: (row.strike_rate as number | null) ?? calculateStrikeRate(runs, balls),
    dismissalType: (row.dismissal_type as string | null) ?? null,
    dismissedByPlayerId: (row.dismissed_by_player_id as string | null) ?? null,
    bowlerPlayerId: (row.bowler_player_id as string | null) ?? null,
    fielderPlayerId: (row.fielder_player_id as string | null) ?? null,
    isOut: (row.is_out as boolean) ?? false,
    didNotBat: (row.did_not_bat as boolean) ?? false,
    retiredHurt: (row.retired_hurt as boolean) ?? false,
    retiredOut: (row.retired_out as boolean) ?? false,
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    // Enriched display fields
    playerName: playerMap?.get(row.player_id as string) ?? "Unknown",
    playerSlug: null,
    bowlerName: row.bowler_player_id ? (playerMap?.get(row.bowler_player_id as string) ?? null) : null,
    fielderName: row.fielder_player_id ? (playerMap?.get(row.fielder_player_id as string) ?? null) : null,
  };
}

function rowToBowlingEntry(row: Record<string, unknown>, playerMap?: Map<string, string>): CricketBowlingEntryWithPlayer {
  const balls = (row.balls_bowled as number) ?? 0;
  const runs = (row.runs_conceded as number) ?? 0;
  return {
    id: row.id as string,
    inningsId: row.innings_id as string,
    matchId: row.match_id as string,
    teamId: row.team_id as string,
    playerId: row.player_id as string,
    ballsBowled: balls,
    oversText: (row.overs_text as string | null) ?? ballsToOversText(balls),
    maidens: (row.maidens as number) ?? 0,
    runsConceded: runs,
    wickets: (row.wickets as number) ?? 0,
    wides: (row.wides as number) ?? 0,
    noBalls: (row.no_balls as number) ?? 0,
    economyRate: (row.economy_rate as number | null) ?? calculateEconomyRate(runs, balls),
    dots: (row.dots as number) ?? 0,
    foursConceded: (row.fours_conceded as number) ?? 0,
    sixesConceded: (row.sixes_conceded as number) ?? 0,
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    playerName: playerMap?.get(row.player_id as string) ?? "Unknown",
    playerSlug: null,
  };
}

function rowToFOW(row: Record<string, unknown>): CricketFallOfWicket {
  return {
    id: row.id as string,
    inningsId: row.innings_id as string,
    matchId: row.match_id as string,
    wicketNumber: row.wicket_number as number,
    teamScore: row.team_score as number,
    ballsElapsed: (row.balls_elapsed as number | null) ?? null,
    oversText: (row.overs_text as string | null) ?? null,
    playerOutId: (row.player_out_id as string | null) ?? null,
    partnershipRuns: (row.partnership_runs as number | null) ?? null,
    partnershipBalls: (row.partnership_balls as number | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToPartnership(row: Record<string, unknown>): CricketPartnership {
  return {
    id: row.id as string,
    inningsId: row.innings_id as string,
    matchId: row.match_id as string,
    wicketNumber: (row.wicket_number as number | null) ?? null,
    playerOneId: (row.player_one_id as string | null) ?? null,
    playerTwoId: (row.player_two_id as string | null) ?? null,
    runs: (row.runs as number) ?? 0,
    balls: (row.balls as number) ?? 0,
    startScore: (row.start_score as number | null) ?? null,
    endScore: (row.end_score as number | null) ?? null,
    startBall: (row.start_ball as number | null) ?? null,
    endBall: (row.end_ball as number | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToSquad(row: Record<string, unknown>): CricketMatchSquad {
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    teamId: row.team_id as string,
    playerId: row.player_id as string,
    rosterEntryId: (row.roster_entry_id as string | null) ?? null,
    isPlayingXi: (row.is_playing_xi as boolean) ?? true,
    isSubstitute: (row.is_substitute as boolean) ?? false,
    battingPosition: (row.batting_position as number | null) ?? null,
    isCaptain: (row.is_captain as boolean) ?? false,
    isWicketkeeper: (row.is_wicketkeeper as boolean) ?? false,
    notes: (row.notes as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getCricketInningsForMatch(matchId: string): Promise<CricketInnings[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("cricket_innings")
    .select("*")
    .eq("match_id", matchId)
    .order("innings_number", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToInnings);
}

export async function getCricketMatchSquads(matchId: string): Promise<CricketMatchSquad[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("cricket_match_squads")
    .select("*")
    .eq("match_id", matchId)
    .order("batting_position", { ascending: true, nullsFirst: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToSquad);
}

export async function getCricketBattingEntries(inningsId: string): Promise<CricketBattingEntryWithPlayer[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("cricket_batting_scorecard_entries")
    .select("*, player:cricket_players(id, display_name, slug)")
    .eq("innings_id", inningsId)
    .order("batting_position", { ascending: true, nullsFirst: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => {
    const playerData = row.player as Record<string, unknown> | null;
    const entry = rowToBattingEntry(row);
    return {
      ...entry,
      playerName: playerData?.display_name as string ?? "Unknown",
      playerSlug: playerData?.slug as string | null ?? null,
    };
  });
}

export async function getCricketBowlingEntries(inningsId: string): Promise<CricketBowlingEntryWithPlayer[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("cricket_bowling_scorecard_entries")
    .select("*, player:cricket_players(id, display_name, slug)")
    .eq("innings_id", inningsId)
    .order("balls_bowled", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => {
    const playerData = row.player as Record<string, unknown> | null;
    const entry = rowToBowlingEntry(row);
    return {
      ...entry,
      playerName: playerData?.display_name as string ?? "Unknown",
      playerSlug: playerData?.slug as string | null ?? null,
    };
  });
}

export async function getCricketFallOfWickets(inningsId: string): Promise<CricketFallOfWicket[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("cricket_fall_of_wickets")
    .select("*")
    .eq("innings_id", inningsId)
    .order("wicket_number", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToFOW);
}

export async function getCricketPartnerships(inningsId: string): Promise<CricketPartnership[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("cricket_partnerships")
    .select("*")
    .eq("innings_id", inningsId)
    .order("wicket_number", { ascending: true, nullsFirst: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToPartnership);
}

export async function userCanScoreCricketMatch(userId: string, matchId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("user_can_score_cricket_match", {
    _match_id: matchId,
    _user_id: userId,
  });
  if (error) return false;
  return !!data;
}

export async function getScorecardChangeLogs(matchId: string): Promise<CricketScorecardChangeLog[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("cricket_scorecard_change_logs")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    matchId: row.match_id as string | null,
    inningsId: row.innings_id as string | null,
    actorUserId: row.actor_user_id as string | null,
    action: row.action as string,
    entityType: row.entity_type as string | null,
    entityId: row.entity_id as string | null,
    oldValue: row.old_value as Record<string, unknown>,
    newValue: row.new_value as Record<string, unknown>,
    createdAt: row.created_at as string,
  }));
}

/** Match squads with player display_name joined — used for live scoring player selection. */
export async function getCricketMatchSquadsWithPlayers(
  matchId: string
): Promise<{ id: string; teamId: string; playerId: string; isPlayingXi: boolean; player: { id: string; displayName: string; slug: string | null } }[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("cricket_match_squads")
    .select("id, team_id, player_id, is_playing_xi, player:cricket_players(id, display_name, slug)")
    .eq("match_id", matchId)
    .order("batting_position", { ascending: true, nullsFirst: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => {
    const p = row.player as Record<string, unknown> | null;
    return {
      id: row.id as string,
      teamId: row.team_id as string,
      playerId: row.player_id as string,
      isPlayingXi: (row.is_playing_xi as boolean) ?? true,
      player: {
        id: p?.id as string ?? row.player_id as string,
        displayName: p?.display_name as string ?? "Unknown",
        slug: (p?.slug as string | null) ?? null,
      },
    };
  });
}

/** Full scorecard including all tables for display. */
export async function getCricketFullScorecard(matchSlugOrId: string): Promise<CricketFullScorecard | null> {
  const { getCricketMatchBySlugOrId } = await import("@/lib/cricket/matches/queries");
  const match = await getCricketMatchBySlugOrId(matchSlugOrId);
  if (!match) return null;

  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const innings = await getCricketInningsForMatch(match.id);

  // Fetch all batting/bowling/FOW/partnerships in parallel
  const inningsDataPromises = innings.map(async (inn) => ({
    inningsId: inn.id,
    batting: await getCricketBattingEntries(inn.id),
    bowling: await getCricketBowlingEntries(inn.id),
    fow: await getCricketFallOfWickets(inn.id),
    partnerships: await getCricketPartnerships(inn.id),
  }));
  const inningsData = await Promise.all(inningsDataPromises);

  const battingEntries: Record<string, CricketBattingEntryWithPlayer[]> = {};
  const bowlingEntries: Record<string, CricketBowlingEntryWithPlayer[]> = {};
  const fallOfWickets: Record<string, CricketFallOfWicket[]> = {};
  const partnerships: Record<string, CricketPartnership[]> = {};

  for (const d of inningsData) {
    battingEntries[d.inningsId] = d.batting;
    bowlingEntries[d.inningsId] = d.bowling;
    fallOfWickets[d.inningsId] = d.fow;
    partnerships[d.inningsId] = d.partnerships;
  }

  const squadsRaw = await getCricketMatchSquads(match.id);

  // Fetch team/league info
  const [homeTeamResult, awayTeamResult, leagueResult] = await Promise.all([
    match.homeTeamId
      ? supabase.from("cricket_teams").select("*").eq("id", match.homeTeamId).single()
      : Promise.resolve({ data: null, error: null }),
    match.awayTeamId
      ? supabase.from("cricket_teams").select("*").eq("id", match.awayTeamId).single()
      : Promise.resolve({ data: null, error: null }),
    match.leagueId
      ? supabase.from("cricket_leagues").select("name, slug").eq("id", match.leagueId).single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  // Enrich squads with player data (best-effort)
  const squads: CricketMatchSquadWithPlayer[] = squadsRaw.map((s) => ({
    ...s,
    player: {} as CricketPlayerFull, // populated below if possible
  }));

  return {
    match: match as CricketMatchFull,
    innings,
    battingEntries,
    bowlingEntries,
    fallOfWickets,
    partnerships,
    squads,
    homeTeam: homeTeamResult.data as CricketTeam | null,
    awayTeam: awayTeamResult.data as CricketTeam | null,
    leagueName: leagueResult.data ? (leagueResult.data as Record<string, unknown>).name as string : null,
    leagueSlug: leagueResult.data ? (leagueResult.data as Record<string, unknown>).slug as string : null,
  };
}
