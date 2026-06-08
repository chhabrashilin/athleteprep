import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CommerceEmptyState } from "@/components/cricket/commerce/CommerceEmptyState";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketLeagueBySlugFull, userCanManageCricketLeague } from "@/lib/cricket/leagues/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface Props { params: Promise<{ slug: string }> }
export const metadata: Metadata = { title: "Sponsorship Inquiries — GameIQ" };

const STATUS_COLOR: Record<string, string> = {
  submitted:  "text-sky-400    bg-sky-400/10   border-sky-500/30",
  reviewing:  "text-amber-400  bg-amber-400/10 border-amber-500/30",
  contacted:  "text-blue-400   bg-blue-400/10  border-blue-500/30",
  quoted:     "text-purple-400 bg-purple-400/10 border-purple-500/30",
  won:        "text-emerald-400 bg-emerald-400/10 border-emerald-500/30",
  lost:       "text-rose-400   bg-rose-400/10  border-rose-500/30",
  archived:   "text-slate-500  bg-slate-800    border-slate-700",
};

export default async function SponsorshipInquiriesPage({ params }: Props) {
  const { slug } = await params;
  const user = await getServerUser();
  if (!user) redirect("/login");

  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) notFound();

  const canManage = await userCanManageCricketLeague(user.id, league.id);
  if (!canManage) notFound();

  const supabase = await createServerSupabaseClient();
  const { data: inquiries } = supabase
    ? await supabase
        .from("cricket_sponsorship_inquiries")
        .select("*")
        .eq("league_id", league.id)
        .order("created_at", { ascending: false })
    : { data: null };

  const items = inquiries ?? [];

  return (
    <AppShell>
      <PageHeader title="Sponsorship Inquiries" description={`Incoming sponsorship inquiries for ${league.name}.`} />

      {items.length === 0 ? (
        <CommerceEmptyState title="No inquiries yet" description="Sponsorship inquiries will appear here." icon="📩" />
      ) : (
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Company</th>
                <th className="px-5 py-3 text-left">Contact</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.map((inq: Record<string, unknown>) => (
                <tr key={inq.id as string} className="hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-100">{inq.company_name as string}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-400">
                    {inq.contact_name as string}
                    <br />
                    <span className="text-xs">{inq.contact_email as string}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[inq.status as string] ?? "text-slate-400 bg-slate-800 border-slate-700"}`}>
                      {(inq.status as string).replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">
                    {new Date(inq.created_at as string).toLocaleDateString()}
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
