import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketTeamBySlug, getCricketTeamRoster, userCanManageCricketTeam } from "@/lib/cricket/teams/queries";
import { getCricketLeagueById } from "@/lib/cricket/leagues/queries";
import { RosterManager } from "@/components/cricket/RosterManager";

interface Props {
  params: Promise<{ teamSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { teamSlug } = await params;
  const team = await getCricketTeamBySlug(teamSlug);
  if (!team) return { title: "Roster — GameIQ" };
  return { title: `Roster — ${team.name} — GameIQ` };
}

export default async function TeamRosterPage({ params }: Props) {
  const { teamSlug } = await params;

  const user = await getServerUser();
  if (!user) {
    redirect(`/auth/login?redirectTo=/cricket/teams/${teamSlug}/roster`);
  }

  const team = await getCricketTeamBySlug(teamSlug);
  if (!team) notFound();

  const [canManage, roster, league] = await Promise.all([
    userCanManageCricketTeam(user.id, team.id),
    getCricketTeamRoster(team.id),
    team.leagueId ? getCricketLeagueById(team.leagueId) : null,
  ]);

  return (
    <AppShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5 flex-wrap">
        <Link href="/cricket" className="hover:text-slate-400 transition-colors">Cricket Hub</Link>
        <span>/</span>
        {league && (
          <>
            <Link href={`/cricket/leagues/${league.slug}/teams`} className="hover:text-slate-400 transition-colors">{league.name}</Link>
            <span>/</span>
          </>
        )}
        <Link href={`/cricket/teams/${teamSlug}`} className="hover:text-slate-400 transition-colors">{team.name}</Link>
        <span>/</span>
        <span className="text-slate-400">Roster</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 mb-1">
          Roster — {team.name}
        </h1>
        <p className="text-sm text-slate-400">
          {roster.length} {roster.length === 1 ? "player" : "players"} registered
          {!canManage && " · Read-only view"}
        </p>
      </div>

      <RosterManager
        teamId={team.id}
        teamSlug={teamSlug}
        roster={roster}
        canManage={canManage}
      />

      <div className="mt-8 flex items-center justify-between text-xs text-slate-600">
        <Link href={`/cricket/teams/${teamSlug}`} className="hover:text-slate-400 transition-colors">
          ← Back to Team
        </Link>
        {canManage && (
          <Link href={`/cricket/teams/${teamSlug}/settings`} className="hover:text-slate-400 transition-colors">
            Team Settings →
          </Link>
        )}
      </div>
    </AppShell>
  );
}
