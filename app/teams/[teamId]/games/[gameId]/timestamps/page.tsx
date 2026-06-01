import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { TimestampWorkspace } from "@/components/timestamps/TimestampWorkspace";
import { AIReadinessBadge } from "@/components/analysis/AIReadinessBadge";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Settings } from "lucide-react";
import {
  getTeamByIdForCurrentUser,
  getCurrentUserTeamMembership,
} from "@/lib/db/teams";
import { getGameByIdForTeam } from "@/lib/db/games";
import {
  getPrimaryVideoAssetForGame,
  createSignedVideoUrl,
} from "@/lib/db/video-assets";
import { getPlayersForTeam } from "@/lib/db/players";
import { getEventTimestampsForGame } from "@/lib/db/timestamps";

export const metadata: Metadata = { title: "Key Moments — GameIQ" };

const STAFF_ROLES = ["owner", "coach", "analyst"];

export default async function TimestampsPage({
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

  const canEdit = STAFF_ROLES.includes(membership.role);

  const [primaryVideo, players, events] = await Promise.all([
    getPrimaryVideoAssetForGame(teamId, gameId),
    getPlayersForTeam(teamId),
    getEventTimestampsForGame(teamId, gameId),
  ]);

  const signedUrl = primaryVideo ? await createSignedVideoUrl(primaryVideo) : null;

  return (
    <AppShell teamContext={{ teamId: team.id, teamName: team.name }}>
      <PageHeader
        title="Key Moments"
        description={`Tag evidence-linked events for ${game.title}`}
        breadcrumbs={[
          { label: "Teams", href: "/teams" },
          { label: team.name, href: `/teams/${teamId}` },
          { label: "Games", href: `/teams/${teamId}/games` },
          { label: game.title, href: `/teams/${teamId}/games/${gameId}` },
          { label: "Key Moments" },
        ]}
        action={
          <Link href={`/teams/${teamId}/games/${gameId}/setup`}>
            <Button variant="secondary" size="sm">
              <Settings className="h-3.5 w-3.5" />
              Setup checklist
            </Button>
          </Link>
        }
      />

      {/* Product context banner */}
      <div className="mb-6 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
        <p className="text-sm font-medium text-sky-300 mb-1">
          How key moments power your AI report
        </p>
        <p className="text-sm text-slate-400">
          Each tagged event becomes evidence in your AI coaching insights. Mark goals, errors,
          transitions, set pieces, and tactical moments — then the AI links them to specific
          observations and recommendations with evidence references.
        </p>
      </div>

      {/* AI readiness */}
      <div className="mb-6">
        <AIReadinessBadge
          hasVideo={primaryVideo != null}
          timestampCount={events.length}
        />
      </div>

      {/* Main workspace: video player + event form/list */}
      <TimestampWorkspace
        teamId={teamId}
        gameId={gameId}
        sport={game.sport}
        signedUrl={signedUrl}
        videoAsset={primaryVideo}
        players={players}
        initialEvents={events}
        canEdit={canEdit}
      />

      {/* Footer navigation */}
      <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6">
        <Link href={`/teams/${teamId}/games/${gameId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to game
          </Button>
        </Link>
        <Link href={`/teams/${teamId}/games/${gameId}/report`}>
          <Button variant="secondary" size="sm" disabled={events.length === 0}>
            View AI report
          </Button>
        </Link>
      </div>
    </AppShell>
  );
}
