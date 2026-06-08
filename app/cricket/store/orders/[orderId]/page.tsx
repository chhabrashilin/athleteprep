import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { CricketOrderStatusBadge } from "@/components/cricket/commerce/CricketOrderStatusBadge";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketOrder } from "@/lib/cricket/commerce/orders/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface Props { params: Promise<{ orderId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params;
  const order = await getCricketOrder(orderId);
  if (!order) return { title: "Order not found — GameIQ" };
  return { title: `Order #${order.orderNumber} — GameIQ` };
}

export default async function OrderDetailPage({ params }: Props) {
  const { orderId } = await params;
  const user = await getServerUser();
  if (!user) redirect("/login");

  const order = await getCricketOrder(orderId);
  if (!order) notFound();

  // Verify access
  const supabase = await createServerSupabaseClient();
  if (!supabase) notFound();

  const { data: canView } = await supabase.rpc("user_can_view_cricket_order", {
    p_order_id: orderId,
    p_user_id: user.id,
  });
  if (!canView) notFound();

  const { data: canManage } = await supabase.rpc("user_can_manage_cricket_order", {
    p_order_id: orderId,
    p_user_id: user.id,
  });

  const isBuyer = order.userId === user.id;

  return (
    <AppShell>
      <nav className="text-xs text-slate-500 mb-5 flex items-center gap-1.5">
        <Link href="/cricket/store/orders" className="hover:text-slate-300">My Orders</Link>
        <span>›</span>
        <span className="text-slate-300">#{order.orderNumber}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Order #{order.orderNumber}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Submitted {new Date(order.submittedAt).toLocaleString()}
          </p>
        </div>
        <CricketOrderStatusBadge status={order.status} />
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Payment", value: order.paymentStatus.replace(/_/g, " ") },
          { label: "Fulfilment", value: order.fulfillmentStatus.replace(/_/g, " ") },
          { label: "Mode", value: order.provider.replace(/_/g, " ") },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
            <p className="text-xs text-slate-500 mb-0.5">{item.label}</p>
            <p className="text-sm font-medium text-slate-200 capitalize">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 mb-6">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Order total</h2>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span>
              {order.subtotalCents > 0
                ? new Intl.NumberFormat("en-US", { style: "currency", currency: order.currency, minimumFractionDigits: 0 }).format(order.subtotalCents / 100)
                : "TBC"}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-slate-100 pt-1 border-t border-slate-800">
            <span>Total</span>
            <span>
              {order.totalCents > 0
                ? new Intl.NumberFormat("en-US", { style: "currency", currency: order.currency, minimumFractionDigits: 0 }).format(order.totalCents / 100)
                : "TBC — vendor will confirm"}
            </span>
          </div>
        </div>
      </div>

      {/* Notes (customer-visible) */}
      {order.notes && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 mb-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Notes</h2>
          <p className="text-sm text-slate-300">{order.notes}</p>
        </div>
      )}

      {/* Internal notes — vendor/admin only, never shown to buyer */}
      {canManage && !isBuyer && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 mb-6">
          <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            Internal notes (vendor/admin only)
          </h2>
          <p className="text-sm text-slate-300">
            {/* Internal notes are loaded server-side; shown here for admin/vendor */}
            No internal notes.
          </p>
        </div>
      )}

      <div className="text-right">
        <Link href="/cricket/store/orders" className="text-sm text-slate-500 hover:text-slate-300">
          ← Back to orders
        </Link>
      </div>
    </AppShell>
  );
}
