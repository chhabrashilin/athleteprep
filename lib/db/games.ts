/**
 * lib/db/games.ts — Game/practice session data access.
 * All functions use the authenticated server Supabase client.
 * Call only from Server Components, Server Actions, or Route Handlers.
 */
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Game } from "@/types/database";
import type { GameStatus } from "@/types/database";
import type { SportType, GameType, HomeAwayStatus } from "@/types/sports";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateGameInput {
  teamId: string;
  sport: SportType;
  gameType: GameType;
  title: string;
  opponentName?: string;
  gameDate?: string;
  homeAway?: HomeAwayStatus;
  venue?: string;
  competitionName?: string;
  teamScore?: string;
  opponentScore?: string;
  result?: string;
  summaryNotes?: string;
  coachNotes?: string;
  opponentNotes?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateGameInput {
  gameId: string;
  teamId: string;
  title?: string;
  sport?: SportType;
  gameType?: GameType;
  opponentName?: string;
  gameDate?: string;
  homeAway?: HomeAwayStatus;
  venue?: string;
  competitionName?: string;
  teamScore?: string;
  opponentScore?: string;
  result?: string;
  summaryNotes?: string;
  coachNotes?: string;
  opponentNotes?: string;
  status?: GameStatus;
  metadata?: Record<string, unknown>;
}

export interface GameSetupStatus {
  hasGameDetails: boolean;
  hasRoster: boolean;
  hasVideo: boolean;
  hasTimestamps: boolean;
  hasReport: boolean;
  isReadyForAnalysis: boolean;
}

// ---------------------------------------------------------------------------
// Internal transform
// ---------------------------------------------------------------------------

function rowToGame(row: Record<string, unknown>): Game {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    createdBy: (row.created_by as string | null) ?? null,
    sport: row.sport as SportType,
    gameType: row.game_type as GameType,
    title: row.title as string,
    opponentName: (row.opponent_name as string | null) ?? null,
    gameDate: (row.game_date as string | null) ?? null,
    startTime: (row.start_time as string | null) ?? null,
    homeAway: (row.home_away as HomeAwayStatus) ?? "not_applicable",
    venue: (row.venue as string | null) ?? null,
    competitionName: (row.competition_name as string | null) ?? null,
    teamScore: (row.team_score as string | null) ?? null,
    opponentScore: (row.opponent_score as string | null) ?? null,
    result: (row.result as string | null) ?? null,
    summaryNotes: (row.summary_notes as string | null) ?? null,
    coachNotes: (row.coach_notes as string | null) ?? null,
    opponentNotes: (row.opponent_notes as string | null) ?? null,
    status: (row.status as GameStatus) ?? "draft",
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// Read functions
// ---------------------------------------------------------------------------

/**
 * Returns all games for a team, ordered by game_date desc then created_at desc.
 * Excludes archived games by default; pass includeArchived to see them.
 */
export async function getGamesForTeam(
  teamId: string,
  { includeArchived = false }: { includeArchived?: boolean } = {}
): Promise<Game[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("games")
    .select("*")
    .eq("team_id", teamId)
    .order("game_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (!includeArchived) {
    query = query.neq("status", "archived");
  }

  const { data, error } = await query;

  if (error) {
    console.error("getGamesForTeam error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => rowToGame(row as Record<string, unknown>));
}

/**
 * Returns a single game by ID, scoped to the team.
 * RLS (is_team_member) enforces membership automatically.
 * Returns null if not found or not authorized.
 */
export async function getGameByIdForTeam(
  teamId: string,
  gameId: string
): Promise<Game | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .eq("team_id", teamId)
    .single();

  if (error || !data) return null;
  return rowToGame(data as Record<string, unknown>);
}

/**
 * Returns total + draft + analyzed counts for a team.
 */
export async function getTeamGameCount(
  teamId: string
): Promise<{ total: number; draft: number; analyzed: number }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { total: 0, draft: 0, analyzed: 0 };

  const { data, error } = await supabase
    .from("games")
    .select("status")
    .eq("team_id", teamId)
    .neq("status", "archived");

  if (error || !data) return { total: 0, draft: 0, analyzed: 0 };

  const total = data.length;
  const draft = data.filter((r) => r.status === "draft" || r.status === "ready_for_analysis").length;
  const analyzed = data.filter((r) => r.status === "analyzed").length;
  return { total, draft, analyzed };
}

/**
 * Batch game count query for multiple teams.
 * Returns a map of teamId → { total, draft }.
 */
export async function getGameCountsForTeams(
  teamIds: string[]
): Promise<Record<string, { total: number; draft: number }>> {
  if (teamIds.length === 0) return {};

  const supabase = await createServerSupabaseClient();
  if (!supabase) return {};

  const { data, error } = await supabase
    .from("games")
    .select("team_id, status")
    .in("team_id", teamIds)
    .neq("status", "archived");

  if (error || !data) return {};

  const counts: Record<string, { total: number; draft: number }> = {};
  for (const row of data) {
    const tid = row.team_id as string;
    if (!counts[tid]) counts[tid] = { total: 0, draft: 0 };
    counts[tid].total++;
    const s = row.status as string;
    if (s === "draft" || s === "ready_for_analysis") counts[tid].draft++;
  }
  return counts;
}

/**
 * Returns the setup/preparation status for a game.
 * Checks which analysis prerequisites are met.
 */
export async function getGameSetupStatus(
  teamId: string,
  gameId: string
): Promise<GameSetupStatus | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  // Fetch the game, player count, video count, timestamp count, and report existence in parallel.
  const [gameResult, videoResult, timestampResult, reportResult, rosterResult] =
    await Promise.all([
      supabase
        .from("games")
        .select("id, title, opponent_name, game_date, sport, game_type, coach_notes")
        .eq("id", gameId)
        .eq("team_id", teamId)
        .single(),
      supabase
        .from("video_assets")
        .select("id")
        .eq("game_id", gameId)
        .eq("team_id", teamId)
        .limit(1),
      supabase
        .from("event_timestamps")
        .select("id")
        .eq("game_id", gameId)
        .eq("team_id", teamId)
        .limit(1),
      supabase
        .from("game_reports")
        .select("id")
        .eq("game_id", gameId)
        .eq("team_id", teamId)
        .eq("is_current", true)
        .limit(1),
      supabase
        .from("players")
        .select("id")
        .eq("team_id", teamId)
        .eq("status", "active")
        .limit(1),
    ]);

  if (gameResult.error || !gameResult.data) return null;

  const hasVideo = !videoResult.error && (videoResult.data?.length ?? 0) > 0;
  const hasTimestamps = !timestampResult.error && (timestampResult.data?.length ?? 0) > 0;
  const hasReport = !reportResult.error && (reportResult.data?.length ?? 0) > 0;
  const hasRoster = !rosterResult.error && (rosterResult.data?.length ?? 0) > 0;

  // Game details are complete if the game exists (all required fields were enforced on creation).
  const hasGameDetails = true;

  return {
    hasGameDetails,
    hasRoster,
    hasVideo,
    hasTimestamps,
    hasReport,
    isReadyForAnalysis: hasGameDetails && hasVideo && hasTimestamps,
  };
}

// ---------------------------------------------------------------------------
// Write functions — RLS enforces is_team_staff for INSERT/UPDATE
// ---------------------------------------------------------------------------

/**
 * Creates a new game record for the team.
 * Throws on failure.
 */
export async function createGameForTeam(input: CreateGameInput): Promise<Game> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Database is not configured. Check your environment variables.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to create a game.");

  const { data, error } = await supabase
    .from("games")
    .insert({
      team_id: input.teamId,
      created_by: user.id,
      sport: input.sport,
      game_type: input.gameType,
      title: input.title.trim(),
      opponent_name: input.opponentName?.trim() || null,
      game_date: input.gameDate || null,
      home_away: input.homeAway ?? "not_applicable",
      venue: input.venue?.trim() || null,
      competition_name: input.competitionName?.trim() || null,
      team_score: input.teamScore?.trim() || null,
      opponent_score: input.opponentScore?.trim() || null,
      result: input.result?.trim() || null,
      summary_notes: input.summaryNotes?.trim() || null,
      coach_notes: input.coachNotes?.trim() || null,
      opponent_notes: input.opponentNotes?.trim() || null,
      status: "draft",
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create game. Please try again.");
  }

  return rowToGame(data as Record<string, unknown>);
}

/**
 * Updates an existing game record.
 * Throws on failure.
 */
export async function updateGameForTeam(input: UpdateGameInput): Promise<Game> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Database is not configured. Check your environment variables.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to edit a game.");

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.sport !== undefined) patch.sport = input.sport;
  if (input.gameType !== undefined) patch.game_type = input.gameType;
  if (input.opponentName !== undefined) patch.opponent_name = input.opponentName?.trim() || null;
  if (input.gameDate !== undefined) patch.game_date = input.gameDate || null;
  if (input.homeAway !== undefined) patch.home_away = input.homeAway;
  if (input.venue !== undefined) patch.venue = input.venue?.trim() || null;
  if (input.competitionName !== undefined) patch.competition_name = input.competitionName?.trim() || null;
  if (input.teamScore !== undefined) patch.team_score = input.teamScore?.trim() || null;
  if (input.opponentScore !== undefined) patch.opponent_score = input.opponentScore?.trim() || null;
  if (input.result !== undefined) patch.result = input.result?.trim() || null;
  if (input.summaryNotes !== undefined) patch.summary_notes = input.summaryNotes?.trim() || null;
  if (input.coachNotes !== undefined) patch.coach_notes = input.coachNotes?.trim() || null;
  if (input.opponentNotes !== undefined) patch.opponent_notes = input.opponentNotes?.trim() || null;
  if (input.status !== undefined) patch.status = input.status;
  if (input.metadata !== undefined) patch.metadata = input.metadata;

  const { data, error } = await supabase
    .from("games")
    .update(patch)
    .eq("id", input.gameId)
    .eq("team_id", input.teamId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update game. Please try again.");
  }

  return rowToGame(data as Record<string, unknown>);
}

/**
 * Sets game status to 'archived'. Soft delete — data is preserved.
 */
export async function archiveGameForTeam(
  teamId: string,
  gameId: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Database is not configured. Check your environment variables.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to archive a game.");

  const { error } = await supabase
    .from("games")
    .update({ status: "archived" })
    .eq("id", gameId)
    .eq("team_id", teamId);

  if (error) {
    throw new Error(error.message ?? "Failed to archive game. Please try again.");
  }
}

/**
 * Permanently deletes a game. Cascades to video_assets, event_timestamps,
 * clips, analysis_jobs, game_reports (via DB cascade).
 * Requires manager role — enforced by RLS.
 */
export async function deleteGameForTeam(
  teamId: string,
  gameId: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Database is not configured. Check your environment variables.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to delete a game.");

  const { error } = await supabase
    .from("games")
    .delete()
    .eq("id", gameId)
    .eq("team_id", teamId);

  if (error) {
    throw new Error(error.message ?? "Failed to delete game. Please try again.");
  }
}
