import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfidenceBadge } from "@/components/ui/Badge";
import { ReportVersionBadge } from "@/components/reports/ReportVersionBadge";
import { GenerateReportButton } from "@/components/analysis/GenerateReportButton";
import type { GameReport, Game } from "@/types/database";
import type { ReactNode } from "react";

interface ReportHeaderProps {
  report: GameReport;
  game: Game;
  teamId: string;
  gameId: string;
  canRegenerate: boolean;
  canGenerate: boolean;
  shareButton?: ReactNode;
  exportButton?: ReactNode;
  providerLabel?: string;
}

export function ReportHeader({
  report,
  game,
  teamId,
  gameId,
  canRegenerate,
  canGenerate,
  shareButton,
  exportButton,
  providerLabel,
}: ReportHeaderProps) {
  const opponentLabel = game.opponentName ? ` vs. ${game.opponentName}` : "";
  const dateLabel = game.gameDate
    ? ` · ${new Date(game.gameDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : "";
  const resultLabel =
    game.result && game.result.toLowerCase() !== "n/a" && game.result.toLowerCase() !== "not played"
      ? ` · ${game.result}`
      : "";

  return (
    <div className="mb-8 space-y-4">
      {/* Navigation bar */}
      <div className="flex items-center justify-between">
        <Link href={`/teams/${teamId}/games/${gameId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to game
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {shareButton ?? (
            <Button variant="secondary" size="sm" disabled>
              <Lock className="h-3.5 w-3.5" />
              Share
            </Button>
          )}
          {exportButton ?? (
            <Button variant="secondary" size="sm" disabled>
              <Lock className="h-3.5 w-3.5" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Report identity */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              AI Report
              {report.aiGenerated && (
                <span className="ml-2 opacity-60">· mock AI mode</span>
              )}
            </p>
            <h1 className="text-xl font-bold text-slate-50 mb-1">
              {game.title}
              {opponentLabel}
            </h1>
            <p className="text-sm text-slate-400">
              {game.sport.charAt(0).toUpperCase() + game.sport.slice(1).replace("_", " ")}
              {dateLabel}
              {resultLabel}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <ReportVersionBadge version={report.reportVersion} isCurrent={report.isCurrent} />
            <ConfidenceBadge level={report.overallConfidence} />
          </div>
        </div>

        {/* Report meta */}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500 border-t border-slate-800 pt-3">
          <span>Generated {new Date(report.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
          <span>Provider: {providerLabel ?? (report.aiGenerated ? "Mock AI (development)" : "AI-generated")}</span>
          {canRegenerate && (
            <span className="ml-auto">
              <GenerateReportButton
                teamId={teamId}
                gameId={gameId}
                canGenerate={canGenerate}
                disabledReason={!canGenerate ? "Insufficient data to regenerate" : undefined}
              />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
