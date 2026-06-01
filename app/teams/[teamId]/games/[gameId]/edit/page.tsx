import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { GameForm } from "@/components/games/GameForm";
import { ArchiveGameForm } from "@/components/games/ArchiveGameForm";
import { updateGameAction, archiveGameAction, deleteGameAction } from "./actions";
import {
  getTeamByIdForCurrentUser,
  getCurrentUserTeamMembership,
} from "@/lib/db/teams";
import { getGameByIdForTeam } from "@/lib/db/games";

export const metadata: Metadata = { title: "Edit Analysis — GameIQ" };

const STAFF_ROLES   = ["owner", "coach", "analyst"];
const MANAGER_ROLES = ["owner", "coach"];

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ teamId: string; gameId: string }>;
}) {
  const { teamId, gameId } = await params;

  const [team, membership, game] = await Promise.all([
    getTeamByIdForCurrentUser(teamId),
    getCurrentUserTeamMembership(teamId),
    getGameByIdForTeam(teamId, gameId),
  ]);

  if (!team || !membership) notFound();
  if (!game) notFound();
  if (!STAFF_ROLES.includes(membership.role)) notFound();

  const isManager = MANAGER_ROLES.includes(membership.role);

  return (
    <AppShell teamContext={{ teamId: team.id, teamName: team.name }}>
      <PageHeader
        title={`Edit — ${game.title}`}
        description={`Update this analysis record for ${team.name}.`}
        breadcrumbs={[
          { label: "Teams", href: "/teams" },
          { label: team.name, href: `/teams/${teamId}` },
          { label: "Games", href: `/teams/${teamId}/games` },
          { label: game.title, href: `/teams/${teamId}/games/${gameId}` },
          { label: "Edit" },
        ]}
      />

      <GameForm
        action={updateGameAction}
        mode="edit"
        teamId={teamId}
        gameId={gameId}
        defaultValues={game}
        cancelHref={`/teams/${teamId}/games/${gameId}`}
      />

      <ArchiveGameForm
        teamId={teamId}
        gameId={gameId}
        gameTitle={game.title}
        currentStatus={game.status}
        archiveAction={archiveGameAction}
        deleteAction={deleteGameAction}
        isManager={isManager}
      />
    </AppShell>
  );
}
