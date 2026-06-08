import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketTeamBySlug } from "@/lib/cricket/teams/queries";
import { getTeamKitRequest } from "@/lib/cricket/commerce/team-kits/actions";

interface Props { params: Promise<{ teamSlug: string; requestId: string }> }
export const metadata: Metadata = { title: "Kit Request — GameIQ" };

export default async function KitRequestDetailPage({ params }: Props) {
  const { teamSlug, requestId } = await params;
  const user = await getServerUser();
  if (!user) redirect("/login");

  const [team, req] = await Promise.all([
    getCricketTeamBySlug(teamSlug).catch(() => null),
    getTeamKitRequest(requestId).catch(() => null),
  ]);

  if (!team || !req || req.teamId !== team.id) notFound();

  const statusColor = req.status === "delivered" ? "text-emerald-400" : req.status === "cancelled" ? "text-rose-400" : "text-sky-400";

  return (
    <AppShell>
      <nav className="text-xs text-slate-500 mb-5 flex items-center gap-1.5">
        <Link href={`/cricket/teams/${teamSlug}/kits`} className="hover:text-slate-300">Kit requests</Link>
        <span>›</span>
        <span className="text-slate-300 capitalize">{req.kitType.replace(/_/g, " ")}</span>
      </nav>

      <PageHeader title={`Kit Request — ${req.kitType.replace(/_/g, " ")}`} description="" />

      {/* Status */}
      <div className={`mb-6 inline-flex items-center rounded-full border border-current/20 bg-current/5 px-3 py-1 text-sm font-semibold capitalize ${statusColor}`}>
        {req.status.replace(/_/g, " ")}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        {[
          { label: "Kit type",   value: req.kitType.replace(/_/g, " ")                },
          { label: "Players",    value: req.quantityPlayers ?? "—"                    },
          { label: "Staff",      value: req.quantityStaff ?? "—"                      },
          { label: "Deadline",   value: req.deliveryDeadline ?? "Not set"             },
          { label: "Budget",     value: req.budgetCents != null ? `$${(req.budgetCents / 100).toFixed(0)}` : "Not specified" },
          { label: "Quote",      value: req.quoteAmountCents != null ? `$${(req.quoteAmountCents / 100).toFixed(0)}` : "Pending" },
        ].map((row) => (
          <div key={row.label} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
            <p className="text-xs text-slate-500 mb-0.5">{row.label}</p>
            <p className="text-sm font-medium text-slate-100 capitalize">{String(row.value)}</p>
          </div>
        ))}
      </div>

      {/* Colors */}
      {(req.primaryColor || req.secondaryColor || req.accentColor) && (
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Colors</p>
          <div className="flex gap-3">
            {req.primaryColor && (
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full border border-slate-700" style={{ backgroundColor: req.primaryColor }} />
                <span className="text-xs text-slate-400">Primary</span>
              </div>
            )}
            {req.secondaryColor && (
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full border border-slate-700" style={{ backgroundColor: req.secondaryColor }} />
                <span className="text-xs text-slate-400">Secondary</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Design notes */}
      {req.designNotes && (
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Design notes</p>
          <p className="text-sm text-slate-300 whitespace-pre-line">{req.designNotes}</p>
        </div>
      )}
    </AppShell>
  );
}
