import { CricketProductCard } from "./CricketProductCard";
import { CommerceEmptyState } from "./CommerceEmptyState";
import type { CricketProduct } from "@/lib/cricket/commerce/products/queries";

interface Props {
  products: CricketProduct[];
  vendorSlugs?: Record<string, string>;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function CricketProductGrid({
  products,
  vendorSlugs = {},
  emptyTitle = "No products found",
  emptyDescription = "No approved products match your current filters.",
}: Props) {
  if (!products.length) {
    return (
      <CommerceEmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon="🏏"
      />
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <CricketProductCard
          key={product.id}
          product={product}
          vendorSlug={product.vendorId ? vendorSlugs[product.vendorId] : undefined}
        />
      ))}
    </div>
  );
}
