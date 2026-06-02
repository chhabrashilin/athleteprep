# GameIQ — Technical Debt Inventory

> An honest audit of the technical debt accumulated during the 10-phase MVP build. Items are classified by category and severity. Use this document to prioritize engineering work before and during the first coach pilot.

**Date:** June 2026  
**Codebase state:** Post-Prompt 21 (automated test suite and CI foundation)  
**Build status:** typecheck ✅ lint ✅ build ✅ tests ✅ (131 passing)

---

## Severity Key

| Level | Meaning |
|-------|---------|
| P0 | Blocks demo or exposes private data — fix immediately |
| P1 | Must fix before real coach pilot |
| P2 | Should fix during pilot period |
| P3 | Nice to have / long-term |

---

## Architecture Debt

### A1 — `any` types in shared report page
**Category:** Architecture  
**Severity:** P2  
**File:** `app/share/reports/[token]/page.tsx` (lines ~143–340)  
**Impact:** `buildMinimalFullReportData()` uses multiple `any`-typed parameters with ESLint suppression comments. Loss of type safety on the public report path — the most externally visible route.  
**Fix:** Define typed interfaces for each database row shape (CoachingInsightRow, PlayerReportRow, etc.) and replace `any` usages. Use `Record<string, unknown>` as a stepping stone or add Zod parsing at the DB read boundary.  
**Effort:** M  
**Blocks pilot:** No — functional, just untyped

---

### A2 — `Record<string, unknown>` as DB row catch-all
**Category:** Architecture  
**Severity:** P2  
**Files:** `lib/db/reports.ts`, `lib/db/players.ts`, and throughout `lib/db/`  
**Impact:** All DB row-to-type transformations (`rowToGameReport`, `rowToCoachingInsight`, etc.) cast Supabase rows as `Record<string, unknown>` before extracting typed fields. Schema changes silently break runtime without compile-time errors.  
**Fix:** Generate typed Supabase types with `supabase gen types typescript` and use them in the DB access layer. This eliminates the cast and gives compile-time schema coverage.  
**Effort:** M  
**Blocks pilot:** No

---

### A3 — Logic scattered in page components
**Category:** Architecture  
**Severity:** P3  
**Impact:** Some server component pages contain data-fetching logic that should live in `lib/db/`. As the codebase grows this makes testing and reuse harder.  
**Fix:** Audit each page component and extract data-fetching calls into the `lib/db/` layer during v1.1.  
**Effort:** M  
**Blocks pilot:** No

---

### A4 — No custom error class hierarchy
**Category:** Architecture  
**Severity:** P2  
**Files:** `lib/db/*.ts` — raw `throw new Error(message)` throughout  
**Impact:** All DB errors are generic `Error` instances with no structured fields. Impossible to distinguish `NotFoundError` from `PermissionError` from `NetworkError` in calling code. Makes error handling coarse.  
**Fix:** Define `GameIQError`, `NotFoundError`, `PermissionError` classes. Throw specific types from the DB layer. Catch and branch in server actions.  
**Effort:** S  
**Blocks pilot:** No

---

### A5 — No transactions for multi-step writes
**Category:** Architecture  
**Severity:** P2  
**Impact:** Some operations (e.g., analysis job creation + report insert + coaching_insights rows) are sequential server-action steps without a DB transaction. A partial failure leaves orphaned rows.  
**Fix:** Use Supabase RPC (PL/pgSQL function) or Postgres transactions via the service role client for multi-step writes. The `create_team_with_owner` RPC is the right pattern to follow.  
**Effort:** M  
**Blocks pilot:** No — failure is visible (job stays `running`), not silent

---

## Database Debt

### D1 — Migration numbering gaps
**Category:** Database  
**Severity:** P3  
**Files:** `supabase/migrations/` — present files: 0001, 0002, 0003, 0007, 0009, 0010 (gaps at 0004–0006, 0008)  
**Impact:** Gaps suggest deleted/rewritten migrations. A fresh Supabase project may work if run in order, but the history is confusing for new contributors.  
**Fix:** Document the gaps in `SUPABASE_SETUP.md`. Do not renumber — renumbering migrations on an existing deployment is destructive.  
**Effort:** S  
**Blocks pilot:** No

---

### D2 — JSONB report snapshot not queryable
**Category:** Database  
**Severity:** P3  
**Impact:** The `analysis_jobs.input_snapshot` is stored as JSONB. This is fine for v1 but means historical report inputs cannot be queried or compared without application-level deserialization.  
**Fix:** If cross-game trend analysis is planned, normalize key snapshot fields (event count, roster size, notes length) into typed columns. Defer until season analytics is prioritized.  
**Effort:** L  
**Blocks pilot:** No

---

### D3 — No database-level unique constraint on share tokens ✅ RESOLVED — Prompt 25
**Category:** Database  
**Severity:** P1 → ✅ RESOLVED  
**Resolution:** Migration `0012_share_links_token_unique.sql` adds `ALTER TABLE share_links ADD CONSTRAINT share_links_token_key UNIQUE (token);`. Defense-in-depth against token collision is now at the database layer.

---

### D4 — Missing index on `event_timestamps.game_id`
**Category:** Database  
**Severity:** P2  
**Impact:** The timestamp tagging page and the AI input snapshot both query `event_timestamps` by `game_id`. Without an index, this is a sequential scan. Fine at demo scale; becomes slow with real data (100+ events per game).  
**Fix:** `CREATE INDEX IF NOT EXISTS idx_event_timestamps_game_id ON event_timestamps(game_id);` in a migration.  
**Effort:** S  
**Blocks pilot:** No — demo data is small

---

### D5 — Settings page profile/password editing not wired
**Category:** Database  
**Severity:** P2  
**File:** `app/settings/page.tsx` — confirmed placeholder, form inputs disabled, references "Phase 7" and "Supabase dashboard fallback"  
**Impact:** Coaches cannot change their display name or password inside the app. Password reset requires the Supabase dashboard. This is friction for real pilots.  
**Fix:** Wire profile update to `profiles` table via server action. Add password reset via Supabase `resetPasswordForEmail`. Both are small, well-defined tasks.  
**Effort:** S  
**Blocks pilot:** No but creates friction

---

## AI Debt

### AI1 — No prompt versioning
**Category:** AI  
**Severity:** P2  
**Impact:** The system prompt and user prompt templates live in source code with no version tag stored alongside generated reports. If the prompt is changed, older reports cannot be traced to the prompt version that generated them. Complicates evaluation and regression detection.  
**Fix:** Store a `prompt_version` string (e.g., `"v1.0"`) in the `analysis_jobs` row at generation time. Increment when system prompt changes meaningfully.  
**Effort:** S  
**Blocks pilot:** No

---

### AI2 — No automated report quality evaluation
**Category:** AI  
**Severity:** P2  
**Impact:** No harness exists to score AI report quality across a golden test set. Report quality is evaluated manually by the founder reading outputs. This is sustainable for 3 pilot teams but not for 50.  
**Fix:** Define a golden test set (3–5 representative input snapshots with known-good outputs). Write an eval script that generates reports and compares to expected evidence grounding, confidence levels, and section completeness.  
**Effort:** L  
**Blocks pilot:** No

---

### AI3 — No retry logic for malformed AI JSON
**Category:** AI  
**Severity:** P2  
**Impact:** A single OpenAI API call is made per report generation attempt. If the response is malformed (non-JSON, schema mismatch), the job fails with an error. The coach must retry manually. Rare in practice with `response_format: json_object`, but possible.  
**Fix:** Wrap the AI call in a simple retry loop (max 2 retries, exponential backoff) within the server action. Log the failure reason.  
**Effort:** S  
**Blocks pilot:** No — coach can manually retry

---

### AI4 — No AI provider cost monitoring
**Category:** AI  
**Severity:** P2  
**Impact:** OpenAI spend is not tracked per team, per game, or per month inside the app. Cost visibility depends entirely on the OpenAI dashboard. A single misconfigured pilot could run up unexpected costs.  
**Fix:** Store `tokens_used` and `estimated_cost_usd` in `analysis_jobs` when using OpenAI. Add a spend summary to the admin analytics page. Also: set a hard monthly spend cap in the OpenAI dashboard immediately.  
**Effort:** S  
**Blocks pilot:** Set the OpenAI spend cap as P0 operational task

---

### AI5 — Anthropic and Gemini providers are stubs
**Category:** AI  
**Severity:** P3  
**Impact:** Both throw `ConfigurationError` if selected. Acceptable for MVP; becomes a risk if OpenAI has an outage and no fallback exists.  
**Fix:** Implement Anthropic provider using `claude-haiku-4-5-20251001` as the fallback. It shares the same JSON-mode capability.  
**Effort:** M  
**Blocks pilot:** No

---

## Video Debt

### V1 — No server-side video duration extraction
**Category:** Video  
**Severity:** P3  
**Impact:** Video duration is not extracted at upload time. Coaches enter timestamps manually without knowing the total video length. The timestamp form accepts any value.  
**Fix:** After upload, run a server-side FFmpeg probe (or use the Supabase Edge Function) to extract duration and store in `video_assets.duration_seconds`.  
**Effort:** M  
**Blocks pilot:** No — coaches know their own video length

---

### V2 — No resumable video upload
**Category:** Video  
**Severity:** P2  
**Impact:** Large video files (> 500MB) uploaded on slow connections may fail mid-upload with no recovery. The coach must restart the entire upload.  
**Fix:** Use Supabase Storage's TUS resumable upload protocol (supported by `@supabase/storage-js` v2+). Fall back to current direct upload for small files.  
**Effort:** M  
**Blocks pilot:** Depends on coach upload environment

---

### V3 — No physical clip extraction
**Category:** Video  
**Severity:** P3  
**Impact:** Video seeks to tagged timestamps (via `currentTime` property) but no actual clip file is extracted. Sharing a clip requires sharing the full video link (currently disabled for privacy). Evidence-linked clips are a high-value future feature.  
**Fix:** Add an FFmpeg-based clip extraction job (e.g., via a background worker) that produces 30-second clips around each tagged timestamp and stores them in a clips storage bucket.  
**Effort:** L  
**Blocks pilot:** No

---

### V4 — Signed URL 1-hour TTL friction
**Category:** Video  
**Severity:** P2  
**Impact:** If a coach leaves the timestamps page open for more than 1 hour, the video player stops working. No automatic renewal or user-visible warning exists.  
**Fix:** Add a client-side URL refresh mechanism (detect 403 on video load → request a new signed URL via a server action → update `<video src>`).  
**Effort:** S  
**Blocks pilot:** Creates confusion in long sessions

---

## UX Debt

### UX1 — No onboarding flow for new teams
**Category:** UX  
**Severity:** P1  
**Impact:** A new user who signs up and creates a team sees the team workspace with all steps blank. There is no guided onboarding sequence explaining what to do next. The setup checklist helps, but it doesn't actively guide.  
**Fix:** Add a welcome modal or a step-by-step onboarding prompt that appears on the first visit to the team workspace. Guide the coach through: add players → create game → upload video → tag moments → generate report.  
**Effort:** M  
**Blocks pilot:** Partially — founder can hand-hold in pilots, but needed for self-serve

---

### UX2 — Mobile layout not tested
**Category:** UX  
**Severity:** P2  
**Impact:** Tailwind CSS provides responsive utilities but mobile layout has not been tested in a real browser. The timestamp tagging workspace (two-column: video + event form) likely collapses poorly on small screens. Coaches may use phones for sideline viewing.  
**Fix:** Run the app on a mobile browser, identify layout breaks, and fix the critical paths (dashboard, report reading, share link viewing).  
**Effort:** M  
**Blocks pilot:** Low — pilot coaches will likely use laptops for film review

---

### UX3 — Timestamp form has too many fields
**Category:** UX  
**Severity:** P2  
**Impact:** The event timestamp form has 12 fields. This is thorough but creates tagging friction. Coaches may abandon mid-event.  
**Fix:** Collapse optional fields (tags, detailed description) behind an "Advanced" toggle. Make the core fields (time, label, type, importance) the default visible set.  
**Effort:** S  
**Blocks pilot:** This is a key risk — monitor in pilot sessions

---

### UX4 — No in-app feedback prompt after report generation
**Category:** UX  
**Severity:** P2  
**Impact:** After the AI report is generated, there is no prompt to rate the report quality or flag specific issues. Feedback collection requires the coach to navigate to `/feedback` separately.  
**Fix:** Add a small inline rating widget at the top of the report dashboard ("How useful is this report? ⭐⭐⭐⭐⭐") that submits to `product_feedback` without leaving the page.  
**Effort:** S  
**Blocks pilot:** No — but missing this loses valuable signal

---

### UX5 — No demo video or screenshot tour
**Category:** UX  
**Severity:** P2  
**Impact:** The landing page and demo page describe the product in text but have no screenshots or a walkthrough video. A coach viewing the landing page cannot see the product before signing up.  
**Fix:** Capture screenshots per the `SCREENSHOTS_AND_DEMO_MEDIA_PLAN.md` plan. Embed a 60-second Loom on the `/demo` page.  
**Effort:** S  
**Blocks pilot:** No — but materially improves conversion

---

## Testing Debt

### T1 — No automated test suite
**Category:** Testing  
**Severity:** P1 → ✅ RESOLVED in Prompt 21  
**Impact:** ~~Zero unit tests, integration tests, or E2E tests exist.~~  
**Fix applied:** Vitest unit tests for `lib/utils/time.ts`, `lib/ai/report-schema.ts`, `lib/analysis/normalize-generated-report.ts`, `lib/sharing/sanitize-report.ts`, and `lib/utils/permissions.ts`. React Testing Library component smoke tests for `ConfidenceBadge`, `VerificationBadge`, and `EmptyState`. 131 tests total, all passing.  
See [`/docs/TESTING_STRATEGY.md`](TESTING_STRATEGY.md).

---

### T2 — No CI/CD pipeline
**Category:** Testing  
**Severity:** P1 → ✅ RESOLVED in Prompt 21  
**Impact:** ~~No GitHub Actions workflow runs typecheck/lint/build on pull requests.~~  
**Fix applied:** `.github/workflows/ci.yml` runs typecheck, lint, `npm run test`, and build on every push and pull request. No real secrets required in CI.

---

### T3 — No test fixtures or seed scripts
**Category:** Testing  
**Severity:** P3 → ✅ PARTIALLY RESOLVED in Prompt 21  
**Impact:** In-memory typed fixtures created in `tests/fixtures/` for players, events, analysis input, generated report, and full report data. Database seed scripts for Supabase still not implemented.  
**Remaining work:** Supabase test project + integration test seeding (post-pilot).  
**Effort remaining:** M  
**Blocks pilot:** No

---

## Security Debt

### S1 — No rate limiting on API routes
**Category:** Security  
**Severity:** P1  
**Impact:** The analysis generation endpoint and share token lookup have no rate limiting. A bad actor could spam report generation (OpenAI cost) or brute-force share tokens (136-bit entropy makes this impractical but not impossible).  
**Fix:** Add Vercel's built-in rate limiting middleware or a simple IP-based rate limit on the analysis trigger and share token lookup routes.  
**Effort:** M  
**Blocks pilot:** Low risk at small scale, but should be fixed before public access

---

### S2 — Admin gating is email-based, not role-based
**Category:** Security  
**Severity:** P2  
**Impact:** Admin routes (`/admin/analytics`, `/admin/feedback`) are protected by checking the authenticated user's email against the `ADMIN_EMAILS` env var string. This is not a database-enforced role — it can be bypassed if the env var is misconfigured, and it doesn't scale.  
**Fix:** Add an `is_admin` boolean to the `profiles` table with RLS. Migrate admin gating to use `profiles.is_admin = true` checked server-side. Keep env var as an override for initial setup.  
**Effort:** M  
**Blocks pilot:** No — env var gating is acceptable for small founder team

---

### S3 — `Math.random()` for slug suffixes ✅ RESOLVED — Prompt 25
**Category:** Security  
**Severity:** P2 → ✅ RESOLVED  
**Resolution:** `lib/utils/slug.ts` `generateSlugWithSuffix` now uses `crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0, 4)` for consistent cryptographic randomness throughout the codebase.

---

### S4 — No audit log beyond product_events
**Category:** Security  
**Severity:** P3  
**Impact:** There is no structured audit log for privileged operations (team deletion, player deletion, share link revocation, admin page access). `product_events` tracks analytics events but not security-relevant actions.  
**Fix:** Add an `audit_log` table with `actor_id`, `action`, `target_type`, `target_id`, `timestamp`. Write to it on delete/revoke/admin actions via a DB trigger or server action.  
**Effort:** M  
**Blocks pilot:** No

---

## Deployment Debt

### DEP1 — No production error tracking
**Category:** Deployment  
**Severity:** P1  
**Impact:** There is no Sentry, Datadog, or equivalent error tracking configured. Production errors (failed report generation, DB connection issues, auth failures) are invisible unless a coach reports them.  
**Fix:** Add Sentry for Next.js (`@sentry/nextjs`). Configure `SENTRY_DSN` env var. Instrument server actions and API routes. 2-hour setup.  
**Effort:** S  
**Blocks pilot:** Should be in place before any real coach uses the product

---

### DEP2 — No production monitoring / uptime alerting
**Category:** Deployment  
**Severity:** P2  
**Impact:** No uptime monitoring (Uptime Robot, Better Uptime, etc.) is configured. If the Vercel deployment goes down or Supabase pauses, no alert is sent.  
**Fix:** Set up a free Uptime Robot monitor on the production URL. Add a Supabase status webhook.  
**Effort:** S  
**Blocks pilot:** Low risk at small scale, but should be set up

---

### DEP3 — No database backup strategy
**Category:** Deployment  
**Severity:** P2  
**Impact:** Supabase Pro includes automated daily backups. Free tier does not. Pilot team data (real games, real reports, real player feedback) is at risk without backups.  
**Fix:** Upgrade to Supabase Pro for production pilot deployment. Document the backup and restore procedure in `DEPLOYMENT.md`.  
**Effort:** S (operational, not code)  
**Blocks pilot:** Yes — should be in place before real coach data is stored

---

### DEP4 — No CI/CD (duplicate of T2)
**Category:** Deployment  
**Severity:** P1  
**Impact:** Covered in T2. Listed here because it affects deployment confidence as well as testing.  
**Effort:** S  
**Blocks pilot:** No — but any manual deploy could include a broken build

---

---

## Summary by Priority

| Priority | Items | Count |
|----------|-------|-------|
| P0 | OpenAI spend cap (operational, not code) | 1 |
| P1 | ~~D3 (share token UNIQUE)~~, ~~T1 (no tests)~~, ~~T2 (no CI)~~, S1 (rate limiting), DEP1 (error tracking), DEP3 (DB backup) | 3 open (3 resolved) |
| P2 | A1, A2, A4, A5, D4, D5, AI1–AI4, V2, V4, UX1–UX4, S2, ~~S3~~, DEP2 | ~15 |
| P3 | A3, D1, D2, AI5, V1, V3, UX5, T3 (partial), S4 | ~9 |

*Total items: ~28 open (T1, T2 resolved in Prompt 21; D3, S3 resolved in Prompt 25)*  
*Last updated: 2026-06-02 — Prompt 25*

---

*Last updated: June 2026 — Post Prompt 20*
