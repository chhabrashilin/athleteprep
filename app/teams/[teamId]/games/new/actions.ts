"use server";

import { redirect } from "next/navigation";
import { createGameForTeam } from "@/lib/db/games";
import type { SportType, GameType, HomeAwayStatus } from "@/types/sports";

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
const ALLOWED_RESULTS = ["Win", "Loss", "Draw", "Not played", "N/A", ""];

export interface GameFormState {
  errors?: {
    title?: string;
    sport?: string;
    gameType?: string;
    opponentName?: string;
    venue?: string;
    competitionName?: string;
    teamScore?: string;
    opponentScore?: string;
    summaryNotes?: string;
    coachNotes?: string;
    opponentNotes?: string;
    form?: string;
  };
}

export async function createGameAction(
  _prevState: GameFormState,
  formData: FormData
): Promise<GameFormState> {
  const teamId    = (formData.get("teamId")          as string | null) ?? "";
  const title     = (formData.get("title")           as string | null)?.trim() ?? "";
  const sport     = (formData.get("sport")           as string | null)?.trim() ?? "";
  const gameType  = (formData.get("gameType")        as string | null)?.trim() ?? "";
  const opponentName   = (formData.get("opponentName")   as string | null)?.trim() || undefined;
  const gameDate       = (formData.get("gameDate")       as string | null)?.trim() || undefined;
  const rawHomeAway    = (formData.get("homeAway")       as string | null)?.trim();
  const venue          = (formData.get("venue")          as string | null)?.trim() || undefined;
  const competitionName= (formData.get("competitionName") as string | null)?.trim() || undefined;
  const teamScore      = (formData.get("teamScore")      as string | null)?.trim() || undefined;
  const opponentScore  = (formData.get("opponentScore")  as string | null)?.trim() || undefined;
  const result         = (formData.get("result")         as string | null)?.trim() || undefined;
  const summaryNotes   = (formData.get("summaryNotes")   as string | null)?.trim() || undefined;
  const coachNotes     = (formData.get("coachNotes")     as string | null)?.trim() || undefined;
  const opponentNotes  = (formData.get("opponentNotes")  as string | null)?.trim() || undefined;

  if (!teamId) return { errors: { form: "Invalid team." } };

  const homeAway: HomeAwayStatus = ALLOWED_HOME_AWAY.includes(rawHomeAway as HomeAwayStatus)
    ? (rawHomeAway as HomeAwayStatus)
    : "not_applicable";

  // Validation
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

  if (opponentName && opponentName.length > 120) {
    errors.opponentName = "Opponent name must be 120 characters or fewer.";
  }

  if (venue && venue.length > 160) {
    errors.venue = "Venue must be 160 characters or fewer.";
  }

  if (competitionName && competitionName.length > 160) {
    errors.competitionName = "Competition name must be 160 characters or fewer.";
  }

  if (teamScore && teamScore.length > 40) {
    errors.teamScore = "Score must be 40 characters or fewer.";
  }

  if (opponentScore && opponentScore.length > 40) {
    errors.opponentScore = "Score must be 40 characters or fewer.";
  }

  if (summaryNotes && summaryNotes.length > 1500) {
    errors.summaryNotes = "Summary must be 1500 characters or fewer.";
  }

  if (coachNotes && coachNotes.length > 4000) {
    errors.coachNotes = "Coach notes must be 4000 characters or fewer.";
  }

  if (opponentNotes && opponentNotes.length > 4000) {
    errors.opponentNotes = "Opponent notes must be 4000 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) return { errors };

  let gameId: string;
  try {
    const game = await createGameForTeam({
      teamId,
      sport: sport as SportType,
      gameType: gameType as GameType,
      title,
      opponentName,
      gameDate,
      homeAway,
      venue,
      competitionName,
      teamScore,
      opponentScore,
      result: ALLOWED_RESULTS.includes(result ?? "") ? result : undefined,
      summaryNotes,
      coachNotes,
      opponentNotes,
    });
    gameId = game.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { errors: { form: message } };
  }

  redirect(`/teams/${teamId}/games/${gameId}`);
}
