/**
 * lib/db/share-links.ts — Share link data access.
 *
 * Creation and revocation use the authenticated server client (team-member check).
 * Token lookup uses the service role client since the viewer may not be authenticated.
 * All shared data returned to the browser must be sanitized via lib/sharing/sanitize-report.ts.
 */
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";
import { generateShareToken } from "@/lib/utils/tokens";
import type { ShareLink, CreateShareLinkInput } from "@/types/sharing";
import type { ShareVisibility } from "@/types/core";

const STAFF_ROLES = ["owner", "coach", "analyst"];

// ---------------------------------------------------------------------------
// Row transform
// ---------------------------------------------------------------------------

function rowToShareLink(row: Record<string, unknown>): ShareLink {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    gameId: (row.game_id as string | null) ?? null,
    gameReportId: (row.game_report_id as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    token: row.token as string,
    visibility: row.visibility as ShareVisibility,
    allowedPlayerId: (row.allowed_player_id as string | null) ?? null,
    expiresAt: (row.expires_at as string | null) ?? null,
    revokedAt: (row.revoked_at as string | null) ?? null,
    viewCount: (row.view_count as number) ?? 0,
    lastViewedAt: (row.last_viewed_at as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// Authenticated operations (require staff role)
// ---------------------------------------------------------------------------

export async function createShareLink(input: CreateShareLinkInput): Promise<ShareLink> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Database is not configured.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to create a share link.");

  // Verify staff role
  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", input.teamId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !STAFF_ROLES.includes(membership.role as string)) {
    throw new Error("You do not have permission to create share links.");
  }

  // Validate player-specific has a player
  if (input.visibility === "player_specific" && !input.allowedPlayerId) {
    throw new Error("Player-specific share links require a player to be selected.");
  }

  // Validate expiry date
  if (input.expiresAt && new Date(input.expiresAt) <= new Date()) {
    throw new Error("Expiration date must be in the future.");
  }

  const token = generateShareToken();

  const { data, error } = await supabase
    .from("share_links")
    .insert({
      team_id: input.teamId,
      game_id: input.gameId,
      game_report_id: input.gameReportId,
      created_by: user.id,
      token,
      visibility: input.visibility,
      allowed_player_id: input.allowedPlayerId ?? null,
      expires_at: input.expiresAt ?? null,
      revoked_at: null,
      view_count: 0,
      metadata: {},
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create share link.");
  }

  return rowToShareLink(data as Record<string, unknown>);
}

export async function getShareLinksForReport(
  teamId: string,
  gameReportId: string
): Promise<ShareLink[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("share_links")
    .select("*")
    .eq("team_id", teamId)
    .eq("game_report_id", gameReportId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => rowToShareLink(row as Record<string, unknown>));
}

export async function revokeShareLink(teamId: string, shareLinkId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Database is not configured.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  // Verify staff role
  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !STAFF_ROLES.includes(membership.role as string)) {
    throw new Error("You do not have permission to revoke share links.");
  }

  const { error } = await supabase
    .from("share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", shareLinkId)
    .eq("team_id", teamId);

  if (error) throw new Error(error.message ?? "Failed to revoke share link.");
}

// ---------------------------------------------------------------------------
// Service-role operations (for public shared route — no auth required)
// ---------------------------------------------------------------------------

/**
 * Looks up a share link by token using the service role.
 * Bypasses RLS — only returns the token + link metadata, no report content.
 * Call buildSharedReportViewModel() after this to get sanitized content.
 */
export async function getShareLinkByToken(token: string): Promise<ShareLink | null> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("share_links")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !data) return null;
  return rowToShareLink(data as Record<string, unknown>);
}

/**
 * Increments view_count and sets last_viewed_at for a share link.
 * Best-effort — errors are swallowed so they never break the shared view.
 */
export async function incrementShareLinkView(token: string): Promise<void> {
  try {
    const supabase = createServiceSupabaseClient();
    if (!supabase) return;

    // Attempt RPC-based atomic increment (may not exist in this project)
    try {
      await supabase.rpc("increment_share_link_view", { p_token: token });
    } catch {
      // RPC doesn't exist — fall back to read-then-write below
    }

    // Fallback: fetch current count, then update
    const { data } = await supabase
      .from("share_links")
      .select("view_count")
      .eq("token", token)
      .single();

    if (data) {
      await supabase
        .from("share_links")
        .update({
          view_count: ((data.view_count as number) ?? 0) + 1,
          last_viewed_at: new Date().toISOString(),
        })
        .eq("token", token);
    }
  } catch {
    // Silently ignore — view tracking must never break the shared view
  }
}
