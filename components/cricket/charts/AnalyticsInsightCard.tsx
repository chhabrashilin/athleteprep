import type { MatchAnalyticsSummary } from "@/lib/cricket/types";

interface Props {
  summary: MatchAnalyticsSummary;
}

interface Insight {
  label: string;
  value: string;
  color?: string;
}

export function AnalyticsInsightCard({ summary }: Props) {
  const insights: Insight[] = [];

  if (summary.bestScoringPhase) {
    insights.push({ label: "Best scoring phase", value: summary.bestScoringPhase, color: "text-emerald-400" });
  }
  if (summary.mostEconomicalPhase) {
    insights.push({ label: "Most economical phase", value: summary.mostEconomicalPhase });
  }
  if (summary.biggestOver) {
    insights.push({ label: "Biggest over", value: `Over ${summary.biggestOver.overNumber + 1}: ${summary.biggestOver.runs} runs` });
  }
  if (summary.highestPartnership) {
    insights.push({ label: "Highest partnership", value: `${summary.highestPartnership.runs} runs (Wkt ${summary.highestPartnership.wicketNumber})` });
  }
  if (summary.collapseDetected && summary.collapseDescription) {
    insights.push({ label: "Batting collapse", value: summary.collapseDescription, color: "text-rose-400" });
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Key Insights</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight) => (
          <div key={insight.label}>
            <p className="text-xs text-slate-500">{insight.label}</p>
            <p className={`text-sm font-semibold mt-0.5 ${insight.color ?? "text-slate-200"}`}>
              {insight.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
