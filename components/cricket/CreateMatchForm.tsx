"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCricketMatch } from "@/app/actions/cricket-matches";
import { MATCH_STAGES } from "@/lib/cricket/validation/match";
import type { CricketTeamFull, CricketVenueFull } from "@/lib/cricket/types";

interface CreateMatchFormProps {
  leagueId: string;
  leagueSlug?: string;
  teams: CricketTeamFull[];
  venues: CricketVenueFull[];
}

export function CreateMatchForm({ leagueId, teams, venues }: CreateMatchFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [estimatedEnd, setEstimatedEnd] = useState("");

  function handleStartChange(e: React.ChangeEvent<HTMLInputElement>) {
    const start = e.target.value;
    if (start) {
      const d = new Date(start);
      d.setMinutes(d.getMinutes() + 240); // 4 hour default
      setEstimatedEnd(d.toISOString().slice(0, 16));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const homeTeamId = form.get("homeTeamId") as string;
    const awayTeamId = form.get("awayTeamId") as string;

    if (homeTeamId === awayTeamId) {
      setError("Home and away teams must be different.");
      setLoading(false);
      return;
    }

    const scheduledStart = form.get("scheduledStart") as string;
    const scheduledEnd = form.get("scheduledEnd") as string;

    const input = {
      leagueId,
      homeTeamId,
      awayTeamId,
      oversPerInnings: Number(form.get("oversPerInnings")),
      venueId: (form.get("venueId") as string) || null,
      scheduledStart: scheduledStart ? new Date(scheduledStart).toISOString() : null,
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
      matchNumber: form.get("matchNumber") ? Number(form.get("matchNumber")) : null,
      roundName: (form.get("roundName") as string) || null,
      stage: (form.get("stage") as string) || null,
      matchType: (form.get("matchType") as string) || "T20",
      primaryUmpireName: (form.get("primaryUmpireName") as string) || null,
      secondaryUmpireName: (form.get("secondaryUmpireName") as string) || null,
      notes: (form.get("notes") as string) || null,
    };

    const result = await createCricketMatch(input);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(`/cricket/matches/${result.data.slug ?? result.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Teams */}
      <fieldset className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <legend className="text-sm font-semibold text-slate-300 px-1">Teams *</legend>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Home Team</label>
            <select
              name="homeTeamId"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              <option value="">Select team…</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Away Team</label>
            <select
              name="awayTeamId"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              <option value="">Select team…</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {/* Format */}
      <fieldset className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <legend className="text-sm font-semibold text-slate-300 px-1">Format</legend>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Match Type</label>
            <select
              name="matchType"
              defaultValue="T20"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              {["T20", "ODI", "Test", "T10", "Other"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Overs per Innings *</label>
            <input
              name="oversPerInnings"
              type="number"
              min={1}
              max={100}
              required
              defaultValue={20}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Stage</label>
            <select
              name="stage"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              <option value="">— none —</option>
              {MATCH_STAGES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Round Name</label>
            <input
              name="roundName"
              placeholder="e.g. Round 1"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Match Number</label>
          <input
            name="matchNumber"
            type="number"
            min={1}
            placeholder="e.g. 1"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
          />
        </div>
      </fieldset>

      {/* Schedule */}
      <fieldset className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <legend className="text-sm font-semibold text-slate-300 px-1">Schedule</legend>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Venue</label>
          <select
            name="venueId"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            <option value="">— no venue —</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>{v.name} — {v.city}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Scheduled Start</label>
            <input
              name="scheduledStart"
              type="datetime-local"
              onChange={handleStartChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Scheduled End</label>
            <input
              name="scheduledEnd"
              type="datetime-local"
              value={estimatedEnd}
              onChange={(e) => setEstimatedEnd(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>
      </fieldset>

      {/* Officials */}
      <fieldset className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <legend className="text-sm font-semibold text-slate-300 px-1">Officials</legend>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Primary Umpire</label>
            <input
              name="primaryUmpireName"
              placeholder="Umpire name"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Secondary Umpire</label>
            <input
              name="secondaryUmpireName"
              placeholder="Umpire name"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>
      </fieldset>

      {/* Notes */}
      <fieldset className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <legend className="text-sm font-semibold text-slate-300 px-1">Notes</legend>
        <textarea
          name="notes"
          rows={3}
          maxLength={2000}
          placeholder="Any notes for this match…"
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none resize-none"
        />
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
      >
        {loading ? "Creating match…" : "Create Match"}
      </button>
    </form>
  );
}
