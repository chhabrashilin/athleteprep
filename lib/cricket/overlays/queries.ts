/**
 * lib/cricket/overlays/queries.ts
 * Server-side queries for overlay themes, tokens, and overlay data access.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CricketOverlayTheme, CricketOverlayToken, OverlayLayout, OverlayScope } from "@/lib/cricket/types";
import { verifyOverlayToken } from "./tokens";

// ─── Row mappers ──────────────────────────────────────────────────────────────

function toTheme(row: Record<string, unknown>): CricketOverlayTheme {
  return {
    id: row.id as string,
    leagueId: (row.league_id as string | null) ?? null,
    teamId: (row.team_id as string | null) ?? null,
    name: row.name as string,
    slug: row.slug as string,
    layout: (row.layout as OverlayLayout) ?? "classic_scorebug",
    primaryColor: (row.primary_color as string | null) ?? null,
    secondaryColor: (row.secondary_color as string | null) ?? null,
    accentColor: (row.accent_color as string | null) ?? null,
    textColor: (row.text_color as string | null) ?? null,
    backgroundColor: (row.background_color as string | null) ?? null,
    logoUrl: (row.logo_url as string | null) ?? null,
    sponsorLogoUrl: (row.sponsor_logo_url as string | null) ?? null,
    sponsorText: (row.sponsor_text as string | null) ?? null,
    fontFamily: (row.font_family as string | null) ?? null,
    safeAreaTop: (row.safe_area_top as number) ?? 24,
    safeAreaBottom: (row.safe_area_bottom as number) ?? 24,
    safeAreaLeft: (row.safe_area_left as number) ?? 24,
    safeAreaRight: (row.safe_area_right as number) ?? 24,
    isDefault: (row.is_default as boolean) ?? false,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toToken(row: Record<string, unknown>): CricketOverlayToken {
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    leagueId: (row.league_id as string | null) ?? null,
    tokenPrefix: row.token_prefix as string,
    label: (row.label as string | null) ?? null,
    scope: (row.scope as OverlayScope) ?? "match_overlay",
    expiresAt: (row.expires_at as string | null) ?? null,
    revokedAt: (row.revoked_at as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    lastUsedAt: (row.last_used_at as string | null) ?? null,
  };
}

// ─── getOverlayThemesForLeague ────────────────────────────────────────────────

export async function getOverlayThemesForLeague(leagueId: string): Promise<CricketOverlayTheme[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_overlay_themes")
    .select("*")
    .eq("league_id", leagueId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => toTheme(r as Record<string, unknown>));
}

// ─── getMatchOverlayTokens ────────────────────────────────────────────────────

export async function getMatchOverlayTokens(matchId: string): Promise<CricketOverlayToken[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_overlay_tokens")
    .select("id, match_id, league_id, token_prefix, label, scope, expires_at, revoked_at, created_by, created_at, last_used_at")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => toToken(r as Record<string, unknown>));
}

// ─── validateOverlayToken ─────────────────────────────────────────────────────

export interface TokenValidationResult {
  valid: boolean;
  reason?: "not_found" | "expired" | "revoked" | "invalid";
  tokenId?: string;
  matchId?: string;
  leagueId?: string | null;
  scope?: string;
}

export async function validateOverlayToken(
  rawToken: string,
  matchId: string
): Promise<TokenValidationResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { valid: false, reason: "not_found" };

  // Fetch all active tokens for this match (small set).
  const { data: rows } = await supabase
    .from("cricket_overlay_tokens")
    .select("id, match_id, league_id, token_hash, scope, expires_at, revoked_at")
    .eq("match_id", matchId)
    .is("revoked_at", null);

  if (!rows || rows.length === 0) return { valid: false, reason: "not_found" };

  for (const row of rows) {
    const r = row as Record<string, unknown>;
    if (verifyOverlayToken(rawToken, r.token_hash as string)) {
      if (r.revoked_at) return { valid: false, reason: "revoked" };
      if (r.expires_at && new Date(r.expires_at as string) < new Date()) {
        return { valid: false, reason: "expired" };
      }
      // Update last_used_at (non-blocking).
      supabase
        .from("cricket_overlay_tokens")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", r.id as string)
        .then(() => {});

      return {
        valid: true,
        tokenId: r.id as string,
        matchId: r.match_id as string,
        leagueId: (r.league_id as string | null) ?? null,
        scope: r.scope as string,
      };
    }
  }

  return { valid: false, reason: "invalid" };
}

// ─── getOverlayPreviewData (manager only) ─────────────────────────────────────

export async function getOverlayPreviewData(matchId: string, _userId: string): Promise<{
  match: Record<string, unknown> | null;
  liveState: Record<string, unknown> | null;
  stream: Record<string, unknown> | null;
}> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { match: null, liveState: null, stream: null };

  const [matchResult, liveResult, streamResult] = await Promise.all([
    supabase
      .from("cricket_matches")
      .select("id, title, slug, status, match_type, toss_won_by_team_id, toss_decision, league_id, home_team_id, away_team_id, broadcast_status, overlay_enabled")
      .eq("id", matchId)
      .maybeSingle(),
    supabase
      .from("cricket_live_match_state")
      .select("*")
      .eq("match_id", matchId)
      .maybeSingle(),
    supabase
      .from("cricket_match_streams")
      .select("id, status, provider, visibility, embed_url, public_watch_url")
      .eq("match_id", matchId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    match: (matchResult.data as Record<string, unknown> | null) ?? null,
    liveState: (liveResult.data as Record<string, unknown> | null) ?? null,
    stream: (streamResult.data as Record<string, unknown> | null) ?? null,
  };
}
