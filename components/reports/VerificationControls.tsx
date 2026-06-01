"use client";

import { useState, useTransition } from "react";
import { Check, Minus, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { VerificationBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { verifyReportItemAction } from "@/app/teams/[teamId]/games/[gameId]/report/actions";
import type { VerificationStatus } from "@/types/core";
import type { VerificationTargetType } from "@/types/database";

interface VerificationControlsProps {
  teamId: string;
  gameId: string;
  gameReportId: string;
  targetType: VerificationTargetType;
  targetId: string;
  currentStatus: VerificationStatus;
  canEdit: boolean;
}

type PendingStatus = Exclude<VerificationStatus, "edited" | "unreviewed">;

const STATUS_CONFIG: Record<
  PendingStatus,
  { label: string; icon: typeof Check; classes: string; activeClasses: string }
> = {
  accurate: {
    label: "Accurate",
    icon: Check,
    classes:
      "border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/10",
    activeClasses: "border-emerald-500/50 text-emerald-400 bg-emerald-500/10",
  },
  partially_accurate: {
    label: "Partially Accurate",
    icon: Minus,
    classes:
      "border-slate-700 text-slate-400 hover:border-amber-500/50 hover:text-amber-400 hover:bg-amber-500/10",
    activeClasses: "border-amber-500/50 text-amber-400 bg-amber-500/10",
  },
  inaccurate: {
    label: "Inaccurate",
    icon: X,
    classes:
      "border-slate-700 text-slate-400 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10",
    activeClasses: "border-red-500/50 text-red-400 bg-red-500/10",
  },
};

export function VerificationControls({
  teamId,
  gameId,
  gameReportId,
  targetType,
  targetId,
  currentStatus,
  canEdit,
}: VerificationControlsProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<PendingStatus | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<VerificationStatus>(currentStatus);

  function handleStatusClick(status: PendingStatus) {
    if (isPending) return;
    if (pendingStatus === status) {
      setPendingStatus(null);
    } else {
      setPendingStatus(status);
      setFeedbackText("");
      setError(null);
      setSuccess(false);
    }
  }

  function handleConfirm() {
    if (!pendingStatus) return;
    setError(null);

    startTransition(async () => {
      const result = await verifyReportItemAction({
        teamId,
        gameId,
        gameReportId,
        targetType,
        targetId,
        verificationStatus: pendingStatus,
        feedbackText: feedbackText.trim() || undefined,
      });

      if (result.success) {
        setOptimisticStatus(pendingStatus);
        setPendingStatus(null);
        setFeedbackText("");
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  function handleCancel() {
    setPendingStatus(null);
    setFeedbackText("");
    setError(null);
  }

  const showFeedbackForm =
    pendingStatus === "partially_accurate" || pendingStatus === "inaccurate";

  return (
    <div className="space-y-3">
      {/* Status row */}
      <div className="flex items-center gap-2 flex-wrap">
        <VerificationBadge status={optimisticStatus} />
        {success && (
          <span className="text-xs text-emerald-400">Your correction has been saved.</span>
        )}
      </div>

      {/* Action buttons — staff only */}
      {canEdit && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(STATUS_CONFIG) as [PendingStatus, (typeof STATUS_CONFIG)[PendingStatus]][]).map(
              ([status, config]) => {
                const Icon = config.icon;
                const isActive = pendingStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusClick(status)}
                    disabled={isPending}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                      isActive ? config.activeClasses : config.classes
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}
                    {isActive && <ChevronDown className="h-3 w-3 ml-0.5" />}
                  </button>
                );
              }
            )}
          </div>

          {/* Confirmation panel */}
          {pendingStatus && (
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 space-y-3">
              <p className="text-xs font-medium text-slate-300">
                Mark this as{" "}
                <span className="font-semibold">{STATUS_CONFIG[pendingStatus].label.toLowerCase()}</span>?
              </p>

              {showFeedbackForm && (
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500" htmlFor="verify-feedback">
                    Add a coach note (optional)
                  </label>
                  <textarea
                    id="verify-feedback"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="What should be corrected or noted…"
                    rows={3}
                    maxLength={1000}
                    className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500/60 focus:outline-none"
                  />
                </div>
              )}

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  loading={isPending}
                  disabled={isPending}
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
