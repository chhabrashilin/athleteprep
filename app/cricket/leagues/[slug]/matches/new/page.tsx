import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketLeagueBySlugFull, userCanManageCricketLeague } from "@/lib/cricket/leagues/queries";
import { getCricketTeamsForLeague } from "@/lib/cricket/teams/queries";
import { getActiveCricketVenues } from "@/lib/cricket/venues/queries";
import { CreateMatchForm } from "@/components/cricket/CreateMatchForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = { title: "Create Match — GameIQ" };

export default async function NewMatchPage({ params }: Props) {
  const { slug } = await params;
  const user = await getServerUser();
  if (!user) redirect("/auth");

  const league = await getCricketLeagueBySlugFull(slug).catch(() => null);
  if (!league) notFound();

  const canManage = await userCanManageCricketLeague(user.id, league.id);
  if (!canManage) redirect(`/cricket/leagues/${slug}/schedule`);

  const [teams, venues] = await Promise.all([
    getCricketTeamsForLeague(league.id).catch(() => []),
    getActiveCricketVenues().catch(() => []),
  ]);

  return (
    <AppShell>
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5">
        <Link href="/cricket/leagues" className="hover:text-slate-400">Leagues</Link>
        <span>/</span>
        <Link href={`/cricket/leagues/${slug}`} className="hover:text-slate-400">{league.name}</Link>
        <span>/</span>
        <Link href={`/cricket/leagues/${slug}/schedule`} className="hover:text-slate-400">Schedule</Link>
        <span>/</span>
        <span className="text-slate-400">New Match</span>
      </div>

      <PageHeader
        title="Create Cricket Match"
        description={`Add a match to ${league.name}`}
      />

      <div className="max-w-2xl">
        <CreateMatchForm
          leagueId={league.id}
          leagueSlug={slug}
          teams={teams}
          venues={venues}
        />
      </div>

      <div className="mt-6 flex items-center justify-end">
        <Link
          href={`/cricket/leagues/${slug}/schedule`}
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          ← Back to schedule
        </Link>
      </div>
    </AppShell>
  );
}
