"use client";

import { useState } from "react";
import { reactToCricketTarget, removeCricketReaction } from "@/lib/cricket/community/actions";

const REACTIONS = [
  { type: "like", emoji: "👍", label: "Like" },
  { type: "love", emoji: "❤️", label: "Love" },
  { type: "clap", emoji: "👏", label: "Clap" },
  { type: "fire", emoji: "🔥", label: "Fire" },
  { type: "wow", emoji: "😮", label: "Wow" },
  { type: "support", emoji: "🙌", label: "Support" },
] as const;

interface ReactionCount {
  type: string;
  count: number;
  reacted: boolean;
}

interface Props {
  targetType: "post" | "comment" | "match" | "player" | "team";
  targetId: string;
  reactions: ReactionCount[];
  disabled?: boolean;
}

export function CricketReactionBar({ targetType, targetId, reactions, disabled = false }: Props) {
  const [localReactions, setLocalReactions] = useState<ReactionCount[]>(reactions);
  const [pending, setPending] = useState(false);

  async function handleReaction(reactionType: string) {
    if (disabled || pending) return;
    setPending(true);

    const existing = localReactions.find((r) => r.type === reactionType);

    // Optimistic update.
    setLocalReactions((prev) =>
      prev.map((r) =>
        r.type === reactionType
          ? { ...r, count: r.reacted ? r.count - 1 : r.count + 1, reacted: !r.reacted }
          : r
      )
    );

    if (existing?.reacted) {
      await removeCricketReaction({ target_type: targetType, target_id: targetId, reaction_type: reactionType });
    } else {
      await reactToCricketTarget({ target_type: targetType, target_id: targetId, reaction_type: reactionType });
    }

    setPending(false);
  }

  const visible = localReactions.filter((r) => r.count > 0 || r.reacted);

  if (visible.length === 0 && disabled) return null;

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Reactions">
      {REACTIONS.map((r) => {
        const data = localReactions.find((lr) => lr.type === r.type);
        const count = data?.count ?? 0;
        const reacted = data?.reacted ?? false;

        if (count === 0 && !reacted && disabled) return null;

        return (
          <button
            key={r.type}
            onClick={() => handleReaction(r.type)}
            disabled={disabled || pending}
            aria-pressed={reacted}
            aria-label={`${r.label}${count > 0 ? ` (${count})` : ""}`}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
              reacted
                ? "border-sky-500/50 bg-sky-500/20 text-sky-300"
                : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-200"
            } disabled:opacity-50`}
          >
            <span aria-hidden="true">{r.emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
