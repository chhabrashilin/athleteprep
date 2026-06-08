import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CommerceEmptyState } from "@/components/cricket/commerce/CommerceEmptyState";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketLeagueBySlugFull, userCanManageCricketLeague } from "@/lib/cricket/leagues/queries";
import { getVendorsForLeagueAdmin } from "@/lib/cricket/commerce/vendors/queries";
import { VendorApprovalControls } from "./VendorApprovalControls";

interface Props { params: Promise<{ slug: string }> }
export const metadata: Metadata = { title: "Vendor Approvals — GameIQ" };

export default async function LeagueCommerceVendorsPage({ params }: Props) {
  const { slug } = await params;
  const user = await getServerUser();
  if (!user) redirect("/login");

  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) notFound();

  const canManage = await userCanManageCricketLeague(user.id, league.id);
  if (!canManage) notFound();

  const vendors = await getVendorsForLeagueAdmin(league.id).catch(() => []);

  return (
    <AppShell>
      <PageHeader
        title="Vendor Approvals"
        description="Approve or reject vendor applications for this league."
        action={
          <Link href={`/cricket/leagues/${slug}/commerce`} className="text-sm text-slate-500 hover:text-slate-300">
            ← Commerce hub
          </Link>
        }
      />

      {vendors.length === 0 ? (
        <CommerceEmptyState title="No vendor applications" description="Vendor applications will appear here." icon="🏪" />
      ) : (
        <VendorApprovalControls vendors={vendors} leagueSlug={slug} />
      )}
    </AppShell>
  );
}
