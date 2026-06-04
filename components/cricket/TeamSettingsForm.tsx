"use client";

import { useState, useTransition } from "react";
import { updateCricketTeam } from "@/app/actions/cricket-teams";
import { TEAM_TYPES } from "@/lib/cricket/validation/team";
import type { CricketTeamFull } from "@/lib/cricket/types";

interface TeamSettingsFormProps {
  team: CricketTeamFull;
}

export function TeamSettingsForm({ team }: TeamSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [name, setName] = useState(team.name);
  const [shortName, setShortName] = useState(team.shortName ?? "");
  const [description, setDescription] = useState(team.description ?? "");
  const [teamType, setTeamType] = useState(team.teamType ?? "club");
  const [logoUrl, setLogoUrl] = useState(team.logoUrl ?? "");
  const [primaryColor, setPrimaryColor] = useState(team.primaryColor ?? "");
  const [secondaryColor, setSecondaryColor] = useState(team.secondaryColor ?? "");
  const [homeGround, setHomeGround] = useState(team.homeGround ?? "");
  const [managerName, setManagerName] = useState(team.managerName ?? "");
  const [managerEmail, setManagerEmail] = useState(team.managerEmail ?? "");
  const [contactEmail, setContactEmail] = useState(team.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(team.contactPhone ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(team.websiteUrl ?? "");
  const [instagramUrl, setInstagramUrl] = useState(team.instagramUrl ?? "");
  const [foundedYear, setFoundedYear] = useState(team.foundedYear ? String(team.foundedYear) : "");
  const [coachName, setCoachName] = useState(team.coachName ?? "");
  const [scorerName, setScorerName] = useState(team.scorerName ?? "");
  const [isActive, setIsActive] = useState(team.isActive);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const result = await updateCricketTeam(team.id, {
        name: name.trim(),
        shortName: shortName.trim(),
        description: description.trim() || undefined,
        teamType: teamType as "club",
        logoUrl: logoUrl.trim() || undefined,
        primaryColor: primaryColor.trim() || undefined,
        secondaryColor: secondaryColor.trim() || undefined,
        homeGround: homeGround.trim() || undefined,
        managerName: managerName.trim() || undefined,
        managerEmail: managerEmail.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        foundedYear: foundedYear ? parseInt(foundedYear, 10) : undefined,
        coachName: coachName.trim() || undefined,
        scorerName: scorerName.trim() || undefined,
        isActive,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccessMsg("Team settings saved.");
    });
  }

  const TEAM_TYPE_OPTIONS = TEAM_TYPES.map((t) => ({
    value: t,
    label: t.charAt(0).toUpperCase() + t.slice(1).replace("_", " "),
  }));

  const inputCls = "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50";
  const labelCls = "block text-xs font-medium text-slate-400 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Team basics */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Team basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="ts-name" className={labelCls}>Team name</label>
            <input id="ts-name" type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ts-short-name" className={labelCls}>Short name</label>
            <input id="ts-short-name" type="text" value={shortName} onChange={(e) => setShortName(e.target.value)} disabled={isPending} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ts-team-type" className={labelCls}>Team type</label>
            <select id="ts-team-type" value={teamType} onChange={(e) => setTeamType(e.target.value)} disabled={isPending} className={inputCls}>
              {TEAM_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ts-description" className={labelCls}>Description</label>
            <textarea id="ts-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={isPending} className={inputCls + " resize-none"} />
          </div>
        </div>
      </section>

      {/* Branding */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Branding</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="ts-logo" className={labelCls}>Logo URL</label>
            <input id="ts-logo" type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" disabled={isPending} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ts-primary-color" className={labelCls}>Primary color (hex)</label>
            <input id="ts-primary-color" type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#1a2b3c" disabled={isPending} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ts-secondary-color" className={labelCls}>Secondary color (hex)</label>
            <input id="ts-secondary-color" type="text" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} placeholder="#ffffff" disabled={isPending} className={inputCls} />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ts-manager-name" className={labelCls}>Manager name</label>
            <input id="ts-manager-name" type="text" value={managerName} onChange={(e) => setManagerName(e.target.value)} disabled={isPending} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ts-manager-email" className={labelCls}>Manager email</label>
            <input id="ts-manager-email" type="email" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} disabled={isPending} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ts-contact-email" className={labelCls}>Contact email</label>
            <input id="ts-contact-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} disabled={isPending} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ts-contact-phone" className={labelCls}>Contact phone</label>
            <input id="ts-contact-phone" type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} disabled={isPending} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ts-website" className={labelCls}>Website URL</label>
            <input id="ts-website" type="text" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} disabled={isPending} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ts-instagram" className={labelCls}>Instagram URL</label>
            <input id="ts-instagram" type="text" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} disabled={isPending} className={inputCls} />
          </div>
        </div>
      </section>

      {/* Cricket details */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Cricket details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="ts-home-ground" className={labelCls}>Home ground</label>
            <input id="ts-home-ground" type="text" value={homeGround} onChange={(e) => setHomeGround(e.target.value)} disabled={isPending} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ts-founded" className={labelCls}>Founded year</label>
            <input id="ts-founded" type="number" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} disabled={isPending} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ts-coach" className={labelCls}>Coach name</label>
            <input id="ts-coach" type="text" value={coachName} onChange={(e) => setCoachName(e.target.value)} disabled={isPending} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ts-scorer" className={labelCls}>Scorer name</label>
            <input id="ts-scorer" type="text" value={scorerName} onChange={(e) => setScorerName(e.target.value)} disabled={isPending} className={inputCls} />
          </div>
        </div>
      </section>

      {/* Active status */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Status</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={isPending}
            className="rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500"
          />
          <div>
            <p className="text-sm text-slate-200">Active</p>
            <p className="text-xs text-slate-500">Inactive teams are hidden from league views.</p>
          </div>
        </label>
      </section>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <p className="text-sm text-emerald-400">{successMsg}</p>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending || !name.trim() || !shortName.trim()}
          className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving…" : "Save Settings"}
        </button>
        <p className="text-xs text-slate-500">Changes are saved immediately.</p>
      </div>
    </form>
  );
}
