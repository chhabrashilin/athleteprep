import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CricketProductApprovalBadge } from "@/components/cricket/commerce/CricketProductApprovalBadge";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketProductById } from "@/lib/cricket/commerce/products/queries";
import { userCanManageCricketVendor } from "@/lib/cricket/commerce/vendors/queries";

interface Props { params: Promise<{ productId: string }> }

export const metadata: Metadata = { title: "Edit Product — GameIQ" };

export default async function EditProductPage({ params }: Props) {
  const { productId } = await params;
  const user = await getServerUser();
  if (!user) redirect("/login");

  const product = await getCricketProductById(productId);
  if (!product) notFound();

  // Auth check
  const isOwner = product.createdAt != null;
  const canManage = product.vendorId
    ? await userCanManageCricketVendor(user.id, product.vendorId)
    : false;

  if (!isOwner && !canManage) notFound();

  return (
    <AppShell>
      <PageHeader title={`Edit: ${product.name}`} description="Update product information and submit for approval." action={
        <CricketProductApprovalBadge status={product.approvalStatus} />
      } />

      <div className="max-w-xl">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 mb-6 text-sm space-y-2">
          <div className="flex justify-between text-slate-400">
            <span>Product type</span>
            <span className="text-slate-200 capitalize">{product.productType.replace(/_/g, " ")}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Status</span>
            <span className="text-slate-200 capitalize">{product.status}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Approval</span>
            <CricketProductApprovalBadge status={product.approvalStatus} />
          </div>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          Full product editing is available in the next release. To submit for approval or archive,
          use the API actions directly. For now, use the product creation form to start a new listing.
        </p>

        <div className="flex gap-3">
          <Link
            href="/cricket/vendor/products"
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
          >
            ← Back to products
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
