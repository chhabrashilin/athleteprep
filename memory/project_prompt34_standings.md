---
name: project-prompt34-standings
description: Prompt 34 — Cricket standings, points table, leaderboards, player stats. Migration 0020, 3 new routes, standings+stats rebuild actions, 770 tests pass.
metadata:
  type: project
---

Prompt 34 implemented full cricket standings and statistics system.

**Why:** Make GameIQ feel like a real competition management platform with CricClubs-level standings coverage.

**What was added:**
- Migration `0020_cricket_standings_leaderboards.sql` — 5 new tables: cricket_team_standings, cricket_standings_snapshots, cricket_player_stats, cricket_match_team_results, cricket_leaderboard_snapshots
- New SQL helpers: `user_can_view_cricket_league_stats`, `user_can_rebuild_cricket_stats`
- New lib modules: `standings/calculations.ts`, `standings/queries.ts`, `standings/actions.ts`, `stats/player-calculations.ts`, `stats/queries.ts`, `stats/actions.ts`, `leaderboards/queries.ts`, `validation/standings.ts`
- New client components: `RebuildStandingsButton.tsx`, `RebuildPlayerStatsButton.tsx`
- New routes: `/cricket/leagues/[slug]/points-table`, `/cricket/leagues/[slug]/leaderboards`, `/cricket/teams/[teamSlug]/stats`
- Updated: league overview (standings preview + leaderboard preview), player profile (real stats), cricket hub (Points Table/Leaderboards marked available)
- 96 new tests (770 total, all passing)

**How to apply:** Stats require admin to trigger rebuild via "Rebuild Standings" and "Rebuild Player Stats" buttons. Run `npx supabase db push` after deployment.

**Next prompt:** Prompt 35 — Advanced Cricket Visual Analytics (Worm, Manhattan, Wagon Wheel, Run Rate Graphs).

[[project-prompt33-live-scoring]]
