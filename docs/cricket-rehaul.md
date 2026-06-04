# Prompt 27 — Cricket Rehaul Foundation

## Purpose

Prompt 27 establishes the foundational infrastructure for GameIQ's cricket vertical. It does **not** implement full feature modules — it creates the safe architecture and scaffolding so the next prompts can build those modules correctly.

---

## New Environment Variables

Add these to your `.env.local` (see `.env.example` for full context):

```env
# Multi-sport platform mode
NEXT_PUBLIC_MULTI_SPORT_ENABLED=true

# Cricket Hub and foundation routes
NEXT_PUBLIC_CRICKET_ENABLED=true

# Cricket sub-features (all off by default — enable as each module ships)
NEXT_PUBLIC_CRICKET_SOCIAL_ENABLED=false
NEXT_PUBLIC_CRICKET_STREAMING_ENABLED=false
NEXT_PUBLIC_CRICKET_MARKETPLACE_ENABLED=false
NEXT_PUBLIC_CRICKET_NEWS_ENABLED=false
NEXT_PUBLIC_CRICKET_LIVE_SCORING_ENABLED=false
NEXT_PUBLIC_CRICKET_ADVANCED_ANALYTICS_ENABLED=false
```

All flags are `NEXT_PUBLIC_*` (safe for client-side UI gating). None expose private keys.

---

## New Routes

| Route | Description |
|---|---|
| `/select-sport` | Sport selection page — choose General Sports or Cricket |
| `/cricket` | Cricket Hub — overview of all cricket modules |
| `/cricket/leagues` | Leagues placeholder (foundation ready) |
| `/cricket/tournaments` | Tournaments placeholder (foundation ready) |
| `/cricket/players` | Players placeholder (foundation ready) |
| `/cricket/matches` | Matches placeholder (foundation ready) |
| `/cricket/schedules` | Schedules placeholder (foundation ready) |

The landing page nav has a "Choose sport" link pointing to `/select-sport`.
The dashboard has a "Using GameIQ for cricket? Open Cricket Hub" nudge card when `NEXT_PUBLIC_CRICKET_ENABLED=true`.

---

## New Database Tables (Migration 0013)

Migration: `supabase/migrations/0013_cricket_foundation.sql`

| Table | Purpose |
|---|---|
| `cricket_leagues` | Leagues with format, season, points rules |
| `cricket_league_members` | User roles within a league (owner, admin, manager, scorer, player, fan, member) |
| `cricket_teams` | Cricket teams, optionally linked to a league |
| `cricket_players` | Player profiles with batting/bowling style and role |
| `cricket_team_rosters` | Player–team assignments with captain flags |
| `cricket_venues` | Ground listings with geolocation |
| `cricket_matches` | Scheduled/completed matches with toss and result |
| `cricket_feature_audit` | Internal tracking of module rollout status |

All tables have:
- RLS enabled with simple authenticated read/insert/update policies
- `updated_at` triggers via existing `set_updated_at()` function
- Practical indexes on frequently queried columns

---

## How to Run the Migration

```bash
npx supabase db push
```

Or apply manually via the Supabase SQL editor.

---

## How to Seed Cricket Demo Data

The `supabase/seed.sql` file now includes cricket demo data (no real auth user required):

- 1 league: **GameIQ Demo Cricket League** (Summer 2026, 20-over round-robin)
- 3 teams: Madison Strikers, Ann Arbor Royals, Chicago Chargers
- 6 players: Aarav Singh, Shilin Chhabra, Rahul Mehta, Arjun Patel, Sameer Khan, Rohan Iyer
- 1 venue: Demo Cricket Ground (Madison, US)
- 2 scheduled matches

Run:
```bash
# Via Supabase CLI
npx supabase db seed

# Or paste the cricket section into the Supabase SQL editor
```

---

## Feature Flag Strategy

Feature flags follow the existing `NEXT_PUBLIC_*` pattern in `lib/config/feature-flags.ts`.

Cricket flags:
- `isMultiSportEnabled()` — controls sport selection page and registry
- `isCricketEnabled()` — gates the Cricket Hub and all cricket routes
- `isCricketSocialEnabled()` — future social/community feed
- `isCricketStreamingEnabled()` — future streaming overlay
- `isCricketMarketplaceEnabled()` — future marketplace
- `isCricketNewsEnabled()` — future news/trivia/polls
- `isCricketLiveScoringEnabled()` — future live scoring
- `isCricketAdvancedAnalyticsEnabled()` — future analytics charts

All flags default to a safe value (`false` for sub-features, `true` for the foundation).

---

## New Code Files

### Config / Flags
- `lib/config/feature-flags.ts` — extended with 8 new cricket flags + named function exports

### Sports Registry
- `lib/sports/registry.ts` — central multi-sport registry with `getAllSports()`, `getEnabledSports()`, `getSportBySlug()`, `isSportEnabled()`

### Cricket Data Layer
- `lib/cricket/types.ts` — domain types for cricket tables
- `lib/cricket/queries.ts` — server-side data access functions

### Cricket UI Components
- `components/cricket/CricketStatusBadge.tsx` — Available / Foundation Ready / Coming Soon badge
- `components/cricket/CricketModuleCard.tsx` — module card with conditional link
- `components/cricket/CricketLeagueCard.tsx` — league card with season/format metadata
- `components/cricket/CricketMatchList.tsx` — match list with status badges
- `components/cricket/CricketEmptyState.tsx` — reusable empty state with back link

### Routes
- `app/select-sport/page.tsx` — server page
- `app/select-sport/SportSelectionGrid.tsx` — client component (localStorage)
- `app/cricket/page.tsx` — Cricket Hub
- `app/cricket/leagues/page.tsx`
- `app/cricket/tournaments/page.tsx`
- `app/cricket/players/page.tsx`
- `app/cricket/matches/page.tsx`
- `app/cricket/schedules/page.tsx`

### Tests
- `tests/unit/feature-flags.test.ts`
- `tests/unit/sport-registry.test.ts`
- `tests/components/cricket-status-badge.test.tsx`
- `tests/components/cricket-module-card.test.tsx`

---

## What Is Intentionally NOT Implemented Yet

The following are scoped for future prompts:

- Full league creation workflow (form, validation, RPC)
- Full live scoring (ball-by-ball delivery table, real-time layer)
- Streaming integration
- Marketplace listings
- Social/community feed
- Player comparison and statistics
- Advanced charts: wagon wheel, Manhattan graph, worm chart, run-rate
- Points table with net run rate calculation
- Tournament bracket builder
- Ground/venue management UI
- Cricket-specific onboarding flow

---

## Next Recommended Prompt

**Prompt 28: Sport Selection UX Polish and Onboarding Flow**
- Polish the `/select-sport` page with animations and better sport card design
- Persist sport selection across sessions
- Redirect returning users to their preferred sport automatically
- OR: **Prompt 28: League Creation Workflow** — full league CRUD with team invitation flow

Choose based on which is more pressing: onboarding UX or core data entry.

---

# Prompt 28 — Multi-Sport Onboarding Polish, Persistent Sport Preference, Cricket Entry Flow, and Navigation Integration

## What Prompt 28 Implemented

Prompt 28 delivers the polished onboarding and navigation layer for GameIQ's multi-sport platform. It builds on the foundation from Prompt 27 without modifying any existing product flows.

---

## New Database Migration

### `0014_user_sport_preferences.sql`

Adds the `user_sport_preferences` table for authenticated users.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → auth.users, cascade delete |
| `selected_sport` | text | One of: general, cricket, baseball, basketball, soccer, football |
| `onboarding_completed` | boolean | Default false |
| `cricket_onboarding_completed` | boolean | Default false |
| `created_at` | timestamptz | Auto-set |
| `updated_at` | timestamptz | Auto-updated via trigger |

**RLS:** Authenticated users can only select, insert, and update their own row. No anonymous access.

**To apply:**
```bash
npx supabase db push
```

---

## How Sport Preference Works

### Anonymous users
- Sport selection is persisted in `localStorage` under the key `gameiq:selectedSport`.
- The `/select-sport` page reads and writes this key via `getLocalSelectedSport()` / `setLocalSelectedSport()`.
- No database interaction is required.

### Authenticated users
- When an authenticated user selects a sport on `/select-sport` or changes it in `/settings`, the selection is:
  1. Written to `localStorage` immediately (instant feedback).
  2. Upserted to `user_sport_preferences` via a Server Action (`saveSportPreferenceAction`).
- On the settings page, the current preference is read server-side via `getUserSportPreference()`.

### Priority order (`resolvePreferredSport`)
1. Valid remote sport (Supabase, authenticated)
2. Valid local sport (localStorage, anonymous)
3. Provided fallback slug
4. `"general"` (hard default)

---

## New and Updated Files

### New files
| File | Purpose |
|---|---|
| `supabase/migrations/0014_user_sport_preferences.sql` | User sport preference table with RLS |
| `lib/sports/preferences.ts` | Sport preference utilities (localStorage + Supabase) |
| `app/actions/sport-preferences.ts` | Server Action for saving preference to Supabase |
| `components/cricket/CricketPlaceholderPage.tsx` | Shared placeholder component for cricket sub-pages |
| `components/settings/SportPreferenceCard.tsx` | Client component for the settings sport preference UI |
| `app/cricket/scorecards/page.tsx` | Coming soon placeholder |
| `app/cricket/points-table/page.tsx` | Coming soon placeholder |
| `app/cricket/live-scoring/page.tsx` | Coming soon, gated by feature flag |
| `app/cricket/analytics/page.tsx` | Coming soon, gated by feature flag |
| `app/cricket/streaming/page.tsx` | Coming soon, gated by feature flag |
| `app/cricket/community/page.tsx` | Coming soon, gated by feature flag |
| `app/cricket/store/page.tsx` | Coming soon, gated by feature flag |
| `tests/unit/sport-preferences.test.ts` | Unit tests for preference resolver and localStorage helpers |
| `tests/components/cricket-hub.test.tsx` | Tests for cricket hub components |
| `tests/components/cricket-placeholder.test.tsx` | Tests for CricketPlaceholderPage |
| `tests/components/sport-selection.test.tsx` | Tests for SportSelectionGrid UI |

### Modified files
| File | Change |
|---|---|
| `app/select-sport/page.tsx` | Uses `getAllSports()` (not just enabled) to show all sports |
| `app/select-sport/SportSelectionGrid.tsx` | Full rewrite: status badges, disabled cards, Supabase sync |
| `app/settings/page.tsx` | Added sport preference section using `SportPreferenceCard` |
| `components/layout/AppSidebar.tsx` | Added "Switch sport" link (gated by `isMultiSportEnabled()`) |
| `app/cricket/page.tsx` | Expanded roadmap, demo data counts, next build step section |
| `app/cricket/leagues/page.tsx` | Uses `CricketPlaceholderPage` shared component |
| `app/cricket/tournaments/page.tsx` | Uses `CricketPlaceholderPage` shared component |
| `app/cricket/players/page.tsx` | Uses `CricketPlaceholderPage` shared component |
| `app/cricket/matches/page.tsx` | Uses `CricketPlaceholderPage` shared component |
| `app/cricket/schedules/page.tsx` | Uses `CricketPlaceholderPage` shared component |
| `lib/cricket/queries.ts` | Added `getCricketTeams()` for hub demo data counts |

---

## Routes Added / Updated

| Route | Status | Notes |
|---|---|---|
| `/select-sport` | Updated | Shows all sports with status badges; disabled for coming_soon |
| `/settings` | Updated | Added sport preference section |
| `/cricket` | Updated | Full roadmap, demo data counts, next-step section |
| `/cricket/leagues` | Updated | Shared placeholder component |
| `/cricket/tournaments` | Updated | Shared placeholder component |
| `/cricket/players` | Updated | Shared placeholder component |
| `/cricket/matches` | Updated | Shared placeholder component |
| `/cricket/schedules` | Updated | Shared placeholder component |
| `/cricket/scorecards` | New | Coming soon placeholder |
| `/cricket/points-table` | New | Coming soon placeholder |
| `/cricket/live-scoring` | New | Coming soon, feature flag gated |
| `/cricket/analytics` | New | Coming soon, feature flag gated |
| `/cricket/streaming` | New | Coming soon, feature flag gated |
| `/cricket/community` | New | Coming soon, feature flag gated |
| `/cricket/store` | New | Coming soon, feature flag gated |

---

## Feature Flags and What They Control

| Flag | Default | Controls |
|---|---|---|
| `NEXT_PUBLIC_MULTI_SPORT_ENABLED` | `true` | Shows "Switch sport" link in sidebar |
| `NEXT_PUBLIC_CRICKET_ENABLED` | `true` | Cricket Hub and all cricket routes |
| `NEXT_PUBLIC_CRICKET_LIVE_SCORING_ENABLED` | `false` | `/cricket/live-scoring` flag notice |
| `NEXT_PUBLIC_CRICKET_ADVANCED_ANALYTICS_ENABLED` | `false` | `/cricket/analytics` flag notice |
| `NEXT_PUBLIC_CRICKET_STREAMING_ENABLED` | `false` | `/cricket/streaming` flag notice |
| `NEXT_PUBLIC_CRICKET_SOCIAL_ENABLED` | `false` | `/cricket/community` flag notice |
| `NEXT_PUBLIC_CRICKET_MARKETPLACE_ENABLED` | `false` | `/cricket/store` flag notice |

---

## How to Run

```bash
# Apply migrations
npx supabase db push

# Start development server
npm run dev

# Quality gates
npm run lint
npm run typecheck
npm run test
npm run build
```

---

## Known Limitations

- No full league creation workflow yet (Prompt 29)
- No live scoring yet
- No streaming yet
- No marketplace yet
- No social/community feed yet
- Settings profile editing is still disabled (future prompt)
- Sport preference sync requires user to be logged in; anonymous users use localStorage only

---

---

## Prompt 29 — Cricket League Creation Workflow and League Admin Foundation

### What was added

**League creation workflow:**
- Full multi-section create league form (`/cricket/leagues/new`) with all fields: basics, location, season, match rules, registration, and contact.
- Auto-generated URL slug derived from league name; manual override supported.
- Zod v4 validation schema with date-range checks, format/visibility enums, email/URL validation.

**League management:**
- `/cricket/leagues` — authenticated league list showing all leagues where user is a member, with visibility and registration status badges.
- `/cricket/leagues/[slug]` — league detail page with info grid, module navigation cards (placeholder for future modules), and admin controls for owners/admins.
- `/cricket/leagues/[slug]/setup` — setup wizard with checklist, league basics summary, match rules summary, team registration status, invite form, member list, and launch button.
- `/cricket/leagues/[slug]/settings` — settings page for updating all league and match-settings fields with a single save.

**League admin foundation:**
- `cricket_league_settings` table — scoring mode, overs, player counts, points system, NRR, bonus points.
- `cricket_league_invitations` table — invite by email with role, token, and expiry; stored but not emailed yet.
- `cricket_league_admin_audit_logs` table — records created, updated, invited, archived actions.
- Helper SQL functions: `public.is_cricket_league_member()` and `public.has_cricket_league_role()` for RLS policies.

**Cricket hub:**
- Primary CTAs added: "Create Cricket League" → `/cricket/leagues/new` and "View My Leagues" → `/cricket/leagues`.
- League Management module status updated from `foundation_ready` to `available`.
- Next build step updated to "Prompt 30 — Team Registration."

### New migration

`supabase/migrations/0015_cricket_league_admin_foundation.sql`

| Table / Change | Details |
|---|---|
| `cricket_leagues` new columns | visibility, registration_status, timezone, ball_type, match_days, rules_summary, contact_email, website_url, allow_public_scorecards, allow_team_registration, allow_player_registration, require_admin_approval |
| `cricket_leagues` check constraints | visibility, registration_status, format (all idempotent) |
| `cricket_leagues` UPDATE policy | Extended to allow `owner`/`admin` members to update (additive, not weakening) |
| `cricket_league_settings` | New table — match rules and scoring per league |
| `cricket_league_invitations` | New table — email invitations with role and token |
| `cricket_league_admin_audit_logs` | New table — admin action log |
| RLS helper functions | `is_cricket_league_member()`, `has_cricket_league_role()` |

### New routes

| Route | Description |
|---|---|
| `/cricket/leagues` | List of leagues the authenticated user belongs to (was placeholder) |
| `/cricket/leagues/new` | Multi-section create league form |
| `/cricket/leagues/[slug]` | League detail page with module navigation |
| `/cricket/leagues/[slug]/setup` | Setup wizard — checklist, invite, member list, launch |
| `/cricket/leagues/[slug]/settings` | Edit all league and match-settings fields |

### How to run the migration

```bash
npx supabase db push
```

### Manual test flow

1. `npm run dev` and open the browser.
2. Log in to your account.
3. Navigate to `/cricket` — verify "Create Cricket League" and "View My Leagues" CTAs are visible.
4. Click "Create Cricket League" → `/cricket/leagues/new`.
5. Fill in league name, season name, format, overs, timezone, visibility → submit.
6. You are redirected to `/cricket/leagues/[slug]/setup`.
7. Verify setup checklist shows "League info completed" and "Owner assigned" as done.
8. Use the invite form to add a manager (email + role).
9. Click "Open League Page" → `/cricket/leagues/[slug]`.
10. Verify league info is displayed.
11. Click "Settings" → `/cricket/leagues/[slug]/settings`.
12. Update description, change visibility to "public" → save.
13. Verify success toast / message.
14. Navigate to `/cricket/leagues` — verify your league is listed.

### New files

**Migration:**
- `supabase/migrations/0015_cricket_league_admin_foundation.sql`

**Validation:**
- `lib/cricket/validation/league.ts`

**Queries:**
- `lib/cricket/leagues/queries.ts`

**Server actions:**
- `app/actions/cricket-leagues.ts`

**Components:**
- `components/cricket/CreateLeagueForm.tsx`
- `components/cricket/LeagueSettingsForm.tsx`
- `components/cricket/LeagueInviteForm.tsx`
- `components/cricket/LeagueMemberList.tsx`
- `components/cricket/LeagueSetupChecklist.tsx`

**Pages (new or replaced):**
- `app/cricket/page.tsx` (updated hub)
- `app/cricket/leagues/page.tsx` (replaced placeholder)
- `app/cricket/leagues/new/page.tsx`
- `app/cricket/leagues/[slug]/page.tsx`
- `app/cricket/leagues/[slug]/setup/page.tsx`
- `app/cricket/leagues/[slug]/settings/page.tsx`

**Tests:**
- `tests/unit/league-validation.test.ts`
- `tests/components/create-league-form.test.tsx`

### Known limitations

- Invitations are stored in `cricket_league_invitations` but not emailed. Email delivery comes in a future prompt.
- No team registration workflow yet — the `allow_team_registration` flag exists but the team submission flow comes in Prompt 30.
- No schedule generator yet — match scheduling comes after team registration.
- No live scoring yet — ball-by-ball delivery tables not yet created.
- No points table computation yet — depends on match results from live scoring.
- No scorecards yet — depends on delivery-level data.
- Slug cannot be changed after creation in this prompt.
- The member list shows user IDs rather than display names — profile join comes in a future prompt.

---

## Next Prompt (from Prompt 29)

**Prompt 30 — Cricket Team Registration and Roster Management** ← now complete (see below)

---

# Prompt 30 — Cricket Team Registration, Roster Management, and Player Profiles

## Summary

Prompt 30 makes cricket team registration and roster management genuinely usable. Teams can now be created inside a cricket league, players added to rosters, captains assigned, and team settings managed — all through real UI flows backed by server actions.

---

## New Migration

**`supabase/migrations/0016_cricket_team_registration_rosters.sql`**

### Extended tables
- `cricket_teams` — adds `registration_status`, `approval_status`, `team_type`, `description`, `founded_year`, `contact_email`, `contact_phone`, `website_url`, `instagram_url`, `captain_player_id`, `vice_captain_player_id`, `coach_name`, `scorer_name`, `is_active`, `archived_at`
- `cricket_players` — adds `email`, `phone`, `emergency_contact_name`, `emergency_contact_phone`, `gender`, `dominant_hand`, `primary_role`, `secondary_role`, `batting_order_preference`, `bowling_type`, `fielding_position_preference`, `availability_status`, `is_verified`

### New tables
| Table | Purpose |
|---|---|
| `cricket_team_members` | User roles within a team (owner, manager, coach, captain, vice_captain, scorer, analyst, player, member) |
| `cricket_team_invitations` | Token-based invitations for team members |
| `cricket_player_documents` | Document uploads (ID, waiver, proof of age, etc.) |
| `cricket_roster_change_logs` | Audit trail for all roster changes |

### New SQL helpers
- `is_cricket_team_member(team_id, user_id)`
- `has_cricket_team_role(team_id, user_id, roles[])`
- `user_can_manage_cricket_team(team_id, user_id)` — checks direct team role, creator, or league admin

---

## New Routes

| Route | Description |
|---|---|
| `/cricket/leagues/[slug]/teams` | List teams in a league with registration status |
| `/cricket/leagues/[slug]/teams/new` | Register a new team in a league |
| `/cricket/teams/[teamSlug]` | Team profile with overview, captain, squad size |
| `/cricket/teams/[teamSlug]/roster` | Full roster management — add/remove players, assign captain/VC |
| `/cricket/teams/[teamSlug]/settings` | Team settings editor + invitation panel |
| `/cricket/players/[playerSlugOrId]` | Player profile with stats stubs |

---

## New Components

| Component | Description |
|---|---|
| `TeamCard` | Displays team name, short name, status badge, home ground, roster count |
| `PlayerCard` | Player name, role, batting/bowling style, jersey, captain/VC badges, manage actions |
| `CreateTeamForm` | Multi-section form: basics, branding, contact, cricket details |
| `TeamSettingsForm` | Edit all team fields including active status |
| `TeamInvitePanel` | Send and revoke team invitations |
| `AddPlayerForm` | Create a new player and add to roster in one step |
| `RosterManager` | Client-side roster with add/remove/captain/VC assignment |

---

## New Validation Modules

- `lib/cricket/validation/team.ts` — `createTeamSchema`, `updateTeamSchema`, `inviteTeamMemberSchema`, `generateTeamSlug`, `normalizeTeamSlug`, `normalizeCricketEmail`, `validateJerseyNumber`
- `lib/cricket/validation/player.ts` — `createPlayerSchema`, `updatePlayerSchema`, `generatePlayerSlug`, `normalizePlayerSlug`
- `lib/cricket/validation/roster.ts` — `rosterEntrySchema`, `updateRosterEntrySchema`

---

## New Query Modules

- `lib/cricket/teams/queries.ts` — `getCricketTeamsForLeague`, `getCricketTeamBySlug`, `getCricketTeamById`, `getCricketTeamsForUser`, `getCricketTeamMembers`, `getCricketTeamInvitations`, `userCanManageCricketTeam`, `isTeamSlugAvailable`, `getCricketTeamRoster`, `getCricketRosterEntry`
- `lib/cricket/players/queries.ts` — `getCricketPlayersForTeam`, `getCricketPlayerById`, `getCricketPlayerBySlug`, `getCricketPlayersForLeague`, `searchCricketPlayers`, `getCricketTeamsForPlayer`

---

## New Server Actions

File: `app/actions/cricket-teams.ts`

- `createCricketTeam(input)` — validates, generates slug, inserts team + team member, logs audit
- `updateCricketTeam(teamId, input)` — checks permission, updates fields
- `archiveCricketTeam(teamId)` — soft-archives team
- `inviteCricketTeamMember(teamId, input)` — creates invitation with token
- `revokeTeamInvitation(teamId, invitationId)`
- `addUserAsCricketTeamMember(teamId, userId, role)`
- `createCricketPlayer(input)` — creates player profile with auto-slug
- `updateCricketPlayer(playerId, input)`
- `addPlayerToCricketTeam(teamId, playerInputOrId, rosterInput)` — create-or-use player, insert roster entry
- `updateCricketRosterEntry(rosterEntryId, teamId, input)`
- `removePlayerFromCricketTeam(rosterEntryId, teamId)`
- `assignCricketCaptain(teamId, playerId)` — unsets old captain, sets new, updates team record
- `assignCricketViceCaptain(teamId, playerId)`
- `linkCricketPlayerToUser(playerId, userId)`

---

## Updated Pages

- `/cricket` — "Team Registration" module changed to "available"; CTA updated
- `/cricket/leagues/[slug]` — Teams module card now links and shows team count
- `/cricket/leagues/[slug]/setup` — Team registration section now shows real data + launch readiness checklist

---

## Seed Data (supabase/seed.sql)

- 3 demo teams now have full `0016` columns: description, team_type, primary_color, coach_name, approval_status
- 9 demo players with `primary_role`, `availability_status` and standardized `batting_style`/`bowling_style`
- Demo rosters: all 3 teams have 3 players each with captain/VC assigned
- `cricket_teams` rows updated with `captain_player_id` and `vice_captain_player_id`

---

## Tests Added

- `tests/unit/team-validation.test.ts` — generateTeamSlug, normalizeTeamSlug, normalizeCricketEmail, validateJerseyNumber, createTeamSchema, inviteTeamMemberSchema
- `tests/unit/player-validation.test.ts` — generatePlayerSlug, normalizePlayerSlug, createPlayerSchema, updatePlayerSchema
- `tests/components/cricket-team-card.test.tsx` — TeamCard rendering, status badges, links, roster count
- `tests/components/cricket-player-card.test.tsx` — PlayerCard rendering, role display, captain/VC badges, manage buttons

---

## Manual Test Flow

1. Log in to the app
2. Navigate to `/cricket` → Cricket Hub
3. Open or create a cricket league
4. Click "Teams" tab on the league detail page
5. Click "Register Team" → fill out the form → submit
6. You will be redirected to `/cricket/teams/[slug]/roster`
7. Click "Add Player" → fill display name, batting/bowling style → Add Player
8. From the roster, click "Make captain" on a player
9. Click "Make VC" on another player
10. Navigate to Team Settings → edit fields → save
11. On Team Settings, send a team invitation → verify it appears in the list → revoke it
12. Navigate to `/cricket/players/[slug]` to view the player profile page
13. Navigate back to the league setup page → confirm team count and launch checklist update

---

## Known Limitations

- No match scheduling yet
- No live scoring yet
- No stats computation or display yet (all "Coming soon" placeholders)
- No scorecard generation yet
- Invitation email delivery not implemented (token saved, email not sent)
- No document upload UI (table exists, no form yet)
- Player edit page (`/cricket/players/[id]/edit`) not implemented — foundation for Prompt 31

---

## Operator Next Steps

1. Run `npx supabase db push` to apply migration 0016
2. Run `npm run dev`
3. Create or open a cricket league
4. Use "Register Team" to create teams
5. Use roster page to add players and assign captain/vice captain

---

## Next Prompt

**Prompt 32 — Cricket Scorecard Foundation and Match Setup**
- Pre-match toss and playing XI selection
- Ball-by-ball scoring foundation
- Innings scorecard display

---

# Prompt 31 — Cricket Match Scheduling and Venue Management

## What Was Added

### Venue Management
- Full venue CRUD: create, edit, archive (no hard delete)
- Venue fields: name, short name, type, address, city, region, country, lat/lng, capacity, timezone, contact info, booking notes, facilities (lights, turf, matting, nets, changing rooms, parking)
- Weekly availability slots per venue
- `cricket_venues` extended with 18 new columns

### Match Scheduling
- Manual match creation per league
- Match fields: teams, venue, format, stage, round, overs, officials, schedule/publish status, notes
- Match slug generation from team names + date
- Publish/unpublish individual matches or entire league schedule
- Reschedule and cancel matches with reason logging
- Match official assignment (scorer, umpires, referee, etc.)

### Fixture Generator
- Pure round-robin pairing algorithm (circle method)
- Supports even and odd team counts (BYE insertion for odd)
- Date assignment with preferred days, max matches per day, venue rotation
- Preview before saving
- Appends fixtures only (safe — does not overwrite existing)
- Generation run logged in `cricket_schedule_generation_runs`

### Conflict Detection
- Team double-booking (same team at overlapping times)
- Venue double-booking
- Same-team match
- Invalid time range (end before start)
- Missing scheduled start for published match
- Shown in ConflictsPanel on schedule page

### Schedule Audit Log
- All schedule mutations written to `cricket_schedule_change_logs`
- Actions: venue.created, venue.updated, venue.archived, match.created, match.updated, match.scheduled, match.rescheduled, match.cancelled, match.published, match.unpublished, fixture.generated, official.assigned, official.removed

## New Migration

**`supabase/migrations/0017_cricket_match_scheduling_venues.sql`**

### Extended Tables
- `cricket_venues`: +18 columns (short_name, venue_type, capacity, timezone, contact_*, has_*, is_active, archived_at)
- `cricket_matches`: +22 columns (slug, match_number, round_name, stage, title, scheduled_end, timezone, publish_status, schedule_status, officials, notes, cancellation_reason, etc.)

### New Tables
- `cricket_match_officials` — scorer, umpires, referee, ground manager per match
- `cricket_venue_availability` — weekly availability slots per venue
- `cricket_schedule_change_logs` — audit log of all schedule mutations
- `cricket_schedule_generation_runs` — fixture generation history

### New SQL Functions
- `user_can_manage_cricket_match(match_id, user_id)`
- `user_can_view_cricket_match(match_id, user_id)` — respects public scorecard setting

## New Routes

| Route | Description |
|---|---|
| `/cricket/venues` | List all cricket venues |
| `/cricket/venues/new` | Create new venue |
| `/cricket/venues/[venueSlug]` | Venue detail page |
| `/cricket/venues/[venueSlug]/settings` | Edit venue |
| `/cricket/leagues/[slug]/schedule` | League schedule page with list view |
| `/cricket/leagues/[slug]/matches/new` | Create match manually |
| `/cricket/matches/[matchSlugOrId]` | Match detail page |
| `/cricket/matches/[matchSlugOrId]/edit` | Edit match |

## New Components

- `VenueCard` — venue list card with amenities
- `MatchCard` — match list card with status badges
- `CreateVenueForm` — full venue creation form
- `EditVenueForm` — venue editing form
- `CreateMatchForm` — match creation form
- `EditMatchForm` — match edit form
- `ConflictBanner` — warning banner with conflict count
- `ConflictsPanel` — detailed conflict list with suggestions
- `FixtureGeneratorPanel` — inline fixture generator with preview
- `PublishScheduleButtons` — bulk publish/unpublish buttons
- `MatchActionsPanel` — edit/publish/cancel actions on match detail

## New Utilities

- `lib/cricket/scheduling/round-robin.ts` — pure round-robin pairings, date assignment, conflict detection, schedule summary
- `lib/cricket/venues/queries.ts` — venue data access
- `lib/cricket/matches/queries.ts` — match data access (with joined team/venue/league data)
- `app/actions/cricket-venues.ts` — createCricketVenue, updateCricketVenue, archiveCricketVenue, setCricketVenueAvailability
- `app/actions/cricket-matches.ts` — createCricketMatch, updateCricketMatch, scheduleCricketMatch, rescheduleCricketMatch, cancelCricketMatch, publishCricketMatch, unpublishCricketMatch, assignCricketMatchOfficial, removeCricketMatchOfficial
- `app/actions/cricket-scheduling.ts` — generateCricketLeagueFixtures, saveGeneratedCricketFixtures, detectLeagueScheduleConflicts, publishLeagueSchedule, unpublishLeagueSchedule

## Tests Added

- `tests/unit/round-robin.test.ts` — 20+ tests: 2/3/4/5-team pairings, no duplicates, no self-matches, bye handling, date assignment, conflict detection, schedule summary
- `tests/unit/venue-validation.test.ts` — venue schema validation, slug generation/normalization
- `tests/unit/match-validation.test.ts` — match schema validation, schedule schema, time range helpers
- `tests/components/venue-card.test.tsx` — VenueCard rendering
- `tests/components/match-card.test.tsx` — MatchCard rendering with statuses
- `tests/components/conflict-banner.test.tsx` — ConflictBanner + ConflictsPanel

## Manual Test Flow

1. Log in
2. Navigate to Cricket Hub → Venues → Add Venue
3. Create at least two venues
4. Navigate to Cricket Hub → Leagues → open a league
5. Add at least two teams to the league
6. Open league → Schedule
7. Click "Generate Fixtures" — configure teams, dates, venues, and preview
8. Save fixtures
9. Review match list with grouped-by-date calendar view
10. Click "Create Match" to manually add a match
11. Use "Detect Conflicts" (if any conflicts exist, they show in ConflictsPanel)
12. Click "Publish All Drafts" to publish the schedule
13. Open a match detail page
14. Edit or reschedule a match
15. Cancel a match with a reason

## Known Limitations (Prompt 31)

- No live scoring yet (Prompt 32+)
- No full scorecards yet (Prompt 32+)
- No points table calculation yet
- No notifications or email delivery for schedule changes
- No drag-and-drop calendar (grouped-by-date list view only)
- No external calendar sync (iCal/Google Calendar)
- Venue management is accessible to any authenticated user who created a venue; future: scope to league context

## Operator Next Steps

```bash
# Apply migration
npx supabase db push

# Start dev server
npm run dev

# Optionally seed demo cricket data:
# Edit supabase/seed.sql, uncomment the cricket block, replace DEMO_USER_ID, and run in Supabase SQL editor
```

---

# Prompt 32 — Cricket Scorecard Foundation, Match Setup, Playing XI, Toss, Innings Model, Manual Scorecard Entry, and Result Finalization

## What Was Added

### Match Setup
- Playing XI selection per team from roster
- Toss winner and decision recording
- Setup checklist showing readiness status
- `scorecard_status` field on cricket_matches: not_started → setup → in_progress → completed → locked

### Scorecard Data Model
- `cricket_innings`: full innings data (runs, wickets, balls, extras, run rate, target)
- `cricket_batting_scorecard_entries`: per-batter row (runs, balls, 4s, 6s, dismissal, SR)
- `cricket_bowling_scorecard_entries`: per-bowler row (overs, maidens, runs, wickets, economy)
- `cricket_fall_of_wickets`: wicket-by-wicket score tracker
- `cricket_partnerships`: partnership runs/balls between two batters
- `cricket_match_squads`: playing XI per team per match
- `cricket_scorecard_change_logs`: full audit trail of all scorecard mutations

### Manual Scorecard Entry
- Innings totals editor (runs, wickets, balls, extras, status)
- Batting entries viewer/summary
- Bowling entries viewer/summary
- Fall of wickets editor
- Consistency validation before completing

### Result Finalization
- Auto-suggest result from innings data (runs won / wicket margin)
- Manual override of result type, margin, summary
- Player of match selection
- Locks match as completed on finalization

### Scorecard Calculations (Pure Functions)
- `ballsToOversText(balls)` — e.g. 17 → "2.5"
- `oversTextToBalls(text)` — e.g. "2.5" → 17 (validates 0-5 ball digit)
- `calculateStrikeRate(runs, balls)` — returns null for 0 balls
- `calculateEconomyRate(runs, balls)` — runs per over, null for 0 balls
- `calculateRunRate(runs, balls)` — innings RPO
- `calculateRequiredRunRate(target, current, remaining)`
- `calculateExtrasTotal(extras)` — sum of all extras
- `calculateInningsTotal(input)` — batting + extras
- `validateScorecardConsistency(scorecard)` — detects totals mismatch, wickets > 10, bowling inconsistency
- `determineMatchResult(input)` — handles runs win, wickets win, tie, abandoned

## New Migration

**`supabase/migrations/0018_cricket_scorecard_foundation.sql`**

### Extended Tables
- `cricket_matches`: +14 columns (toss fields, result fields, scorecard_status, scoring_mode, target_runs, winning/losing_team_id)

### New Tables
- `cricket_match_squads` — playing XI per match per team
- `cricket_innings` — innings data model
- `cricket_batting_scorecard_entries` — batter rows
- `cricket_bowling_scorecard_entries` — bowler rows
- `cricket_fall_of_wickets` — FOW tracker
- `cricket_partnerships` — partnership data
- `cricket_scorecard_change_logs` — scorecard audit log

### New SQL Functions
- `user_can_score_cricket_match(match_id, user_id)` — league manager, assigned scorer, match official scorer, or league scorer/admin role

## New Routes

| Route | Description |
|---|---|
| `/cricket/matches/[matchSlugOrId]/setup` | Playing XI, toss, scorecard start |
| `/cricket/matches/[matchSlugOrId]/scorecard` | Read-only scorecard display |
| `/cricket/matches/[matchSlugOrId]/scorecard/edit` | Manual scorecard entry |
| `/cricket/matches/[matchSlugOrId]/result` | Result finalization |

## New Components

- `ScorecardDisplay` — BattingTable, BowlingTable, FOWDisplay, InningsScorecard, ScorecardStatusBadge
- `ScorecardEditor` — innings totals editor, entry summaries, complete action
- `MatchSetupForm` — playing XI selection, toss recording
- `MatchSetupChecklist` — setup readiness checklist with action link
- `ResultFinalizationForm` — result type, margins, summary
- `ResultFinalizationPage` — auto-suggested + manual result entry

## Tests Added

- `tests/unit/scorecard-calculations.test.ts` — 30+ tests: overs conversion, SR/economy/RR, extras, innings totals, consistency checks, match result determination
- `tests/unit/scorecard-validation.test.ts` — squads, toss, innings, batting/bowling, result schemas
- `tests/components/scorecard-display.test.tsx` — ScorecardStatusBadge, BattingTable, BowlingTable, FOWDisplay, MatchSetupChecklist

## Manual Test Flow

1. Log in
2. Open a scheduled cricket match
3. Click "Set Up Scorecard" → navigate to /setup
4. Click "Start Setup"
5. Select playing XI for both teams
6. Record toss winner and decision
7. Open Scorecard Entry → /scorecard/edit
8. Select Innings 1 tab — enter totals (runs, wickets, balls, extras)
9. Save Innings
10. Switch to Innings 2 tab — repeat
11. View read-only scorecard at /scorecard
12. Click "Finalize Result" → /result
13. Accept suggested result or enter manually
14. Click "Finalize Result" → scorecard marked complete
15. Verify match detail page shows completed scorecard and result summary

## Known Limitations (Prompt 32)

- No ball-by-ball live scoring yet (Prompt 33+)
- No real-time scoring updates yet
- No points table auto-calculation yet
- No wagon wheel/manhattan/worm charts yet
- No streaming overlays yet
- Per-player batting/bowling entry forms are functional via API; full per-row UI grid coming in Prompt 33

## Next Prompt

Prompt 33 — Ball-by-Ball Live Scoring Engine and Real-Time Updates

---

# Prompt 33 — Ball-by-Ball Live Scoring Engine

## What Was Added

### Database (migration 0019_cricket_live_scoring_events.sql)

**Extended `cricket_matches`:**
- `live_scoring_status` (not_started / setup / live / innings_break / paused / completed / locked / abandoned)
- `current_innings_id`, `current_batter_id`, `current_non_striker_id`, `current_bowler_id`
- `live_started_at`, `live_ended_at`, `last_scored_at`, `live_score_version`

**New tables:**
| Table | Purpose |
|---|---|
| `cricket_ball_events` | Every delivery with runs, extras, wickets, commentary, soft-delete, corrections |
| `cricket_live_match_state` | Single-row per match live snapshot (total, wickets, overs, striker/bowler, version) |
| `cricket_live_scoring_sessions` | Per-scorer session tracking (active / paused / ended) |
| `cricket_ball_event_corrections` | Audit log for undo/edit/delete/replace corrections |

**New SQL helper:** `user_can_view_cricket_scorecard()` (idempotent)

### New Routes
| Route | Purpose |
|---|---|
| `/cricket/matches/[matchSlugOrId]/live-score` | Scorer interface (requires auth + score permission) |
| `/cricket/matches/[matchSlugOrId]/live` | Public live match viewer |

### New Libraries
| File | Purpose |
|---|---|
| `lib/cricket/live-scoring/calculations.ts` | Pure functions: isLegalDelivery, getNextBallState, shouldRotateStrike, buildCommentaryLine, summarizeOver, rebuildInningsStateFromEvents, validateBallEventInput |
| `lib/cricket/validation/live-scoring.ts` | Zod schemas: startLiveScoringSchema, ballEventSchema, correctionSchema, endInningsSchema |
| `lib/cricket/live-scoring/queries.ts` | Server-only read queries for ball events, live state, sessions, corrections |
| `lib/cricket/live-scoring/actions.ts` | Server actions: startLiveScoring, recordBallEvent, undoLastBallEvent, correctBallEvent, rebuildLiveScoreFromEvents, endInnings, completeLiveScoring, pauseLiveScoring, resumeLiveScoring, setNextBatter, setNextBowler |
| `lib/cricket/live-scoring/realtime.ts` | Supabase Realtime subscription + polling fallback hook `useLiveMatchState` |

### New Components
| Component | Purpose |
|---|---|
| `LiveMatchHeader` | Score display: runs/wickets/overs, CRR, RRR, striker/non-striker/bowler |
| `LiveScoringKeypad` | Mobile-first keypad: 0–6 runs, Wide/NB/Bye/LB, Wicket advanced panel, Undo |
| `RecentBallsList` | Over-grouped ball notation with color-coded circles, commentary feed |
| `LiveScoringClient` | Full client-side scorer state machine (start panel, keypad, over/wicket prompts) |
| `LiveViewerClient` | Realtime viewer with polling fallback, connection indicator |

### Updated Files
- `app/cricket/matches/[matchSlugOrId]/page.tsx` — Live scoring card in sidebar with LIVE badge
- `app/cricket/matches/[matchSlugOrId]/scorecard/edit/page.tsx` — Warning banner when live data exists
- `app/cricket/page.tsx` — Ball-by-Ball Live Scoring status updated to "available"
- `lib/cricket/scorecards/queries.ts` — Added `getCricketMatchSquadsWithPlayers()`
- `supabase/seed.sql` — 12 demo ball events, live innings, live match state for demo match

## Realtime Strategy

- **Primary**: Supabase Realtime `postgres_changes` subscriptions on `cricket_live_match_state` and `cricket_ball_events`
- **Fallback**: 12-second polling via `setInterval` if Realtime channel fails
- **Persistence first**: All scores written to Supabase before UI update — no fake optimistic state
- **Live state is authoritative**: `rebuildLiveScoreFromEvents()` can reconstruct any state from ball events

## Undo / Correction Behavior

1. **Undo**: Soft-deletes the most recent non-deleted event, inserts a `cricket_ball_event_corrections` row with `correction_type=undo`, then calls `rebuildLiveScoreFromEvents()` to recompute totals.
2. **Correct**: Soft-deletes original, inserts replacement event marked `is_correction=true`, inserts correction record, rebuilds.
3. **Rebuild**: Fetches all `is_deleted=false` events ordered by `created_at`, replays via `rebuildInningsStateFromEvents()`, updates innings + live state tables.
4. All deletes are **soft** (`is_deleted=true`, `deleted_at`, `deleted_by`) — data is never destroyed.

## Manual Test Flow

1. Log in as a user with league membership (owner/admin/manager/scorer)
2. Open a cricket league → schedule → match
3. Click **Open Scorer Interface** or navigate to `/cricket/matches/[slug]/live-score`
4. If match setup is incomplete, follow link to complete setup
5. In Start panel: select batting team, striker, non-striker, opener bowler → Start Live Scoring
6. Score a delivery: tap run button (0–6) or Extra/Wicket
7. Score a wide (tap Wide → auto-records)
8. Score a wicket: open Wicket/Advanced panel → select wicket type + player out → tap "0+W"
9. Tap Undo — confirm last ball is soft-deleted and score reverts
10. Open `/cricket/matches/[slug]/live` in another tab — confirm score appears (within 12s)
11. Score remaining balls — check over notification
12. End Innings when overs complete or all out
13. Start 2nd innings
14. Open `/cricket/matches/[slug]/scorecard` — confirm batting/bowling entries updated

## Known Limitations

- No live video streaming yet
- No broadcast overlays yet
- No wagon wheel / manhattan / worm charts yet
- No official points table automation yet
- Limited concurrency protection — last write wins for `live_score_version`
- Ball position numbering (`over_number`, `ball_in_over`) is caller-managed — scorer provides values; server does not auto-number
- No penalty runs UI in keypad yet (available in DB schema)
- `team_id` is empty string in batting/bowling entries inserted via live scoring — scorecard rebuild recommended after match

## Next Prompt

Prompt 34 — Points Table, Leaderboards, and Tournament Standings

