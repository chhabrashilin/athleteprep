import { Globe, Users, Lock, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ShareVisibility } from "@/types/core";

interface ShareVisibilityBadgeProps {
  visibility: ShareVisibility;
  className?: string;
}

const CONFIG: Record<
  ShareVisibility,
  { label: string; icon: typeof Globe; classes: string }
> = {
  private_link: {
    label: "Private link",
    icon: Lock,
    classes: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  },
  staff_only: {
    label: "Staff only",
    icon: Users,
    classes: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  },
  player_specific: {
    label: "Player specific",
    icon: User,
    classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  public_summary: {
    label: "Public summary",
    icon: Globe,
    classes: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
};

export function ShareVisibilityBadge({ visibility, className }: ShareVisibilityBadgeProps) {
  const { label, icon: Icon, classes } = CONFIG[visibility];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        classes,
        className
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}
