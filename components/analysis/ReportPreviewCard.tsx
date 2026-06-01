import { BarChart3, Users, Target, Swords, FileText } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { GameReportFull } from "@/types/database";

interface ReportPreviewCardProps {
  report: GameReportFull;
  teamId: string;
  gameId: string;
}

export function ReportPreviewCard({
  report,
}: ReportPreviewCardProps) {

  return (
    <div className="space-y-5">
      {/* Report header */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-emerald-400" />
              <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">
                AI Report v{report.reportVersion}
              </p>
            </div>
            <h3 className="text-base font-semibold text-slate-100 mb-2">
              {report.title}
            </h3>
            <div className="flex items-center gap-3">
              <ConfidenceBadge level={report.overallConfidence} />
              <span className="text-xs text-slate-500">
                Generated {new Date(report.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Executive summary */}
        <div className="mt-4 pt-4 border-t border-emerald-500/20">
          <p className="text-sm text-slate-400 leading-relaxed line-clamp-4">
            {report.executiveSummary}
          </p>
        </div>
      </div>

      {/* Section counts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            icon: <BarChart3 className="h-4 w-4 text-sky-400" />,
            count: report.insights.length,
            label: "Insights",
          },
          {
            icon: <Users className="h-4 w-4 text-emerald-400" />,
            count: report.playerReports.length,
            label: "Player reports",
          },
          {
            icon: <Target className="h-4 w-4 text-amber-400" />,
            count: report.practiceRecommendations.length,
            label: "Practice recs",
          },
          {
            icon: <Swords className="h-4 w-4 text-violet-400" />,
            count: report.opponentTendencies.length,
            label: "Opp. tendencies",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-center"
          >
            <div className="flex justify-center mb-1">{stat.icon}</div>
            <p className="text-lg font-bold text-slate-100">{stat.count}</p>
            <p className="text-xs text-slate-500 leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Top insights preview */}
      {report.insights.length > 0 && (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-sky-400" />
              Top Coaching Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-800">
              {report.insights.slice(0, 3).map((insight) => (
                <li key={insight.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {insight.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {insight.summary}
                      </p>
                    </div>
                    <ConfidenceBadge level={insight.confidence} className="shrink-0" />
                  </div>
                </li>
              ))}
            </ul>
            {report.insights.length > 3 && (
              <p className="text-xs text-slate-500 mt-3 text-center">
                +{report.insights.length - 3} more insight{report.insights.length - 3 !== 1 ? "s" : ""} in the full report
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assumptions + limitations */}
      {(report.assumptions.length > 0 || report.limitations.length > 0) && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
          {report.assumptions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Assumptions
              </p>
              <ul className="space-y-1">
                {report.assumptions.slice(0, 3).map((a, i) => (
                  <li key={i} className="text-xs text-slate-500 flex gap-2">
                    <span className="shrink-0">·</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {report.limitations.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Limitations
              </p>
              <ul className="space-y-1">
                {report.limitations.slice(0, 2).map((l, i) => (
                  <li key={i} className="text-xs text-slate-500 flex gap-2">
                    <span className="shrink-0">·</span>
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Coming in Prompt 10 notice */}
      <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
        <p className="text-sm font-medium text-sky-400 mb-1">Full Report Dashboard — Coming in Prompt 10</p>
        <p className="text-sm text-slate-400">
          The complete report dashboard with per-insight detail views, player-by-player breakdowns,
          verification controls, and clip references will be built next.
          All data is stored and ready.
        </p>
      </div>
    </div>
  );
}
