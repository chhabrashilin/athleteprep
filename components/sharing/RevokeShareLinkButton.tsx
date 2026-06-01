"use client";

import { useState, useTransition } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { revokeShareLinkAction } from "@/app/teams/[teamId]/games/[gameId]/report/actions";

interface RevokeShareLinkButtonProps {
  teamId: string;
  gameId: string;
  shareLinkId: string;
  onRevoked?: () => void;
}

export function RevokeShareLinkButton({
  teamId,
  gameId,
  shareLinkId,
  onRevoked,
}: RevokeShareLinkButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleRevoke() {
    setError(null);
    startTransition(async () => {
      const result = await revokeShareLinkAction(teamId, gameId, shareLinkId);
      if (result.success) {
        setConfirming(false);
        onRevoked?.();
      } else {
        setError(result.error ?? "Failed to revoke link.");
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          Revoke this link?
        </div>
        <Button size="sm" variant="danger" onClick={handleRevoke} loading={isPending} disabled={isPending}>
          Yes, revoke
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={isPending}>
          Cancel
        </Button>
        {error && <p className="text-xs text-red-400 w-full">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
      title="Revoke this share link"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Revoke
    </button>
  );
}
