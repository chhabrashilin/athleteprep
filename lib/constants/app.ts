export const APP_NAME = "GameIQ";
export const APP_TAGLINE = "AI game review in 10 minutes.";
export const APP_DESCRIPTION =
  "GameIQ turns game film into coach-ready insights, player feedback, evidence-linked clips, and next-practice plans.";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const CONFIDENCE_DESCRIPTIONS = {
  high: "Directly supported by multiple timestamps, notes, or structured inputs.",
  medium: "Supported but requires interpretation or has limited evidence.",
  low: "Plausible inference from limited data or indirect signals.",
} as const;

export const VERIFICATION_STATUS_LABELS = {
  unreviewed: "Unreviewed",
  accurate: "Accurate",
  partially_accurate: "Partially Accurate",
  inaccurate: "Inaccurate",
  edited: "Edited",
} as const;

export const JOB_STATUS_LABELS = {
  pending: "Pending",
  running: "Analyzing...",
  completed: "Complete",
  failed: "Failed",
} as const;

export const MAX_VIDEO_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
export const MAX_INSIGHTS_PER_REPORT = 5;
