"use client";

import { useState, useTransition } from "react";
import { addPlayerToCricketTeam } from "@/app/actions/cricket-teams";

interface AddPlayerFormProps {
  teamId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const BATTING_OPTIONS = [
  { value: "", label: "— Select —" },
  { value: "right_hand_bat", label: "Right-hand bat" },
  { value: "left_hand_bat", label: "Left-hand bat" },
  { value: "unknown", label: "Unknown" },
];

const BOWLING_OPTIONS = [
  { value: "", label: "— Select —" },
  { value: "right_arm_fast", label: "Right-arm fast" },
  { value: "right_arm_medium", label: "Right-arm medium" },
  { value: "right_arm_spin", label: "Right-arm spin" },
  { value: "left_arm_fast", label: "Left-arm fast" },
  { value: "left_arm_medium", label: "Left-arm medium" },
  { value: "left_arm_spin", label: "Left-arm spin" },
  { value: "wicketkeeper", label: "Wicketkeeper" },
  { value: "none", label: "None" },
  { value: "unknown", label: "Unknown" },
];

const ROLE_OPTIONS = [
  { value: "", label: "— Select —" },
  { value: "batter", label: "Batter" },
  { value: "bowler", label: "Bowler" },
  { value: "all_rounder", label: "All-rounder" },
  { value: "wicketkeeper", label: "Wicketkeeper" },
  { value: "unknown", label: "Unknown" },
];

export function AddPlayerForm({ teamId, onSuccess, onCancel }: AddPlayerFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [primaryRole, setPrimaryRole] = useState("");
  const [battingStyle, setBattingStyle] = useState("");
  const [bowlingStyle, setBowlingStyle] = useState("");
  const [bio, setBio] = useState("");
  const [isCaptain, setIsCaptain] = useState(false);
  const [isViceCaptain, setIsViceCaptain] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await addPlayerToCricketTeam(
        teamId,
        {
          displayName: displayName.trim(),
          email: email.trim() || undefined,
          battingStyle: battingStyle || undefined,
          bowlingStyle: bowlingStyle || undefined,
          primaryRole: primaryRole || undefined,
          bio: bio.trim() || undefined,
        },
        {
          jerseyNumber: jerseyNumber.trim() || undefined,
          isCaptain,
          isViceCaptain,
        }
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      onSuccess?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="player-name" className="block text-xs font-medium text-slate-400 mb-1">
          Display name <span className="text-rose-400">*</span>
        </label>
        <input
          id="player-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Full name"
          disabled={isPending}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="player-email" className="block text-xs font-medium text-slate-400 mb-1">Email</label>
          <input
            id="player-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="player@example.com"
            disabled={isPending}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="jersey-number" className="block text-xs font-medium text-slate-400 mb-1">Jersey number</label>
          <input
            id="jersey-number"
            type="text"
            value={jerseyNumber}
            onChange={(e) => setJerseyNumber(e.target.value)}
            placeholder="e.g. 10"
            maxLength={4}
            disabled={isPending}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="primary-role" className="block text-xs font-medium text-slate-400 mb-1">Primary role</label>
          <select
            id="primary-role"
            value={primaryRole}
            onChange={(e) => setPrimaryRole(e.target.value)}
            disabled={isPending}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
          >
            {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="batting-style" className="block text-xs font-medium text-slate-400 mb-1">Batting style</label>
          <select
            id="batting-style"
            value={battingStyle}
            onChange={(e) => setBattingStyle(e.target.value)}
            disabled={isPending}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
          >
            {BATTING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="bowling-style" className="block text-xs font-medium text-slate-400 mb-1">Bowling style</label>
          <select
            id="bowling-style"
            value={bowlingStyle}
            onChange={(e) => setBowlingStyle(e.target.value)}
            disabled={isPending}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
          >
            {BOWLING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="player-bio" className="block text-xs font-medium text-slate-400 mb-1">Bio (optional)</label>
          <textarea
            id="player-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short bio…"
            rows={2}
            disabled={isPending}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50 resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={isCaptain}
            onChange={(e) => { setIsCaptain(e.target.checked); if (e.target.checked) setIsViceCaptain(false); }}
            disabled={isPending}
            className="rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500"
          />
          Captain
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={isViceCaptain}
            onChange={(e) => { setIsViceCaptain(e.target.checked); if (e.target.checked) setIsCaptain(false); }}
            disabled={isPending}
            className="rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500"
          />
          Vice Captain
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2">
          <p className="text-xs text-rose-400">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || !displayName.trim()}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Adding…" : "Add Player"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:border-slate-600 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
