"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { updatePlayerReportAction } from "@/app/teams/[teamId]/games/[gameId]/report/actions";
import type { PlayerReport } from "@/types/database";

interface EditPlayerReportFormProps {
  report: PlayerReport;
  open: boolean;
  onClose: () => void;
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-slate-400 mb-1.5">
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-400 mt-1">{message}</p>;
}

export function EditPlayerReportForm({ report, open, onClose }: EditPlayerReportFormProps) {
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState(report.summary ?? "");
  const [strengths, setStrengths] = useState(report.strengths.join("\n"));
  const [improvementAreas, setImprovementAreas] = useState(report.improvementAreas.join("\n"));
  const [recommendedFocus, setRecommendedFocus] = useState(report.recommendedFocus ?? "");
  const [playerFacingSummary, setPlayerFacingSummary] = useState(report.playerFacingSummary ?? "");
  const [correctionText, setCorrectionText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (summary.trim().length > 2000) e.summary = "Must be 2000 characters or fewer.";
    const sList = strengths.split("\n").map((s) => s.trim()).filter(Boolean);
    if (sList.length > 10) e.strengths = "Maximum 10 strengths.";
    const iList = improvementAreas.split("\n").map((s) => s.trim()).filter(Boolean);
    if (iList.length > 10) e.improvementAreas = "Maximum 10 improvement areas.";
    if (recommendedFocus.trim().length > 1000) e.recommendedFocus = "Must be 1000 characters or fewer.";
    if (playerFacingSummary.trim().length > 1500) e.playerFacingSummary = "Must be 1500 characters or fewer.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setServerError(null);

    const strengthsList = strengths.split("\n").map((s) => s.trim()).filter(Boolean);
    const improvementsList = improvementAreas.split("\n").map((s) => s.trim()).filter(Boolean);

    startTransition(async () => {
      const result = await updatePlayerReportAction({
        teamId: report.teamId,
        gameId: report.gameId,
        gameReportId: report.gameReportId,
        reportId: report.id,
        summary: summary.trim(),
        strengths: strengthsList,
        improvementAreas: improvementsList,
        recommendedFocus: recommendedFocus.trim(),
        playerFacingSummary: playerFacingSummary.trim(),
        correctionText: correctionText.trim() || undefined,
      });

      if (result.success) {
        onClose();
      } else {
        setServerError(result.error ?? "Failed to save. Please try again.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Edit player report — ${report.playerDisplayName ?? "Unknown"}`}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <FieldLabel htmlFor="pr-summary">Summary</FieldLabel>
          <textarea
            id="pr-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            maxLength={2000}
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
          <FieldError message={errors.summary} />
        </div>

        <div>
          <FieldLabel htmlFor="pr-strengths">Strengths (one per line, max 10)</FieldLabel>
          <textarea
            id="pr-strengths"
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            rows={4}
            placeholder="One strength per line…"
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
          <FieldError message={errors.strengths} />
        </div>

        <div>
          <FieldLabel htmlFor="pr-improvements">Improvement areas (one per line, max 10)</FieldLabel>
          <textarea
            id="pr-improvements"
            value={improvementAreas}
            onChange={(e) => setImprovementAreas(e.target.value)}
            rows={4}
            placeholder="One area per line…"
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
          <FieldError message={errors.improvementAreas} />
        </div>

        <div>
          <FieldLabel htmlFor="pr-focus">Recommended focus</FieldLabel>
          <textarea
            id="pr-focus"
            value={recommendedFocus}
            onChange={(e) => setRecommendedFocus(e.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
          <FieldError message={errors.recommendedFocus} />
        </div>

        <div>
          <FieldLabel htmlFor="pr-player-summary">Player-facing summary</FieldLabel>
          <textarea
            id="pr-player-summary"
            value={playerFacingSummary}
            onChange={(e) => setPlayerFacingSummary(e.target.value)}
            rows={3}
            maxLength={1500}
            placeholder="Summary to share directly with the player…"
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
          <FieldError message={errors.playerFacingSummary} />
        </div>

        <div className="border-t border-slate-800 pt-4">
          <FieldLabel htmlFor="pr-correction">Coach note (optional)</FieldLabel>
          <textarea
            id="pr-correction"
            value={correctionText}
            onChange={(e) => setCorrectionText(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Add a note so your staff knows what changed…"
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-600">Original AI output is preserved automatically.</p>
        </div>

        {serverError && <p className="text-xs text-red-400">{serverError}</p>}

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={isPending} disabled={isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
