# GameIQ — Roster Management

> This document describes the player roster feature: data model, fields, permissions, routes, data access functions, archive vs delete behavior, and how roster data feeds future AI reports.

---

## 1. Purpose

The roster is the foundational player data store for GameIQ. It is not just a directory — it is a data layer that powers the AI product:

- **Player-by-player AI feedback** — each player in a report is linked to a roster record.
- **Insight references** — coaching insights can reference specific players by ID.
- **Timestamp tagging** — event timestamps are tagged with player IDs from the roster.
- **Private player summaries** — future player-facing reports use roster player IDs for identity.
- **Development history** — future multi-game analysis will track player metrics over time by player ID.

Roster data should be set up before creating the first game analysis for best AI output quality.

---

## 2. Player Data Model

Defined in `types/database.ts`:

```ts
export type PlayerStatus =
  | "active"
  | "inactive"
  | "injured"
  | "graduated"
  | "archived";

export interface Player {
  id: string;
  teamId: string;
  userId: string | null;        // future: linked to a user account
  firstName: string;
  lastName: string | null;
  displayName: string | null;   // auto-derived if not set
  jerseyNumber: string | null;
  position: string | null;
  role: string | null;          // e.g. Captain, Starter, Wicketkeeper
  dominantSide: string | null;  // Right | Left | Both | Unknown
  classYear: string | null;
  height: string | null;
  weight: string | null;
  status: PlayerStatus | string;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

### Display name derivation

If `displayName` is not explicitly set, the data access layer derives it from `firstName + lastName`. This means the UI always shows a clean, complete name without requiring coaches to fill in a separate field.

---

## 3. Player Fields

| Field | Required | Notes |
|-------|----------|-------|
| `first_name` | Yes | Minimum required field |
| `last_name` | No | Combined with first name for display |
| `display_name` | No | Auto-derived if blank |
| `jersey_number` | No | Text, not integer (supports "99", "00", etc.) |
| `position` | No | Free text (e.g. Midfielder, Point Guard) |
| `role` | No | Free text with suggestions (e.g. Captain, Starter) |
| `dominant_side` | No | Right / Left / Both / Unknown |
| `class_year` | No | e.g. "2025", "Senior" |
| `height` | No | Free text (e.g. 6'2", 188cm) |
| `weight` | No | Free text (e.g. 185 lbs, 84kg) |
| `status` | Yes (default: active) | See PlayerStatus enum |
| `notes` | No | Internal coaching notes, max 1000 chars |
| `metadata` | No | JSONB, for future sport-specific extensions |

### Status values

| Status | Description |
|--------|-------------|
| `active` | Available for game assignments and reports |
| `inactive` | On roster but not available (personal reasons, leave, etc.) |
| `injured` | Currently injured |
| `graduated` | Left the program, historical record preserved |
| `archived` | Hidden from active roster; record preserved |

---

## 4. Permissions

| Action | owner | coach | analyst | player | viewer |
|--------|-------|-------|---------|--------|--------|
| View roster | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add player | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit player | ✅ | ✅ | ✅ | ❌ | ❌ |
| Archive player | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete permanently | ✅ | ✅ | ❌ | ❌ | ❌ |

Authorization is enforced at two layers:
1. **Application layer**: The `new` and `edit` pages check the user's role and return `notFound()` for unauthorized access, preventing even the URL being usable.
2. **RLS layer**: Supabase enforces `is_team_staff` for INSERT/UPDATE and `is_team_manager` for DELETE. A bypass attempt via direct API would still fail.

---

## 5. Routes

| Route | Description |
|-------|-------------|
| `/teams/[teamId]/players` | Roster list with search/filter and stats |
| `/teams/[teamId]/players/new` | Add player form (staff only) |
| `/teams/[teamId]/players/[playerId]/edit` | Edit player + archive/delete (staff only) |

### Route-based approach

Forms use dedicated pages rather than modals. This gives:
- Clean URLs and back-navigation support
- Server Component data fetching for default values
- No client-side modal state complexity

---

## 6. Data Access Functions (`lib/db/players.ts`)

| Function | Returns | Description |
|----------|---------|-------------|
| `getPlayersForTeam(teamId, { includeArchived })` | `Player[]` | All players for a team; excludes archived by default |
| `getPlayerByIdForTeam(teamId, playerId)` | `Player \| null` | Single player scoped to team |
| `getTeamPlayerCount(teamId)` | `{ total, active }` | Count query for workspace cards |
| `getPlayerCountsForTeams(teamIds)` | `Record<string, { total, active }>` | Batch count query for dashboard |
| `createPlayerForTeam(input)` | `Player` | Creates player; throws on failure |
| `updatePlayerForTeam(input)` | `Player` | Updates player; auto-recomputes display_name |
| `archivePlayerForTeam(teamId, playerId)` | `void` | Sets status='archived'; throws on failure |
| `deletePlayerForTeam(teamId, playerId)` | `void` | Permanent delete; throws on failure |
| `deriveDisplayName(firstName, lastName, displayName)` | `string` | Exported utility |

---

## 7. Archive vs Delete Behavior

### Archive (preferred for most cases)

- Sets `status = 'archived'`
- Player is hidden from the roster by default
- Can be viewed by toggling the "Archived" status filter
- All historical references (future game reports, timestamps) remain intact
- Any staff member can archive (is_team_staff)

### Permanent delete

- Removes the player record entirely
- Future game reports and timestamps that referenced this player will retain the display name string but lose the player ID link
- Only available to team managers (owner/coach)
- Requires explicit confirmation UI (two-click: button → confirm)

**Recommendation:** Use archive in almost all cases. Reserve delete for test data or duplicate records.

---

## 8. UI Components

| Component | Location | Description |
|-----------|----------|-------------|
| `PlayerStatusBadge` | `components/players/` | Colored badge for player status |
| `PlayerEmptyState` | `components/players/` | Empty roster state with CTA |
| `PlayerRosterStats` | `components/players/` | 4-card stat grid (total, active, positions, missing #) |
| `PlayerCard` | `components/players/` | Player row in roster list |
| `RosterList` | `components/players/` | Client component: filter controls + PlayerCard list |
| `PlayerForm` | `components/players/` | Shared create/edit form (useActionState, both modes) |
| `ArchivePlayerForm` | `components/players/` | Archive + delete confirmation with inline flow |

---

## 9. Search and Filtering

The `RosterList` component filters client-side (no additional network requests). Given typical roster sizes (< 100 players), this is optimal.

Filter dimensions:
- **Text search**: name, jersey number, position
- **Status**: All / Active / Inactive / Injured / Graduated / Archived
- **Position**: dynamically populated from the fetched player list

The server fetches all players (including archived) once; the client filters from that dataset. Archived players are only visible when the "Archived" status filter is selected.

---

## 10. Dashboard Integration

The `/dashboard` page fetches player counts for all user teams in a single batch query (`getPlayerCountsForTeams`). This count is used:
- In `TeamCard` to show "X active · Y total players"
- In `SetupChecklist` to mark step 2 (Add roster) as complete if any team has ≥ 1 player

---

## 11. Current Limitations

- **No user account linking**: `players.user_id` exists but is always null in v1. Future phases will allow players to link their profile to their player record for self-service report access.
- **No sport-specific positions**: Positions are free text. A future sport-specific position picker (from a constrained list per sport) is planned.
- **No bulk import**: Players must be added one at a time. CSV import is a future enhancement.
- **No photo upload**: `metadata` is available for future photo URL storage but no upload UI exists yet.
- **Notes are internal**: In v1, player notes are not visible to the player themselves. A future player-facing view will require a separate field.

---

## 12. How Roster Data Feeds AI Reports

When game analysis runs (Phase 7+), the AI system will:

1. Fetch the team roster as part of the analysis input snapshot.
2. Use player IDs in event timestamps to generate player-specific sections.
3. Generate individual `player_reports` linked to `player_id`.
4. Reference player names in `coaching_insights.affected_player_ids`.
5. Assign practice recommendations to specific players via `player_ids`.

The quality of AI feedback depends directly on roster completeness. A roster with jersey numbers, positions, and roles allows the AI to produce better-differentiated feedback than a roster with first names only.

---

## 13. Future Improvements

- Player photo upload (Supabase Storage)
- CSV/spreadsheet import
- Player user account linking (player self-service view)
- Sport-specific position picker per sport type
- Position and role tag cloud visualization
- Player development history across multiple games
- Duplicate player detection (same name/jersey)
- Bulk archive
