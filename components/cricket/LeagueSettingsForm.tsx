"use client";

import { useState, useTransition } from "react";
import {
  updateCricketLeague,
  updateCricketLeagueSettings,
} from "@/app/actions/cricket-leagues";
import {
  LEAGUE_VISIBILITIES,
  LEAGUE_REGISTRATION_STATUSES,
} from "@/lib/cricket/validation/league";
import type { CricketLeagueFull, CricketLeagueSettings } from "@/lib/cricket/types";

interface LeagueSettingsFormProps {
  league: CricketLeagueFull;
  settings: CricketLeagueSettings | null;
  onSaved?: () => void;
}

const VISIBILITY_LABELS: Record<string, string> = {
  private: "Private",
  unlisted: "Unlisted",
  public: "Public",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  open: "Open for registration",
  closed: "Closed",
  archived: "Archived",
};

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-slate-800 pb-2 mb-5">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{title}</h3>
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-300 mb-1.5">
      {children}
    </label>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
    />
  );
}

function Textarea({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
    />
  );
}

function Select({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label htmlFor={id} className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-slate-300">{label}</span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900"
      />
    </label>
  );
}

export function LeagueSettingsForm({ league, settings, onSaved }: LeagueSettingsFormProps) {
  // League fields
  const [name, setName] = useState(league.name);
  const [description, setDescription] = useState(league.description ?? "");
  const [seasonName, setSeasonName] = useState(league.seasonName ?? "");
  const [visibility, setVisibility] = useState(league.visibility);
  const [registrationStatus, setRegistrationStatus] = useState(league.registrationStatus);
  const [contactEmail, setContactEmail] = useState(league.contactEmail ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(league.websiteUrl ?? "");
  const [rulesSummary, setRulesSummary] = useState(league.rulesSummary ?? "");
  const [allowTeamRegistration, setAllowTeamRegistration] = useState(league.allowTeamRegistration);
  const [allowPlayerRegistration, setAllowPlayerRegistration] = useState(league.allowPlayerRegistration);
  const [requireAdminApproval, setRequireAdminApproval] = useState(league.requireAdminApproval);
  const [allowPublicScorecards, setAllowPublicScorecards] = useState(league.allowPublicScorecards);

  // Settings fields
  const [defaultOvers, setDefaultOvers] = useState(String(settings?.defaultOvers ?? league.oversPerInnings));
  const [maxPlayers, setMaxPlayers] = useState(String(settings?.maxPlayersPerTeam ?? ""));
  const [minPlayers, setMinPlayers] = useState(String(settings?.minPlayersPerTeam ?? ""));
  const [allowSubstitutes, setAllowSubstitutes] = useState(settings?.allowSubstitutes ?? true);
  const [allowSuperOver, setAllowSuperOver] = useState(settings?.allowSuperOver ?? true);
  const [allowDL, setAllowDL] = useState(settings?.allowDuckworthLewis ?? false);
  const [pointsWin, setPointsWin] = useState(String(settings?.pointsWin ?? 2));
  const [pointsLoss, setPointsLoss] = useState(String(settings?.pointsLoss ?? 0));
  const [pointsTie, setPointsTie] = useState(String(settings?.pointsTie ?? 1));
  const [pointsNoResult, setPointsNoResult] = useState(String(settings?.pointsNoResult ?? 1));
  const [nrrEnabled, setNrrEnabled] = useState(settings?.netRunRateEnabled ?? true);
  const [bonusEnabled, setBonusEnabled] = useState(settings?.bonusPointsEnabled ?? false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const leagueResult = await updateCricketLeague(league.id, {
        name,
        description: description || undefined,
        seasonName,
        visibility,
        registrationStatus,
        contactEmail: contactEmail || undefined,
        websiteUrl: websiteUrl || undefined,
        rulesSummary: rulesSummary || undefined,
        allowTeamRegistration,
        allowPlayerRegistration,
        requireAdminApproval,
        allowPublicScorecards,
      });

      if (!leagueResult.success) {
        setError(leagueResult.error);
        return;
      }

      const settingsResult = await updateCricketLeagueSettings(league.id, {
        defaultOvers: parseInt(defaultOvers, 10) || undefined,
        maxPlayersPerTeam: maxPlayers ? parseInt(maxPlayers, 10) : undefined,
        minPlayersPerTeam: minPlayers ? parseInt(minPlayers, 10) : undefined,
        allowSubstitutes,
        allowSuperOver,
        allowDuckworthLewis: allowDL,
        pointsWin: parseInt(pointsWin, 10) || undefined,
        pointsLoss: parseInt(pointsLoss, 10),
        pointsTie: parseInt(pointsTie, 10) || undefined,
        pointsNoResult: parseInt(pointsNoResult, 10) || undefined,
        netRunRateEnabled: nrrEnabled,
        bonusPointsEnabled: bonusEnabled,
      });

      if (!settingsResult.success) {
        setError(settingsResult.error);
        return;
      }

      setSuccess("Settings saved successfully.");
      onSaved?.();
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-10">
      {/* ── League Info ── */}
      <section>
        <SectionHeader title="League Info" />
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="s-name">League name</FieldLabel>
            <TextInput id="s-name" value={name} onChange={setName} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="s-desc">Description</FieldLabel>
            <Textarea id="s-desc" value={description} onChange={setDescription} placeholder="Brief description…" />
          </div>
          <div>
            <FieldLabel htmlFor="s-season">Season name</FieldLabel>
            <TextInput id="s-season" value={seasonName} onChange={setSeasonName} />
          </div>
          <div>
            <FieldLabel htmlFor="s-visibility">Visibility</FieldLabel>
            <Select
              id="s-visibility"
              value={visibility}
              onChange={setVisibility}
              options={LEAGUE_VISIBILITIES.map((v) => ({ value: v, label: VISIBILITY_LABELS[v] ?? v }))}
            />
          </div>
          <div>
            <FieldLabel htmlFor="s-status">Registration status</FieldLabel>
            <Select
              id="s-status"
              value={registrationStatus}
              onChange={setRegistrationStatus}
              options={LEAGUE_REGISTRATION_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s }))}
            />
          </div>
        </div>
      </section>

      {/* ── Registration ── */}
      <section>
        <SectionHeader title="Registration" />
        <div className="space-y-3">
          <Toggle id="s-team-reg" checked={allowTeamRegistration} onChange={setAllowTeamRegistration} label="Allow team registration" />
          <Toggle id="s-player-reg" checked={allowPlayerRegistration} onChange={setAllowPlayerRegistration} label="Allow player registration" />
          <Toggle id="s-approval" checked={requireAdminApproval} onChange={setRequireAdminApproval} label="Require admin approval" />
          <Toggle id="s-public-sc" checked={allowPublicScorecards} onChange={setAllowPublicScorecards} label="Allow public scorecards" />
        </div>
      </section>

      {/* ── Contact ── */}
      <section>
        <SectionHeader title="Contact" />
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="s-email">Contact email</FieldLabel>
            <TextInput id="s-email" type="email" value={contactEmail} onChange={setContactEmail} placeholder="league@example.com" />
          </div>
          <div>
            <FieldLabel htmlFor="s-url">Website URL</FieldLabel>
            <TextInput id="s-url" value={websiteUrl} onChange={setWebsiteUrl} placeholder="https://example.com" />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="s-rules">Rules summary</FieldLabel>
            <Textarea id="s-rules" value={rulesSummary} onChange={setRulesSummary} rows={4} placeholder="Key playing conditions…" />
          </div>
        </div>
      </section>

      {/* ── Match Settings ── */}
      <section>
        <SectionHeader title="Match Settings" />
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <FieldLabel htmlFor="s-overs">Default overs</FieldLabel>
            <TextInput id="s-overs" type="number" value={defaultOvers} onChange={setDefaultOvers} />
          </div>
          <div>
            <FieldLabel htmlFor="s-max-p">Max players per team</FieldLabel>
            <TextInput id="s-max-p" type="number" value={maxPlayers} onChange={setMaxPlayers} placeholder="No limit" />
          </div>
          <div>
            <FieldLabel htmlFor="s-min-p">Min players per team</FieldLabel>
            <TextInput id="s-min-p" type="number" value={minPlayers} onChange={setMinPlayers} placeholder="No limit" />
          </div>
          <div className="sm:col-span-3 space-y-3">
            <Toggle id="s-subs" checked={allowSubstitutes} onChange={setAllowSubstitutes} label="Allow substitutes" />
            <Toggle id="s-super" checked={allowSuperOver} onChange={setAllowSuperOver} label="Allow super over" />
            <Toggle id="s-dl" checked={allowDL} onChange={setAllowDL} label="Allow Duckworth-Lewis method" />
            <Toggle id="s-nrr" checked={nrrEnabled} onChange={setNrrEnabled} label="Net Run Rate enabled" />
            <Toggle id="s-bonus" checked={bonusEnabled} onChange={setBonusEnabled} label="Bonus points enabled" />
          </div>
        </div>
      </section>

      {/* ── Points ── */}
      <section>
        <SectionHeader title="Points System" />
        <div className="grid gap-5 sm:grid-cols-4">
          <div>
            <FieldLabel htmlFor="s-pw">Win</FieldLabel>
            <TextInput id="s-pw" type="number" value={pointsWin} onChange={setPointsWin} />
          </div>
          <div>
            <FieldLabel htmlFor="s-pl">Loss</FieldLabel>
            <TextInput id="s-pl" type="number" value={pointsLoss} onChange={setPointsLoss} />
          </div>
          <div>
            <FieldLabel htmlFor="s-pt">Tie</FieldLabel>
            <TextInput id="s-pt" type="number" value={pointsTie} onChange={setPointsTie} />
          </div>
          <div>
            <FieldLabel htmlFor="s-pnr">No result</FieldLabel>
            <TextInput id="s-pnr" type="number" value={pointsNoResult} onChange={setPointsNoResult} />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <p className="text-sm text-emerald-400">{success}</p>
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-slate-800">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
