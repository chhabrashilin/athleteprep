import { fetchOverlayPageData } from "@/lib/cricket/overlays/server";
import { buildScorebugOverlayData } from "@/lib/cricket/overlays/data";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function ScorebugOverlayPage({ params, searchParams }: Props) {
  const { matchSlugOrId } = await params;
  const { token } = await searchParams;

  const result = await fetchOverlayPageData(matchSlugOrId, token ?? null);

  if (!result.valid) {
    return (
      <div style={{ padding: "8px 16px", background: "rgba(0,0,0,0.7)", display: "inline-block", borderLeft: "4px solid #ef4444" }}>
        <span style={{ color: "#f87171", fontSize: 12, fontFamily: "system-ui" }}>
          {result.reason === "expired" ? "Overlay token expired" : result.reason === "revoked" ? "Overlay token revoked" : "Invalid overlay token"}
        </span>
      </div>
    );
  }

  const data = buildScorebugOverlayData({
    matchTitle:        result.matchTitle,
    leagueName:        result.leagueName,
    homeTeamName:      result.homeTeamName,
    homeTeamId:        result.homeTeamId,
    awayTeamName:      result.awayTeamName,
    awayTeamId:        result.awayTeamId,
    battingTeamId:     result.liveState?.strikerId ? result.homeTeamId : null,
    liveState:         result.liveState,
    striker:           null,
    nonStriker:        null,
    bowler:            null,
    strikerRuns:       null,
    strikerBalls:      null,
    nonStrikerRuns:    null,
    nonStrikerBalls:   null,
    bowlerWickets:     null,
    bowlerRuns:        null,
    bowlerOvers:       null,
    lastBalls:         [],
  });

  const refreshMs = parseInt(process.env.NEXT_PUBLIC_OVERLAY_REFRESH_INTERVAL_MS ?? "2000");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const dataUrl = `${appUrl}/api/cricket/overlay/${encodeURIComponent(matchSlugOrId)}/data?token=${encodeURIComponent(token ?? "")}&type=scorebug`;

  return (
    <>
      <meta httpEquiv="refresh" content={`${Math.round(refreshMs / 1000)}`} />
      <ScorebugDisplay data={data} />
    </>
  );
}

function ScorebugDisplay({ data }: { data: ReturnType<typeof buildScorebugOverlayData> }) {
  const bg = "rgba(0,0,0,0.82)";
  const primary = "#0ea5e9";
  const text = "#f1f5f9";
  const accent = "#f59e0b";

  return (
    <div style={{
      background: bg,
      borderLeft: `4px solid ${primary}`,
      padding: "6px 14px",
      display: "inline-flex",
      alignItems: "center",
      gap: 14,
      fontFamily: "system-ui, sans-serif",
      borderRadius: 4,
      minWidth: 480,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: accent, fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
          {data.battingTeamShortName}
        </span>
        <span style={{ color: text, fontWeight: 800, fontSize: 20 }}>
          {data.scoreText}
        </span>
        <span style={{ color: `${text}99`, fontSize: 12 }}>({data.oversText})</span>
        {data.runRate && (
          <span style={{ color: `${text}70`, fontSize: 11 }}>RR {data.runRate}</span>
        )}
      </div>
      {data.targetText && (
        <span style={{ color: accent, fontSize: 11, borderLeft: `1px solid ${text}30`, paddingLeft: 10 }}>
          {data.targetText}
        </span>
      )}
      {data.strikerName && (
        <>
          <div style={{ borderLeft: `1px solid ${text}30`, height: 28 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: text, fontSize: 12, fontWeight: 600 }}>{data.strikerName}*</span>
            {data.strikerRunsBalls && <span style={{ color: `${text}80`, fontSize: 10 }}>{data.strikerRunsBalls}</span>}
          </div>
        </>
      )}
      {data.bowlerName && (
        <>
          <div style={{ borderLeft: `1px solid ${text}30`, height: 28 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: `${text}cc`, fontSize: 12 }}>{data.bowlerName}</span>
            {data.bowlerFigures && <span style={{ color: `${text}70`, fontSize: 10 }}>{data.bowlerFigures}</span>}
          </div>
        </>
      )}
      {data.lastBalls.length > 0 && (
        <div style={{ display: "flex", gap: 4 }}>
          {data.lastBalls.map((b, i) => (
            <span key={i} style={{
              width: 20, height: 20, borderRadius: "50%",
              background: b === "W" ? "#ef4444" : b === "6" ? "#8b5cf6" : b === "4" ? "#3b82f6" : `${text}20`,
              color: b === "W" || b === "6" || b === "4" ? "#fff" : text,
              fontSize: 9, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{b}</span>
          ))}
        </div>
      )}
      <span style={{ color: `${text}80`, fontSize: 10, marginLeft: "auto", textTransform: "uppercase" }}>
        {data.statusLabel}
      </span>
    </div>
  );
}
