import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import {
  getCricketTeamBySlug,
  getCricketTeamInvitations,
  userCanManageCricketTeam,
} from "@/lib/cricket/teams/queries";
import { getCricketLeagueById } from "@/lib/cricket/leagues/queries";
import { TeamSettingsForm } from "@/components/cricket/TeamSettingsForm";
import { TeamInvitePanel } from "@/components/cricket/TeamInvitePanel";

interface Props {
  params: Promise<{ teamSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { teamSlug } = await params;
  const team = await getCricketTeamBySlug(teamSlug);
  if (!team) return { title: "Team Settings — GameIQ" };
  return { title: `Settings — ${team.name} — GameIQ` };
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-200">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function TeamSettingsPage({ params }: Props) {
  const { teamSlug } = await params;

  const user = await getServerUser();
  if (!user) {
    redirect(`/auth/login?redirectTo=/cricket/teams/${teamSlug}/settings`);
  }

  const team = await getCricketTeamBySlug(teamSlug);
  if (!team) notFound();

  const canManage = await userCanManageCricketTeam(user.id, team.id);
  if (!canManage) {
    redirect(`/cricket/teams/${teamSlug}`);
  }

  const [invitations, league] = await Promise.all([
    getCricketTeamInvitations(team.id),
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
        <span className="text-slate-400">Settings</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 mb-1">Team Settings</h1>
        <p className="text-sm text-slate-400">{team.name}</p>
      </div>

      <div className="space-y-8">
        <TeamSettingsForm team={team} />

        {/* Invitations */}
        <Section title="Team invitations" description="Invite managers, coaches, and analysts to help manage this team.">
          <TeamInvitePanel teamId={team.id} invitations={invitations} />
        </Section>

        {/* Danger zone */}
        <Section title="Danger zone" description="Destructive actions. Team data is preserved on archive.">
          <div className="flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-rose-300">Archive this team</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Archiving hides the team from public views. Roster data is preserved. This cannot be undone without manual database access.
              </p>
            </div>
            <form action={`/api/cricket-teams/${team.id}/archive`} method="POST">
              <button
                type="button"
                className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                onClick={() => {
                  if (confirm("Are you sure you want to archive this team? This action hides the team from league views.")) {
                    // handled by server action on team settings page
                  }
                }}
              >
                Archive Team
              </button>
            </form>
          </div>
        </Section>
      </div>

      <div className="mt-8 flex items-center justify-between text-xs text-slate-600">
        <Link href={`/cricket/teams/${teamSlug}`} className="hover:text-slate-400 transition-colors">
          ← Back to Team
        </Link>
        <Link href="/cricket" className="hover:text-slate-400 transition-colors">
          Cricket Hub
        </Link>
      </div>
    </AppShell>
  );
}
