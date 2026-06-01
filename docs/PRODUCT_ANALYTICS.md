# GameIQ — Product Analytics

**Last updated:** 2026-06-01 — Prompt 18  
**Type:** Lightweight, first-party, privacy-conscious event tracking

---

## 1. Why Analytics Exists

GameIQ's analytics layer answers one question for the founder:

> **Are coaches completing the core workflow — or where are they dropping off?**

It does not track advertising, sessions, or user behavior across external sites. It tracks structured product events inside the app so the founder can see whether the product actually works for early users.

---

## 2. Event Taxonomy

### Event Categories

| Category | Description |
|----------|-------------|
| `landing` | Public landing page and demo page interactions |
| `auth` | Authentication events |
| `onboarding` | First-use milestones |
| `team` | Team workspace creation |
| `roster` | Player management |
| `game` | Game and practice creation |
| `video` | Video upload and management |
| `timestamp` | Key moment tagging |
| `analysis` | AI report generation pipeline |
| `report` | Report viewing and reading |
| `verification` | Coach verification and editing |
| `sharing` | Share link creation and viewing |
| `export` | Export and PDF generation |
| `feedback` | Access requests and product feedback |
| `demo` | Demo workspace setup |

### Core Event Names

#### Landing / Acquisition
| Event | Trigger |
|-------|---------|
| `landing_viewed` | Landing page render |
| `demo_cta_clicked` | Demo button clicked (client-side, optional) |
| `request_access_submitted` | Access request form submitted successfully |
| `feedback_submitted` | Product feedback form submitted successfully |

#### Onboarding
| Event | Trigger |
|-------|---------|
| `signup_completed` | New account created |
| `login_completed` | User signed in |
| `dashboard_viewed` | Dashboard rendered |
| `demo_workspace_created` | Demo setup completed |

#### Team / Roster
| Event | Trigger |
|-------|---------|
| `team_created` | New team created |
| `player_created` | New player added to roster |

#### Game / Video / Timestamps
| Event | Trigger |
|-------|---------|
| `game_created` | New game or practice created |
| `video_uploaded` | Video upload completed |
| `timestamp_created` | Key moment tagged |

#### AI / Report
| Event | Trigger |
|-------|---------|
| `analysis_completed` | AI report generated successfully |
| `analysis_failed` | AI report generation failed |

#### Verification / Editing
| Event | Trigger |
|-------|---------|
| `insight_verified` | Coach marks insight as accurate/partial/inaccurate |
| `insight_edited` | Coach edits an AI-generated insight |

#### Sharing / Export
| Event | Trigger |
|-------|---------|
| `share_link_created` | New share link created |
| `share_link_viewed` | Shared report opened via token link |
| `report_export_opened` | Export/print view opened |

---

## 3. Tracked Events (Prompt 18 implementation)

The following events are instrumented as of Prompt 18:

| Event | Where instrumented |
|-------|--------------------|
| `team_created` | `app/teams/new/actions.ts` |
| `player_created` | `app/teams/[teamId]/players/new/actions.ts` |
| `game_created` | `app/teams/[teamId]/games/new/actions.ts` |
| `timestamp_created` | `lib/actions/timestamps.ts` |
| `analysis_completed` | `app/teams/[teamId]/games/[gameId]/report/actions.ts` |
| `analysis_failed` | `app/teams/[teamId]/games/[gameId]/report/actions.ts` |
| `insight_verified` | `app/teams/[teamId]/games/[gameId]/report/actions.ts` |
| `insight_edited` | `app/teams/[teamId]/games/[gameId]/report/actions.ts` |
| `share_link_created` | `app/teams/[teamId]/games/[gameId]/report/actions.ts` |
| `report_export_opened` | `lib/actions/exports.ts` |
| `request_access_submitted` | `app/request-access/actions.ts` |
| `feedback_submitted` | `app/feedback/actions.ts` |
| `demo_workspace_created` | `app/demo/actions.ts` |

---

## 4. Privacy Rules

### What is stored (safe)

- Event names (enum values — never free-text)
- Event categories
- User ID (UUID, not email or name)
- Team ID, game ID, report ID (foreign keys)
- Metadata: counts, statuses, enums, booleans

**Good metadata example:**
```json
{
  "sport": "cricket",
  "playerCount": 10,
  "eventCount": 12,
  "hasVideo": true,
  "provider": "mock",
  "confidence": "medium"
}
```

### What is NEVER stored

- Full coach notes or player feedback text
- Raw AI report content
- Video URLs or storage paths
- API keys or secrets
- Email addresses in event rows
- Player names or medical information
- Willingness-to-pay details in events (stored in product_feedback table instead)

---

## 5. Database

**Table:** `product_events`

**Migration:** `supabase/migrations/0010_product_events.sql`

**RLS:**
- Authenticated users can insert their own events (`user_id = auth.uid()`)
- Anonymous users can insert events with `user_id IS NULL`
- No public SELECT — admin reads use service-role client only

**Admin reads:** Via `lib/db/product-events.ts` → `getRecentProductEventsForAdmin()`, `getAnalyticsSummaryForAdmin()`, `getFunnelSummaryForAdmin()`

---

## 6. Admin Dashboard

**URL:** `/admin/analytics`

**Access:** Requires authenticated session AND email in `ADMIN_EMAILS` environment variable.

```env
ADMIN_EMAILS=founder@example.com,cofounder@example.com
```

**Shows:**
- Summary cards (users, teams, games, reports, share links, exports, requests, feedback)
- Product funnel with bar chart (event counts per funnel step)
- Feedback summary (avg rating, access request count, total events)
- Recent 50 product events table

**Also accessible:** `/admin/feedback` — access requests and product feedback detail view.

**Settings page:** Admin links appear in `/settings` only when user email is in `ADMIN_EMAILS`.

---

## 7. Funnel Interpretation

The canonical funnel steps, in order:

| Step | Event | Healthy signal |
|------|-------|---------------|
| 1 | `landing_viewed` | Baseline traffic |
| 2 | `login_completed` | Conversion from landing → auth |
| 3 | `dashboard_viewed` | App engagement |
| 4 | `team_created` | Onboarding completion |
| 5 | `player_created` | Roster setup |
| 6 | `game_created` | Core workflow started |
| 7 | `timestamp_created` | Evidence layer added |
| 8 | `analysis_completed` | AI report generated |
| 9 | `insight_verified` | Coach engaged with output |
| 10 | `share_link_created` | Report useful enough to share |

**Strong signal:** Steps 7 → 8 → 9 → 10 completion without hand-holding.

**Drop-off to investigate:** Large drop between `team_created` and `game_created` (onboarding clarity issue), or between `timestamp_created` and `analysis_completed` (readiness check blocking issue).

---

## 8. What Signals Matter

### Strong signals (act immediately)

- Coach creates a team, adds 5+ key moments, generates a report, and verifies at least one insight — without guidance
- `insight_verified` or `insight_edited` after `analysis_completed` — the coach found it useful enough to engage
- `share_link_created` — the report was good enough to send to someone
- `report_export_opened` — coach wants a PDF to take to a meeting
- `feedback_submitted` with `usefulnessRating >= 4`
- Multiple coaches from the same organization (same team) creating events

### Weak signals (don't overinterpret)

- High `landing_viewed` with zero `team_created` — traffic but no conversion
- `demo_workspace_created` with no `analysis_completed` — tried demo but did not get to report
- `timestamp_created` count of 1 — tagged one event, probably abandoned
- `feedback_submitted` with no `usefulnessRating` — anonymous, low-intent
- `analysis_failed` in isolation — may be configuration issue, not product issue

---

## 9. What Not to Overinterpret

- **Total event counts without context** — 10 events from 1 user ≠ 10 users
- **`analysis_completed` without `insight_verified`** — report generated but not read carefully
- **Early user behavior** — first 5 users are not representative; wait for 20+ before drawing conclusions
- **Funnel drops** — may reflect confused setup, not bad product
- **Avg usefulness rating < 3** — could be early investor testing, not real coach feedback

---

## 10. Future Analytics Improvements

Prioritized, not in scope for v1:

1. **Unique user counts per funnel step** — currently shows event occurrence counts, not distinct users
2. **Time-to-completion metrics** — how long from `team_created` to `analysis_completed`?
3. **Retention events** — does the same user come back for a second game?
4. **Sport/role breakdowns in analytics** — currently only in access_requests table
5. **`landing_viewed` tracking** — currently not instrumented (server component page view)
6. **`login_completed` and `dashboard_viewed` tracking** — not yet instrumented
7. **Per-game event aggregation** — how many timestamps does each game have on average?
8. **Video upload tracking** — `video_uploaded` not yet instrumented

---

*Last updated: 2026-06-01 — Prompt 18*
