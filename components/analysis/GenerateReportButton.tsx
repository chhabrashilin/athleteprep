"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { generateReportAction } from "@/app/teams/[teamId]/games/[gameId]/report/actions";

interface GenerateReportButtonProps {
  teamId: string;
  gameId: string;
  canGenerate: boolean;
  disabledReason?: string;
  /** Provider label to display (e.g. "Mock AI", "OpenAI gpt-4o-mini"). Passed from server. */
  providerLabel?: string;
}

export function GenerateReportButton({
  teamId,
  gameId,
  canGenerate,
  disabledReason,
  providerLabel,
}: GenerateReportButtonProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!canGenerate || isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateReportAction(teamId, gameId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        size="md"
        onClick={handleGenerate}
        disabled={!canGenerate || isGenerating}
        loading={isGenerating}
        title={!canGenerate ? (disabledReason ?? "Cannot generate report") : undefined}
      >
        <Zap className="h-4 w-4" />
        {isGenerating ? "Generating report…" : "Generate AI Report"}
      </Button>

      {isGenerating && (
        <p className="text-xs text-slate-500 text-center">
          Analyzing your game data — this takes a few seconds.
        </p>
      )}

      {providerLabel && !isGenerating && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Info className="h-3 w-3 shrink-0" />
          <span>
            Reports are generated from structured game data, notes, and tagged key moments · {providerLabel}
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
