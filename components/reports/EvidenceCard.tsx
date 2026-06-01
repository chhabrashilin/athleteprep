"use client";

import { Play, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { EvidenceTypeBadge } from "@/components/reports/EvidenceTypeBadge";
import type { ResolvedEvidenceItem } from "@/lib/analysis/evidence";

interface EvidenceCardProps {
  item: ResolvedEvidenceItem;
  isSelected?: boolean;
  onSeek?: (seconds: number) => void;
  compact?: boolean;
}

export function EvidenceCard({
  item,
  isSelected = false,
  onSeek,
  compact = false,
}: EvidenceCardProps) {
  const canSeek = item.timestampSeconds != null && !!onSeek;

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 transition-all",
        isSelected
          ? "border-sky-500/50 bg-sky-500/10"
          : "border-slate-800 bg-slate-900/60",
        canSeek && "cursor-pointer hover:border-slate-700"
      )}
      onClick={canSeek ? () => onSeek!(item.timestampSeconds!) : undefined}
      role={canSeek ? "button" : undefined}
      tabIndex={canSeek ? 0 : undefined}
      onKeyDown={
        canSeek
          ? (e) => {
              if (e.key === "Enter" || e.key === " ")
                onSeek!(item.timestampSeconds!);
            }
          : undefined
      }
      aria-label={canSeek ? `Jump to ${item.formattedTimestamp}` : undefined}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {/* Type badge + timestamp */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <EvidenceTypeBadge type={item.type} />
            {item.formattedTimestamp && (
              <span className="font-mono text-xs text-sky-400 font-semibold">
                {item.formattedTimestamp}
              </span>
            )}
          </div>

          {/* Label */}
          <p className="text-sm font-medium text-slate-200 truncate">{item.label}</p>

          {/* Description */}
          {!compact && item.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
          )}

          {/* Players */}
          {item.playerNames.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Users className="h-3 w-3 text-slate-600 shrink-0" />
              <span className="text-xs text-slate-500 truncate">
                {item.playerNames.join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Seek affordance */}
        {canSeek && (
          <div className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-sky-500/15 mt-0.5">
            <Play className="h-3.5 w-3.5 text-sky-400" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}
