import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CricketProductApprovalBadge } from "@/components/cricket/commerce/CricketProductApprovalBadge";
import { CommerceEmptyState } from "@/components/cricket/commerce/CommerceEmptyState";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketLeagueBySlugFull, userCanManageCricketLeague } from "@/lib/cricket/leagues/queries";
import { getCricketMarketplaceProducts } from "@/lib/cricket/commerce/products/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface Props { params: Promise<{ slug: string }> }
export const metadata: Metadata = { title: "Product Approvals — GameIQ" };

export default async function LeagueCommerceProductsPage({ params }: Props) {
  const { slug } = await params;
  const user = await getServerUser();
  if (!user) redirect("/login");

  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) notFound();

  const canManage = await userCanManageCricketLeague(user.id, league.id);
  if (!canManage) notFound();

  // Get all products for this league (admin view includes pending)
  const supabase = await createServerSupabaseClient();
  const { data } = supabase
    ? await supabase.from("cricket_products").select("*").eq("league_id", league.id).order("created_at", { ascending: false })
    : { data: null };

  const products = data ?? [];

  return (
    <AppShell>
      <PageHeader title="Product Approvals" description="Review and approve products for this league." action={
        <Link href={`/cricket/leagues/${slug}/commerce`} className="text-sm text-slate-500 hover:text-slate-300">
          ← Commerce hub
        </Link>
      } />

      {products.length === 0 ? (
        <CommerceEmptyState title="No products" description="Products submitted for this league will appear here." icon="📦" />
      ) : (
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {products.map((p: Record<string, unknown>) => (
                <tr key={p.id as string} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-100">{p.name as string}</td>
                  <td className="px-5 py-3 text-slate-400 capitalize">{(p.product_type as string).replace(/_/g, " ")}</td>
                  <td className="px-5 py-3 text-slate-400 capitalize">{p.status as string}</td>
                  <td className="px-5 py-3">
                    <CricketProductApprovalBadge status={p.approval_status as string} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
