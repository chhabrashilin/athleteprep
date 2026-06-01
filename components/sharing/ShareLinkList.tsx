import { Eye, Clock } from "lucide-react";
import { ShareVisibilityBadge } from "@/components/sharing/ShareVisibilityBadge";
import { CopyShareLinkButton } from "@/components/sharing/CopyShareLinkButton";
import { RevokeShareLinkButton } from "@/components/sharing/RevokeShareLinkButton";
import { getShareLinkStatus } from "@/types/sharing";
import type { ShareLink } from "@/types/sharing";

interface ShareLinkListProps {
  links: ShareLink[];
  teamId: string;
  gameId: string;
  baseUrl: string;
}

function statusLabel(status: ReturnType<typeof getShareLinkStatus>) {
  switch (status) {
    case "active": return { text: "Active", classes: "text-emerald-400" };
    case "expired": return { text: "Expired", classes: "text-slate-500" };
    case "revoked": return { text: "Revoked", classes: "text-red-400" };
  }
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ShareLinkList({ links, teamId, gameId, baseUrl }: ShareLinkListProps) {
  if (links.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-8 text-center">
        <p className="text-sm text-slate-500">No share links yet.</p>
        <p className="text-xs text-slate-600 mt-1">Create one above to share this report.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {links.map((link) => {
        const status = getShareLinkStatus(link);
        const sl = statusLabel(status);
        const shareUrl = `${baseUrl}/share/reports/${link.token}`;
        const isActive = status === "active";

        return (
          <div
            key={link.id}
            className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3"
          >
            {/* Link header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <ShareVisibilityBadge visibility={link.visibility} />
                <span className={`text-xs font-medium ${sl.classes}`}>{sl.text}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Eye className="h-3.5 w-3.5" />
                {link.viewCount} view{link.viewCount !== 1 ? "s" : ""}
              </div>
            </div>

            {/* URL preview */}
            <p className="text-xs text-slate-600 font-mono truncate">{shareUrl}</p>

            {/* Meta */}
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span>Created {formatDate(link.createdAt)}</span>
              {link.expiresAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Expires {formatDate(link.expiresAt)}
                </span>
              )}
              {link.lastViewedAt && (
                <span>Last viewed {formatDate(link.lastViewedAt)}</span>
              )}
            </div>

            {/* Actions */}
            {isActive && (
              <div className="flex gap-2 pt-1 border-t border-slate-800">
                <CopyShareLinkButton url={shareUrl} />
                <RevokeShareLinkButton
                  teamId={teamId}
                  gameId={gameId}
                  shareLinkId={link.id}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
