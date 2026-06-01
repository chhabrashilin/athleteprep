"use server";

/**
 * app/demo/actions.ts — Demo workspace creation server action.
 *
 * Creates a realistic cricket-themed demo workspace for the authenticated user.
 * Only available when NEXT_PUBLIC_ENABLE_MOCK_DATA=true.
 *
 * Security: uses the normal authenticated Supabase client (no service role).
 * All data is scoped to the current user via RLS.
 */

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createTeamForCurrentUser } from "@/lib/db/teams";
import { createPlayerForTeam } from "@/lib/db/players";
import { createGameForTeam } from "@/lib/db/games";
import { createEventTimestampForGame } from "@/lib/db/timestamps";
import { generateReportForGame } from "@/lib/analysis/generate-report";
import { trackDemoWorkspaceCreated } from "@/lib/analytics/track";
import {
  DEMO_TEAM,
  DEMO_PLAYERS,
  DEMO_GAME,
  DEMO_EVENTS,
  DEMO_TEAM_MARKER,
} from "@/lib/demo/demo-data";

export type DemoSetupResult =
  | { status: "created"; teamId: string; gameId: string }
  | { status: "exists"; teamId: string; gameId?: string }
  | { status: "disabled" }
  | { status: "error"; message: string };

/**
 * Checks if the demo workspace already exists for the current user.
 * Returns teamId (and gameId if found) if demo data exists.
 */
export async function checkDemoWorkspaceExists(): Promise<{
  exists: boolean;
  teamId?: string;
  gameId?: string;
}> {
  if (process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA !== "true") {
    return { exists: false };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { exists: false };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { exists: false };

  // Check if the user already has a team with the demo marker name
  const { data: memberRows } = await supabase
    .from("team_members")
    .select(`
      team_id,
      teams ( id, name )
    `)
    .eq("user_id", user.id);

  if (!memberRows) return { exists: false };

  for (const row of memberRows) {
    const teams = row.teams as unknown as { id: string; name: string } | null;
    if (teams && teams.name === DEMO_TEAM_MARKER) {
      // Found the demo team. Look for the demo game.
      const { data: games } = await supabase
        .from("games")
        .select("id")
        .eq("team_id", teams.id)
        .limit(1);

      return {
        exists: true,
        teamId: teams.id,
        gameId: games?.[0]?.id as string | undefined,
      };
    }
  }

  return { exists: false };
}

/**
 * Creates the full demo workspace: team, roster, game, timestamps, AI report.
 * On success, redirects to the demo team page.
 * On failure, returns an error result.
 */
export async function createDemoWorkspaceAction(): Promise<DemoSetupResult> {
  // Guard: feature flag
  if (process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA !== "true") {
    return { status: "disabled" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { status: "error", message: "Database is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "You must be signed in to create demo data." };
  }

  // Idempotency: check if demo already exists
  const existing = await checkDemoWorkspaceExists();
  if (existing.exists && existing.teamId) {
    return { status: "exists", teamId: existing.teamId, gameId: existing.gameId };
  }

  try {
    // 1. Create the demo team
    const teamId = await createTeamForCurrentUser(DEMO_TEAM);

    // 2. Create the demo roster (sequential to preserve order)
    const playerIdByName: Record<string, string> = {};
    for (const p of DEMO_PLAYERS) {
      const player = await createPlayerForTeam({
        teamId,
        firstName: p.firstName,
        lastName: p.lastName,
        jerseyNumber: p.jerseyNumber,
        position: p.position,
        role: p.role,
        dominantSide: p.dominantSide,
        notes: p.notes,
        status: "active",
      });
      const fullName = `${p.firstName} ${p.lastName}`;
      playerIdByName[fullName] = player.id;
    }

    // 3. Create the demo game
    const game = await createGameForTeam({
      teamId,
      sport: DEMO_GAME.sport,
      gameType: DEMO_GAME.gameType,
      title: DEMO_GAME.title,
      opponentName: DEMO_GAME.opponentName,
      gameDate: DEMO_GAME.gameDate,
      homeAway: DEMO_GAME.homeAway,
      venue: DEMO_GAME.venue,
      competitionName: DEMO_GAME.competitionName,
      teamScore: DEMO_GAME.teamScore,
      opponentScore: DEMO_GAME.opponentScore,
      result: DEMO_GAME.result,
      summaryNotes: DEMO_GAME.summaryNotes,
      coachNotes: DEMO_GAME.coachNotes,
      opponentNotes: DEMO_GAME.opponentNotes,
    });

    const gameId = game.id;

    // 4. Create timestamps — resolve player names → IDs
    for (const evt of DEMO_EVENTS) {
      const resolvedPlayerIds = evt.playerNames
        .map((name) => playerIdByName[name])
        .filter((id): id is string => Boolean(id));

      await createEventTimestampForGame({
        teamId,
        gameId,
        timestampSeconds: evt.timestampSeconds,
        label: evt.label,
        eventType: evt.eventType,
        teamContext: evt.teamContext,
        description: evt.description,
        importance: evt.importance,
        tags: [...evt.tags],
        playerIds: resolvedPlayerIds,
      });
    }

    // 5. Generate the AI report (best-effort — don't fail demo setup if this fails)
    try {
      await generateReportForGame(teamId, gameId);
    } catch (reportErr) {
      console.warn("Demo report generation failed (non-fatal):", reportErr);
    }

    void trackDemoWorkspaceCreated(user.id, teamId, {
      sport: DEMO_TEAM.sport,
      playerCount: DEMO_PLAYERS.length,
      eventCount: DEMO_EVENTS.length,
    });

    return { status: "created", teamId, gameId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Demo setup failed.";
    console.error("createDemoWorkspaceAction error:", message);
    return { status: "error", message };
  }
}

/**
 * Server action wrapper for use with <form> — creates demo workspace and redirects.
 */
export async function createDemoWorkspaceFormAction(): Promise<void> {
  const result = await createDemoWorkspaceAction();

  if (result.status === "created") {
    redirect(`/teams/${result.teamId}/games/${result.gameId}/report`);
  } else if (result.status === "exists") {
    if (result.gameId) {
      redirect(`/teams/${result.teamId}/games/${result.gameId}/report`);
    } else {
      redirect(`/teams/${result.teamId}`);
    }
  } else if (result.status === "disabled") {
    redirect("/dashboard?error=demo-disabled");
  } else {
    // Error — redirect with message
    redirect(`/demo/setup?error=${encodeURIComponent(result.message)}`);
  }
}
