import Link from "next/link";
import { redirect } from "next/navigation";
import { Zap, ArrowLeft, ShieldAlert, TrendingUp, MessageSquare, LifeBuoy, Database } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getServerUser } from "@/lib/supabase/server";

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

const ADMIN_PAGES = [
  {
    href: "/admin/analytics",
    icon: TrendingUp,
    label: "Product Analytics",
    description: "Funnel, event tracking, usage summary",
    color: "text-sky-400",
  },
  {
    href: "/admin/feedback",
    icon: MessageSquare,
    label: "Feedback & Access Requests",
    description: "Coach feedback submissions and pilot interest",
    color: "text-amber-400",
  },
  {
    href: "/admin/support",
    icon: LifeBuoy,
    label: "Support Requests",
    description: "Pilot coach support tickets and deletion requests",
    color: "text-green-400",
  },
  {
    href: "https://supabase.com/dashboard",
    icon: Database,
    label: "Supabase Dashboard",
    description: "Database tables, storage, auth users (external)",
    color: "text-purple-400",
    external: true,
  },
];

export default async function AdminPage() {
  const user = await getServerUser();
  if (!user) redirect("/auth/login?next=/admin");

  const adminEmails = getAdminEmails();
  const userEmail = user.email?.toLowerCase() ?? "";
  if (!adminEmails.includes(userEmail)) return <AccessDenied />;

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
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-100 mb-1">Admin Hub</h1>
            <p className="text-sm text-slate-500">
              Founder-only tools for pilot operations, analytics, and support.
              Signed in as <span className="text-slate-400">{userEmail}</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ADMIN_PAGES.map((page) => {
              const Icon = page.icon;
              return (
                <Link
                  key={page.href}
                  href={page.href}
                  target={page.external ? "_blank" : undefined}
                  rel={page.external ? "noopener noreferrer" : undefined}
                  className="group rounded-xl border border-slate-800 bg-slate-900 p-6 hover:border-slate-700 hover:bg-slate-800/80 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 ${page.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100 group-hover:text-white transition-colors">
                        {page.label}
                        {page.external && (
                          <span className="text-xs text-slate-600 ml-1">↗</span>
                        )}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">{page.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <p className="text-xs font-medium text-slate-400 mb-2">Pilot operations</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              For data deletion, share link revocation, and incident response, refer to the
              operational runbooks in <code className="text-sky-400">/docs/</code>. Data tools
              for pilot operations are documented in{" "}
              <code className="text-sky-400">DATA_DELETION_PLAN.md</code> and{" "}
              <code className="text-sky-400">INCIDENT_RESPONSE_RUNBOOK.md</code>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
