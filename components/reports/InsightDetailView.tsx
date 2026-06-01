"use client";

import { useRef, useState, useCallback } from "react";
import { AlertCircle, Zap, Info, Users, Film } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/Badge";
import { GameVideoPlayer, type GameVideoPlayerHandle } from "@/components/video/GameVideoPlayer";
import { EvidenceList } from "@/components/reports/EvidenceList";
import { VerificationControls } from "@/components/reports/VerificationControls";
import { EditedBadge } from "@/components/reports/EditedBadge";
import { EditCoachingInsightForm } from "@/components/reports/EditCoachingInsightForm";
import {
  resolveEvidenceList,
  buildEventMap,
  buildPlayerMap,
  getTimestampEvidence,
} from "@/lib/analysis/evidence";
import type { CoachingInsight, EventTimestamp, Player, VideoAsset } from "@/types/database";

interface InsightDetailViewProps {
  insight: CoachingInsight;
  evidenceEvents: EventTimestamp[];
  players: Player[];
  videoAsset: VideoAsset | null;
  signedVideoUrl: string | null;
  teamId: string;
  gameId: string;
  gameReportId: string;
  canEdit: boolean;
  verificationFeedback?: Array<{
    id: string;
    verificationStatus: string;
    feedbackText: string | null;
    correctionText: string | null;
    createdAt: string;
  }>;
}

function SectionLabel({ label }: { label: string }) {
  return <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</p>;
}

export function InsightDetailView({
  insight,
  evidenceEvents,
  players,
  videoAsset,
  signedVideoUrl,
  teamId,
  gameId,
  gameReportId,
  canEdit,
  verificationFeedback = [],
}: InsightDetailViewProps) {
  const videoRef = useRef<GameVideoPlayerHandle>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const eventMap = buildEventMap(evidenceEvents);
  const playerMap = buildPlayerMap(players);
  const resolvedEvidence = resolveEvidenceList(insight.evidence, eventMap, playerMap);
  const timestampEvidence = getTimestampEvidence(resolvedEvidence);
  const hasVideo = !!videoAsset && !!signedVideoUrl;

  const handleTimeUpdate = useCallback((seconds: number) => {
    setCurrentVideoTime(seconds);
  }, []);

  function handleSeek(seconds: number, itemId: string) {
    videoRef.current?.seekTo(seconds);
    setSelectedEvidenceId(itemId);
    document.getElementById("video-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const affectedPlayers = insight.affectedPlayerIds
    .map((id) => playerMap.get(id))
    .filter((p): p is Player => p != null);

  return (
    <>
      <div className="space-y-6">
        {/* Insight header card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <h1 className="text-xl font-bold text-slate-50 flex-1">{insight.title}</h1>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <ConfidenceBadge level={insight.confidence} />
              {insight.isEdited && <EditedBadge />}
            </div>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">{insight.summary}</p>
        </div>

        {/* Two-column layout: details + video */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: insight details + evidence */}
          <div className="space-y-5">
            {insight.whyItMatters && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <SectionLabel label="Why it matters" />
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300">{insight.whyItMatters}</p>
                </div>
              </div>
            )}

            {insight.recommendedAction && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <SectionLabel label="Recommended action" />
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-200 font-medium">{insight.recommendedAction}</p>
                </div>
              </div>
            )}

            {insight.assumptions.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <SectionLabel label="Assumptions" />
                <div className="flex items-start gap-2 mb-2">
                  <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500">How this insight was derived.</p>
                </div>
                <ul className="space-y-1">
                  {insight.assumptions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="text-sky-400/60 shrink-0 mt-0.5">·</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {affectedPlayers.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <SectionLabel label="Players involved" />
                <div className="flex items-center gap-2 flex-wrap">
                  <Users className="h-4 w-4 text-slate-500" />
                  {affectedPlayers.map((p) => (
                    <span
                      key={p.id}
                      className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300"
                    >
                      {p.jerseyNumber ? `#${p.jerseyNumber} ` : ""}
                      {p.displayName ?? p.firstName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence list */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <SectionLabel label={`Evidence (${resolvedEvidence.length})`} />
              <EvidenceList
                items={resolvedEvidence}
                selectedId={selectedEvidenceId}
                onSeek={hasVideo ? handleSeek : undefined}
                emptyMessage="No evidence references for this insight."
              />
              {!hasVideo && timestampEvidence.length > 0 && (
                <p className="text-xs text-slate-600 mt-3">
                  Upload game video to enable timestamp seeking from evidence.
                </p>
              )}
            </div>
          </div>

          {/* Right: video + verification panel */}
          <div id="video-panel" className="space-y-4">
            {hasVideo ? (
              <>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-1">
                  <GameVideoPlayer
                    ref={videoRef}
                    signedUrl={signedVideoUrl!}
                    videoAsset={videoAsset!}
                    onTimeUpdate={handleTimeUpdate}
                  />
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                  <p className="text-xs text-slate-500 mb-0.5">Current position</p>
                  <p className="text-base font-mono font-bold text-sky-400">
                    {String(Math.floor(currentVideoTime / 60)).padStart(2, "0")}:
                    {String(Math.floor(currentVideoTime % 60)).padStart(2, "0")}
                  </p>
                  {timestampEvidence.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Click a timestamp evidence card to jump the video.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-14 text-center">
                <Film className="h-8 w-8 text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-400 mb-1">No video uploaded</p>
                <p className="text-xs text-slate-500 max-w-xs">
                  Upload game film to enable evidence timestamp seeking.
                </p>
              </div>
            )}

            {/* Coach verification panel */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Coach verification
              </p>
              <VerificationControls
                teamId={teamId}
                gameId={gameId}
                gameReportId={gameReportId}
                targetType="coaching_insight"
                targetId={insight.id}
                currentStatus={insight.verificationStatus}
                canEdit={canEdit}
              />
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-sky-500/40 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                >
                  Edit this insight
                </button>
              )}
              {insight.isEdited && (
                <p className="text-xs text-slate-600">
                  Original AI output preserved.
                </p>
              )}

              {/* Verification history */}
              {verificationFeedback.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Verification history
                  </p>
                  {verificationFeedback.slice(0, 3).map((fb) => (
                    <div key={fb.id} className="rounded border border-slate-800 px-2.5 py-2 bg-slate-800/40">
                      <p className="text-xs text-slate-500">
                        <span className="capitalize font-medium text-slate-400">
                          {fb.verificationStatus.replace(/_/g, " ")}
                        </span>{" "}
                        · {new Date(fb.createdAt).toLocaleDateString()}
                      </p>
                      {fb.correctionText && (
                        <p className="text-xs text-slate-500 mt-0.5 italic">{fb.correctionText}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <EditCoachingInsightForm
          insight={insight}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
