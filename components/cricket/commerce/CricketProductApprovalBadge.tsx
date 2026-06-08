const CONFIG: Record<string, { label: string; color: string }> = {
  pending:       { label: "Pending Approval", color: "text-amber-400  bg-amber-400/10 border-amber-500/30"  },
  approved:      { label: "Approved",         color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/30"},
  rejected:      { label: "Rejected",         color: "text-rose-400   bg-rose-400/10  border-rose-500/30"   },
  needs_changes: { label: "Needs Changes",    color: "text-orange-400 bg-orange-400/10 border-orange-500/30"},
};

interface Props { status: string; className?: string }

export function CricketProductApprovalBadge({ status, className = "" }: Props) {
  const cfg = CONFIG[status] ?? { label: status, color: "text-slate-400 bg-slate-800 border-slate-700" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.color} ${className}`}>
      {cfg.label}
    </span>
  );
}
