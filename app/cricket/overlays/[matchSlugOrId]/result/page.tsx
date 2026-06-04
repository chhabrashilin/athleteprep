import { fetchOverlayPageData } from "@/lib/cricket/overlays/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function ResultOverlayPage({ params, searchParams }: Props) {
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

  // Fetch result summary if available.
  const supabase = await createServerSupabaseClient();
  let resultSummary: string | null = null;
  if (supabase) {
    const { data } = await supabase
      .from("cricket_matches")
      .select("result_summary, winner_team_id")
      .eq("id", result.matchId)
      .maybeSingle();
    resultSummary = data?.result_summary ?? null;
  }

  return (
    <div style={{
      background: "rgba(0,0,0,0.9)", border: "1px solid rgba(16,185,129,0.3)",
      borderRadius: 10, padding: "28px 40px", fontFamily: "system-ui, sans-serif",
      display: "inline-block", textAlign: "center", minWidth: 480,
    }}>
      <p style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
        Match Result
      </p>
      <p style={{ color: "#f1f5f9", fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
        {result.matchTitle}
      </p>
      {resultSummary ? (
        <p style={{ color: "#10b981", fontSize: 18, fontWeight: 600 }}>{resultSummary}</p>
      ) : (
        <p style={{ color: "#64748b", fontSize: 14 }}>
          {result.matchStatus === "completed" ? "Match completed" : result.matchStatus}
        </p>
      )}
    </div>
  );
}
