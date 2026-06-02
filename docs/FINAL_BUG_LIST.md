# GameIQ — Final Bug List

**Date:** 2026-06-02  
**Compiled:** Prompt 25 — Final Full Test Sweep and Release Candidate Lock  
**Release candidate:** GameIQ MVP RC1  

> Each bug includes: title, affected area, steps to reproduce (if known), severity, fix recommendation, and status.

---

## P0 — Blocks Release Candidate

> True blockers: private data exposed, auth broken, demo completely broken, build fails.

**No open P0 bugs.**

All P0-class items are operational (not code):

| Item | Area | Status | Notes |
|------|------|--------|-------|
| OpenAI spend cap not set | Operations | ⬜ OPEN (operational) | Set $20/mo cap in OpenAI dashboard before enabling real AI |

---

## P1 — Blocks Coach Pilot

> Must resolve before a real coach uses the product with real data.

---

**P1-1: No production error tracking (Sentry)**  
**Area:** Observability  
**Steps:** Deploy to Vercel. A report generation fails. Founder has no visibility.  
**Severity:** P1  
**Fix:** Install `@sentry/nextjs`. Set `SENTRY_DSN` in Vercel. Instrument server actions. 2–3 hours.  
**Status:** OPEN

---

**P1-2: Supabase free tier pauses after 1 week inactivity**  
**Area:** Infrastructure  
**Steps:** Deploy using free Supabase project. Return after 1 week. App returns config error.  
**Severity:** P1  
**Fix:** Upgrade to Supabase Pro plan before any real pilot. Enable automated daily backups.  
**Status:** OPEN (operational — not a code fix)

---

**P1-3: Settings page — profile editing and password reset not wired**  
**Area:** UX / Auth  
**Steps:** Sign in. Navigate to `/settings`. Try to update name or password. All inputs are disabled.  
**Severity:** P1  
**Fix:** Wire profile name update via server action writing to `profiles`. Add "Reset password" button triggering Supabase `resetPasswordForEmail`.  
**Status:** OPEN

---

**P1-4: Rate limiting on analysis generation endpoint not implemented**  
**Area:** Security / Cost control  
**Steps:** Call the report generation server action repeatedly in a loop.  
**Severity:** P1  
**Fix:** Add server-side rate limiting: N requests per team per hour (configurable). Vercel built-in rate limiting or simple in-memory limiter.  
**Status:** OPEN

---

## P2 — Should Fix During Pilot

> Important quality-of-life, reliability, and observability improvements.

---

**P2-1: Signed video URL expiry with no UX warning**  
**Area:** UX / Video  
**Steps:** Open timestamps page with a video. Leave tab open > 1 hour. Video silently stops working. No message.  
**Severity:** P2  
**Fix:** Detect 403 on video load. Request new signed URL via server action. Show "Session expired — click to refresh" if auto-renewal fails.  
**Status:** OPEN

---

**P2-2: No onboarding guidance for brand-new teams**  
**Area:** UX  
**Steps:** Sign up. Create a team. See blank workspace with no direction.  
**Severity:** P2  
**Fix:** First-visit welcome panel listing next 3 steps: add players → create game → tag moments. Dismisses on checklist completion.  
**Status:** OPEN

---

**P2-3: Timestamp form has 12 visible fields (tagging friction)**  
**Area:** UX  
**Steps:** Open timestamps page. Click Add Event. See 12 fields immediately.  
**Severity:** P2  
**Fix:** Show 4 core fields (time, label, type, importance) by default. "Add details" toggle reveals remaining fields.  
**Status:** OPEN

---

**P2-4: No inline report quality rating after generation**  
**Area:** UX / Feedback  
**Steps:** Generate report. No prompt to rate quality without navigating to `/feedback`.  
**Severity:** P2  
**Fix:** Small star-rating widget at top of report dashboard. Submits to `product_feedback` without page navigation.  
**Status:** OPEN

---

**P2-5: No AI prompt versioning in analysis_jobs**  
**Area:** AI  
**Steps:** Change system prompt. Old reports have no traceability to the prompt that generated them.  
**Severity:** P2  
**Fix:** Add `prompt_version` text column to `analysis_jobs`. Set to `"v1.0"` at generation time. Increment on meaningful prompt changes.  
**Status:** OPEN

---

**P2-6: No AI retry logic (single attempt per generation)**  
**Area:** AI  
**Steps:** OpenAI returns malformed JSON. Job fails. Coach must manually retry.  
**Severity:** P2  
**Fix:** Wrap AI call in retry loop (max 2 retries, exponential backoff). Log each failure reason.  
**Status:** OPEN

---

**P2-7: No database index on event_timestamps.game_id**  
**Area:** Database  
**Steps:** Insert 500+ events across many games. Query timestamps page. Slow sequential scan.  
**Severity:** P2  
**Fix:** Migration: `CREATE INDEX IF NOT EXISTS idx_event_timestamps_game_id ON event_timestamps(game_id);`  
**Status:** OPEN

---

**P2-8: No OpenAI token/cost tracking per report**  
**Area:** AI / Cost control  
**Steps:** Enable OpenAI mode. Generate 10 reports. No per-team or per-report cost visibility in app.  
**Severity:** P2  
**Fix:** Store `tokens_used` and `estimated_cost_usd` in `analysis_jobs` row for OpenAI calls.  
**Status:** OPEN

---

**P2-9: No uptime monitoring**  
**Area:** Operations  
**Steps:** Vercel deployment goes down. No alert sent.  
**Severity:** P2  
**Fix:** Set up Uptime Robot free plan on production URL (5-min interval). Alert to founder email.  
**Status:** OPEN (operational)

---

**P2-10: Mobile layout not tested in browser**  
**Area:** UX  
**Steps:** Open report dashboard at 375px width. Likely layout issues (not confirmed in browser).  
**Severity:** P2  
**Fix:** Run on real mobile browser. Fix critical-path layout breaks (report reading, share link view, landing page).  
**Status:** OPEN (requires browser)

---

## P2 — Fixed in Prompt 25

| Bug | Fix | File |
|-----|-----|------|
| `Math.random()` in slug suffix | Replaced with `crypto.getRandomValues()` | `lib/utils/slug.ts` |
| `share_links.token` missing DB-level UNIQUE constraint | Migration 0012 adds constraint | `supabase/migrations/0012_share_links_token_unique.sql` |
| Settings page "Phase 7" internal text | Replaced with "on the roadmap" | `app/settings/page.tsx` |

---

## P3 — Later (Post-Pilot)

| # | Title | Area | Status |
|---|-------|------|--------|
| P3-1 | Team member invitation workflow | Product | OPEN |
| P3-2 | Server-side PDF generation (Puppeteer) | Export | OPEN |
| P3-3 | Password reset flow (full) | Auth | OPEN |
| P3-4 | Season analytics — cross-game aggregation | Product | OPEN |
| P3-5 | OAuth sign-in (Google) | Auth | OPEN |
| P3-6 | Sport-specific AI prompt packs | AI | OPEN |
| P3-7 | Player role scoping (read access limited to own section) | Security / UX | OPEN |
| P3-8 | Admin role stored in database (not env var) | Security | OPEN |
| P3-9 | Resumable video upload (TUS protocol) | Video | OPEN |
| P3-10 | Computer vision — Phase 1 video utilities | Vision | OPEN |

---

## Resolved Bugs (This Release and Prior)

| Bug | Resolved In | Notes |
|-----|-------------|-------|
| `share_links.token` no DB UNIQUE constraint (P1-4) | Prompt 25 | Migration 0012 |
| `Math.random()` in slug suffix (P2-7) | Prompt 25 | `crypto.getRandomValues()` |
| Settings "Phase 7" internal text | Prompt 25 | Cosmetic |
| CI/CD pipeline missing (P1 T2) | Prompt 21 | `.github/workflows/ci.yml` |
| No automated test suite (P1 T1) | Prompt 21 | 167 tests, 9 files |
| `/support`, `/demo`, `/privacy`, `/feedback`, `/request-access` blocked for unauthenticated users | Prompt 24A | Added to `PUBLIC_PATHS` in proxy.ts |
| SignupForm missing confirm-password | Prompt 24B | Confirm-password field added |
| Unsafe redirect `?redirectTo=` not validated server-side | Prompt 24B | `lib/auth/redirect.ts` + `safeRedirect()` |
| Export page footer `aiGenerated` logic inverted | Prompt 16 | Corrected |
| Settings "Phase 1" stale banner | Prompt 16 | Replaced |
| Conflicting `middleware.ts` (Next.js 16 uses `proxy.ts`) | Prompt 16 | Deleted |

---

*See also: [`PRIORITIZED_ISSUES.md`](PRIORITIZED_ISSUES.md), [`TECHNICAL_DEBT.md`](TECHNICAL_DEBT.md), [`RELEASE_CANDIDATE_REPORT.md`](RELEASE_CANDIDATE_REPORT.md)*  
*Last updated: 2026-06-02 — Prompt 25*
