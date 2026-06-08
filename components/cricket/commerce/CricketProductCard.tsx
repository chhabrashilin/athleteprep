import Link from "next/link";
import Image from "next/image";
import { CricketProductPrice } from "./CricketProductPrice";
import type { CricketProduct } from "@/lib/cricket/commerce/products/queries";

interface Props {
  product: CricketProduct;
  vendorSlug?: string;
}

const INVENTORY_BADGE: Record<string, { label: string; color: string }> = {
  in_stock: { label: "In stock", color: "text-emerald-400 bg-emerald-400/10" },
  low_stock: { label: "Low stock", color: "text-amber-400 bg-amber-400/10" },
  out_of_stock: { label: "Out of stock", color: "text-rose-400 bg-rose-400/10" },
  made_to_order: { label: "Made to order", color: "text-sky-400 bg-sky-400/10" },
  quote_only: { label: "Quote only", color: "text-purple-400 bg-purple-400/10" },
  discontinued: { label: "Discontinued", color: "text-slate-500 bg-slate-800" },
  unknown: { label: "", color: "" },
};

export function CricketProductCard({ product, vendorSlug }: Props) {
  const href = vendorSlug
    ? `/cricket/store/products/${vendorSlug}/${product.slug}`
    : `/cricket/store`;

  const inventoryBadge = INVENTORY_BADGE[product.inventoryStatus] ?? INVENTORY_BADGE.unknown;
  const image = product.imageUrls[0];

  return (
    <Link href={href} className="group block rounded-xl border border-slate-800 bg-slate-900 hover:border-sky-500/40 hover:bg-slate-800/60 transition-all overflow-hidden">
      {/* Product image */}
      <div className="relative h-44 bg-slate-800 flex items-center justify-center overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, 300px"
          />
        ) : (
          <div className="text-4xl text-slate-600 select-none">🏏</div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-slate-500 mb-1 truncate">{product.tags[0] ?? ""}</p>
        <h3 className="text-sm font-semibold text-slate-100 group-hover:text-sky-300 transition-colors line-clamp-2 mb-2">
          {product.name}
        </h3>

        {product.shortDescription && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-3">
            {product.shortDescription}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 mt-auto">
          <CricketProductPrice
            product={{
              product_type: product.productType,
              price_cents: product.priceCents,
              compare_at_price_cents: product.compareAtPriceCents,
              inventory_status: product.inventoryStatus,
              currency: product.currency,
            }}
          />

          {inventoryBadge.label && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${inventoryBadge.color}`}>
              {inventoryBadge.label}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
