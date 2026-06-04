import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketLeagueBySlugFull, userCanManageCricketLeague } from "@/lib/cricket/leagues/queries";
import { CreateTeamForm } from "@/components/cricket/CreateTeamForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) return { title: "Register Team — GameIQ" };
  return { title: `Register Team — ${league.name} — GameIQ` };
}

export default async function NewTeamPage({ params }: Props) {
  const { slug } = await params;

  const user = await getServerUser();
  if (!user) {
    redirect(`/auth/login?redirectTo=/cricket/leagues/${slug}/teams/new`);
  }

  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) notFound();

  const canManage = await userCanManageCricketLeague(user.id, league.id);
  const canRegister = canManage || league.allowTeamRegistration;

  if (!canRegister) {
    redirect(`/cricket/leagues/${slug}/teams`);
  }

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
        <Link href={`/cricket/leagues/${slug}/teams`} className="hover:text-slate-400 transition-colors">Teams</Link>
        <span>/</span>
        <span className="text-slate-400">Register</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 mb-1">
          Register Cricket Team
        </h1>
        <p className="text-sm text-slate-400">
          Create a team profile and prepare your roster for <span className="text-slate-300">{league.name}</span>.
        </p>
      </div>

      <CreateTeamForm leagueId={league.id} leagueSlug={slug} />

      <div className="mt-8 flex items-center justify-between text-xs text-slate-600">
        <Link href={`/cricket/leagues/${slug}/teams`} className="hover:text-slate-400 transition-colors">
          ← Back to Teams
        </Link>
        <Link href="/cricket" className="hover:text-slate-400 transition-colors">
          Cricket Hub
        </Link>
      </div>
    </AppShell>
  );
}
