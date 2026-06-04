import type { Metadata } from "next";
import Link from "next/link";
import { Plus, MapPin } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCricketVenues } from "@/lib/cricket/venues/queries";
import { VenueCard } from "@/components/cricket/VenueCard";

export const metadata: Metadata = { title: "Cricket Venues — GameIQ" };

export default async function CricketVenuesPage() {
  const venues = await getCricketVenues().catch(() => []);

  return (
    <AppShell>
      <PageHeader
        title="Cricket Venues"
        description="Manage cricket grounds, stadiums, and practice facilities used for league scheduling."
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/cricket/venues/new"
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Venue
        </Link>
        <Link
          href="/cricket/leagues"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-700 transition-all"
        >
          My Leagues
        </Link>
      </div>

      {venues.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-12 text-center">
          <MapPin className="mx-auto h-8 w-8 text-slate-600 mb-3" />
          <h2 className="text-base font-semibold text-slate-300 mb-2">No cricket venues yet</h2>
          <p className="text-sm text-slate-500 mb-4">
            Add grounds, stadiums, and practice facilities to use them when scheduling matches.
          </p>
          <Link
            href="/cricket/venues/new"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add First Venue
          </Link>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-400">
              {venues.length} {venues.length === 1 ? "venue" : "venues"} total
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} showActions canEdit />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-end">
        <Link href="/cricket" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
          ← Back to Cricket Hub
        </Link>
      </div>
    </AppShell>
  );
}
