import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { PlayerRosterStats } from "@/components/players/PlayerRosterStats";
import { RosterList } from "@/components/players/RosterList";
import { PlayerEmptyState } from "@/components/players/PlayerEmptyState";
import { Plus } from "lucide-react";
import {
  getTeamByIdForCurrentUser,
  getCurrentUserTeamMembership,
} from "@/lib/db/teams";
import { getPlayersForTeam } from "@/lib/db/players";

export const metadata: Metadata = { title: "Roster — GameIQ" };

const STAFF_ROLES = ["owner", "coach", "analyst"];

export default async function PlayersPage({
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

  const canEdit = STAFF_ROLES.includes(membership.role);

  // Fetch all players (including archived) so filters can surface them.
  const players = await getPlayersForTeam(teamId, { includeArchived: true });

  // Extract unique non-empty positions for the position filter.
  const positions = [
    ...new Set(
      players
        .filter((p) => p.position && p.status !== "archived")
        .map((p) => p.position as string)
    ),
  ].sort();

  // Players shown by default (exclude archived unless coach chooses to show them)
  const nonArchivedPlayers = players.filter((p) => p.status !== "archived");

  return (
    <AppShell teamContext={{ teamId: team.id, teamName: team.name }}>
      <PageHeader
        title="Roster"
        description={`Manage the players GameIQ will use for reports, clips, and player-specific feedback.`}
        breadcrumbs={[
          { label: "Teams", href: "/teams" },
          { label: team.name, href: `/teams/${teamId}` },
          { label: "Roster" },
        ]}
        action={
          canEdit ? (
            <Link href={`/teams/${teamId}/players/new`}>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Add player
              </Button>
            </Link>
          ) : undefined
        }
      />

      {players.length > 0 && (
        <PlayerRosterStats players={nonArchivedPlayers} />
      )}

      {players.length === 0 ? (
        <PlayerEmptyState teamId={teamId} canEdit={canEdit} />
      ) : (
        <RosterList
          players={players}
          positions={positions}
          canEdit={canEdit}
          teamId={teamId}
        />
      )}
    </AppShell>
  );
}
