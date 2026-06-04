"use server";

import { getServerUser, createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createLeagueSchema,
  updateLeagueSchema,
  updateLeagueSettingsSchema,
  inviteLeagueMemberSchema,
  generateLeagueSlug,
  normalizeLeagueSlug,
} from "@/lib/cricket/validation/league";
import {
  userCanManageCricketLeague,
  isLeagueSlugAvailable,
} from "@/lib/cricket/leagues/queries";
import type { CricketLeagueSettings } from "@/lib/cricket/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Generate a unique slug by appending a numeric suffix if needed. */
async function ensureUniqueSlug(base: string): Promise<string> {
  const available = await isLeagueSlugAvailable(base);
  if (available) return base;

  for (let i = 2; i <= 99; i++) {
    const candidate = `${base}-${i}`;
    if (await isLeagueSlugAvailable(candidate)) return candidate;
  }
  // Fallback: append timestamp
  return `${base}-${Date.now()}`;
}

/** Insert an audit log record (best-effort, does not throw). */
async function insertAuditLog(
  leagueId: string,
  actorUserId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  await supabase.from("cricket_league_admin_audit_logs").insert({
    league_id: leagueId,
    actor_user_id: actorUserId,
    action,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    metadata: metadata ?? {},
  });
}

// ─── createCricketLeague ─────────────────────────────────────────────────────

export async function createCricketLeague(
  rawInput: unknown
): Promise<ActionResult<{ id: string; slug: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "You must be signed in to create a league." };

  const parsed = createLeagueSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed.";
    return { success: false, error: firstError };
  }

  const input = parsed.data;

  // Generate or normalise slug
  const baseSlug = input.slug
    ? normalizeLeagueSlug(input.slug)
    : generateLeagueSlug(input.name);

  if (!baseSlug) {
    return { success: false, error: "Could not generate a valid slug from the league name." };
  }

  const slug = await ensureUniqueSlug(baseSlug);

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  // Insert league
  const { data: leagueRow, error: leagueError } = await supabase
    .from("cricket_leagues")
    .insert({
      name: input.name,
      slug,
      description: input.description ?? null,
      country: input.country ?? null,
      region: input.region ?? null,
      city: input.city ?? null,
      season_name: input.seasonName,
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
      format: input.format,
      overs_per_innings: input.oversPerInnings,
      max_teams: input.maxTeams ?? null,
      points_win: input.pointsWin ?? 2,
      points_loss: input.pointsLoss ?? 0,
      points_tie: input.pointsTie ?? 1,
      points_no_result: input.pointsNoResult ?? 1,
      created_by: user.id,
      // Admin columns
      visibility: input.visibility,
      registration_status: "draft",
      timezone: input.timezone,
      ball_type: input.ballType ?? null,
      match_days: input.matchDays ?? [],
      rules_summary: input.rulesSummary ?? null,
      contact_email: input.contactEmail || null,
      website_url: input.websiteUrl || null,
      allow_public_scorecards: input.allowPublicScorecards ?? false,
      allow_team_registration: input.allowTeamRegistration ?? false,
      allow_player_registration: input.allowPlayerRegistration ?? false,
      require_admin_approval: input.requireAdminApproval ?? true,
    })
    .select("id, slug")
    .single();

  if (leagueError) {
    console.error("[cricket-leagues/actions] createCricketLeague:", leagueError.message);
    if (leagueError.code === "23505") {
      return { success: false, error: "A league with this slug already exists. Please choose a different name." };
    }
    return { success: false, error: "Failed to create league. Please try again." };
  }

  const league = leagueRow as { id: string; slug: string };

  // Insert owner membership
  await supabase.from("cricket_league_members").insert({
    league_id: league.id,
    user_id: user.id,
    role: "owner",
  });

  // Insert default league settings
  await supabase.from("cricket_league_settings").insert({
    league_id: league.id,
    default_overs: input.defaultOvers ?? input.oversPerInnings,
    max_players_per_team: input.maxPlayersPerTeam ?? null,
    min_players_per_team: input.minPlayersPerTeam ?? null,
    allow_substitutes: input.allowSubstitutes ?? true,
    allow_super_over: input.allowSuperOver ?? true,
    allow_duckworth_lewis: input.allowDuckworthLewis ?? false,
    points_win: input.pointsWin ?? 2,
    points_loss: input.pointsLoss ?? 0,
    points_tie: input.pointsTie ?? 1,
    points_no_result: input.pointsNoResult ?? 1,
    net_run_rate_enabled: input.netRunRateEnabled ?? true,
    bonus_points_enabled: input.bonusPointsEnabled ?? false,
  });

  // Audit log
  await insertAuditLog(league.id, user.id, "cricket_league.created", "cricket_league", league.id, {
    name: input.name,
    slug,
  });

  return { success: true, data: { id: league.id, slug: league.slug } };
}

// ─── updateCricketLeague ─────────────────────────────────────────────────────

export async function updateCricketLeague(
  leagueId: string,
  rawInput: unknown
): Promise<ActionResult<{ slug: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketLeague(user.id, leagueId);
  if (!canManage) return { success: false, error: "You do not have permission to edit this league." };

  const parsed = updateLeagueSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed.";
    return { success: false, error: firstError };
  }

  const input = parsed.data;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description ?? null;
  if (input.seasonName !== undefined) updates.season_name = input.seasonName;
  if (input.format !== undefined) updates.format = input.format;
  if (input.oversPerInnings !== undefined) updates.overs_per_innings = input.oversPerInnings;
  if (input.maxTeams !== undefined) updates.max_teams = input.maxTeams ?? null;
  if (input.country !== undefined) updates.country = input.country ?? null;
  if (input.region !== undefined) updates.region = input.region ?? null;
  if (input.city !== undefined) updates.city = input.city ?? null;
  if (input.startDate !== undefined) updates.start_date = input.startDate ?? null;
  if (input.endDate !== undefined) updates.end_date = input.endDate ?? null;
  if (input.visibility !== undefined) updates.visibility = input.visibility;
  if (input.timezone !== undefined) updates.timezone = input.timezone;
  if (input.ballType !== undefined) updates.ball_type = input.ballType ?? null;
  if (input.matchDays !== undefined) updates.match_days = input.matchDays ?? [];
  if (input.rulesSummary !== undefined) updates.rules_summary = input.rulesSummary ?? null;
  if (input.contactEmail !== undefined) updates.contact_email = input.contactEmail || null;
  if (input.websiteUrl !== undefined) updates.website_url = input.websiteUrl || null;
  if (input.allowPublicScorecards !== undefined) updates.allow_public_scorecards = input.allowPublicScorecards;
  if (input.allowTeamRegistration !== undefined) updates.allow_team_registration = input.allowTeamRegistration;
  if (input.allowPlayerRegistration !== undefined) updates.allow_player_registration = input.allowPlayerRegistration;
  if (input.requireAdminApproval !== undefined) updates.require_admin_approval = input.requireAdminApproval;

  const { data, error } = await supabase
    .from("cricket_leagues")
    .update(updates)
    .eq("id", leagueId)
    .select("slug")
    .single();

  if (error) {
    console.error("[cricket-leagues/actions] updateCricketLeague:", error.message);
    return { success: false, error: "Failed to update league." };
  }

  await insertAuditLog(leagueId, user.id, "cricket_league.updated", "cricket_league", leagueId);

  return { success: true, data: { slug: (data as { slug: string }).slug } };
}

// ─── updateCricketLeagueRegistrationStatus ───────────────────────────────────

export async function updateCricketLeagueRegistrationStatus(
  leagueId: string,
  status: string
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketLeague(user.id, leagueId);
  if (!canManage) return { success: false, error: "You do not have permission to update this league." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { error } = await supabase
    .from("cricket_leagues")
    .update({ registration_status: status })
    .eq("id", leagueId);

  if (error) return { success: false, error: "Failed to update registration status." };

  await insertAuditLog(leagueId, user.id, "cricket_league.status_changed", "cricket_league", leagueId, { status });
  return { success: true, data: undefined };
}

// ─── updateCricketLeagueSettings ─────────────────────────────────────────────

export async function updateCricketLeagueSettings(
  leagueId: string,
  rawInput: unknown
): Promise<ActionResult<CricketLeagueSettings>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketLeague(user.id, leagueId);
  if (!canManage) return { success: false, error: "You do not have permission to update settings." };

  const parsed = updateLeagueSettingsSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed.";
    return { success: false, error: firstError };
  }

  const input = parsed.data;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const updates: Record<string, unknown> = {};
  if (input.defaultOvers !== undefined) updates.default_overs = input.defaultOvers;
  if (input.maxPlayersPerTeam !== undefined) updates.max_players_per_team = input.maxPlayersPerTeam ?? null;
  if (input.minPlayersPerTeam !== undefined) updates.min_players_per_team = input.minPlayersPerTeam ?? null;
  if (input.allowSubstitutes !== undefined) updates.allow_substitutes = input.allowSubstitutes;
  if (input.allowSuperOver !== undefined) updates.allow_super_over = input.allowSuperOver;
  if (input.allowDuckworthLewis !== undefined) updates.allow_duckworth_lewis = input.allowDuckworthLewis;
  if (input.pointsWin !== undefined) updates.points_win = input.pointsWin;
  if (input.pointsLoss !== undefined) updates.points_loss = input.pointsLoss;
  if (input.pointsTie !== undefined) updates.points_tie = input.pointsTie;
  if (input.pointsNoResult !== undefined) updates.points_no_result = input.pointsNoResult;
  if (input.netRunRateEnabled !== undefined) updates.net_run_rate_enabled = input.netRunRateEnabled;
  if (input.bonusPointsEnabled !== undefined) updates.bonus_points_enabled = input.bonusPointsEnabled;

  const { data, error } = await supabase
    .from("cricket_league_settings")
    .upsert({ ...updates, league_id: leagueId }, { onConflict: "league_id" })
    .select("*")
    .single();

  if (error) {
    console.error("[cricket-leagues/actions] updateCricketLeagueSettings:", error.message);
    return { success: false, error: "Failed to update settings." };
  }

  await insertAuditLog(leagueId, user.id, "cricket_league.settings_updated", "cricket_league_settings", leagueId);

  const row = data as Record<string, unknown>;
  return {
    success: true,
    data: {
      id: row.id as string,
      leagueId: row.league_id as string,
      scoringMode: (row.scoring_mode as string) ?? "standard",
      defaultOvers: row.default_overs as number,
      maxPlayersPerTeam: (row.max_players_per_team as number | null) ?? null,
      minPlayersPerTeam: (row.min_players_per_team as number | null) ?? null,
      allowSubstitutes: (row.allow_substitutes as boolean) ?? true,
      allowSuperOver: (row.allow_super_over as boolean) ?? true,
      allowDuckworthLewis: (row.allow_duckworth_lewis as boolean) ?? false,
      pointsWin: row.points_win as number,
      pointsLoss: row.points_loss as number,
      pointsTie: row.points_tie as number,
      pointsNoResult: row.points_no_result as number,
      netRunRateEnabled: (row.net_run_rate_enabled as boolean) ?? true,
      bonusPointsEnabled: (row.bonus_points_enabled as boolean) ?? false,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    },
  };
}

// ─── inviteCricketLeagueMember ────────────────────────────────────────────────

export async function inviteCricketLeagueMember(
  leagueId: string,
  rawInput: unknown
): Promise<ActionResult<{ id: string; email: string; role: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketLeague(user.id, leagueId);
  if (!canManage) return { success: false, error: "You do not have permission to invite members." };

  const parsed = inviteLeagueMemberSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed.";
    return { success: false, error: firstError };
  }

  const { email, role } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  // Generate a secure random token (using crypto.randomUUID for server-side)
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

  // Set expiry to 7 days from now
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("cricket_league_invitations")
    .insert({
      league_id: leagueId,
      email: normalizedEmail,
      role,
      invited_by: user.id,
      expires_at: expiresAt,
      token,
    })
    .select("id, email, role")
    .single();

  if (error) {
    console.error("[cricket-leagues/actions] inviteCricketLeagueMember:", error.message);
    return { success: false, error: "Failed to create invitation." };
  }

  await insertAuditLog(
    leagueId,
    user.id,
    "cricket_league.invitation_created",
    "cricket_league_invitation",
    undefined,
    { email: normalizedEmail, role }
  );

  const inv = data as { id: string; email: string; role: string };
  return { success: true, data: { id: inv.id, email: inv.email, role: inv.role } };
}

// ─── archiveCricketLeague ─────────────────────────────────────────────────────

export async function archiveCricketLeague(
  leagueId: string
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketLeague(user.id, leagueId);
  if (!canManage) return { success: false, error: "You do not have permission to archive this league." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { error } = await supabase
    .from("cricket_leagues")
    .update({ registration_status: "archived" })
    .eq("id", leagueId);

  if (error) return { success: false, error: "Failed to archive league." };

  await insertAuditLog(leagueId, user.id, "cricket_league.archived", "cricket_league", leagueId);
  return { success: true, data: undefined };
}
