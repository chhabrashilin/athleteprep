import { fetchOverlayPageData } from "@/lib/cricket/overlays/server";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function MinimalOverlayPage({ params, searchParams }: Props) {
  const { matchSlugOrId } = await params;
  const { token } = await searchParams;

  const result = await fetchOverlayPageData(matchSlugOrId, token ?? null);

  if (!result.valid) {
    return (
      <div style={{ padding: "8px 12px", background: "rgba(0,0,0,0.8)", fontFamily: "system-ui" }}>
        <span style={{ color: "#f87171", fontSize: 11 }}>
          {result.reason === "expired" ? "Token expired" : "Invalid token"}
        </span>
      </div>
    );
  }

  const live = result.liveState;
  const score = live ? `${live.totalRuns}/${live.wicketsLost}` : "—";
  const overs = live?.oversText ?? "0.0";
  const rr = live?.currentRunRate?.toFixed(2) ?? null;
  const battingTeam = result.homeTeamName;

  return (
    <div style={{
      background: "rgba(0,0,0,0.88)",
      borderRadius: 6,
      padding: "10px 16px",
      fontFamily: "system-ui, sans-serif",
      display: "inline-flex",
      flexDirection: "column",
      gap: 2,
      minWidth: 160,
    }}>
      <span style={{ color: "#94a3b8", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>
        {battingTeam}
      </span>
      <span style={{ color: "#f1f5f9", fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>
        {score}
      </span>
      <span style={{ color: "#64748b", fontSize: 11 }}>
        {overs} ov{rr ? ` · RR ${rr}` : ""}
      </span>
    </div>
  );
}
