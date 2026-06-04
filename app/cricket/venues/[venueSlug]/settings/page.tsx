import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCricketVenueBySlug, getVenueAvailability } from "@/lib/cricket/venues/queries";
import { getServerUser } from "@/lib/supabase/server";
import { EditVenueForm } from "@/components/cricket/EditVenueForm";

interface Props {
  params: Promise<{ venueSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { venueSlug } = await params;
  const venue = await getCricketVenueBySlug(venueSlug).catch(() => null);
  return { title: venue ? `Edit ${venue.name} — GameIQ` : "Edit Venue — GameIQ" };
}

export default async function VenueSettingsPage({ params }: Props) {
  const { venueSlug } = await params;
  const user = await getServerUser();
  if (!user) redirect("/auth");

  const venue = await getCricketVenueBySlug(venueSlug).catch(() => null);
  if (!venue) notFound();

  if (venue.createdBy !== user.id) {
    redirect(`/cricket/venues/${venueSlug}`);
  }

  const availability = await getVenueAvailability(venue.id).catch(() => []);

  return (
    <AppShell>
      <PageHeader
        title={`Edit ${venue.name}`}
        description="Update venue details, facilities, and weekly availability."
      />

      <div className="max-w-2xl space-y-8">
        <EditVenueForm venue={venue} availability={availability} />

        {/* Archive section */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
          <h3 className="text-sm font-semibold text-red-400 mb-2">Archive Venue</h3>
          <p className="text-xs text-slate-400 mb-4">
            Archiving a venue removes it from scheduling lists. Existing matches are not affected.
            This action can be undone by contacting support.
          </p>
          <form action={`/api/cricket/venues/${venue.id}/archive`} method="POST">
            <button
              type="submit"
              className="rounded-lg border border-red-500/30 bg-transparent px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Archive venue
            </button>
          </form>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end">
        <Link
          href={`/cricket/venues/${venueSlug}`}
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          ← Back to venue
        </Link>
      </div>
    </AppShell>
  );
}
