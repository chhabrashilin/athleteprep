import { z } from "zod";

const ALLOWED_CHART_TYPES = [
  "worm",
  "manhattan",
  "run_rate",
  "wagon_wheel",
  "partnerships",
  "momentum",
  "phase_summary",
] as const;

export const analyticsFilterSchema = z.object({
  matchId: z.string().uuid().optional(),
  leagueId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  playerId: z.string().uuid().optional(),
  inningsId: z.string().uuid().optional(),
  chartType: z.enum(ALLOWED_CHART_TYPES),
  startOver: z.number().int().min(0).optional(),
  endOver: z.number().int().min(0).optional(),
  phase: z.enum(["powerplay", "middle_overs", "death_overs", "chase_setup", "chase_finish"]).optional(),
}).refine(
  (data) => {
    if (data.startOver !== undefined && data.endOver !== undefined) {
      return data.endOver >= data.startOver;
    }
    return true;
  },
  { message: "endOver must be >= startOver", path: ["endOver"] }
);

export type AnalyticsFilterInput = z.infer<typeof analyticsFilterSchema>;

export const generateSnapshotSchema = z.object({
  matchId: z.string().uuid(),
  snapshotType: z.enum([
    "worm_chart", "manhattan_chart", "run_rate_graph", "wagon_wheel",
    "partnerships", "momentum", "phase_summary", "full_match_analytics",
  ]),
});

export type GenerateSnapshotInput = z.infer<typeof generateSnapshotSchema>;
