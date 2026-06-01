"use client";

import { useState } from "react";
import { Clock, Target, Users } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/Badge";
import { EditableReportSection } from "@/components/reports/EditableReportSection";
import { EditPracticeRecommendationForm } from "@/components/reports/EditPracticeRecommendationForm";
import { VerificationControls } from "@/components/reports/VerificationControls";
import type { PracticeRecommendation, Player } from "@/types/database";

interface PracticeRecommendationCardProps {
  recommendation: PracticeRecommendation;
  players: Player[];
  rank: number;
  teamId: string;
  gameId: string;
  gameReportId: string;
  canEdit: boolean;
}

export function PracticeRecommendationCard({
  recommendation: rec,
  players,
  rank,
  teamId,
  gameId,
  gameReportId,
  canEdit,
}: PracticeRecommendationCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const taggedPlayers = rec.playerIds
    .map((id) => playerMap.get(id))
    .filter((p): p is Player => p != null);

  return (
    <>
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-start gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-400">
            {rank}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
              <h3 className="text-sm font-semibold text-slate-100">{rec.title}</h3>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <ConfidenceBadge level={rec.confidence} />
                <EditableReportSection
                  isEdited={rec.isEdited}
                  verificationStatus={rec.verificationStatus}
                  canEdit={canEdit}
                  onEdit={() => setEditOpen(true)}
                />
              </div>
            </div>
            {rec.description && (
              <p className="text-sm text-slate-400">{rec.description}</p>
            )}
          </div>
        </div>

        {/* Drill details */}
        <div className="border-t border-slate-800 px-5 py-3 space-y-3">
          <div className="flex flex-wrap gap-4 text-sm">
            {rec.drillName && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <Target className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="font-medium">{rec.drillName}</span>
              </div>
            )}
            {rec.durationMinutes && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                {rec.durationMinutes} min
              </div>
            )}
            {taggedPlayers.length > 0 && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <Users className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                {taggedPlayers.map((p) => p.displayName ?? p.firstName).join(", ")}
              </div>
            )}
          </div>

          {rec.coachingPoints.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Coaching points</p>
              <ul className="space-y-1">
                {rec.coachingPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-sky-400 shrink-0 mt-0.5">·</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Verification controls */}
          {canEdit && (
            <div className="pt-2 border-t border-slate-800/60">
              <VerificationControls
                teamId={teamId}
                gameId={gameId}
                gameReportId={gameReportId}
                targetType="practice_recommendation"
                targetId={rec.id}
                currentStatus={rec.verificationStatus}
                canEdit={canEdit}
              />
            </div>
          )}
        </div>
      </div>

      {editOpen && (
        <EditPracticeRecommendationForm
          recommendation={rec}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
