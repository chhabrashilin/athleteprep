import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlayerForm } from "@/components/players/PlayerForm";
import { ArchivePlayerForm } from "@/components/players/ArchivePlayerForm";
import { updatePlayerAction, archivePlayerAction, deletePlayerAction } from "./actions";
import {
  getTeamByIdForCurrentUser,
  getCurrentUserTeamMembership,
} from "@/lib/db/teams";
import { getPlayerByIdForTeam } from "@/lib/db/players";

export const metadata: Metadata = { title: "Edit Player — GameIQ" };

const STAFF_ROLES = ["owner", "coach", "analyst"];
const MANAGER_ROLES = ["owner", "coach"];

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ teamId: string; playerId: string }>;
}) {
  const { teamId, playerId } = await params;

  const [team, membership, player] = await Promise.all([
    getTeamByIdForCurrentUser(teamId),
    getCurrentUserTeamMembership(teamId),
    getPlayerByIdForTeam(teamId, playerId),
  ]);

  if (!team || !membership) notFound();
  if (!player) notFound();

  if (!STAFF_ROLES.includes(membership.role)) {
    notFound();
  }

  const isManager = MANAGER_ROLES.includes(membership.role);
  const displayName =
    player.displayName ||
    [player.firstName, player.lastName].filter(Boolean).join(" ");

  return (
    <AppShell teamContext={{ teamId: team.id, teamName: team.name }}>
      <PageHeader
        title={`Edit — ${displayName}`}
        description={`Update ${displayName}'s profile on ${team.name}.`}
        breadcrumbs={[
          { label: "Teams", href: "/teams" },
          { label: team.name, href: `/teams/${teamId}` },
          { label: "Roster", href: `/teams/${teamId}/players` },
          { label: displayName },
        ]}
      />

      <PlayerForm
        action={updatePlayerAction}
        mode="edit"
        teamId={teamId}
        playerId={playerId}
        defaultValues={player}
        cancelHref={`/teams/${teamId}/players`}
      />

      <ArchivePlayerForm
        teamId={teamId}
        playerId={playerId}
        playerName={displayName}
        currentStatus={player.status}
        archiveAction={archivePlayerAction}
        deleteAction={deletePlayerAction}
        isManager={isManager}
      />
    </AppShell>
  );
}
