"use server";

/**
 * lib/cricket/moderation/actions.ts
 * Server actions for community moderation: reports, content decisions.
 * Every mutation persists a moderation action log.
 */

import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import {
  createReportSchema,
  moderationActionSchema,
} from "@/lib/cricket/validation/moderation";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

async function requireModerator(
  leagueId: string | null | undefined
): Promise<{ userId: string } | { error: string }> {
  const user = await getServerUser();
  if (!user) return { error: "Not authenticated" };

  if (!leagueId) return { userId: user.id };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Database unavailable" };

  const { data: canMod } = await supabase.rpc("user_can_moderate_cricket_league", {
    p_league_id: leagueId,
    p_user_id: user.id,
  });

  if (!canMod) return { error: "Not authorized" };
  return { userId: user.id };
}

async function logModerationAction(
  moderatorId: string,
  targetType: string,
  targetId: string,
  action: string,
  leagueId: string | null,
  reason?: string | null,
  notes?: string | null
) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  await supabase.from("cricket_moderation_actions").insert({
    league_id: leagueId,
    moderator_user_id: moderatorId,
    target_type: targetType,
    target_id: targetId,
    action,
    reason: reason ?? null,
    notes: notes ?? null,
  });
}

// ─── Report ───────────────────────────────────────────────────────────────────

export async function reportCricketContent(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = createReportSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data, error } = await supabase
    .from("cricket_reports")
    .insert({
      reporter_user_id: user.id,
      target_type: parsed.data.target_type,
      target_id: parsed.data.target_id,
      league_id: parsed.data.league_id ?? null,
      reason: parsed.data.reason,
      details: parsed.data.details ?? null,
      status: "open",
    })
    .select("id")
    .single();

  if (error) return { success: false, error: "Failed to submit report" };
  return { success: true, data: { id: data.id as string } };
}

export async function resolveCricketReport(
  reportId: string,
  resolutionNotes?: string | null
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: report } = await supabase
    .from("cricket_reports")
    .select("league_id")
    .eq("id", reportId)
    .maybeSingle();

  if (!report) return { success: false, error: "Report not found" };

  const auth = await requireModerator(report.league_id as string | null);
  if ("error" in auth) return { success: false, error: auth.error };

  const { error } = await supabase
    .from("cricket_reports")
    .update({
      status: "resolved",
      resolved_by: auth.userId,
      resolved_at: new Date().toISOString(),
      resolution_notes: resolutionNotes ?? null,
    })
    .eq("id", reportId);

  if (error) return { success: false, error: "Failed to resolve report" };

  await logModerationAction(
    auth.userId,
    "post",
    reportId,
    "resolve_report",
    (report.league_id as string | null) ?? null
  );

  return { success: true };
}

export async function dismissCricketReport(
  reportId: string,
  reason?: string | null
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: report } = await supabase
    .from("cricket_reports")
    .select("league_id")
    .eq("id", reportId)
    .maybeSingle();

  if (!report) return { success: false, error: "Report not found" };

  const auth = await requireModerator(report.league_id as string | null);
  if ("error" in auth) return { success: false, error: auth.error };

  const { error } = await supabase
    .from("cricket_reports")
    .update({
      status: "dismissed",
      resolved_by: auth.userId,
      resolved_at: new Date().toISOString(),
      resolution_notes: reason ?? null,
    })
    .eq("id", reportId);

  if (error) return { success: false, error: "Failed to dismiss report" };

  await logModerationAction(
    auth.userId,
    "post",
    reportId,
    "dismiss_report",
    (report.league_id as string | null) ?? null,
    reason
  );

  return { success: true };
}

// ─── Content moderation ───────────────────────────────────────────────────────

export async function moderateCricketContent(input: unknown): Promise<ActionResult> {
  const parsed = moderationActionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const auth = await requireModerator(parsed.data.league_id ?? null);
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const d = parsed.data;
  let updateError: unknown = null;

  if (d.target_type === "post") {
    const statusMap: Record<string, string> = {
      approve: "approved",
      reject: "rejected",
      hide: "rejected",
      unhide: "approved",
      remove: "removed",
      restore: "approved",
    };
    const newStatus = statusMap[d.action];
    if (newStatus) {
      const { error } = await supabase
        .from("cricket_posts")
        .update({ moderation_status: newStatus, pinned: d.action === "pin" ? true : d.action === "unpin" ? false : undefined })
        .eq("id", d.target_id);
      updateError = error;
    }
    if (d.action === "pin" || d.action === "unpin") {
      const { error } = await supabase
        .from("cricket_posts")
        .update({ pinned: d.action === "pin" })
        .eq("id", d.target_id);
      updateError = error;
    }
  } else if (d.target_type === "comment") {
    const statusMap: Record<string, string> = {
      approve: "approved",
      reject: "rejected",
      hide: "rejected",
      unhide: "approved",
      remove: "removed",
      restore: "approved",
    };
    const newStatus = statusMap[d.action];
    if (newStatus) {
      const { error } = await supabase
        .from("cricket_comments")
        .update({ moderation_status: newStatus })
        .eq("id", d.target_id);
      updateError = error;
    }
  } else if (d.target_type === "thread_message") {
    const statusMap: Record<string, string> = {
      approve: "approved",
      reject: "rejected",
      hide: "rejected",
      unhide: "approved",
      remove: "removed",
      restore: "approved",
    };
    const newStatus = statusMap[d.action];
    if (newStatus) {
      const { error } = await supabase
        .from("cricket_match_thread_messages")
        .update({ moderation_status: newStatus })
        .eq("id", d.target_id);
      updateError = error;
    }
  } else if (d.target_type === "thread") {
    if (d.action === "lock_thread") {
      const { error } = await supabase
        .from("cricket_match_threads")
        .update({ status: "locked" })
        .eq("id", d.target_id);
      updateError = error;
    } else if (d.action === "unlock_thread") {
      const { error } = await supabase
        .from("cricket_match_threads")
        .update({ status: "open" })
        .eq("id", d.target_id);
      updateError = error;
    }
  }

  if (updateError) return { success: false, error: "Failed to apply moderation action" };

  await logModerationAction(
    auth.userId,
    d.target_type,
    d.target_id,
    d.action,
    d.league_id ?? null,
    d.reason,
    d.notes
  );

  return { success: true };
}

export async function approveCricketPost(postId: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };
  const { data: post } = await supabase
    .from("cricket_posts")
    .select("league_id")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { success: false, error: "Post not found" };
  return moderateCricketContent({
    league_id: post.league_id,
    target_type: "post",
    target_id: postId,
    action: "approve",
  });
}

export async function rejectCricketPost(postId: string, reason?: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };
  const { data: post } = await supabase
    .from("cricket_posts")
    .select("league_id")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { success: false, error: "Post not found" };
  return moderateCricketContent({
    league_id: post.league_id,
    target_type: "post",
    target_id: postId,
    action: "reject",
    reason,
  });
}

export async function hideCricketContent(
  targetType: string,
  targetId: string,
  reason?: string
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  let leagueId: string | null = null;
  if (targetType === "post") {
    const { data } = await supabase.from("cricket_posts").select("league_id").eq("id", targetId).maybeSingle();
    leagueId = (data?.league_id as string | null) ?? null;
  }

  return moderateCricketContent({
    league_id: leagueId,
    target_type: targetType as "post" | "comment" | "thread_message" | "poll" | "thread",
    target_id: targetId,
    action: "hide",
    reason,
  });
}

export async function restoreCricketContent(
  targetType: string,
  targetId: string,
  reason?: string
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  let leagueId: string | null = null;
  if (targetType === "post") {
    const { data } = await supabase.from("cricket_posts").select("league_id").eq("id", targetId).maybeSingle();
    leagueId = (data?.league_id as string | null) ?? null;
  }

  return moderateCricketContent({
    league_id: leagueId,
    target_type: targetType as "post" | "comment" | "thread_message" | "poll" | "thread",
    target_id: targetId,
    action: "restore",
    reason,
  });
}
