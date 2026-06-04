import { fetchOverlayPageData } from "@/lib/cricket/overlays/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function FullScorecardOverlayPage({ params, searchParams }: Props) {
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

  const supabase = await createServerSupabaseClient();
  let battingEntries: Array<{ name: string; runs: number; balls: number }> = [];
  if (supabase) {
    const { data } = await supabase
      .from("cricket_batting_entries")
      .select("player_name, runs_scored, balls_faced")
      .eq("match_id", result.matchId)
      .order("batting_position", { ascending: true })
      .limit(11);
    battingEntries = (data ?? []).map((r) => ({
      name: (r as Record<string, unknown>).player_name as string ?? "—",
      runs: (r as Record<string, unknown>).runs_scored as number ?? 0,
      balls: (r as Record<string, unknown>).balls_faced as number ?? 0,
    }));
  }

  const live = result.liveState;

  return (
    <div style={{
      background: "rgba(0,0,0,0.92)", border: "1px solid rgba(14,165,233,0.2)",
      borderRadius: 8, padding: "20px 24px", fontFamily: "system-ui, monospace",
      display: "inline-block", minWidth: 560,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <span style={{ color: "#f1f5f9", fontSize: 15, fontWeight: 700 }}>
          {result.homeTeamName}
        </span>
        <span style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 800 }}>
          {live ? `${live.totalRuns}/${live.wicketsLost}` : "—"} {live ? `(${live.oversText})` : ""}
        </span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ color: "#64748b", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <th style={{ textAlign: "left", padding: "4px 0", fontWeight: 500 }}>Batter</th>
            <th style={{ textAlign: "right", padding: "4px 8px", fontWeight: 500 }}>R</th>
            <th style={{ textAlign: "right", padding: "4px 0", fontWeight: 500 }}>B</th>
          </tr>
        </thead>
        <tbody>
          {battingEntries.length > 0 ? battingEntries.map((b, i) => (
            <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <td style={{ color: "#e2e8f0", padding: "4px 0" }}>{b.name}</td>
              <td style={{ color: "#f1f5f9", fontWeight: 700, textAlign: "right", padding: "4px 8px" }}>{b.runs}</td>
              <td style={{ color: "#94a3b8", textAlign: "right", padding: "4px 0" }}>{b.balls}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={3} style={{ color: "#475569", padding: "8px 0", fontSize: 11 }}>
                No batting data yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
