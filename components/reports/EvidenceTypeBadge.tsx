import { cn } from "@/lib/utils/cn";
import { Clock, FileText, Swords, Info, Users, Film, Database } from "lucide-react";
import { getEvidenceTypeLabel } from "@/lib/analysis/evidence";
import type { EvidenceType } from "@/lib/analysis/evidence";

const TYPE_CONFIG: Record<
  EvidenceType,
  { icon: React.ElementType; className: string }
> = {
  timestamp: { icon: Clock, className: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  coach_note: { icon: FileText, className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  opponent_note: { icon: Swords, className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  game_metadata: { icon: Info, className: "bg-slate-700/60 text-slate-400 border-slate-600" },
  roster: { icon: Users, className: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
  video_status: { icon: Film, className: "bg-slate-700/60 text-slate-400 border-slate-600" },
  video: { icon: Film, className: "bg-slate-700/60 text-slate-400 border-slate-600" },
  manual_input: { icon: Database, className: "bg-slate-700/60 text-slate-400 border-slate-600" },
  stat: { icon: Database, className: "bg-slate-700/60 text-slate-400 border-slate-600" },
};

interface EvidenceTypeBadgeProps {
  type: EvidenceType;
  className?: string;
}

export function EvidenceTypeBadge({ type, className }: EvidenceTypeBadgeProps) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.manual_input;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {getEvidenceTypeLabel(type)}
    </span>
  );
}
