import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Globe,
  Mail,
  Settings,
  Users,
  Trophy,
  ClipboardList,
  BookOpen,
  ListOrdered,
  ChevronRight,
  BarChart2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import {
  getCricketLeagueBySlugFull,
  userCanManageCricketLeague,
} from "@/lib/cricket/leagues/queries";
import { getCricketTeamsForLeague } from "@/lib/cricket/teams/queries";
import { getCricketLeagueStandings } from "@/lib/cricket/standings/queries";
import { getCricketTeamStatsSummary } from "@/lib/cricket/stats/queries";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) return { title: "League not found — GameIQ" };
  return { title: `${league.name} — GameIQ` };
}

const FORMAT_LABELS: Record<string, string> = {
  round_robin: "Round Robin",
  knockout: "Knockout",
  group_stage: "Group Stage",
  franchise: "Franchise",
  friendly: "Friendly",
  custom: "Custom",
};

const VISIBILITY_CONFIG: Record<string, { label: string; color: string }> = {
  private: { label: "Private", color: "text-slate-400 bg-slate-800 border-slate-700" },
  unlisted: { label: "Unlisted", color: "text-amber-400 bg-amber-400/10 border-amber-500/30" },
  public: { label: "Public", color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/30" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "text-slate-400 bg-slate-800 border-slate-700" },
  open: { label: "Open", color: "text-sky-400 bg-sky-400/10 border-sky-500/30" },
  closed: { label: "Closed", color: "text-slate-500 bg-slate-800 border-slate-700" },
  archived: { label: "Archived", color: "text-rose-400 bg-rose-400/10 border-rose-500/30" },
};

interface NavModule {
  label: string;
  description: string;
  href?: string;
  available: boolean;
  icon: React.ReactNode;
}

function ModuleCard({ mod }: { mod: NavModule }) {
  const inner = (
    <div
      className={`flex items-center gap-4 rounded-xl border px-5 py-4 transition-all ${
        mod.available
          ? "border-slate-800 bg-slate-900 hover:border-sky-500/40 hover:bg-slate-800/60 cursor-pointer"
          : "border-slate-800/40 bg-slate-900/40 opacity-50 cursor-default"
      }`}
    >
      <div className="shrink-0 rounded-lg bg-slate-800 p-2.5 text-slate-400">
        {mod.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-100">{mod.label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
      </div>
      {mod.available && <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />}
      {!mod.available && (
        <span className="text-xs text-slate-600 shrink-0">Soon</span>
      )}
    </div>
  );

  if (mod.available && mod.href) {
    return (
      <Link
        href={mod.href}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-xl"
      >
        {inner}
      </Link>
    );
  }

  return inner;
}

export default async function CricketLeagueDetailPage({ params }: Props) {
  const { slug } = await params;
  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) notFound();

  const user = await getServerUser();
  const [canManage, teams, standings, statsSummary] = await Promise.all([
    user ? userCanManageCricketLeague(user.id, league.id) : Promise.resolve(false),
    getCricketTeamsForLeague(league.id),
    getCricketLeagueStandings(league.id).catch(() => []),
    getCricketTeamStatsSummary(league.id).catch(() => ({ topRunScorer: null, topWicketTaker: null, bestEconomy: null })),
  ]);

  const vis = VISIBILITY_CONFIG[league.visibility] ?? VISIBILITY_CONFIG.private;
  const status = STATUS_CONFIG[league.registrationStatus] ?? STATUS_CONFIG.draft;

  const modules: NavModule[] = [
    {
      label: "Overview",
      description: "League summary, stats, and activity.",
      href: `/cricket/leagues/${slug}`,
      available: true,
      icon: <Trophy className="h-4 w-4" />,
    },
    {
      label: "Teams",
      description: `Register and manage teams in this league. ${teams.length} team${teams.length !== 1 ? "s" : ""} registered.`,
      href: `/cricket/leagues/${slug}/teams`,
      available: true,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Schedule",
      description: "Fixture calendar, upcoming matches, and schedule management.",
      href: `/cricket/leagues/${slug}/schedule`,
      available: true,
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      label: "Players",
      description: "Player rosters and registrations.",
      available: false,
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      label: "Points Table",
      description: "Live standings with NRR, wins, losses, and run rates.",
      href: `/cricket/leagues/${slug}/points-table`,
      available: true,
      icon: <ListOrdered className="h-4 w-4" />,
    },
    {
      label: "Leaderboards",
      description: "Batting, bowling, fielding, and all-rounder rankings.",
      href: `/cricket/leagues/${slug}/leaderboards`,
      available: true,
      icon: <BarChart2 className="h-4 w-4" />,
    },
    {
      label: "Analytics",
      description: "Worm, Manhattan, wagon wheel, partnerships, and match momentum.",
      href: `/cricket/leagues/${slug}/analytics`,
      available: true,
      icon: <BarChart2 className="h-4 w-4" />,
    },
    {
      label: "Scorecards",
      description: "Ball-by-ball scorecards and innings details.",
      available: false,
      icon: <ClipboardList className="h-4 w-4" />,
    },
  ];

  return (
    <AppShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5">
        <Link href="/cricket" className="hover:text-slate-400 transition-colors">Cricket Hub</Link>
        <span>/</span>
        <Link href="/cricket/leagues" className="hover:text-slate-400 transition-colors">Leagues</Link>
        <span>/</span>
        <span className="text-slate-400">{league.name}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 mb-1">
              {league.name}
            </h1>
            {league.seasonName && (
              <p className="text-sm text-slate-400">{league.seasonName}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${vis.color}`}>
              {vis.label}
            </span>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Format</p>
          <p className="text-sm font-semibold text-slate-200">
            {FORMAT_LABELS[league.format] ?? league.format}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Overs per innings</p>
          <p className="text-sm font-semibold text-slate-200">{league.oversPerInnings}</p>
        </div>
        {(league.city || league.country) && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Location</p>
            <p className="text-sm font-semibold text-slate-200 inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              {[league.city, league.region, league.country].filter(Boolean).join(", ")}
            </p>
          </div>
        )}
        {(league.startDate || league.endDate) && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Season dates</p>
            <p className="text-sm font-semibold text-slate-200 inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              {[league.startDate, league.endDate].filter(Boolean).join(" → ")}
            </p>
          </div>
        )}
        {league.contactEmail && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Contact</p>
            <p className="text-sm font-semibold text-slate-200 inline-flex items-center gap-1.5 truncate">
              <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              {league.contactEmail}
            </p>
          </div>
        )}
        {league.websiteUrl && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Website</p>
            <a
              href={league.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-sky-400 hover:underline inline-flex items-center gap-1.5 truncate"
            >
              <Globe className="h-3.5 w-3.5 shrink-0" />
              {league.websiteUrl}
            </a>
          </div>
        )}
      </div>

      {/* Description */}
      {league.description && (
        <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">About</p>
          <p className="text-sm text-slate-300 leading-relaxed">{league.description}</p>
        </div>
      )}

      {/* Points table preview */}
      {standings.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Points Table</h2>
            <Link href={`/cricket/leagues/${slug}/points-table`} className="text-xs text-sky-400 hover:underline">
              View full table →
            </Link>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">#</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Team</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">P</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">W</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">L</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 font-bold">Pts</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">NRR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {standings.slice(0, 5).map((s, i) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-2.5 text-slate-400 text-sm">{s.position ?? i + 1}</td>
                    <td className="px-4 py-2.5">
                      <Link href={`/cricket/teams/${s.teamSlug}`} className="flex items-center gap-2 text-slate-200 hover:text-sky-400 transition-colors">
                        <div
                          className="h-5 w-5 shrink-0 rounded flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ backgroundColor: s.teamPrimaryColor ?? "#334155" }}
                        >
                          {s.teamShortName?.slice(0, 2).toUpperCase() ?? s.teamName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium truncate max-w-[140px]">{s.teamName}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-300 text-sm">{s.matchesPlayed}</td>
                    <td className="px-3 py-2.5 text-center text-emerald-400 text-sm">{s.wins}</td>
                    <td className="px-3 py-2.5 text-center text-rose-400 text-sm">{s.losses}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-sky-400 text-sm">{s.totalPoints}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`font-mono text-xs ${s.netRunRate >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {s.netRunRate >= 0 ? "+" : ""}{s.netRunRate.toFixed(3)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leaderboard preview */}
      {(statsSummary.topRunScorer || statsSummary.topWicketTaker) && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Leaderboard Highlights</h2>
            <Link href={`/cricket/leagues/${slug}/leaderboards`} className="text-xs text-sky-400 hover:underline">
              Full leaderboards →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {statsSummary.topRunScorer && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Top Run Scorer</p>
                <p className="text-base font-bold text-slate-100">{statsSummary.topRunScorer.playerName}</p>
                <p className="text-2xl font-bold text-sky-400">{statsSummary.topRunScorer.runs}</p>
                <p className="text-xs text-slate-500">runs</p>
              </div>
            )}
            {statsSummary.topWicketTaker && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Top Wicket Taker</p>
                <p className="text-base font-bold text-slate-100">{statsSummary.topWicketTaker.playerName}</p>
                <p className="text-2xl font-bold text-emerald-400">{statsSummary.topWicketTaker.wickets}</p>
                <p className="text-xs text-slate-500">wickets</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Module navigation */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          League modules
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <ModuleCard key={mod.label} mod={mod} />
          ))}
        </div>
      </div>

      {/* Admin actions */}
      {canManage && (
        <div className="mb-6 rounded-xl border border-slate-700/50 bg-slate-900/50 px-5 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
            League admin
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/cricket/leagues/${slug}/setup`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:border-sky-500/40 hover:bg-slate-700 transition-all"
            >
              <ClipboardList className="h-4 w-4" />
              League Setup
            </Link>
            <Link
              href={`/cricket/leagues/${slug}/settings`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:border-sky-500/40 hover:bg-slate-700 transition-all"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-xs text-slate-600">
        <Link href="/cricket/leagues" className="hover:text-slate-400 transition-colors">
          ← All Leagues
        </Link>
        <Link href="/cricket" className="hover:text-slate-400 transition-colors">
          Cricket Hub
        </Link>
      </div>
    </AppShell>
  );
}
