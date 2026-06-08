import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { CricketProductGrid } from "@/components/cricket/commerce/CricketProductGrid";
import { getCricketVendorBySlug } from "@/lib/cricket/commerce/vendors/queries";
import { getVendorProducts } from "@/lib/cricket/commerce/products/queries";

interface Props { params: Promise<{ vendorSlug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vendorSlug } = await params;
  const vendor = await getCricketVendorBySlug(vendorSlug);
  if (!vendor) return { title: "Vendor not found — GameIQ" };
  return { title: `${vendor.name} — Cricket Store — GameIQ` };
}

export default async function VendorProfilePage({ params }: Props) {
  const { vendorSlug } = await params;
  const vendor = await getCricketVendorBySlug(vendorSlug);

  if (!vendor || vendor.status !== "approved") notFound();

  const allProducts = await getVendorProducts(vendor.id).catch(() => []);
  const publicProducts = allProducts.filter(
    (p) => p.status === "active" && p.visibility === "public" && p.approvalStatus === "approved"
  );
  const vendorSlugs = { [vendor.id]: vendor.slug };

  return (
    <AppShell>
      <nav className="text-xs text-slate-500 mb-5 flex items-center gap-1.5">
        <Link href="/cricket/store" className="hover:text-slate-300">Store</Link>
        <span>›</span>
        <Link href="/cricket/store/vendors" className="hover:text-slate-300">Vendors</Link>
        <span>›</span>
        <span className="text-slate-300">{vendor.name}</span>
      </nav>

      {/* Vendor header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-300 overflow-hidden shrink-0">
            {vendor.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vendor.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              vendor.name.charAt(0)
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-100">{vendor.name}</h1>
            <p className="text-sm text-slate-500">
              {vendor.vendorType.replace(/_/g, " ")}
              {vendor.city ? ` · ${vendor.city}` : ""}
              {vendor.country ? `, ${vendor.country}` : ""}
            </p>
            {vendor.description && (
              <p className="text-sm text-slate-300 mt-2">{vendor.description}</p>
            )}
            {vendor.websiteUrl && (
              <a
                href={vendor.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sky-400 hover:underline mt-1 inline-block"
              >
                {vendor.websiteUrl}
              </a>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Products ({publicProducts.length})
      </h2>

      <CricketProductGrid
        products={publicProducts}
        vendorSlugs={vendorSlugs}
        emptyTitle={`${vendor.name} has no listed products`}
        emptyDescription="This vendor has not listed any public products yet."
      />
    </AppShell>
  );
}
