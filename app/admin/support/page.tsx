import Link from "next/link";
import { redirect } from "next/navigation";
import { Zap, ArrowLeft, ShieldAlert, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getServerUser } from "@/lib/supabase/server";
import { getSupportRequestsForAdmin } from "@/lib/db/support";
import {
  ISSUE_TYPE_LABELS,
  URGENCY_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  URGENCY_COLORS,
} from "@/types/support";
import type { SupportStatus, SupportIssueType, SupportUrgency } from "@/types/support";

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
          <p className="text-sm text-slate-400 mb-6">
            This page is restricted to authorized admins.
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

export default async function AdminSupportPage() {
  const user = await getServerUser();
  if (!user) redirect("/auth/login?next=/admin/support");

  const adminEmails = getAdminEmails();
  const userEmail = user.email?.toLowerCase() ?? "";
  if (!adminEmails.includes(userEmail)) return <AccessDenied />;

  const requests = await getSupportRequestsForAdmin().catch(() => []);

  const openCount = requests.filter((r) => r.status === "open").length;
  const inReviewCount = requests.filter((r) => r.status === "in_review").length;

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
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                Admin hub
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
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-100 mb-1 flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-sky-400" />
                Support Requests
              </h1>
              <p className="text-sm text-slate-500">
                Review and track pilot coach support submissions.
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-amber-400 font-semibold">{openCount} open</span>
              {inReviewCount > 0 && (
                <span className="text-sky-400 font-semibold">{inReviewCount} in review</span>
              )}
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
            {[
              { label: "Total", value: requests.length },
              { label: "Open", value: openCount },
              { label: "In review", value: inReviewCount },
              { label: "Resolved", value: requests.filter((r) => r.status === "resolved").length },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
                <p className="text-2xl font-bold text-slate-100">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Requests table */}
          {requests.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
              <p className="text-sm text-slate-500">No support requests yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs rounded border px-2 py-0.5 font-medium ${STATUS_COLORS[req.status as SupportStatus] ?? ""}`}
                      >
                        {STATUS_LABELS[req.status as SupportStatus] ?? req.status}
                      </span>
                      <span className="text-xs text-slate-400 border border-slate-700 rounded px-2 py-0.5">
                        {ISSUE_TYPE_LABELS[req.issue_type as SupportIssueType] ?? req.issue_type}
                      </span>
                      {req.urgency && (
                        <span className={`text-xs font-medium ${URGENCY_COLORS[req.urgency as SupportUrgency] ?? ""}`}>
                          {URGENCY_LABELS[req.urgency as SupportUrgency] ?? req.urgency}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-600 whitespace-nowrap">
                      {new Date(req.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="mb-2">
                    <p className="text-sm font-medium text-slate-200">
                      {req.name}
                      {req.team_name && (
                        <span className="text-slate-500 font-normal"> · {req.team_name}</span>
                      )}
                    </p>
                    <a
                      href={`mailto:${req.email}`}
                      className="text-xs text-sky-400 hover:underline"
                    >
                      {req.email}
                    </a>
                    {req.consent_to_contact === false && (
                      <span className="text-xs text-slate-600 ml-2">(no contact consent)</span>
                    )}
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {req.message.length > 400
                      ? req.message.slice(0, 400) + "…"
                      : req.message}
                  </p>

                  {req.related_url && (
                    <p className="mt-2 text-xs text-slate-500 truncate">
                      Link:{" "}
                      <span className="text-slate-400 font-mono">{req.related_url}</span>
                    </p>
                  )}

                  {req.admin_notes && (
                    <div className="mt-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                      <p className="text-xs font-medium text-slate-400 mb-1">Admin notes</p>
                      <p className="text-xs text-slate-300">{req.admin_notes}</p>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-800/60">
                    <p className="text-xs text-slate-600">
                      ID: <span className="font-mono">{req.id}</span>
                      {" · "}
                      Update status in Supabase Dashboard → Table Editor → support_requests
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <p className="text-xs font-medium text-slate-400 mb-2">How to update request status</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Status updates are done in the Supabase Dashboard → Table Editor → support_requests.
              Find the row by ID, update the <code className="text-sky-400">status</code> column
              (open / in_review / resolved / closed), and add <code className="text-sky-400">admin_notes</code> as needed.
              A status update form will be added in a future release.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
