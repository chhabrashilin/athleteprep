import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getServerUser } from "@/lib/supabase/server";
import {
  getCricketMatchWithTeams,
  userCanManageCricketLeague,
} from "@/lib/cricket/matches/queries";
import { getActiveCricketVenues } from "@/lib/cricket/venues/queries";
import { EditMatchForm } from "@/components/cricket/EditMatchForm";
import { getCricketTeamsForLeague } from "@/lib/cricket/teams/queries";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
}

export const metadata: Metadata = { title: "Edit Match — GameIQ" };

export default async function EditMatchPage({ params }: Props) {
  const { matchSlugOrId } = await params;
  const user = await getServerUser();
  if (!user) redirect("/auth");

  const match = await getCricketMatchWithTeams(matchSlugOrId).catch(() => null);
  if (!match) notFound();

  const canManage = match.leagueId
    ? await userCanManageCricketLeague(user.id, match.leagueId)
    : match.createdBy === user.id;

  if (!canManage) redirect(`/cricket/matches/${matchSlugOrId}`);

  const [venues, teams] = await Promise.all([
    getActiveCricketVenues().catch(() => []),
    match.leagueId ? getCricketTeamsForLeague(match.leagueId).catch(() => []) : Promise.resolve([]),
  ]);

  return (
    <AppShell>
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5">
        <Link href="/cricket" className="hover:text-slate-400">Cricket Hub</Link>
        {match.leagueSlug && (
          <>
            <span>/</span>
            <Link href={`/cricket/leagues/${match.leagueSlug}/schedule`} className="hover:text-slate-400">
              Schedule
            </Link>
          </>
        )}
        <span>/</span>
        <Link href={`/cricket/matches/${matchSlugOrId}`} className="hover:text-slate-400">
          Match
        </Link>
        <span>/</span>
        <span className="text-slate-400">Edit</span>
      </div>

      <PageHeader
        title="Edit Match"
        description={`${match.homeTeam?.name ?? "Home"} vs ${match.awayTeam?.name ?? "Away"}`}
      />

      <div className="max-w-2xl">
        <EditMatchForm
          match={match}
          teams={teams}
          venues={venues}
        />
      </div>

      <div className="mt-6 flex items-center justify-end">
        <Link
          href={`/cricket/matches/${matchSlugOrId}`}
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          ← Back to match
        </Link>
      </div>
    </AppShell>
  );
}
