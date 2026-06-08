import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { TeamKitRequestForm } from "@/components/cricket/commerce/TeamKitRequestForm";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketTeamBySlug } from "@/lib/cricket/teams/queries";

interface Props { params: Promise<{ teamSlug: string }> }
export const metadata: Metadata = { title: "New Kit Request — GameIQ" };

export default async function NewKitRequestPage({ params }: Props) {
  const { teamSlug } = await params;
  const user = await getServerUser();
  if (!user) redirect("/login");

  const team = await getCricketTeamBySlug(teamSlug).catch(() => null);
  if (!team) notFound();

  return (
    <AppShell>
      <PageHeader
        title="New Kit Request"
        description={`Submit a team kit design request for ${team.name}.`}
        action={
          <Link href={`/cricket/teams/${teamSlug}/kits`} className="text-sm text-slate-500 hover:text-slate-300">
            ← Kit requests
          </Link>
        }
      />

      <div className="max-w-xl">
        <TeamKitRequestForm
          teamId={team.id}
          teamSlug={teamSlug}
          leagueId={team.leagueId ?? undefined}
        />
      </div>
    </AppShell>
  );
}
