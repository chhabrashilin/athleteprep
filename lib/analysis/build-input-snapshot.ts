/**
 * lib/analysis/build-input-snapshot.ts
 * Aggregates all game data into a typed AnalysisInputSnapshot.
 * This snapshot is stored verbatim on the analysis_jobs row for reproducibility.
 */
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  AnalysisInputSnapshot,
  AnalysisRosterPlayer,
  AnalysisVideoSummary,
  AnalysisEvent,
} from "@/types/analysis";
import type { VideoAsset, Player } from "@/types/database";
import type { EventImportance } from "@/types/sports";

function playerToAnalysis(p: Player): AnalysisRosterPlayer {
  const displayName =
    p.displayName?.trim() || [p.firstName, p.lastName].filter(Boolean).join(" ");
  return {
    id: p.id,
    displayName,
    firstName: p.firstName,
    lastName: p.lastName,
    jerseyNumber: p.jerseyNumber,
    position: p.position,
    role: p.role,
    status: p.status as string | null,
    notes: p.notes,
  };
}

function videoToAnalysis(v: VideoAsset): AnalysisVideoSummary {
  return {
    id: v.id,
    fileName: v.fileName,
    durationSeconds: v.durationSeconds,
    uploadStatus: v.uploadStatus,
    processingStatus: v.processingStatus,
  };
}

interface RawEventRow {
  id: string;
  timestampSeconds: number;
  endTimestampSeconds: number | null;
  label: string;
  eventType: string | null;
  teamContext: string | null;
  description: string | null;
  importance: EventImportance;
  tags: string[];
  playerIds: string[];
  opponentPlayerNames: string[];
}

function eventToAnalysis(
  e: RawEventRow,
  playerMap: Map<string, Player>
): AnalysisEvent {
  const playerNames = e.playerIds
    .map((id) => {
      const p = playerMap.get(id);
      if (!p) return null;
      return p.displayName?.trim() || [p.firstName, p.lastName].filter(Boolean).join(" ");
    })
    .filter((n): n is string => n !== null);

  return {
    id: e.id,
    timestampSeconds: e.timestampSeconds,
    endTimestampSeconds: e.endTimestampSeconds,
    label: e.label,
    eventType: e.eventType,
    teamContext: e.teamContext,
    description: e.description,
    importance: e.importance,
    tags: e.tags,
    playerIds: e.playerIds,
    playerNames,
    opponentPlayerNames: e.opponentPlayerNames,
  };
}

/**
 * Builds an AnalysisInputSnapshot from the database for a given game.
 * Requires an authenticated server-side context.
 * Throws if the game or team is not found.
 */
export async function buildAnalysisInputSnapshot(
  teamId: string,
  gameId: string
): Promise<AnalysisInputSnapshot> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Database is not configured.");

  // Fetch all data in parallel
  const [teamResult, gameResult, rosterResult, videoResult, eventsResult] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id, name, sport, organization_name, level")
        .eq("id", teamId)
        .single(),
      supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .eq("team_id", teamId)
        .single(),
      supabase
        .from("players")
        .select("*")
        .eq("team_id", teamId)
        .eq("status", "active")
        .order("first_name", { ascending: true }),
      supabase
        .from("video_assets")
        .select("*")
        .eq("team_id", teamId)
        .eq("game_id", gameId)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("event_timestamps")
        .select("*")
        .eq("team_id", teamId)
        .eq("game_id", gameId)
        .order("timestamp_seconds", { ascending: true }),
    ]);

  if (teamResult.error || !teamResult.data) {
    throw new Error("Team not found or access denied.");
  }
  if (gameResult.error || !gameResult.data) {
    throw new Error("Game not found or access denied.");
  }

  const teamRow = teamResult.data as Record<string, unknown>;
  const gameRow = gameResult.data as Record<string, unknown>;
  const rosterRows = (rosterResult.data ?? []) as Record<string, unknown>[];
  const videoRows = (videoResult.data ?? []) as Record<string, unknown>[];
  const eventRows = (eventsResult.data ?? []) as Record<string, unknown>[];

  // Build player map for name resolution
  const players: Player[] = rosterRows.map((r) => ({
    id: r.id as string,
    teamId: r.team_id as string,
    userId: (r.user_id as string | null) ?? null,
    firstName: r.first_name as string,
    lastName: (r.last_name as string | null) ?? null,
    displayName: (r.display_name as string | null) ?? null,
    jerseyNumber: (r.jersey_number as string | null) ?? null,
    position: (r.position as string | null) ?? null,
    role: (r.role as string | null) ?? null,
    dominantSide: (r.dominant_side as string | null) ?? null,
    classYear: (r.class_year as string | null) ?? null,
    height: (r.height as string | null) ?? null,
    weight: (r.weight as string | null) ?? null,
    status: (r.status as string) ?? "active",
    notes: (r.notes as string | null) ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));

  const playerMap = new Map(players.map((p) => [p.id, p]));

  // Build raw event rows for mapping — typed minimally to avoid EventTimestamp import conflict
  const rawEvents = eventRows.map((r) => ({
    id: r.id as string,
    timestampSeconds: Number(r.timestamp_seconds),
    endTimestampSeconds: r.end_timestamp_seconds != null ? Number(r.end_timestamp_seconds) : null,
    label: r.label as string,
    eventType: (r.event_type as string | null) ?? null,
    teamContext: (r.team_context as string | null) ?? null,
    description: (r.description as string | null) ?? null,
    importance: ((r.importance as string) ?? "medium") as EventImportance,
    tags: (r.tags as string[]) ?? [],
    playerIds: (r.player_ids as string[]) ?? [],
    opponentPlayerNames: (r.opponent_player_names as string[]) ?? [],
  }));

  // Build primary video
  const primaryVideoRow = videoRows[0];
  const video: VideoAsset | null = primaryVideoRow
    ? {
        id: primaryVideoRow.id as string,
        teamId: primaryVideoRow.team_id as string,
        gameId: (primaryVideoRow.game_id as string | null) ?? null,
        uploadedBy: (primaryVideoRow.uploaded_by as string | null) ?? null,
        storageBucket: primaryVideoRow.storage_bucket as string,
        storagePath: primaryVideoRow.storage_path as string,
        publicUrl: (primaryVideoRow.public_url as string | null) ?? null,
        fileName: primaryVideoRow.file_name as string,
        fileSizeBytes: (primaryVideoRow.file_size_bytes as number | null) ?? null,
        mimeType: (primaryVideoRow.mime_type as string | null) ?? null,
        durationSeconds: (primaryVideoRow.duration_seconds as number | null) ?? null,
        thumbnailPath: (primaryVideoRow.thumbnail_path as string | null) ?? null,
        uploadStatus: (primaryVideoRow.upload_status as "pending" | "uploading" | "uploaded" | "failed") ?? "uploaded",
        processingStatus: (primaryVideoRow.processing_status as "not_started" | "pending" | "processing" | "completed" | "failed") ?? "not_started",
        processingError: (primaryVideoRow.processing_error as string | null) ?? null,
        metadata: (primaryVideoRow.metadata as Record<string, unknown>) ?? {},
        createdAt: primaryVideoRow.created_at as string,
        updatedAt: primaryVideoRow.updated_at as string,
      }
    : null;

  return {
    team: {
      id: teamRow.id as string,
      name: teamRow.name as string,
      sport: teamRow.sport as string,
      organizationName: (teamRow.organization_name as string | null) ?? null,
      level: (teamRow.level as string | null) ?? null,
    },
    game: {
      id: gameRow.id as string,
      title: gameRow.title as string,
      sport: gameRow.sport as string,
      gameType: gameRow.game_type as string,
      opponentName: (gameRow.opponent_name as string | null) ?? null,
      gameDate: (gameRow.game_date as string | null) ?? null,
      homeAway: (gameRow.home_away as string | null) ?? null,
      venue: (gameRow.venue as string | null) ?? null,
      competitionName: (gameRow.competition_name as string | null) ?? null,
      teamScore: (gameRow.team_score as string | null) ?? null,
      opponentScore: (gameRow.opponent_score as string | null) ?? null,
      result: (gameRow.result as string | null) ?? null,
      summaryNotes: (gameRow.summary_notes as string | null) ?? null,
      coachNotes: (gameRow.coach_notes as string | null) ?? null,
      opponentNotes: (gameRow.opponent_notes as string | null) ?? null,
    },
    roster: players.map(playerToAnalysis),
    video: video ? videoToAnalysis(video) : null,
    events: rawEvents.map((e) => eventToAnalysis(e, playerMap)),
    generatedAt: new Date().toISOString(),
  };
}
