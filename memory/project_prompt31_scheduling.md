---
name: project-prompt31-scheduling
description: Prompt 31 — Cricket match scheduling, venue management, fixture generation, conflict detection, calendar view. All quality gates green (470/470 tests, all new routes included in build).
metadata:
  type: project
---

Cricket match scheduling and venue management shipped in Prompt 31.

**Why:** Required for league scheduling to be genuinely usable before scorecard foundation.

**How to apply:** When Prompt 32 (scorecard foundation) starts, migration 0017 must already be applied via `npx supabase db push`. Matches in cricket_matches now have slug, schedule_status, publish_status columns.

## Key facts
- Migration: `supabase/migrations/0017_cricket_match_scheduling_venues.sql`
- New tables: cricket_match_officials, cricket_venue_availability, cricket_schedule_change_logs, cricket_schedule_generation_runs
- Extended tables: cricket_venues (+18 cols), cricket_matches (+22 cols)
- New routes: /cricket/venues, /cricket/venues/new, /cricket/venues/[venueSlug], /cricket/venues/[venueSlug]/settings, /cricket/leagues/[slug]/schedule, /cricket/leagues/[slug]/matches/new, /cricket/matches/[matchSlugOrId], /cricket/matches/[matchSlugOrId]/edit
- Round-robin algorithm: `lib/cricket/scheduling/round-robin.ts` — pure, deterministic, no side effects
- Quality gates: lint (0 errors), typecheck (clean), test (470/470), build (success)
- Test runner: Vitest (import from "vitest", NOT Jest globals)
- Zod UUID validation is strict RFC 4122 — test UUIDs must have version=4 (char 14) and variant in {8,9,a,b} (char 19)

## Next prompt
Prompt 32 — Cricket Scorecard Foundation and Match Setup
