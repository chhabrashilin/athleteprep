"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { updateCoachingInsightAction } from "@/app/teams/[teamId]/games/[gameId]/report/actions";
import type { CoachingInsight } from "@/types/database";

interface EditCoachingInsightFormProps {
  insight: CoachingInsight;
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

export function EditCoachingInsightForm({ insight, open, onClose }: EditCoachingInsightFormProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(insight.title);
  const [summary, setSummary] = useState(insight.summary);
  const [whyItMatters, setWhyItMatters] = useState(insight.whyItMatters ?? "");
  const [recommendedAction, setRecommendedAction] = useState(insight.recommendedAction ?? "");
  const [assumptions, setAssumptions] = useState(insight.assumptions.join("\n"));
  const [correctionText, setCorrectionText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 2) e.title = "Title must be at least 2 characters.";
    if (title.trim().length > 160) e.title = "Title must be 160 characters or fewer.";
    if (!summary.trim()) e.summary = "Summary is required.";
    if (summary.trim().length > 2000) e.summary = "Summary must be 2000 characters or fewer.";
    if (whyItMatters.trim().length > 2000) e.whyItMatters = "Must be 2000 characters or fewer.";
    if (recommendedAction.trim().length > 2000) e.recommendedAction = "Must be 2000 characters or fewer.";
    const assumptionList = assumptions.split("\n").map((s) => s.trim()).filter(Boolean);
    if (assumptionList.length > 10) e.assumptions = "Maximum 10 assumptions.";
    if (assumptionList.some((a) => a.length > 300)) e.assumptions = "Each assumption must be 300 characters or fewer.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setServerError(null);

    const assumptionList = assumptions.split("\n").map((s) => s.trim()).filter(Boolean);

    startTransition(async () => {
      const result = await updateCoachingInsightAction({
        teamId: insight.teamId,
        gameId: insight.gameId,
        gameReportId: insight.gameReportId,
        insightId: insight.id,
        title: title.trim(),
        summary: summary.trim(),
        whyItMatters: whyItMatters.trim(),
        recommendedAction: recommendedAction.trim(),
        assumptions: assumptionList,
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
    <Dialog open={open} onClose={onClose} title="Edit coaching insight" className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <FieldLabel htmlFor="ci-title">Title *</FieldLabel>
          <input
            id="ci-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={160}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
          <FieldError message={errors.title} />
        </div>

        <div>
          <FieldLabel htmlFor="ci-summary">Summary *</FieldLabel>
          <textarea
            id="ci-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            maxLength={2000}
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
          <FieldError message={errors.summary} />
        </div>

        <div>
          <FieldLabel htmlFor="ci-why">Why it matters</FieldLabel>
          <textarea
            id="ci-why"
            value={whyItMatters}
            onChange={(e) => setWhyItMatters(e.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
          <FieldError message={errors.whyItMatters} />
        </div>

        <div>
          <FieldLabel htmlFor="ci-action">Recommended action</FieldLabel>
          <textarea
            id="ci-action"
            value={recommendedAction}
            onChange={(e) => setRecommendedAction(e.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
          <FieldError message={errors.recommendedAction} />
        </div>

        <div>
          <FieldLabel htmlFor="ci-assumptions">Assumptions (one per line, max 10)</FieldLabel>
          <textarea
            id="ci-assumptions"
            value={assumptions}
            onChange={(e) => setAssumptions(e.target.value)}
            rows={3}
            placeholder="One assumption per line…"
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
          <FieldError message={errors.assumptions} />
        </div>

        <div className="border-t border-slate-800 pt-4">
          <FieldLabel htmlFor="ci-correction">Coach note / correction (optional)</FieldLabel>
          <textarea
            id="ci-correction"
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
