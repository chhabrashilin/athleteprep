import { CheckCircle2, XCircle, Film, Users, FileText, Swords } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/Badge";
import type { GameReport } from "@/types/database";

interface ReportBasis {
  eventCount: number;
  hasVideo: boolean;
  rosterCount: number;
  hasCoachNotes: boolean;
  hasOpponentNotes: boolean;
}

interface ReportOverviewProps {
  report: GameReport;
  basis: ReportBasis;
}

function BasisRow({
  icon: Icon,
  label,
  value,
  positive,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Icon className="h-4 w-4 text-slate-600 shrink-0" />
        {label}
      </div>
      <div className="flex items-center gap-1.5 text-sm">
        {positive ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <XCircle className="h-3.5 w-3.5 text-slate-600" />
        )}
        <span className={positive ? "text-slate-300" : "text-slate-600"}>{value}</span>
      </div>
    </div>
  );
}

export function ReportOverview({ report, basis }: ReportOverviewProps) {
  return (
    <section id="overview" className="space-y-5">
      <h2 className="text-lg font-semibold text-slate-100">Overview</h2>

      {/* Executive summary */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300">Executive Summary</h3>
          <ConfidenceBadge level={report.overallConfidence} />
        </div>
        <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
          {report.executiveSummary}
        </p>
      </div>

      {/* Report basis */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300">Report basis</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            What data was available when this report was generated.
          </p>
        </div>
        <div className="px-5 py-2">
          <BasisRow
            icon={FileText}
            label="Key moments"
            value={basis.eventCount === 0 ? "None tagged" : `${basis.eventCount} events tagged`}
            positive={basis.eventCount > 0}
          />
          <BasisRow
            icon={Film}
            label="Game video"
            value={basis.hasVideo ? "Uploaded" : "Not uploaded"}
            positive={basis.hasVideo}
          />
          <BasisRow
            icon={Users}
            label="Roster"
            value={basis.rosterCount === 0 ? "Empty" : `${basis.rosterCount} active players`}
            positive={basis.rosterCount > 0}
          />
          <BasisRow
            icon={FileText}
            label="Coach notes"
            value={basis.hasCoachNotes ? "Included" : "Not provided"}
            positive={basis.hasCoachNotes}
          />
          <BasisRow
            icon={Swords}
            label="Opponent notes"
            value={basis.hasOpponentNotes ? "Included" : "Not provided"}
            positive={basis.hasOpponentNotes}
          />
        </div>
      </div>

      {/* Honest disclaimer */}
      <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
        <p className="text-sm font-medium text-sky-300 mb-1">How this report was generated</p>
        <p className="text-sm text-slate-400">
          This report uses manually tagged key moments, coach notes, opponent notes, and game metadata
          as evidence. GameIQ v1 does not perform automated frame-by-frame video analysis.
          All insights are grounded in the structured inputs you provided.
        </p>
      </div>
    </section>
  );
}
