import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketLeagueBySlugFull, userCanManageCricketLeague } from "@/lib/cricket/leagues/queries";
import { getCricketTeamsForLeague, getCricketTeamRoster } from "@/lib/cricket/teams/queries";
import { TeamCard } from "@/components/cricket/TeamCard";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) return { title: "Teams — GameIQ" };
  return { title: `Teams — ${league.name} — GameIQ` };
}

export default async function LeagueTeamsPage({ params }: Props) {
  const { slug } = await params;

  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) notFound();

  const user = await getServerUser();
  if (!user) {
    redirect(`/auth/login?redirectTo=/cricket/leagues/${slug}/teams`);
  }

  const canManage = await userCanManageCricketLeague(user.id, league.id);
  const canRegister = canManage || league.allowTeamRegistration;

  const teams = await getCricketTeamsForLeague(league.id);

  // Get roster counts in parallel
  const rosterCountMap: Record<string, number> = {};
  await Promise.all(
    teams.map(async (team) => {
      const roster = await getCricketTeamRoster(team.id);
      rosterCountMap[team.id] = roster.length;
    })
  );

  return (
    <AppShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5">
        <Link href="/cricket" className="hover:text-slate-400 transition-colors">Cricket Hub</Link>
        <span>/</span>
        <Link href="/cricket/leagues" className="hover:text-slate-400 transition-colors">Leagues</Link>
        <span>/</span>
        <Link href={`/cricket/leagues/${slug}`} className="hover:text-slate-400 transition-colors">{league.name}</Link>
        <span>/</span>
        <span className="text-slate-400">Teams</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 mb-1">
            Teams
          </h1>
          <p className="text-sm text-slate-400">
            {league.name} · {teams.length} {teams.length === 1 ? "team" : "teams"} registered
          </p>
        </div>
        {canRegister && (
          <Link
            href={`/cricket/leagues/${slug}/teams/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Register Team
          </Link>
        )}
      </div>

      {/* Team list */}
      {teams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 px-6 py-12 text-center">
          <Users className="h-8 w-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-400 mb-1">No teams registered yet.</p>
          {canRegister ? (
            <Link
              href={`/cricket/leagues/${slug}/teams/new`}
              className="text-sm text-sky-400 hover:underline"
            >
              Create the first team
            </Link>
          ) : (
            <p className="text-xs text-slate-600">Team registration is not currently open.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              rosterCount={rosterCountMap[team.id]}
              href={`/cricket/teams/${team.slug}`}
            />
          ))}
        </div>
      )}

      {/* Footer nav */}
      <div className="mt-8 flex items-center justify-between text-xs text-slate-600">
        <Link href={`/cricket/leagues/${slug}`} className="hover:text-slate-400 transition-colors">
          ← Back to League
        </Link>
        <Link href="/cricket" className="hover:text-slate-400 transition-colors">
          Cricket Hub
        </Link>
      </div>
    </AppShell>
  );
}
