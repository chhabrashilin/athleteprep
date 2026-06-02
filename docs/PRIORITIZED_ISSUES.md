# GameIQ — Prioritized Issue Backlog

> A prioritized issue list ready for conversion into GitHub Issues. Each issue includes a description, affected area, effort estimate, and acceptance criteria.

**Date:** June 2026  
**Last updated:** Prompt 21 — Automated Test Suite and CI Foundation  
**Based on:** Technical debt audit, MVP readiness report, known limitations

---

## P0 — Must Fix Before Any External Demo

> True blockers. If any of these are broken, stop and fix before showing the product to anyone.

*Current status: No P0 blockers exist. The app builds, auth works, report generation works, sharing works, and the demo flow is functional.*

---

**P0-1: OpenAI spend cap not verified (operational)**  
**Area:** Operations / Cost control  
**Description:** If `AI_PROVIDER=openai` is set in production and a coach generates many reports, OpenAI costs could spiral without a spending cap. This is not a code fix — it requires an account setting.  
**Effort:** S (5 minutes in OpenAI dashboard)  
**Acceptance criteria:** Monthly hard cap set in OpenAI dashboard. Screenshot saved to founder notes.

---

## P1 — Must Fix Before Coach Pilot

> These issues will cause real friction, data loss risk, or missing observability during a real pilot with a real coach.

---

**P1-1: Add Sentry error tracking**  
**Area:** Observability  
**Description:** There is no production error tracking. If a coach's report generation fails or an auth flow breaks in production, the error is invisible to the founder.  
**Effort:** S  
**Acceptance criteria:** `@sentry/nextjs` installed and configured. `SENTRY_DSN` env var set in Vercel. At least server action errors captured. Sentry dashboard shows events on test error trigger.

---

**P1-2: Add CI/CD pipeline (GitHub Actions)** ✅ RESOLVED — Prompt 21  
**Area:** Engineering process  
**Description:** ~~No automated CI exists.~~  
**Resolution:** `.github/workflows/ci.yml` created. Runs typecheck, lint, `npm run test` (131 tests), and build on every push and PR. No real secrets required. Uses mock AI provider.

---

**P1-3: Upgrade Supabase to Pro for production pilot**  
**Area:** Infrastructure  
**Description:** Supabase free tier pauses after ~1 week of inactivity and has no automated backups. Real coach data (games, reports, player notes) requires a Pro project.  
**Effort:** S (operational, not code)  
**Acceptance criteria:** Production Supabase project is on Pro plan. Automated daily backups confirmed enabled. `DEPLOYMENT.md` updated with note about plan requirement.

---

**P1-4: Add database UNIQUE constraint on `share_links.token`** ✅ RESOLVED — Prompt 25  
**Area:** Database / Security  
**Resolution:** Migration `0012_share_links_token_unique.sql` adds `ALTER TABLE share_links ADD CONSTRAINT share_links_token_key UNIQUE (token);`.

---

**P1-5: Wire settings page — password reset and profile update**  
**Area:** UX / Auth  
**Description:** The settings page is a confirmed placeholder. Coaches cannot change their display name or reset their password inside the app. Password reset requires the Supabase dashboard, which coaches cannot access.  
**Effort:** S  
**Acceptance criteria:** Profile display name update works via server action writing to `profiles`. "Reset password" button triggers Supabase `resetPasswordForEmail` and shows a confirmation toast. Settings page no longer references "Phase 7" or "Supabase dashboard fallback."

---

**P1-6: Add OpenAI spend tracking in analysis_jobs**  
**Area:** AI / Cost control  
**Description:** OpenAI token usage and estimated cost are not stored alongside report generation records. No per-team or per-game cost visibility exists in the app.  
**Effort:** S  
**Acceptance criteria:** `analysis_jobs` row stores `tokens_used` (integer) and `estimated_cost_usd` (numeric) after each OpenAI call. Admin analytics page shows total estimated cost.

---

**P1-7: Improve onboarding guidance for new teams**  
**Area:** UX  
**Description:** A new coach who signs up and creates a team sees a blank workspace with no direction. The setup checklist exists but doesn't actively guide. Pilots risk stalling before a coach reaches report generation.  
**Effort:** M  
**Acceptance criteria:** New team workspace shows a prominent first-visit welcome panel explaining the next 3 steps (add players → create game → upload video). Panel dismisses on completion or explicit dismiss. Setup checklist links each step to its destination route.

---

**P1-8: Rate limiting on analysis generation endpoint**  
**Area:** Security / Cost control  
**Description:** The report generation server action has no rate limiting. A misconfigured client or bad actor could spam it, driving up OpenAI costs.  
**Effort:** M  
**Acceptance criteria:** Analysis generation is limited to N requests per team per hour (configurable via env var, default 10). Requests over the limit receive a clear error message. Rate limit is enforced server-side.

---

## P2 — Should Fix During Pilot

> Important quality-of-life and reliability improvements. Fix these while running the first pilot.

---

**P2-1: Add inline report quality rating widget**  
**Area:** UX / Feedback  
**Description:** No in-app prompt to rate report quality after generation. Feedback is only collectible via `/feedback` page, which coaches may not visit.  
**Effort:** S  
**Acceptance criteria:** Small rating widget (1–5 stars) appears at top of report dashboard after first-time load. Submits to `product_feedback` table without navigating away. Dismisses after submission.

---

**P2-2: Collapse timestamp form optional fields**  
**Area:** UX  
**Description:** The event timestamp form exposes all 12 fields by default, creating tagging friction. Core fields (timestamp, label, type, importance) should be immediately visible; details (description, tags, players) behind "Advanced."  
**Effort:** S  
**Acceptance criteria:** Timestamp form shows 4 core fields by default. "Add details" toggle reveals remaining fields. Default expanded state persists within the session.

---

**P2-3: Fix signed video URL expiry UX**  
**Area:** UX / Video  
**Description:** Signed video URLs expire after 1 hour. If a coach leaves the timestamps page open and returns, the video silently fails. No warning or refresh mechanism exists.  
**Effort:** S  
**Acceptance criteria:** If the video player receives a 403/401 on load, it automatically requests a new signed URL via server action and retries. Or: show a "Video session expired — click to refresh" button.

---

**P2-4: Add missing database index on `event_timestamps.game_id`**  
**Area:** Database  
**Description:** The AI input snapshot and timestamp list both query `event_timestamps` by `game_id`. No index exists — fine at demo scale, slow at real scale.  
**Effort:** S  
**Acceptance criteria:** New migration adds `CREATE INDEX IF NOT EXISTS idx_event_timestamps_game_id ON event_timestamps(game_id)`. Confirm via `EXPLAIN` on the query.

---

**P2-5: Add AI prompt versioning**  
**Area:** AI  
**Description:** System prompt changes are not tracked alongside generated reports. Can't trace which prompt version produced a given report.  
**Effort:** S  
**Acceptance criteria:** `analysis_jobs` table has `prompt_version` text column (migration). Value is set to a constant like `"v1.0"` at generation time. Incremented when the system prompt changes meaningfully.

---

**P2-6: Add simple AI retry logic (max 2 retries)**  
**Area:** AI  
**Description:** A single OpenAI call per report. Rare but real failures (network timeout, malformed JSON) require the coach to manually retry.  
**Effort:** S  
**Acceptance criteria:** Report generation retries up to 2 times on failure before marking the job as failed. Each retry attempt is logged.

---

**P2-7: Replace `Math.random()` with `crypto.getRandomValues()` in slug generation** ✅ RESOLVED — Prompt 25  
**Area:** Security  
**Resolution:** `lib/utils/slug.ts` now uses `crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0, 4)` for the collision-avoidance suffix.

---

**P2-8: Test and fix mobile layout on critical paths**  
**Area:** UX  
**Description:** Mobile layout has not been tested in a real browser. The report dashboard and shared report view are likely the most important mobile paths (coaches share reports with players).  
**Effort:** M  
**Acceptance criteria:** Report dashboard, shared report view, and landing page are usable on a 375px-wide mobile screen. No layout breakage on the core reading paths. Timestamp tagging is not required to be mobile-friendly in v1.

---

**P2-9: Add Uptime Robot monitoring for production**  
**Area:** Operations  
**Description:** No uptime alerting exists. Production outages are invisible until a coach reports them.  
**Effort:** S (operational)  
**Acceptance criteria:** Uptime Robot (or equivalent) monitors the production URL every 5 minutes. Alerts sent to founder email on downtime. Supabase project status also checked.

---

**P2-10: Add typed Supabase-generated types to DB layer**  
**Area:** Architecture  
**Description:** DB access layer uses `Record<string, unknown>` for row types. Running `supabase gen types typescript` and using the generated types would catch schema/code mismatches at compile time.  
**Effort:** M  
**Acceptance criteria:** `supabase gen types typescript --project-id [id] > lib/supabase/database.types.ts`. At least the primary read functions in `lib/db/reports.ts` and `lib/db/players.ts` use generated types instead of `Record<string, unknown>`.

---

## P3 — Later (Post-Pilot / v1.2+)

> Important but not blocking early pilots. Revisit after coach feedback.

---

**P3-1: Team member invitation workflow**  
**Area:** Product / UX  
**Description:** No in-app invitation system. Team owners cannot invite coaches or players by email. Requires Supabase dashboard or direct DB insert.  
**Effort:** M

---

**P3-2: Server-side PDF generation**  
**Area:** Export  
**Description:** Current export relies on browser print-to-PDF. No automated PDF storage, emailing, or consistent rendering across browsers/OSes.  
**Effort:** L

---

**P3-3: Password reset flow (Supabase recovery)**  
**Area:** Auth  
**Description:** No "Forgot password?" feature. Recovery must happen via Supabase dashboard.  
**Effort:** S  
*Note: Partially addressed by P1-5 (settings page) — the "Reset password" button is the first step*

---

**P3-4: Season analytics — cross-game aggregation**  
**Area:** Product  
**Description:** No aggregation across multiple games. No trend detection, no player development tracking across a season.  
**Effort:** L

---

**P3-5: OAuth sign-in (Google)**  
**Area:** Auth  
**Description:** Only email/password auth. Google OAuth would reduce signup friction significantly. Auth callback route is designed to support it.  
**Effort:** S

---

**P3-6: Sport-specific AI prompt packs**  
**Area:** AI  
**Description:** A single AI prompt handles all sports. Soccer-specific event types, cricket terminology, and basketball tactics are all handled generically. Sport-specific prompts would improve report quality.  
**Effort:** M

---

**P3-7: Player role scoping (read access)**  
**Area:** Security / UX  
**Description:** Players currently have the same read access as staff. Player-scoped access (show only own report) is a documented known limitation.  
**Effort:** M

---

**P3-8: Admin role stored in database (not env var)**  
**Area:** Security  
**Description:** Admin gating uses env var string matching. Should migrate to `profiles.is_admin` boolean enforced by RLS.  
**Effort:** M

---

**P3-9: Vitest unit tests for critical lib functions** ✅ RESOLVED — Prompt 21  
**Area:** Testing  
**Description:** ~~Add unit tests for critical lib functions.~~  
**Resolution:** 131 tests across 7 test files covering time utilities, AI schema validation, normalization, sharing sanitization, and permissions. See [`/docs/TESTING_STRATEGY.md`](TESTING_STRATEGY.md).

---

**P3-10: Computer vision — Phase 1 video utilities**  
**Area:** Product / Vision  
**Description:** Duration extraction, thumbnail generation, clip extraction around tagged timestamps. First CV milestone that adds value without requiring full event detection.  
**Effort:** L  
See [`COMPUTER_VISION_ROADMAP.md`](COMPUTER_VISION_ROADMAP.md)

---

*Last updated: 2026-06-02 — Prompt 25 (P1-4 and P2-7 resolved)*
