import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getServerUser } from "@/lib/supabase/server";
import { CreateVenueForm } from "@/components/cricket/CreateVenueForm";

export const metadata: Metadata = { title: "New Cricket Venue — GameIQ" };

export default async function NewCricketVenuePage() {
  const user = await getServerUser();
  if (!user) redirect("/auth");

  return (
    <AppShell>
      <PageHeader
        title="Add Cricket Venue"
        description="Add a ground, stadium, or practice facility to use when scheduling matches."
      />

      <div className="max-w-2xl">
        <CreateVenueForm />
      </div>

      <div className="mt-6 flex items-center justify-end">
        <Link href="/cricket/venues" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
          ← Back to venues
        </Link>
      </div>
    </AppShell>
  );
}
