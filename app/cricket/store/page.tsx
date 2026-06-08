import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { isCricketMarketplaceEnabled } from "@/lib/config/feature-flags";
import { CricketProductGrid } from "@/components/cricket/commerce/CricketProductGrid";
import { CommerceEmptyState } from "@/components/cricket/commerce/CommerceEmptyState";
import { CricketCheckoutModeNotice } from "@/components/cricket/commerce/CricketCheckoutModeNotice";
import { getCricketMarketplaceProducts } from "@/lib/cricket/commerce/products/queries";
import { getApprovedCricketVendors } from "@/lib/cricket/commerce/vendors/queries";
import { getProductCategories } from "@/lib/cricket/commerce/products/queries";
import { getCommerceMode } from "@/lib/cricket/commerce/policy";

export const metadata: Metadata = { title: "Cricket Store — GameIQ" };

interface Props {
  searchParams: Promise<{ category?: string; vendor?: string; q?: string }>;
}

export default async function CricketStorePage({ searchParams }: Props) {
  const params = await searchParams;

  if (!isCricketMarketplaceEnabled()) {
    return (
      <AppShell>
        <PageHeader title="Cricket Store" description="Browse cricket equipment, apparel, and team services." />
        <CommerceEmptyState
          title="Marketplace coming soon"
          description="The cricket marketplace is not yet enabled on this deployment."
          icon="🛒"
        />
      </AppShell>
    );
  }

  const [products, vendors, categories] = await Promise.all([
    getCricketMarketplaceProducts({
      categoryId: params.category,
      vendorId: params.vendor,
      search: params.q,
    }).catch(() => []),
    getApprovedCricketVendors().catch(() => []),
    getProductCategories().catch(() => []),
  ]);

  const vendorSlugs = Object.fromEntries(vendors.map((v) => [v.id, v.slug]));
  const mode = getCommerceMode();

  return (
    <AppShell>
      <PageHeader
        title="Cricket Store"
        description="Browse approved cricket equipment, apparel, team kits, and services."
        action={
          <Link
            href="/cricket/store/vendors"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            All vendors
          </Link>
        }
      />

      <div className="mb-5">
        <CricketCheckoutModeNotice mode={mode} />
      </div>

      {/* Category filter pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <Link
            href="/cricket/store"
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              !params.category
                ? "border-sky-500 bg-sky-500/10 text-sky-400"
                : "border-slate-700 text-slate-400 hover:border-slate-600"
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/cricket/store?category=${cat.id}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                params.category === cat.id
                  ? "border-sky-500 bg-sky-500/10 text-sky-400"
                  : "border-slate-700 text-slate-400 hover:border-slate-600"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {/* Search */}
      <form method="GET" action="/cricket/store" className="mb-6">
        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Search products…"
            className="flex-1 max-w-md rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
          {params.category && <input type="hidden" name="category" value={params.category} />}
        </div>
      </form>

      <CricketProductGrid
        products={products}
        vendorSlugs={vendorSlugs}
        emptyTitle={params.q ? `No results for "${params.q}"` : "No products yet"}
        emptyDescription="No approved products are available right now. Check back soon."
      />

      <div className="mt-8 text-sm text-slate-500 text-right">
        <Link href="/cricket" className="hover:text-slate-300 transition-colors">
          ← Back to Cricket Hub
        </Link>
      </div>
    </AppShell>
  );
}
