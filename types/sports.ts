export type SportType =
  | "soccer"
  | "cricket"
  | "basketball"
  | "american_football"
  | "hockey"
  | "volleyball"
  | "other";

export type TeamContext =
  | "own_team"
  | "opponent"
  | "both"
  | "neutral"
  | "unknown";

export type GameType = "match" | "practice" | "scrimmage" | "film_session";

export type HomeAwayStatus = "home" | "away" | "neutral" | "not_applicable";

export type EventImportance = "low" | "medium" | "high" | "critical";

export type PlayerPosition = string;

export interface Score {
  team: number;
  opponent: number;
}

export interface GameMetadata {
  sport: SportType;
  gameType: GameType;
  date: string;
  opponent?: string;
  homeAway: HomeAwayStatus;
  venue?: string;
  competitionType?: string;
  score?: Score;
  coachNotes?: string;
  opponentNotes?: string;
}

export interface EventTypeOption {
  value: string;
  label: string;
  sport?: SportType;
}

export const SPORT_LABELS: Record<SportType, string> = {
  soccer: "Soccer",
  cricket: "Cricket",
  basketball: "Basketball",
  american_football: "American Football",
  hockey: "Hockey",
  volleyball: "Volleyball",
  other: "Other",
};

export const GAME_TYPE_LABELS: Record<GameType, string> = {
  match: "Match",
  practice: "Practice",
  scrimmage: "Scrimmage",
  film_session: "Film Session",
};

export const HOME_AWAY_LABELS: Record<HomeAwayStatus, string> = {
  home: "Home",
  away: "Away",
  neutral: "Neutral",
  not_applicable: "N/A",
};

export const IMPORTANCE_LABELS: Record<EventImportance, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const TEAM_CONTEXT_LABELS: Record<TeamContext, string> = {
  own_team: "Own team",
  opponent: "Opponent",
  both: "Both teams",
  neutral: "Neutral",
  unknown: "Unknown",
};

export const GENERIC_EVENT_TYPES: string[] = [
  "Turning point",
  "Mistake",
  "Scoring chance",
  "Defensive issue",
  "Transition moment",
  "Set piece",
  "Strong execution",
  "Missed opportunity",
  "Tactical pattern",
  "Player development moment",
  "Other",
];

export const SOCCER_EVENT_TYPES: string[] = [
  "Goal",
  "Shot chance",
  "Turnover",
  "Pressing moment",
  "Defensive shape",
  "Transition attack",
  "Transition defense",
  "Set piece",
  "Build-up pattern",
  "Off-ball run",
  "Other",
];

export const CRICKET_EVENT_TYPES: string[] = [
  "Wicket",
  "Boundary",
  "Dot-ball pressure",
  "Fielding error",
  "Bowling plan",
  "Batting decision",
  "Running between wickets",
  "Death over moment",
  "Powerplay moment",
  "Other",
];

export const BASKETBALL_EVENT_TYPES: string[] = [
  "Scoring play",
  "Defensive stop",
  "Turnover",
  "Transition opportunity",
  "Screen action",
  "Rebounding moment",
  "Foul situation",
  "Fast break",
  "Half-court set",
  "Other",
];

export function getEventTypesForSport(sport: SportType): string[] {
  switch (sport) {
    case "soccer":
      return SOCCER_EVENT_TYPES;
    case "cricket":
      return CRICKET_EVENT_TYPES;
    case "basketball":
      return BASKETBALL_EVENT_TYPES;
    default:
      return GENERIC_EVENT_TYPES;
  }
}
