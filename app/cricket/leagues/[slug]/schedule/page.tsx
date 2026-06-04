import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketLeagueBySlugFull, userCanManageCricketLeague } from "@/lib/cricket/leagues/queries";
import { getCricketMatchesForLeague, getCricketScheduleConflictsForLeague } from "@/lib/cricket/matches/queries";
import { getActiveCricketVenues } from "@/lib/cricket/venues/queries";
import { getCricketTeamsForLeague } from "@/lib/cricket/teams/queries";
import { MatchCard } from "@/components/cricket/MatchCard";
import { ConflictsPanel } from "@/components/cricket/ConflictBanner";
import { FixtureGeneratorPanel } from "@/components/cricket/FixtureGeneratorPanel";
import { PublishScheduleButtons } from "@/components/cricket/PublishScheduleButtons";
import type { CricketMatchFull } from "@/lib/cricket/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const league = await getCricketLeagueBySlugFull(slug).catch(() => null);
  return { title: league ? `${league.name} Schedule — GameIQ` : "Schedule — GameIQ" };
}

function groupMatchesByDate(matches: CricketMatchFull[]): Map<string, CricketMatchFull[]> {
  const map = new Map<string, CricketMatchFull[]>();
  const noDate: CricketMatchFull[] = [];
  for (const m of matches) {
    if (!m.scheduledStart) {
      noDate.push(m);
      continue;
    }
    const dateKey = new Date(m.scheduledStart).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const existing = map.get(dateKey) ?? [];
    existing.push(m);
    map.set(dateKey, existing);
  }
  if (noDate.length > 0) map.set("Unscheduled", noDate);
  return map;
}

export default async function LeagueSchedulePage({ params }: Props) {
  const { slug } = await params;
  const league = await getCricketLeagueBySlugFull(slug).catch(() => null);
  if (!league) notFound();

  const user = await getServerUser();
  const [canManage, matches, conflicts, venues, teams] = await Promise.all([
    user ? userCanManageCricketLeague(user.id, league.id) : Promise.resolve(false),
    getCricketMatchesForLeague(league.id).catch(() => []),
    getCricketScheduleConflictsForLeague(league.id).catch(() => []),
    getActiveCricketVenues().catch(() => []),
    getCricketTeamsForLeague(league.id).catch(() => []),
  ]);

  const totalMatches = matches.length;
  const scheduledMatches = matches.filter((m) => m.scheduledStart).length;
  const unscheduledMatches = totalMatches - scheduledMatches;
  const publishedMatches = matches.filter((m) => m.publishStatus === "published").length;
  const conflictCount = conflicts.length;

  const groupedMatches = groupMatchesByDate(matches);

  return (
    <AppShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5">
        <Link href="/cricket" className="hover:text-slate-400">Cricket Hub</Link>
        <span>/</span>
        <Link href="/cricket/leagues" className="hover:text-slate-400">Leagues</Link>
        <span>/</span>
        <Link href={`/cricket/leagues/${slug}`} className="hover:text-slate-400">{league.name}</Link>
        <span>/</span>
        <span className="text-slate-400">Schedule</span>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{league.name}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {league.seasonName ? `${league.seasonName} — ` : ""}Match Schedule
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/cricket/leagues/${slug}/matches/new`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Match
            </Link>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="mb-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { label: "Total Matches", value: totalMatches },
          { label: "Scheduled", value: scheduledMatches },
          { label: "Unscheduled", value: unscheduledMatches },
          { label: "Published", value: publishedMatches },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
            <p className="text-2xl font-bold text-sky-400">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Conflict banner */}
      {conflictCount > 0 && canManage && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-400">
              {conflictCount} schedule {conflictCount === 1 ? "conflict" : "conflicts"} detected
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Review and resolve before publishing. Scroll to the conflicts panel below.
            </p>
          </div>
        </div>
      )}

      {/* Admin actions */}
      {canManage && (
        <div className="mb-6 flex flex-wrap gap-3">
          <FixtureGeneratorPanel
            leagueId={league.id}
            leagueSlug={slug}
            teams={teams}
            venues={venues}
          />
          {totalMatches > 0 && (
            <PublishScheduleButtons leagueId={league.id} />
          )}
        </div>
      )}

      {/* Match list */}
      {totalMatches === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-12 text-center">
          <h2 className="text-base font-semibold text-slate-300 mb-2">No matches scheduled yet</h2>
          <p className="text-sm text-slate-500 mb-4">
            Generate fixtures automatically or create matches manually.
          </p>
          {canManage && (
            <div className="flex justify-center gap-3 flex-wrap">
              <Link
                href={`/cricket/leagues/${slug}/matches/new`}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Match
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedMatches.entries()).map(([dateLabel, dateMatches]) => (
            <div key={dateLabel}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                {dateLabel}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {dateMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    leagueSlug={slug}
                    showActions={canManage}
                    canManage={canManage}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conflicts panel */}
      {canManage && conflicts.length > 0 && (
        <div className="mt-8">
          <ConflictsPanel conflicts={conflicts} />
        </div>
      )}

      <div className="mt-8 flex items-center justify-end">
        <Link
          href={`/cricket/leagues/${slug}`}
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          ← Back to league
        </Link>
      </div>
    </AppShell>
  );
}
