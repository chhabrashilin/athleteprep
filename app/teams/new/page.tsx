import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CreateTeamForm } from "@/components/teams/CreateTeamForm";

export const metadata: Metadata = { title: "Create Team — GameIQ" };

export default function NewTeamPage() {
  return (
    <AppShell>
      <PageHeader
        title="Create a new team"
        description="Set up your team workspace to start analyzing game film."
        breadcrumbs={[{ label: "Teams", href: "/teams" }, { label: "New team" }]}
      />
      <CreateTeamForm />
    </AppShell>
  );
}
