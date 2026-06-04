/**
 * lib/cricket/types.ts — Domain types for the cricket foundation.
 * Mirrors the shape of the 0013_cricket_foundation.sql and
 * 0015_cricket_league_admin_foundation.sql tables.
 */

export interface CricketLeague {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  seasonName: string | null;
  startDate: string | null;
  endDate: string | null;
  format: string;
  oversPerInnings: number;
  maxTeams: number | null;
  pointsWin: number;
  pointsLoss: number;
  pointsTie: number;
  pointsNoResult: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Extended league type including columns added in migration 0015. */
export interface CricketLeagueFull extends CricketLeague {
  visibility: string;
  registrationStatus: string;
  timezone: string;
  ballType: string | null;
  matchDays: string[];
  rulesSummary: string | null;
  contactEmail: string | null;
  websiteUrl: string | null;
  allowPublicScorecards: boolean;
  allowTeamRegistration: boolean;
  allowPlayerRegistration: boolean;
  requireAdminApproval: boolean;
}

export interface CricketLeagueSettings {
  id: string;
  leagueId: string;
  scoringMode: string;
  defaultOvers: number;
  maxPlayersPerTeam: number | null;
  minPlayersPerTeam: number | null;
  allowSubstitutes: boolean;
  allowSuperOver: boolean;
  allowDuckworthLewis: boolean;
  pointsWin: number;
  pointsLoss: number;
  pointsTie: number;
  pointsNoResult: number;
  netRunRateEnabled: boolean;
  bonusPointsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CricketLeagueMember {
  id: string;
  leagueId: string;
  userId: string;
  role: string;
  createdAt: string;
}

export interface CricketLeagueInvitation {
  id: string;
  leagueId: string;
  email: string;
  role: string;
  status: string;
  invitedBy: string | null;
  invitedAt: string;
  acceptedAt: string | null;
  expiresAt: string | null;
  token: string | null;
}

export interface CricketLeagueAdminAuditLog {
  id: string;
  leagueId: string | null;
  actorUserId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CricketTeam {
  id: string;
  leagueId: string | null;
  existingTeamId: string | null;
  name: string;
  shortName: string | null;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  homeGround: string | null;
  managerName: string | null;
  managerEmail: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CricketPlayer {
  id: string;
  userId: string | null;
  displayName: string;
  slug: string | null;
  battingStyle: string | null;
  bowlingStyle: string | null;
  role: string | null;
  profilePhotoUrl: string | null;
  bio: string | null;
  dateOfBirth: string | null;
  country: string | null;
  city: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CricketVenue {
  id: string;
  name: string;
  slug: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CricketMatch {
  id: string;
  leagueId: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  venueId: string | null;
  matchType: string;
  matchStatus: CricketMatchStatus;
  scheduledStart: string | null;
  oversPerInnings: number;
  tossWinnerTeamId: string | null;
  tossDecision: string | null;
  winnerTeamId: string | null;
  resultSummary: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CricketMatchStatus =
  | "scheduled"
  | "live"
  | "innings_break"
  | "completed"
  | "abandoned"
  | "cancelled";

export type CricketLeagueRole =
  | "owner"
  | "admin"
  | "manager"
  | "scorer"
  | "player"
  | "fan"
  | "member";

export type CricketLeagueVisibility = "private" | "unlisted" | "public";

export type CricketLeagueRegistrationStatus =
  | "draft"
  | "open"
  | "closed"
  | "archived";

export type CricketLeagueFormat =
  | "round_robin"
  | "knockout"
  | "group_stage"
  | "franchise"
  | "friendly"
  | "custom";

// ─── Team types (extended from migration 0016) ────────────────────────────────

/** Extended team type including registration/profile columns from migration 0016. */
export interface CricketTeamFull extends CricketTeam {
  registrationStatus: string;
  approvalStatus: string;
  teamType: string;
  description: string | null;
  foundedYear: number | null;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  captainPlayerId: string | null;
  viceCaptainPlayerId: string | null;
  coachName: string | null;
  scorerName: string | null;
  isActive: boolean;
  archivedAt: string | null;
}

export interface CricketTeamMember {
  id: string;
  cricketTeamId: string;
  userId: string;
  role: string;
  invitedBy: string | null;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CricketTeamInvitation {
  id: string;
  cricketTeamId: string;
  email: string;
  role: string;
  status: string;
  invitedBy: string | null;
  token: string | null;
  invitedAt: string;
  acceptedAt: string | null;
  expiresAt: string | null;
}

export type CricketTeamRole =
  | "owner"
  | "manager"
  | "coach"
  | "captain"
  | "vice_captain"
  | "scorer"
  | "analyst"
  | "player"
  | "member";

export type CricketTeamRegistrationStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "archived";

// ─── Player types (extended from migration 0016) ──────────────────────────────

/** Extended player type including profile/availability columns from migration 0016. */
export interface CricketPlayerFull extends CricketPlayer {
  email: string | null;
  phone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  gender: string | null;
  dominantHand: string | null;
  primaryRole: string | null;
  secondaryRole: string | null;
  battingOrderPreference: number | null;
  bowlingType: string | null;
  fieldingPositionPreference: string | null;
  availabilityStatus: string;
  isVerified: boolean;
}

// ─── Roster entry (cricket_team_rosters) ─────────────────────────────────────

export interface CricketRosterEntry {
  id: string;
  cricketTeamId: string;
  cricketPlayerId: string;
  jerseyNumber: string | null;
  rosterRole: string | null;
  isCaptain: boolean;
  isViceCaptain: boolean;
  joinedAt: string;
}

/** Roster entry joined with player data for display. */
export interface CricketRosterEntryWithPlayer extends CricketRosterEntry {
  player: CricketPlayerFull;
}

// ─── Roster change log ────────────────────────────────────────────────────────

export interface CricketRosterChangeLog {
  id: string;
  cricketTeamId: string | null;
  cricketPlayerId: string | null;
  actorUserId: string | null;
  action: string;
  oldValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
  createdAt: string;
}

// ─── Player document ──────────────────────────────────────────────────────────

export interface CricketPlayerDocument {
  id: string;
  cricketPlayerId: string;
  documentType: string;
  fileUrl: string | null;
  status: string;
  uploadedBy: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Venue (extended from migration 0017) ─────────────────────────────────────

export interface CricketVenueFull extends CricketVenue {
  shortName: string | null;
  venueType: string;
  capacity: number | null;
  timezone: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  bookingNotes: string | null;
  pitchType: string | null;
  boundarySizeMeters: number | null;
  hasLights: boolean;
  hasTurfPitch: boolean;
  hasMattingPitch: boolean;
  hasPracticeNets: boolean;
  hasChangingRooms: boolean;
  hasParking: boolean;
  isActive: boolean;
  archivedAt: string | null;
}

export interface CricketVenueAvailability {
  id: string;
  venueId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Match (extended from migrations 0017 + 0018) ────────────────────────────

/** Match extended with scorecard fields from migration 0018. */
export interface CricketMatchFull extends CricketMatch {
  slug: string | null;
  matchNumber: number | null;
  roundName: string | null;
  groupName: string | null;
  stage: string | null;
  title: string | null;
  scheduledEnd: string | null;
  timezone: string;
  publishStatus: CricketMatchPublishStatus;
  scheduleStatus: CricketMatchScheduleStatus;
  homeTeamLabel: string | null;
  awayTeamLabel: string | null;
  neutralMatch: boolean;
  scorerUserId: string | null;
  primaryUmpireName: string | null;
  secondaryUmpireName: string | null;
  matchRefereeName: string | null;
  livestreamUrl: string | null;
  notes: string | null;
  internalNotes: string | null;
  weatherNotes: string | null;
  cancellationReason: string | null;
  rescheduledFrom: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  // Scorecard fields (migration 0018)
  tossWinnerTeamId: string | null;
  tossDecision: string | null;
  matchResultType: string | null;
  resultMarginRuns: number | null;
  resultMarginWickets: number | null;
  resultMarginBallsRemaining: number | null;
  playerOfMatchId: string | null;
  resultConfirmedBy: string | null;
  resultConfirmedAt: string | null;
  scorecardStatus: CricketScorecardStatus;
  scoringMode: string;
  targetRuns: number | null;
  winningTeamId: string | null;
  losingTeamId: string | null;
  resultSummary: string | null;
}

/** Match with joined team/venue/league names for display. */
export interface CricketMatchWithTeams extends CricketMatchFull {
  homeTeam: CricketTeam | null;
  awayTeam: CricketTeam | null;
  venue: CricketVenueFull | null;
  leagueName: string | null;
  leagueSlug: string | null;
}

export type CricketMatchPublishStatus = "draft" | "published" | "hidden" | "archived";
export type CricketMatchScheduleStatus =
  | "unscheduled"
  | "scheduled"
  | "rescheduled"
  | "postponed"
  | "cancelled"
  | "completed";

// ─── Match official (migration 0017) ─────────────────────────────────────────

export interface CricketMatchOfficial {
  id: string;
  matchId: string;
  userId: string | null;
  name: string | null;
  email: string | null;
  role: string;
  status: string;
  assignedBy: string | null;
  assignedAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Schedule change log (migration 0017) ────────────────────────────────────

export interface CricketScheduleChangeLog {
  id: string;
  leagueId: string | null;
  matchId: string | null;
  actorUserId: string | null;
  action: string;
  oldValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
  createdAt: string;
}

// ─── Schedule generation run (migration 0017) ─────────────────────────────────

export interface CricketScheduleGenerationRun {
  id: string;
  leagueId: string;
  generatedBy: string | null;
  algorithm: string;
  input: Record<string, unknown>;
  outputSummary: Record<string, unknown>;
  status: string;
  createdAt: string;
}

// ─── Scheduling types ─────────────────────────────────────────────────────────

export interface ScheduledFixture {
  homeTeamId: string;
  awayTeamId: string;
  roundNumber: number;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  venueId: string | null;
}

export interface ScheduleConflict {
  type: "team_double_booked" | "venue_double_booked" | "same_team" | "invalid_time_range" | "missing_start";
  matchA?: Partial<CricketMatchFull>;
  matchB?: Partial<CricketMatchFull>;
  description: string;
  suggestion: string;
}

export interface ScheduleSummary {
  totalMatches: number;
  totalRounds: number;
  teamsCount: number;
  venueUsageCounts: Record<string, number>;
  unscheduledCount: number;
  conflictCount: number;
}

// ─── Scorecard types (migration 0018) ────────────────────────────────────────

export type CricketScorecardStatus =
  | "not_started"
  | "setup"
  | "in_progress"
  | "completed"
  | "locked"
  | "disputed";

export type CricketInningsStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "declared"
  | "forfeited";

export type CricketDismissalType =
  | "not_out"
  | "bowled"
  | "caught"
  | "caught_behind"
  | "lbw"
  | "run_out"
  | "stumped"
  | "hit_wicket"
  | "retired_hurt"
  | "retired_out"
  | "obstructing_field"
  | "hit_ball_twice"
  | "timed_out"
  | "handled_ball"
  | "did_not_bat"
  | "absent_hurt"
  | "unknown";

export type CricketMatchResultType =
  | "home_win"
  | "away_win"
  | "tie"
  | "no_result"
  | "abandoned"
  | "cancelled"
  | "forfeited"
  | "draw"
  | "unknown";

export interface CricketMatchSquad {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string;
  rosterEntryId: string | null;
  isPlayingXi: boolean;
  isSubstitute: boolean;
  battingPosition: number | null;
  isCaptain: boolean;
  isWicketkeeper: boolean;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CricketMatchSquadWithPlayer extends CricketMatchSquad {
  player: CricketPlayerFull;
}

export interface CricketInnings {
  id: string;
  matchId: string;
  inningsNumber: number;
  battingTeamId: string;
  bowlingTeamId: string;
  declared: boolean;
  forfeited: boolean;
  allOut: boolean;
  totalRuns: number;
  wicketsLost: number;
  ballsBowled: number;
  oversText: string | null;
  extrasTotal: number;
  byes: number;
  legByes: number;
  wides: number;
  noBalls: number;
  penaltyRuns: number;
  targetRuns: number | null;
  runRate: number | null;
  requiredRunRate: number | null;
  inningsStatus: CricketInningsStatus;
  startedAt: string | null;
  endedAt: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CricketBattingEntry {
  id: string;
  inningsId: string;
  matchId: string;
  teamId: string;
  playerId: string;
  battingPosition: number | null;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  minutes: number | null;
  strikeRate: number | null;
  dismissalType: string | null;
  dismissedByPlayerId: string | null;
  bowlerPlayerId: string | null;
  fielderPlayerId: string | null;
  isOut: boolean;
  didNotBat: boolean;
  retiredHurt: boolean;
  retiredOut: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CricketBattingEntryWithPlayer extends CricketBattingEntry {
  playerName: string;
  playerSlug: string | null;
  bowlerName: string | null;
  fielderName: string | null;
}

export interface CricketBowlingEntry {
  id: string;
  inningsId: string;
  matchId: string;
  teamId: string;
  playerId: string;
  ballsBowled: number;
  oversText: string | null;
  maidens: number;
  runsConceded: number;
  wickets: number;
  wides: number;
  noBalls: number;
  economyRate: number | null;
  dots: number;
  foursConceded: number;
  sixesConceded: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CricketBowlingEntryWithPlayer extends CricketBowlingEntry {
  playerName: string;
  playerSlug: string | null;
}

export interface CricketFallOfWicket {
  id: string;
  inningsId: string;
  matchId: string;
  wicketNumber: number;
  teamScore: number;
  ballsElapsed: number | null;
  oversText: string | null;
  playerOutId: string | null;
  partnershipRuns: number | null;
  partnershipBalls: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CricketPartnership {
  id: string;
  inningsId: string;
  matchId: string;
  wicketNumber: number | null;
  playerOneId: string | null;
  playerTwoId: string | null;
  runs: number;
  balls: number;
  startScore: number | null;
  endScore: number | null;
  startBall: number | null;
  endBall: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CricketScorecardChangeLog {
  id: string;
  matchId: string | null;
  inningsId: string | null;
  actorUserId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  oldValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
  createdAt: string;
}

/** Full scorecard assembled from multiple tables. */
export interface CricketFullScorecard {
  match: CricketMatchFull;
  innings: CricketInnings[];
  battingEntries: Record<string, CricketBattingEntryWithPlayer[]>; // keyed by inningsId
  bowlingEntries: Record<string, CricketBowlingEntryWithPlayer[]>; // keyed by inningsId
  fallOfWickets: Record<string, CricketFallOfWicket[]>;           // keyed by inningsId
  partnerships: Record<string, CricketPartnership[]>;              // keyed by inningsId
  squads: CricketMatchSquadWithPlayer[];
  homeTeam: CricketTeam | null;
  awayTeam: CricketTeam | null;
  leagueName: string | null;
  leagueSlug: string | null;
}

// ─── Standings types (migration 0020) ────────────────────────────────────────

export type StandingsFormResult = "W" | "L" | "T" | "NR" | "A";

export interface CricketTeamStanding {
  id: string;
  leagueId: string;
  teamId: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  noResults: number;
  abandoned: number;
  forfeitsFor: number;
  forfeitsAgainst: number;
  points: number;
  bonusPoints: number;
  totalPoints: number;
  runsFor: number;
  ballsFor: number;
  runsAgainst: number;
  ballsAgainst: number;
  wicketsFor: number;
  wicketsAgainst: number;
  netRunRate: number;
  position: number | null;
  previousPosition: number | null;
  form: StandingsFormResult[];
  lastMatchId: string | null;
  calculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CricketTeamStandingWithTeam extends CricketTeamStanding {
  teamName: string;
  teamShortName: string | null;
  teamSlug: string;
  teamPrimaryColor: string | null;
}

export interface CricketStandingsSnapshot {
  id: string;
  leagueId: string;
  snapshotType: string;
  generatedBy: string | null;
  standings: unknown[];
  summary: Record<string, unknown>;
  createdAt: string;
}

export interface CricketMatchTeamResult {
  id: string;
  matchId: string;
  leagueId: string | null;
  teamId: string;
  opponentTeamId: string | null;
  result: string;
  points: number;
  bonusPoints: number;
  runsFor: number;
  ballsFor: number;
  wicketsLost: number;
  runsAgainst: number;
  ballsAgainst: number;
  wicketsTaken: number;
  netRunRateDelta: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Player stats types (migration 0020) ─────────────────────────────────────

export interface CricketPlayerStats {
  id: string;
  leagueId: string | null;
  teamId: string | null;
  playerId: string;
  matchesPlayed: number;
  inningsBatted: number;
  notOuts: number;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  highestScore: number;
  battingAverage: number | null;
  battingStrikeRate: number | null;
  ducks: number;
  fifties: number;
  hundreds: number;
  inningsBowled: number;
  ballsBowled: number;
  runsConceded: number;
  wickets: number;
  maidens: number;
  wides: number;
  noBalls: number;
  bowlingAverage: number | null;
  economyRate: number | null;
  bowlingStrikeRate: number | null;
  bestBowlingWickets: number;
  bestBowlingRuns: number | null;
  catches: number;
  stumpings: number;
  runOuts: number;
  calculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CricketPlayerStatsWithPlayer extends CricketPlayerStats {
  playerName: string;
  playerSlug: string | null;
  teamName: string | null;
  teamSlug: string | null;
}

export type CricketLeaderboardType =
  | "batting_runs"
  | "batting_average"
  | "batting_strike_rate"
  | "highest_score"
  | "bowling_wickets"
  | "bowling_average"
  | "economy_rate"
  | "bowling_strike_rate"
  | "fielding_catches"
  | "all_rounder_index"
  | "team_nrr"
  | "team_points";

export interface CricketLeaderboardSnapshot {
  id: string;
  leagueId: string | null;
  leaderboardType: string;
  generatedBy: string | null;
  data: unknown[];
  summary: Record<string, unknown>;
  createdAt: string;
}

export interface LeaderboardFilter {
  leagueId: string;
  teamId?: string;
  leaderboardType: CricketLeaderboardType;
  minMatches?: number;
  minInnings?: number;
  minBalls?: number;
  limit?: number;
  sortDirection?: "asc" | "desc";
}

// ─── Analytics types (migration 0021) ────────────────────────────────────────

export type WagonZone =
  | "third_man"
  | "point"
  | "cover"
  | "mid_off"
  | "straight"
  | "mid_on"
  | "mid_wicket"
  | "square_leg"
  | "fine_leg"
  | "unknown";

export type BattingPhase =
  | "powerplay"
  | "middle_overs"
  | "death_overs"
  | "chase_setup"
  | "chase_finish"
  | "unknown";

export type BowlingPhase =
  | "new_ball"
  | "middle_overs"
  | "death_overs"
  | "spin_phase"
  | "pace_phase"
  | "unknown";

export type BatContactType =
  | "middle"
  | "edge"
  | "inside_edge"
  | "top_edge"
  | "missed"
  | "pad"
  | "unknown";

export type AnalyticsChartType =
  | "worm"
  | "manhattan"
  | "run_rate"
  | "wagon_wheel"
  | "partnerships"
  | "momentum"
  | "phase_summary";

/** A ball event row extended with visual analytics columns from migration 0021. */
export interface CricketBallEventAnalytics {
  id: string;
  matchId: string;
  inningsId: string;
  battingTeamId: string;
  bowlingTeamId: string;
  overNumber: number;
  ballInOver: number;
  legalBallNumber: number | null;
  inningsBallNumber: number | null;
  strikerId: string | null;
  nonStrikerId: string | null;
  bowlerId: string | null;
  runsBatter: number;
  runsExtras: number;
  runsTotal: number;
  extraType: string | null;
  wicketType: string | null;
  playerOutId: string | null;
  isLegalDelivery: boolean;
  isWicket: boolean;
  isBoundaryFour: boolean;
  isBoundarySix: boolean;
  isDotBall: boolean;
  shotType: string | null;
  lineLengthText: string | null;
  fieldingPosition: string | null;
  // Analytics columns (0021)
  shotX: number | null;
  shotY: number | null;
  wagonZone: WagonZone | null;
  wagonAngleDegrees: number | null;
  wagonDistanceMeters: number | null;
  batContactType: BatContactType | null;
  battingPhase: BattingPhase | null;
  bowlingPhase: BowlingPhase | null;
  pressureIndex: number | null;
  momentumDelta: number | null;
  expectedRuns: number | null;
  expectedWicketProbability: number | null;
  isDeleted: boolean;
  createdAt: string;
}

export interface CricketMatchAnalyticsSnapshot {
  id: string;
  matchId: string;
  leagueId: string | null;
  snapshotType: string;
  generatedBy: string | null;
  data: Record<string, unknown>;
  summary: Record<string, unknown>;
  createdAt: string;
}

// ─── Chart data shapes ────────────────────────────────────────────────────────

export interface WormChartPoint {
  inningsId: string;
  teamId: string;
  ballNumber: number;
  overText: string;
  cumulativeRuns: number;
  wickets: number;
  label: string;
}

export interface ManhattanChartBar {
  inningsId: string;
  overNumber: number;
  runs: number;
  wickets: number;
  boundaries: number;
  extras: number;
}

export interface RunRatePoint {
  overText: string;
  overNumber: number;
  currentRunRate: number | null;
  requiredRunRate: number | null;
  runs: number;
  balls: number;
  wickets: number;
}

export interface PartnershipChartRow {
  wicketNumber: number;
  playerOneName: string;
  playerTwoName: string;
  runs: number;
  balls: number;
  runRate: number | null;
  startScore: number | null;
  endScore: number | null;
}

export interface WagonZoneSummary {
  zoneName: WagonZone;
  runs: number;
  balls: number;
  boundaries: number;
  percentage: number;
}

export interface WagonWheelData {
  zones: WagonZoneSummary[];
  hasShotCoordinates: boolean;
  reason: string | null;
  totalRuns: number;
  totalBalls: number;
}

export interface PhaseSummaryRow {
  phase: BattingPhase;
  label: string;
  runs: number;
  wickets: number;
  balls: number;
  runRate: number | null;
  boundaries: number;
  dotBallPercentage: number | null;
}

export interface MomentumPoint {
  overNumber: number;
  battingTeamMomentum: number;
  bowlingTeamMomentum: number;
  explanation: string;
}

export interface MatchAnalyticsSummary {
  bestScoringPhase: string | null;
  mostEconomicalPhase: string | null;
  biggestOver: { overNumber: number; runs: number } | null;
  highestPartnership: { runs: number; wicketNumber: number } | null;
  collapseDetected: boolean;
  collapseDescription: string | null;
}

// ─── Streaming & Broadcast Types ─────────────────────────────────────────────

export type StreamProvider = "overlay_only" | "youtube" | "twitch" | "custom_rtmp" | "external_embed";
export type StreamStatus = "not_configured" | "scheduled" | "ready" | "live" | "paused" | "ended" | "failed" | "archived";
export type StreamVisibility = "private" | "league" | "unlisted" | "public";
export type BroadcastStatus = "not_configured" | "setup" | "ready" | "live" | "ended" | "failed";
export type OverlayLayout = "classic_scorebug" | "lower_third" | "full_scorecard" | "innings_summary" | "toss_card" | "result_card" | "minimal" | "vertical_mobile";
export type OverlayScope = "match_overlay" | "scorebug" | "full_overlay" | "read_only_stream";
export type StreamHealthStatus = "unknown" | "healthy" | "warning" | "critical" | "offline";

export interface CricketStreamingChannel {
  id: string;
  leagueId: string | null;
  teamId: string | null;
  name: string;
  slug: string;
  provider: StreamProvider;
  providerChannelId: string | null;
  publicWatchUrl: string | null;
  embedUrl: string | null;
  rtmpIngestUrl: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CricketMatchStream {
  id: string;
  matchId: string;
  leagueId: string | null;
  channelId: string | null;
  title: string;
  description: string | null;
  status: StreamStatus;
  provider: StreamProvider;
  publicWatchUrl: string | null;
  embedUrl: string | null;
  scheduledStart: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  visibility: StreamVisibility;
  allowPublicEmbed: boolean;
  overlayThemeId: string | null;
  streamOperatorUserId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CricketOverlayTheme {
  id: string;
  leagueId: string | null;
  teamId: string | null;
  name: string;
  slug: string;
  layout: OverlayLayout;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  textColor: string | null;
  backgroundColor: string | null;
  logoUrl: string | null;
  sponsorLogoUrl: string | null;
  sponsorText: string | null;
  fontFamily: string | null;
  safeAreaTop: number;
  safeAreaBottom: number;
  safeAreaLeft: number;
  safeAreaRight: number;
  isDefault: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CricketOverlayToken {
  id: string;
  matchId: string;
  leagueId: string | null;
  tokenPrefix: string;
  label: string | null;
  scope: OverlayScope;
  expiresAt: string | null;
  revokedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface CricketStreamEvent {
  id: string;
  matchStreamId: string | null;
  matchId: string | null;
  leagueId: string | null;
  actorUserId: string | null;
  eventType: string;
  eventPayload: Record<string, unknown>;
  createdAt: string;
}

export interface CricketStreamHealthCheck {
  id: string;
  matchStreamId: string | null;
  matchId: string | null;
  status: StreamHealthStatus;
  latencyMs: number | null;
  droppedFrames: number | null;
  bitrateKbps: number | null;
  viewerCount: number | null;
  message: string | null;
  checkedAt: string;
  createdBy: string | null;
}

export interface CricketBroadcastChecklist {
  id: string;
  matchId: string;
  matchStreamId: string | null;
  checklistKey: string;
  label: string;
  completed: boolean;
  completedBy: string | null;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Overlay View Models ──────────────────────────────────────────────────────

export interface ScorebugOverlayData {
  matchTitle: string;
  leagueName: string | null;
  battingTeamShortName: string;
  bowlingTeamShortName: string;
  scoreText: string;
  oversText: string;
  runRate: string | null;
  targetText: string | null;
  strikerName: string | null;
  strikerRunsBalls: string | null;
  nonStrikerName: string | null;
  nonStrikerRunsBalls: string | null;
  bowlerName: string | null;
  bowlerFigures: string | null;
  lastBalls: string[];
  statusLabel: string;
}

export interface LowerThirdData {
  playerName: string;
  role: string | null;
  statLine: string | null;
  teamName: string | null;
  imageUrl: string | null;
}

export interface TossOverlayData {
  tossWinner: string;
  decision: string;
  homeTeam: string;
  awayTeam: string;
  venue: string | null;
  matchTitle: string;
}

export interface InningsBreakOverlayData {
  battingTeam: string;
  score: string;
  target: number;
  topBatter: string | null;
  topBatterScore: string | null;
  topBowler: string | null;
  topBowlerFigures: string | null;
  chaseRequirement: string;
  oversToChase: string | null;
}

export interface ResultOverlayData {
  winner: string;
  margin: string;
  playerOfMatch: string | null;
  team1Score: string;
  team2Score: string;
  matchTitle: string;
}

export interface FullScorecardOverlayData {
  battingTeam: string;
  bowlingTeam: string;
  batting: Array<{ name: string; runs: number; balls: number; fours: number; sixes: number; sr: string; howOut: string }>;
  bowling: Array<{ name: string; overs: string; maidens: number; runs: number; wickets: number; economy: string }>;
  extras: number;
  total: string;
}

export type OverlayStatus = "not_configured" | "ready" | "live" | "innings_break" | "completed" | "error";

export interface BroadcastChecklistDefaults {
  key: string;
  label: string;
  sortOrder: number;
}
