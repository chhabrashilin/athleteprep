import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { isCricketEnabled } from "@/lib/config/feature-flags";
import { CricketModuleCard } from "@/components/cricket/CricketModuleCard";
import { CricketEmptyState } from "@/components/cricket/CricketEmptyState";
import { getCricketLeagues, getCricketTeams, getUpcomingCricketMatches } from "@/lib/cricket/queries";
import type { CricketModuleStatus } from "@/components/cricket/CricketStatusBadge";

export const metadata: Metadata = { title: "Cricket Hub — GameIQ" };

interface Module {
  name: string;
  description: string;
  status: CricketModuleStatus;
  href?: string;
}

const PRIMARY_MODULES: Module[] = [
  {
    name: "League Management",
    description: "Create and manage cricket leagues with rules, visibility, member roles, and setup readiness.",
    status: "available",
    href: "/cricket/leagues",
  },
  {
    name: "Tournaments",
    description: "Run multi-stage tournaments, group stages, and knockout brackets.",
    status: "foundation_ready",
    href: "/cricket/tournaments",
  },
  {
    name: "Team Registration",
    description: "Register teams, manage rosters, captain assignment, and player profiles within a cricket league.",
    status: "available",
    href: "/cricket/leagues",
  },
  {
    name: "Players",
    description: "Cricket player profiles, batting/bowling styles, and career statistics.",
    status: "foundation_ready",
    href: "/cricket/players",
  },
  {
    name: "Match Scheduling",
    description: "Schedule matches, generate fixtures, detect conflicts, and publish league calendars.",
    status: "available",
    href: "/cricket/leagues",
  },
  {
    name: "Venue Management",
    description: "Add cricket grounds and stadiums with facilities, availability, and contact details.",
    status: "available",
    href: "/cricket/venues",
  },
  {
    name: "Reports",
    description: "AI-powered match and performance analysis using the GameIQ report engine.",
    status: "available",
    href: "/dashboard",
  },
];

const ROADMAP_MODULES: { name: string; description: string; status: CricketModuleStatus; href?: string }[] = [
  { name: "Player Profiles",          description: "Detailed batting, bowling, and fielding stats per player.",            status: "available",        href: "/cricket/players" },
  { name: "Match Scheduling",         description: "Create fixtures, assign venues, and manage calendar.",                 status: "available",        href: "/cricket/leagues" },
  { name: "Scorecard Foundation",     description: "Manual scorecard entry, innings, batting/bowling figures, and result finalization.", status: "available", href: "/cricket/matches" },
  { name: "Ball-by-Ball Live Scoring",description: "Real-time over-by-over scoring with commentary, undo, correction, and live viewer.",                     status: "available",      href: "/cricket/leagues" },
  { name: "Full Scorecards",          description: "Complete innings scorecards with batting, bowling, and fall-of-wickets.", status: "available",     href: "/cricket/matches" },
  { name: "Points Table",             description: "Live standings with NRR, wins, losses, and points.",                  status: "coming_soon",      href: "/cricket/points-table" },
  { name: "Leaderboards",             description: "Top batsmen, top bowlers, and all-time records.",                     status: "coming_soon" },
  { name: "Wagon Wheel",              description: "Shot-placement visualization per batsman.",                           status: "coming_soon",      href: "/cricket/analytics" },
  { name: "Manhattan Graph",          description: "Runs-per-over bar chart across both innings.",                        status: "coming_soon",      href: "/cricket/analytics" },
  { name: "Worm Chart",               description: "Cumulative runs progression over the course of an innings.",          status: "coming_soon",      href: "/cricket/analytics" },
  { name: "Run Rate Graph",           description: "Required vs current run rate trend line.",                            status: "coming_soon",      href: "/cricket/analytics" },
  { name: "Live Streaming",           description: "Stream-quality overlays, score tickers, and broadcast graphics.",     status: "coming_soon",      href: "/cricket/streaming" },
  { name: "Broadcast Overlays",       description: "Lower-thirds, scoreboard widgets, and graphic packs.",                status: "coming_soon",      href: "/cricket/streaming" },
  { name: "Cricket Community",        description: "Fan polls, match discussions, news, and trivia.",                     status: "coming_soon",      href: "/cricket/community" },
  { name: "News, Trivia & Polls",     description: "Curated cricket content and fan engagement tools.",                   status: "coming_soon",      href: "/cricket/community" },
  { name: "Equipment Marketplace",    description: "Bat, gear, and cricket equipment listings.",                          status: "coming_soon",      href: "/cricket/store" },
];

export default async function CricketHubPage() {
  const cricketEnabled = isCricketEnabled();

  if (!cricketEnabled) {
    return (
      <AppShell>
        <PageHeader
          title="Cricket Hub"
          description="Manage cricket leagues, teams, matches, players, scorecards, and performance intelligence from one place."
        />
        <CricketEmptyState
          title="Cricket is coming soon."
          description="The cricket section is not yet enabled on this deployment. Check back soon or enable NEXT_PUBLIC_CRICKET_ENABLED=true."
          backHref="/dashboard"
          backLabel="Back to Dashboard"
        />
      </AppShell>
    );
  }

  const [leagues, teams, upcomingMatches] = await Promise.all([
    getCricketLeagues().catch(() => []),
    getCricketTeams().catch(() => []),
    getUpcomingCricketMatches(5).catch(() => []),
  ]);

  const hasDemoData = leagues.length > 0 || teams.length > 0;

  return (
    <AppShell>
      <PageHeader
        title="Cricket Hub"
        description="Manage cricket leagues, teams, matches, players, scorecards, and performance intelligence from one place."
      />

      {/* Primary CTAs */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/cricket/leagues/new"
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Cricket League
        </Link>
        <Link
          href="/cricket/leagues"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-700 transition-all"
        >
          <Trophy className="h-4 w-4" />
          View My Leagues
        </Link>
      </div>

      {/* Active modules */}
      <div className="mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Available now
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRIMARY_MODULES.map((mod) => (
            <CricketModuleCard
              key={mod.name}
              name={mod.name}
              description={mod.description}
              status={mod.status}
              href={mod.href}
            />
          ))}
        </div>
      </div>

      {/* Data counts */}
      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-3">Cricket data</h2>
        {hasDemoData ? (
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-2xl font-bold text-sky-400">{leagues.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {leagues.length === 1 ? "League" : "Leagues"}
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-sky-400">{teams.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {teams.length === 1 ? "Team" : "Teams"}
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-sky-400">{upcomingMatches.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Upcoming matches</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No cricket data found yet.{" "}
            <Link href="/cricket/leagues/new" className="text-sky-400 hover:underline">
              Create your first league
            </Link>{" "}
            to get started.
          </p>
        )}
      </div>

      {/* Full roadmap */}
      <div className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Full feature roadmap
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROADMAP_MODULES.map((mod) => (
            <CricketModuleCard
              key={mod.name}
              name={mod.name}
              description={mod.description}
              status={mod.status}
              href={mod.href}
            />
          ))}
        </div>
      </div>

      {/* CTA: Schedule + Venues */}
      <div className="mt-8 rounded-xl border border-sky-500/20 bg-sky-500/5 px-5 py-4">
        <p className="text-sm font-semibold text-sky-400 mb-1">Match Scheduling Now Available</p>
        <p className="text-sm text-slate-400 mb-3">
          Create venues, generate round-robin fixtures, detect conflicts, and publish your league schedule.
          Open a league to manage its schedule.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/cricket/venues"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
          >
            Cricket Venues
          </Link>
          <Link
            href="/cricket/leagues"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Manage League Schedules
          </Link>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end">
        <Link
          href="/select-sport"
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          ← Back to sport selection
        </Link>
      </div>
    </AppShell>
  );
}
