"use client";

/**
 * components/cricket/BroadcastControlRoom.tsx
 * Client-side broadcast control room interface.
 */

import { useState, useTransition } from "react";
import {
  Radio, Copy, ExternalLink, CheckCircle, Circle, AlertTriangle,
  Plus, RefreshCw, Eye, Trash2, Settings, Tv, Zap, ClipboardList,
  Activity, ChevronDown, ChevronUp,
} from "lucide-react";
import type {
  CricketMatchStream, CricketOverlayToken, CricketBroadcastChecklist,
  CricketStreamEvent, CricketStreamHealthCheck, CricketOverlayTheme,
  StreamStatus, StreamProvider, StreamVisibility,
} from "@/lib/cricket/types";
import {
  createOrUpdateMatchStream,
  updateMatchStreamStatus,
  initializeBroadcastChecklist,
  updateBroadcastChecklistItem,
  recordStreamHealthCheck,
} from "@/lib/cricket/streaming/actions";
import { createOverlayToken, revokeOverlayToken } from "@/lib/cricket/overlays/actions";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  matchId: string;
  matchSlug: string;
  matchTitle: string;
  leagueId: string | null;
  stream: CricketMatchStream | null;
  tokens: CricketOverlayToken[];
  checklist: CricketBroadcastChecklist[];
  events: CricketStreamEvent[];
  latestHealth: CricketStreamHealthCheck | null;
  themes: CricketOverlayTheme[];
}

// ─── Overlay types ────────────────────────────────────────────────────────────

const OVERLAY_TYPES = [
  { type: "scorebug",        label: "Scorebug",         width: 1920, height: 100  },
  { type: "full-scorecard",  label: "Full Scorecard",   width: 1920, height: 1080 },
  { type: "lower-third",     label: "Lower Third",      width: 1920, height: 200  },
  { type: "toss",            label: "Toss Card",        width: 1920, height: 400  },
  { type: "innings-break",   label: "Innings Break",    width: 1920, height: 600  },
  { type: "result",          label: "Result Card",      width: 1920, height: 600  },
  { type: "minimal",         label: "Minimal / Mobile", width: 480,  height: 200  },
] as const;

// ─── Status badge ─────────────────────────────────────────────────────────────

function StreamStatusBadge({ status }: { status: StreamStatus | string }) {
  const map: Record<string, string> = {
    not_configured: "bg-slate-700 text-slate-300",
    scheduled:      "bg-blue-500/20 border border-blue-500/30 text-blue-300",
    ready:          "bg-yellow-500/20 border border-yellow-500/30 text-yellow-300",
    live:           "bg-red-500/20 border border-red-500/30 text-red-300",
    paused:         "bg-orange-500/20 border border-orange-500/30 text-orange-300",
    ended:          "bg-slate-600/40 text-slate-400",
    failed:         "bg-red-800/40 text-red-400",
    archived:       "bg-slate-700/40 text-slate-500",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] ?? "bg-slate-700 text-slate-300"}`}>
      {status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
      {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

function HealthBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    healthy:  "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    warning:  "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    critical: "bg-red-500/20 text-red-300 border border-red-500/30",
    offline:  "bg-slate-700 text-slate-400",
    unknown:  "bg-slate-700 text-slate-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] ?? "bg-slate-700 text-slate-400"}`}>
      {status}
    </span>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handle}
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
    >
      {copied ? <CheckCircle className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          {icon}
          {title}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

// ─── BroadcastControlRoom ─────────────────────────────────────────────────────

export function BroadcastControlRoom({
  matchId, matchSlug, matchTitle, leagueId,
  stream: initialStream,
  tokens: initialTokens,
  checklist: initialChecklist,
  events: initialEvents,
  latestHealth,
  themes,
}: Props) {
  const [stream, setStream] = useState(initialStream);
  const [tokens, setTokens] = useState(initialTokens);
  const [checklist, setChecklist] = useState(initialChecklist);
  const [events, setEvents] = useState(initialEvents);
  const [isPending, startTransition] = useTransition();
  const [newTokenRaw, setNewTokenRaw] = useState<string | null>(null);
  const [newTokenUrls, setNewTokenUrls] = useState<Record<string, string> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Stream config form state.
  const [streamTitle, setStreamTitle] = useState(stream?.title ?? `${matchTitle} — Live`);
  const [provider, setProvider] = useState(stream?.provider ?? "overlay_only");
  const [embedUrl, setEmbedUrl] = useState(stream?.embedUrl ?? "");
  const [publicWatchUrl, setPublicWatchUrl] = useState(stream?.publicWatchUrl ?? "");
  const [visibility, setVisibility] = useState(stream?.visibility ?? "league");
  const [allowPublicEmbed, setAllowPublicEmbed] = useState(stream?.allowPublicEmbed ?? false);

  // New token form.
  const [tokenLabel, setTokenLabel] = useState("");
  const [tokenScope, setTokenScope] = useState<"match_overlay" | "scorebug" | "full_overlay">("match_overlay");

  function flash(msg: string, isError = false) {
    if (isError) {
      setFormError(msg);
      setTimeout(() => setFormError(null), 4000);
    } else {
      setFormSuccess(msg);
      setTimeout(() => setFormSuccess(null), 3000);
    }
  }

  // ── Save stream config ──────────────────────────────────────────────────────
  function handleSaveStream() {
    startTransition(async () => {
      const result = await createOrUpdateMatchStream({
        match_id:           matchId,
        league_id:          leagueId,
        title:              streamTitle,
        provider:           provider as "overlay_only" | "external_embed" | "youtube" | "twitch" | "custom_rtmp",
        embed_url:          embedUrl || undefined,
        public_watch_url:   publicWatchUrl || undefined,
        visibility:         visibility as "private" | "league" | "unlisted" | "public",
        allow_public_embed: allowPublicEmbed,
      });
      if (result.success) {
        flash("Stream configuration saved.");
      } else {
        flash(result.error ?? "Failed to save", true);
      }
    });
  }

  // ── Update status ───────────────────────────────────────────────────────────
  function handleStatusChange(status: StreamStatus) {
    if (!stream) return;
    startTransition(async () => {
      const result = await updateMatchStreamStatus(stream.id, status);
      if (result.success) {
        setStream((s) => s ? { ...s, status } : s);
        flash(`Stream status updated to ${status}.`);
      } else {
        flash(result.error ?? "Failed to update status", true);
      }
    });
  }

  // ── Initialize checklist ────────────────────────────────────────────────────
  function handleInitChecklist() {
    startTransition(async () => {
      const result = await initializeBroadcastChecklist(matchId, stream?.id);
      if (result.success) {
        flash("Checklist initialized.");
        // Re-fetch would happen via router.refresh in a real app.
      } else {
        flash(result.error ?? "Failed", true);
      }
    });
  }

  // ── Toggle checklist item ───────────────────────────────────────────────────
  function handleChecklistToggle(key: string, current: boolean) {
    startTransition(async () => {
      const result = await updateBroadcastChecklistItem(matchId, key, !current);
      if (result.success) {
        setChecklist((c) =>
          c.map((item) =>
            item.checklistKey === key ? { ...item, completed: !current } : item
          )
        );
      } else {
        flash(result.error ?? "Failed", true);
      }
    });
  }

  // ── Create overlay token ────────────────────────────────────────────────────
  function handleCreateToken() {
    startTransition(async () => {
      const result = await createOverlayToken({
        match_id:  matchId,
        league_id: leagueId,
        label:     tokenLabel || undefined,
        scope:     tokenScope,
      });
      if (result.success && result.data) {
        setNewTokenRaw(result.data.rawToken);
        setNewTokenUrls(result.data.overlayUrls);
        setTokenLabel("");
        flash("Token created. Copy the URL now — it will not be shown again.");
        setTokens((t) => [{
          id: result.data!.id,
          matchId,
          leagueId,
          tokenPrefix: result.data!.rawToken.slice(0, 8),
          label: tokenLabel || null,
          scope: tokenScope,
          expiresAt: null,
          revokedAt: null,
          createdBy: null,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
        }, ...t]);
      } else {
        flash(result.error ?? "Failed to create token", true);
      }
    });
  }

  // ── Revoke token ────────────────────────────────────────────────────────────
  function handleRevokeToken(tokenId: string) {
    startTransition(async () => {
      const result = await revokeOverlayToken(tokenId);
      if (result.success) {
        setTokens((t) => t.map((tok) =>
          tok.id === tokenId ? { ...tok, revokedAt: new Date().toISOString() } : tok
        ));
        flash("Token revoked.");
      } else {
        flash(result.error ?? "Failed", true);
      }
    });
  }

  // ── Manual health check ─────────────────────────────────────────────────────
  function handleHealthCheck(status: "healthy" | "warning" | "critical" | "offline") {
    if (!stream) return;
    startTransition(async () => {
      await recordStreamHealthCheck({
        match_stream_id: stream.id,
        match_id:        matchId,
        status,
        message:         `Manual status set to ${status}`,
      });
      flash(`Health marked as ${status}.`);
    });
  }

  const completedCount = checklist.filter((c) => c.completed).length;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <div className="space-y-5">
      {/* Flash messages */}
      {formError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {formError}
        </div>
      )}
      {formSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {formSuccess}
        </div>
      )}

      {/* Production warnings */}
      {provider === "overlay_only" && (
        <div className="rounded-lg bg-sky-500/10 border border-sky-500/20 px-4 py-3 text-sm text-sky-300">
          <strong>Overlay-only mode is active.</strong> Use OBS/vMix with the overlay URLs below and your own video stream output. No external provider is required.
        </div>
      )}
      {!stream && (
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-sm text-yellow-300">
          <strong>No stream configured yet.</strong> Configure the stream below to enable overlay tokens and status tracking.
        </div>
      )}
      {(!tokens.length) && stream && (
        <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-4 py-3 text-sm text-orange-300">
          <strong>No overlay tokens.</strong> Create an overlay token to use browser-source overlays in OBS/vMix.
        </div>
      )}

      {/* 1. Stream Setup */}
      <Section title="Stream Setup" icon={<Tv className="h-4 w-4 text-sky-400" />}>
        <div className="space-y-4 pt-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Stream Title</label>
              <input
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Provider Mode</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as StreamProvider)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="overlay_only">Overlay Only (OBS/vMix) — Recommended</option>
                <option value="external_embed">External Embed (provide URL)</option>
                <option value="custom_rtmp">Custom RTMP (requires server config)</option>
                <option value="youtube" disabled>YouTube Live (not configured)</option>
                <option value="twitch" disabled>Twitch (not configured)</option>
              </select>
            </div>
          </div>

          {(provider === "external_embed" || provider === "custom_rtmp") && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Public Watch URL</label>
                <input
                  value={publicWatchUrl}
                  onChange={(e) => setPublicWatchUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Embed URL</label>
                <input
                  value={embedUrl}
                  onChange={(e) => setEmbedUrl(e.target.value)}
                  placeholder="https://www.youtube.com/embed/..."
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as StreamVisibility)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="private">Private (managers only)</option>
                <option value="league">League members only</option>
                <option value="unlisted">Unlisted (accessible by URL)</option>
                <option value="public">Public</option>
              </select>
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowPublicEmbed}
                  onChange={(e) => setAllowPublicEmbed(e.target.checked)}
                  className="rounded bg-slate-700 border-slate-600"
                />
                Allow public embed
              </label>
            </div>
          </div>

          <button
            onClick={handleSaveStream}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
          >
            {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
            Save Stream Config
          </button>
        </div>
      </Section>

      {/* 2. OBS/vMix Overlay Setup */}
      <Section title="OBS / vMix Overlay URLs" icon={<Radio className="h-4 w-4 text-purple-400" />}>
        <div className="space-y-4 pt-1">
          {/* Token creation */}
          <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Create Overlay Token</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                value={tokenLabel}
                onChange={(e) => setTokenLabel(e.target.value)}
                placeholder="Label (e.g. OBS Studio)"
                className="rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              />
              <select
                value={tokenScope}
                onChange={(e) => setTokenScope(e.target.value as typeof tokenScope)}
                className="rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="match_overlay">Full overlay access</option>
                <option value="scorebug">Scorebug only</option>
                <option value="full_overlay">Full overlay</option>
              </select>
              <button
                onClick={handleCreateToken}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Generate Token
              </button>
            </div>
          </div>

          {/* Show newly created token URLs (once only) */}
          {newTokenRaw && newTokenUrls && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 space-y-3">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                Token created — save these URLs now. They will not be shown again.
              </p>
              {OVERLAY_TYPES.map((ot) => (
                <div key={ot.type} className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs text-slate-400 w-36 shrink-0">{ot.label}</span>
                  <code className="flex-1 text-xs text-slate-300 bg-slate-800 rounded px-2 py-1 truncate font-mono">
                    {newTokenUrls[ot.type]}
                  </code>
                  <div className="flex gap-1 shrink-0">
                    <CopyButton text={newTokenUrls[ot.type]} />
                    <a
                      href={newTokenUrls[ot.type]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Preview
                    </a>
                  </div>
                </div>
              ))}
              <button
                onClick={() => { setNewTokenRaw(null); setNewTokenUrls(null); }}
                className="text-xs text-slate-500 hover:text-slate-400"
              >
                Dismiss (URLs are gone from this view)
              </button>
            </div>
          )}

          {/* Existing tokens */}
          {tokens.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Active tokens</p>
              {tokens.map((tok) => (
                <div
                  key={tok.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${tok.revokedAt ? "border-slate-700/50 bg-slate-800/30 opacity-50" : "border-slate-700 bg-slate-800/60"}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200">{tok.label ?? "Unnamed token"}</p>
                    <p className="text-xs text-slate-500 font-mono">{tok.tokenPrefix}… · {tok.scope}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {tok.revokedAt ? (
                      <span className="text-xs text-slate-500">Revoked</span>
                    ) : (
                      <button
                        onClick={() => handleRevokeToken(tok.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* OBS instructions */}
          <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">OBS / vMix Setup</p>
            <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
              <li>Generate an overlay token above.</li>
              <li>Copy the <strong>Scorebug</strong> URL.</li>
              <li>In OBS: Sources → Browser → Paste URL.</li>
              <li>Set Width: 1920, Height: 100. Enable transparent background.</li>
              <li>Score balls in the Live Scoring interface — scorebug updates automatically.</li>
            </ol>
          </div>
        </div>
      </Section>

      {/* 3. Stream Status Controls */}
      <Section title="Stream Status &amp; Controls" icon={<Zap className="h-4 w-4 text-yellow-400" />}>
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-slate-400">Current status:</span>
            <StreamStatusBadge status={stream?.status ?? "not_configured"} />
            {latestHealth && (
              <HealthBadge status={latestHealth.status} />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {(["ready", "live", "paused", "ended", "failed"] as StreamStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={isPending || !stream}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                  s === "live" ? "border-red-500/40 text-red-300 hover:bg-red-500/10"
                  : s === "ended" ? "border-slate-600 text-slate-400 hover:bg-slate-700"
                  : s === "failed" ? "border-red-800/40 text-red-500 hover:bg-red-900/20"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                Mark {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            <p className="text-xs text-slate-500 self-center">Manual health:</p>
            {(["healthy", "warning", "critical", "offline"] as const).map((h) => (
              <button
                key={h}
                onClick={() => handleHealthCheck(h)}
                disabled={isPending || !stream}
                className="rounded px-2 py-1 text-xs bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                {h}
              </button>
            ))}
          </div>

          {/* Event log */}
          {events.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Event log</p>
              {events.slice(0, 20).map((ev) => (
                <div key={ev.id} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="text-slate-600 shrink-0 font-mono">
                    {new Date(ev.createdAt).toLocaleTimeString()}
                  </span>
                  <span className="font-medium text-slate-300">{ev.eventType}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* 4. Broadcast Checklist */}
      <Section title="Broadcast Checklist" icon={<ClipboardList className="h-4 w-4 text-emerald-400" />}>
        <div className="space-y-3 pt-1">
          {checklist.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">No checklist items yet.</p>
              <button
                onClick={handleInitChecklist}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Initialize Checklist
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 shrink-0">{completedCount}/{checklist.length}</span>
              </div>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <button
                    key={item.checklistKey}
                    onClick={() => handleChecklistToggle(item.checklistKey, item.completed)}
                    disabled={isPending}
                    className="w-full flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/40 px-4 py-3 hover:bg-slate-800 transition-colors text-left"
                  >
                    {item.completed
                      ? <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                      : <Circle className="h-4 w-4 text-slate-600 shrink-0" />
                    }
                    <span className={`text-sm ${item.completed ? "text-slate-500 line-through" : "text-slate-200"}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </Section>

      {/* 5. Stream Health */}
      {latestHealth && (
        <Section title="Stream Health" icon={<Activity className="h-4 w-4 text-blue-400" />} defaultOpen={false}>
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-800 p-3">
                <p className="text-xs text-slate-500">Status</p>
                <HealthBadge status={latestHealth.status} />
              </div>
              {latestHealth.latencyMs != null && (
                <div className="rounded-lg bg-slate-800 p-3">
                  <p className="text-xs text-slate-500">Latency</p>
                  <p className="text-sm font-medium text-slate-200">{latestHealth.latencyMs}ms</p>
                </div>
              )}
              {latestHealth.bitrateKbps != null && (
                <div className="rounded-lg bg-slate-800 p-3">
                  <p className="text-xs text-slate-500">Bitrate</p>
                  <p className="text-sm font-medium text-slate-200">{latestHealth.bitrateKbps} kbps</p>
                </div>
              )}
              {latestHealth.viewerCount != null && (
                <div className="rounded-lg bg-slate-800 p-3">
                  <p className="text-xs text-slate-500">Viewers</p>
                  <p className="text-sm font-medium text-slate-200">{latestHealth.viewerCount}</p>
                </div>
              )}
            </div>
            {latestHealth.message && (
              <p className="text-xs text-slate-400">{latestHealth.message}</p>
            )}
            <p className="text-xs text-slate-600">
              Last checked: {new Date(latestHealth.checkedAt).toLocaleString()}
            </p>
          </div>
        </Section>
      )}
    </div>
  );
}
