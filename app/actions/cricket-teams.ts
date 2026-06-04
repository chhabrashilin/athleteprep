"use server";

import { getServerUser, createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createTeamSchema,
  updateTeamSchema,
  inviteTeamMemberSchema,
  generateTeamSlug,
  normalizeTeamSlug,
  normalizeCricketEmail,
} from "@/lib/cricket/validation/team";
import {
  createPlayerSchema,
  updatePlayerSchema,
  generatePlayerSlug,
} from "@/lib/cricket/validation/player";
import { rosterEntrySchema, updateRosterEntrySchema } from "@/lib/cricket/validation/roster";
import {
  userCanManageCricketTeam,
  isTeamSlugAvailable,
} from "@/lib/cricket/teams/queries";
import { userCanManageCricketLeague } from "@/lib/cricket/leagues/queries";
import { isPlayerSlugAvailable } from "@/lib/cricket/players/queries";
import type { CricketPlayerFull } from "@/lib/cricket/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function ensureUniqueTeamSlug(base: string): Promise<string> {
  const available = await isTeamSlugAvailable(base);
  if (available) return base;

  for (let i = 2; i <= 99; i++) {
    const candidate = `${base}-${i}`;
    if (await isTeamSlugAvailable(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

async function ensureUniquePlayerSlug(base: string): Promise<string> {
  const available = await isPlayerSlugAvailable(base);
  if (available) return base;

  for (let i = 2; i <= 99; i++) {
    const candidate = `${base}-${i}`;
    if (await isPlayerSlugAvailable(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

async function insertRosterChangeLog(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  actorUserId: string,
  teamId: string | null,
  playerId: string | null,
  action: string,
  oldValue: Record<string, unknown> = {},
  newValue: Record<string, unknown> = {}
): Promise<void> {
  if (!supabase) return;
  await supabase.from("cricket_roster_change_logs").insert({
    cricket_team_id: teamId,
    cricket_player_id: playerId,
    actor_user_id: actorUserId,
    action,
    old_value: oldValue,
    new_value: newValue,
  });
}

// ─── createCricketTeam ────────────────────────────────────────────────────────

export async function createCricketTeam(
  rawInput: unknown
): Promise<ActionResult<{ id: string; slug: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "You must be signed in to create a team." };

  const parsed = createTeamSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed.";
    return { success: false, error: firstError };
  }

  const input = parsed.data;

  // Check league exists and user can create teams in it
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { data: leagueRow, error: leagueError } = await supabase
    .from("cricket_leagues")
    .select("id, allow_team_registration")
    .eq("id", input.leagueId)
    .single();

  if (leagueError || !leagueRow) {
    return { success: false, error: "League not found." };
  }

  const league = leagueRow as { id: string; allow_team_registration: boolean };
  const canManageLeague = await userCanManageCricketLeague(user.id, league.id);

  if (!canManageLeague && !league.allow_team_registration) {
    return { success: false, error: "Team registration is not open for this league." };
  }

  // Generate slug
  const baseSlug = input.slug
    ? normalizeTeamSlug(input.slug)
    : generateTeamSlug(input.name);

  if (!baseSlug) {
    return { success: false, error: "Could not generate a valid slug from the team name." };
  }

  const slug = await ensureUniqueTeamSlug(baseSlug);

  // Insert team
  const { data: teamRow, error: teamError } = await supabase
    .from("cricket_teams")
    .insert({
      league_id: input.leagueId,
      name: input.name,
      short_name: input.shortName,
      slug,
      description: input.description ?? null,
      team_type: input.teamType ?? "club",
      logo_url: input.logoUrl || null,
      primary_color: input.primaryColor || null,
      secondary_color: input.secondaryColor || null,
      home_ground: input.homeGround ?? null,
      manager_name: input.managerName ?? null,
      manager_email: input.managerEmail ? normalizeCricketEmail(input.managerEmail) : null,
      contact_email: input.contactEmail ? normalizeCricketEmail(input.contactEmail) : null,
      contact_phone: input.contactPhone ?? null,
      website_url: input.websiteUrl || null,
      instagram_url: input.instagramUrl || null,
      founded_year: input.foundedYear ?? null,
      coach_name: input.coachName ?? null,
      scorer_name: input.scorerName ?? null,
      registration_status: "draft",
      approval_status: canManageLeague ? "approved" : "pending",
      created_by: user.id,
    })
    .select("id, slug")
    .single();

  if (teamError) {
    console.error("[cricket-teams/actions] createCricketTeam:", teamError.message);
    if (teamError.code === "23505") {
      return { success: false, error: "A team with this slug already exists. Please choose a different name." };
    }
    return { success: false, error: "Failed to create team. Please try again." };
  }

  const team = teamRow as { id: string; slug: string };

  // Add creator as team owner/manager
  await supabase.from("cricket_team_members").insert({
    cricket_team_id: team.id,
    user_id: user.id,
    role: canManageLeague ? "owner" : "manager",
  });

  // Audit log
  await insertRosterChangeLog(supabase, user.id, team.id, null, "team.created", {}, {
    name: input.name,
    slug,
    leagueId: input.leagueId,
  });

  return { success: true, data: { id: team.id, slug: team.slug } };
}

// ─── updateCricketTeam ────────────────────────────────────────────────────────

export async function updateCricketTeam(
  teamId: string,
  rawInput: unknown
): Promise<ActionResult<{ slug: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketTeam(user.id, teamId);
  if (!canManage) return { success: false, error: "You do not have permission to edit this team." };

  const parsed = updateTeamSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed.";
    return { success: false, error: firstError };
  }

  const input = parsed.data;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.shortName !== undefined) updates.short_name = input.shortName;
  if (input.description !== undefined) updates.description = input.description ?? null;
  if (input.teamType !== undefined) updates.team_type = input.teamType;
  if (input.logoUrl !== undefined) updates.logo_url = input.logoUrl || null;
  if (input.primaryColor !== undefined) updates.primary_color = input.primaryColor || null;
  if (input.secondaryColor !== undefined) updates.secondary_color = input.secondaryColor || null;
  if (input.homeGround !== undefined) updates.home_ground = input.homeGround ?? null;
  if (input.managerName !== undefined) updates.manager_name = input.managerName ?? null;
  if (input.managerEmail !== undefined) updates.manager_email = input.managerEmail ? normalizeCricketEmail(input.managerEmail) : null;
  if (input.contactEmail !== undefined) updates.contact_email = input.contactEmail ? normalizeCricketEmail(input.contactEmail) : null;
  if (input.contactPhone !== undefined) updates.contact_phone = input.contactPhone ?? null;
  if (input.websiteUrl !== undefined) updates.website_url = input.websiteUrl || null;
  if (input.instagramUrl !== undefined) updates.instagram_url = input.instagramUrl || null;
  if (input.foundedYear !== undefined) updates.founded_year = input.foundedYear ?? null;
  if (input.coachName !== undefined) updates.coach_name = input.coachName ?? null;
  if (input.scorerName !== undefined) updates.scorer_name = input.scorerName ?? null;
  if (input.isActive !== undefined) updates.is_active = input.isActive;

  const { data, error } = await supabase
    .from("cricket_teams")
    .update(updates)
    .eq("id", teamId)
    .select("slug")
    .single();

  if (error) {
    console.error("[cricket-teams/actions] updateCricketTeam:", error.message);
    return { success: false, error: "Failed to update team." };
  }

  await insertRosterChangeLog(supabase, user.id, teamId, null, "team.updated", {}, updates);

  return { success: true, data: { slug: (data as { slug: string }).slug } };
}

// ─── archiveCricketTeam ───────────────────────────────────────────────────────

export async function archiveCricketTeam(
  teamId: string
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketTeam(user.id, teamId);
  if (!canManage) return { success: false, error: "You do not have permission to archive this team." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { error } = await supabase
    .from("cricket_teams")
    .update({
      registration_status: "archived",
      is_active: false,
      archived_at: new Date().toISOString(),
    })
    .eq("id", teamId);

  if (error) return { success: false, error: "Failed to archive team." };

  await insertRosterChangeLog(supabase, user.id, teamId, null, "team.archived");
  return { success: true, data: undefined };
}

// ─── inviteCricketTeamMember ──────────────────────────────────────────────────

export async function inviteCricketTeamMember(
  teamId: string,
  rawInput: unknown
): Promise<ActionResult<{ id: string; email: string; role: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketTeam(user.id, teamId);
  if (!canManage) return { success: false, error: "You do not have permission to invite members." };

  const parsed = inviteTeamMemberSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed.";
    return { success: false, error: firstError };
  }

  const { email, role } = parsed.data;
  const normalizedEmail = normalizeCricketEmail(email);

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("cricket_team_invitations")
    .insert({
      cricket_team_id: teamId,
      email: normalizedEmail,
      role,
      invited_by: user.id,
      token,
      expires_at: expiresAt,
    })
    .select("id, email, role")
    .single();

  if (error) {
    console.error("[cricket-teams/actions] inviteCricketTeamMember:", error.message);
    return { success: false, error: "Failed to create invitation." };
  }

  await insertRosterChangeLog(supabase, user.id, teamId, null, "invitation.created", {}, {
    email: normalizedEmail,
    role,
  });

  const inv = data as { id: string; email: string; role: string };
  return { success: true, data: { id: inv.id, email: inv.email, role: inv.role } };
}

// ─── revokeTeamInvitation ─────────────────────────────────────────────────────

export async function revokeTeamInvitation(
  teamId: string,
  invitationId: string
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketTeam(user.id, teamId);
  if (!canManage) return { success: false, error: "You do not have permission to revoke invitations." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { error } = await supabase
    .from("cricket_team_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("cricket_team_id", teamId);

  if (error) return { success: false, error: "Failed to revoke invitation." };

  await insertRosterChangeLog(supabase, user.id, teamId, null, "invitation.revoked", {}, { invitationId });
  return { success: true, data: undefined };
}

// ─── addUserAsCricketTeamMember ───────────────────────────────────────────────

export async function addUserAsCricketTeamMember(
  teamId: string,
  userId: string,
  role: string
): Promise<ActionResult<{ id: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketTeam(user.id, teamId);
  if (!canManage && user.id !== userId) {
    return { success: false, error: "You do not have permission to add members." };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { data, error } = await supabase
    .from("cricket_team_members")
    .upsert(
      { cricket_team_id: teamId, user_id: userId, role, invited_by: user.id },
      { onConflict: "cricket_team_id,user_id" }
    )
    .select("id")
    .single();

  if (error) {
    console.error("[cricket-teams/actions] addUserAsCricketTeamMember:", error.message);
    return { success: false, error: "Failed to add team member." };
  }

  return { success: true, data: { id: (data as { id: string }).id } };
}

// ─── createCricketPlayer ─────────────────────────────────────────────────────

export async function createCricketPlayer(
  rawInput: unknown
): Promise<ActionResult<CricketPlayerFull>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const parsed = createPlayerSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed.";
    return { success: false, error: firstError };
  }

  const input = parsed.data;

  const baseSlug = generatePlayerSlug(input.displayName);
  const slug = await ensureUniquePlayerSlug(baseSlug);

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { data, error } = await supabase
    .from("cricket_players")
    .insert({
      display_name: input.displayName,
      slug: slug || null,
      email: input.email ? normalizeCricketEmail(input.email) : null,
      phone: input.phone ?? null,
      batting_style: input.battingStyle ?? null,
      bowling_style: input.bowlingStyle ?? null,
      primary_role: input.primaryRole ?? null,
      secondary_role: input.secondaryRole ?? null,
      role: input.primaryRole ?? null,
      profile_photo_url: input.profilePhotoUrl || null,
      bio: input.bio ?? null,
      date_of_birth: input.dateOfBirth ?? null,
      country: input.country ?? null,
      city: input.city ?? null,
      dominant_hand: input.dominantHand ?? null,
      fielding_position_preference: input.fieldingPositionPreference ?? null,
      batting_order_preference: input.battingOrderPreference ?? null,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[cricket-teams/actions] createCricketPlayer:", error.message);
    return { success: false, error: "Failed to create player profile." };
  }

  const row = data as Record<string, unknown>;
  const player: CricketPlayerFull = {
    id: row.id as string,
    userId: null,
    displayName: row.display_name as string,
    slug: (row.slug as string | null) ?? null,
    battingStyle: (row.batting_style as string | null) ?? null,
    bowlingStyle: (row.bowling_style as string | null) ?? null,
    role: (row.role as string | null) ?? null,
    profilePhotoUrl: (row.profile_photo_url as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    dateOfBirth: (row.date_of_birth as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    gender: null,
    dominantHand: (row.dominant_hand as string | null) ?? null,
    primaryRole: (row.primary_role as string | null) ?? null,
    secondaryRole: (row.secondary_role as string | null) ?? null,
    battingOrderPreference: (row.batting_order_preference as number | null) ?? null,
    bowlingType: null,
    fieldingPositionPreference: (row.fielding_position_preference as string | null) ?? null,
    availabilityStatus: "active",
    isVerified: false,
  };

  return { success: true, data: player };
}

// ─── updateCricketPlayer ──────────────────────────────────────────────────────

export async function updateCricketPlayer(
  playerId: string,
  rawInput: unknown
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const parsed = updatePlayerSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed.";
    return { success: false, error: firstError };
  }

  const input = parsed.data;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  // Check: creator or player's linked user
  const { data: playerRow } = await supabase
    .from("cricket_players")
    .select("created_by, user_id")
    .eq("id", playerId)
    .single();

  if (!playerRow) return { success: false, error: "Player not found." };

  const p = playerRow as { created_by: string | null; user_id: string | null };
  if (p.created_by !== user.id && p.user_id !== user.id) {
    return { success: false, error: "You do not have permission to edit this player." };
  }

  const updates: Record<string, unknown> = {};
  if (input.displayName !== undefined) updates.display_name = input.displayName;
  if (input.email !== undefined) updates.email = input.email ? normalizeCricketEmail(input.email) : null;
  if (input.phone !== undefined) updates.phone = input.phone ?? null;
  if (input.battingStyle !== undefined) updates.batting_style = input.battingStyle ?? null;
  if (input.bowlingStyle !== undefined) updates.bowling_style = input.bowlingStyle ?? null;
  if (input.primaryRole !== undefined) { updates.primary_role = input.primaryRole ?? null; updates.role = input.primaryRole ?? null; }
  if (input.secondaryRole !== undefined) updates.secondary_role = input.secondaryRole ?? null;
  if (input.profilePhotoUrl !== undefined) updates.profile_photo_url = input.profilePhotoUrl || null;
  if (input.bio !== undefined) updates.bio = input.bio ?? null;
  if (input.dateOfBirth !== undefined) updates.date_of_birth = input.dateOfBirth ?? null;
  if (input.country !== undefined) updates.country = input.country ?? null;
  if (input.city !== undefined) updates.city = input.city ?? null;
  if (input.dominantHand !== undefined) updates.dominant_hand = input.dominantHand ?? null;
  if (input.fieldingPositionPreference !== undefined) updates.fielding_position_preference = input.fieldingPositionPreference ?? null;
  if (input.battingOrderPreference !== undefined) updates.batting_order_preference = input.battingOrderPreference ?? null;

  const { error } = await supabase
    .from("cricket_players")
    .update(updates)
    .eq("id", playerId);

  if (error) {
    console.error("[cricket-teams/actions] updateCricketPlayer:", error.message);
    return { success: false, error: "Failed to update player." };
  }

  return { success: true, data: undefined };
}

// ─── addPlayerToCricketTeam ───────────────────────────────────────────────────

export async function addPlayerToCricketTeam(
  teamId: string,
  playerInputOrId: unknown,
  rosterInput?: { jerseyNumber?: string; rosterRole?: string; isCaptain?: boolean; isViceCaptain?: boolean }
): Promise<ActionResult<{ rosterId: string; playerId: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketTeam(user.id, teamId);
  if (!canManage) return { success: false, error: "You do not have permission to manage this roster." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  let playerId: string;

  // If string, treat as existing player ID
  if (typeof playerInputOrId === "string") {
    playerId = playerInputOrId;
  } else {
    // Create new player
    const result = await createCricketPlayer(playerInputOrId);
    if (!result.success) return result;
    playerId = result.data.id;
  }

  // Validate roster entry
  const rosterParsed = rosterEntrySchema.safeParse({
    cricketTeamId: teamId,
    cricketPlayerId: playerId,
    jerseyNumber: rosterInput?.jerseyNumber,
    rosterRole: rosterInput?.rosterRole,
    isCaptain: rosterInput?.isCaptain ?? false,
    isViceCaptain: rosterInput?.isViceCaptain ?? false,
  });

  if (!rosterParsed.success) {
    const firstError = rosterParsed.error.issues[0]?.message ?? "Roster validation failed.";
    return { success: false, error: firstError };
  }

  const rData = rosterParsed.data;

  const { data, error } = await supabase
    .from("cricket_team_rosters")
    .insert({
      cricket_team_id: teamId,
      cricket_player_id: playerId,
      jersey_number: rData.jerseyNumber ?? null,
      roster_role: rData.rosterRole ?? null,
      is_captain: rData.isCaptain ?? false,
      is_vice_captain: rData.isViceCaptain ?? false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[cricket-teams/actions] addPlayerToCricketTeam:", error.message);
    if (error.code === "23505") {
      return { success: false, error: "This player is already on the roster." };
    }
    return { success: false, error: "Failed to add player to roster." };
  }

  const rosterId = (data as { id: string }).id;

  await insertRosterChangeLog(supabase, user.id, teamId, playerId, "player.added", {}, {
    jerseyNumber: rData.jerseyNumber,
    rosterRole: rData.rosterRole,
    isCaptain: rData.isCaptain,
    isViceCaptain: rData.isViceCaptain,
  });

  return { success: true, data: { rosterId, playerId } };
}

// ─── updateCricketRosterEntry ─────────────────────────────────────────────────

export async function updateCricketRosterEntry(
  rosterEntryId: string,
  teamId: string,
  rawInput: unknown
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketTeam(user.id, teamId);
  if (!canManage) return { success: false, error: "You do not have permission to manage this roster." };

  const parsed = updateRosterEntrySchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed.";
    return { success: false, error: firstError };
  }

  const input = parsed.data;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const updates: Record<string, unknown> = {};
  if (input.jerseyNumber !== undefined) updates.jersey_number = input.jerseyNumber ?? null;
  if (input.rosterRole !== undefined) updates.roster_role = input.rosterRole ?? null;
  if (input.isCaptain !== undefined) updates.is_captain = input.isCaptain;
  if (input.isViceCaptain !== undefined) updates.is_vice_captain = input.isViceCaptain;

  const { error } = await supabase
    .from("cricket_team_rosters")
    .update(updates)
    .eq("id", rosterEntryId)
    .eq("cricket_team_id", teamId);

  if (error) {
    console.error("[cricket-teams/actions] updateCricketRosterEntry:", error.message);
    return { success: false, error: "Failed to update roster entry." };
  }

  return { success: true, data: undefined };
}

// ─── removePlayerFromCricketTeam ──────────────────────────────────────────────

export async function removePlayerFromCricketTeam(
  rosterEntryId: string,
  teamId: string
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketTeam(user.id, teamId);
  if (!canManage) return { success: false, error: "You do not have permission to manage this roster." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  // Fetch player ID before deleting for audit log
  const { data: rosterRow } = await supabase
    .from("cricket_team_rosters")
    .select("cricket_player_id")
    .eq("id", rosterEntryId)
    .eq("cricket_team_id", teamId)
    .single();

  const playerId = rosterRow
    ? (rosterRow as { cricket_player_id: string }).cricket_player_id
    : null;

  const { error } = await supabase
    .from("cricket_team_rosters")
    .delete()
    .eq("id", rosterEntryId)
    .eq("cricket_team_id", teamId);

  if (error) {
    console.error("[cricket-teams/actions] removePlayerFromCricketTeam:", error.message);
    return { success: false, error: "Failed to remove player from roster." };
  }

  await insertRosterChangeLog(supabase, user.id, teamId, playerId, "player.removed");
  return { success: true, data: undefined };
}

// ─── assignCricketCaptain ─────────────────────────────────────────────────────

export async function assignCricketCaptain(
  teamId: string,
  playerId: string
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketTeam(user.id, teamId);
  if (!canManage) return { success: false, error: "You do not have permission to assign captain." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  // Unset current captain
  await supabase
    .from("cricket_team_rosters")
    .update({ is_captain: false })
    .eq("cricket_team_id", teamId)
    .eq("is_captain", true);

  // Set new captain
  const { error } = await supabase
    .from("cricket_team_rosters")
    .update({ is_captain: true })
    .eq("cricket_team_id", teamId)
    .eq("cricket_player_id", playerId);

  if (error) {
    console.error("[cricket-teams/actions] assignCricketCaptain:", error.message);
    return { success: false, error: "Failed to assign captain." };
  }

  // Update team record
  await supabase
    .from("cricket_teams")
    .update({ captain_player_id: playerId })
    .eq("id", teamId);

  await insertRosterChangeLog(supabase, user.id, teamId, playerId, "player.captain_assigned");
  return { success: true, data: undefined };
}

// ─── assignCricketViceCaptain ─────────────────────────────────────────────────

export async function assignCricketViceCaptain(
  teamId: string,
  playerId: string
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canManage = await userCanManageCricketTeam(user.id, teamId);
  if (!canManage) return { success: false, error: "You do not have permission to assign vice captain." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  // Unset current vice captain
  await supabase
    .from("cricket_team_rosters")
    .update({ is_vice_captain: false })
    .eq("cricket_team_id", teamId)
    .eq("is_vice_captain", true);

  // Set new vice captain
  const { error } = await supabase
    .from("cricket_team_rosters")
    .update({ is_vice_captain: true })
    .eq("cricket_team_id", teamId)
    .eq("cricket_player_id", playerId);

  if (error) {
    console.error("[cricket-teams/actions] assignCricketViceCaptain:", error.message);
    return { success: false, error: "Failed to assign vice captain." };
  }

  await supabase
    .from("cricket_teams")
    .update({ vice_captain_player_id: playerId })
    .eq("id", teamId);

  await insertRosterChangeLog(supabase, user.id, teamId, playerId, "player.vice_captain_assigned");
  return { success: true, data: undefined };
}

// ─── linkCricketPlayerToUser ──────────────────────────────────────────────────

export async function linkCricketPlayerToUser(
  playerId: string,
  userId: string
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  if (user.id !== userId) {
    return { success: false, error: "You can only link a player to your own account." };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { error } = await supabase
    .from("cricket_players")
    .update({ user_id: userId })
    .eq("id", playerId);

  if (error) {
    console.error("[cricket-teams/actions] linkCricketPlayerToUser:", error.message);
    return { success: false, error: "Failed to link player to user." };
  }

  return { success: true, data: undefined };
}
