import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketLeagueBySlugFull, userCanManageCricketLeague } from "@/lib/cricket/leagues/queries";
import { getVendorsForLeagueAdmin } from "@/lib/cricket/commerce/vendors/queries";
import { getLeagueCommerceOrders } from "@/lib/cricket/commerce/orders/queries";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const league = await getCricketLeagueBySlugFull(slug);
  return { title: `Commerce — ${league?.name ?? "League"} — GameIQ` };
}

export default async function LeagueCommercePage({ params }: Props) {
  const { slug } = await params;
  const user = await getServerUser();
  if (!user) redirect("/login");

  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) notFound();

  const canManage = await userCanManageCricketLeague(user.id, league.id);
  if (!canManage) notFound();

  const [vendors, orders] = await Promise.all([
    getVendorsForLeagueAdmin(league.id).catch(() => []),
    getLeagueCommerceOrders(league.id).catch(() => []),
  ]);

  const pendingVendors = vendors.filter((v) => v.status === "pending");
  const recentOrders = orders.slice(0, 5);

  return (
    <AppShell>
      <PageHeader
        title={`${league.name} — Commerce`}
        description="Manage vendors, products, orders, and sponsorship for this league."
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: "Pending vendors", value: pendingVendors.length, href: "commerce/vendors", color: pendingVendors.length > 0 ? "text-amber-400" : "text-sky-400" },
          { label: "Total vendors", value: vendors.length, href: "commerce/vendors", color: "text-sky-400" },
          { label: "Recent orders", value: recentOrders.length, href: "commerce/orders", color: "text-sky-400" },
          { label: "Sponsorship inquiries", value: 0, href: `sponsors/inquiries`, color: "text-sky-400" },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={`/cricket/leagues/${slug}/${stat.href}`}
            className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 hover:border-sky-500/40 transition-all"
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Pending vendor approvals */}
      {pendingVendors.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
          <p className="text-sm font-semibold text-amber-400 mb-2">
            {pendingVendors.length} vendor{pendingVendors.length !== 1 ? "s" : ""} awaiting approval
          </p>
          <Link
            href={`/cricket/leagues/${slug}/commerce/vendors`}
            className="text-sm text-amber-400 hover:underline"
          >
            Review vendor applications →
          </Link>
        </div>
      )}

      {/* Nav grid */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Vendors", desc: "Approve, reject, and manage vendors", href: `commerce/vendors` },
          { label: "Products", desc: "Review product approval queue",       href: `commerce/products` },
          { label: "Orders",   desc: "View and manage league orders",       href: `commerce/orders`   },
          { label: "Sponsorship packages", desc: "Create and manage sponsorship", href: `sponsors` },
          { label: "Sponsorship inquiries", desc: "Review incoming inquiries",    href: `sponsors/inquiries` },
        ].map((nav) => (
          <Link
            key={nav.label}
            href={`/cricket/leagues/${slug}/${nav.href}`}
            className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 hover:border-sky-500/40 hover:bg-slate-800/60 transition-all"
          >
            <p className="text-sm font-semibold text-slate-100 mb-1">{nav.label}</p>
            <p className="text-xs text-slate-400">{nav.desc}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
