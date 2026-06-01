import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { GameSummaryStats } from "@/components/games/GameSummaryStats";
import { GameList } from "@/components/games/GameList";
import { GameEmptyState } from "@/components/games/GameEmptyState";
import { Plus } from "lucide-react";
import {
  getTeamByIdForCurrentUser,
  getCurrentUserTeamMembership,
} from "@/lib/db/teams";
import { getGamesForTeam } from "@/lib/db/games";
import { getVideoStatusForGames } from "@/lib/db/video-assets";

export const metadata: Metadata = { title: "Games — GameIQ" };

const STAFF_ROLES = ["owner", "coach", "analyst"];

export default async function GamesPage({
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
  const games = await getGamesForTeam(teamId, { includeArchived: true });

  // Batch fetch video status for all non-archived games (single query, no N+1).
  const nonArchivedIds = games
    .filter((g) => g.status !== "archived")
    .map((g) => g.id);
  const videoStatus =
    nonArchivedIds.length > 0
      ? await getVideoStatusForGames(teamId, nonArchivedIds)
      : {};

  return (
    <AppShell teamContext={{ teamId: team.id, teamName: team.name }}>
      <PageHeader
        title="Games &amp; Practices"
        description="Create analysis records for matches, practices, scrimmages, and film sessions."
        breadcrumbs={[
          { label: "Teams", href: "/teams" },
          { label: team.name, href: `/teams/${teamId}` },
          { label: "Games" },
        ]}
        action={
          canEdit ? (
            <Link href={`/teams/${teamId}/games/new`}>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                New analysis
              </Button>
            </Link>
          ) : undefined
        }
      />

      {games.length > 0 && (
        <GameSummaryStats games={games.filter((g) => g.status !== "archived")} />
      )}

      {games.length === 0 ? (
        <GameEmptyState teamId={teamId} canEdit={canEdit} />
      ) : (
        <GameList
          games={games}
          canEdit={canEdit}
          teamId={teamId}
          videoStatus={videoStatus}
        />
      )}
    </AppShell>
  );
}
