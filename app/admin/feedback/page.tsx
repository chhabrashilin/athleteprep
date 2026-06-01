import Link from "next/link";
import { redirect } from "next/navigation";
import { Zap, ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AccessRequestsTable } from "@/components/admin/AccessRequestsTable";
import { ProductFeedbackTable } from "@/components/admin/ProductFeedbackTable";
import { FeedbackList } from "@/components/admin/FeedbackList";
import {
  getAccessRequestsForAdmin,
  getProductFeedbackForAdmin,
} from "@/lib/db/feedback";
import { getServerUser } from "@/lib/supabase/server";

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function averageRating(ratings: (number | null)[]): string {
  const valid = ratings.filter((r): r is number => r !== null);
  if (!valid.length) return "—";
  return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1);
}

export default async function AdminFeedbackPage() {
  const user = await getServerUser();

  // Must be authenticated
  if (!user) {
    redirect("/auth/login?next=/admin/feedback");
  }

  // Must be in admin allowlist
  const adminEmails = getAdminEmails();
  const userEmail = user.email?.toLowerCase() ?? "";

  if (!adminEmails.includes(userEmail)) {
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
            <p className="text-sm text-slate-400">
              This page is restricted to authorized admins. If you believe this is an error,
              check the <code className="text-sky-400">ADMIN_EMAILS</code> environment variable.
            </p>
            <div className="mt-6">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Fetch data
  let accessRequests: Awaited<ReturnType<typeof getAccessRequestsForAdmin>> = [];
  let productFeedback: Awaited<ReturnType<typeof getProductFeedbackForAdmin>> = [];
  let fetchError: string | null = null;

  try {
    [accessRequests, productFeedback] = await Promise.all([
      getAccessRequestsForAdmin(),
      getProductFeedbackForAdmin(),
    ]);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load data.";
  }

  const avgRating = averageRating(productFeedback.map((f) => f.usefulness_rating));

  const sportCounts = productFeedback.reduce<Record<string, number>>((acc, f) => {
    if (f.sport) acc[f.sport] = (acc[f.sport] ?? 0) + 1;
    return acc;
  }, {});
  const roleCounts = accessRequests.reduce<Record<string, number>>((acc, r) => {
    acc[r.role] = (acc[r.role] ?? 0) + 1;
    return acc;
  }, {});

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
            <span className="text-xs text-slate-500 border border-slate-700 rounded px-2 py-0.5">
              Admin
            </span>
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
            <h1 className="text-2xl font-bold text-slate-100 mb-1">Feedback Review</h1>
            <p className="text-sm text-slate-500">
              Early-user access requests and product feedback — read-only, founder view.
            </p>
          </div>

          {fetchError && (
            <div className="mb-8 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              {fetchError}
            </div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-10">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
              <p className="text-3xl font-bold text-slate-100">{accessRequests.length}</p>
              <p className="text-xs text-slate-500 mt-1">Access requests</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
              <p className="text-3xl font-bold text-slate-100">{productFeedback.length}</p>
              <p className="text-xs text-slate-500 mt-1">Feedback responses</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
              <p className="text-3xl font-bold text-amber-400">{avgRating}</p>
              <p className="text-xs text-slate-500 mt-1">Avg usefulness (1–5)</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
              <p className="text-3xl font-bold text-sky-400">
                {Object.keys(sportCounts).length || "—"}
              </p>
              <p className="text-xs text-slate-500 mt-1">Sports represented</p>
            </div>
          </div>

          {/* Breakdown chips */}
          {Object.keys(roleCounts).length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">
                Roles in access requests
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(roleCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([role, count]) => (
                    <span
                      key={role}
                      className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300"
                    >
                      {role} · {count}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Access requests */}
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              Access Requests ({accessRequests.length})
            </h2>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <AccessRequestsTable requests={accessRequests} />
            </div>
          </section>

          {/* Product feedback — card view */}
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              Product Feedback — Detail View ({productFeedback.length})
            </h2>
            <FeedbackList feedback={productFeedback} />
          </section>

          {/* Product feedback — table view */}
          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              Product Feedback — Table View
            </h2>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <ProductFeedbackTable feedback={productFeedback} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
