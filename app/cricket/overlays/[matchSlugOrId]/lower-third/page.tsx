import { fetchOverlayPageData } from "@/lib/cricket/overlays/server";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
  searchParams: Promise<{ token?: string; player?: string; stat?: string; team?: string }>;
}

export default async function LowerThirdOverlayPage({ params, searchParams }: Props) {
  const { matchSlugOrId } = await params;
  const { token, player, stat, team } = await searchParams;

  const result = await fetchOverlayPageData(matchSlugOrId, token ?? null);

  if (!result.valid) {
    return (
      <div style={{ padding: "8px 16px", background: "rgba(0,0,0,0.7)", fontFamily: "system-ui", borderLeft: "4px solid #ef4444" }}>
        <span style={{ color: "#f87171", fontSize: 12 }}>Invalid overlay token</span>
      </div>
    );
  }

  return (
    <div style={{
      background: "linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(14,165,233,0.15) 100%)",
      borderLeft: "4px solid #0ea5e9",
      padding: "12px 20px",
      fontFamily: "system-ui, sans-serif",
      display: "inline-flex",
      flexDirection: "column",
      gap: 4,
      minWidth: 360,
    }}>
      <span style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700 }}>
        {player ?? result.matchTitle}
      </span>
      {stat && (
        <span style={{ color: "#0ea5e9", fontSize: 13 }}>{stat}</span>
      )}
      {team && (
        <span style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{team}</span>
      )}
    </div>
  );
}
