"use client";

import { canShowPrice } from "@/lib/cricket/commerce/policy";

interface Props {
  product: {
    product_type?: string;
    price_cents?: number | null;
    compare_at_price_cents?: number | null;
    inventory_status?: string;
    currency?: string;
  };
  className?: string;
}

function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function CricketProductPrice({ product, className = "" }: Props) {
  if (!canShowPrice(product)) {
    return (
      <span className={`text-sm font-medium text-amber-400 ${className}`}>
        Request quote
      </span>
    );
  }

  const price = formatCents(product.price_cents!, product.currency);
  const hasCompare =
    product.compare_at_price_cents != null &&
    product.compare_at_price_cents > product.price_cents!;

  return (
    <span className={`flex items-baseline gap-2 ${className}`}>
      <span className="font-semibold text-slate-100">{price}</span>
      {hasCompare && (
        <span className="text-xs text-slate-500 line-through">
          {formatCents(product.compare_at_price_cents!, product.currency)}
        </span>
      )}
    </span>
  );
}
