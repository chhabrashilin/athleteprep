import { MessageSquare } from "lucide-react";

interface Props {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function CricketCommunityEmptyState({
  title = "No community posts yet.",
  description = "Be the first to post in this community.",
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-12 text-center">
      <MessageSquare className="h-10 w-10 text-slate-600 mb-3" aria-hidden="true" />
      <p className="text-sm font-semibold text-slate-300 mb-1">{title}</p>
      <p className="text-sm text-slate-500 max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
