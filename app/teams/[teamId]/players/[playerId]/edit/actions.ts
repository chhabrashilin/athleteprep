"use server";

import { redirect } from "next/navigation";
import {
  updatePlayerForTeam,
  archivePlayerForTeam,
  deletePlayerForTeam,
} from "@/lib/db/players";
import type { PlayerStatus } from "@/types/database";
import type { PlayerFormState } from "@/app/teams/[teamId]/players/new/actions";

const ALLOWED_STATUSES: PlayerStatus[] = [
  "active",
  "inactive",
  "injured",
  "graduated",
  "archived",
];

export async function updatePlayerAction(
  _prevState: PlayerFormState,
  formData: FormData
): Promise<PlayerFormState> {
  const teamId = (formData.get("teamId") as string | null) ?? "";
  const playerId = (formData.get("playerId") as string | null) ?? "";
  const firstName =
    (formData.get("firstName") as string | null)?.trim() ?? "";
  const lastName =
    (formData.get("lastName") as string | null)?.trim() || undefined;
  const displayName =
    (formData.get("displayName") as string | null)?.trim() || undefined;
  const jerseyNumber =
    (formData.get("jerseyNumber") as string | null)?.trim() || undefined;
  const position =
    (formData.get("position") as string | null)?.trim() || undefined;
  const role = (formData.get("role") as string | null)?.trim() || undefined;
  const dominantSide =
    (formData.get("dominantSide") as string | null)?.trim() || undefined;
  const classYear =
    (formData.get("classYear") as string | null)?.trim() || undefined;
  const height =
    (formData.get("height") as string | null)?.trim() || undefined;
  const weight =
    (formData.get("weight") as string | null)?.trim() || undefined;
  const rawStatus = (formData.get("status") as string | null)?.trim();
  const status: PlayerStatus | undefined = ALLOWED_STATUSES.includes(
    rawStatus as PlayerStatus
  )
    ? (rawStatus as PlayerStatus)
    : undefined;
  const notes = (formData.get("notes") as string | null)?.trim() || undefined;

  if (!teamId || !playerId)
    return { errors: { form: "Invalid request." } };

  const errors: PlayerFormState["errors"] = {};

  if (!firstName) {
    errors.firstName = "First name is required.";
  } else if (firstName.length > 60) {
    errors.firstName = "First name must be 60 characters or fewer.";
  }

  if (lastName && lastName.length > 60) {
    errors.lastName = "Last name must be 60 characters or fewer.";
  }

  if (displayName && displayName.length > 100) {
    errors.displayName = "Display name must be 100 characters or fewer.";
  }

  if (jerseyNumber && jerseyNumber.length > 10) {
    errors.jerseyNumber = "Jersey number must be 10 characters or fewer.";
  }

  if (position && position.length > 60) {
    errors.position = "Position must be 60 characters or fewer.";
  }

  if (role && role.length > 80) {
    errors.role = "Role must be 80 characters or fewer.";
  }

  if (notes && notes.length > 1000) {
    errors.notes = "Notes must be 1000 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) return { errors };

  try {
    await updatePlayerForTeam({
      playerId,
      teamId,
      firstName,
      lastName,
      displayName,
      jerseyNumber,
      position,
      role,
      dominantSide,
      classYear,
      height,
      weight,
      status,
      notes,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return { errors: { form: message } };
  }

  redirect(`/teams/${teamId}/players`);
}

export async function archivePlayerAction(formData: FormData): Promise<void> {
  const teamId = (formData.get("teamId") as string | null) ?? "";
  const playerId = (formData.get("playerId") as string | null) ?? "";
  if (!teamId || !playerId) return;

  try {
    await archivePlayerForTeam(teamId, playerId);
  } catch (err) {
    console.error("archivePlayerAction error:", err);
    throw err;
  }

  redirect(`/teams/${teamId}/players`);
}

export async function deletePlayerAction(formData: FormData): Promise<void> {
  const teamId = (formData.get("teamId") as string | null) ?? "";
  const playerId = (formData.get("playerId") as string | null) ?? "";
  if (!teamId || !playerId) return;

  try {
    await deletePlayerForTeam(teamId, playerId);
  } catch (err) {
    console.error("deletePlayerAction error:", err);
    throw err;
  }

  redirect(`/teams/${teamId}/players`);
}
