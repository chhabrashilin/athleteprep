"use server";

import { revalidatePath } from "next/cache";
import {
  createEventTimestampForGame,
  updateEventTimestampForGame,
  deleteEventTimestampForGame,
} from "@/lib/db/timestamps";
import { getServerUser } from "@/lib/supabase/server";
import { trackTimestampCreated } from "@/lib/analytics/track";
import type { CreateEventTimestampInput, UpdateEventTimestampInput } from "@/lib/db/timestamps";

function timestampsPath(teamId: string, gameId: string) {
  return `/teams/${teamId}/games/${gameId}/timestamps`;
}

function gamePath(teamId: string, gameId: string) {
  return `/teams/${teamId}/games/${gameId}`;
}

export async function createEventTimestampAction(
  input: CreateEventTimestampInput
): Promise<{ error?: string }> {
  try {
    await createEventTimestampForGame(input);
    revalidatePath(timestampsPath(input.teamId, input.gameId));
    revalidatePath(gamePath(input.teamId, input.gameId));
    revalidatePath(`/teams/${input.teamId}/games/${input.gameId}/setup`);
    const user = await getServerUser();
    void trackTimestampCreated(user?.id ?? "", input.teamId, input.gameId);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create event." };
  }
}

export async function updateEventTimestampAction(
  input: UpdateEventTimestampInput
): Promise<{ error?: string }> {
  try {
    await updateEventTimestampForGame(input);
    revalidatePath(timestampsPath(input.teamId, input.gameId));
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update event." };
  }
}

export async function deleteEventTimestampAction(
  teamId: string,
  gameId: string,
  eventId: string
): Promise<{ error?: string }> {
  try {
    await deleteEventTimestampForGame(teamId, gameId, eventId);
    revalidatePath(timestampsPath(teamId, gameId));
    revalidatePath(gamePath(teamId, gameId));
    revalidatePath(`/teams/${teamId}/games/${gameId}/setup`);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete event." };
  }
}
