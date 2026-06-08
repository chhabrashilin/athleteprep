import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CricketOrderStatusBadge } from "@/components/cricket/commerce/CricketOrderStatusBadge";
import { CommerceEmptyState } from "@/components/cricket/commerce/CommerceEmptyState";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketLeagueBySlugFull, userCanManageCricketLeague } from "@/lib/cricket/leagues/queries";
import { getLeagueCommerceOrders } from "@/lib/cricket/commerce/orders/queries";

interface Props { params: Promise<{ slug: string }> }
export const metadata: Metadata = { title: "Commerce Orders — GameIQ" };

export default async function LeagueCommerceOrdersPage({ params }: Props) {
  const { slug } = await params;
  const user = await getServerUser();
  if (!user) redirect("/login");

  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) notFound();

  const canManage = await userCanManageCricketLeague(user.id, league.id);
  if (!canManage) notFound();

  const orders = await getLeagueCommerceOrders(league.id).catch(() => []);

  return (
    <AppShell>
      <PageHeader title="Commerce Orders" description="All orders and inquiries for this league." action={
        <Link href={`/cricket/leagues/${slug}/commerce`} className="text-sm text-slate-500 hover:text-slate-300">
          ← Commerce hub
        </Link>
      } />

      {orders.length === 0 ? (
        <CommerceEmptyState title="No orders yet" description="Order requests will appear here." icon="📦" />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/cricket/store/orders/${order.id}`}
              className="block rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 hover:border-sky-500/40 hover:bg-slate-800/60 transition-all"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-100">#{order.orderNumber}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {order.customerName ?? "Unknown customer"} · {new Date(order.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <CricketOrderStatusBadge status={order.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
