import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, User } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketPlayerBySlug, getCricketPlayerById, getCricketTeamsForPlayer } from "@/lib/cricket/players/queries";
import type { CricketPlayerFull } from "@/lib/cricket/types";

interface Props {
  params: Promise<{ playerSlugOrId: string }>;
}

const BATTING_DISPLAY: Record<string, string> = {
  right_hand_bat: "Right-hand bat",
  left_hand_bat: "Left-hand bat",
  unknown: "Unknown",
};

const BOWLING_DISPLAY: Record<string, string> = {
  right_arm_fast: "Right-arm fast",
  right_arm_medium: "Right-arm medium",
  right_arm_spin: "Right-arm spin",
  left_arm_fast: "Left-arm fast",
  left_arm_medium: "Left-arm medium",
  left_arm_spin: "Left-arm spin",
  wicketkeeper: "Wicketkeeper",
  none: "None",
  unknown: "Unknown",
};

const ROLE_DISPLAY: Record<string, string> = {
  batter: "Batter",
  bowler: "Bowler",
  all_rounder: "All-rounder",
  wicketkeeper: "Wicketkeeper",
  captain: "Captain",
  coach: "Coach",
  unknown: "Unknown",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playerSlugOrId } = await params;
  let player: CricketPlayerFull | null = null;

  // Try slug first, fall back to UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerSlugOrId);
  if (isUUID) {
    player = await getCricketPlayerById(playerSlugOrId);
  } else {
    player = await getCricketPlayerBySlug(playerSlugOrId);
  }

  if (!player) return { title: "Player not found — GameIQ" };
  return { title: `${player.displayName} — GameIQ` };
}

export default async function CricketPlayerPage({ params }: Props) {
  const { playerSlugOrId } = await params;

  let player: CricketPlayerFull | null = null;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerSlugOrId);

  if (isUUID) {
    player = await getCricketPlayerById(playerSlugOrId);
  } else {
    player = await getCricketPlayerBySlug(playerSlugOrId);
  }

  if (!player) notFound();

  const user = await getServerUser();
  const canEdit = user ? (user.id === player.createdBy || user.id === player.userId) : false;

  const teams = await getCricketTeamsForPlayer(player.id);

  const initials = player.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const role = player.primaryRole
    ? (ROLE_DISPLAY[player.primaryRole] ?? player.primaryRole)
    : player.role ?? null;

  const battingLabel = player.battingStyle ? (BATTING_DISPLAY[player.battingStyle] ?? player.battingStyle) : null;
  const bowlingLabel = player.bowlingStyle ? (BOWLING_DISPLAY[player.bowlingStyle] ?? player.bowlingStyle) : null;

  return (
    <AppShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5">
        <Link href="/cricket" className="hover:text-slate-400 transition-colors">Cricket Hub</Link>
        <span>/</span>
        <span className="text-slate-400">{player.displayName}</span>
      </div>

      {/* Hero */}
      <div className="mb-6 flex items-start gap-5 flex-wrap">
        <div className="h-16 w-16 shrink-0 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-200">
          {player.profilePhotoUrl ? (
            <img src={player.profilePhotoUrl} alt={player.displayName} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100 mb-0.5">{player.displayName}</h1>
              {role && <p className="text-sm text-slate-400">{role}</p>}
              {player.userId && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-400/10 border border-emerald-500/30 px-2 py-0.5 text-xs text-emerald-400">
                  <User className="h-3 w-3" />
                  Verified account
                </span>
              )}
            </div>
            {canEdit && (
              <Link
                href={`/cricket/players/${playerSlugOrId}/edit`}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:border-sky-500/40 hover:bg-slate-700 transition-all"
              >
                Edit Profile
              </Link>
            )}
          </div>
          {player.bio && (
            <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-2xl">{player.bio}</p>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {battingLabel && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Batting style</p>
            <p className="text-sm font-semibold text-slate-200">{battingLabel}</p>
          </div>
        )}
        {bowlingLabel && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Bowling style</p>
            <p className="text-sm font-semibold text-slate-200">{bowlingLabel}</p>
          </div>
        )}
        {(player.city || player.country) && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Location</p>
            <p className="text-sm font-semibold text-slate-200 inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              {[player.city, player.country].filter(Boolean).join(", ")}
            </p>
          </div>
        )}
        {player.dominantHand && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Dominant hand</p>
            <p className="text-sm font-semibold text-slate-200 capitalize">{player.dominantHand.replace("_", " ")}</p>
          </div>
        )}
      </div>

      {/* Teams */}
      {teams.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Teams</h2>
          <div className="space-y-2">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/cricket/teams/${team.slug}`}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 hover:border-sky-500/40 hover:bg-slate-800/60 transition-all"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: team.primaryColor ?? "#334155" }}
                >
                  {team.shortName?.slice(0, 3).toUpperCase() ?? team.name.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-sm font-medium text-slate-200">{team.name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Coming soon stats */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Player statistics</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {["Career stats", "Batting stats", "Bowling stats", "Fielding stats"].map((label) => (
            <div key={label} className="rounded-xl border border-slate-800/40 bg-slate-900/40 px-4 py-4 opacity-60">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-sm text-slate-600">Coming soon</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-xs text-slate-600">
        <Link href="/cricket" className="hover:text-slate-400 transition-colors">
          ← Cricket Hub
        </Link>
      </div>
    </AppShell>
  );
}
