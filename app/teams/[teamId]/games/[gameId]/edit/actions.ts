"use server";

import { redirect } from "next/navigation";
import {
  updateGameForTeam,
  archiveGameForTeam,
  deleteGameForTeam,
} from "@/lib/db/games";
import type { SportType, GameType, HomeAwayStatus } from "@/types/sports";
import type { GameFormState } from "@/app/teams/[teamId]/games/new/actions";

const ALLOWED_SPORTS: SportType[] = [
  "soccer", "cricket", "basketball", "american_football",
  "hockey", "volleyball", "other",
];
const ALLOWED_GAME_TYPES: GameType[] = [
  "match", "practice", "scrimmage", "film_session",
];
const ALLOWED_HOME_AWAY: HomeAwayStatus[] = [
  "home", "away", "neutral", "not_applicable",
];

export async function updateGameAction(
  _prevState: GameFormState,
  formData: FormData
): Promise<GameFormState> {
  const teamId   = (formData.get("teamId")  as string | null) ?? "";
  const gameId   = (formData.get("gameId")  as string | null) ?? "";
  const title    = (formData.get("title")   as string | null)?.trim() ?? "";
  const sport    = (formData.get("sport")   as string | null)?.trim() ?? "";
  const gameType = (formData.get("gameType") as string | null)?.trim() ?? "";
  const opponentName    = (formData.get("opponentName")    as string | null)?.trim() || undefined;
  const gameDate        = (formData.get("gameDate")        as string | null)?.trim() || undefined;
  const rawHomeAway     = (formData.get("homeAway")        as string | null)?.trim();
  const venue           = (formData.get("venue")           as string | null)?.trim() || undefined;
  const competitionName = (formData.get("competitionName") as string | null)?.trim() || undefined;
  const teamScore       = (formData.get("teamScore")       as string | null)?.trim() || undefined;
  const opponentScore   = (formData.get("opponentScore")   as string | null)?.trim() || undefined;
  const result          = (formData.get("result")          as string | null)?.trim() || undefined;
  const summaryNotes    = (formData.get("summaryNotes")    as string | null)?.trim() || undefined;
  const coachNotes      = (formData.get("coachNotes")      as string | null)?.trim() || undefined;
  const opponentNotes   = (formData.get("opponentNotes")   as string | null)?.trim() || undefined;

  if (!teamId || !gameId) return { errors: { form: "Invalid request." } };

  const homeAway: HomeAwayStatus = ALLOWED_HOME_AWAY.includes(rawHomeAway as HomeAwayStatus)
    ? (rawHomeAway as HomeAwayStatus)
    : "not_applicable";

  const errors: GameFormState["errors"] = {};

  if (!title) {
    errors.title = "Title is required.";
  } else if (title.length < 2) {
    errors.title = "Title must be at least 2 characters.";
  } else if (title.length > 120) {
    errors.title = "Title must be 120 characters or fewer.";
  }

  if (!sport || !ALLOWED_SPORTS.includes(sport as SportType)) {
    errors.sport = "Please select a valid sport.";
  }

  if (!gameType || !ALLOWED_GAME_TYPES.includes(gameType as GameType)) {
    errors.gameType = "Please select a valid type.";
  }

  if (opponentName && opponentName.length > 120) errors.opponentName = "Max 120 characters.";
  if (venue && venue.length > 160) errors.venue = "Max 160 characters.";
  if (competitionName && competitionName.length > 160) errors.competitionName = "Max 160 characters.";
  if (teamScore && teamScore.length > 40) errors.teamScore = "Max 40 characters.";
  if (opponentScore && opponentScore.length > 40) errors.opponentScore = "Max 40 characters.";
  if (summaryNotes && summaryNotes.length > 1500) errors.summaryNotes = "Max 1500 characters.";
  if (coachNotes && coachNotes.length > 4000) errors.coachNotes = "Max 4000 characters.";
  if (opponentNotes && opponentNotes.length > 4000) errors.opponentNotes = "Max 4000 characters.";

  if (Object.keys(errors).length > 0) return { errors };

  try {
    await updateGameForTeam({
      gameId,
      teamId,
      title,
      sport: sport as SportType,
      gameType: gameType as GameType,
      opponentName,
      gameDate,
      homeAway,
      venue,
      competitionName,
      teamScore,
      opponentScore,
      result: result || undefined,
      summaryNotes,
      coachNotes,
      opponentNotes,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { errors: { form: message } };
  }

  redirect(`/teams/${teamId}/games/${gameId}`);
}

export async function archiveGameAction(formData: FormData): Promise<void> {
  const teamId = (formData.get("teamId") as string | null) ?? "";
  const gameId = (formData.get("gameId") as string | null) ?? "";
  if (!teamId || !gameId) return;

  try {
    await archiveGameForTeam(teamId, gameId);
  } catch (err) {
    console.error("archiveGameAction error:", err);
    throw err;
  }

  redirect(`/teams/${teamId}/games`);
}

export async function deleteGameAction(formData: FormData): Promise<void> {
  const teamId = (formData.get("teamId") as string | null) ?? "";
  const gameId = (formData.get("gameId") as string | null) ?? "";
  if (!teamId || !gameId) return;

  try {
    await deleteGameForTeam(teamId, gameId);
  } catch (err) {
    console.error("deleteGameAction error:", err);
    throw err;
  }

  redirect(`/teams/${teamId}/games`);
}
