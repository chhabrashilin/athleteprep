import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CommerceEmptyState } from "@/components/cricket/commerce/CommerceEmptyState";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketTeamBySlug } from "@/lib/cricket/teams/queries";
import { getTeamKitRequests } from "@/lib/cricket/commerce/team-kits/actions";
import { isCricketTeamKitOrdersEnabled } from "@/lib/config/feature-flags";

interface Props { params: Promise<{ teamSlug: string }> }
export const metadata: Metadata = { title: "Team Kits — GameIQ" };

const STATUS_COLOR: Record<string, string> = {
  draft:         "text-slate-400  bg-slate-800    border-slate-700",
  submitted:     "text-sky-400    bg-sky-400/10   border-sky-500/30",
  reviewing:     "text-amber-400  bg-amber-400/10 border-amber-500/30",
  quoted:        "text-purple-400 bg-purple-400/10 border-purple-500/30",
  approved:      "text-emerald-400 bg-emerald-400/10 border-emerald-500/30",
  ordered:       "text-blue-400   bg-blue-400/10  border-blue-500/30",
  in_production: "text-blue-400   bg-blue-400/10  border-blue-500/30",
  delivered:     "text-emerald-400 bg-emerald-400/10 border-emerald-500/30",
  cancelled:     "text-rose-400   bg-rose-400/10  border-rose-500/30",
  rejected:      "text-rose-400   bg-rose-400/10  border-rose-500/30",
};

export default async function TeamKitsPage({ params }: Props) {
  const { teamSlug } = await params;
  const user = await getServerUser();
  if (!user) redirect("/login");

  if (!isCricketTeamKitOrdersEnabled()) {
    return (
      <AppShell>
        <PageHeader title="Team Kits" description="" />
        <CommerceEmptyState title="Team kits coming soon" description="This feature is not yet enabled." icon="👕" />
      </AppShell>
    );
  }

  const team = await getCricketTeamBySlug(teamSlug).catch(() => null);
  if (!team) notFound();

  const requests = await getTeamKitRequests(team.id).catch(() => []);

  return (
    <AppShell>
      <PageHeader title={`${team.name} — Team Kits`} description="Kit design requests and order status." action={
        <Link
          href={`/cricket/teams/${teamSlug}/kits/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
        >
          <Plus className="h-4 w-4" />
          New kit request
        </Link>
      } />

      {requests.length === 0 ? (
        <CommerceEmptyState
          title="No kit requests yet"
          description="Submit a kit design request for your team."
          icon="👕"
          action={
            <Link href={`/cricket/teams/${teamSlug}/kits/new`} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">
              Create kit request
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Link
              key={req.id}
              href={`/cricket/teams/${teamSlug}/kits/${req.id}`}
              className="block rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 hover:border-sky-500/40 hover:bg-slate-800/60 transition-all"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100 capitalize">
                    {req.kitType.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(req.createdAt).toLocaleDateString()}
                    {req.deliveryDeadline ? ` · Due ${req.deliveryDeadline}` : ""}
                    {req.quantityPlayers ? ` · ${req.quantityPlayers} players` : ""}
                  </p>
                </div>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[req.status] ?? "text-slate-400 bg-slate-800 border-slate-700"}`}>
                  {req.status.replace(/_/g, " ")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
