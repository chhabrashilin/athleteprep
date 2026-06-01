import { PenLine } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface EditedBadgeProps {
  className?: string;
}

export function EditedBadge({ className }: EditedBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-400",
        className
      )}
      title="Content was edited by a coach. Original AI output preserved."
    >
      <PenLine className="h-3 w-3" aria-hidden="true" />
      Coach-edited
    </span>
  );
}
