import type { ReactNode } from "react";
import { Globe, Lock, Users, Eye } from "lucide-react";

interface Props {
  visibility: string;
  className?: string;
}

const CONFIG: Record<string, { label: string; color: string; icon: ReactNode }> = {
  public: {
    label: "Public",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/30",
    icon: <Globe className="h-3 w-3" aria-hidden="true" />,
  },
  unlisted: {
    label: "Unlisted",
    color: "text-amber-400 bg-amber-400/10 border-amber-500/30",
    icon: <Eye className="h-3 w-3" aria-hidden="true" />,
  },
  league: {
    label: "League",
    color: "text-sky-400 bg-sky-400/10 border-sky-500/30",
    icon: <Users className="h-3 w-3" aria-hidden="true" />,
  },
  team: {
    label: "Team",
    color: "text-violet-400 bg-violet-400/10 border-violet-500/30",
    icon: <Users className="h-3 w-3" aria-hidden="true" />,
  },
  private: {
    label: "Private",
    color: "text-slate-400 bg-slate-800 border-slate-700",
    icon: <Lock className="h-3 w-3" aria-hidden="true" />,
  },
};

export function CricketVisibilityBadge({ visibility, className = "" }: Props) {
  const cfg = CONFIG[visibility] ?? CONFIG.private;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium ${cfg.color} ${className}`}
      aria-label={`Visibility: ${cfg.label}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}
