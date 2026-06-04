import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Users,
  Settings,
  ClipboardList,
  BarChart2,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketTeamBySlug, getCricketTeamRoster, userCanManageCricketTeam } from "@/lib/cricket/teams/queries";
import { getCricketLeagueById } from "@/lib/cricket/leagues/queries";

interface Props {
  params: Promise<{ teamSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { teamSlug } = await params;
  const team = await getCricketTeamBySlug(teamSlug);
  if (!team) return { title: "Team not found — GameIQ" };
  return { title: `${team.name} — GameIQ` };
}

const REG_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:     { label: "Draft",     color: "text-slate-400 bg-slate-800 border-slate-700" },
  submitted: { label: "Submitted", color: "text-amber-400 bg-amber-400/10 border-amber-500/30" },
  approved:  { label: "Approved",  color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/30" },
  rejected:  { label: "Rejected",  color: "text-rose-400 bg-rose-400/10 border-rose-500/30" },
  archived:  { label: "Archived",  color: "text-slate-500 bg-slate-800 border-slate-700" },
};

const TEAM_TYPE_LABELS: Record<string, string> = {
  club: "Club", school: "School", university: "University",
  corporate: "Corporate", academy: "Academy", franchise: "Franchise",
  casual: "Casual", other: "Other",
};

export default async function CricketTeamPage({ params }: Props) {
  const { teamSlug } = await params;

  const team = await getCricketTeamBySlug(teamSlug);
  if (!team) notFound();

  const user = await getServerUser();
  const canManage = user ? await userCanManageCricketTeam(user.id, team.id) : false;

  const [roster, league] = await Promise.all([
    getCricketTeamRoster(team.id),
    team.leagueId ? getCricketLeagueById(team.leagueId) : null,
  ]);

  const captain = roster.find((r) => r.isCaptain)?.player;
  const viceCaptain = roster.find((r) => r.isViceCaptain)?.player;
  const statusCfg = REG_STATUS_CONFIG[team.registrationStatus] ?? REG_STATUS_CONFIG.draft;

  const initials = team.shortName
    ? team.shortName.slice(0, 3).toUpperCase()
    : team.name.slice(0, 2).toUpperCase();

  return (
    <AppShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5 flex-wrap">
        <Link href="/cricket" className="hover:text-slate-400 transition-colors">Cricket Hub</Link>
        <span>/</span>
        {league && (
          <>
            <Link href={`/cricket/leagues/${league.slug}/teams`} className="hover:text-slate-400 transition-colors">
              {league.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-slate-400">{team.name}</span>
      </div>

      {/* Hero header */}
      <div className="mb-6 flex items-start gap-5 flex-wrap">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
          style={{ backgroundColor: team.primaryColor ?? "#334155" }}
        >
          {team.logoUrl ? (
            <img src={team.logoUrl} alt={team.name} className="h-16 w-16 rounded-xl object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100 mb-0.5">{team.name}</h1>
              {team.shortName && <p className="text-sm text-slate-400">{team.shortName}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>
          </div>
          {team.description && (
            <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-2xl">{team.description}</p>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {league && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">League</p>
            <Link href={`/cricket/leagues/${league.slug}`} className="text-sm font-semibold text-sky-400 hover:underline">
              {league.name}
            </Link>
          </div>
        )}
        {team.homeGround && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Home ground</p>
            <p className="text-sm font-semibold text-slate-200 inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              {team.homeGround}
            </p>
          </div>
        )}
        {team.teamType && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Team type</p>
            <p className="text-sm font-semibold text-slate-200">{TEAM_TYPE_LABELS[team.teamType] ?? team.teamType}</p>
          </div>
        )}
        {captain && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Captain</p>
            <p className="text-sm font-semibold text-slate-200">{captain.displayName}</p>
          </div>
        )}
        {viceCaptain && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Vice Captain</p>
            <p className="text-sm font-semibold text-slate-200">{viceCaptain.displayName}</p>
          </div>
        )}
        {team.coachName && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Coach</p>
            <p className="text-sm font-semibold text-slate-200">{team.coachName}</p>
          </div>
        )}
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Squad size</p>
          <p className="text-sm font-semibold text-slate-200 inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            {roster.length} {roster.length === 1 ? "player" : "players"}
          </p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Team sections</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: "Roster",
              description: "View and manage players on this team.",
              href: `/cricket/teams/${teamSlug}/roster`,
              available: true,
              icon: <Users className="h-4 w-4" />,
            },
            {
              label: "Matches",
              description: "Upcoming and past matches.",
              available: false,
              icon: <Calendar className="h-4 w-4" />,
            },
            {
              label: "Stats",
              description: "Team and player statistics.",
              available: false,
              icon: <BarChart2 className="h-4 w-4" />,
            },
          ].map((mod) => {
            const inner = (
              <div className={`flex items-center gap-4 rounded-xl border px-5 py-4 transition-all ${mod.available ? "border-slate-800 bg-slate-900 hover:border-sky-500/40 hover:bg-slate-800/60 cursor-pointer" : "border-slate-800/40 bg-slate-900/40 opacity-50 cursor-default"}`}>
                <div className="shrink-0 rounded-lg bg-slate-800 p-2.5 text-slate-400">{mod.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-100">{mod.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                </div>
                {mod.available ? <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" /> : <span className="text-xs text-slate-600 shrink-0">Coming Soon</span>}
              </div>
            );
            if (mod.available && mod.href) {
              return <Link key={mod.label} href={mod.href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-xl">{inner}</Link>;
            }
            return <div key={mod.label}>{inner}</div>;
          })}
        </div>
      </div>

      {/* Admin actions */}
      {canManage && (
        <div className="mb-6 rounded-xl border border-slate-700/50 bg-slate-900/50 px-5 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Team admin</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/cricket/teams/${teamSlug}/roster`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:border-sky-500/40 hover:bg-slate-700 transition-all"
            >
              <ClipboardList className="h-4 w-4" />
              Manage Roster
            </Link>
            <Link
              href={`/cricket/teams/${teamSlug}/settings`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:border-sky-500/40 hover:bg-slate-700 transition-all"
            >
              <Settings className="h-4 w-4" />
              Team Settings
            </Link>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-xs text-slate-600">
        {league ? (
          <Link href={`/cricket/leagues/${league.slug}/teams`} className="hover:text-slate-400 transition-colors">
            ← Back to League Teams
          </Link>
        ) : (
          <span />
        )}
        <Link href="/cricket" className="hover:text-slate-400 transition-colors">
          Cricket Hub
        </Link>
      </div>
    </AppShell>
  );
}
