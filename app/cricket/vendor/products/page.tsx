import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CricketProductApprovalBadge } from "@/components/cricket/commerce/CricketProductApprovalBadge";
import { CommerceEmptyState } from "@/components/cricket/commerce/CommerceEmptyState";
import { getServerUser } from "@/lib/supabase/server";
import { getVendorsByCreator } from "@/lib/cricket/commerce/vendors/queries";
import { getVendorProducts } from "@/lib/cricket/commerce/products/queries";

export const metadata: Metadata = { title: "Vendor Products — GameIQ" };

export default async function VendorProductsPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/cricket/vendor/products");

  const vendors = await getVendorsByCreator(user.id).catch(() => []);
  const vendor = vendors[0] ?? null;

  const products = vendor ? await getVendorProducts(vendor.id).catch(() => []) : [];

  return (
    <AppShell>
      <PageHeader title="My Products" description="Manage your vendor product listings." action={
        vendor ? (
          <Link
            href="/cricket/vendor/products/new"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New product
          </Link>
        ) : undefined
      } />

      {!vendor ? (
        <CommerceEmptyState
          title="No vendor account"
          description="You need a vendor account to list products."
          action={<Link href="/cricket/vendor/apply" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">Apply as a vendor</Link>}
        />
      ) : products.length === 0 ? (
        <CommerceEmptyState
          title="No products yet"
          description="Create your first product listing."
          icon="📦"
          action={<Link href="/cricket/vendor/products/new" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">Create product</Link>}
        />
      ) : (
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Approval</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-100">{product.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{product.slug}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-400 capitalize">
                    {product.productType.replace(/_/g, " ")}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                      product.status === "active"
                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                        : "border-slate-700 bg-slate-800 text-slate-400"
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <CricketProductApprovalBadge status={product.approvalStatus} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/cricket/vendor/products/${product.id}/edit`}
                      className="text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
