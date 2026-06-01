# GameIQ — Database Schema

> Authoritative reference for the GameIQ Postgres schema. Defined in `supabase/migrations/0001_initial_schema.sql`. Do not make schema changes without a corresponding migration file.

---

## Overview

GameIQ uses a Supabase-managed Postgres database. The schema is organized around these core concepts:

1. **Users and teams** — auth, profiles, membership, roles
2. **Roster** — players attached to teams
3. **Games** — the primary analysis unit (match, practice, scrimmage, film session)
4. **Video and events** — uploaded video assets and manually-tagged event timestamps
5. **Analysis pipeline** — jobs that run AI analysis on a game
6. **Reports** — structured AI output (insights, player reports, recommendations, tendencies)
7. **Collaboration** — verification feedback, share links, exports

---

## Schema Tables

| Table | Rows | Purpose |
|-------|------|---------|
| `profiles` | One per user | App profile linked to `auth.users` |
| `teams` | One per team | The core organizational workspace |
| `team_members` | Many per team | User membership and role assignment |
| `players` | Many per team | Roster players |
| `games` | Many per team | Game or practice sessions |
| `video_assets` | Many per game | Uploaded video file metadata |
| `event_timestamps` | Many per game | Manual or AI-detected events at specific video times |
| `clips` | Many per game | Time-bounded video clip references |
| `analysis_jobs` | Many per game | AI analysis request queue and status |
| `game_reports` | Many per game | Generated and versioned AI reports |
| `coaching_insights` | Many per report | Top structured coaching insights |
| `player_reports` | Many per report | Player-specific report sections |
| `practice_recommendations` | Many per report | Next-practice drill recommendations |
| `opponent_tendencies` | Many per report | Opponent patterns from notes/events |
| `verification_feedback` | Many per target | Immutable coach verification audit log |
| `share_links` | Many per report | Token-based shareable report access |
| `exports` | Many per report | PDF/export job tracking |

---

## Entity Relationships

```
auth.users
    └── profiles (1:1)
            └── default_team_id → teams

teams
    ├── team_members (N) → profiles
    ├── players (N)
    └── games (N)
            ├── video_assets (N)
            ├── event_timestamps (N)
            │       └── clips (N)
            ├── analysis_jobs (N)
            └── game_reports (N) [versioned]
                    ├── coaching_insights (N)
                    ├── player_reports (N) → players
                    ├── practice_recommendations (N)
                    └── opponent_tendencies (N)

game_reports
    ├── verification_feedback (N) [append-only]
    ├── share_links (N)
    └── exports (N)
```

---

## Enums

All enums are Postgres enum types in the `public` schema.

| Enum | Values |
|------|--------|
| `team_role` | `owner`, `coach`, `analyst`, `player`, `viewer` |
| `sport_type` | `soccer`, `cricket`, `basketball`, `american_football`, `hockey`, `volleyball`, `other` |
| `game_type` | `match`, `practice`, `scrimmage`, `film_session` |
| `home_away_status` | `home`, `away`, `neutral`, `not_applicable` |
| `event_importance` | `low`, `medium`, `high`, `critical` |
| `analysis_job_status` | `pending`, `running`, `completed`, `failed` |
| `confidence_level` | `high`, `medium`, `low` |
| `verification_status` | `unreviewed`, `accurate`, `partially_accurate`, `inaccurate`, `edited` |
| `share_visibility` | `staff_only`, `player_specific`, `public_summary`, `private_link` |
| `export_status` | `pending`, `processing`, `completed`, `failed` |
| `video_upload_status` | `pending`, `uploading`, `uploaded`, `failed` |
| `video_processing_status` | `not_started`, `pending`, `processing`, `completed`, `failed` |

---

## Key Design Decisions

### UUID Primary Keys
All tables use `uuid` primary keys with `gen_random_uuid()` as the default. This is consistent with Supabase's convention and avoids leaking sequential IDs.

### `created_at` / `updated_at`
All tables (except `verification_feedback`) have both timestamps. A shared `set_updated_at()` trigger function keeps `updated_at` current on every UPDATE.

### `team_id` Denormalization
Every table below `games` carries a `team_id` column. This is intentional — it enables RLS policies to be written as simple `is_team_member(team_id)` checks without needing expensive joins. It also makes multi-team data isolation reliable.

### Why `team_score` and `opponent_score` are text
Sports use different score formats:
- Soccer: `2`, `1`
- Cricket: `145/7`, `89`
- Basketball: `87`, `79`
Text preserves the original format without information loss.

### JSONB for AI Output and Metadata
- `game_reports.raw_ai_output` and `game_reports.edited_output`: stores the full AI response blob. Typed data is extracted into dedicated tables (coaching_insights, player_reports, etc.) for structured querying.
- `*.metadata`: flexible extension field on each table for sport-specific or future fields. Not queried in v1, but indexed by GIN if needed later.
- `coaching_insights.evidence`: array of evidence objects — typed in TypeScript but stored as JSONB since evidence items have variable shapes.
- `player_reports.key_moments`: array of moment objects — same rationale.
- `players.metadata`: sport-specific player attributes (sprint speed, batting avg, etc.) stored here to avoid one table per sport.

### Report Versioning
`game_reports.report_version` increments each time a report is regenerated for the same game. Only one report per game has `is_current = true`. When a new report is generated, previous reports are set to `is_current = false`, but their data is preserved for audit and rollback purposes.

### `verification_feedback` is Append-Only
Verification feedback is an immutable audit trail — coaches cannot edit or delete prior verification records. The current verification state is stored on the target row (`coaching_insights.verification_status`, etc.), and the feedback table records the full history.

### Event Timestamps Strategy
Event timestamps are the primary evidence input for AI analysis. Key design choices:
- `player_ids` is an array (`uuid[]`) — v1 simplicity. If N:N becomes complex, it becomes a join table.
- `is_ai_generated` flags events created by future automated detection vs. manual coach input.
- `confidence` is nullable — only set for AI-generated events.
- `team_context` values: `own_team`, `opponent`, `both`, or free text.

### Video and Clip Strategy
In v1, `clips` are virtual — they reference a `start_seconds` and `end_seconds` within a `video_asset` without physical extraction. `storage_path` is null until real clip extraction (FFmpeg) is implemented. The clip model is designed so physical extraction can be added without schema changes.

---

## Indexes

All foreign key columns are indexed. Additional indexes:

| Table | Column | Type | Reason |
|-------|--------|------|--------|
| `teams` | `slug` | btree | Unique lookup by slug |
| `games` | `game_date` | btree desc | Sorted game list |
| `event_timestamps` | `timestamp_seconds` | btree | Video-ordered event list |
| `event_timestamps` | `tags` | GIN | Tag filtering |
| `event_timestamps` | `player_ids` | GIN | Player-scoped event lookup |
| `game_reports` | `is_current` (partial) | btree | Efficient current-report queries |
| `verification_feedback` | `(target_type, target_id)` | btree | Lookup feedback for any target |
| `share_links` | `token` | btree unique | Token-based share link access |

---

## Storage Buckets

| Bucket | Access | Max Size | Types |
|--------|--------|---------|-------|
| `game-videos` | Private, team-scoped | 5 GB | mp4, mov, avi, webm |
| `game-thumbnails` | Private, team-scoped | 10 MB | jpg, png, webp |
| `report-exports` | Private, link-based | 50 MB | pdf |

See `/docs/SUPABASE_SETUP.md` for bucket creation instructions.
