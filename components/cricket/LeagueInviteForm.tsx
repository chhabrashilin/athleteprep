"use client";

import { useState, useTransition } from "react";
import { inviteCricketLeagueMember } from "@/app/actions/cricket-leagues";
import { INVITE_ROLES } from "@/lib/cricket/validation/league";

interface LeagueInviteFormProps {
  leagueId: string;
  onSuccess?: (email: string, role: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin — full management access",
  manager: "Manager — manage teams and schedule",
  scorer: "Scorer — record match scores",
  player: "Player — registered player",
  fan: "Fan — view-only access",
  member: "Member — general membership",
};

export function LeagueInviteForm({ leagueId, onSuccess }: LeagueInviteFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("manager");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const result = await inviteCricketLeagueMember(leagueId, { email, role });
      if (result.success) {
        setSuccessMsg(`Invitation created for ${result.data.email} as ${result.data.role}.`);
        setEmail("");
        onSuccess?.(result.data.email, result.data.role);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="invite-email" className="block text-sm font-medium text-slate-300 mb-1.5">
          Email address
        </label>
        <input
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="person@example.com"
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </div>

      <div>
        <label htmlFor="invite-role" className="block text-sm font-medium text-slate-300 mb-1.5">
          Role
        </label>
        <select
          id="invite-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        >
          {INVITE_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r] ?? r}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-rose-400 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2">
          {error}
        </p>
      )}
      {successMsg && (
        <p className="text-sm text-emerald-400 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
          {successMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || !email}
        className="w-full rounded-lg border border-sky-600 bg-sky-600/20 px-4 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? "Sending invitation…" : "Send Invitation"}
      </button>

      <p className="text-xs text-slate-500">
        Invitations are stored and will be emailed in a future update.
        The invited person can be added manually in the meantime.
      </p>
    </form>
  );
}
