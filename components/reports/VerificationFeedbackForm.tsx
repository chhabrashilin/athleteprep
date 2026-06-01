"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { verifyReportItemAction } from "@/app/teams/[teamId]/games/[gameId]/report/actions";
import type { VerificationStatus } from "@/types/core";
import type { VerificationTargetType } from "@/types/database";

interface VerificationFeedbackFormProps {
  teamId: string;
  gameId: string;
  gameReportId: string;
  targetType: VerificationTargetType;
  targetId: string;
  verificationStatus: VerificationStatus;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VerificationFeedbackForm({
  teamId,
  gameId,
  gameReportId,
  targetType,
  targetId,
  verificationStatus,
  onSuccess,
  onCancel,
}: VerificationFeedbackFormProps) {
  const [isPending, startTransition] = useTransition();
  const [feedbackText, setFeedbackText] = useState("");
  const [correctionText, setCorrectionText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await verifyReportItemAction({
        teamId,
        gameId,
        gameReportId,
        targetType,
        targetId,
        verificationStatus,
        feedbackText: feedbackText.trim() || undefined,
        correctionText: correctionText.trim() || undefined,
      });

      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400" htmlFor="vf-feedback">
          Coach note (optional)
        </label>
        <textarea
          id="vf-feedback"
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Describe what looks right or wrong…"
          rows={3}
          maxLength={1000}
          className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
        />
      </div>

      {(verificationStatus === "partially_accurate" || verificationStatus === "inaccurate") && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400" htmlFor="vf-correction">
            What should be corrected? (optional)
          </label>
          <textarea
            id="vf-correction"
            value={correctionText}
            onChange={(e) => setCorrectionText(e.target.value)}
            placeholder="Describe the correction…"
            rows={3}
            maxLength={1000}
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
          />
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" loading={isPending} disabled={isPending}>
          Save feedback
        </Button>
      </div>
    </form>
  );
}
