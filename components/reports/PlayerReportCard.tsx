"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/Badge";
import { EditableReportSection } from "@/components/reports/EditableReportSection";
import { EditPlayerReportForm } from "@/components/reports/EditPlayerReportForm";
import { VerificationControls } from "@/components/reports/VerificationControls";
import { formatSecondsAsTimestamp } from "@/lib/utils/time";
import type { PlayerReport } from "@/types/database";

interface PlayerReportCardProps {
  report: PlayerReport;
  teamId: string;
  gameId: string;
  gameReportId: string;
  canEdit: boolean;
}

export function PlayerReportCard({
  report,
  teamId,
  gameId,
  gameReportId,
  canEdit,
}: PlayerReportCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const dataCoverage = (report.metadata as Record<string, unknown>)?.dataCoverage as string | undefined;

  return (
    <>
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        {/* Header — always visible */}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-800/40 transition-colors text-left"
          aria-expanded={expanded}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-400">
            {(report.playerDisplayName?.[0] ?? "?").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100">
              {report.playerDisplayName ?? "Unknown player"}
            </p>
            {report.summary && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">{report.summary}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <ConfidenceBadge level={report.confidence} />
            {report.isEdited && (
              <EditableReportSection isEdited verificationStatus={report.verificationStatus} />
            )}
            {!report.isEdited && (
              <EditableReportSection verificationStatus={report.verificationStatus} />
            )}
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            )}
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-slate-800 px-5 py-4 space-y-4">
            {dataCoverage && (
              <p className="text-xs text-slate-500">{dataCoverage}</p>
            )}

            {report.strengths.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Strengths</p>
                <ul className="space-y-1">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="text-emerald-400 shrink-0 mt-0.5">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.improvementAreas.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Areas for improvement</p>
                <ul className="space-y-1">
                  {report.improvementAreas.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.keyMoments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Key moments</p>
                <div className="space-y-1.5">
                  {report.keyMoments.map((m, i) => {
                    const ts = (m as unknown as Record<string, unknown>).timestampSeconds as number | undefined;
                    return (
                      <div key={i} className="rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2">
                        {ts != null && (
                          <span className="flex items-center gap-1 text-xs font-mono text-sky-400 mb-0.5">
                            <Clock className="h-3 w-3" />
                            {formatSecondsAsTimestamp(ts)}
                          </span>
                        )}
                        <p className="text-xs text-slate-400">{m.description}</p>
                        {m.significance && (
                          <p className="text-xs text-slate-600 mt-0.5">{m.significance}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {report.recommendedFocus && (
              <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2">
                <p className="text-xs font-semibold text-sky-400 mb-0.5">Recommended focus</p>
                <p className="text-sm text-slate-300">{report.recommendedFocus}</p>
              </div>
            )}

            {report.playerFacingSummary && (
              <div className="rounded-lg border border-slate-700 bg-slate-800/30 px-3 py-2">
                <p className="text-xs font-semibold text-slate-500 mb-0.5 uppercase tracking-wider">Player summary</p>
                <p className="text-sm text-slate-400 italic">&ldquo;{report.playerFacingSummary}&rdquo;</p>
              </div>
            )}

            {/* Verification + edit controls */}
            {canEdit && (
              <div className="pt-2 border-t border-slate-800/60 space-y-3">
                <VerificationControls
                  teamId={teamId}
                  gameId={gameId}
                  gameReportId={gameReportId}
                  targetType="player_report"
                  targetId={report.id}
                  currentStatus={report.verificationStatus}
                  canEdit={canEdit}
                />
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-sky-500/40 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                >
                  Edit player report
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {editOpen && (
        <EditPlayerReportForm
          report={report}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
