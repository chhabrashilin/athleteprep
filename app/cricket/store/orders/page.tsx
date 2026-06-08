import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CricketOrderStatusBadge } from "@/components/cricket/commerce/CricketOrderStatusBadge";
import { CommerceEmptyState } from "@/components/cricket/commerce/CommerceEmptyState";
import { getServerUser } from "@/lib/supabase/server";
import { getUserCricketOrders } from "@/lib/cricket/commerce/orders/queries";

export const metadata: Metadata = { title: "My Orders — Cricket Store — GameIQ" };

export default async function MyOrdersPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/cricket/store/orders");

  const orders = await getUserCricketOrders(user.id).catch(() => []);

  return (
    <AppShell>
      <PageHeader title="My Orders" description="Your cricket store orders and inquiries." />

      {orders.length === 0 ? (
        <CommerceEmptyState
          title="No orders yet"
          description="Your submitted order requests will appear here."
          icon="📦"
          action={
            <Link href="/cricket/store" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">
              Browse store
            </Link>
          }
        />
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
                  <p className="text-sm font-medium text-slate-100">
                    #{order.orderNumber}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(order.submittedAt).toLocaleDateString()}
                    {" · "}
                    {order.orderType.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {order.totalCents > 0 && (
                    <span className="text-sm font-semibold text-slate-200">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: order.currency,
                        minimumFractionDigits: 0,
                      }).format(order.totalCents / 100)}
                    </span>
                  )}
                  <CricketOrderStatusBadge status={order.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
