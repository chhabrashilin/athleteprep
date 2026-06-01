"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, ChevronRight, Lightbulb, AlertCircle, Zap } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/Badge";
import { EvidenceTypeBadge } from "@/components/reports/EvidenceTypeBadge";
import { EditableReportSection } from "@/components/reports/EditableReportSection";
import { EditCoachingInsightForm } from "@/components/reports/EditCoachingInsightForm";
import { VerificationControls } from "@/components/reports/VerificationControls";
import type { CoachingInsight, Player } from "@/types/database";

interface CoachingInsightCardProps {
  insight: CoachingInsight;
  players: Player[];
  teamId: string;
  gameId: string;
  gameReportId: string;
  canEdit: boolean;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</p>
  );
}

export function CoachingInsightCard({
  insight,
  players,
  teamId,
  gameId,
  gameReportId,
  canEdit,
}: CoachingInsightCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const playerMap = new Map(players.map((p) => [p.id, p]));

  const affectedPlayers = insight.affectedPlayerIds
    .map((id) => playerMap.get(id))
    .filter((p): p is Player => p != null);

  const evidenceCount = insight.evidence.length;

  return (
    <>
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-start gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 mt-0.5">
            <Lightbulb className="h-4 w-4 text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
              <h3 className="text-sm font-semibold text-slate-100">{insight.title}</h3>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <ConfidenceBadge level={insight.confidence} />
                <EditableReportSection
                  isEdited={insight.isEdited}
                  verificationStatus={insight.verificationStatus}
                  canEdit={canEdit}
                  onEdit={() => setEditOpen(true)}
                />
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{insight.summary}</p>
          </div>
        </div>

        {/* Body */}
        <div className="border-t border-slate-800 px-5 py-4 space-y-4">
          {insight.whyItMatters && (
            <div>
              <SectionLabel label="Why it matters" />
              <div className="flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-400">{insight.whyItMatters}</p>
              </div>
            </div>
          )}

          {insight.recommendedAction && (
            <div>
              <SectionLabel label="Recommended action" />
              <div className="flex items-start gap-2">
                <Zap className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300 font-medium">{insight.recommendedAction}</p>
              </div>
            </div>
          )}

          {/* Evidence count + type chips */}
          {evidenceCount > 0 && (
            <div>
              <SectionLabel label="Evidence" />
              <div className="flex flex-wrap gap-1.5">
                {insight.evidence.slice(0, 4).map((ev) => (
                  <EvidenceTypeBadge key={ev.id} type={ev.type} />
                ))}
                {evidenceCount > 4 && (
                  <span className="text-xs text-slate-500 self-center">+{evidenceCount - 4} more</span>
                )}
              </div>
            </div>
          )}

          {/* Affected players */}
          {affectedPlayers.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Users className="h-3.5 w-3.5 shrink-0" />
              {affectedPlayers.map((p) => p.displayName ?? p.firstName).join(", ")}
            </div>
          )}

          {/* Inline verification controls */}
          {canEdit && (
            <div className="pt-1 border-t border-slate-800/60">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Mark this insight
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
            </div>
          )}
        </div>

        {/* Footer — link to detail */}
        <Link
          href={`/teams/${teamId}/games/${gameId}/report/insights/${insight.id}`}
          className="flex items-center justify-between px-5 py-3 bg-slate-800/40 border-t border-slate-800 hover:bg-slate-800 transition-colors group"
        >
          <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
            View full insight with evidence →
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-sky-400 transition-colors" />
        </Link>
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
