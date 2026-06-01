# GameIQ — Game and Practice Creation

> This document describes the game/practice analysis record: what it is, its route structure, data model, permissions, setup checklist, data access functions, and how games connect to future features.

---

## 1. What Is a Game Record?

A "game" in GameIQ is the central analysis object. It can represent:

| Game type | Description |
|-----------|-------------|
| `match` | Official competitive game against an opponent |
| `practice` | Training session or practice |
| `scrimmage` | Internal scrimmage or preseason friendly |
| `film_session` | Film review session without live play |

The game record is the hub for:
- Video assets (uploaded film)
- Manual event timestamps (tagged moments)
- AI analysis jobs
- Generated reports (coaching insights, player reports, opponent tendencies, practice recommendations)

**Every AI report starts with a game record.** Creating the record is step one of the analysis workflow.

---

## 2. Route Structure

| Route | Description |
|-------|-------------|
| `/teams/[teamId]/games` | Game list with search/filter and stats |
| `/teams/[teamId]/games/new` | Create game form (staff only) |
| `/teams/[teamId]/games/[gameId]` | Game detail: header, workflow steps, setup checklist |
| `/teams/[teamId]/games/[gameId]/setup` | Analysis preparation checklist |
| `/teams/[teamId]/games/[gameId]/edit` | Edit game form + archive/delete (staff only) |
| `/teams/[teamId]/games/[gameId]/timestamps` | Placeholder — Phase 7 |
| `/teams/[teamId]/games/[gameId]/report` | Placeholder — Phase 7 |

All routes require team membership (via RLS). Staff-only routes (`/new`, `/edit`) additionally check the user's role and return `notFound()` for unauthorized access.

---

## 3. Game Data Model

Defined in `types/database.ts`:

```ts
export type GameStatus =
  | "draft"
  | "ready_for_analysis"
  | "analysis_running"
  | "analyzed"
  | "archived";

export interface Game {
  id: string;
  teamId: string;
  createdBy: string | null;
  sport: SportType;
  gameType: GameType;
  title: string;
  opponentName: string | null;
  gameDate: string | null;          // ISO date string "YYYY-MM-DD"
  startTime: string | null;         // reserved for future
  homeAway: HomeAwayStatus;         // defaults to "not_applicable"
  venue: string | null;
  competitionName: string | null;
  teamScore: string | null;         // text (supports "145/7" cricket notation)
  opponentScore: string | null;
  result: string | null;            // "Win" | "Loss" | "Draw" | "Not played" | "N/A"
  summaryNotes: string | null;
  coachNotes: string | null;        // primary AI input
  opponentNotes: string | null;     // feeds opponent tendencies section
  status: GameStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

### Status lifecycle

```
draft → ready_for_analysis → analysis_running → analyzed
                                                    ↓
                                                 archived
```

In Prompt 6, all games are created with `status = 'draft'`. Future phases will transition status as video, timestamps, and analysis are added.

---

## 4. Game Fields Reference

| Field | Required | Max length | Notes |
|-------|----------|-----------|-------|
| `title` | Yes | 120 chars | Clear, findable title |
| `sport` | Yes | — | Enum: SportType |
| `game_type` | Yes | — | Enum: GameType |
| `opponent_name` | No | 120 chars | Used in report headings |
| `game_date` | No | — | ISO date "YYYY-MM-DD" |
| `home_away` | No | — | Defaults to "not_applicable" |
| `venue` | No | 160 chars | Location of game |
| `competition_name` | No | 160 chars | League/tournament name |
| `team_score` | No | 40 chars | Text (allows cricket notation) |
| `opponent_score` | No | 40 chars | Same |
| `result` | No | — | Select: Win/Loss/Draw/Not played/N/A |
| `summary_notes` | No | 1500 chars | High-level notes in report header |
| `coach_notes` | No | 4000 chars | Primary AI input for insights |
| `opponent_notes` | No | 4000 chars | Used for opponent tendencies section |

---

## 5. Permissions

| Action | owner | coach | analyst | player | viewer |
|--------|-------|-------|---------|--------|--------|
| View game list | ✅ | ✅ | ✅ | ✅ | ✅ |
| View game detail | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create game | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit game | ✅ | ✅ | ✅ | ❌ | ❌ |
| Archive game | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete permanently | ✅ | ✅ | ❌ | ❌ | ❌ |

Authorization is enforced at two layers:
1. **Application layer**: `/new` and `/edit` pages check role and return `notFound()` for unauthorized access.
2. **RLS layer**: `is_team_staff` for INSERT/UPDATE, `is_team_manager` for DELETE.

---

## 6. Data Access Functions (`lib/db/games.ts`)

| Function | Returns | Description |
|----------|---------|-------------|
| `getGamesForTeam(teamId, opts)` | `Game[]` | All games; excludes archived by default |
| `getGameByIdForTeam(teamId, gameId)` | `Game \| null` | Single game scoped to team |
| `getTeamGameCount(teamId)` | `{ total, draft, analyzed }` | For workspace progress card |
| `getGameCountsForTeams(teamIds)` | `Record<string, { total, draft }>` | Batch for dashboard |
| `getGameSetupStatus(teamId, gameId)` | `GameSetupStatus \| null` | Analysis preparation status |
| `createGameForTeam(input)` | `Game` | Creates game as 'draft'; throws on failure |
| `updateGameForTeam(input)` | `Game` | Partial update; throws on failure |
| `archiveGameForTeam(teamId, gameId)` | `void` | Sets status='archived' |
| `deleteGameForTeam(teamId, gameId)` | `void` | Cascades to all linked records |

---

## 7. GameSetupStatus

`getGameSetupStatus` checks all analysis prerequisites for a given game:

```ts
interface GameSetupStatus {
  hasGameDetails: boolean;   // always true if game exists
  hasRoster: boolean;        // team has at least 1 active player
  hasVideo: boolean;         // video_assets table has a record for this game
  hasTimestamps: boolean;    // event_timestamps table has records for this game
  hasReport: boolean;        // game_reports table has a current report
  isReadyForAnalysis: boolean; // hasGameDetails && hasVideo && hasTimestamps
}
```

Currently `hasVideo` and `hasTimestamps` are always `false` (Phases 7 and 8 implement these). `hasRoster` is live.

---

## 8. Archive vs Delete Behavior

### Archive (preferred)
- Sets `status = 'archived'`
- Game is hidden from the list by default
- Visible when "Archived" status filter is selected
- All linked records (video, timestamps, reports) are preserved
- Any staff member can archive

### Permanent delete (managers only)
- Removes the game record
- **Cascades** to: `video_assets`, `event_timestamps`, `clips`, `analysis_jobs`, `game_reports`, `coaching_insights`, `player_reports`, `practice_recommendations`, `opponent_tendencies`, `verification_feedback`, `share_links`, `exports` (via DB ON DELETE CASCADE)
- Requires 2-click inline confirmation in `ArchiveGameForm`
- Only owners and coaches (managers) can delete

---

## 9. How Games Connect to Future Features

### Phase 7 — Video Upload
- `video_assets.game_id` → links video file metadata to this game
- `setupStatus.hasVideo` becomes `true`
- Video player embedded on game detail page

### Phase 7 — Event Timestamps
- `event_timestamps.game_id` → links tagged moments to this game
- `setupStatus.hasTimestamps` becomes `true`
- Timestamps become AI evidence references

### Phase 7 — AI Analysis
- `analysis_jobs.game_id` → tracks analysis request and status
- `game_reports.game_id` → stores generated report
- `coaching_insights.game_id` → individual insight cards
- `player_reports.game_id` → per-player feedback
- `practice_recommendations.game_id` → next-session drills
- `opponent_tendencies.game_id` → opponent pattern analysis

### Phase 8 — Sharing and Export
- `share_links.game_id` → token-based shared report access
- `exports.game_id` → PDF export tracking

---

## 10. UI Components

| Component | Location | Description |
|-----------|----------|-------------|
| `GameStatusBadge` | `components/games/` | Status-colored badge |
| `GameTypeBadge` | `components/games/` | Game type badge (match/practice/etc.) |
| `GameEmptyState` | `components/games/` | Empty state with product context |
| `GameSummaryStats` | `components/games/` | 4-card stat grid |
| `GameCard` | `components/games/` | Row in games list |
| `GameList` | `components/games/` | Client: search/filter + GameCard list |
| `GameOverviewHeader` | `components/games/` | Game identity block on detail page |
| `GameSetupChecklist` | `components/games/` | 5-step analysis workflow checklist |
| `GameForm` | `components/games/` | Shared create/edit form (4 sections) |
| `ArchiveGameForm` | `components/games/` | Archive + delete with inline confirmation |

---

## 11. Current Limitations

- **No video upload**: Video step in setup checklist is always incomplete in Prompt 6.
- **No timestamps**: Timestamp step always incomplete.
- **No AI analysis**: Report generation button is disabled.
- **Status is always 'draft'**: Transitions to `ready_for_analysis`, `analysis_running`, `analyzed` are triggered by future phases.
- **`start_time` not collected**: The form omits start time for v1 simplicity. The column exists and can be added to the form later.
- **No bulk game actions**: Games must be archived/deleted individually.
- **No game duplication**: Duplicating a game (e.g. for recurring practice records) is a future enhancement.

---

## 12. Future Improvements

- Video upload and playback on game detail page
- Timestamp editor synced to video player
- Analysis job creation and status streaming
- AI report generation and report dashboard
- Game duplication for recurring sessions
- CSV/schedule import for game fixture lists
- Bulk archive for season management
- Score and result import from external sources
