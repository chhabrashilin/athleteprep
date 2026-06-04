/**
 * lib/cricket/leaderboards/queries.ts
 * Leaderboard-specific query helpers.
 * Call only from Server Components, Server Actions, or Route Handlers.
 */

export {
  getCricketBattingLeaderboard,
  getCricketBowlingLeaderboard,
  getCricketFieldingLeaderboard,
  getCricketAllRounderLeaderboard,
  getCricketTeamStatsSummary,
} from "@/lib/cricket/stats/queries";
