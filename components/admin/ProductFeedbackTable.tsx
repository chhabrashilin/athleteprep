import type { ProductFeedbackRow } from "@/lib/db/feedback";
import { cn } from "@/lib/utils/cn";

interface ProductFeedbackTableProps {
  feedback: ProductFeedbackRow[];
}

const ratingColor = (n: number | null) => {
  if (!n) return "text-slate-500";
  if (n >= 4) return "text-emerald-400";
  if (n === 3) return "text-amber-400";
  return "text-red-400";
};

export function ProductFeedbackTable({ feedback }: ProductFeedbackTableProps) {
  if (feedback.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4">No product feedback yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
            <th className="pb-3 pr-4">Name</th>
            <th className="pb-3 pr-4">Role</th>
            <th className="pb-3 pr-4">Rating</th>
            <th className="pb-3 pr-4">Most valuable</th>
            <th className="pb-3 pr-4">Must-have feature</th>
            <th className="pb-3 pr-4">WTP</th>
            <th className="pb-3">Submitted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {feedback.map((f) => (
            <tr key={f.id} className="text-slate-300">
              <td className="py-3 pr-4 whitespace-nowrap">
                {f.name ?? <span className="text-slate-600 italic">Anonymous</span>}
              </td>
              <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">{f.role ?? "—"}</td>
              <td className={cn("py-3 pr-4 font-bold whitespace-nowrap", ratingColor(f.usefulness_rating))}>
                {f.usefulness_rating ? `${f.usefulness_rating}/5` : "—"}
              </td>
              <td className="py-3 pr-4 text-slate-400 max-w-[200px] truncate" title={f.most_valuable ?? undefined}>
                {f.most_valuable ?? "—"}
              </td>
              <td className="py-3 pr-4 text-slate-400 max-w-[200px] truncate" title={f.must_have_feature ?? undefined}>
                {f.must_have_feature ?? "—"}
              </td>
              <td className="py-3 pr-4 text-slate-400 whitespace-nowrap text-xs">
                {f.willingness_to_pay ?? "—"}
              </td>
              <td className="py-3 text-slate-500 whitespace-nowrap text-xs">
                {new Date(f.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
