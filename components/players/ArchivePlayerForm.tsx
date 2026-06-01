"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Archive, Trash2, AlertTriangle } from "lucide-react";

interface ArchivePlayerFormProps {
  teamId: string;
  playerId: string;
  playerName: string;
  currentStatus: string;
  archiveAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  isManager: boolean;
}

export function ArchivePlayerForm({
  teamId,
  playerId,
  playerName,
  currentStatus,
  archiveAction,
  deleteAction,
  isManager,
}: ArchivePlayerFormProps) {
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPendingArchive, startArchive] = useTransition();
  const [isPendingDelete, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isArchived = currentStatus === "archived";

  function handleArchive(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startArchive(async () => {
      try {
        await archiveAction(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to archive player.");
      }
    });
  }

  function handleDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startDelete(async () => {
      try {
        await deleteAction(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete player.");
      }
    });
  }

  return (
    <div className="mt-8 rounded-xl border border-slate-700/50 bg-slate-900 p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-1">
        Danger zone
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        These actions affect this player&apos;s availability in reports and
        game sessions. Archived players are hidden from the roster by default
        but their data is preserved.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* Archive */}
        {!isArchived && (
          <div>
            {!confirmArchive ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setConfirmDelete(false);
                  setConfirmArchive(true);
                }}
              >
                <Archive className="h-3.5 w-3.5" />
                Archive player
              </Button>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <p className="text-sm text-slate-300 flex-1">
                  Archive <strong>{playerName}</strong>? They&apos;ll be hidden
                  from the active roster but their historical data is preserved.
                </p>
                <div className="flex gap-2 shrink-0">
                  <form onSubmit={handleArchive}>
                    <input type="hidden" name="teamId" value={teamId} />
                    <input type="hidden" name="playerId" value={playerId} />
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      loading={isPendingArchive}
                      disabled={isPendingArchive}
                    >
                      Archive
                    </Button>
                  </form>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmArchive(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Permanent delete — manager only */}
        {isManager && (
          <div>
            {!confirmDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => {
                  setConfirmArchive(false);
                  setConfirmDelete(true);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete permanently
              </Button>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 font-medium">
                    Permanently delete {playerName}?
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    This cannot be undone. The player record will be removed.
                    Any game reports that referenced this player will retain
                    their display name but lose the player link.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <form onSubmit={handleDelete}>
                      <input type="hidden" name="teamId" value={teamId} />
                      <input type="hidden" name="playerId" value={playerId} />
                      <Button
                        type="submit"
                        variant="danger"
                        size="sm"
                        loading={isPendingDelete}
                        disabled={isPendingDelete}
                      >
                        Delete permanently
                      </Button>
                    </form>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
