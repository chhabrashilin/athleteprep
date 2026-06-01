import Link from "next/link";
import { redirect } from "next/navigation";
import { Zap, ArrowLeft, ShieldAlert, TrendingUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getServerUser } from "@/lib/supabase/server";
import {
  getAnalyticsSummaryForAdmin,
  getFunnelSummaryForAdmin,
  getRecentProductEventsForAdmin,
} from "@/lib/db/product-events";
import {
  getAccessRequestsForAdmin,
  getProductFeedbackForAdmin,
} from "@/lib/db/feedback";

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

function AccessDenied() {
  return (
    <div className="min-h-full bg-slate-950">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-100">GameIQ</span>
          </Link>
        </div>
      </nav>
      <main className="pt-16 flex items-center justify-center min-h-[70vh]">
        <div className="text-center max-w-sm px-6">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
              <ShieldAlert className="h-7 w-7 text-red-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mb-2">Access denied</h1>
          <p className="text-sm text-slate-400 mb-1">
            This page is restricted to authorized admins.
          </p>
          <p className="text-xs text-slate-600 mb-6">
            Set the <code className="text-sky-400">ADMIN_EMAILS</code> environment variable to
            include your email address.
          </p>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const user = await getServerUser();
  if (!user) redirect("/auth/login?next=/admin/analytics");

  const adminEmails = getAdminEmails();
  const userEmail = user.email?.toLowerCase() ?? "";
  if (!adminEmails.includes(userEmail)) return <AccessDenied />;

  // Fetch all data — individual failures are caught inside each function
  const [summary, funnel, recentEvents, accessRequests, productFeedback] =
    await Promise.all([
      getAnalyticsSummaryForAdmin(),
      getFunnelSummaryForAdmin(),
      getRecentProductEventsForAdmin(50),
      getAccessRequestsForAdmin(),
      getProductFeedbackForAdmin(),
    ]);

  const avgRating =
    productFeedback.length > 0
      ? (
          productFeedback
            .filter((f) => f.usefulness_rating !== null)
            .reduce((a, f) => a + (f.usefulness_rating ?? 0), 0) /
          Math.max(productFeedback.filter((f) => f.usefulness_rating !== null).length, 1)
        ).toFixed(1)
      : "—";

  const maxFunnelCount = Math.max(...funnel.map((s) => s.count), 1);

  return (
    <div className="min-h-full bg-slate-950">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-100">GameIQ</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/admin/feedback">
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-3.5 w-3.5" />
                Feedback
              </Button>
            </Link>
            <span className="text-xs text-slate-500 border border-slate-700 rounded px-2 py-0.5">Admin</span>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-sky-400" />
              Product Analytics
            </h1>
            <p className="text-sm text-slate-500">
              First-party founder analytics — privacy-conscious, no third-party tracking.
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-10">
            {[
              { label: "Users", value: summary.totalUsers },
              { label: "Teams", value: summary.totalTeams },
              { label: "Games", value: summary.totalGames },
              { label: "Reports", value: summary.totalReports },
              { label: "Share links", value: summary.totalShareLinks },
              { label: "Exports", value: summary.totalExports },
              { label: "Access requests", value: summary.totalAccessRequests },
              { label: "Feedback responses", value: summary.totalFeedback },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
                <p className="text-2xl font-bold text-slate-100">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Funnel */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              Product Funnel
              <span className="text-xs text-slate-500 font-normal ml-2">
                (distinct event occurrences — not unique users)
              </span>
            </h2>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-3">
              {funnel.map((step) => {
                const pct = maxFunnelCount > 0 ? Math.round((step.count / maxFunnelCount) * 100) : 0;
                return (
                  <div key={step.eventName} className="flex items-center gap-4">
                    <span className="w-5 text-xs text-slate-600 shrink-0 text-right">{step.step}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-300">{step.label}</span>
                        <span className="text-sm font-semibold text-slate-100 ml-4 shrink-0">{step.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800">
                        <div
                          className="h-1.5 rounded-full bg-sky-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Feedback summary */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-10">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
              <p className="text-3xl font-bold text-amber-400">{avgRating}</p>
              <p className="text-xs text-slate-500 mt-1">Avg usefulness rating (1–5)</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
              <p className="text-3xl font-bold text-slate-100">{accessRequests.length}</p>
              <p className="text-xs text-slate-500 mt-1">Access requests</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
              <p className="text-3xl font-bold text-slate-100">{summary.totalProductEvents}</p>
              <p className="text-xs text-slate-500 mt-1">Product events tracked</p>
            </div>
          </div>

          {/* Recent events */}
          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              Recent Product Events
              <span className="text-xs text-slate-500 font-normal ml-2">(last 50)</span>
            </h2>
            {recentEvents.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
                <p className="text-sm text-slate-500">No events yet. Events are recorded as users interact with the product.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Event</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Context</th>
                      <th className="px-4 py-3">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recentEvents.map((e) => (
                      <tr key={e.id} className="text-slate-300 hover:bg-slate-800/30">
                        <td className="px-4 py-2.5 font-mono text-xs text-sky-300">{e.eventName}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-slate-400">
                            {e.eventCategory}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[200px] truncate">
                          {e.teamId ? `team:${e.teamId.slice(0, 8)}` : ""}
                          {e.gameId ? ` game:${e.gameId.slice(0, 8)}` : ""}
                          {e.reportId ? ` report:${e.reportId.slice(0, 8)}` : ""}
                          {!e.teamId && !e.gameId && !e.reportId ? "—" : ""}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">
                          {new Date(e.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
