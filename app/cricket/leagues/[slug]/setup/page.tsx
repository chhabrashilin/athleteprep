import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import {
  getCricketLeagueBySlugFull,
  getCricketLeagueSettings,
  getCricketLeagueMembers,
  userCanManageCricketLeague,
} from "@/lib/cricket/leagues/queries";
import { LeagueSetupChecklist } from "@/components/cricket/LeagueSetupChecklist";
import { LeagueInviteForm } from "@/components/cricket/LeagueInviteForm";
import { LeagueMemberList } from "@/components/cricket/LeagueMemberList";
import { getCricketTeamsForLeague } from "@/lib/cricket/teams/queries";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params: _params }: Props): Promise<Metadata> {
  return { title: `League Setup — GameIQ` };
}

function SetupSection({
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

export default async function LeagueSetupPage({ params }: Props) {
  const { slug } = await params;

  const user = await getServerUser();
  if (!user) {
    redirect(`/auth/login?redirectTo=/cricket/leagues/${slug}/setup`);
  }

  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) notFound();

  const canManage = await userCanManageCricketLeague(user.id, league.id);
  if (!canManage) {
    redirect(`/cricket/leagues/${slug}`);
  }

  const [settings, members, teams] = await Promise.all([
    getCricketLeagueSettings(league.id),
    getCricketLeagueMembers(league.id),
    getCricketTeamsForLeague(league.id),
  ]);

  const FORMAT_LABELS: Record<string, string> = {
    round_robin: "Round Robin",
    knockout: "Knockout",
    group_stage: "Group Stage",
    franchise: "Franchise",
    friendly: "Friendly",
    custom: "Custom",
  };

  return (
    <AppShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5">
        <Link href="/cricket" className="hover:text-slate-400 transition-colors">Cricket Hub</Link>
        <span>/</span>
        <Link href="/cricket/leagues" className="hover:text-slate-400 transition-colors">Leagues</Link>
        <span>/</span>
        <Link href={`/cricket/leagues/${slug}`} className="hover:text-slate-400 transition-colors">
          {league.name}
        </Link>
        <span>/</span>
        <span className="text-slate-400">Setup</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 mb-1">
          League Setup
        </h1>
        <p className="text-sm text-slate-400">
          Complete the setup checklist to get your league ready to launch.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1 — Setup checklist */}
        <SetupSection
          title="Setup checklist"
          description="Track what's been configured and what still needs attention."
        >
          <LeagueSetupChecklist
            league={league}
            settings={settings}
            memberCount={members.length}
          />
        </SetupSection>

        {/* 2 — League basics summary */}
        <SetupSection
          title="League basics"
          description="Summary of your league configuration."
        >
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Name", value: league.name },
              { label: "Season", value: league.seasonName ?? "—" },
              { label: "Format", value: FORMAT_LABELS[league.format] ?? league.format },
              { label: "Overs per innings", value: String(league.oversPerInnings) },
              { label: "Visibility", value: league.visibility },
              { label: "Registration status", value: league.registrationStatus },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="text-sm font-medium text-slate-200 capitalize">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <Link
              href={`/cricket/leagues/${slug}/settings`}
              className="text-xs font-medium text-sky-500 hover:text-sky-400 transition-colors"
            >
              Edit in Settings →
            </Link>
          </div>
        </SetupSection>

        {/* 3 — Match rules summary */}
        <SetupSection
          title="Match rules"
          description={settings ? "Scoring configuration for this league." : "Settings not yet created — they will be created when you save the league settings."}
        >
          {settings ? (
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Default overs", value: String(settings.defaultOvers) },
                { label: "Points (Win / Tie / No result)", value: `${settings.pointsWin} / ${settings.pointsTie} / ${settings.pointsNoResult}` },
                { label: "Net Run Rate", value: settings.netRunRateEnabled ? "Enabled" : "Disabled" },
                { label: "Super Over", value: settings.allowSuperOver ? "Allowed" : "Not allowed" },
                { label: "Duckworth-Lewis", value: settings.allowDuckworthLewis ? "Enabled" : "Disabled" },
                { label: "Substitutes", value: settings.allowSubstitutes ? "Allowed" : "Not allowed" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="text-sm font-medium text-slate-200">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-slate-500">
              Go to{" "}
              <Link href={`/cricket/leagues/${slug}/settings`} className="text-sky-400 hover:underline">
                Settings
              </Link>{" "}
              to configure match rules.
            </p>
          )}
        </SetupSection>

        {/* 4 — Team registration */}
        <SetupSection
          title="Team registration"
          description="Manage team registrations for this league."
        >
          <div className="space-y-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Teams registered</dt>
                <dd className="text-sm font-medium text-slate-200">{teams.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Allow team registration</dt>
                <dd className={`text-sm font-medium ${league.allowTeamRegistration ? "text-emerald-400" : "text-slate-400"}`}>
                  {league.allowTeamRegistration ? "Enabled" : "Disabled"}
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/cricket/leagues/${slug}/teams`}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:border-sky-500/40 hover:bg-slate-700 transition-all"
              >
                View Teams
              </Link>
              <Link
                href={`/cricket/leagues/${slug}/teams/new`}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 transition-colors"
              >
                Register Team
              </Link>
            </div>

            {/* Launch readiness checklist */}
            <div className="mt-4 rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-3">
              <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Launch readiness</p>
              <ul className="space-y-1.5">
                {[
                  { label: "League info completed", done: !!(league.name && league.seasonName) },
                  { label: "Settings configured", done: !!settings },
                  { label: "Owner assigned", done: members.some((m) => m.role === "owner") },
                  { label: "At least 2 teams registered", done: teams.length >= 2 },
                  { label: "At least one roster has players (manual check)", done: false },
                  { label: "Schedule configured", done: false },
                  { label: "Live scoring configured", done: false },
                ].map(({ label, done }) => (
                  <li key={label} className="flex items-center gap-2 text-xs">
                    <span className={`h-1.5 w-1.5 rounded-full ${done ? "bg-emerald-400" : "bg-slate-600"}`} />
                    <span className={done ? "text-slate-300" : "text-slate-500"}>{label}</span>
                    {done && <span className="text-emerald-500">✓</span>}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-600 mt-3">This checklist is guidance only — you can launch at any time.</p>
            </div>
          </div>
        </SetupSection>

        {/* 5 — Admins & managers */}
        <SetupSection
          title="Admins & managers"
          description="Invite people to help manage this league."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3">Invite member</h3>
              <LeagueInviteForm leagueId={league.id} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3">
                Current members ({members.length})
              </h3>
              <LeagueMemberList members={members} />
            </div>
          </div>
        </SetupSection>

        {/* 6 — Schedule planning */}
        <SetupSection
          title="Schedule planning"
          description="Create fixtures and assign venues."
        >
          <div className="flex items-start gap-3 rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-3">
            <div className="mt-0.5">
              <span className="inline-flex h-2 w-2 rounded-full bg-slate-600" />
            </div>
            <p className="text-sm text-slate-400">
              Match scheduling comes in a future prompt. You will be able to auto-generate
              a round-robin fixture list, assign venues, and manage the season calendar.
            </p>
          </div>
        </SetupSection>

        {/* 7 — Launch */}
        <SetupSection
          title="Launch readiness"
          description="Open your league page to the world when you're ready."
        >
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href={`/cricket/leagues/${slug}`}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Open League Page
            </Link>
            <Link
              href={`/cricket/leagues/${slug}/settings`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-700 transition-all"
            >
              Edit Settings
            </Link>
          </div>
        </SetupSection>
      </div>

      <div className="mt-8 flex items-center justify-between text-xs text-slate-600">
        <Link href={`/cricket/leagues/${slug}`} className="hover:text-slate-400 transition-colors">
          ← League Overview
        </Link>
        <Link href="/cricket/leagues" className="hover:text-slate-400 transition-colors">
          All Leagues
        </Link>
      </div>
    </AppShell>
  );
}
