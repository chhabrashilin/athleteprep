# GameIQ — v1.1 Engineering Roadmap

> The first engineering sprint after MVP. Focus is reliability, observability, and pilot-readiness — not new features. This sprint runs during the first coach pilot period (roughly 4–6 weeks after MVP handoff).

**Goal:** Make the platform stable enough to trust with real coach data and real game workflows. Fix the issues that would embarrass the founder or lose coach trust.

---

## Priority Order

Work items are ordered by impact-to-effort. Do high-impact, low-effort items first.

---

## 1. CI/CD Pipeline

**Why it matters:** Without CI, any push to `main` can ship broken code. This is the foundation for everything else — you can't confidently ship any v1.1 fix without it.

**Tasks:**
- Create `.github/workflows/ci.yml`
- Run `npm run typecheck`, `npm run lint`, `npm run build` on every push and PR
- Add status badge to README

**Acceptance criteria:**
- CI runs on every push to `main` and on all pull requests
- Build badge shows in README
- A deliberately broken typecheck fails the CI run

**Risk if skipped:** Every bug fix during the pilot period risks introducing a new regression. One bad push during a live coach demo is a trust-killer.

**Suggested order:** Do this first, before any other v1.1 work.

---

## 2. Production Error Tracking (Sentry)

**Why it matters:** Production errors during a coach pilot are invisible without error tracking. A coach whose report generation silently fails and sees no helpful error message will lose trust and not return.

**Tasks:**
- Add `@sentry/nextjs` package
- Configure `SENTRY_DSN` env var in Vercel
- Instrument server actions and route handlers
- Add `sentry.client.config.ts` and `sentry.server.config.ts`
- Test that a deliberate error appears in the Sentry dashboard

**Acceptance criteria:**
- Sentry dashboard receives events within 5 minutes of a test error
- Server action errors (report generation failures, DB errors) are captured
- No personal data (coach notes, player names) is sent to Sentry

**Risk if skipped:** Blind during the pilot. Cannot diagnose or fix real coach issues without error data.

**Suggested order:** Do immediately after CI.

---

## 3. OpenAI Spend Controls

**Why it matters:** An open-ended OpenAI integration with no per-request or per-team spend tracking could cause unexpected costs during a pilot.

**Tasks:**
- Set hard monthly spend cap in OpenAI dashboard (operational — not code)
- Add `tokens_used` and `estimated_cost_usd` columns to `analysis_jobs` (new migration)
- Populate these fields from OpenAI API response usage object
- Show total estimated cost on the admin analytics page

**Acceptance criteria:**
- OpenAI dashboard has a monthly spend cap configured
- Each `analysis_jobs` row stores token counts and estimated cost after generation
- Admin analytics page shows aggregate spend (all time, last 30 days)

**Risk if skipped:** A malfunctioning client, a retry loop bug, or a heavy pilot user could generate unexpected OpenAI charges with no visibility.

**Suggested order:** Before enabling `AI_PROVIDER=openai` in production.

---

## 4. Database Backup and Supabase Pro

**Why it matters:** Free-tier Supabase projects pause after 1 week of inactivity and have no automated backups. Real coach data from a pilot cannot be at risk.

**Tasks:**
- Upgrade production Supabase project to Pro (operational)
- Confirm automated daily backups are enabled
- Document backup retention and restore procedure in `DEPLOYMENT.md`
- Test restore from backup on a fresh project (once)

**Acceptance criteria:**
- Production project is on Supabase Pro
- Automated backups are enabled and visible in the Supabase dashboard
- `DEPLOYMENT.md` includes a "Backup and Recovery" section

**Risk if skipped:** Data loss during the pilot destroys coach trust and may create a PR problem.

---

## 5. Share Token Unique Constraint

**Why it matters:** Token uniqueness is currently enforced by application logic only. A database-level constraint is defense-in-depth.

**Tasks:**
- Write migration: `ALTER TABLE share_links ADD CONSTRAINT share_links_token_key UNIQUE (token);`
- Verify existing tokens are already unique (they should be — entropy is high)
- Run migration on production

**Acceptance criteria:**
- `share_links.token` has a `UNIQUE` constraint in the database schema
- `supabase/migrations/` contains the new migration file
- Migration runs cleanly on a fresh project and on a project with existing data

**Risk if skipped:** Astronomically unlikely collision, but the missing constraint is an obvious oversight that a security-minded advisor would flag.

**Effort:** S — 30-minute task.

---

## 6. Settings Page — Profile Update and Password Reset

**Why it matters:** Coaches cannot change their display name or reset their password inside the app. This is friction that breaks self-serve onboarding.

**Tasks:**
- Wire profile display name update via server action writing to `profiles` table
- Add password reset button that calls Supabase `auth.resetPasswordForEmail`
- Show confirmation toast on both
- Remove "Phase 7" and "Supabase dashboard fallback" placeholder text from `app/settings/page.tsx`

**Acceptance criteria:**
- Coach can update display name in settings and see it reflected in the UI
- Coach can trigger a password reset email from the settings page
- Settings page contains no placeholder text or developer notes

**Effort:** S

---

## 7. AI Retry Logic and Prompt Versioning

**Why it matters:** A single failed OpenAI call with no retry forces the coach to manually trigger generation again. Prompt versioning makes it possible to evaluate whether prompt changes improved or regressed output quality.

**Tasks:**
- Add simple retry wrapper (max 2 retries, 1-second backoff) around AI call in `lib/ai/providers.ts`
- Add `prompt_version` text column to `analysis_jobs` via migration (default `'v1.0'`)
- Set `prompt_version` at generation time from a constant in `lib/ai/providers.ts`
- Increment constant when system prompt changes meaningfully

**Acceptance criteria:**
- A simulated OpenAI timeout triggers a retry and succeeds on the second attempt
- `analysis_jobs` rows have a `prompt_version` field
- Changing the system prompt requires updating the version constant

**Effort:** S

---

## 8. Uptime Monitoring

**Why it matters:** If the Vercel deployment goes down or Supabase pauses during a pilot session, no alert is sent. The founder finds out when a coach reports a problem.

**Tasks:**
- Create a free Uptime Robot (or Better Uptime) monitor on the production URL
- Configure email or Slack notification on downtime
- Add a `/api/health` route that checks Supabase connectivity and returns 200/503

**Acceptance criteria:**
- Uptime monitor checks production URL every 5 minutes
- Downtime triggers an email/Slack alert to the founder within 5 minutes
- `/api/health` route returns `{ status: 'ok', db: 'connected' }` when healthy

**Effort:** S

---

## 9. Event Timestamps Index

**Why it matters:** All AI report generation reads `event_timestamps` by `game_id`. Without an index, this is a sequential scan. Fine for 12 demo events; slow for real games with 50+ events.

**Tasks:**
- New migration: `CREATE INDEX IF NOT EXISTS idx_event_timestamps_game_id ON event_timestamps(game_id);`
- Optionally add similar indexes on `coaching_insights.report_id`, `player_reports.report_id`
- Run `EXPLAIN ANALYZE` on the timestamp query to confirm index use

**Acceptance criteria:**
- Index exists in the database schema
- `EXPLAIN` on the AI snapshot query shows index scan, not sequential scan

**Effort:** S

---

## 10. AI Output Evaluation Harness (Research Only)

**Why it matters:** Without a way to score report quality consistently, iterating on the AI prompt is guesswork. A simple eval harness — even manual — makes prompt iteration data-driven.

**Tasks:**
- Define 3 representative input snapshots (small, medium, large event counts)
- Store them as JSON fixtures in `test/fixtures/ai-inputs/`
- Write a simple Node script that runs each input through the AI layer and prints outputs
- Define a scoring rubric (from `REPORT_QUALITY_EVALUATION.md`) for manual scoring
- Run before and after any system prompt change

**Acceptance criteria:**
- `test/fixtures/ai-inputs/` contains 3 JSON snapshot files
- Running `node scripts/eval-ai.js` generates a report from each fixture
- Founder can manually score each report against the rubric

**Note:** This is research infrastructure, not production code. No CI integration required in v1.1.

**Effort:** M

---

## v1.1 Suggested Sprint Order

| Week | Focus | Items |
|------|-------|-------|
| Week 1 | Foundation | CI/CD (#1), Sentry (#2), OpenAI spend cap (#3) |
| Week 2 | Data safety | Supabase Pro (#4), share token constraint (#5), settings page (#6) |
| Week 3 | AI reliability | Retry logic + prompt versioning (#7) |
| Week 4 | Observability | Uptime monitoring (#8), DB index (#9), eval harness (#10) |

**Total estimated effort:** ~8–12 focused engineering days

---

## What v1.1 Does NOT Include

- Computer vision (any phase)
- Team invitations (product feature — pushed to v1.2)
- Season analytics
- Native mobile app
- Payments
- Automated E2E tests (planned for v1.1 but scope-reduced to unit tests only if time is short)

---

*See also: [`TECHNICAL_DEBT.md`](TECHNICAL_DEBT.md), [`PRIORITIZED_ISSUES.md`](PRIORITIZED_ISSUES.md)*  
*Last updated: June 2026*
