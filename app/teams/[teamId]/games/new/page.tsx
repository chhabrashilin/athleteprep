import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { GameForm } from "@/components/games/GameForm";
import { createGameAction } from "./actions";
import {
  getTeamByIdForCurrentUser,
  getCurrentUserTeamMembership,
} from "@/lib/db/teams";

export const metadata: Metadata = { title: "New Analysis — GameIQ" };

const STAFF_ROLES = ["owner", "coach", "analyst"];

export default async function NewGamePage({
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
  if (!STAFF_ROLES.includes(membership.role)) notFound();

  return (
    <AppShell teamContext={{ teamId: team.id, teamName: team.name }}>
      <PageHeader
        title="New analysis"
        description={`Create a game or practice analysis record for ${team.name}.`}
        breadcrumbs={[
          { label: "Teams", href: "/teams" },
          { label: team.name, href: `/teams/${teamId}` },
          { label: "Games", href: `/teams/${teamId}/games` },
          { label: "New analysis" },
        ]}
      />
      <GameForm
        action={createGameAction}
        mode="create"
        teamId={teamId}
        defaultSport={team.sport}
        cancelHref={`/teams/${teamId}/games`}
      />
    </AppShell>
  );
}
