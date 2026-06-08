import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CommerceEmptyState } from "@/components/cricket/commerce/CommerceEmptyState";
import { SponsorshipPackageCard } from "@/components/cricket/commerce/SponsorshipPackageCard";
import { isCricketSponsorshipEnabled } from "@/lib/config/feature-flags";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SponsorshipPackage } from "@/lib/cricket/commerce/sponsorship/actions";

export const metadata: Metadata = { title: "Sponsorship — Cricket — GameIQ" };

async function getPublicSponsorshipPackages(): Promise<SponsorshipPackage[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_sponsorship_packages")
    .select("*")
    .in("visibility", ["public"])
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id as string,
    leagueId: r.league_id as string,
    teamId: (r.team_id as string | null) ?? null,
    matchId: (r.match_id as string | null) ?? null,
    name: r.name as string,
    slug: r.slug as string,
    description: (r.description as string | null) ?? null,
    packageType: r.package_type as string,
    status: r.status as string,
    visibility: r.visibility as string,
    currency: (r.currency as string) ?? "USD",
    priceCents: (r.price_cents as number | null) ?? null,
    inventoryQuantity: (r.inventory_quantity as number | null) ?? null,
    benefits: (r.benefits as string[]) ?? [],
    placementOptions: (r.placement_options as Record<string, unknown>) ?? {},
    startDate: (r.start_date as string | null) ?? null,
    endDate: (r.end_date as string | null) ?? null,
    createdAt: r.created_at as string,
  }));
}

export default async function SponsorshipDiscoveryPage() {
  if (!isCricketSponsorshipEnabled()) {
    return (
      <AppShell>
        <PageHeader title="Sponsorship" description="" />
        <CommerceEmptyState title="Sponsorship coming soon" description="Sponsorship packages will be listed here." icon="🤝" />
      </AppShell>
    );
  }

  const packages = await getPublicSponsorshipPackages().catch(() => []);

  return (
    <AppShell>
      <PageHeader
        title="Sponsorship Opportunities"
        description="Explore sponsorship packages from cricket leagues and teams."
      />

      {packages.length === 0 ? (
        <CommerceEmptyState
          title="No public sponsorship packages"
          description="Sponsorship packages from leagues will appear here when published."
          icon="🤝"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <SponsorshipPackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
