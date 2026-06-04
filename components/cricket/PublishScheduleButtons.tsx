"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, EyeOff } from "lucide-react";
import { publishLeagueSchedule, unpublishLeagueSchedule } from "@/app/actions/cricket-scheduling";

interface PublishScheduleButtonsProps {
  leagueId: string;
}

export function PublishScheduleButtons({ leagueId }: PublishScheduleButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handlePublish() {
    setLoading(true);
    setMessage(null);
    const result = await publishLeagueSchedule(leagueId);
    setLoading(false);
    if (result.success) {
      setMessage(`Published ${result.data.published} matches.`);
      router.refresh();
    } else {
      setMessage(result.error);
    }
  }

  async function handleUnpublish() {
    setLoading(true);
    setMessage(null);
    const result = await unpublishLeagueSchedule(leagueId);
    setLoading(false);
    if (result.success) {
      setMessage(`Reverted ${result.data.unpublished} matches to draft.`);
      router.refresh();
    } else {
      setMessage(result.error);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handlePublish}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
      >
        <Globe className="h-4 w-4" />
        Publish All Drafts
      </button>
      <button
        onClick={handleUnpublish}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition-colors"
      >
        <EyeOff className="h-4 w-4" />
        Unpublish All
      </button>
      {message && (
        <p className="text-xs text-slate-400">{message}</p>
      )}
    </div>
  );
}
