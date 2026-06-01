import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { InsightDetailView } from "@/components/reports/InsightDetailView";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import {
  getTeamByIdForCurrentUser,
  getCurrentUserTeamMembership,
} from "@/lib/db/teams";
import { getGameByIdForTeam } from "@/lib/db/games";
import { getCoachingInsightById } from "@/lib/db/reports";
import { getVerificationFeedbackForTarget } from "@/lib/db/verification";
import { getPlayersForTeam } from "@/lib/db/players";
import {
  getPrimaryVideoAssetForGame,
  createSignedVideoUrl,
} from "@/lib/db/video-assets";

const STAFF_ROLES = ["owner", "coach", "analyst"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string; gameId: string; insightId: string }>;
}): Promise<Metadata> {
  const { teamId, gameId, insightId } = await params;
  const insight = await getCoachingInsightById(teamId, gameId, insightId);
  return { title: insight ? `${insight.title} — GameIQ` : "Coaching Insight — GameIQ" };
}

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ teamId: string; gameId: string; insightId: string }>;
}) {
  const { teamId, gameId, insightId } = await params;

  const [team, membership, game] = await Promise.all([
    getTeamByIdForCurrentUser(teamId),
    getCurrentUserTeamMembership(teamId),
    getGameByIdForTeam(teamId, gameId),
  ]);

  if (!team || !membership) notFound();
  if (!game) notFound();

  const canEdit = STAFF_ROLES.includes(membership.role);

  const insight = await getCoachingInsightById(teamId, gameId, insightId);
  if (!insight) notFound();

  // Collect evidence event IDs
  const evidenceEventIds = insight.evidence
    .map((ev) => ev.eventId)
    .filter((id): id is string => !!id);

  const [players, videoAsset, verificationFeedback] = await Promise.all([
    getPlayersForTeam(teamId),
    getPrimaryVideoAssetForGame(teamId, gameId),
    getVerificationFeedbackForTarget(teamId, "coaching_insight", insightId),
  ]);

  // Fetch referenced event timestamps
  let evidenceEvents: import("@/types/database").EventTimestamp[] = [];
  if (evidenceEventIds.length > 0) {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from("event_timestamps")
        .select("*")
        .eq("team_id", teamId)
        .in("id", evidenceEventIds);

      evidenceEvents = (data ?? []).map((row) => {
        const r = row as Record<string, unknown>;
        return {
          id: r.id as string,
          teamId: r.team_id as string,
          gameId: r.game_id as string,
          videoAssetId: (r.video_asset_id as string | null) ?? null,
          createdBy: (r.created_by as string | null) ?? null,
          timestampSeconds: Number(r.timestamp_seconds),
          endTimestampSeconds: r.end_timestamp_seconds != null ? Number(r.end_timestamp_seconds) : null,
          label: r.label as string,
          eventType: (r.event_type as string | null) ?? null,
          teamContext: (r.team_context as string | null) ?? null,
          description: (r.description as string | null) ?? null,
          importance: (r.importance as "low" | "medium" | "high" | "critical") ?? "medium",
          tags: (r.tags as string[]) ?? [],
          playerIds: (r.player_ids as string[]) ?? [],
          opponentPlayerNames: (r.opponent_player_names as string[]) ?? [],
          isAiGenerated: (r.is_ai_generated as boolean) ?? false,
          confidence: null,
          metadata: (r.metadata as Record<string, unknown>) ?? {},
          createdAt: r.created_at as string,
          updatedAt: r.updated_at as string,
        };
      });
    }
  }

  const signedVideoUrl = videoAsset ? await createSignedVideoUrl(videoAsset) : null;

  return (
    <AppShell teamContext={{ teamId: team.id, teamName: team.name }}>
      <PageHeader
        title={insight.title}
        description={`Coaching insight from ${game.title}`}
        breadcrumbs={[
          { label: "Teams", href: "/teams" },
          { label: team.name, href: `/teams/${teamId}` },
          { label: "Games", href: `/teams/${teamId}/games` },
          { label: game.title, href: `/teams/${teamId}/games/${gameId}` },
          { label: "Report", href: `/teams/${teamId}/games/${gameId}/report` },
          { label: "Insight" },
        ]}
      />

      <InsightDetailView
        insight={insight}
        evidenceEvents={evidenceEvents}
        players={players}
        videoAsset={videoAsset}
        signedVideoUrl={signedVideoUrl}
        teamId={teamId}
        gameId={gameId}
        gameReportId={insight.gameReportId}
        canEdit={canEdit}
        verificationFeedback={verificationFeedback.map((fb) => ({
          id: fb.id,
          verificationStatus: fb.verificationStatus,
          feedbackText: fb.feedbackText,
          correctionText: fb.correctionText,
          createdAt: fb.createdAt,
        }))}
      />

      <div className="mt-8 border-t border-slate-800 pt-6">
        <Link href={`/teams/${teamId}/games/${gameId}/report`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to report
          </Button>
        </Link>
      </div>
    </AppShell>
  );
}
