import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketMatchBySlugOrId, userCanManageCricketLeague } from "@/lib/cricket/matches/queries";
import { userCanScoreCricketMatch } from "@/lib/cricket/scorecards/queries";
import { getCricketMatchSetup } from "@/lib/cricket/match-setup/queries";
import { MatchSetupChecklist } from "@/components/cricket/MatchSetupChecklist";
import { MatchSetupForm } from "@/components/cricket/MatchSetupForm";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
}

export const metadata: Metadata = { title: "Match Setup — GameIQ" };

export default async function MatchSetupPage({ params }: Props) {
  const { matchSlugOrId } = await params;
  const user = await getServerUser();
  if (!user) redirect("/auth");

  const match = await getCricketMatchBySlugOrId(matchSlugOrId).catch(() => null);
  if (!match) notFound();

  const [canScore, canManage] = await Promise.all([
    userCanScoreCricketMatch(user.id, match.id),
    match.leagueId ? userCanManageCricketLeague(user.id, match.leagueId) : Promise.resolve(false),
  ]);

  if (!canScore && !canManage) {
    redirect(`/cricket/matches/${matchSlugOrId}`);
  }

  const setupData = await getCricketMatchSetup(matchSlugOrId).catch(() => null);
  if (!setupData) notFound();

  return (
    <AppShell>
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5 flex-wrap">
        <Link href="/cricket" className="hover:text-slate-400">Cricket Hub</Link>
        {setupData.leagueSlug && (
          <>
            <span>/</span>
            <Link href={`/cricket/leagues/${setupData.leagueSlug}/schedule`} className="hover:text-slate-400">
              Schedule
            </Link>
          </>
        )}
        <span>/</span>
        <Link href={`/cricket/matches/${matchSlugOrId}`} className="hover:text-slate-400">Match</Link>
        <span>/</span>
        <span className="text-slate-400">Setup</span>
      </div>

      <PageHeader
        title="Match Setup"
        description={`${setupData.homeTeam?.name ?? "Home"} vs ${setupData.awayTeam?.name ?? "Away"}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <MatchSetupForm setupData={setupData} matchSlug={matchSlugOrId} />
        </div>

        <div>
          <MatchSetupChecklist
            match={match}
            squads={setupData.squads}
            matchSlug={matchSlugOrId}
          />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end">
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
