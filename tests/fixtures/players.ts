import type { AnalysisRosterPlayer } from "@/types/analysis";
import type { Player } from "@/types/database";

export const fixtureRosterPlayers: AnalysisRosterPlayer[] = [
  {
    id: "player-001",
    displayName: "Arjun Sharma",
    firstName: "Arjun",
    lastName: "Sharma",
    jerseyNumber: "7",
    position: "Batsman",
    role: "Captain",
    status: "active",
    notes: null,
  },
  {
    id: "player-002",
    displayName: "Priya Patel",
    firstName: "Priya",
    lastName: "Patel",
    jerseyNumber: "11",
    position: "Bowler",
    role: null,
    status: "active",
    notes: "Left-arm spinner",
  },
  {
    id: "player-003",
    displayName: "Sam Okafor",
    firstName: "Sam",
    lastName: "Okafor",
    jerseyNumber: "3",
    position: "Wicket-Keeper",
    role: null,
    status: "active",
    notes: null,
  },
];

export const fixtureDbPlayers: Player[] = fixtureRosterPlayers.map((p) => ({
  id: p.id,
  teamId: "team-001",
  userId: null,
  firstName: p.firstName,
  lastName: p.lastName ?? null,
  displayName: p.displayName,
  jerseyNumber: p.jerseyNumber ?? null,
  position: p.position ?? null,
  role: p.role ?? null,
  dominantSide: null,
  classYear: null,
  height: null,
  weight: null,
  status: p.status ?? "active",
  notes: p.notes ?? null,
  metadata: {},
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}));
