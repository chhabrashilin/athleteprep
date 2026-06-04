"use server";

/**
 * lib/cricket/overlays/actions.ts
 * Server actions for overlay theme management and token lifecycle.
 */

import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import { overlayThemeSchema, overlayTokenCreateSchema } from "@/lib/cricket/validation/overlays";
import { generateOverlayToken, hashOverlayToken, getTokenPrefix } from "./tokens";
import { userCanManageMatchBroadcast } from "@/lib/cricket/streaming/queries";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

// ─── createOverlayTheme ───────────────────────────────────────────────────────

export async function createOverlayTheme(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = overlayThemeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const d = parsed.data;
  const { data, error } = await supabase
    .from("cricket_overlay_themes")
    .insert({
      league_id:        d.league_id,
      team_id:          d.team_id ?? null,
      name:             d.name,
      slug:             d.slug,
      layout:           d.layout,
      primary_color:    d.primary_color || null,
      secondary_color:  d.secondary_color || null,
      accent_color:     d.accent_color || null,
      text_color:       d.text_color || null,
      background_color: d.background_color || null,
      logo_url:         d.logo_url || null,
      sponsor_logo_url: d.sponsor_logo_url || null,
      sponsor_text:     d.sponsor_text || null,
      font_family:      d.font_family || null,
      safe_area_top:    d.safe_area_top ?? 24,
      safe_area_bottom: d.safe_area_bottom ?? 24,
      safe_area_left:   d.safe_area_left ?? 24,
      safe_area_right:  d.safe_area_right ?? 24,
      is_default:       d.is_default ?? false,
      created_by:       user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { success: false, error: error?.message ?? "Insert failed" };
  return { success: true, data: { id: data.id } };
}

// ─── updateOverlayTheme ───────────────────────────────────────────────────────

export async function updateOverlayTheme(themeId: string, input: unknown): Promise<ActionResult> {
  const parsed = overlayThemeSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const d = parsed.data;
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (d.name !== undefined) update.name = d.name;
  if (d.slug !== undefined) update.slug = d.slug;
  if (d.layout !== undefined) update.layout = d.layout;
  if (d.primary_color !== undefined) update.primary_color = d.primary_color || null;
  if (d.secondary_color !== undefined) update.secondary_color = d.secondary_color || null;
  if (d.accent_color !== undefined) update.accent_color = d.accent_color || null;
  if (d.text_color !== undefined) update.text_color = d.text_color || null;
  if (d.background_color !== undefined) update.background_color = d.background_color || null;
  if (d.logo_url !== undefined) update.logo_url = d.logo_url || null;
  if (d.sponsor_logo_url !== undefined) update.sponsor_logo_url = d.sponsor_logo_url || null;
  if (d.sponsor_text !== undefined) update.sponsor_text = d.sponsor_text || null;
  if (d.font_family !== undefined) update.font_family = d.font_family || null;
  if (d.safe_area_top !== undefined) update.safe_area_top = d.safe_area_top;
  if (d.safe_area_bottom !== undefined) update.safe_area_bottom = d.safe_area_bottom;
  if (d.safe_area_left !== undefined) update.safe_area_left = d.safe_area_left;
  if (d.safe_area_right !== undefined) update.safe_area_right = d.safe_area_right;
  if (d.is_default !== undefined) update.is_default = d.is_default;

  const { error } = await supabase
    .from("cricket_overlay_themes")
    .update(update)
    .eq("id", themeId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── setDefaultOverlayTheme ───────────────────────────────────────────────────

export async function setDefaultOverlayTheme(leagueId: string, themeId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  // Clear existing defaults for league.
  await supabase
    .from("cricket_overlay_themes")
    .update({ is_default: false })
    .eq("league_id", leagueId)
    .eq("is_default", true);

  const { error } = await supabase
    .from("cricket_overlay_themes")
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq("id", themeId)
    .eq("league_id", leagueId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── createOverlayToken ───────────────────────────────────────────────────────

export async function createOverlayToken(
  input: unknown
): Promise<ActionResult<{ id: string; rawToken: string; overlayUrls: Record<string, string> }>> {
  const parsed = overlayTokenCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const auth = await requireBroadcastManagerForMatch(parsed.data.match_id);
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const rawToken = generateOverlayToken();
  const tokenHash = hashOverlayToken(rawToken);
  const tokenPrefix = getTokenPrefix(rawToken);

  const d = parsed.data;
  const { data, error } = await supabase
    .from("cricket_overlay_tokens")
    .insert({
      match_id:    d.match_id,
      league_id:   d.league_id ?? null,
      token_hash:  tokenHash,
      token_prefix: tokenPrefix,
      label:       d.label ?? null,
      scope:       d.scope,
      expires_at:  d.expires_at ?? null,
      created_by:  auth.userId,
    })
    .select("id")
    .single();

  if (error || !data) return { success: false, error: error?.message ?? "Insert failed" };

  // Build overlay URLs for all types.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const matchRef = d.match_id;
  const overlayTypes = ["scorebug", "full-scorecard", "lower-third", "toss", "innings-break", "result", "minimal"] as const;
  const overlayUrls: Record<string, string> = {};
  for (const t of overlayTypes) {
    overlayUrls[t] = `${baseUrl}/cricket/overlays/${encodeURIComponent(matchRef)}/${t}?token=${encodeURIComponent(rawToken)}`;
  }

  // Log event.
  await supabase.from("cricket_stream_events").insert({
    match_id:      d.match_id,
    league_id:     d.league_id ?? null,
    actor_user_id: auth.userId,
    event_type:    "overlay.token_created",
    event_payload: { token_prefix: tokenPrefix, scope: d.scope },
    created_at:    new Date().toISOString(),
  });

  return { success: true, data: { id: data.id, rawToken, overlayUrls } };
}

// ─── revokeOverlayToken ───────────────────────────────────────────────────────

export async function revokeOverlayToken(tokenId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: token } = await supabase
    .from("cricket_overlay_tokens")
    .select("match_id, league_id, token_prefix")
    .eq("id", tokenId)
    .maybeSingle();

  if (!token) return { success: false, error: "Token not found" };

  const auth = await requireBroadcastManagerForMatch(token.match_id);
  if ("error" in auth) return { success: false, error: auth.error };

  const { error } = await supabase
    .from("cricket_overlay_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", tokenId);

  if (error) return { success: false, error: error.message };

  await supabase.from("cricket_stream_events").insert({
    match_id:      token.match_id,
    league_id:     token.league_id ?? null,
    actor_user_id: auth.userId,
    event_type:    "overlay.token_revoked",
    event_payload: { token_prefix: token.token_prefix },
    created_at:    new Date().toISOString(),
  });

  return { success: true };
}

// ─── requireBroadcastManagerForMatch (internal) ───────────────────────────────

async function requireBroadcastManagerForMatch(
  matchId: string
): Promise<{ userId: string } | { error: string }> {
  const user = await getServerUser();
  if (!user) return { error: "Not authenticated" };

  const canManage = await userCanManageMatchBroadcast(user.id, matchId);
  if (!canManage) return { error: "You do not have permission to manage this broadcast" };

  return { userId: user.id };
}
