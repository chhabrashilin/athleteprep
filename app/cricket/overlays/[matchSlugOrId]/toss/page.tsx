import { fetchOverlayPageData } from "@/lib/cricket/overlays/server";
import { buildTossOverlayData } from "@/lib/cricket/overlays/data";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function TossOverlayPage({ params, searchParams }: Props) {
  const { matchSlugOrId } = await params;
  const { token } = await searchParams;

  const result = await fetchOverlayPageData(matchSlugOrId, token ?? null);

  if (!result.valid) {
    return (
      <OverlayError reason={result.reason} />
    );
  }

  const data = buildTossOverlayData({
    tossWonByTeamId: result.tossWonByTeamId,
    tossDecision:    result.tossDecision,
    homeTeamName:    result.homeTeamName,
    homeTeamId:      result.homeTeamId,
    awayTeamName:    result.awayTeamName,
    awayTeamId:      result.awayTeamId,
    venueName:       result.venueName,
    matchTitle:      result.matchTitle,
  });

  return (
    <div style={{
      background: "rgba(0,0,0,0.85)", border: "1px solid rgba(14,165,233,0.3)",
      borderRadius: 8, padding: "24px 32px", fontFamily: "system-ui, sans-serif",
      display: "inline-block", minWidth: 420,
    }}>
      <p style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
        Toss
      </p>
      <p style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
        {data.tossWinner}
      </p>
      <p style={{ color: "#0ea5e9", fontSize: 15, marginBottom: 16 }}>
        {data.decision}
      </p>
      <p style={{ color: "#64748b", fontSize: 12 }}>
        {data.homeTeam} vs {data.awayTeam}
      </p>
      {data.venue && (
        <p style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>{data.venue}</p>
      )}
    </div>
  );
}

function OverlayError({ reason }: { reason?: string }) {
  return (
    <div style={{ padding: "12px 20px", background: "rgba(0,0,0,0.7)", borderLeft: "4px solid #ef4444", display: "inline-block" }}>
      <span style={{ color: "#f87171", fontSize: 12, fontFamily: "system-ui" }}>
        {reason === "expired" ? "Overlay token expired" : reason === "revoked" ? "Overlay token revoked" : "Invalid overlay token"}
      </span>
    </div>
  );
}
