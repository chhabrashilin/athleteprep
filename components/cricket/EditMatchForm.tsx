"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCricketMatch } from "@/app/actions/cricket-matches";
import { MATCH_STAGES, MATCH_PUBLISH_STATUSES, MATCH_SCHEDULE_STATUSES } from "@/lib/cricket/validation/match";
import type { CricketMatchWithTeams, CricketTeamFull, CricketVenueFull } from "@/lib/cricket/types";

interface EditMatchFormProps {
  match: CricketMatchWithTeams;
  teams: CricketTeamFull[];
  venues: CricketVenueFull[];
}

function toLocalDatetimeValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export function EditMatchForm({ match, teams, venues }: EditMatchFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const homeTeamId = form.get("homeTeamId") as string;
    const awayTeamId = form.get("awayTeamId") as string;

    if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
      setError("Home and away teams must be different.");
      setLoading(false);
      return;
    }

    const scheduledStart = form.get("scheduledStart") as string;
    const scheduledEnd = form.get("scheduledEnd") as string;

    const input: Record<string, unknown> = {
      homeTeamId: homeTeamId || undefined,
      awayTeamId: awayTeamId || undefined,
      venueId: (form.get("venueId") as string) || null,
      matchType: (form.get("matchType") as string) || undefined,
      oversPerInnings: Number(form.get("oversPerInnings")),
      scheduledStart: scheduledStart ? new Date(scheduledStart).toISOString() : null,
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
      matchNumber: form.get("matchNumber") ? Number(form.get("matchNumber")) : null,
      roundName: (form.get("roundName") as string) || null,
      stage: (form.get("stage") as string) || null,
      title: (form.get("title") as string) || null,
      primaryUmpireName: (form.get("primaryUmpireName") as string) || null,
      secondaryUmpireName: (form.get("secondaryUmpireName") as string) || null,
      matchRefereeName: (form.get("matchRefereeName") as string) || null,
      notes: (form.get("notes") as string) || null,
      internalNotes: (form.get("internalNotes") as string) || null,
      scheduleStatus: (form.get("scheduleStatus") as string) || undefined,
      publishStatus: (form.get("publishStatus") as string) || undefined,
    };

    const result = await updateCricketMatch(match.id, input);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <p className="text-sm text-emerald-400">Match updated successfully.</p>
        </div>
      )}

      {/* Title */}
      <fieldset className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <legend className="text-sm font-semibold text-slate-300 px-1">Title</legend>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Custom Title (optional)</label>
          <input
            name="title"
            defaultValue={match.title ?? ""}
            placeholder="Leave blank to use team names"
            maxLength={140}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
          />
        </div>
      </fieldset>

      {/* Teams */}
      {teams.length > 0 && (
        <fieldset className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <legend className="text-sm font-semibold text-slate-300 px-1">Teams</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Home Team</label>
              <select
                name="homeTeamId"
                defaultValue={match.homeTeamId ?? ""}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Away Team</label>
              <select
                name="awayTeamId"
                defaultValue={match.awayTeamId ?? ""}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>
      )}

      {/* Format */}
      <fieldset className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <legend className="text-sm font-semibold text-slate-300 px-1">Format</legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Match Type</label>
            <select
              name="matchType"
              defaultValue={match.matchType}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              {["T20", "ODI", "Test", "T10", "Other"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Overs</label>
            <input
              name="oversPerInnings"
              type="number"
              min={1}
              max={100}
              defaultValue={match.oversPerInnings}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Stage</label>
            <select
              name="stage"
              defaultValue={match.stage ?? ""}
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
              defaultValue={match.roundName ?? ""}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Match Number</label>
          <input
            name="matchNumber"
            type="number"
            min={1}
            defaultValue={match.matchNumber ?? ""}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
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
            defaultValue={match.venueId ?? ""}
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
              defaultValue={toLocalDatetimeValue(match.scheduledStart)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Scheduled End</label>
            <input
              name="scheduledEnd"
              type="datetime-local"
              defaultValue={toLocalDatetimeValue(match.scheduledEnd)}
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
              defaultValue={match.primaryUmpireName ?? ""}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Secondary Umpire</label>
            <input
              name="secondaryUmpireName"
              defaultValue={match.secondaryUmpireName ?? ""}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Match Referee</label>
          <input
            name="matchRefereeName"
            defaultValue={match.matchRefereeName ?? ""}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
          />
        </div>
      </fieldset>

      {/* Status */}
      <fieldset className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <legend className="text-sm font-semibold text-slate-300 px-1">Status</legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Schedule Status</label>
            <select
              name="scheduleStatus"
              defaultValue={match.scheduleStatus}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              {MATCH_SCHEDULE_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Publish Status</label>
            <select
              name="publishStatus"
              defaultValue={match.publishStatus}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              {MATCH_PUBLISH_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {/* Notes */}
      <fieldset className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <legend className="text-sm font-semibold text-slate-300 px-1">Notes</legend>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Public Notes</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={match.notes ?? ""}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Internal Notes</label>
          <textarea
            name="internalNotes"
            rows={2}
            defaultValue={match.internalNotes ?? ""}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none resize-none"
          />
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
      >
        {loading ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
