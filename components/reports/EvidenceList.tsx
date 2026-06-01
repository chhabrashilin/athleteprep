"use client";

import { EvidenceCard } from "@/components/reports/EvidenceCard";
import type { ResolvedEvidenceItem } from "@/lib/analysis/evidence";

interface EvidenceListProps {
  items: ResolvedEvidenceItem[];
  selectedId?: string | null;
  onSeek?: (seconds: number, itemId: string) => void;
  compact?: boolean;
  emptyMessage?: string;
}

export function EvidenceList({
  items,
  selectedId,
  onSeek,
  compact = false,
  emptyMessage = "No evidence references for this item.",
}: EvidenceListProps) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-slate-500 italic">{emptyMessage}</p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <EvidenceCard
          key={item.id}
          item={item}
          isSelected={selectedId === item.id}
          onSeek={
            onSeek && item.timestampSeconds != null
              ? () => onSeek(item.timestampSeconds!, item.id)
              : undefined
          }
          compact={compact}
        />
      ))}
    </div>
  );
}
