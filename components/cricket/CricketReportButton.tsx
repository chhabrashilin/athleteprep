"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { reportCricketContent } from "@/lib/cricket/moderation/actions";

const REPORT_TARGET_TYPES = [
  "post",
  "comment",
  "thread_message",
  "poll",
  "player_profile",
  "team_profile",
] as const;

type ReportTargetType = typeof REPORT_TARGET_TYPES[number];

interface Props {
  targetType: ReportTargetType;
  targetId: string;
  leagueId?: string;
}

export function CricketReportButton({ targetType, targetId, leagueId }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    const result = await reportCricketContent({
      target_type: targetType,
      target_id: targetId,
      league_id: leagueId,
      reason: reason.trim(),
      details: details.trim() || null,
    });

    setSubmitting(false);
    if (result.success) {
      setDone(true);
      setTimeout(() => { setOpen(false); setDone(false); }, 1500);
    } else {
      setError(result.error ?? "Failed to submit report");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-400 transition-colors"
        aria-label="Report this content"
      >
        <Flag className="h-3 w-3" aria-hidden="true" />
        Report
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h2 id="report-dialog-title" className="text-sm font-semibold text-slate-200 mb-3">
              Report content
            </h2>

            {done ? (
              <p className="text-sm text-emerald-400">Thank you — your report has been submitted.</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label htmlFor="report-reason" className="block text-xs text-slate-400 mb-1">
                    Reason <span aria-hidden="true">*</span>
                  </label>
                  <select
                    id="report-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="">Select a reason</option>
                    <option value="spam">Spam</option>
                    <option value="harassment">Harassment</option>
                    <option value="hate_speech">Hate speech</option>
                    <option value="misinformation">Misinformation</option>
                    <option value="inappropriate_content">Inappropriate content</option>
                    <option value="off_topic">Off topic</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="report-details" className="block text-xs text-slate-400 mb-1">
                    Additional details (optional)
                  </label>
                  <textarea
                    id="report-details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none resize-none"
                  />
                </div>

                {error && <p className="text-xs text-rose-400">{error}</p>}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setOpen(false); setReason(""); setDetails(""); setError(null); }}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!reason || submitting}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                  >
                    {submitting ? "Submitting…" : "Submit report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
