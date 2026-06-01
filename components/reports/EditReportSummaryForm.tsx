"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { updateGameReportSummaryAction } from "@/app/teams/[teamId]/games/[gameId]/report/actions";
import type { GameReport } from "@/types/database";

interface EditReportSummaryFormProps {
  report: GameReport;
  gameId: string;
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

export function EditReportSummaryForm({ report, gameId, open, onClose }: EditReportSummaryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(report.title);
  const [executiveSummary, setExecutiveSummary] = useState(report.executiveSummary ?? "");
  const [assumptions, setAssumptions] = useState(report.assumptions.join("\n"));
  const [limitations, setLimitations] = useState(report.limitations.join("\n"));
  const [correctionText, setCorrectionText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 2) e.title = "Title must be at least 2 characters.";
    if (title.trim().length > 200) e.title = "Title must be 200 characters or fewer.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setServerError(null);

    const assumptionList = assumptions.split("\n").map((s) => s.trim()).filter(Boolean);
    const limitationList = limitations.split("\n").map((s) => s.trim()).filter(Boolean);

    startTransition(async () => {
      const result = await updateGameReportSummaryAction({
        teamId: report.teamId,
        gameId,
        reportId: report.id,
        title: title.trim(),
        executiveSummary: executiveSummary.trim(),
        assumptions: assumptionList,
        limitations: limitationList,
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
    <Dialog open={open} onClose={onClose} title="Edit report summary" className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <FieldLabel htmlFor="rs-title">Report title *</FieldLabel>
          <input
            id="rs-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500/60 focus:outline-none"
          />
          <FieldError message={errors.title} />
        </div>

        <div>
          <FieldLabel htmlFor="rs-summary">Executive summary</FieldLabel>
          <textarea
            id="rs-summary"
            value={executiveSummary}
            onChange={(e) => setExecutiveSummary(e.target.value)}
            rows={5}
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
        </div>

        <div>
          <FieldLabel htmlFor="rs-assumptions">Assumptions (one per line)</FieldLabel>
          <textarea
            id="rs-assumptions"
            value={assumptions}
            onChange={(e) => setAssumptions(e.target.value)}
            rows={4}
            placeholder="One assumption per line…"
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
        </div>

        <div>
          <FieldLabel htmlFor="rs-limitations">Limitations (one per line)</FieldLabel>
          <textarea
            id="rs-limitations"
            value={limitations}
            onChange={(e) => setLimitations(e.target.value)}
            rows={4}
            placeholder="One limitation per line…"
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
        </div>

        <div className="border-t border-slate-800 pt-4">
          <FieldLabel htmlFor="rs-correction">Coach note (optional)</FieldLabel>
          <textarea
            id="rs-correction"
            value={correctionText}
            onChange={(e) => setCorrectionText(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Add a note so your staff knows what changed…"
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-600">
            Original AI output is preserved in raw_ai_output. This does not overwrite it.
          </p>
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
