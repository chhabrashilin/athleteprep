import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getApprovedCricketVendors } from "@/lib/cricket/commerce/vendors/queries";
import { CommerceEmptyState } from "@/components/cricket/commerce/CommerceEmptyState";

export const metadata: Metadata = { title: "Cricket Vendors — GameIQ" };

const TYPE_LABELS: Record<string, string> = {
  equipment:          "Equipment",
  apparel:            "Apparel",
  team_kits:          "Team Kits",
  coaching_services:  "Coaching",
  ground_services:    "Ground Services",
  photography:        "Photography",
  streaming_services: "Streaming",
  sponsor:            "Sponsor",
  other:              "Other",
};

export default async function CricketVendorsPage() {
  const vendors = await getApprovedCricketVendors().catch(() => []);

  return (
    <AppShell>
      <PageHeader
        title="Cricket Vendors"
        description="Browse approved suppliers and service providers for the cricket community."
      />

      {vendors.length === 0 ? (
        <CommerceEmptyState
          title="No approved vendors yet"
          description="Approved vendors will appear here. Vendors must apply and be approved by a league admin."
          icon="🏪"
          action={
            <Link
              href="/cricket/vendor/apply"
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
            >
              Apply as a vendor
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/cricket/store/vendors/${vendor.slug}`}
              className="group rounded-xl border border-slate-800 bg-slate-900 p-5 hover:border-sky-500/40 hover:bg-slate-800/60 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-base font-bold text-slate-300 overflow-hidden shrink-0">
                  {vendor.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={vendor.logoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    vendor.name.charAt(0)
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100 group-hover:text-sky-300 transition-colors">
                    {vendor.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {TYPE_LABELS[vendor.vendorType] ?? vendor.vendorType}
                    {vendor.city ? ` · ${vendor.city}` : ""}
                  </p>
                </div>
              </div>
              {vendor.description && (
                <p className="text-xs text-slate-400 line-clamp-2">{vendor.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-between items-center text-sm text-slate-500">
        <Link href="/cricket/vendor/apply" className="hover:text-sky-400 transition-colors">
          Apply as a vendor →
        </Link>
        <Link href="/cricket/store" className="hover:text-slate-300 transition-colors">
          ← Browse products
        </Link>
      </div>
    </AppShell>
  );
}
