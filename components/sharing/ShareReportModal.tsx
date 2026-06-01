"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { CreateShareLinkForm } from "@/components/sharing/CreateShareLinkForm";
import { ShareLinkList } from "@/components/sharing/ShareLinkList";
import type { ShareLink } from "@/types/sharing";
import type { Player } from "@/types/database";

interface ShareReportModalProps {
  open: boolean;
  onClose: () => void;
  teamId: string;
  gameId: string;
  gameReportId: string;
  reportTitle: string;
  players: Player[];
  initialShareLinks: ShareLink[];
  baseUrl: string;
}

export function ShareReportModal({
  open,
  onClose,
  teamId,
  gameId,
  gameReportId,
  reportTitle,
  players,
  initialShareLinks,
  baseUrl,
}: ShareReportModalProps) {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>(initialShareLinks);
  const [activeTab, setActiveTab] = useState<"create" | "existing">("create");

  function handleCreated(link: ShareLink) {
    setShareLinks((prev) => [link, ...prev]);
    setActiveTab("existing");
  }

  return (
    <Dialog open={open} onClose={onClose} title="Share report" className="max-w-xl">
      <div className="space-y-5">
        <div>
          <p className="text-sm text-slate-400 mb-1">Sharing report:</p>
          <p className="text-sm font-semibold text-slate-100">{reportTitle}</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "create"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            Create link
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("existing")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "existing"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            Existing links
            {shareLinks.length > 0 && (
              <span className="ml-1.5 rounded-full bg-slate-700 px-1.5 text-xs text-slate-300">
                {shareLinks.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "create" ? (
          <CreateShareLinkForm
            teamId={teamId}
            gameId={gameId}
            gameReportId={gameReportId}
            players={players}
            baseUrl={baseUrl}
            onCreated={handleCreated}
          />
        ) : (
          <ShareLinkList
            links={shareLinks}
            teamId={teamId}
            gameId={gameId}
            baseUrl={baseUrl}
          />
        )}
      </div>
    </Dialog>
  );
}
