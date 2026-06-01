import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlayerForm } from "@/components/players/PlayerForm";
import { createPlayerAction } from "./actions";
import {
  getTeamByIdForCurrentUser,
  getCurrentUserTeamMembership,
} from "@/lib/db/teams";

export const metadata: Metadata = { title: "Add Player — GameIQ" };

const STAFF_ROLES = ["owner", "coach", "analyst"];

export default async function NewPlayerPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  const [team, membership] = await Promise.all([
    getTeamByIdForCurrentUser(teamId),
    getCurrentUserTeamMembership(teamId),
  ]);

  if (!team || !membership) notFound();

  if (!STAFF_ROLES.includes(membership.role)) {
    notFound();
  }

  return (
    <AppShell teamContext={{ teamId: team.id, teamName: team.name }}>
      <PageHeader
        title="Add player"
        description={`Add a player to ${team.name}'s roster.`}
        breadcrumbs={[
          { label: "Teams", href: "/teams" },
          { label: team.name, href: `/teams/${teamId}` },
          { label: "Roster", href: `/teams/${teamId}/players` },
          { label: "Add player" },
        ]}
      />
      <PlayerForm
        action={createPlayerAction}
        mode="create"
        teamId={teamId}
        cancelHref={`/teams/${teamId}/players`}
      />
    </AppShell>
  );
}
