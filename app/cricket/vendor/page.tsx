import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Package, ShoppingBag, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CricketVendorStatusBadge } from "@/components/cricket/commerce/CricketVendorStatusBadge";
import { getServerUser } from "@/lib/supabase/server";
import { getVendorsByCreator } from "@/lib/cricket/commerce/vendors/queries";

export const metadata: Metadata = { title: "Vendor Portal — GameIQ" };

export default async function VendorPortalPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/cricket/vendor");

  const vendors = await getVendorsByCreator(user.id).catch(() => []);
  const hasVendor = vendors.length > 0;

  return (
    <AppShell>
      <PageHeader title="Vendor Portal" description="Manage your vendor listing, products, and orders." />

      {!hasVendor ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-8 py-12 text-center max-w-lg mx-auto">
          <div className="text-5xl mb-4">🏪</div>
          <h2 className="text-lg font-semibold text-slate-200 mb-2">No vendor account yet</h2>
          <p className="text-sm text-slate-400 mb-6">
            Apply to list your cricket products and services on GameIQ. Applications are reviewed by
            league admins before going public.
          </p>
          <Link
            href="/cricket/vendor/apply"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Apply as a vendor
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-100">{vendor.name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {vendor.vendorType.replace(/_/g, " ")}
                  </p>
                </div>
                <CricketVendorStatusBadge status={vendor.status} />
              </div>

              {vendor.status === "pending" && (
                <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-2 text-sm text-amber-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Your application is under review. A league admin will approve it shortly.
                </div>
              )}

              <div className="px-5 py-4 flex flex-wrap gap-3">
                <Link
                  href="/cricket/vendor/products"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
                >
                  <Package className="h-4 w-4" />
                  Products
                </Link>
                <Link
                  href="/cricket/vendor/orders"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Orders
                </Link>
                {vendor.status === "approved" && (
                  <Link
                    href={`/cricket/store/vendors/${vendor.slug}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/5 px-4 py-2 text-sm font-medium text-sky-400 hover:bg-sky-500/10"
                  >
                    View public listing →
                  </Link>
                )}
              </div>
            </div>
          ))}

          <div className="text-right">
            <Link href="/cricket/vendor/apply" className="text-sm text-slate-500 hover:text-sky-400">
              + Apply for another vendor account
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}
