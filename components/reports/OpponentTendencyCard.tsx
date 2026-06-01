"use client";

import { useState } from "react";
import { Swords } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/Badge";
import { EvidenceTypeBadge } from "@/components/reports/EvidenceTypeBadge";
import { EditableReportSection } from "@/components/reports/EditableReportSection";
import { EditOpponentTendencyForm } from "@/components/reports/EditOpponentTendencyForm";
import { VerificationControls } from "@/components/reports/VerificationControls";
import type { OpponentTendency } from "@/types/database";

interface OpponentTendencyCardProps {
  tendency: OpponentTendency;
  teamId: string;
  gameId: string;
  gameReportId: string;
  canEdit: boolean;
}

export function OpponentTendencyCard({
  tendency,
  teamId,
  gameId,
  gameReportId,
  canEdit,
}: OpponentTendencyCardProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <Swords className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                <h3 className="text-sm font-semibold text-slate-100">{tendency.title}</h3>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <ConfidenceBadge level={tendency.confidence} />
                  <EditableReportSection
                    isEdited={tendency.isEdited}
                    verificationStatus={tendency.verificationStatus}
                    canEdit={canEdit}
                    onEdit={() => setEditOpen(true)}
                  />
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{tendency.description}</p>
            </div>
          </div>
        </div>

        {tendency.recommendedResponse && (
          <div className="border-t border-slate-800 px-5 py-3 bg-amber-500/5">
            <p className="text-xs font-semibold text-amber-400 mb-1">Recommended response</p>
            <p className="text-sm text-slate-300">{tendency.recommendedResponse}</p>
          </div>
        )}

        {(tendency.tags.length > 0 || tendency.evidence.length > 0) && (
          <div className="border-t border-slate-800 px-5 py-3 flex flex-wrap gap-1.5">
            {tendency.evidence.slice(0, 3).map((ev) => (
              <EvidenceTypeBadge key={ev.id} type={ev.type} />
            ))}
            {tendency.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs text-slate-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Verification controls */}
        {canEdit && (
          <div className="border-t border-slate-800 px-5 py-3">
            <VerificationControls
              teamId={teamId}
              gameId={gameId}
              gameReportId={gameReportId}
              targetType="opponent_tendency"
              targetId={tendency.id}
              currentStatus={tendency.verificationStatus}
              canEdit={canEdit}
            />
          </div>
        )}
      </div>

      {editOpen && (
        <EditOpponentTendencyForm
          tendency={tendency}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
