import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SponsorshipPackageCard } from "@/components/cricket/commerce/SponsorshipPackageCard";
import { SponsorshipInquiryForm } from "@/components/cricket/commerce/SponsorshipInquiryForm";
import { CommerceEmptyState } from "@/components/cricket/commerce/CommerceEmptyState";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketLeagueBySlugFull, userCanManageCricketLeague } from "@/lib/cricket/leagues/queries";
import { getLeagueSponsorshipPackages } from "@/lib/cricket/commerce/sponsorship/actions";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const league = await getCricketLeagueBySlugFull(slug);
  return { title: `Sponsorship — ${league?.name ?? "League"} — GameIQ` };
}

export default async function LeagueSponsorsPage({ params }: Props) {
  const { slug } = await params;
  const user = await getServerUser();

  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) notFound();

  const isAdmin = user ? await userCanManageCricketLeague(user.id, league.id) : false;
  const packages = await getLeagueSponsorshipPackages(league.id, isAdmin).catch(() => []);

  return (
    <AppShell>
      <PageHeader
        title={`${league.name} — Sponsorship`}
        description="Sponsorship packages available for this league."
        action={isAdmin ? (
          <Link
            href={`/cricket/leagues/${slug}/sponsors/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
          >
            <Plus className="h-4 w-4" />
            New package
          </Link>
        ) : undefined}
      />

      {packages.length === 0 ? (
        <CommerceEmptyState
          title="No sponsorship packages"
          description={isAdmin ? "Create a sponsorship package to get started." : "No active sponsorship packages available."}
          icon="🤝"
          action={
            isAdmin ? (
              <Link href={`/cricket/leagues/${slug}/sponsors/new`} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">
                Create package
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <SponsorshipPackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}

      {/* General inquiry section */}
      <div className="mt-10 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-base font-semibold text-slate-100 mb-1">General sponsorship inquiry</h2>
        <p className="text-sm text-slate-400 mb-5">
          Interested in sponsoring {league.name}? Fill out the form below and we&apos;ll be in touch.
        </p>
        <SponsorshipInquiryForm leagueId={league.id} />
      </div>
    </AppShell>
  );
}
