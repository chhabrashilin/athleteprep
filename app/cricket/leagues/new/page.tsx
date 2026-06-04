import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getServerUser } from "@/lib/supabase/server";
import { CreateLeagueForm } from "@/components/cricket/CreateLeagueForm";

export const metadata: Metadata = { title: "Create Cricket League — GameIQ" };

export default async function NewCricketLeaguePage() {
  const user = await getServerUser();
  if (!user) {
    redirect("/auth/login?redirectTo=/cricket/leagues/new");
  }

  return (
    <AppShell>
      <div className="mb-2">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Link href="/cricket" className="hover:text-slate-400 transition-colors">Cricket Hub</Link>
          <span>/</span>
          <Link href="/cricket/leagues" className="hover:text-slate-400 transition-colors">Leagues</Link>
          <span>/</span>
          <span className="text-slate-400">New</span>
        </div>
        <PageHeader
          title="Create Cricket League"
          description="Set up a league, season, teams, and scoring rules for cricket."
        />
      </div>

      <div className="mb-6 rounded-xl border border-sky-500/20 bg-sky-500/5 px-5 py-4">
        <p className="text-sm text-sky-400 font-medium mb-1">What happens next?</p>
        <p className="text-sm text-slate-400">
          After creating your league you will be taken to the setup wizard where you can
          invite admins, configure team registration, and review launch readiness.
          Team registration and match scheduling come in Prompt 30.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <CreateLeagueForm />
      </div>
    </AppShell>
  );
}
