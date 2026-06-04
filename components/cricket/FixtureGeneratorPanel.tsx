"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { generateCricketLeagueFixtures, saveGeneratedCricketFixtures } from "@/app/actions/cricket-scheduling";
import type { CricketTeamFull, CricketVenueFull } from "@/lib/cricket/types";
import type { ScheduledFixture } from "@/lib/cricket/scheduling/round-robin";

interface FixtureGeneratorPanelProps {
  leagueId: string;
  leagueSlug?: string;
  teams: CricketTeamFull[];
  venues: CricketVenueFull[];
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function FixtureGeneratorPanel({ leagueId, teams, venues }: FixtureGeneratorPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"config" | "preview">("config");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    fixtures: Array<ScheduledFixture & { homeTeamName?: string; awayTeamName?: string; venueName?: string }>;
    summary: { totalMatches: number; totalRounds: number; conflictCount: number; unscheduledCount: number };
  } | null>(null);

  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(teams.map((t) => t.id));
  const [selectedVenueIds, setSelectedVenueIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [preferredDays, setPreferredDays] = useState<number[]>([0, 6]);
  const [matchStartTime, setMatchStartTime] = useState("10:00");
  const [matchDurationMinutes, setMatchDurationMinutes] = useState(240);
  const [maxMatchesPerDay, setMaxMatchesPerDay] = useState(2);

  function toggleDay(day: number) {
    setPreferredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function toggleTeam(id: string) {
    setSelectedTeamIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function toggleVenue(id: string) {
    setSelectedVenueIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await generateCricketLeagueFixtures(leagueId, {
      leagueId,
      teamIds: selectedTeamIds,
      startDate,
      preferredDays,
      matchStartTime,
      matchDurationMinutes,
      venueIds: selectedVenueIds,
      maxMatchesPerDay,
      format: "single_round_robin",
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setPreview(result.data);
    setStep("preview");
  }

  async function handleSave() {
    if (!preview) return;
    setSaving(true);
    setError(null);

    const result = await saveGeneratedCricketFixtures(leagueId, preview.fixtures);
    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    setStep("config");
    setPreview(null);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-700 transition-all"
      >
        <Zap className="h-4 w-4 text-sky-400" />
        Generate Fixtures
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-slate-700 bg-slate-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Zap className="h-4 w-4 text-sky-400" />
          Generate Fixtures
        </h3>
        <button
          onClick={() => { setOpen(false); setStep("config"); setPreview(null); }}
          className="text-xs text-slate-500 hover:text-slate-400"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {step === "config" && (
        <form onSubmit={handleGenerate} className="space-y-4">
          {/* Teams */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">Teams ({selectedTeamIds.length} selected)</p>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
              {teams.map((t) => (
                <label key={t.id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={selectedTeamIds.includes(t.id)}
                    onChange={() => toggleTeam(t.id)}
                    className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-sky-500"
                  />
                  {t.name}
                </label>
              ))}
            </div>
            {teams.length < 2 && (
              <p className="text-xs text-amber-400 mt-1">At least 2 teams are required.</p>
            )}
          </div>

          {/* Start date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Season Start Date *</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Preferred days */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">Preferred match days</p>
            <div className="flex flex-wrap gap-1.5">
              {DAY_NAMES.map((day, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    preferredDays.includes(i)
                      ? "bg-sky-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Time / duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Match Start Time</label>
              <input
                type="time"
                value={matchStartTime}
                onChange={(e) => setMatchStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Duration (min)</label>
              <input
                type="number"
                min={30}
                max={720}
                value={matchDurationMinutes}
                onChange={(e) => setMatchDurationMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Max matches per day */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Max matches per day</label>
            <input
              type="number"
              min={1}
              max={10}
              value={maxMatchesPerDay}
              onChange={(e) => setMaxMatchesPerDay(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Venues */}
          {venues.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Venues to rotate (optional)</p>
              <div className="space-y-1">
                {venues.slice(0, 6).map((v) => (
                  <label key={v.id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={selectedVenueIds.includes(v.id)}
                      onChange={() => toggleVenue(v.id)}
                      className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-sky-500"
                    />
                    {v.name} — {v.city}
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || selectedTeamIds.length < 2 || !startDate || preferredDays.length === 0}
            className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Generating…" : "Preview Fixtures"}
          </button>
        </form>
      )}

      {step === "preview" && preview && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-slate-800 p-2">
              <p className="text-lg font-bold text-sky-400">{preview.summary.totalMatches}</p>
              <p className="text-xs text-slate-500">Matches</p>
            </div>
            <div className="rounded-lg bg-slate-800 p-2">
              <p className="text-lg font-bold text-sky-400">{preview.summary.totalRounds}</p>
              <p className="text-xs text-slate-500">Rounds</p>
            </div>
            <div className={`rounded-lg p-2 ${preview.summary.conflictCount > 0 ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
              <p className={`text-lg font-bold ${preview.summary.conflictCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                {preview.summary.conflictCount}
              </p>
              <p className="text-xs text-slate-500">Conflicts</p>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1">
            {preview.fixtures.map((f, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs">
                <span className="text-slate-300 font-medium">
                  {f.homeTeamName ?? f.homeTeamId.slice(0, 8)} vs {f.awayTeamName ?? f.awayTeamId.slice(0, 8)}
                </span>
                <div className="text-right shrink-0">
                  <p className="text-slate-400">{f.scheduledStart ? new Date(f.scheduledStart).toLocaleDateString() : "TBD"}</p>
                  {f.venueName && <p className="text-slate-500">{f.venueName}</p>}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500">
            Fixtures will be added in draft status. You can publish them separately.
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setStep("config")}
              className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : `Save ${preview.fixtures.length} Fixtures`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
