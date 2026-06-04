import type { Metadata } from "next";
import Link from "next/link";
import { Plus, MapPin, Calendar, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketLeaguesForUser } from "@/lib/cricket/leagues/queries";
import type { CricketLeagueFull } from "@/lib/cricket/types";

export const metadata: Metadata = { title: "Cricket Leagues — GameIQ" };

const VISIBILITY_BADGES: Record<string, { label: string; color: string }> = {
  private: { label: "Private", color: "text-slate-400 bg-slate-800 border-slate-700" },
  unlisted: { label: "Unlisted", color: "text-amber-400 bg-amber-400/10 border-amber-500/30" },
  public: { label: "Public", color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/30" },
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "text-slate-400 bg-slate-800 border-slate-700" },
  open: { label: "Open", color: "text-sky-400 bg-sky-400/10 border-sky-500/30" },
  closed: { label: "Closed", color: "text-slate-500 bg-slate-800 border-slate-700" },
  archived: { label: "Archived", color: "text-rose-400 bg-rose-400/10 border-rose-500/30" },
};

function LeagueRow({ league }: { league: CricketLeagueFull }) {
  const vis = VISIBILITY_BADGES[league.visibility] ?? VISIBILITY_BADGES.private;
  const status = STATUS_BADGES[league.registrationStatus] ?? STATUS_BADGES.draft;

  return (
    <Link
      href={`/cricket/leagues/${league.slug}`}
      className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 hover:border-sky-500/40 hover:bg-slate-800/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      aria-label={`View ${league.name}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-slate-100 group-hover:text-sky-300 transition-colors">
            {league.name}
          </h3>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${vis.color}`}
          >
            {vis.label}
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${status.color}`}
          >
            {status.label}
          </span>
        </div>
        {league.seasonName && (
          <p className="text-xs text-slate-500 mt-0.5">{league.seasonName}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 shrink-0">
        {(league.city || league.country) && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {[league.city, league.country].filter(Boolean).join(", ")}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {league.oversPerInnings}-over {league.format.replace("_", " ")}
        </span>
      </div>

      <span className="text-xs font-medium text-sky-500 group-hover:text-sky-400 shrink-0 hidden sm:block">
        Open →
      </span>
    </Link>
  );
}

export default async function CricketLeaguesPage() {
  const user = await getServerUser();

  if (!user) {
    return (
      <AppShell>
        <PageHeader
          title="Cricket Leagues"
          description="Create and manage cricket leagues with round-robin, knockout, and group stage formats."
        />
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-10 text-center">
          <Trophy className="h-8 w-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300 mb-1">Sign in to view your leagues</p>
          <p className="text-xs text-slate-500 mb-5">
            Your cricket leagues are private by default. Sign in to create or manage leagues.
          </p>
          <Link
            href="/auth/login?redirectTo=/cricket/leagues"
            className="inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </AppShell>
    );
  }

  const leagues = await getCricketLeaguesForUser(user.id);

  return (
    <AppShell>
      <div className="mb-6 flex items-start justify-between gap-4">
        <PageHeader
          title="Cricket Leagues"
          description="Manage your cricket leagues — season setup, teams, rules, and scheduling."
        />
        <Link
          href="/cricket/leagues/new"
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create League
        </Link>
      </div>

      {leagues.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-14 text-center">
          <Trophy className="h-10 w-10 text-slate-600 mx-auto mb-4" />
          <h2 className="text-base font-semibold text-slate-300 mb-2">No cricket leagues yet</h2>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            Create your first cricket league to start managing seasons, teams, fixtures, and standings.
          </p>
          <Link
            href="/cricket/leagues/new"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create your first league
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {leagues.map((league) => (
            <LeagueRow key={league.id} league={league} />
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between text-xs text-slate-600">
        <Link href="/cricket" className="hover:text-slate-400 transition-colors">
          ← Cricket Hub
        </Link>
        <span>Showing leagues you belong to</span>
      </div>
    </AppShell>
  );
}
