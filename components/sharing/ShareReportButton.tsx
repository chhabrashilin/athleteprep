"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { ShareReportModal } from "@/components/sharing/ShareReportModal";
import type { ShareLink } from "@/types/sharing";
import type { Player } from "@/types/database";

interface ShareReportButtonProps {
  teamId: string;
  gameId: string;
  gameReportId: string;
  reportTitle: string;
  players: Player[];
  initialShareLinks: ShareLink[];
  baseUrl: string;
}

export function ShareReportButton({
  teamId,
  gameId,
  gameReportId,
  reportTitle,
  players,
  initialShareLinks,
  baseUrl,
}: ShareReportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:border-sky-500/40 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
        {initialShareLinks.filter((l) => !l.revokedAt && (!l.expiresAt || new Date(l.expiresAt) > new Date())).length > 0 && (
          <span className="ml-0.5 rounded-full bg-sky-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center">
            {initialShareLinks.filter((l) => !l.revokedAt && (!l.expiresAt || new Date(l.expiresAt) > new Date())).length}
          </span>
        )}
      </button>

      <ShareReportModal
        open={open}
        onClose={() => setOpen(false)}
        teamId={teamId}
        gameId={gameId}
        gameReportId={gameReportId}
        reportTitle={reportTitle}
        players={players}
        initialShareLinks={initialShareLinks}
        baseUrl={baseUrl}
      />
    </>
  );
}
