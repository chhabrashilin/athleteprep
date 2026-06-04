"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PlayerCard } from "./PlayerCard";
import { AddPlayerForm } from "./AddPlayerForm";
import {
  removePlayerFromCricketTeam,
  assignCricketCaptain,
  assignCricketViceCaptain,
} from "@/app/actions/cricket-teams";
import type { CricketRosterEntryWithPlayer } from "@/lib/cricket/types";

interface RosterManagerProps {
  teamId: string;
  teamSlug?: string;
  roster: CricketRosterEntryWithPlayer[];
  canManage: boolean;
}

export function RosterManager({ teamId, teamSlug: _teamSlug, roster: initialRoster, canManage }: RosterManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [roster, setRoster] = useState(initialRoster);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  function handlePlayerAdded() {
    setShowAddForm(false);
    router.refresh();
  }

  function handleRemoveClick(rosterEntryId: string) {
    setConfirmRemoveId(rosterEntryId);
  }

  function handleConfirmRemove(rosterEntryId: string) {
    setConfirmRemoveId(null);

    startTransition(async () => {
      const result = await removePlayerFromCricketTeam(rosterEntryId, teamId);
      if (result.success) {
        setRoster((prev) => prev.filter((r) => r.id !== rosterEntryId));
      }
    });
  }

  function handleAssignCaptain(playerId: string) {
    startTransition(async () => {
      const result = await assignCricketCaptain(teamId, playerId);
      if (result.success) {
        setRoster((prev) =>
          prev.map((r) => ({
            ...r,
            isCaptain: r.cricketPlayerId === playerId,
          }))
        );
      }
    });
  }

  function handleAssignViceCaptain(playerId: string) {
    startTransition(async () => {
      const result = await assignCricketViceCaptain(teamId, playerId);
      if (result.success) {
        setRoster((prev) =>
          prev.map((r) => ({
            ...r,
            isViceCaptain: r.cricketPlayerId === playerId,
          }))
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Add player button */}
      {canManage && !showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-2.5 text-sm font-medium text-sky-400 hover:bg-sky-500/20 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Player
        </button>
      )}

      {/* Add player form */}
      {canManage && showAddForm && (
        <div className="rounded-xl border border-sky-500/30 bg-slate-900 p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Add Player</h3>
          <AddPlayerForm
            teamId={teamId}
            onSuccess={handlePlayerAdded}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Roster list */}
      {roster.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-400">No players on this roster yet.</p>
          {canManage && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-3 text-sm text-sky-400 hover:underline"
            >
              Add first player
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {roster.map((entry) => (
            <div key={entry.id} className="relative">
              {confirmRemoveId === entry.id && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-slate-900/90 backdrop-blur-sm gap-3">
                  <p className="text-xs text-slate-300">Remove {entry.player.displayName}?</p>
                  <button
                    onClick={() => handleConfirmRemove(entry.id)}
                    className="rounded-lg bg-rose-600 px-3 py-1 text-xs text-white hover:bg-rose-500"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => setConfirmRemoveId(null)}
                    className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <PlayerCard
                player={entry.player}
                rosterEntry={entry}
                href={entry.player.slug ? `/cricket/players/${entry.player.slug}` : undefined}
                canManage={canManage}
                onRemove={canManage ? () => handleRemoveClick(entry.id) : undefined}
                onAssignCaptain={canManage && !entry.isCaptain ? () => handleAssignCaptain(entry.cricketPlayerId) : undefined}
                onAssignViceCaptain={canManage && !entry.isViceCaptain ? () => handleAssignViceCaptain(entry.cricketPlayerId) : undefined}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
