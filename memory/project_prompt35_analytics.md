---
name: project-prompt35-analytics
description: Prompt 35 — Cricket visual analytics. Pure SVG charts (worm, manhattan, run rate, wagon wheel, partnerships, momentum), migration 0021, 2 new routes, 840 tests pass.
metadata:
  type: project
---

Prompt 35 implemented advanced cricket visual analytics.

**Why:** Make GameIQ feel like a serious modern cricket intelligence product.

**Key decisions:**
- Used pure SVG React components — no charting library added (avoids dependency risk)
- Wagon wheel shows zone summary table when no x/y shot coordinates exist (honest empty state)
- Match momentum labelled as "experimental" throughout

**What was added:**
- Migration `0021_cricket_visual_analytics.sql` — 12 new columns on cricket_ball_events (shot_x/y, wagon_zone, bat_contact_type, batting_phase, etc.), 3 new snapshot tables
- New lib modules: `analytics/chart-data.ts`, `analytics/queries.ts`, `analytics/actions.ts`, `validation/analytics.ts`
- 11 SVG chart components in `components/cricket/charts/`
- New routes: `/cricket/matches/[id]/analytics` (7-tab), `/cricket/leagues/[slug]/analytics`
- Optional shot details panel in `LiveScoringKeypad` (collapsible, doesn't block fast scoring)
- 170 new tests (840 total, all passing)

**How to apply:** Run `npx supabase db push`. Charts auto-populate from existing ball events. Wagon wheel zones require scorer to select wagon zone during live scoring (optional).

**Next prompt:** Prompt 36 — Cricket Video Streaming Foundation and Broadcast Overlay Architecture.

[[project-prompt34-standings]]
