"use server";

import { createAccessRequest } from "@/lib/db/feedback";
import { trackRequestAccessSubmitted } from "@/lib/analytics/track";

const ALLOWED_ROLES = [
  "Head Coach",
  "Assistant Coach",
  "Analyst",
  "Player",
  "Team Captain",
  "Program Director",
  "Scout",
  "Investor/Advisor",
  "Other",
];

const ALLOWED_SPORTS = [
  "Cricket",
  "Soccer",
  "Basketball",
  "American Football",
  "Hockey",
  "Volleyball",
  "Other",
];

const ALLOWED_LEVELS = [
  "Youth",
  "High School",
  "College",
  "Club",
  "Academy",
  "Semi-Pro",
  "Professional",
  "Other",
];

export interface RequestAccessFormState {
  success?: boolean;
  errors?: {
    name?: string;
    email?: string;
    role?: string;
    form?: string;
  };
}

export async function requestAccessAction(
  _prevState: RequestAccessFormState,
  formData: FormData
): Promise<RequestAccessFormState> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const role = (formData.get("role") as string | null)?.trim() ?? "";
  const teamOrOrg = (formData.get("teamOrOrg") as string | null)?.trim() || undefined;
  const sport = (formData.get("sport") as string | null)?.trim() || undefined;
  const level = (formData.get("level") as string | null)?.trim() || undefined;
  const painPoint = (formData.get("painPoint") as string | null)?.trim() || undefined;
  const filmReviewFrequency = (formData.get("filmReviewFrequency") as string | null)?.trim() || undefined;
  const currentTools = (formData.get("currentTools") as string | null)?.trim() || undefined;
  const message = (formData.get("message") as string | null)?.trim() || undefined;

  const errors: RequestAccessFormState["errors"] = {};

  if (!name) {
    errors.name = "Name is required.";
  } else if (name.length > 120) {
    errors.name = "Name must be 120 characters or fewer.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!role) {
    errors.role = "Please select your role.";
  } else if (!ALLOWED_ROLES.includes(role)) {
    errors.role = "Please select a valid role.";
  }

  if (sport && !ALLOWED_SPORTS.includes(sport)) {
    return { errors: { form: "Invalid sport selection." } };
  }
  if (level && !ALLOWED_LEVELS.includes(level)) {
    return { errors: { form: "Invalid level selection." } };
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    await createAccessRequest({
      name,
      email,
      role,
      teamOrOrg,
      sport,
      level,
      painPoint,
      filmReviewFrequency,
      currentTools,
      message,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { errors: { form: message } };
  }

  void trackRequestAccessSubmitted({
    role,
    sport,
    hasPainPoint: Boolean(painPoint),
  });

  return { success: true };
}
