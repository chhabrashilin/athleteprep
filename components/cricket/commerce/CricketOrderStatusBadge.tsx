const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:             { label: "Draft",            color: "text-slate-400  bg-slate-800    border-slate-700"   },
  submitted:         { label: "Submitted",        color: "text-sky-400    bg-sky-400/10   border-sky-500/30"  },
  reviewing:         { label: "Reviewing",        color: "text-amber-400  bg-amber-400/10 border-amber-500/30"},
  quoted:            { label: "Quoted",           color: "text-purple-400 bg-purple-400/10 border-purple-500/30"},
  awaiting_payment:  { label: "Awaiting Payment", color: "text-amber-400  bg-amber-400/10 border-amber-500/30"},
  confirmed:         { label: "Confirmed",        color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/30"},
  in_progress:       { label: "In Progress",      color: "text-blue-400   bg-blue-400/10  border-blue-500/30" },
  completed:         { label: "Completed",        color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/30"},
  cancelled:         { label: "Cancelled",        color: "text-rose-400   bg-rose-400/10  border-rose-500/30" },
  rejected:          { label: "Rejected",         color: "text-rose-400   bg-rose-400/10  border-rose-500/30" },
  archived:          { label: "Archived",         color: "text-slate-500  bg-slate-800    border-slate-700"   },
};

interface Props {
  status: string;
  className?: string;
}

export function CricketOrderStatusBadge({ status, className = "" }: Props) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    color: "text-slate-400 bg-slate-800 border-slate-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color} ${className}`}
    >
      {config.label}
    </span>
  );
}
