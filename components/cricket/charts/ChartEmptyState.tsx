import { BarChart2 } from "lucide-react";

interface Props {
  title?: string;
  message: string;
  hint?: string;
}

export function ChartEmptyState({ title = "No data", message, hint }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 px-6 py-10 text-center"
      role="status"
      aria-label={`${title}: ${message}`}
    >
      <BarChart2 className="h-8 w-8 text-slate-600 mb-3" aria-hidden="true" />
      <p className="text-sm font-semibold text-slate-300 mb-1">{title}</p>
      <p className="text-xs text-slate-500 max-w-xs">{message}</p>
      {hint && <p className="text-xs text-slate-600 mt-2 max-w-xs">{hint}</p>}
    </div>
  );
}
