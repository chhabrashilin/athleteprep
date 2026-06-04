"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Globe, EyeOff, XCircle, Edit } from "lucide-react";
import { publishCricketMatch, unpublishCricketMatch, cancelCricketMatch } from "@/app/actions/cricket-matches";

interface MatchActionsPanelProps {
  matchId: string;
  matchSlug: string | null;
  leagueId: string;
  leagueSlug: string;
  scheduleStatus: string;
  publishStatus: string;
}

export function MatchActionsPanel({
  matchId,
  matchSlug,
  leagueSlug,
  scheduleStatus,
  publishStatus,
}: MatchActionsPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const editHref = `/cricket/matches/${matchSlug ?? matchId}/edit`;

  async function handlePublish() {
    setLoading(true);
    setError(null);
    const result = publishStatus === "published"
      ? await unpublishCricketMatch(matchId)
      : await publishCricketMatch(matchId);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) {
      setError("Please provide a cancellation reason.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await cancelCricketMatch(matchId, cancelReason);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    } else {
      setShowCancelConfirm(false);
      router.refresh();
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</p>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <Link
        href={editHref}
        className="flex w-full items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
      >
        <Edit className="h-4 w-4" />
        Edit Match
      </Link>

      <button
        onClick={handlePublish}
        disabled={loading || scheduleStatus === "cancelled"}
        className="flex w-full items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50 transition-colors"
      >
        {publishStatus === "published" ? (
          <><EyeOff className="h-4 w-4 text-slate-400" />Unpublish</>
        ) : (
          <><Globe className="h-4 w-4 text-emerald-400" />Publish</>
        )}
      </button>

      {scheduleStatus !== "cancelled" && (
        <>
          {!showCancelConfirm ? (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="flex w-full items-center gap-2 rounded-lg border border-red-500/20 bg-transparent px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Cancel Match
            </button>
          ) : (
            <div className="space-y-2">
              <input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation…"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-red-500/50 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowCancelConfirm(false); setCancelReason(""); }}
                  className="flex-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                >
                  {loading ? "…" : "Confirm"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {leagueSlug && (
        <Link
          href={`/cricket/leagues/${leagueSlug}/schedule`}
          className="block text-center text-xs text-slate-500 hover:text-slate-400 transition-colors pt-1"
        >
          Back to schedule
        </Link>
      )}
    </div>
  );
}
