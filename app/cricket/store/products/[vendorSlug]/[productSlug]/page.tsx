import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AppShell } from "@/components/layout/AppShell";
import { CricketProductPrice } from "@/components/cricket/commerce/CricketProductPrice";
import { CricketVendorBadge } from "@/components/cricket/commerce/CricketVendorBadge";
import { CricketCheckoutModeNotice } from "@/components/cricket/commerce/CricketCheckoutModeNotice";
import { getCricketProductBySlug } from "@/lib/cricket/commerce/products/queries";
import { getCricketVendorBySlug } from "@/lib/cricket/commerce/vendors/queries";
import { getCommerceMode, canShowPrice } from "@/lib/cricket/commerce/policy";

interface Props {
  params: Promise<{ vendorSlug: string; productSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vendorSlug, productSlug } = await params;
  const product = await getCricketProductBySlug(vendorSlug, productSlug);
  if (!product) return { title: "Product not found — GameIQ" };
  return { title: `${product.name} — Cricket Store — GameIQ` };
}

export default async function ProductDetailPage({ params }: Props) {
  const { vendorSlug, productSlug } = await params;

  const [product, vendor] = await Promise.all([
    getCricketProductBySlug(vendorSlug, productSlug),
    getCricketVendorBySlug(vendorSlug),
  ]);

  if (!product || product.status !== "active" || product.approvalStatus !== "approved") {
    notFound();
  }

  const mode = getCommerceMode();
  const showPrice = canShowPrice({
    product_type: product.productType,
    price_cents: product.priceCents,
    inventory_status: product.inventoryStatus,
  });

  const specsEntries = Object.entries(product.specifications ?? {});
  const sizingEntries = Object.entries(product.sizingInfo ?? {});

  return (
    <AppShell>
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500 mb-5 flex items-center gap-1.5">
        <Link href="/cricket/store" className="hover:text-slate-300">Store</Link>
        <span>›</span>
        {vendor && (
          <>
            <Link href={`/cricket/store/vendors/${vendor.slug}`} className="hover:text-slate-300">
              {vendor.name}
            </Link>
            <span>›</span>
          </>
        )}
        <span className="text-slate-300">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-xl bg-slate-800 overflow-hidden">
            {product.imageUrls[0] ? (
              <Image
                src={product.imageUrls[0]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-7xl text-slate-600">
                🏏
              </div>
            )}
          </div>
          {product.imageUrls.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.imageUrls.slice(1, 5).map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg bg-slate-800 overflow-hidden">
                  <Image src={url} alt={`${product.name} ${i + 2}`} fill className="object-cover" sizes="80px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-5">
          {product.tags.length > 0 && (
            <p className="text-xs text-slate-500">{product.tags.join(" · ")}</p>
          )}
          <h1 className="text-2xl font-bold text-slate-100">{product.name}</h1>

          {vendor && <CricketVendorBadge vendor={vendor} />}

          {/* Price */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <CricketProductPrice
              product={{
                product_type: product.productType,
                price_cents: product.priceCents,
                compare_at_price_cents: product.compareAtPriceCents,
                inventory_status: product.inventoryStatus,
                currency: product.currency,
              }}
              className="text-xl"
            />
            {product.minOrderQuantity > 1 && (
              <p className="text-xs text-slate-500 mt-1">
                Minimum order: {product.minOrderQuantity} units
              </p>
            )}
          </div>

          {/* Checkout mode notice */}
          <CricketCheckoutModeNotice mode={mode} />

          {/* Add to cart / request quote CTA */}
          <Link
            href={`/cricket/store/checkout?product=${product.id}`}
            className="block w-full rounded-lg bg-sky-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
          >
            {showPrice ? "Add to cart" : "Request quote"}
          </Link>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-sm text-slate-300">{product.shortDescription}</p>
          )}
        </div>
      </div>

      {/* Full description */}
      {product.description && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
            Description
          </h2>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-300 whitespace-pre-line">{product.description}</p>
          </div>
        </div>
      )}

      {/* Specifications */}
      {specsEntries.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
            Specifications
          </h2>
          <div className="rounded-xl border border-slate-800 bg-slate-900 divide-y divide-slate-800">
            {specsEntries.map(([key, val]) => (
              <div key={key} className="flex px-5 py-3 text-sm">
                <dt className="w-40 shrink-0 text-slate-500 capitalize">{key.replace(/_/g, " ")}</dt>
                <dd className="text-slate-200">{String(val)}</dd>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sizing */}
      {sizingEntries.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
            Sizing
          </h2>
          <div className="rounded-xl border border-slate-800 bg-slate-900 divide-y divide-slate-800">
            {sizingEntries.map(([key, val]) => (
              <div key={key} className="flex px-5 py-3 text-sm">
                <dt className="w-40 shrink-0 text-slate-500 capitalize">{key.replace(/_/g, " ")}</dt>
                <dd className="text-slate-200">{String(val)}</dd>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
