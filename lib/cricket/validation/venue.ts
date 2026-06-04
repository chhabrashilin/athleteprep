import { z } from "zod";

// ─── Constants ────────────────────────────────────────────────────────────────

export const VENUE_TYPES = [
  "ground",
  "stadium",
  "school",
  "university",
  "indoor",
  "practice_facility",
  "other",
] as const;

export const PITCH_TYPES = [
  "turf",
  "matting",
  "concrete",
  "synthetic",
  "other",
] as const;

// ─── Slug helpers ─────────────────────────────────────────────────────────────

export function generateVenueSlug(name: string, city?: string): string {
  const base = city ? `${name} ${city}` : name;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export function normalizeVenueSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

export const createVenueSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120, "Name too long"),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(slugRegex, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional(),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),

  // Optional fields
  shortName: z.string().max(30).optional(),
  venueType: z.enum(VENUE_TYPES).default("ground"),
  address: z.string().max(300).optional(),
  region: z.string().max(100).optional(),
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),
  capacity: z.number().int().positive("Capacity must be positive").optional(),
  timezone: z.string().default("America/New_York"),
  contactName: z.string().max(120).optional(),
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  contactPhone: z.string().max(30).optional(),
  bookingNotes: z.string().max(2000).optional(),
  pitchType: z.enum(PITCH_TYPES).optional(),
  boundarySizeMeters: z
    .number()
    .int()
    .positive("Boundary size must be positive")
    .optional(),
  hasLights: z.boolean().default(false),
  hasTurfPitch: z.boolean().default(false),
  hasMattingPitch: z.boolean().default(false),
  hasPracticeNets: z.boolean().default(false),
  hasChangingRooms: z.boolean().default(false),
  hasParking: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
});

export const updateVenueSchema = createVenueSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
