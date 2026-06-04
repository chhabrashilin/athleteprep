import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CricketVenue, CricketVenueFull, CricketVenueAvailability } from "@/lib/cricket/types";

// ─── Row mappers ──────────────────────────────────────────────────────────────

function rowToVenue(row: Record<string, unknown>): CricketVenue {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: (row.slug as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    region: (row.region as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    latitude: (row.latitude as number | null) ?? null,
    longitude: (row.longitude as number | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToVenueFull(row: Record<string, unknown>): CricketVenueFull {
  return {
    ...rowToVenue(row),
    shortName: (row.short_name as string | null) ?? null,
    venueType: (row.venue_type as string) ?? "ground",
    capacity: (row.capacity as number | null) ?? null,
    timezone: (row.timezone as string) ?? "America/New_York",
    contactName: (row.contact_name as string | null) ?? null,
    contactEmail: (row.contact_email as string | null) ?? null,
    contactPhone: (row.contact_phone as string | null) ?? null,
    bookingNotes: (row.booking_notes as string | null) ?? null,
    pitchType: (row.pitch_type as string | null) ?? null,
    boundarySizeMeters: (row.boundary_size_meters as number | null) ?? null,
    hasLights: (row.has_lights as boolean) ?? false,
    hasTurfPitch: (row.has_turf_pitch as boolean) ?? false,
    hasMattingPitch: (row.has_matting_pitch as boolean) ?? false,
    hasPracticeNets: (row.has_practice_nets as boolean) ?? false,
    hasChangingRooms: (row.has_changing_rooms as boolean) ?? false,
    hasParking: (row.has_parking as boolean) ?? false,
    isActive: (row.is_active as boolean) ?? true,
    archivedAt: (row.archived_at as string | null) ?? null,
  };
}

function rowToAvailability(row: Record<string, unknown>): CricketVenueAvailability {
  return {
    id: row.id as string,
    venueId: row.venue_id as string,
    dayOfWeek: row.day_of_week as number,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    isAvailable: (row.is_available as boolean) ?? true,
    notes: (row.notes as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getCricketVenues(): Promise<CricketVenueFull[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_venues")
    .select("*")
    .order("name", { ascending: true });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToVenueFull);
}

export async function getActiveCricketVenues(): Promise<CricketVenueFull[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_venues")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToVenueFull);
}

export async function getCricketVenueBySlug(slug: string): Promise<CricketVenueFull | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cricket_venues")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return rowToVenueFull(data as Record<string, unknown>);
}

export async function getCricketVenueById(id: string): Promise<CricketVenueFull | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cricket_venues")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToVenueFull(data as Record<string, unknown>);
}

export async function getVenuesForLeagueScheduling(leagueId: string): Promise<CricketVenueFull[]> {
  // For now returns all active venues; future: could filter by league-associated venues
  void leagueId;
  return getActiveCricketVenues();
}

export async function getVenueAvailability(venueId: string): Promise<CricketVenueAvailability[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_venue_availability")
    .select("*")
    .eq("venue_id", venueId)
    .order("day_of_week", { ascending: true });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToAvailability);
}

export async function isVenueSlugAvailable(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  let query = supabase
    .from("cricket_venues")
    .select("id")
    .eq("slug", slug);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) return false;
  return !data;
}
