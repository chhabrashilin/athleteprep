"use server";

import { redirect } from "next/navigation";
import { createTeamForCurrentUser } from "@/lib/db/teams";
import { getServerUser } from "@/lib/supabase/server";
import { trackTeamCreated } from "@/lib/analytics/track";
import type { SportType } from "@/types/sports";

const ALLOWED_SPORTS: SportType[] = [
  "soccer",
  "cricket",
  "basketball",
  "american_football",
  "hockey",
  "volleyball",
  "other",
];

export interface CreateTeamFormState {
  errors?: {
    name?: string;
    sport?: string;
    organizationName?: string;
    level?: string;
    location?: string;
    description?: string;
    form?: string;
  };
}

export async function createTeamAction(
  _prevState: CreateTeamFormState,
  formData: FormData
): Promise<CreateTeamFormState> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const sport = (formData.get("sport") as string | null)?.trim() ?? "";
  const organizationName =
    (formData.get("organizationName") as string | null)?.trim() || undefined;
  const level =
    (formData.get("level") as string | null)?.trim() || undefined;
  const location =
    (formData.get("location") as string | null)?.trim() || undefined;
  const description =
    (formData.get("description") as string | null)?.trim() || undefined;

  // --- Validation ---
  const errors: CreateTeamFormState["errors"] = {};

  if (!name) {
    errors.name = "Team name is required.";
  } else if (name.length < 2) {
    errors.name = "Team name must be at least 2 characters.";
  } else if (name.length > 80) {
    errors.name = "Team name must be 80 characters or fewer.";
  }

  if (!sport) {
    errors.sport = "Please select a sport.";
  } else if (!ALLOWED_SPORTS.includes(sport as SportType)) {
    errors.sport = "Please select a valid sport.";
  }

  if (organizationName && organizationName.length > 120) {
    errors.organizationName =
      "Organization name must be 120 characters or fewer.";
  }

  if (level && level.length > 60) {
    errors.level = "Level must be 60 characters or fewer.";
  }

  if (location && location.length > 120) {
    errors.location = "Location must be 120 characters or fewer.";
  }

  if (description && description.length > 500) {
    errors.description = "Description must be 500 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // --- Create team ---
  const user = await getServerUser();
  let teamId: string;
  try {
    teamId = await createTeamForCurrentUser({
      name,
      sport: sport as SportType,
      organizationName,
      level,
      location,
      description,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return { errors: { form: message } };
  }

  void trackTeamCreated(user?.id ?? "", teamId, { sport });

  redirect(`/teams/${teamId}`);
}
