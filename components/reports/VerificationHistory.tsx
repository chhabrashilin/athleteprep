import { Clock, MessageSquare } from "lucide-react";
import { VerificationBadge } from "@/components/ui/Badge";
import type { VerificationFeedback } from "@/types/database";

interface VerificationHistoryProps {
  feedback: VerificationFeedback[];
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function VerificationHistory({ feedback }: VerificationHistoryProps) {
  if (feedback.length === 0) {
    return (
      <p className="text-xs text-slate-600">No verification activity yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      {feedback.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-slate-800 bg-slate-800/40 px-3 py-2.5 space-y-1.5"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <VerificationBadge status={item.verificationStatus} />
            <span className="flex items-center gap-1 text-xs text-slate-600">
              <Clock className="h-3 w-3" />
              {formatDate(item.createdAt)}
            </span>
          </div>

          {(item.feedbackText || item.correctionText) && (
            <div className="space-y-1">
              {item.feedbackText && (
                <div className="flex items-start gap-1.5">
                  <MessageSquare className="h-3 w-3 text-slate-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400">{item.feedbackText}</p>
                </div>
              )}
              {item.correctionText && (
                <div className="flex items-start gap-1.5">
                  <span className="text-xs text-amber-500 shrink-0 mt-0.5">→</span>
                  <p className="text-xs text-slate-400 italic">{item.correctionText}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
