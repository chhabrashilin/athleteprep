import { fetchOverlayPageData } from "@/lib/cricket/overlays/server";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function InningsBreakOverlayPage({ params, searchParams }: Props) {
  const { matchSlugOrId } = await params;
  const { token } = await searchParams;

  const result = await fetchOverlayPageData(matchSlugOrId, token ?? null);

  if (!result.valid) {
    return (
      <div style={{ padding: "12px 20px", background: "rgba(0,0,0,0.7)", borderLeft: "4px solid #ef4444", fontFamily: "system-ui" }}>
        <span style={{ color: "#f87171", fontSize: 12 }}>Invalid overlay token</span>
      </div>
    );
  }

  const live = result.liveState;
  const score = live ? `${live.totalRuns}/${live.wicketsLost}` : "—";
  const target = live?.targetRuns ? live.targetRuns + 1 : null;

  return (
    <div style={{
      background: "rgba(0,0,0,0.88)", border: "1px solid rgba(14,165,233,0.25)",
      borderRadius: 10, padding: "28px 36px", fontFamily: "system-ui, sans-serif",
      display: "inline-block", minWidth: 480,
    }}>
      <p style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
        Innings Break
      </p>
      <div style={{ display: "flex", gap: 32, marginBottom: 16 }}>
        <div>
          <p style={{ color: "#64748b", fontSize: 11 }}>{result.homeTeamName}</p>
          <p style={{ color: "#f1f5f9", fontSize: 28, fontWeight: 800 }}>{score}</p>
          <p style={{ color: "#64748b", fontSize: 12 }}>{live?.oversText ?? "0.0"} overs</p>
        </div>
        {target && (
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: 32 }}>
            <p style={{ color: "#64748b", fontSize: 11 }}>Target</p>
            <p style={{ color: "#f59e0b", fontSize: 36, fontWeight: 800 }}>{target}</p>
          </div>
        )}
      </div>
      {target && live?.requiredRunRate != null && (
        <p style={{ color: "#94a3b8", fontSize: 13 }}>
          Required RR: <strong style={{ color: "#f1f5f9" }}>{live.requiredRunRate.toFixed(2)}</strong>
        </p>
      )}
    </div>
  );
}
