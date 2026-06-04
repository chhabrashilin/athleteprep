import { Crown, Shield, Users, User } from "lucide-react";
import type { CricketLeagueMember } from "@/lib/cricket/types";

interface LeagueMemberListProps {
  members: CricketLeagueMember[];
}

const ROLE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  owner: {
    label: "Owner",
    icon: <Crown className="h-3 w-3" />,
    color: "text-amber-400 bg-amber-400/10 border-amber-500/30",
  },
  admin: {
    label: "Admin",
    icon: <Shield className="h-3 w-3" />,
    color: "text-sky-400 bg-sky-400/10 border-sky-500/30",
  },
  manager: {
    label: "Manager",
    icon: <Users className="h-3 w-3" />,
    color: "text-violet-400 bg-violet-400/10 border-violet-500/30",
  },
  scorer: {
    label: "Scorer",
    icon: <User className="h-3 w-3" />,
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/30",
  },
  player: {
    label: "Player",
    icon: <User className="h-3 w-3" />,
    color: "text-slate-300 bg-slate-700/50 border-slate-600",
  },
  fan: {
    label: "Fan",
    icon: <User className="h-3 w-3" />,
    color: "text-slate-400 bg-slate-800 border-slate-700",
  },
  member: {
    label: "Member",
    icon: <User className="h-3 w-3" />,
    color: "text-slate-400 bg-slate-800 border-slate-700",
  },
};

export function LeagueMemberList({ members }: LeagueMemberListProps) {
  if (members.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4 text-center">
        No members yet. Add admins and managers above.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {members.map((member) => {
        const config = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.member;
        return (
          <li
            key={member.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {member.userId}
                </p>
                <p className="text-xs text-slate-500">
                  Joined {new Date(member.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 ${config.color}`}
            >
              {config.icon}
              {config.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
