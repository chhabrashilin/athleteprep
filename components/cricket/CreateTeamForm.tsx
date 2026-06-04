"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCricketTeam } from "@/app/actions/cricket-teams";
import { TEAM_TYPES, generateTeamSlug, normalizeTeamSlug } from "@/lib/cricket/validation/team";

interface CreateTeamFormProps {
  leagueId: string;
  leagueSlug?: string;
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
  );
}

function FieldLabel({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-slate-400 mb-1">
      {children}{required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
  );
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
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50 resize-none"
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
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function CreateTeamForm({ leagueId, leagueSlug: _leagueSlug }: CreateTeamFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);

  // Basics
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [teamType, setTeamType] = useState<string>("club");

  // Branding
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");

  // Contact
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  // Cricket details
  const [homeGround, setHomeGround] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [coachName, setCoachName] = useState("");
  const [scorerName, setScorerName] = useState("");

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) {
      setSlug(generateTeamSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true);
    setSlug(normalizeTeamSlug(value));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createCricketTeam({
        leagueId,
        name: name.trim(),
        shortName: shortName.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        teamType: teamType as "club",
        logoUrl: logoUrl.trim() || undefined,
        primaryColor: primaryColor.trim() || undefined,
        secondaryColor: secondaryColor.trim() || undefined,
        managerName: managerName.trim() || undefined,
        managerEmail: managerEmail.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        homeGround: homeGround.trim() || undefined,
        foundedYear: foundedYear ? parseInt(foundedYear, 10) : undefined,
        coachName: coachName.trim() || undefined,
        scorerName: scorerName.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(`/cricket/teams/${result.data.slug}/roster`);
    });
  }

  const TEAM_TYPE_OPTIONS = TEAM_TYPES.map((t) => ({
    value: t,
    label: t.charAt(0).toUpperCase() + t.slice(1).replace("_", " "),
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Team Basics */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <SectionHeader title="Team basics" description="Core identity for this team." />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="team-name" required>Team name</FieldLabel>
            <TextInput id="team-name" value={name} onChange={handleNameChange} placeholder="e.g. Madison Strikers" disabled={isPending} />
          </div>
          <div>
            <FieldLabel htmlFor="team-short-name" required>Short name</FieldLabel>
            <TextInput id="team-short-name" value={shortName} onChange={setShortName} placeholder="e.g. MDS (max 20 chars)" disabled={isPending} />
          </div>
          <div>
            <FieldLabel htmlFor="team-type">Team type</FieldLabel>
            <Select id="team-type" value={teamType} onChange={setTeamType} options={TEAM_TYPE_OPTIONS} disabled={isPending} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="team-slug">Slug (URL identifier)</FieldLabel>
            <TextInput id="team-slug" value={slug} onChange={handleSlugChange} placeholder="e.g. madison-strikers" disabled={isPending} />
            {slug && (
              <p className="text-xs text-slate-500 mt-1">URL: /cricket/teams/{slug}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="team-description">Description</FieldLabel>
            <Textarea id="team-description" value={description} onChange={setDescription} placeholder="Brief description of the team…" disabled={isPending} />
          </div>
        </div>
      </section>

      {/* Branding */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <SectionHeader title="Branding" description="Optional logo and team colors." />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="logo-url">Logo URL</FieldLabel>
            <TextInput id="logo-url" value={logoUrl} onChange={setLogoUrl} placeholder="https://example.com/logo.png" disabled={isPending} />
          </div>
          <div>
            <FieldLabel htmlFor="primary-color">Primary color (hex)</FieldLabel>
            <TextInput id="primary-color" value={primaryColor} onChange={setPrimaryColor} placeholder="#1a2b3c" disabled={isPending} />
          </div>
          <div>
            <FieldLabel htmlFor="secondary-color">Secondary color (hex)</FieldLabel>
            <TextInput id="secondary-color" value={secondaryColor} onChange={setSecondaryColor} placeholder="#ffffff" disabled={isPending} />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <SectionHeader title="Contact" description="Manager and contact details." />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="manager-name">Manager name</FieldLabel>
            <TextInput id="manager-name" value={managerName} onChange={setManagerName} placeholder="Full name" disabled={isPending} />
          </div>
          <div>
            <FieldLabel htmlFor="manager-email">Manager email</FieldLabel>
            <TextInput id="manager-email" value={managerEmail} onChange={setManagerEmail} type="email" placeholder="manager@example.com" disabled={isPending} />
          </div>
          <div>
            <FieldLabel htmlFor="contact-email">Contact email</FieldLabel>
            <TextInput id="contact-email" value={contactEmail} onChange={setContactEmail} type="email" placeholder="team@example.com" disabled={isPending} />
          </div>
          <div>
            <FieldLabel htmlFor="contact-phone">Contact phone</FieldLabel>
            <TextInput id="contact-phone" value={contactPhone} onChange={setContactPhone} placeholder="+1 (555) 000-0000" disabled={isPending} />
          </div>
          <div>
            <FieldLabel htmlFor="website-url">Website URL</FieldLabel>
            <TextInput id="website-url" value={websiteUrl} onChange={setWebsiteUrl} placeholder="https://example.com" disabled={isPending} />
          </div>
          <div>
            <FieldLabel htmlFor="instagram-url">Instagram URL</FieldLabel>
            <TextInput id="instagram-url" value={instagramUrl} onChange={setInstagramUrl} placeholder="https://instagram.com/team" disabled={isPending} />
          </div>
        </div>
      </section>

      {/* Cricket details */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <SectionHeader title="Cricket details" description="Home ground, coaches, and history." />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="home-ground">Home ground</FieldLabel>
            <TextInput id="home-ground" value={homeGround} onChange={setHomeGround} placeholder="e.g. Madison Cricket Ground" disabled={isPending} />
          </div>
          <div>
            <FieldLabel htmlFor="founded-year">Founded year</FieldLabel>
            <TextInput id="founded-year" value={foundedYear} onChange={setFoundedYear} type="number" placeholder={String(new Date().getFullYear())} disabled={isPending} />
          </div>
          <div>
            <FieldLabel htmlFor="coach-name">Coach name</FieldLabel>
            <TextInput id="coach-name" value={coachName} onChange={setCoachName} placeholder="Full name" disabled={isPending} />
          </div>
          <div>
            <FieldLabel htmlFor="scorer-name">Scorer name</FieldLabel>
            <TextInput id="scorer-name" value={scorerName} onChange={setScorerName} placeholder="Full name" disabled={isPending} />
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="submit"
          disabled={isPending || !name.trim() || !shortName.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Creating team…" : "Create Team"}
        </button>
        <p className="text-xs text-slate-500">
          You will be redirected to manage the roster after creation.
        </p>
      </div>
    </form>
  );
}
