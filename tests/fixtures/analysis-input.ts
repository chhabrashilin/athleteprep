import type { AnalysisInputSnapshot } from "@/types/analysis";
import { fixtureRosterPlayers } from "./players";
import { fixtureEvents } from "./events";

export const fixtureSnapshot: AnalysisInputSnapshot = {
  team: {
    id: "team-001",
    name: "Madison Cricket XI",
    sport: "cricket",
    organizationName: "Madison University",
    level: "Varsity",
  },
  game: {
    id: "game-001",
    title: "Match vs Lakeside CC",
    sport: "cricket",
    gameType: "match",
    opponentName: "Lakeside CC",
    gameDate: "2026-05-15",
    homeAway: "home",
    venue: "Madison Oval",
    competitionName: "Midwest Cricket League",
    teamScore: "187",
    opponentScore: "165",
    result: "win",
    summaryNotes: "Strong batting performance in the first half.",
    coachNotes: "Arjun's footwork was exceptional against the spin bowling.",
    opponentNotes: "Their top-order is aggressive but struggles against left-arm spin.",
  },
  roster: fixtureRosterPlayers,
  video: {
    id: "video-001",
    fileName: "match_lakeside_cc.mp4",
    durationSeconds: 7200,
    uploadStatus: "uploaded",
    processingStatus: "completed",
  },
  events: fixtureEvents,
  generatedAt: "2026-05-15T20:00:00Z",
};
