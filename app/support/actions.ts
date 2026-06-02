"use server";

import { createSupportRequest } from "@/lib/db/support";
import { getServerUser } from "@/lib/supabase/server";
import type { SupportIssueType, SupportUrgency } from "@/types/support";

const VALID_ISSUE_TYPES: SupportIssueType[] = [
  "account_login",
  "team_workspace",
  "video_upload",
  "ai_report",
  "share_export",
  "data_deletion",
  "privacy_concern",
  "bug_report",
  "product_feedback",
  "other",
];

const VALID_URGENCIES: SupportUrgency[] = ["low", "normal", "high"];

export interface SupportFormState {
  success?: boolean;
  errors?: {
    name?: string;
    email?: string;
    issueType?: string;
    message?: string;
    form?: string;
  };
}

export async function submitSupportRequestAction(
  _prevState: SupportFormState,
  formData: FormData
): Promise<SupportFormState> {
  const user = await getServerUser();

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const issueTypeRaw = (formData.get("issueType") as string | null)?.trim() ?? "";
  const teamName = (formData.get("teamName") as string | null)?.trim() || undefined;
  const relatedUrl = (formData.get("relatedUrl") as string | null)?.trim() || undefined;
  const urgencyRaw = (formData.get("urgency") as string | null)?.trim() || undefined;
  const message = (formData.get("message") as string | null)?.trim() ?? "";
  const consentRaw = formData.get("consentToContact");
  const consentToContact = consentRaw === "true" || consentRaw === "on";

  const errors: SupportFormState["errors"] = {};

  if (!name) errors.name = "Name is required.";
  else if (name.length > 200) errors.name = "Name must be 200 characters or fewer.";

  if (!email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!issueTypeRaw || !VALID_ISSUE_TYPES.includes(issueTypeRaw as SupportIssueType)) {
    errors.issueType = "Please select an issue type.";
  }

  if (!message) errors.message = "Please describe your issue.";
  else if (message.length > 5000) errors.message = "Message must be 5000 characters or fewer.";

  if (urgencyRaw && !VALID_URGENCIES.includes(urgencyRaw as SupportUrgency)) {
    return { errors: { form: "Invalid urgency selection." } };
  }

  if (relatedUrl && relatedUrl.length > 1000) {
    return { errors: { form: "Related URL is too long." } };
  }

  if (Object.keys(errors).length > 0) return { errors };

  try {
    await createSupportRequest({
      userId: user?.id,
      name,
      email,
      issueType: issueTypeRaw as SupportIssueType,
      teamName,
      relatedUrl,
      urgency: urgencyRaw as SupportUrgency | undefined,
      message,
      consentToContact,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { errors: { form: msg } };
  }

  return { success: true };
}
