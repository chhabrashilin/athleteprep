import { BarChart3 } from "lucide-react";
import { CoachingInsightCard } from "@/components/reports/CoachingInsightCard";
import type { CoachingInsight, Player } from "@/types/database";

interface CoachingInsightsSectionProps {
  insights: CoachingInsight[];
  players: Player[];
  teamId: string;
  gameId: string;
  gameReportId: string;
  canEdit: boolean;
}

export function CoachingInsightsSection({
  insights,
  players,
  teamId,
  gameId,
  gameReportId,
  canEdit,
}: CoachingInsightsSectionProps) {
  return (
    <section id="insights" className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-sky-400" />
        <h2 className="text-lg font-semibold text-slate-100">
          Coaching Insights
          <span className="ml-2 text-sm font-normal text-slate-500">({insights.length})</span>
        </h2>
      </div>

      {insights.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-10 text-center">
          <p className="text-sm text-slate-500">No coaching insights in this report.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <CoachingInsightCard
              key={insight.id}
              insight={insight}
              players={players}
              teamId={teamId}
              gameId={gameId}
              gameReportId={gameReportId}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </section>
  );
}
