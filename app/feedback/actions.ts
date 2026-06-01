"use server";

import { createProductFeedback } from "@/lib/db/feedback";
import { getServerUser } from "@/lib/supabase/server";
import { trackFeedbackSubmitted } from "@/lib/analytics/track";

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

const ALLOWED_WTP = [
  "Not sure yet",
  "$10–$25/month per team",
  "$25–$75/month per team",
  "$75–$200/month per team",
  "$200+/month per team",
  "Enterprise/program pricing only",
];

export interface ProductFeedbackFormState {
  success?: boolean;
  errors?: {
    role?: string;
    usefulnessRating?: string;
    mostValuable?: string;
    mustHaveFeature?: string;
    form?: string;
  };
}

export async function submitProductFeedbackAction(
  _prevState: ProductFeedbackFormState,
  formData: FormData
): Promise<ProductFeedbackFormState> {
  const user = await getServerUser();

  const name = (formData.get("name") as string | null)?.trim() || undefined;
  const email = (formData.get("email") as string | null)?.trim() || undefined;
  const role = (formData.get("role") as string | null)?.trim() || undefined;
  const teamOrOrg = (formData.get("teamOrOrg") as string | null)?.trim() || undefined;
  const sport = (formData.get("sport") as string | null)?.trim() || undefined;
  const usefulnessRatingRaw = (formData.get("usefulnessRating") as string | null)?.trim() ?? "";
  const mostValuable = (formData.get("mostValuable") as string | null)?.trim() || undefined;
  const mostConfusing = (formData.get("mostConfusing") as string | null)?.trim() || undefined;
  const mustHaveFeature = (formData.get("mustHaveFeature") as string | null)?.trim() || undefined;
  const wouldUseAfterGames = (formData.get("wouldUseAfterGames") as string | null)?.trim() || undefined;
  const currentTools = (formData.get("currentTools") as string | null)?.trim() || undefined;
  const willingnessToPay = (formData.get("willingnessToPay") as string | null)?.trim() || undefined;
  const additionalNotes = (formData.get("additionalNotes") as string | null)?.trim() || undefined;

  const errors: ProductFeedbackFormState["errors"] = {};

  if (!usefulnessRatingRaw) {
    errors.usefulnessRating = "Please rate overall usefulness.";
  }
  const usefulnessRating = parseInt(usefulnessRatingRaw, 10);
  if (isNaN(usefulnessRating) || usefulnessRating < 1 || usefulnessRating > 5) {
    errors.usefulnessRating = "Rating must be between 1 and 5.";
  }

  if (!mostValuable) {
    errors.mostValuable = "Please tell us what felt most valuable.";
  }

  if (!mustHaveFeature) {
    errors.mustHaveFeature = "Please share which feature would make this worth paying for.";
  }

  if (role && !ALLOWED_ROLES.includes(role)) {
    errors.role = "Please select a valid role.";
  }
  if (sport && !ALLOWED_SPORTS.includes(sport)) {
    return { errors: { form: "Invalid sport selection." } };
  }
  if (willingnessToPay && !ALLOWED_WTP.includes(willingnessToPay)) {
    return { errors: { form: "Invalid willingness-to-pay selection." } };
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    await createProductFeedback({
      userId: user?.id,
      name,
      email,
      role,
      teamOrOrg,
      sport,
      usefulnessRating,
      mostValuable,
      mostConfusing,
      mustHaveFeature,
      wouldUseAfterGames,
      currentTools,
      willingnessToPay,
      additionalNotes,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { errors: { form: msg } };
  }

  void trackFeedbackSubmitted(user?.id, {
    role,
    sport,
    usefulnessRating,
    hasWtp: Boolean(willingnessToPay),
  });

  return { success: true };
}
