"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCricketLeague } from "@/app/actions/cricket-leagues";
import {
  generateLeagueSlug,
  normalizeLeagueSlug,
  LEAGUE_FORMATS,
  LEAGUE_VISIBILITIES,
  WEEK_DAYS,
} from "@/lib/cricket/validation/league";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  // Basics
  name: string;
  slug: string;
  slugManual: boolean;
  description: string;
  seasonName: string;
  format: string;
  // Location
  country: string;
  region: string;
  city: string;
  // Season
  startDate: string;
  endDate: string;
  matchDays: string[];
  timezone: string;
  // Match rules
  oversPerInnings: string;
  ballType: string;
  maxTeams: string;
  pointsWin: string;
  pointsTie: string;
  pointsNoResult: string;
  netRunRateEnabled: boolean;
  // Registration & Visibility
  visibility: string;
  allowTeamRegistration: boolean;
  allowPlayerRegistration: boolean;
  requireAdminApproval: boolean;
  allowPublicScorecards: boolean;
  // Contact
  contactEmail: string;
  websiteUrl: string;
  rulesSummary: string;
}

const DEFAULT_STATE: FormState = {
  name: "",
  slug: "",
  slugManual: false,
  description: "",
  seasonName: "",
  format: "round_robin",
  country: "",
  region: "",
  city: "",
  startDate: "",
  endDate: "",
  matchDays: [],
  timezone: "America/New_York",
  oversPerInnings: "20",
  ballType: "",
  maxTeams: "",
  pointsWin: "2",
  pointsTie: "1",
  pointsNoResult: "1",
  netRunRateEnabled: true,
  visibility: "private",
  allowTeamRegistration: false,
  allowPlayerRegistration: false,
  requireAdminApproval: true,
  allowPublicScorecards: false,
  contactEmail: "",
  websiteUrl: "",
  rulesSummary: "",
};

const FORMAT_LABELS: Record<string, string> = {
  round_robin: "Round Robin",
  knockout: "Knockout",
  group_stage: "Group Stage",
  franchise: "Franchise",
  friendly: "Friendly",
  custom: "Custom",
};

const VISIBILITY_LABELS: Record<string, string> = {
  private: "Private — Only members can see this league",
  unlisted: "Unlisted — Anyone with the link can see it",
  public: "Public — Listed and discoverable by anyone",
};

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Dhaka",
  "Asia/Colombo",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-slate-800 pb-2 mb-5">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{title}</h3>
    </div>
  );
}

function FieldLabel({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-300 mb-1.5">
      {children}
      {required && <span className="text-rose-400 ml-1">*</span>}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-slate-500">{children}</p>;
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
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
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Checkbox({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900"
      />
      <div>
        <p className="text-sm font-medium text-slate-300">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CreateLeagueForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      slug: prev.slugManual ? prev.slug : generateLeagueSlug(name),
    }));
  }

  function handleSlugChange(raw: string) {
    setForm((prev) => ({
      ...prev,
      slug: normalizeLeagueSlug(raw),
      slugManual: true,
    }));
  }

  function toggleMatchDay(day: string) {
    setForm((prev) => ({
      ...prev,
      matchDays: prev.matchDays.includes(day)
        ? prev.matchDays.filter((d) => d !== day)
        : [...prev.matchDays, day],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      name: form.name,
      slug: form.slug || generateLeagueSlug(form.name),
      seasonName: form.seasonName,
      format: form.format,
      oversPerInnings: parseInt(form.oversPerInnings, 10) || 20,
      timezone: form.timezone,
      visibility: form.visibility,
      description: form.description || undefined,
      country: form.country || undefined,
      region: form.region || undefined,
      city: form.city || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      matchDays: form.matchDays,
      ballType: form.ballType || undefined,
      maxTeams: form.maxTeams ? parseInt(form.maxTeams, 10) : undefined,
      pointsWin: parseInt(form.pointsWin, 10) || 2,
      pointsTie: parseInt(form.pointsTie, 10) || 1,
      pointsNoResult: parseInt(form.pointsNoResult, 10) || 1,
      netRunRateEnabled: form.netRunRateEnabled,
      allowTeamRegistration: form.allowTeamRegistration,
      allowPlayerRegistration: form.allowPlayerRegistration,
      requireAdminApproval: form.requireAdminApproval,
      allowPublicScorecards: form.allowPublicScorecards,
      contactEmail: form.contactEmail || undefined,
      websiteUrl: form.websiteUrl || undefined,
      rulesSummary: form.rulesSummary || undefined,
    };

    startTransition(async () => {
      const result = await createCricketLeague(payload);
      if (result.success) {
        router.push(`/cricket/leagues/${result.data.slug}/setup`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* ── Basics ── */}
      <section>
        <SectionHeader title="Basics" />
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="name" required>League name</FieldLabel>
            <TextInput
              id="name"
              value={form.name}
              onChange={handleNameChange}
              placeholder="e.g. Greater Chicago Cricket League"
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="slug">URL slug</FieldLabel>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 whitespace-nowrap">/cricket/leagues/</span>
              <TextInput
                id="slug"
                value={form.slug}
                onChange={handleSlugChange}
                placeholder="auto-generated"
              />
            </div>
            <FieldHint>Only lowercase letters, numbers, and hyphens.</FieldHint>
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              value={form.description}
              onChange={(v) => updateField("description", v)}
              placeholder="Brief description of the league…"
            />
          </div>
          <div>
            <FieldLabel htmlFor="seasonName" required>Season name</FieldLabel>
            <TextInput
              id="seasonName"
              value={form.seasonName}
              onChange={(v) => updateField("seasonName", v)}
              placeholder="e.g. Summer 2025"
            />
          </div>
          <div>
            <FieldLabel htmlFor="format" required>Format</FieldLabel>
            <Select
              id="format"
              value={form.format}
              onChange={(v) => updateField("format", v)}
              options={LEAGUE_FORMATS.map((f) => ({ value: f, label: FORMAT_LABELS[f] ?? f }))}
            />
          </div>
        </div>
      </section>

      {/* ── Location ── */}
      <section>
        <SectionHeader title="Location" />
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <FieldLabel htmlFor="country">Country</FieldLabel>
            <TextInput
              id="country"
              value={form.country}
              onChange={(v) => updateField("country", v)}
              placeholder="e.g. United States"
            />
          </div>
          <div>
            <FieldLabel htmlFor="region">Region / State</FieldLabel>
            <TextInput
              id="region"
              value={form.region}
              onChange={(v) => updateField("region", v)}
              placeholder="e.g. Illinois"
            />
          </div>
          <div>
            <FieldLabel htmlFor="city">City</FieldLabel>
            <TextInput
              id="city"
              value={form.city}
              onChange={(v) => updateField("city", v)}
              placeholder="e.g. Chicago"
            />
          </div>
        </div>
      </section>

      {/* ── Season ── */}
      <section>
        <SectionHeader title="Season" />
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="startDate">Start date</FieldLabel>
            <TextInput
              id="startDate"
              type="date"
              value={form.startDate}
              onChange={(v) => updateField("startDate", v)}
            />
          </div>
          <div>
            <FieldLabel htmlFor="endDate">End date</FieldLabel>
            <TextInput
              id="endDate"
              type="date"
              value={form.endDate}
              onChange={(v) => updateField("endDate", v)}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="matchDays">Preferred match days</FieldLabel>
            <div className="flex flex-wrap gap-2 mt-1">
              {WEEK_DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleMatchDay(day)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    form.matchDays.includes(day)
                      ? "border-sky-500 bg-sky-500/20 text-sky-300"
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="timezone" required>Timezone</FieldLabel>
            <Select
              id="timezone"
              value={form.timezone}
              onChange={(v) => updateField("timezone", v)}
              options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
            />
          </div>
        </div>
      </section>

      {/* ── Match Rules ── */}
      <section>
        <SectionHeader title="Match Rules" />
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <FieldLabel htmlFor="oversPerInnings" required>Overs per innings</FieldLabel>
            <TextInput
              id="oversPerInnings"
              type="number"
              value={form.oversPerInnings}
              onChange={(v) => updateField("oversPerInnings", v)}
              placeholder="20"
            />
          </div>
          <div>
            <FieldLabel htmlFor="ballType">Ball type</FieldLabel>
            <Select
              id="ballType"
              value={form.ballType}
              onChange={(v) => updateField("ballType", v)}
              options={[
                { value: "", label: "Not specified" },
                { value: "leather", label: "Leather" },
                { value: "tennis", label: "Tennis" },
                { value: "rubber", label: "Rubber" },
                { value: "pink", label: "Pink (day-night)" },
                { value: "other", label: "Other" },
              ]}
            />
          </div>
          <div>
            <FieldLabel htmlFor="maxTeams">Max teams</FieldLabel>
            <TextInput
              id="maxTeams"
              type="number"
              value={form.maxTeams}
              onChange={(v) => updateField("maxTeams", v)}
              placeholder="No limit"
            />
          </div>
          <div>
            <FieldLabel htmlFor="pointsWin">Points for win</FieldLabel>
            <TextInput
              id="pointsWin"
              type="number"
              value={form.pointsWin}
              onChange={(v) => updateField("pointsWin", v)}
            />
          </div>
          <div>
            <FieldLabel htmlFor="pointsTie">Points for tie</FieldLabel>
            <TextInput
              id="pointsTie"
              type="number"
              value={form.pointsTie}
              onChange={(v) => updateField("pointsTie", v)}
            />
          </div>
          <div>
            <FieldLabel htmlFor="pointsNoResult">Points for no result</FieldLabel>
            <TextInput
              id="pointsNoResult"
              type="number"
              value={form.pointsNoResult}
              onChange={(v) => updateField("pointsNoResult", v)}
            />
          </div>
          <div className="sm:col-span-3">
            <Checkbox
              id="netRunRateEnabled"
              checked={form.netRunRateEnabled}
              onChange={(v) => updateField("netRunRateEnabled", v)}
              label="Enable Net Run Rate (NRR)"
              description="NRR will be used as a tiebreaker in standings."
            />
          </div>
        </div>
      </section>

      {/* ── Registration & Visibility ── */}
      <section>
        <SectionHeader title="Registration & Visibility" />
        <div className="space-y-5">
          <div>
            <FieldLabel htmlFor="visibility" required>Visibility</FieldLabel>
            <Select
              id="visibility"
              value={form.visibility}
              onChange={(v) => updateField("visibility", v)}
              options={LEAGUE_VISIBILITIES.map((v) => ({
                value: v,
                label: VISIBILITY_LABELS[v] ?? v,
              }))}
            />
          </div>
          <div className="space-y-4 pt-2">
            <Checkbox
              id="allowTeamRegistration"
              checked={form.allowTeamRegistration}
              onChange={(v) => updateField("allowTeamRegistration", v)}
              label="Allow team registration"
              description="Teams can request to join this league."
            />
            <Checkbox
              id="allowPlayerRegistration"
              checked={form.allowPlayerRegistration}
              onChange={(v) => updateField("allowPlayerRegistration", v)}
              label="Allow player registration"
              description="Individual players can register for this league."
            />
            <Checkbox
              id="requireAdminApproval"
              checked={form.requireAdminApproval}
              onChange={(v) => updateField("requireAdminApproval", v)}
              label="Require admin approval"
              description="New team or player registrations must be approved by an admin."
            />
            <Checkbox
              id="allowPublicScorecards"
              checked={form.allowPublicScorecards}
              onChange={(v) => updateField("allowPublicScorecards", v)}
              label="Allow public scorecards"
              description="Anyone can view match scorecards without signing in."
            />
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section>
        <SectionHeader title="Contact" />
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="contactEmail">Contact email</FieldLabel>
            <TextInput
              id="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={(v) => updateField("contactEmail", v)}
              placeholder="league@example.com"
            />
          </div>
          <div>
            <FieldLabel htmlFor="websiteUrl">Website URL</FieldLabel>
            <TextInput
              id="websiteUrl"
              value={form.websiteUrl}
              onChange={(v) => updateField("websiteUrl", v)}
              placeholder="https://example.com"
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="rulesSummary">Rules summary</FieldLabel>
            <Textarea
              id="rulesSummary"
              value={form.rulesSummary}
              onChange={(v) => updateField("rulesSummary", v)}
              placeholder="Key playing conditions, eligibility rules, code of conduct…"
              rows={4}
            />
          </div>
        </div>
      </section>

      {/* ── Error & Submit ── */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <Link
          href="/cricket/leagues"
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← Back to leagues
        </Link>
        <button
          type="submit"
          disabled={isPending || !form.name || !form.seasonName}
          className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Creating league…" : "Create League"}
        </button>
      </div>
    </form>
  );
}
