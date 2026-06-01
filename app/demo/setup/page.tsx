import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  Film,
  Tag,
  BarChart3,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { getServerUser } from "@/lib/supabase/server";
import { checkDemoWorkspaceExists, createDemoWorkspaceFormAction } from "@/app/demo/actions";
import { DEMO_TEAM, DEMO_PLAYERS, DEMO_GAME } from "@/lib/demo/demo-data";

export const metadata: Metadata = { title: "Demo Setup — GameIQ" };

const DEMO_SECTIONS = [
  {
    icon: <Users className="h-4 w-4 text-sky-400" />,
    label: "Demo team",
    description: `${DEMO_TEAM.name} — ${DEMO_TEAM.sport}, ${DEMO_TEAM.location}`,
  },
  {
    icon: <Users className="h-4 w-4 text-sky-400" />,
    label: "Demo roster",
    description: `${DEMO_PLAYERS.length} realistic players with positions, jersey numbers, and roles`,
  },
  {
    icon: <Film className="h-4 w-4 text-sky-400" />,
    label: "Demo game",
    description: `${DEMO_GAME.title} — ${DEMO_GAME.result} · with full coach notes and opponent context`,
  },
  {
    icon: <Tag className="h-4 w-4 text-sky-400" />,
    label: "12 key moments",
    description: "Tagged timestamps covering batting, bowling, fielding, and opponent tendencies",
  },
  {
    icon: <BarChart3 className="h-4 w-4 text-sky-400" />,
    label: "AI report",
    description: "Full coaching insights, player reports, practice recommendations, and opponent tendencies",
  },
];

export default async function DemoSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const mockDataEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === "true";

  // Redirect if feature is disabled
  if (!mockDataEnabled) {
    redirect("/dashboard");
  }

  const [user, params] = await Promise.all([
    getServerUser(),
    searchParams,
  ]);

  if (!user) {
    redirect("/auth/login?next=/demo/setup");
  }

  // Check if demo data already exists
  const existing = await checkDemoWorkspaceExists();
  const errorMessage = params.error;

  return (
    <AppShell>
      <PageHeader
        title="Demo workspace"
        description="Explore GameIQ with a pre-built cricket team, game, and AI report."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Demo setup" }]}
      />

      {/* Error state */}
      {errorMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Setup failed</p>
            <p className="text-xs text-slate-400 mt-0.5">{decodeURIComponent(errorMessage)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: what gets created */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-sm font-semibold text-slate-100">What you get</h2>
              <Badge variant="brand">Demo data</Badge>
            </div>
            <p className="text-xs text-slate-500">
              A realistic cricket team workspace generated for your account. All data is clearly marked as demo content.
            </p>
          </div>

          <ul className="divide-y divide-slate-800/60">
            {DEMO_SECTIONS.map((section, i) => (
              <li key={i} className="flex items-start gap-3 px-5 py-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
                  {section.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200">{section.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-slate-700 shrink-0 mt-0.5" />
              </li>
            ))}
          </ul>
        </div>

        {/* Right: action panel */}
        <div className="space-y-4">
          {existing.exists ? (
            /* Demo already exists */
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-400 mb-1">
                    Demo workspace ready
                  </p>
                  <p className="text-sm text-slate-400">
                    Your demo team, roster, game, and AI report are already set up.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {existing.gameId && (
                  <Link href={`/teams/${existing.teamId}/games/${existing.gameId}/report`}>
                    <Button className="w-full">
                      <BarChart3 className="h-4 w-4" />
                      Open AI report
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Link href={`/teams/${existing.teamId}`}>
                  <Button variant="secondary" className="w-full">
                    Open team workspace
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Create demo */
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-100 mb-1">Create demo workspace</p>
                <p className="text-sm text-slate-400">
                  This creates a full cricket team workspace with roster, a game with 12 tagged
                  key moments, and an AI-generated coaching report. Takes about 10 seconds.
                </p>
              </div>

              <form action={createDemoWorkspaceFormAction}>
                <Button type="submit" className="w-full">
                  <Zap className="h-4 w-4" />
                  Create demo workspace
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}

          {/* Honest context */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-medium text-slate-400 mb-2">About this demo</p>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li>• Sport: Cricket — chosen for founder domain expertise</li>
              <li>• AI report uses your configured provider (mock by default)</li>
              <li>• No video file included — timestamps link to notes instead</li>
              <li>• All player names are fictional</li>
              <li>• Data is created under your account and scoped to your user</li>
              <li>• Only visible when NEXT_PUBLIC_ENABLE_MOCK_DATA=true</li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex-1">
              <Button variant="ghost" className="w-full" size="sm">
                Back to dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
