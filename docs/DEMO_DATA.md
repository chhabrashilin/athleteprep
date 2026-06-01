# GameIQ — Demo Data

This document describes the demo workspace available in GameIQ for development, demos, and evaluation purposes.

---

## Overview

GameIQ ships with a demo data setup that creates a realistic cricket team workspace for any authenticated user. This workspace is designed to showcase the full end-to-end product flow without requiring the user to create their own data.

**Feature flag required:** `NEXT_PUBLIC_ENABLE_MOCK_DATA=true`

When the flag is `false` (production default), the demo setup page is hidden and no demo routes are accessible.

---

## How to Create Demo Data

### Via the UI

1. Set `NEXT_PUBLIC_ENABLE_MOCK_DATA=true` in your `.env.local`
2. Sign in to your account
3. From the dashboard, click **"Set up demo"** banner (shown when you have no teams)  
   OR navigate directly to `/demo/setup`
4. Click **Create demo workspace**
5. Wait ~10 seconds — the system creates the team, roster, game, timestamps, and AI report
6. You are automatically redirected to the AI report

### Via the Demo Setup Page

Navigate directly to `/demo/setup`:

- If demo data does not exist: click **Create demo workspace**
- If demo data already exists: click **Open AI report** or **Open team workspace**

### Via Server Action (programmatic)

```typescript
import { createDemoWorkspaceAction } from "@/app/demo/actions";

const result = await createDemoWorkspaceAction();
// result.status: "created" | "exists" | "disabled" | "error"
// result.teamId, result.gameId on success
```

---

## Demo Team

| Field | Value |
|-------|-------|
| **Name** | Madison Cricket XI |
| **Sport** | Cricket |
| **Organization** | Demo Club |
| **Level** | College / Competitive Club |
| **Location** | Madison, WI |
| **Description** | A demo team used to showcase AI-powered game review, player feedback, and practice planning. |

---

## Demo Roster

10 clearly fictional players:

| # | Name | Jersey | Position | Role |
|---|------|--------|----------|------|
| 1 | Arjun Patel | 7 | Top-order batter | Captain |
| 2 | Rohan Mehta | 12 | Opening batter | Player |
| 3 | Sameer Khan | 18 | All-rounder | Player |
| 4 | Vikram Rao | 9 | Fast bowler | Player |
| 5 | Neil Desai | 22 | Wicketkeeper | Player |
| 6 | Kabir Singh | 5 | Spinner | Player |
| 7 | Aman Shah | 33 | Middle-order batter | Player |
| 8 | Dev Iyer | 45 | Finisher | Player |
| 9 | Rahul Nair | 11 | Medium pacer | Player |
| 10 | Ishan Gupta | 16 | Utility fielder | Player |

All names are fictional. No real individuals are depicted.

---

## Demo Game

| Field | Value |
|-------|-------|
| **Title** | Match vs Lakeside CC |
| **Type** | Match |
| **Opponent** | Lakeside CC |
| **Date** | 2026-05-24 |
| **Venue** | Demo Ground |
| **Competition** | Spring Invitational |
| **Team score** | 148/7 |
| **Opponent score** | 151/6 |
| **Result** | Lost by 4 wickets |

The game includes:
- Summary notes describing the match narrative
- Coach notes (4 paragraphs) covering batting intent, dot-ball pressure, bowling plans, fielding lapses, death-over execution
- Opponent notes covering their strengths, weaknesses, and tendencies

---

## Demo Key Moments (Timestamps)

12 tagged events covering the full match arc:

| Time | Label | Importance | Context |
|------|-------|-----------|---------|
| 2:15 | Strong opening boundary — Arjun drives through covers | Medium | Own team |
| 6:40 | Dot-ball pressure builds — three in a row | High | Own team |
| 9:25 | Risky aerial shot — wicket falls, 2nd wicket down | Critical | Own team |
| 13:10 | Smart strike rotation — Arjun and Aman rebuild | Medium | Own team |
| 18:45 | Missed run-out — Lakeside opener survives at 22 | High | Own team |
| 22:30 | Kabir Singh creates pressure — 2 dots and a wicket | High | Own team |
| 27:05 | Opponent targets short boundary — sweep for six | High | Opponent |
| 31:20 | Fielding miscommunication — boundary conceded | Critical | Own team |
| 35:55 | Death-over yorker missed — full toss conceded | High | Own team |
| 39:15 | Opponent finisher attacks pace — two sixes in over | Critical | Opponent |
| 42:00 | Good slower-ball — dot ball and almost a wicket | Medium | Own team |
| 45:30 | Final-over field placement issue — winning run scored | Critical | Own team |

Each event includes:
- Label and description
- Event type (batting / bowling / fielding / wicket)
- Team context (own_team / opponent)
- Importance (medium / high / critical)
- Tags (e.g. "death overs", "fielding", "bowling plan", "dot-ball pressure")
- Related player IDs (resolved from roster)

---

## Demo AI Report

After demo data is created, `generateReportForGame` is called automatically using the configured AI provider (default: mock).

The generated report includes:
- Executive summary (narrative from coach notes + game context)
- Up to 5 coaching insights (evidence-linked, with confidence scores)
- Player reports for players tagged in events (Arjun Patel, Rohan Mehta, Kabir Singh, Vikram Rao, Sameer Khan, Ishan Gupta)
- Practice recommendations (drills for identified issues)
- Opponent tendencies (from opponent-context events and opponent notes)
- Assumptions and limitations (full transparency section)

**Note on confidence:** Insights referencing 4+ critical events get **High** confidence. Most demo insights fall in the **Medium** range given the event count.

---

## Demo Video

The demo does not include an actual video file. This is by design:

- A real uploaded video cannot be bundled with demo data safely
- The product works end-to-end without video — key moments drive the AI report
- The game detail page shows the honest state: "No video uploaded"
- Timestamp playback (click to seek) requires an actual uploaded video

The UI copy is honest:  
> "Demo report generated from notes and tagged key moments. Upload video to enable timestamp playback."

---

## Idempotency

Demo data creation is idempotent:

1. Before creating any data, the action checks if a team named **"Madison Cricket XI"** already exists for the user
2. If found, it returns `status: "exists"` and redirects to the existing workspace
3. Multiple clicks on "Create demo workspace" will not create duplicate data

To reset demo data: delete the team from the team workspace (or delete individual games), then re-run the setup.

---

## Feature Flag Reference

| Variable | Required value | Effect |
|----------|---------------|--------|
| `NEXT_PUBLIC_ENABLE_MOCK_DATA` | `true` | Shows demo setup UI on dashboard and at `/demo/setup` |
| `NEXT_PUBLIC_ENABLE_MOCK_DATA` | `false` or unset | Hides all demo UI; `/demo/setup` redirects to `/dashboard` |

The AI provider for demo report generation is controlled separately by `AI_PROVIDER`. Default is `mock`.

---

## Files

| File | Purpose |
|------|---------|
| `lib/demo/demo-data.ts` | All demo constants (team, players, game, events) |
| `app/demo/actions.ts` | Server actions: check existence, create workspace |
| `app/demo/setup/page.tsx` | Demo setup UI page |

---

## Limitations

- No video file is included (by design)
- Demo data is user-scoped (each user gets their own copy)
- The demo team name serves as the existence marker — do not rename it
- If the mock AI provider fails, the report may be empty; re-navigate to the game and click Generate Report
- The demo uses your production Supabase instance — data is real and stored
