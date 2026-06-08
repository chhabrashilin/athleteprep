"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CricketCheckoutModeNotice } from "@/components/cricket/commerce/CricketCheckoutModeNotice";
import { createCricketOrderRequest } from "@/lib/cricket/commerce/orders/actions";
import type { CommerceMode } from "@/lib/cricket/commerce/policy";

interface Props {
  mode: CommerceMode;
}

export function CheckoutForm({ mode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);

    const result = await createCricketOrderRequest({
      customer_name: fd.get("customer_name") as string,
      customer_email: fd.get("customer_email") as string,
      customer_phone: (fd.get("customer_phone") as string) || null,
      notes: (fd.get("notes") as string) || null,
      items: productId
        ? [
            {
              product_id: productId,
              product_name: (fd.get("product_name") as string) || "Product",
              quantity: 1,
              unit_price_cents: null,
              customization: {},
            },
          ]
        : [],
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Failed to submit order");
    } else {
      router.push(result.data?.checkoutUrl ?? "/cricket/store/orders");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <CricketCheckoutModeNotice mode={mode} />
      <input type="hidden" name="product_name" value="Cricket Product" />

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Full name <span className="text-rose-400">*</span>
        </label>
        <input
          name="customer_name"
          required
          maxLength={200}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          placeholder="Jane Smith"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Email <span className="text-rose-400">*</span>
        </label>
        <input
          name="customer_email"
          type="email"
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          placeholder="jane@example.com"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Phone (optional)</label>
        <input
          name="customer_phone"
          type="tel"
          maxLength={30}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Notes (optional)</label>
        <textarea
          name="notes"
          rows={3}
          maxLength={2000}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none resize-none"
          placeholder="Any special requirements or questions…"
        />
      </div>

      {error && (
        <p className="text-sm text-rose-400 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
      >
        {loading
          ? "Submitting…"
          : mode === "checkout_provider_configured"
          ? "Place order"
          : "Submit request"}
      </button>
    </form>
  );
}
