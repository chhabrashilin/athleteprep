"use client";

/**
 * components/cricket/overlays/OverlayScoreBug.tsx
 * OBS/vMix-ready scorebug overlay.  Auto-refreshes via polling.
 */

import { useEffect, useState, useCallback } from "react";
import type { ScorebugOverlayData, CricketOverlayTheme } from "@/lib/cricket/types";

interface Props {
  initialData: ScorebugOverlayData | null;
  theme: CricketOverlayTheme | null;
  refreshIntervalMs: number;
  dataUrl: string;
}

export function OverlayScoreBug({ initialData, theme, refreshIntervalMs, dataUrl }: Props) {
  const [data, setData] = useState(initialData);
  const [isConnected, setIsConnected] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(dataUrl, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json.data ?? null);
        setIsConnected(true);
      }
    } catch {
      setIsConnected(false);
    }
  }, [dataUrl]);

  useEffect(() => {
    const id = setInterval(refresh, refreshIntervalMs);
    return () => clearInterval(id);
  }, [refresh, refreshIntervalMs]);

  const bg = theme?.backgroundColor ?? "rgba(0,0,0,0.82)";
  const primary = theme?.primaryColor ?? "#0ea5e9";
  const text = theme?.textColor ?? "#f1f5f9";
  const accent = theme?.accentColor ?? "#f59e0b";

  if (!data) {
    return (
      <div style={{ background: bg, borderLeft: `4px solid ${primary}`, padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: 12, fontFamily: theme?.fontFamily ?? "system-ui, sans-serif" }}>
        <span style={{ color: text, fontSize: 14, opacity: 0.6 }}>Scorebug loading…</span>
      </div>
    );
  }

  return (
    <div style={{
      background: bg,
      borderLeft: `4px solid ${primary}`,
      padding: "6px 14px",
      display: "inline-flex",
      alignItems: "center",
      gap: 14,
      fontFamily: theme?.fontFamily ?? "system-ui, sans-serif",
      borderRadius: 4,
      minWidth: 520,
    }}>
      {/* Teams + Score */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: accent, fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
          {data.battingTeamShortName}
        </span>
        <span style={{ color: text, fontWeight: 800, fontSize: 20, letterSpacing: 0.5, lineHeight: 1 }}>
          {data.scoreText}
        </span>
        <span style={{ color: `${text}99`, fontSize: 12 }}>
          ({data.oversText})
        </span>
        {data.runRate && (
          <span style={{ color: `${text}80`, fontSize: 11 }}>RR {data.runRate}</span>
        )}
      </div>

      {/* Target chase */}
      {data.targetText && (
        <div style={{ borderLeft: `1px solid ${text}30`, paddingLeft: 10 }}>
          <span style={{ color: accent, fontSize: 11 }}>{data.targetText}</span>
        </div>
      )}

      {/* Divider */}
      <div style={{ borderLeft: `1px solid ${text}30`, height: 28 }} />

      {/* Striker */}
      {data.strikerName && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: text, fontSize: 12, fontWeight: 600 }}>{data.strikerName}*</span>
          {data.strikerRunsBalls && <span style={{ color: `${text}80`, fontSize: 10 }}>{data.strikerRunsBalls}</span>}
        </div>
      )}
      {data.nonStrikerName && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: `${text}cc`, fontSize: 12 }}>{data.nonStrikerName}</span>
          {data.nonStrikerRunsBalls && <span style={{ color: `${text}60`, fontSize: 10 }}>{data.nonStrikerRunsBalls}</span>}
        </div>
      )}

      {/* Divider */}
      {data.bowlerName && <div style={{ borderLeft: `1px solid ${text}30`, height: 28 }} />}

      {/* Bowler */}
      {data.bowlerName && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: `${text}cc`, fontSize: 12 }}>{data.bowlerName}</span>
          {data.bowlerFigures && <span style={{ color: `${text}70`, fontSize: 10 }}>{data.bowlerFigures}</span>}
        </div>
      )}

      {/* Last balls */}
      {data.lastBalls.length > 0 && (
        <div style={{ display: "flex", gap: 4, marginLeft: 4 }}>
          {data.lastBalls.map((b, i) => (
            <span key={i} style={{
              width: 22, height: 22, borderRadius: "50%",
              background: b === "W" ? "#ef4444" : b === "6" ? "#8b5cf6" : b === "4" ? "#3b82f6" : `${text}20`,
              color: b === "W" || b === "6" || b === "4" ? "#fff" : text,
              fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {b}
            </span>
          ))}
        </div>
      )}

      {/* Status */}
      <div style={{ marginLeft: "auto" }}>
        {!isConnected && (
          <span style={{ color: "#ef4444", fontSize: 10, opacity: 0.7 }}>⚠</span>
        )}
      </div>
    </div>
  );
}
