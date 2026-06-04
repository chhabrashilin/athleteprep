import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCricketMatchBySlugOrId } from "@/lib/cricket/matches/queries";
import { getCricketMatchSquads } from "@/lib/cricket/scorecards/queries";
import type { CricketMatchFull, CricketMatchSquad, CricketTeamFull, CricketRosterEntryWithPlayer } from "@/lib/cricket/types";

export interface MatchSetupData {
  match: CricketMatchFull;
  homeTeam: CricketTeamFull | null;
  awayTeam: CricketTeamFull | null;
  homeRoster: CricketRosterEntryWithPlayer[];
  awayRoster: CricketRosterEntryWithPlayer[];
  squads: CricketMatchSquad[];
  leagueName: string | null;
  leagueSlug: string | null;
}

export async function getCricketMatchSetup(matchSlugOrId: string): Promise<MatchSetupData | null> {
  const match = await getCricketMatchBySlugOrId(matchSlugOrId);
  if (!match) return null;

  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const [homeTeamResult, awayTeamResult, leagueResult, squads] = await Promise.all([
    match.homeTeamId
      ? supabase.from("cricket_teams").select("*").eq("id", match.homeTeamId).single()
      : Promise.resolve({ data: null, error: null }),
    match.awayTeamId
      ? supabase.from("cricket_teams").select("*").eq("id", match.awayTeamId).single()
      : Promise.resolve({ data: null, error: null }),
    match.leagueId
      ? supabase.from("cricket_leagues").select("name, slug").eq("id", match.leagueId).single()
      : Promise.resolve({ data: null, error: null }),
    getCricketMatchSquads(match.id),
  ]);

  // Fetch rosters for both teams
  const [homeRosterResult, awayRosterResult] = await Promise.all([
    match.homeTeamId
      ? supabase
          .from("cricket_team_rosters")
          .select("*, player:cricket_players(*)")
          .eq("cricket_team_id", match.homeTeamId)
      : Promise.resolve({ data: [], error: null }),
    match.awayTeamId
      ? supabase
          .from("cricket_team_rosters")
          .select("*, player:cricket_players(*)")
          .eq("cricket_team_id", match.awayTeamId)
      : Promise.resolve({ data: [], error: null }),
  ]);

  return {
    match: match as CricketMatchFull,
    homeTeam: homeTeamResult.data as CricketTeamFull | null,
    awayTeam: awayTeamResult.data as CricketTeamFull | null,
    homeRoster: (homeRosterResult.data ?? []) as unknown as CricketRosterEntryWithPlayer[],
    awayRoster: (awayRosterResult.data ?? []) as unknown as CricketRosterEntryWithPlayer[],
    squads,
    leagueName: leagueResult.data ? (leagueResult.data as Record<string, unknown>).name as string : null,
    leagueSlug: leagueResult.data ? (leagueResult.data as Record<string, unknown>).slug as string : null,
  };
}
