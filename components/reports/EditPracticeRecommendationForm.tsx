"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { updatePracticeRecommendationAction } from "@/app/teams/[teamId]/games/[gameId]/report/actions";
import type { PracticeRecommendation } from "@/types/database";

interface EditPracticeRecommendationFormProps {
  recommendation: PracticeRecommendation;
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

export function EditPracticeRecommendationForm({
  recommendation: rec,
  open,
  onClose,
}: EditPracticeRecommendationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(rec.title);
  const [description, setDescription] = useState(rec.description ?? "");
  const [drillName, setDrillName] = useState(rec.drillName ?? "");
  const [durationMinutes, setDurationMinutes] = useState(
    rec.durationMinutes != null ? String(rec.durationMinutes) : ""
  );
  const [coachingPoints, setCoachingPoints] = useState(rec.coachingPoints.join("\n"));
  const [correctionText, setCorrectionText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 2) e.title = "Title must be at least 2 characters.";
    if (title.trim().length > 160) e.title = "Title must be 160 characters or fewer.";
    if (description.trim().length > 2000) e.description = "Must be 2000 characters or fewer.";
    if (drillName.trim().length > 160) e.drillName = "Drill name must be 160 characters or fewer.";
    const dur = durationMinutes.trim();
    if (dur) {
      const n = parseInt(dur, 10);
      if (isNaN(n) || n <= 0) e.durationMinutes = "Must be a positive number.";
      if (n > 240) e.durationMinutes = "Duration cannot exceed 240 minutes.";
    }
    const pointsList = coachingPoints.split("\n").map((s) => s.trim()).filter(Boolean);
    if (pointsList.length > 12) e.coachingPoints = "Maximum 12 coaching points.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setServerError(null);

    const pointsList = coachingPoints.split("\n").map((s) => s.trim()).filter(Boolean);
    const dur = durationMinutes.trim();
    const durationVal = dur ? parseInt(dur, 10) : null;

    startTransition(async () => {
      const result = await updatePracticeRecommendationAction({
        teamId: rec.teamId,
        gameId: rec.gameId,
        gameReportId: rec.gameReportId,
        recommendationId: rec.id,
        title: title.trim(),
        description: description.trim(),
        drillName: drillName.trim(),
        durationMinutes: durationVal,
        coachingPoints: pointsList,
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
    <Dialog open={open} onClose={onClose} title="Edit practice recommendation">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <FieldLabel htmlFor="pr-title">Title *</FieldLabel>
          <input
            id="pr-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={160}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500/60 focus:outline-none"
          />
          <FieldError message={errors.title} />
        </div>

        <div>
          <FieldLabel htmlFor="pr-desc">Description</FieldLabel>
          <textarea
            id="pr-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
          <FieldError message={errors.description} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="pr-drill">Drill name</FieldLabel>
            <input
              id="pr-drill"
              type="text"
              value={drillName}
              onChange={(e) => setDrillName(e.target.value)}
              maxLength={160}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500/60 focus:outline-none"
            />
            <FieldError message={errors.drillName} />
          </div>

          <div>
            <FieldLabel htmlFor="pr-duration">Duration (minutes)</FieldLabel>
            <input
              id="pr-duration"
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              min={1}
              max={240}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500/60 focus:outline-none"
            />
            <FieldError message={errors.durationMinutes} />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="pr-points">Coaching points (one per line, max 12)</FieldLabel>
          <textarea
            id="pr-points"
            value={coachingPoints}
            onChange={(e) => setCoachingPoints(e.target.value)}
            rows={4}
            placeholder="One coaching point per line…"
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
          <FieldError message={errors.coachingPoints} />
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
