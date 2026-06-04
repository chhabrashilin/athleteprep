"use client";

import { useState, useTransition } from "react";
import { inviteCricketTeamMember, revokeTeamInvitation } from "@/app/actions/cricket-teams";
import { TEAM_INVITE_ROLES } from "@/lib/cricket/validation/team";
import type { CricketTeamInvitation } from "@/lib/cricket/types";

interface TeamInvitePanelProps {
  teamId: string;
  invitations: CricketTeamInvitation[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:  { label: "Pending",  color: "text-amber-400" },
  accepted: { label: "Accepted", color: "text-emerald-400" },
  expired:  { label: "Expired",  color: "text-slate-500" },
  revoked:  { label: "Revoked",  color: "text-rose-400" },
};

export function TeamInvitePanel({ teamId, invitations: initialInvitations }: TeamInvitePanelProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [invitations, setInvitations] = useState(initialInvitations);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("member");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const result = await inviteCricketTeamMember(teamId, { email: email.trim(), role });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccessMsg(`Invitation created for ${result.data.email}.`);
      setEmail("");
      setRole("member");
      // Optimistically add invitation to list
      setInvitations((prev) => [
        {
          id: result.data.id,
          cricketTeamId: teamId,
          email: result.data.email,
          role: result.data.role,
          status: "pending",
          invitedBy: null,
          token: null,
          invitedAt: new Date().toISOString(),
          acceptedAt: null,
          expiresAt: null,
        },
        ...prev,
      ]);
    });
  }

  function handleRevoke(invitationId: string) {
    startTransition(async () => {
      const result = await revokeTeamInvitation(teamId, invitationId);
      if (result.success) {
        setInvitations((prev) =>
          prev.map((inv) =>
            inv.id === invitationId ? { ...inv, status: "revoked" } : inv
          )
        );
      }
    });
  }

  const INVITE_ROLE_OPTIONS = TEAM_INVITE_ROLES.map((r) => ({
    value: r,
    label: r.charAt(0).toUpperCase() + r.slice(1).replace("_", " "),
  }));

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Send invitation</h3>
        <form onSubmit={handleSubmit} className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="invite-email" className="block text-xs text-slate-400 mb-1">Email address</label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="invitee@example.com"
              disabled={isPending}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="invite-role" className="block text-xs text-slate-400 mb-1">Role</label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isPending}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
            >
              {INVITE_ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={isPending || !email.trim()}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Sending…" : "Invite"}
          </button>
        </form>

        {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
        {successMsg && <p className="text-xs text-emerald-400 mt-2">{successMsg}</p>}
        <p className="text-xs text-slate-600 mt-2">
          Invitation saved. Email delivery will be added in a later phase.
        </p>
      </div>

      {/* Invitation list */}
      {invitations.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3">Invitations ({invitations.length})</h3>
          <div className="space-y-2">
            {invitations.map((inv) => {
              const statusCfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.pending;
              return (
                <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{inv.email}</p>
                    <p className="text-xs text-slate-500 capitalize">{inv.role}</p>
                  </div>
                  <span className={`text-xs font-medium ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                  {inv.status === "pending" && (
                    <button
                      onClick={() => handleRevoke(inv.id)}
                      disabled={isPending}
                      className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
