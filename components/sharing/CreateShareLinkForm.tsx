"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { CopyShareLinkButton } from "@/components/sharing/CopyShareLinkButton";
import { createShareLinkAction } from "@/app/teams/[teamId]/games/[gameId]/report/actions";
import type { ShareVisibility } from "@/types/core";
import type { ShareLink } from "@/types/sharing";
import type { Player } from "@/types/database";

interface CreateShareLinkFormProps {
  teamId: string;
  gameId: string;
  gameReportId: string;
  players: Player[];
  baseUrl: string;
  onCreated: (link: ShareLink) => void;
}

const VISIBILITY_OPTIONS: {
  value: ShareVisibility;
  label: string;
  description: string;
}[] = [
  {
    value: "private_link",
    label: "Private link",
    description: "Anyone with this link can view the read-only report until it expires or is revoked.",
  },
  {
    value: "staff_only",
    label: "Staff only",
    description: "Only authenticated team members can view this report.",
  },
  {
    value: "player_specific",
    label: "Player specific",
    description: "Share only one player's feedback and relevant key moments.",
  },
  {
    value: "public_summary",
    label: "Public summary",
    description: "Share a sanitized summary without private player-level detail.",
  },
];

export function CreateShareLinkForm({
  teamId,
  gameId,
  gameReportId,
  players,
  baseUrl,
  onCreated,
}: CreateShareLinkFormProps) {
  const [isPending, startTransition] = useTransition();
  const [visibility, setVisibility] = useState<ShareVisibility>("private_link");
  const [allowedPlayerId, setAllowedPlayerId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<ShareLink | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (visibility === "player_specific" && !allowedPlayerId) {
      setError("Please select a player for player-specific links.");
      return;
    }

    startTransition(async () => {
      const result = await createShareLinkAction({
        teamId,
        gameId,
        gameReportId,
        visibility,
        allowedPlayerId: visibility === "player_specific" ? allowedPlayerId : null,
        expiresAt: expiresAt || null,
      });

      if (result.success) {
        if (result.data) {
          setCreatedLink(result.data);
          onCreated(result.data);
        }
      } else {
        setError(result.error ?? "Failed to create share link. Please try again.");
      }
    });
  }

  if (createdLink) {
    const shareUrl = `${baseUrl}/share/reports/${createdLink.token}`;
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="text-sm font-semibold text-emerald-400 mb-1">Share link created.</p>
          <p className="text-xs text-slate-400 font-mono truncate mb-3">{shareUrl}</p>
          <CopyShareLinkButton url={shareUrl} />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setCreatedLink(null)}
        >
          Create another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Visibility */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-400">Visibility</p>
        <div className="space-y-2">
          {VISIBILITY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                visibility === opt.value
                  ? "border-sky-500/50 bg-sky-500/5"
                  : "border-slate-700 hover:border-slate-600"
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value={opt.value}
                checked={visibility === opt.value}
                onChange={() => setVisibility(opt.value)}
                className="mt-0.5 accent-sky-500"
              />
              <div>
                <p className="text-xs font-semibold text-slate-200">{opt.label}</p>
                <p className="text-xs text-slate-500">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Player selector (only for player_specific) */}
      {visibility === "player_specific" && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400" htmlFor="player-select">
            Select player *
          </label>
          <select
            id="player-select"
            value={allowedPlayerId}
            onChange={(e) => setAllowedPlayerId(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500/60 focus:outline-none"
          >
            <option value="">Choose a player…</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.jerseyNumber ? `#${p.jerseyNumber} ` : ""}
                {p.displayName ?? `${p.firstName}${p.lastName ? ` ${p.lastName}` : ""}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Expiry date */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400" htmlFor="expires-at">
          Expiration date (optional)
        </label>
        <input
          id="expires-at"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500/60 focus:outline-none"
        />
        <p className="text-xs text-slate-600">Leave blank for no expiration.</p>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <Button type="submit" size="sm" loading={isPending} disabled={isPending}>
        Create share link
      </Button>
    </form>
  );
}
