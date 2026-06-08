import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CommerceEmptyState } from "@/components/cricket/commerce/CommerceEmptyState";
import { getServerUser } from "@/lib/supabase/server";
import { getOrCreateCricketCart, getCricketCart } from "@/lib/cricket/commerce/cart/actions";

export const metadata: Metadata = { title: "Cart — Cricket Store — GameIQ" };

export default async function CartPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/cricket/store/cart");

  const cartResult = await getOrCreateCricketCart(user.id);
  if (!cartResult.success || !cartResult.data) {
    return (
      <AppShell>
        <PageHeader title="Your Cart" description="" />
        <CommerceEmptyState title="Cart unavailable" description="Could not load your cart." />
      </AppShell>
    );
  }

  const cartData = await getCricketCart(cartResult.data.cartId);
  const cart = cartData.data;

  return (
    <AppShell>
      <PageHeader title="Your Cart" description="Review items before submitting your order request." />

      {!cart || cart.items.length === 0 ? (
        <CommerceEmptyState
          title="Your cart is empty"
          description="Browse the store and add items to your cart."
          icon="🛒"
          action={
            <Link href="/cricket/store" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">
              Browse store
            </Link>
          }
        />
      ) : (
        <div className="max-w-xl space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 divide-y divide-slate-800">
            {cart.items.map((item) => (
              <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100">Product item</p>
                  <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm text-slate-300">
                  {item.unitPriceCents != null
                    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(
                        (item.unitPriceCents * item.quantity) / 100
                      )
                    : "Quote"}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Subtotal:{" "}
              <span className="font-semibold text-slate-100">
                {cart.subtotalCents > 0
                  ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cart.subtotalCents / 100)
                  : "TBC (quote on request)"}
              </span>
            </p>
            <Link
              href="/cricket/store/checkout"
              className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
            >
              Proceed to checkout
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}
