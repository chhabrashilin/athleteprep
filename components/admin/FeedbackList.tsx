import type { ProductFeedbackRow } from "@/lib/db/feedback";

interface FeedbackListProps {
  feedback: ProductFeedbackRow[];
}

export function FeedbackList({ feedback }: FeedbackListProps) {
  if (feedback.length === 0) {
    return <p className="text-sm text-slate-500 py-4">No feedback yet.</p>;
  }

  return (
    <div className="space-y-4">
      {feedback.map((f) => (
        <div
          key={f.id}
          className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="font-medium text-slate-100">
                {f.name ?? <span className="italic text-slate-500">Anonymous</span>}
              </span>
              {f.role && (
                <span className="text-xs rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-slate-400">
                  {f.role}
                </span>
              )}
              {f.sport && (
                <span className="text-xs rounded-full border border-sky-800/50 bg-sky-900/20 px-2 py-0.5 text-sky-400">
                  {f.sport}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {f.usefulness_rating && (
                <span className="font-bold text-base text-amber-400">
                  {f.usefulness_rating}/5
                </span>
              )}
              <span>{new Date(f.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {f.most_valuable && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Most valuable</p>
              <p className="text-sm text-slate-300">{f.most_valuable}</p>
            </div>
          )}
          {f.most_confusing && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Most confusing</p>
              <p className="text-sm text-slate-300">{f.most_confusing}</p>
            </div>
          )}
          {f.must_have_feature && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Must-have feature</p>
              <p className="text-sm text-emerald-300">{f.must_have_feature}</p>
            </div>
          )}
          {f.willingness_to_pay && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Willingness to pay</p>
              <p className="text-sm text-slate-300">{f.willingness_to_pay}</p>
            </div>
          )}
          {f.additional_notes && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Additional notes</p>
              <p className="text-sm text-slate-400 italic">{f.additional_notes}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
