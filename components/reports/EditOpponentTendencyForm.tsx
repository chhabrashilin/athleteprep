"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { updateOpponentTendencyAction } from "@/app/teams/[teamId]/games/[gameId]/report/actions";
import type { OpponentTendency } from "@/types/database";

interface EditOpponentTendencyFormProps {
  tendency: OpponentTendency;
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

export function EditOpponentTendencyForm({ tendency, open, onClose }: EditOpponentTendencyFormProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(tendency.title);
  const [description, setDescription] = useState(tendency.description);
  const [recommendedResponse, setRecommendedResponse] = useState(tendency.recommendedResponse ?? "");
  const [tags, setTags] = useState(tendency.tags.join(", "));
  const [correctionText, setCorrectionText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 2) e.title = "Title must be at least 2 characters.";
    if (title.trim().length > 160) e.title = "Title must be 160 characters or fewer.";
    if (!description.trim()) e.description = "Description is required.";
    if (description.trim().length > 2000) e.description = "Must be 2000 characters or fewer.";
    if (recommendedResponse.trim().length > 2000) e.recommendedResponse = "Must be 2000 characters or fewer.";
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (tagList.length > 20) e.tags = "Maximum 20 tags.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setServerError(null);

    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

    startTransition(async () => {
      const result = await updateOpponentTendencyAction({
        teamId: tendency.teamId,
        gameId: tendency.gameId,
        gameReportId: tendency.gameReportId,
        tendencyId: tendency.id,
        title: title.trim(),
        description: description.trim(),
        recommendedResponse: recommendedResponse.trim(),
        tags: tagList,
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
    <Dialog open={open} onClose={onClose} title="Edit opponent tendency">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <FieldLabel htmlFor="ot-title">Title *</FieldLabel>
          <input
            id="ot-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={160}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500/60 focus:outline-none"
          />
          <FieldError message={errors.title} />
        </div>

        <div>
          <FieldLabel htmlFor="ot-desc">Description *</FieldLabel>
          <textarea
            id="ot-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={2000}
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
          <FieldError message={errors.description} />
        </div>

        <div>
          <FieldLabel htmlFor="ot-response">Recommended response</FieldLabel>
          <textarea
            id="ot-response"
            value={recommendedResponse}
            onChange={(e) => setRecommendedResponse(e.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
          <FieldError message={errors.recommendedResponse} />
        </div>

        <div>
          <FieldLabel htmlFor="ot-tags">Tags (comma-separated, max 20)</FieldLabel>
          <input
            id="ot-tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="press, transition, set piece…"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
          <FieldError message={errors.tags} />
        </div>

        <div className="border-t border-slate-800 pt-4">
          <FieldLabel htmlFor="ot-correction">Coach note (optional)</FieldLabel>
          <textarea
            id="ot-correction"
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
