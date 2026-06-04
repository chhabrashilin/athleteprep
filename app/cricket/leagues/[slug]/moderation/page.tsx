import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketLeagueBySlugFull, userCanManageCricketLeague } from "@/lib/cricket/leagues/queries";
import {
  getCricketReportsForLeague,
  getCricketModerationQueue,
  getCricketModerationActions,
} from "@/lib/cricket/moderation/queries";
import { approveCricketPost, rejectCricketPost, hideCricketContent, resolveCricketReport, dismissCricketReport } from "@/lib/cricket/moderation/actions";
import { Shield, Flag, ClipboardList, CheckCircle, XCircle, EyeOff, AlertTriangle } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ section?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) return { title: "League not found — GameIQ" };
  return { title: `${league.name} Moderation — GameIQ` };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

export default async function ModerationDashboardPage({ params, searchParams }: Props) {
  const [{ slug }, { section = "reports" }] = await Promise.all([params, searchParams]);

  const user = await getServerUser();
  if (!user) redirect("/login");

  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) notFound();

  const canManage = await userCanManageCricketLeague(league.id, user.id);
  if (!canManage) redirect(`/cricket/leagues/${slug}`);

  const [reports, queue, actions] = await Promise.all([
    getCricketReportsForLeague(league.id),
    getCricketModerationQueue(league.id),
    getCricketModerationActions(league.id, 30),
  ]);

  const openReports = reports.filter((r) => r.status === "open" || r.status === "reviewing");
  const resolvedReports = reports.filter((r) => r.status === "resolved" || r.status === "dismissed");

  const SECTIONS = [
    { key: "reports", label: "Reports", count: openReports.length },
    { key: "queue", label: "Moderation Queue", count: queue.pendingPosts.length + queue.pendingComments.length },
    { key: "log", label: "Action Log" },
  ] as const;

  return (
    <AppShell>
      <PageHeader
        title={`${league.name} — Moderation`}
        description="Review reports, moderate content, and view the action log."
      />

      <div className="mb-4 flex items-center gap-3 text-sm">
        <Link href={`/cricket/leagues/${slug}`} className="text-slate-500 hover:text-slate-300 transition-colors">
          ← {league.name}
        </Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300">Moderation</span>
      </div>

      {/* Section tabs */}
      <div className="mb-5 flex gap-1" role="tablist" aria-label="Moderation sections">
        {SECTIONS.map((s) => (
          <Link
            key={s.key}
            href={`/cricket/leagues/${slug}/moderation?section=${s.key}`}
            role="tab"
            aria-selected={section === s.key}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              section === s.key ? "bg-sky-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {s.label}
            {"count" in s && (s.count ?? 0) > 0 && (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                {s.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Reports section */}
      {section === "reports" && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Flag className="h-3.5 w-3.5" aria-hidden="true" />
            Open Reports ({openReports.length})
          </h2>
          {openReports.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No open reports.</p>
          ) : (
            openReports.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-rose-400 uppercase tracking-wide">{r.reason}</p>
                    <p className="text-sm text-slate-300 mt-1">
                      Target: <span className="font-mono text-xs text-slate-500">{r.targetType} / {r.targetId.slice(0, 8)}…</span>
                    </p>
                    {r.details && <p className="text-xs text-slate-500 mt-1">{r.details}</p>}
                    <p className="text-xs text-slate-600 mt-1">{formatDate(r.createdAt)}</p>
                  </div>
                  <span className={`text-xs rounded px-1.5 py-0.5 ${r.status === "open" ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"}`}>
                    {r.status}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <form action={async () => { "use server"; await resolveCricketReport(r.id); }}>
                    <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-600/30 transition-colors">
                      <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" /> Resolve
                    </button>
                  </form>
                  <form action={async () => { "use server"; await dismissCricketReport(r.id); }}>
                    <button type="submit" className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 transition-colors">
                      <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Dismiss
                    </button>
                  </form>
                  <form action={async () => { "use server"; await hideCricketContent(r.targetType, r.targetId, r.reason); }}>
                    <button type="submit" className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 transition-colors">
                      <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> Hide Content
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}

          {resolvedReports.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-300">
                Resolved/Dismissed ({resolvedReports.length})
              </summary>
              <div className="mt-2 space-y-2">
                {resolvedReports.map((r) => (
                  <div key={r.id} className="rounded-lg border border-slate-800 px-4 py-2 opacity-60">
                    <p className="text-xs text-slate-400">{r.reason} — {r.targetType} — <span className="text-slate-600">{r.status}</span></p>
                    <p className="text-xs text-slate-600">{formatDate(r.createdAt)}</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Moderation queue */}
      {section === "queue" && (
        <div className="space-y-5">
          {/* Pending posts */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
              <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
              Pending Posts ({queue.pendingPosts.length})
            </h2>
            {queue.pendingPosts.length === 0 ? (
              <p className="text-sm text-slate-500">No pending posts.</p>
            ) : (
              <div className="space-y-2">
                {queue.pendingPosts.map((p) => (
                  <div key={p.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    {p.title && <p className="text-sm font-semibold text-slate-200 mb-1">{p.title}</p>}
                    <p className="text-sm text-slate-400 line-clamp-3">{p.body}</p>
                    <p className="text-xs text-slate-600 mt-1">{formatDate(p.createdAt)}</p>
                    <div className="mt-2 flex gap-2">
                      <form action={async () => { "use server"; await approveCricketPost(p.id); }}>
                        <button type="submit" className="rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-600/30 transition-colors">
                          Approve
                        </button>
                      </form>
                      <form action={async () => { "use server"; await rejectCricketPost(p.id); }}>
                        <button type="submit" className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 transition-colors">
                          Reject
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flagged messages */}
          {queue.flaggedMessages.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                Flagged Thread Messages ({queue.flaggedMessages.length})
              </h2>
              <div className="space-y-2">
                {queue.flaggedMessages.map((m) => (
                  <div key={m.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                    <p className="text-sm text-slate-400">{m.body}</p>
                    <p className="text-xs text-slate-600 mt-1">{formatDate(m.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action log */}
      {section === "log" && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            Recent Actions ({actions.length})
          </h2>
          {actions.length === 0 ? (
            <p className="text-sm text-slate-500">No moderation actions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" aria-label="Moderation action log">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="py-2 pr-4 text-left font-semibold text-slate-500">Action</th>
                    <th className="py-2 pr-4 text-left font-semibold text-slate-500">Target</th>
                    <th className="py-2 pr-4 text-left font-semibold text-slate-500">Reason</th>
                    <th className="py-2 text-left font-semibold text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {actions.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2 pr-4 font-medium text-slate-300">{a.action}</td>
                      <td className="py-2 pr-4 text-slate-500 font-mono">{a.targetType}/{a.targetId.slice(0, 8)}…</td>
                      <td className="py-2 pr-4 text-slate-500">{a.reason ?? "—"}</td>
                      <td className="py-2 text-slate-600">{formatDate(a.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
