import { Users } from "lucide-react";
import { PlayerReportCard } from "@/components/reports/PlayerReportCard";
import type { PlayerReport } from "@/types/database";

interface PlayerReportsSectionProps {
  playerReports: PlayerReport[];
  teamId: string;
  gameId: string;
  gameReportId: string;
  canEdit: boolean;
}

export function PlayerReportsSection({
  playerReports,
  teamId,
  gameId,
  gameReportId,
  canEdit,
}: PlayerReportsSectionProps) {
  return (
    <section id="players" className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-emerald-400" />
        <h2 className="text-lg font-semibold text-slate-100">
          Player Reports
          <span className="ml-2 text-sm font-normal text-slate-500">({playerReports.length})</span>
        </h2>
      </div>

      {playerReports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-10 text-center">
          <p className="text-sm text-slate-500 mb-2">No player reports in this report.</p>
          <p className="text-xs text-slate-600">
            Tag players in key moments to generate player-specific feedback.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {playerReports.map((pr) => (
            <PlayerReportCard
              key={pr.id}
              report={pr}
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
