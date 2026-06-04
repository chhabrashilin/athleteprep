import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import {
  getCricketLeagueBySlugFull,
  getCricketLeagueSettings,
  userCanManageCricketLeague,
} from "@/lib/cricket/leagues/queries";
import { LeagueSettingsForm } from "@/components/cricket/LeagueSettingsForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params: _params }: Props): Promise<Metadata> {
  return { title: `League Settings — GameIQ` };
}

export default async function LeagueSettingsPage({ params }: Props) {
  const { slug } = await params;

  const user = await getServerUser();
  if (!user) {
    redirect(`/auth/login?redirectTo=/cricket/leagues/${slug}/settings`);
  }

  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) notFound();

  const canManage = await userCanManageCricketLeague(user.id, league.id);
  if (!canManage) {
    redirect(`/cricket/leagues/${slug}`);
  }

  const settings = await getCricketLeagueSettings(league.id);

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
        <span className="text-slate-400">Settings</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 mb-1">League Settings</h1>
        <p className="text-sm text-slate-400">
          Update league info, visibility, registration rules, and match settings.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <LeagueSettingsForm league={league} settings={settings} />
      </div>

      <div className="mt-8 flex items-center justify-between text-xs text-slate-600">
        <Link href={`/cricket/leagues/${slug}/setup`} className="hover:text-slate-400 transition-colors">
          ← Setup Wizard
        </Link>
        <Link href={`/cricket/leagues/${slug}`} className="hover:text-slate-400 transition-colors">
          League Overview
        </Link>
      </div>
    </AppShell>
  );
}
