/**
 * Pure chart-data calculation functions.
 * No side effects, no database access, fully testable.
 */

import { ballsToOversText } from "@/lib/cricket/scorecards/calculations";
import type {
  CricketBallEventAnalytics,
  WormChartPoint,
  ManhattanChartBar,
  RunRatePoint,
  PartnershipChartRow,
  WagonWheelData,
  WagonZoneSummary,
  WagonZone,
  PhaseSummaryRow,
  MomentumPoint,
  MatchAnalyticsSummary,
  BattingPhase,
} from "@/lib/cricket/types";

// ─── Types for inputs ─────────────────────────────────────────────────────────

export interface InningsInfo {
  id: string;
  battingTeamId: string;
  inningsNumber: number;
  totalRuns: number;
  wicketsLost: number;
  ballsBowled: number;
}

export interface PartnershipInput {
  wicketNumber: number | null;
  runs: number;
  balls: number;
  startScore: number | null;
  endScore: number | null;
  playerOneName: string;
  playerTwoName: string;
}

// ─── 1. Worm chart ────────────────────────────────────────────────────────────

/** Build cumulative run progression points per innings. */
export function buildWormChartData(
  ballEvents: CricketBallEventAnalytics[],
  innings: InningsInfo[]
): WormChartPoint[] {
  const points: WormChartPoint[] = [];
  const inningsMap = new Map(innings.map((i) => [i.id, i]));

  // Group non-deleted legal deliveries by innings
  const byInnings = new Map<string, CricketBallEventAnalytics[]>();
  for (const ev of ballEvents) {
    if (ev.isDeleted) continue;
    if (!byInnings.has(ev.inningsId)) byInnings.set(ev.inningsId, []);
    byInnings.get(ev.inningsId)!.push(ev);
  }

  for (const [inningsId, events] of byInnings.entries()) {
    const info = inningsMap.get(inningsId);
    if (!info) continue;

    const sorted = [...events].sort((a, b) => {
      if (a.overNumber !== b.overNumber) return a.overNumber - b.overNumber;
      return a.ballInOver - b.ballInOver;
    });

    let cumulativeRuns = 0;
    let wickets = 0;
    let ballNumber = 0;

    // Start point
    points.push({
      inningsId,
      teamId: info.battingTeamId,
      ballNumber: 0,
      overText: "0.0",
      cumulativeRuns: 0,
      wickets: 0,
      label: "Start",
    });

    for (const ev of sorted) {
      cumulativeRuns += ev.runsTotal;
      if (ev.isWicket) wickets++;
      if (ev.isLegalDelivery) ballNumber++;

      points.push({
        inningsId,
        teamId: info.battingTeamId,
        ballNumber,
        overText: ballsToOversText(ballNumber),
        cumulativeRuns,
        wickets,
        label: `${ballsToOversText(ballNumber)}: ${cumulativeRuns}/${wickets}`,
      });
    }
  }

  return points;
}

// ─── 2. Manhattan chart ───────────────────────────────────────────────────────

/** Build runs-per-over bars per innings. */
export function buildManhattanChartData(
  ballEvents: CricketBallEventAnalytics[]
): ManhattanChartBar[] {
  const bars: ManhattanChartBar[] = [];

  // Group by innings + over
  const overMap = new Map<string, ManhattanChartBar>();

  for (const ev of ballEvents) {
    if (ev.isDeleted) continue;
    const key = `${ev.inningsId}::${ev.overNumber}`;
    if (!overMap.has(key)) {
      overMap.set(key, {
        inningsId: ev.inningsId,
        overNumber: ev.overNumber,
        runs: 0,
        wickets: 0,
        boundaries: 0,
        extras: 0,
      });
    }
    const bar = overMap.get(key)!;
    bar.runs += ev.runsTotal;
    if (ev.isWicket) bar.wickets++;
    if (ev.isBoundaryFour || ev.isBoundarySix) bar.boundaries++;
    if (ev.runsExtras > 0) bar.extras += ev.runsExtras;
  }

  for (const bar of overMap.values()) bars.push(bar);

  return bars.sort((a, b) => {
    if (a.inningsId !== b.inningsId) return a.inningsId.localeCompare(b.inningsId);
    return a.overNumber - b.overNumber;
  });
}

// ─── 3. Run-rate graph ────────────────────────────────────────────────────────

/** Build run-rate progression; includes required rate for chase innings. */
export function buildRunRateGraphData(
  ballEvents: CricketBallEventAnalytics[],
  innings: InningsInfo[],
  target?: number
): RunRatePoint[] {
  const points: RunRatePoint[] = [];
  const inningsById = new Map(innings.map((i) => [i.id, i]));

  const byInnings = new Map<string, CricketBallEventAnalytics[]>();
  for (const ev of ballEvents) {
    if (ev.isDeleted) continue;
    if (!byInnings.has(ev.inningsId)) byInnings.set(ev.inningsId, []);
    byInnings.get(ev.inningsId)!.push(ev);
  }

  for (const [inningsId, events] of byInnings.entries()) {
    const info = inningsById.get(inningsId);
    if (!info) continue;
    const isChase = target !== undefined && info.inningsNumber > 1;

    const sorted = [...events].sort((a, b) => {
      if (a.overNumber !== b.overNumber) return a.overNumber - b.overNumber;
      return a.ballInOver - b.ballInOver;
    });

    let cumulativeRuns = 0;
    let cumulativeBalls = 0;
    let wickets = 0;

    for (const ev of sorted) {
      cumulativeRuns += ev.runsTotal;
      if (ev.isWicket) wickets++;
      if (ev.isLegalDelivery) cumulativeBalls++;

      const currentRunRate = cumulativeBalls > 0 ? parseFloat(((cumulativeRuns / cumulativeBalls) * 6).toFixed(2)) : null;

      let requiredRunRate: number | null = null;
      if (isChase && target !== undefined) {
        const remaining = target - cumulativeRuns;
        const totalBalls = info.ballsBowled || 120;
        const ballsLeft = totalBalls - cumulativeBalls;
        if (ballsLeft > 0 && remaining > 0) {
          requiredRunRate = parseFloat(((remaining / ballsLeft) * 6).toFixed(2));
        } else {
          requiredRunRate = remaining <= 0 ? 0 : null;
        }
      }

      points.push({
        overText: ballsToOversText(cumulativeBalls),
        overNumber: ev.overNumber,
        currentRunRate,
        requiredRunRate,
        runs: cumulativeRuns,
        balls: cumulativeBalls,
        wickets,
      });
    }
  }

  return points;
}

// ─── 4. Partnership chart ─────────────────────────────────────────────────────

/** Build partnership bars from cricket_partnerships rows. */
export function buildPartnershipChartData(
  partnerships: PartnershipInput[]
): PartnershipChartRow[] {
  return partnerships
    .filter((p) => p.wicketNumber !== null)
    .sort((a, b) => (a.wicketNumber ?? 0) - (b.wicketNumber ?? 0))
    .map((p) => ({
      wicketNumber: p.wicketNumber ?? 0,
      playerOneName: p.playerOneName,
      playerTwoName: p.playerTwoName,
      runs: p.runs,
      balls: p.balls,
      runRate: p.balls > 0 ? parseFloat(((p.runs / p.balls) * 6).toFixed(2)) : null,
      startScore: p.startScore,
      endScore: p.endScore,
    }));
}

// ─── 5. Wagon wheel ───────────────────────────────────────────────────────────

const WAGON_ZONE_LABELS: Record<WagonZone, string> = {
  third_man: "Third Man",
  point: "Point",
  cover: "Cover",
  mid_off: "Mid Off",
  straight: "Straight",
  mid_on: "Mid On",
  mid_wicket: "Mid Wicket",
  square_leg: "Square Leg",
  fine_leg: "Fine Leg",
  unknown: "Unknown",
};

/** Build wagon wheel zone summary from ball events. */
export function buildWagonWheelData(
  ballEvents: CricketBallEventAnalytics[],
  options?: { batterId?: string; inningsId?: string }
): WagonWheelData {
  let filtered = ballEvents.filter((ev) => !ev.isDeleted && ev.isLegalDelivery);

  if (options?.batterId) {
    filtered = filtered.filter((ev) => ev.strikerId === options.batterId);
  }
  if (options?.inningsId) {
    filtered = filtered.filter((ev) => ev.inningsId === options.inningsId);
  }

  if (filtered.length === 0) {
    return {
      zones: [],
      hasShotCoordinates: false,
      reason: "No ball-by-ball data available.",
      totalRuns: 0,
      totalBalls: 0,
    };
  }

  const hasShotCoordinates = filtered.some((ev) => ev.shotX !== null && ev.shotY !== null);
  const hasZoneData = filtered.some((ev) => ev.wagonZone !== null);

  if (!hasShotCoordinates && !hasZoneData) {
    return {
      zones: [],
      hasShotCoordinates: false,
      reason: "No shot location data available. Enable shot zone tracking in live scoring to populate this chart.",
      totalRuns: filtered.reduce((s, ev) => s + ev.runsBatter, 0),
      totalBalls: filtered.length,
    };
  }

  // Aggregate by zone
  const zoneMap = new Map<WagonZone, { runs: number; balls: number; boundaries: number }>();

  for (const ev of filtered) {
    let zone: WagonZone = ev.wagonZone ?? "unknown";

    // Derive from coordinates if no explicit zone
    if (zone === "unknown" && ev.shotX !== null && ev.shotY !== null && ev.wagonAngleDegrees !== null) {
      zone = inferWagonZoneFromAngle(ev.wagonAngleDegrees);
    }

    if (!zoneMap.has(zone)) zoneMap.set(zone, { runs: 0, balls: 0, boundaries: 0 });
    const entry = zoneMap.get(zone)!;
    entry.runs += ev.runsBatter;
    entry.balls++;
    if (ev.isBoundaryFour || ev.isBoundarySix) entry.boundaries++;
  }

  const totalRuns = filtered.reduce((s, ev) => s + ev.runsBatter, 0);
  const totalBalls = filtered.length;

  const zones: WagonZoneSummary[] = Array.from(zoneMap.entries()).map(([zoneName, data]) => ({
    zoneName,
    runs: data.runs,
    balls: data.balls,
    boundaries: data.boundaries,
    percentage: totalBalls > 0 ? parseFloat(((data.balls / totalBalls) * 100).toFixed(1)) : 0,
  }));

  zones.sort((a, b) => b.runs - a.runs);

  return { zones, hasShotCoordinates, reason: null, totalRuns, totalBalls };
}

// ─── 6. Zone inference ────────────────────────────────────────────────────────

/**
 * Infer cricket wagon zone from shot angle (0° = straight, clockwise for right-hand batter).
 * Angles: 0-40 = straight/mid-off, 40-80 = cover, 80-120 = point, 120-160 = third-man,
 *         200-240 = fine-leg, 240-280 = square-leg, 280-320 = mid-wicket, 320-360 = mid-on
 */
export function inferWagonZoneFromAngle(angleDegrees: number): WagonZone {
  const a = ((angleDegrees % 360) + 360) % 360;
  if (a < 20 || a >= 340) return "straight";
  if (a < 60) return "mid_off";
  if (a < 100) return "cover";
  if (a < 140) return "point";
  if (a < 180) return "third_man";
  if (a < 220) return "fine_leg";
  if (a < 260) return "square_leg";
  if (a < 300) return "mid_wicket";
  return "mid_on";
}

export { WAGON_ZONE_LABELS };

// ─── 7. Phase classification ──────────────────────────────────────────────────

export interface PhaseConfig {
  powerplayEnd: number;   // last over of powerplay (0-indexed)
  middleEnd: number;      // last over of middle overs (0-indexed)
  totalOvers: number;
}

const DEFAULT_T20_PHASES: PhaseConfig = { powerplayEnd: 5, middleEnd: 15, totalOvers: 20 };

export function classifyBattingPhase(
  overNumber: number,
  config: PhaseConfig = DEFAULT_T20_PHASES
): BattingPhase {
  if (overNumber <= config.powerplayEnd) return "powerplay";
  if (overNumber <= config.middleEnd) return "middle_overs";
  return "death_overs";
}

// ─── 8. Phase summary ─────────────────────────────────────────────────────────

const PHASE_LABEL: Record<BattingPhase, string> = {
  powerplay: "Powerplay (1-6)",
  middle_overs: "Middle Overs",
  death_overs: "Death Overs",
  chase_setup: "Chase Setup",
  chase_finish: "Chase Finish",
  unknown: "Other",
};

export function buildPhaseSummary(
  ballEvents: CricketBallEventAnalytics[],
  config: PhaseConfig = DEFAULT_T20_PHASES
): PhaseSummaryRow[] {
  const phaseMap = new Map<BattingPhase, { runs: number; wickets: number; balls: number; boundaries: number; dots: number }>();

  const phases: BattingPhase[] = ["powerplay", "middle_overs", "death_overs"];
  for (const p of phases) {
    phaseMap.set(p, { runs: 0, wickets: 0, balls: 0, boundaries: 0, dots: 0 });
  }

  for (const ev of ballEvents) {
    if (ev.isDeleted) continue;
    const phase: BattingPhase = ev.battingPhase ?? classifyBattingPhase(ev.overNumber, config);
    if (!phaseMap.has(phase)) phaseMap.set(phase, { runs: 0, wickets: 0, balls: 0, boundaries: 0, dots: 0 });
    const entry = phaseMap.get(phase)!;
    entry.runs += ev.runsTotal;
    if (ev.isWicket) entry.wickets++;
    if (ev.isLegalDelivery) {
      entry.balls++;
      if (ev.isDotBall) entry.dots++;
    }
    if (ev.isBoundaryFour || ev.isBoundarySix) entry.boundaries++;
  }

  return Array.from(phaseMap.entries()).map(([phase, data]) => ({
    phase,
    label: PHASE_LABEL[phase] ?? phase,
    runs: data.runs,
    wickets: data.wickets,
    balls: data.balls,
    runRate: data.balls > 0 ? parseFloat(((data.runs / data.balls) * 6).toFixed(2)) : null,
    boundaries: data.boundaries,
    dotBallPercentage: data.balls > 0 ? parseFloat(((data.dots / data.balls) * 100).toFixed(1)) : null,
  }));
}

// ─── 9. Dot ball and boundary percentages ────────────────────────────────────

export function calculateDotBallPercentage(dotBalls: number, totalLegalBalls: number): number | null {
  if (totalLegalBalls <= 0) return null;
  return parseFloat(((dotBalls / totalLegalBalls) * 100).toFixed(1));
}

export function calculateBoundaryPercentage(boundaryBalls: number, totalLegalBalls: number): number | null {
  if (totalLegalBalls <= 0) return null;
  return parseFloat(((boundaryBalls / totalLegalBalls) * 100).toFixed(1));
}

// ─── 10. Match momentum ───────────────────────────────────────────────────────

/**
 * Conservative, experimental over-by-over momentum model.
 * Momentum = scaled score based on runs above expected, wickets, boundaries, dots.
 * Returns values between 0 and 100 per team per over.
 * Clearly labeled as experimental.
 */
export function buildMatchMomentumData(
  ballEvents: CricketBallEventAnalytics[],
  innings: InningsInfo[],
  config: PhaseConfig = DEFAULT_T20_PHASES
): MomentumPoint[] {
  const points: MomentumPoint[] = [];

  // Group by over across all innings
  const overGroups = new Map<string, CricketBallEventAnalytics[]>();
  for (const ev of ballEvents) {
    if (ev.isDeleted) continue;
    const key = `${ev.inningsId}::${ev.overNumber}`;
    if (!overGroups.has(key)) overGroups.set(key, []);
    overGroups.get(key)!.push(ev);
  }

  const inningsById = new Map(innings.map((i) => [i.id, i]));

  // Process per innings
  const inningsList = [...new Set(ballEvents.map((e) => e.inningsId))];

  let globalOverNumber = 0;
  for (const inningsId of inningsList) {
    const info = inningsById.get(inningsId);
    if (!info) continue;

    const oversInInnings = [...new Set(
      ballEvents.filter((e) => e.inningsId === inningsId).map((e) => e.overNumber)
    )].sort((a, b) => a - b);

    for (const overNum of oversInInnings) {
      const overEvents = overGroups.get(`${inningsId}::${overNum}`) ?? [];
      const runs = overEvents.reduce((s, e) => s + e.runsTotal, 0);
      const wickets = overEvents.filter((e) => e.isWicket).length;
      const boundaries = overEvents.filter((e) => e.isBoundaryFour || e.isBoundarySix).length;
      const legalBalls = overEvents.filter((e) => e.isLegalDelivery).length;
      const dots = overEvents.filter((e) => e.isDotBall && e.isLegalDelivery).length;

      // Expected ~6 runs per over; normalize
      const expectedRuns = 6;
      const runsAbove = runs - expectedRuns;

      // Batting momentum score: higher = batting team has momentum
      let battingScore = 50;
      battingScore += runsAbove * 5;
      battingScore += boundaries * 3;
      battingScore -= wickets * 10;
      battingScore -= dots;
      battingScore = Math.max(0, Math.min(100, battingScore));

      const bowlingScore = 100 - battingScore;

      const expl = wickets > 0
        ? `${wickets} wicket${wickets > 1 ? "s" : ""} and ${runs} runs this over`
        : `${runs} runs this over`;

      points.push({
        overNumber: globalOverNumber++,
        battingTeamMomentum: parseFloat(battingScore.toFixed(1)),
        bowlingTeamMomentum: parseFloat(bowlingScore.toFixed(1)),
        explanation: expl,
      });
    }
  }

  return points;
}

// ─── 11. Match analytics summary ─────────────────────────────────────────────

export function summarizeMatchAnalytics(data: {
  manhattan: ManhattanChartBar[];
  partnerships: PartnershipChartRow[];
  phases: PhaseSummaryRow[];
}): MatchAnalyticsSummary {
  const { manhattan, partnerships, phases } = data;

  const biggestOver = manhattan.reduce<{ overNumber: number; runs: number } | null>(
    (best, bar) => (!best || bar.runs > best.runs ? { overNumber: bar.overNumber, runs: bar.runs } : best),
    null
  );

  const bestPhase = phases.reduce<PhaseSummaryRow | null>(
    (best, p) => (!best || (p.runRate ?? 0) > (best.runRate ?? 0) ? p : best),
    null
  );

  const economicalPhase = phases
    .filter((p) => p.balls > 0 && p.runRate !== null)
    .reduce<PhaseSummaryRow | null>(
      (best, p) => (!best || (p.runRate ?? Infinity) < (best.runRate ?? Infinity) ? p : best),
      null
    );

  const highestPartnership = partnerships.reduce<{ runs: number; wicketNumber: number } | null>(
    (best, p) => (!best || p.runs > best.runs ? { runs: p.runs, wicketNumber: p.wicketNumber } : best),
    null
  );

  // Detect collapse: 3+ wickets within same 3-over window
  const wicketOvers = manhattan.filter((b) => b.wickets > 0);
  let collapseDetected = false;
  let collapseDescription: string | null = null;
  if (wicketOvers.length >= 3) {
    for (let i = 0; i <= wicketOvers.length - 3; i++) {
      const window = wicketOvers.slice(i, i + 3);
      const totalWickets = window.reduce((s, b) => s + b.wickets, 0);
      const overSpan = (window.at(-1)?.overNumber ?? 0) - (window[0]?.overNumber ?? 0);
      if (totalWickets >= 3 && overSpan <= 4) {
        collapseDetected = true;
        collapseDescription = `${totalWickets} wickets fell in overs ${window[0]?.overNumber ?? 0}–${window.at(-1)?.overNumber ?? 0}`;
        break;
      }
    }
  }

  return {
    bestScoringPhase: bestPhase?.label ?? null,
    mostEconomicalPhase: economicalPhase?.label ?? null,
    biggestOver,
    highestPartnership,
    collapseDetected,
    collapseDescription,
  };
}
