"use server";

import { getServerUser, createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createVenueSchema,
  updateVenueSchema,
  generateVenueSlug,
  normalizeVenueSlug,
} from "@/lib/cricket/validation/venue";
import {
  isVenueSlugAvailable,
} from "@/lib/cricket/venues/queries";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function ensureUniqueVenueSlug(base: string, excludeId?: string): Promise<string> {
  const available = await isVenueSlugAvailable(base, excludeId);
  if (available) return base;
  for (let i = 2; i <= 99; i++) {
    const candidate = `${base}-${i}`;
    if (await isVenueSlugAvailable(candidate, excludeId)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

async function insertScheduleChangeLog(
  leagueId: string | null,
  matchId: string | null,
  actorUserId: string,
  action: string,
  oldValue: Record<string, unknown> = {},
  newValue: Record<string, unknown> = {}
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;
  await supabase.from("cricket_schedule_change_logs").insert({
    league_id: leagueId,
    match_id: matchId,
    actor_user_id: actorUserId,
    action,
    old_value: oldValue,
    new_value: newValue,
  });
}

// ─── createCricketVenue ───────────────────────────────────────────────────────

export async function createCricketVenue(
  rawInput: unknown
): Promise<ActionResult<{ id: string; slug: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "You must be signed in to create a venue." };

  const parsed = createVenueSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed.";
    return { success: false, error: firstError };
  }

  const input = parsed.data;
  const baseSlug = input.slug
    ? normalizeVenueSlug(input.slug)
    : generateVenueSlug(input.name, input.city);

  if (!baseSlug) {
    return { success: false, error: "Could not generate a valid slug from the venue name." };
  }

  const slug = await ensureUniqueVenueSlug(baseSlug);
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { data, error } = await supabase
    .from("cricket_venues")
    .insert({
      name: input.name,
      slug,
      city: input.city,
      country: input.country,
      short_name: input.shortName ?? null,
      venue_type: input.venueType ?? "ground",
      address: input.address ?? null,
      region: input.region ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      capacity: input.capacity ?? null,
      timezone: input.timezone ?? "America/New_York",
      contact_name: input.contactName ?? null,
      contact_email: input.contactEmail || null,
      contact_phone: input.contactPhone ?? null,
      booking_notes: input.bookingNotes ?? null,
      pitch_type: input.pitchType ?? null,
      boundary_size_meters: input.boundarySizeMeters ?? null,
      has_lights: input.hasLights ?? false,
      has_turf_pitch: input.hasTurfPitch ?? false,
      has_matting_pitch: input.hasMattingPitch ?? false,
      has_practice_nets: input.hasPracticeNets ?? false,
      has_changing_rooms: input.hasChangingRooms ?? false,
      has_parking: input.hasParking ?? false,
      notes: input.notes ?? null,
      is_active: true,
      created_by: user.id,
    })
    .select("id, slug")
    .single();

  if (error) {
    console.error("[cricket-venues/actions] createCricketVenue:", error.message);
    if (error.code === "23505") {
      return { success: false, error: "A venue with this slug already exists." };
    }
    return { success: false, error: "Failed to create venue. Please try again." };
  }

  const venue = data as { id: string; slug: string };
  await insertScheduleChangeLog(null, null, user.id, "venue.created", {}, { id: venue.id, name: input.name, slug });

  return { success: true, data: { id: venue.id, slug: venue.slug } };
}

// ─── updateCricketVenue ───────────────────────────────────────────────────────

export async function updateCricketVenue(
  venueId: string,
  rawInput: unknown
): Promise<ActionResult<{ slug: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const parsed = updateVenueSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed.";
    return { success: false, error: firstError };
  }

  const input = parsed.data;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  // Check ownership (venue creator)
  const { data: existing } = await supabase
    .from("cricket_venues")
    .select("created_by, slug")
    .eq("id", venueId)
    .single();

  if (!existing) return { success: false, error: "Venue not found." };
  if ((existing as Record<string, unknown>).created_by !== user.id) {
    return { success: false, error: "You do not have permission to edit this venue." };
  }

  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.city !== undefined) updates.city = input.city;
  if (input.country !== undefined) updates.country = input.country;
  if (input.shortName !== undefined) updates.short_name = input.shortName ?? null;
  if (input.venueType !== undefined) updates.venue_type = input.venueType;
  if (input.address !== undefined) updates.address = input.address ?? null;
  if (input.region !== undefined) updates.region = input.region ?? null;
  if (input.latitude !== undefined) updates.latitude = input.latitude ?? null;
  if (input.longitude !== undefined) updates.longitude = input.longitude ?? null;
  if (input.capacity !== undefined) updates.capacity = input.capacity ?? null;
  if (input.timezone !== undefined) updates.timezone = input.timezone;
  if (input.contactName !== undefined) updates.contact_name = input.contactName ?? null;
  if (input.contactEmail !== undefined) updates.contact_email = input.contactEmail || null;
  if (input.contactPhone !== undefined) updates.contact_phone = input.contactPhone ?? null;
  if (input.bookingNotes !== undefined) updates.booking_notes = input.bookingNotes ?? null;
  if (input.pitchType !== undefined) updates.pitch_type = input.pitchType ?? null;
  if (input.boundarySizeMeters !== undefined) updates.boundary_size_meters = input.boundarySizeMeters ?? null;
  if (input.hasLights !== undefined) updates.has_lights = input.hasLights;
  if (input.hasTurfPitch !== undefined) updates.has_turf_pitch = input.hasTurfPitch;
  if (input.hasMattingPitch !== undefined) updates.has_matting_pitch = input.hasMattingPitch;
  if (input.hasPracticeNets !== undefined) updates.has_practice_nets = input.hasPracticeNets;
  if (input.hasChangingRooms !== undefined) updates.has_changing_rooms = input.hasChangingRooms;
  if (input.hasParking !== undefined) updates.has_parking = input.hasParking;
  if (input.notes !== undefined) updates.notes = input.notes ?? null;
  if (input.isActive !== undefined) updates.is_active = input.isActive;

  const { data, error } = await supabase
    .from("cricket_venues")
    .update(updates)
    .eq("id", venueId)
    .select("slug")
    .single();

  if (error) {
    console.error("[cricket-venues/actions] updateCricketVenue:", error.message);
    return { success: false, error: "Failed to update venue." };
  }

  await insertScheduleChangeLog(null, null, user.id, "venue.updated", {}, { venueId });
  return { success: true, data: { slug: (data as { slug: string }).slug } };
}

// ─── archiveCricketVenue ──────────────────────────────────────────────────────

export async function archiveCricketVenue(venueId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { data: existing } = await supabase
    .from("cricket_venues")
    .select("created_by")
    .eq("id", venueId)
    .single();

  if (!existing) return { success: false, error: "Venue not found." };
  if ((existing as Record<string, unknown>).created_by !== user.id) {
    return { success: false, error: "You do not have permission to archive this venue." };
  }

  const { error } = await supabase
    .from("cricket_venues")
    .update({ is_active: false, archived_at: new Date().toISOString() })
    .eq("id", venueId);

  if (error) return { success: false, error: "Failed to archive venue." };

  await insertScheduleChangeLog(null, null, user.id, "venue.archived", {}, { venueId });
  return { success: true, data: undefined };
}

// ─── setCricketVenueAvailability ──────────────────────────────────────────────

export async function setCricketVenueAvailability(
  venueId: string,
  slots: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    notes?: string;
  }>
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  // Delete existing availability for this venue
  await supabase.from("cricket_venue_availability").delete().eq("venue_id", venueId);

  if (slots.length === 0) return { success: true, data: undefined };

  const rows = slots.map((s) => ({
    venue_id: venueId,
    day_of_week: s.dayOfWeek,
    start_time: s.startTime,
    end_time: s.endTime,
    is_available: s.isAvailable,
    notes: s.notes ?? null,
    created_by: user.id,
  }));

  const { error } = await supabase.from("cricket_venue_availability").insert(rows);
  if (error) {
    console.error("[cricket-venues/actions] setCricketVenueAvailability:", error.message);
    return { success: false, error: "Failed to set venue availability." };
  }

  return { success: true, data: undefined };
}
