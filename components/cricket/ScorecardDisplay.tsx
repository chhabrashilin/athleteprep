import Link from "next/link";
import type {
  CricketInnings,
  CricketBattingEntryWithPlayer,
  CricketBowlingEntryWithPlayer,
  CricketFallOfWicket,
  CricketTeam,
  CricketMatchFull,
  CricketScorecardStatus,
} from "@/lib/cricket/types";

// ─── Status badge ─────────────────────────────────────────────────────────────

export function ScorecardStatusBadge({ status }: { status: CricketScorecardStatus }) {
  const map: Record<string, { label: string; cls: string }> = {
    not_started: { label: "Not Started", cls: "bg-slate-700 text-slate-400" },
    setup: { label: "Setup", cls: "bg-amber-500/10 text-amber-400" },
    in_progress: { label: "In Progress", cls: "bg-sky-500/10 text-sky-400" },
    completed: { label: "Completed", cls: "bg-emerald-500/10 text-emerald-400" },
    locked: { label: "Locked", cls: "bg-slate-600 text-slate-300" },
    disputed: { label: "Disputed", cls: "bg-red-500/10 text-red-400" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-700 text-slate-400" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── Batting table ────────────────────────────────────────────────────────────

function formatDismissal(entry: CricketBattingEntryWithPlayer): string {
  if (entry.didNotBat) return "did not bat";
  if (!entry.isOut) return "not out";
  const type = entry.dismissalType ?? "unknown";
  switch (type) {
    case "bowled": return entry.bowlerName ? `b ${entry.bowlerName}` : "b";
    case "caught": return `c ${entry.fielderName ?? ""} b ${entry.bowlerName ?? ""}`.trim();
    case "caught_behind": return `c†${entry.fielderName ?? ""} b ${entry.bowlerName ?? ""}`.trim();
    case "lbw": return entry.bowlerName ? `lbw b ${entry.bowlerName}` : "lbw";
    case "run_out": return "run out";
    case "stumped": return entry.bowlerName ? `st b ${entry.bowlerName}` : "stumped";
    case "hit_wicket": return "hit wicket";
    case "retired_hurt": return "retired hurt";
    case "retired_out": return "retired out";
    default: return type.replace(/_/g, " ");
  }
}

interface BattingTableProps {
  entries: CricketBattingEntryWithPlayer[];
  teamName: string;
}

export function BattingTable({ entries, teamName }: BattingTableProps) {
  const sorted = [...entries].sort((a, b) => (a.battingPosition ?? 99) - (b.battingPosition ?? 99));

  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{teamName} — Batting</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-1.5 pr-3 text-slate-500 font-medium">Batter</th>
              <th className="text-left py-1.5 pr-3 text-slate-500 font-medium">Dismissal</th>
              <th className="text-right py-1.5 px-2 text-slate-500 font-medium w-8">R</th>
              <th className="text-right py-1.5 px-2 text-slate-500 font-medium w-8">B</th>
              <th className="text-right py-1.5 px-2 text-slate-500 font-medium w-8">4s</th>
              <th className="text-right py-1.5 px-2 text-slate-500 font-medium w-8">6s</th>
              <th className="text-right py-1.5 px-1 text-slate-500 font-medium w-12">SR</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry) => (
              <tr key={entry.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="py-1.5 pr-3 text-slate-200 font-medium">
                  {entry.playerName}
                </td>
                <td className="py-1.5 pr-3 text-slate-400 italic">{formatDismissal(entry)}</td>
                <td className="py-1.5 px-2 text-right text-slate-200 font-semibold">{entry.didNotBat ? "-" : entry.runs}</td>
                <td className="py-1.5 px-2 text-right text-slate-400">{entry.didNotBat ? "-" : entry.balls}</td>
                <td className="py-1.5 px-2 text-right text-slate-400">{entry.didNotBat ? "-" : entry.fours}</td>
                <td className="py-1.5 px-2 text-right text-slate-400">{entry.didNotBat ? "-" : entry.sixes}</td>
                <td className="py-1.5 px-1 text-right text-slate-500">
                  {entry.didNotBat ? "-" : entry.strikeRate != null ? entry.strikeRate.toFixed(1) : "-"}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-slate-600 italic">No batting data yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Bowling table ────────────────────────────────────────────────────────────

interface BowlingTableProps {
  entries: CricketBowlingEntryWithPlayer[];
  teamName: string;
}

export function BowlingTable({ entries, teamName }: BowlingTableProps) {
  const sorted = [...entries].sort((a, b) => b.ballsBowled - a.ballsBowled);

  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{teamName} — Bowling</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-1.5 pr-3 text-slate-500 font-medium">Bowler</th>
              <th className="text-right py-1.5 px-2 text-slate-500 font-medium w-10">O</th>
              <th className="text-right py-1.5 px-2 text-slate-500 font-medium w-8">M</th>
              <th className="text-right py-1.5 px-2 text-slate-500 font-medium w-8">R</th>
              <th className="text-right py-1.5 px-2 text-slate-500 font-medium w-8">W</th>
              <th className="text-right py-1.5 px-2 text-slate-500 font-medium w-8">Wd</th>
              <th className="text-right py-1.5 px-2 text-slate-500 font-medium w-8">NB</th>
              <th className="text-right py-1.5 px-1 text-slate-500 font-medium w-12">Econ</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry) => (
              <tr key={entry.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="py-1.5 pr-3 text-slate-200 font-medium">{entry.playerName}</td>
                <td className="py-1.5 px-2 text-right text-slate-300">{entry.oversText ?? "0.0"}</td>
                <td className="py-1.5 px-2 text-right text-slate-400">{entry.maidens}</td>
                <td className="py-1.5 px-2 text-right text-slate-400">{entry.runsConceded}</td>
                <td className="py-1.5 px-2 text-right text-slate-200 font-semibold">{entry.wickets}</td>
                <td className="py-1.5 px-2 text-right text-slate-400">{entry.wides}</td>
                <td className="py-1.5 px-2 text-right text-slate-400">{entry.noBalls}</td>
                <td className="py-1.5 px-1 text-right text-slate-500">
                  {entry.economyRate != null ? entry.economyRate.toFixed(2) : "-"}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="py-4 text-center text-slate-600 italic">No bowling data yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── FOW display ──────────────────────────────────────────────────────────────

interface FOWDisplayProps {
  fow: CricketFallOfWicket[];
}

export function FOWDisplay({ fow }: FOWDisplayProps) {
  if (fow.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Fall of Wickets</h4>
      <div className="flex flex-wrap gap-2">
        {fow.map((w) => (
          <span key={w.id} className="text-xs text-slate-400 bg-slate-800 rounded px-2 py-0.5">
            {w.wicketNumber}-{w.teamScore}
            {w.oversText && <span className="text-slate-600"> ({w.oversText})</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Innings scorecard ────────────────────────────────────────────────────────

interface InningsScorecardProps {
  innings: CricketInnings;
  battingEntries: CricketBattingEntryWithPlayer[];
  bowlingEntries: CricketBowlingEntryWithPlayer[];
  fow: CricketFallOfWicket[];
  battingTeam: CricketTeam | null;
  bowlingTeam: CricketTeam | null;
}

export function InningsScorecard({
  innings,
  battingEntries,
  bowlingEntries,
  fow,
  battingTeam,
  bowlingTeam,
}: InningsScorecardProps) {
  const teamName = battingTeam?.name ?? "Team";
  const bowlingTeamName = bowlingTeam?.name ?? "Bowling Team";
  const scoreText = `${innings.totalRuns}/${innings.wicketsLost}`;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">
            Innings {innings.inningsNumber} — {teamName} batting
          </p>
          <p className="text-2xl font-bold text-slate-100">
            {scoreText}
            <span className="text-base text-slate-400 ml-2">({innings.oversText ?? "0.0"} ov)</span>
          </p>
        </div>
        <div className="text-right">
          {innings.runRate != null && (
            <p className="text-xs text-slate-500">
              RR: <span className="text-slate-300 font-medium">{innings.runRate.toFixed(2)}</span>
            </p>
          )}
          {innings.targetRuns != null && (
            <p className="text-xs text-slate-500">
              Target: <span className="text-slate-300 font-medium">{innings.targetRuns}</span>
            </p>
          )}
          {innings.extrasTotal > 0 && (
            <p className="text-xs text-slate-500">
              Extras: <span className="text-slate-400">
                {innings.extrasTotal} (b {innings.byes}, lb {innings.legByes}, w {innings.wides}, nb {innings.noBalls})
              </span>
            </p>
          )}
        </div>
      </div>

      <BattingTable entries={battingEntries} teamName={teamName} />
      <BowlingTable entries={bowlingEntries} teamName={bowlingTeamName} />
      <FOWDisplay fow={fow} />
    </div>
  );
}
