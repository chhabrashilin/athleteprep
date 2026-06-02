export type SupportIssueType =
  | "account_login"
  | "team_workspace"
  | "video_upload"
  | "ai_report"
  | "share_export"
  | "data_deletion"
  | "privacy_concern"
  | "bug_report"
  | "product_feedback"
  | "other";

export type SupportUrgency = "low" | "normal" | "high";

export type SupportStatus = "open" | "in_review" | "resolved" | "closed";

export interface CreateSupportRequestInput {
  userId?: string;
  name: string;
  email: string;
  issueType: SupportIssueType;
  teamName?: string;
  relatedUrl?: string;
  urgency?: SupportUrgency;
  message: string;
  consentToContact: boolean;
}

export interface SupportRequestRow {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  issue_type: SupportIssueType;
  team_name: string | null;
  related_url: string | null;
  urgency: SupportUrgency | null;
  message: string;
  consent_to_contact: boolean;
  status: SupportStatus;
  admin_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UpdateSupportRequestInput {
  id: string;
  status: SupportStatus;
  adminNotes?: string;
}

export const ISSUE_TYPE_LABELS: Record<SupportIssueType, string> = {
  account_login: "Account / Login issue",
  team_workspace: "Team workspace issue",
  video_upload: "Video upload issue",
  ai_report: "AI report issue",
  share_export: "Share / Export issue",
  data_deletion: "Data deletion request",
  privacy_concern: "Privacy concern",
  bug_report: "Bug report",
  product_feedback: "Product feedback",
  other: "Other",
};

export const URGENCY_LABELS: Record<SupportUrgency, string> = {
  low: "Low — not blocking me",
  normal: "Normal — would like help soon",
  high: "High — blocking my work",
};

export const STATUS_LABELS: Record<SupportStatus, string> = {
  open: "Open",
  in_review: "In review",
  resolved: "Resolved",
  closed: "Closed",
};

export const STATUS_COLORS: Record<SupportStatus, string> = {
  open: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  in_review: "text-sky-400 border-sky-500/40 bg-sky-500/10",
  resolved: "text-green-400 border-green-500/40 bg-green-500/10",
  closed: "text-slate-400 border-slate-700 bg-slate-800/40",
};

export const URGENCY_COLORS: Record<SupportUrgency, string> = {
  low: "text-slate-400",
  normal: "text-amber-400",
  high: "text-red-400",
};
