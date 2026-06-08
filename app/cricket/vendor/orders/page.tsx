import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CricketOrderStatusBadge } from "@/components/cricket/commerce/CricketOrderStatusBadge";
import { CommerceEmptyState } from "@/components/cricket/commerce/CommerceEmptyState";
import { getServerUser } from "@/lib/supabase/server";
import { getVendorsByCreator } from "@/lib/cricket/commerce/vendors/queries";
import { getVendorCricketOrders } from "@/lib/cricket/commerce/orders/queries";

export const metadata: Metadata = { title: "Vendor Orders — GameIQ" };

export default async function VendorOrdersPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/cricket/vendor/orders");

  const vendors = await getVendorsByCreator(user.id).catch(() => []);
  const vendor = vendors[0] ?? null;

  const orders = vendor ? await getVendorCricketOrders(vendor.id).catch(() => []) : [];

  return (
    <AppShell>
      <PageHeader title="Vendor Orders" description="Order requests and inquiries for your vendor store." />

      {!vendor ? (
        <CommerceEmptyState title="No vendor account" description="You need a vendor account to receive orders." />
      ) : orders.length === 0 ? (
        <CommerceEmptyState title="No orders yet" description="Order requests from customers will appear here." icon="📦" />
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
                    {order.customerName ? `${order.customerName} · ` : ""}
                    {new Date(order.submittedAt).toLocaleDateString()}
                    {" · "}{order.orderType.replace(/_/g, " ")}
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
