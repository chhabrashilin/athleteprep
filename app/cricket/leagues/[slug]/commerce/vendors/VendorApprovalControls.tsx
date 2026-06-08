"use client";

import { useState } from "react";
import { CricketVendorStatusBadge } from "@/components/cricket/commerce/CricketVendorStatusBadge";
import { approveCricketVendor, rejectCricketVendor } from "@/lib/cricket/commerce/vendors/actions";
import type { CricketVendor } from "@/lib/cricket/commerce/vendors/queries";

interface Props {
  vendors: CricketVendor[];
  leagueSlug: string;
}

export function VendorApprovalControls({ vendors: initial }: Props) {
  const [vendors, setVendors] = useState(initial);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function handleApprove(vendorId: string) {
    setActionLoading(vendorId);
    const result = await approveCricketVendor(vendorId);
    if (result.success) {
      setVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? { ...v, status: "approved" } : v))
      );
    }
    setActionLoading(null);
  }

  async function handleReject(vendorId: string) {
    setActionLoading(vendorId);
    const result = await rejectCricketVendor(vendorId, "Rejected by league admin");
    if (result.success) {
      setVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? { ...v, status: "rejected" } : v))
      );
    }
    setActionLoading(null);
  }

  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
            <th className="px-5 py-3 text-left">Vendor</th>
            <th className="px-5 py-3 text-left">Type</th>
            <th className="px-5 py-3 text-left">Status</th>
            <th className="px-5 py-3 text-left">Applied</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {vendors.map((vendor) => (
            <tr key={vendor.id}>
              <td className="px-5 py-3">
                <p className="font-medium text-slate-100">{vendor.name}</p>
                {vendor.contactEmail && (
                  <p className="text-xs text-slate-500">{vendor.contactEmail}</p>
                )}
              </td>
              <td className="px-5 py-3 text-slate-400 capitalize">
                {vendor.vendorType.replace(/_/g, " ")}
              </td>
              <td className="px-5 py-3">
                <CricketVendorStatusBadge status={vendor.status} />
              </td>
              <td className="px-5 py-3 text-slate-500 text-xs">
                {new Date(vendor.createdAt).toLocaleDateString()}
              </td>
              <td className="px-5 py-3 text-right space-x-2">
                {vendor.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(vendor.id)}
                      disabled={actionLoading === vendor.id}
                      className="text-xs rounded bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(vendor.id)}
                      disabled={actionLoading === vendor.id}
                      className="text-xs rounded bg-rose-600 px-3 py-1 text-white hover:bg-rose-500 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
