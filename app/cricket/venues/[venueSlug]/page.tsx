import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, Mail, Calendar } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCricketVenueBySlug, getVenueAvailability } from "@/lib/cricket/venues/queries";
import { getServerUser } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MatchCard } from "@/components/cricket/MatchCard";
import type { CricketMatchFull } from "@/lib/cricket/types";

interface Props {
  params: Promise<{ venueSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { venueSlug } = await params;
  const venue = await getCricketVenueBySlug(venueSlug).catch(() => null);
  return { title: venue ? `${venue.name} — GameIQ` : "Venue — GameIQ" };
}

export default async function CricketVenueDetailPage({ params }: Props) {
  const { venueSlug } = await params;
  const [venue, user] = await Promise.all([
    getCricketVenueBySlug(venueSlug).catch(() => null),
    getServerUser(),
  ]);

  if (!venue) notFound();

  const isOwner = user?.id === venue.createdBy;

  // Fetch upcoming matches at this venue
  const supabase = await createServerSupabaseClient();
  let upcomingMatches: CricketMatchFull[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("cricket_matches")
      .select("*")
      .eq("venue_id", venue.id)
      .gte("scheduled_start", new Date().toISOString())
      .is("archived_at", null)
      .order("scheduled_start", { ascending: true })
      .limit(5);
    upcomingMatches = (data ?? []) as unknown as CricketMatchFull[];
  }

  const availability = await getVenueAvailability(venue.id).catch(() => []);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const amenities = [
    { label: "Lights", active: venue.hasLights },
    { label: "Turf Pitch", active: venue.hasTurfPitch },
    { label: "Matting Pitch", active: venue.hasMattingPitch },
    { label: "Practice Nets", active: venue.hasPracticeNets },
    { label: "Changing Rooms", active: venue.hasChangingRooms },
    { label: "Parking", active: venue.hasParking },
  ];

  return (
    <AppShell>
      <PageHeader
        title={venue.name}
        description={[venue.venueType, venue.city, venue.country].filter(Boolean).join(" · ")}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Location */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Location</h2>
            <div className="space-y-2">
              {venue.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-400">{venue.address}</span>
                </div>
              )}
              <p className="text-sm text-slate-400">
                {[venue.city, venue.region, venue.country].filter(Boolean).join(", ")}
              </p>
              {venue.latitude && venue.longitude && (
                <p className="text-xs text-slate-600">
                  {venue.latitude.toFixed(4)}, {venue.longitude.toFixed(4)}
                </p>
              )}
            </div>
          </div>

          {/* Facilities */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Facilities</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {amenities.map((a) => (
                <div
                  key={a.label}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                    a.active
                      ? "bg-sky-500/10 text-sky-400"
                      : "bg-slate-800/50 text-slate-600 line-through"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${a.active ? "bg-sky-400" : "bg-slate-700"}`} />
                  {a.label}
                </div>
              ))}
            </div>
            {venue.pitchType && (
              <p className="mt-3 text-xs text-slate-500">
                Pitch type: <span className="text-slate-400 capitalize">{venue.pitchType}</span>
              </p>
            )}
            {venue.boundarySizeMeters && (
              <p className="text-xs text-slate-500 mt-1">
                Boundary: <span className="text-slate-400">{venue.boundarySizeMeters}m</span>
              </p>
            )}
            {venue.capacity && (
              <p className="text-xs text-slate-500 mt-1">
                Capacity: <span className="text-slate-400">{venue.capacity.toLocaleString()}</span>
              </p>
            )}
          </div>

          {/* Upcoming matches */}
          {upcomingMatches.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Upcoming Matches</h2>
              <div className="space-y-3">
                {upcomingMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Contact */}
          {(venue.contactName || venue.contactEmail || venue.contactPhone) && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-3">Contact</h2>
              <div className="space-y-2">
                {venue.contactName && (
                  <p className="text-sm text-slate-300">{venue.contactName}</p>
                )}
                {venue.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                    <a href={`mailto:${venue.contactEmail}`} className="text-xs text-sky-400 hover:underline">
                      {venue.contactEmail}
                    </a>
                  </div>
                )}
                {venue.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-xs text-slate-400">{venue.contactPhone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Availability */}
          {availability.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Weekly Availability
              </h2>
              <div className="space-y-1">
                {availability.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{dayNames[slot.dayOfWeek]}</span>
                    <span className={slot.isAvailable ? "text-emerald-400" : "text-red-400"}>
                      {slot.isAvailable ? `${slot.startTime} – ${slot.endTime}` : "Unavailable"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {venue.bookingNotes && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-2">Booking Notes</h2>
              <p className="text-xs text-slate-400 whitespace-pre-line">{venue.bookingNotes}</p>
            </div>
          )}

          {/* Admin actions */}
          {isOwner && (
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <Link
                href={`/cricket/venues/${venue.slug ?? venue.id}/settings`}
                className="block w-full rounded-lg bg-slate-800 px-4 py-2 text-center text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Edit Venue
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end">
        <Link href="/cricket/venues" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
          ← Back to venues
        </Link>
      </div>
    </AppShell>
  );
}
