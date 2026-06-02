# GameIQ — Final Project Handoff

> **Read this document first.** Everything you need to understand, demo, deploy, and continue the project is here — with links to deeper references for each section.

**Release:** GameIQ MVP RC1  
**Date:** 2026-06-02  
**State:** MVP complete — ready for founder demo and controlled early coach demo

---

## 1. Executive Summary

GameIQ is a coach-first AI sports intelligence platform that turns game film, roster data, coach notes, and manually tagged key moments into evidence-linked coaching reports.

**The core insight:** Coaches already record everything. The gap is not capture — it is turning hours of film into structured decisions that players can act on. GameIQ closes that gap using a structured AI report pipeline, with full coach verification built in.

**What makes it trustworthy:** Every AI claim is traceable to a specific tagged event. Coaches see the evidence, the confidence level, and the assumptions behind each insight. They can verify, correct, or edit any AI output — and every correction is stored for future improvement. This is not a chatbot. It is an evidence-linked, coach-verified intelligence layer.

**The long-term thesis:** The first platform to capture structured coaching data at scale owns the intelligence layer for sports. Every correction, every player report, every verified insight is training signal for better models and the foundation for a sports data moat.

---

## 2. Current MVP Status

| Demo context | Status | Notes |
|-------------|--------|-------|
| **Local founder demo** | ✅ GO | Full flow works with mock AI. No external services required beyond `npm run dev`. |
| **Advisor / professor demo** | ✅ GO | Product is complete, honest, and well-documented. All pitch materials exist. |
| **Early coach demo (founder-guided, production)** | ⚠️ CONDITIONAL | Requires: Supabase Pro, Sentry configured, production smoke test completed, OpenAI spend cap set. |
| **Self-serve pilot** | ❌ NOT YET | Requires P1 items: Sentry, rate limiting, settings page, Supabase Pro. |
| **Public beta** | ❌ NOT YET | Months of v1.1 + v1.2 work required. |

**Automated checks (RC1):**

```
npm run typecheck  →  ✅ 0 errors
npm run lint       →  ✅ 0 warnings
npm run test       →  ✅ 167/167 passed (9 files)
npm run build      →  ✅ 34 routes clean, Proxy Middleware confirmed
```

---

## 3. What Is Built

| Feature | Status |
|---------|--------|
| Email/password auth with protected routes, PKCE callback | ✅ |
| Team workspaces with role-based access (owner, coach, analyst, player) | ✅ |
| Roster management (full CRUD, archive, search, filter) | ✅ |
| Game/practice creation with 4-section metadata form | ✅ |
| Video upload to private Supabase Storage with signed URL playback | ✅ |
| Manual timestamp tagging (12 event fields per event, AI readiness badge) | ✅ |
| Mock AI report generation (zero API cost, deterministic, evidence-linked) | ✅ |
| OpenAI GPT-4o-mini report generation (Zod-validated, 14 guardrail rules) | ✅ |
| Full report dashboard (6 sections: insights, players, opponent, practice, evidence, assumptions) | ✅ |
| Insight detail pages with evidence panel and video seek to timestamp | ✅ |
| Coach verification (4 states) + inline editing + append-only audit trail | ✅ |
| 4-mode shareable reports with 144-bit entropy tokens (DB-level UNIQUE constraint) | ✅ |
| Export-ready print/PDF view with section selector | ✅ |
| Support intake form + admin support review | ✅ |
| Founder analytics (13 instrumented events, admin dashboard) | ✅ |
| Landing page, demo page, request-access form, feedback form | ✅ |
| Demo workspace (cricket team, 10 players, 12 timestamps, full AI report) | ✅ |
| Global error boundary (`app/error.tsx`) + 404 page (`app/not-found.tsx`) | ✅ |
| Centralized feature flags (`lib/config/feature-flags.ts`) + env validation | ✅ |
| CI/CD via GitHub Actions (typecheck → lint → test → build) | ✅ |
| 167 automated tests across 9 files (Vitest + React Testing Library) | ✅ |
| 6 operational runbooks (support, data deletion, incident response, share revocation, video deletion, pilot support) | ✅ |
| Auth hardening: confirm-password field, email validation, safe redirects, profile guarantee | ✅ |

---

## 4. What Is Not Built

Be honest about these when talking to coaches or advisors.

| Item | Notes |
|------|-------|
| Automated video frame analysis / computer vision | By design for v1. Manual tagging captures 80–90% of the value. CV is roadmap. |
| Player / ball tracking | Roadmap. See [`COMPUTER_VISION_ROADMAP.md`](COMPUTER_VISION_ROADMAP.md). |
| Physical clip extraction | Video seeks to timestamp but no clip file is generated. |
| Server-side PDF generation | Browser print-to-PDF only. |
| Production error tracking (Sentry) | P1 — must add before real pilot. |
| Team member invitations | Manual DB insert. P3 product feature. |
| Password reset UI | Supabase dashboard workaround. P1 (settings page wiring). |
| OAuth sign-in (Google) | Auth callback ready. Providers not configured. P3. |
| Season analytics | Single-game only. P3 product feature. |
| Subscription billing / payments | Out of scope for v1. |
| Anthropic and Gemini AI providers | Clean stubs. Only Mock and OpenAI work in production. |
| Rate limiting on analysis generation | P1 — must add before self-serve pilot. |
| Settings page wiring (profile + password) | Settings UI exists but inputs are disabled. P1. |
| Supabase Pro / automated DB backups | Operational prerequisite for real pilot. |

---

## 5. How to Run Locally

### Quick start (mock AI, no Supabase needed)

```bash
npm install
cp .env.example .env.local
# Edit .env.local — set these two:
# AI_PROVIDER=mock
# NEXT_PUBLIC_ENABLE_MOCK_DATA=true

npm run dev
# Open http://localhost:3000
# Sign up, go to /demo/setup, click Create demo workspace
```

### Full development (with Supabase)

```bash
npm install
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# Set: AI_PROVIDER=mock, NEXT_PUBLIC_ENABLE_MOCK_DATA=true
npm run dev
```

### Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server at localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | ESLint |
| `npm run test` | All unit + component tests (Vitest) |
| `npm run test:e2e` | Playwright E2E (requires running server) |

---

## 6. How to Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run 8 migrations in order in SQL Editor (see [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md)):
   - `0001` — full schema (17 tables, 12 enums, RLS, helper functions, auth trigger)
   - `0002` — team creation RPC (`create_team_with_owner`)
   - `0003` — storage bucket RLS policies
   - `0007` — verification/editing adjustments
   - `0009` — feedback tables (`access_requests`, `product_feedback`)
   - `0010` — product analytics events
   - `0011` — support requests table
   - `0012` — share token UNIQUE constraint
3. Create 3 private storage buckets: `game-videos`, `game-thumbnails`, `report-exports`
4. Configure Auth redirect URLs in Supabase Dashboard → Authentication → URL Configuration
5. Copy URL and keys to `.env.local`

See [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) and [`PRODUCTION_SUPABASE_CHECKLIST.md`](PRODUCTION_SUPABASE_CHECKLIST.md).

---

## 7. How to Use Mock AI

Mock AI is the default and recommended mode for demos, development, and testing.

```env
AI_PROVIDER=mock
NEXT_PUBLIC_ENABLE_REAL_AI=false
```

Mock AI:
- Generates deterministic, evidence-linked reports instantly (< 1 second)
- Zero API cost
- Validates the full report pipeline end-to-end
- Produces realistic coaching insights, player reports, practice recommendations, and opponent tendencies
- Uses the same Zod schema validation as the real provider

No API key or network call is needed in mock mode.

---

## 8. How to Use Real AI

**Before enabling real AI, set a monthly spend cap in your OpenAI account dashboard.**

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_ENABLE_REAL_AI=true
```

Each report generation uses approximately 3,000–8,000 tokens (~$0.002–$0.006 with GPT-4o-mini at current rates). For 50 reports/month, budget ~$0.30. Set a $20/month cap as a safety limit.

The real AI output uses the same Zod validation and 14 guardrail rules as mock mode. The system prompt explicitly forbids inventing player names, fabricating timestamps, or claiming to analyze video frames the AI has not seen.

See [`REAL_AI_PROVIDER_LAYER.md`](REAL_AI_PROVIDER_LAYER.md).

---

## 9. How to Create Demo Data

With `NEXT_PUBLIC_ENABLE_MOCK_DATA=true`:

1. Sign in to the app
2. Navigate to `/demo/setup`
3. Click **Create demo workspace**
4. Wait ~10 seconds — you are redirected to the full AI report

This creates:
- **Madison Cricket XI** — 10-player cricket team
- **Match vs Lakeside CC** — game with score, result, notes
- **12 tagged key moments** — batting, bowling, fielding, opponent events
- **Full AI coaching report** — all 6 dashboard sections

See [`DEMO_DATA.md`](DEMO_DATA.md).

---

## 10. How to Demo the Product

**5-minute demo (mock mode, localhost):**

1. Start the app (`npm run dev`)
2. Sign in and navigate to `/demo/setup` → Create demo workspace
3. Show the report dashboard — point to insights with evidence
4. Open an insight → show the evidence panel
5. Mark an insight as verified
6. Create a share link → open in private/incognito window
7. Show the print/export view

**Key talking points:**
- "Every insight links back to a specific tagged moment"
- "The coach sees the evidence before trusting the AI"
- "They can correct the AI — and those corrections are stored"
- "This doesn't require computer vision — it works with what coaches already have"

See [`FINAL_DEMO_INSTRUCTIONS.md`](FINAL_DEMO_INSTRUCTIONS.md) and [`COACH_DEMO_GUIDE.md`](COACH_DEMO_GUIDE.md).

---

## 11. How to Test

### Automated checks

```bash
npm run typecheck    # 0 errors — TypeScript strict
npm run lint         # 0 warnings — ESLint
npm run test         # 167/167 passed
npm run build        # 34 routes, clean
npm run test:e2e     # Playwright (requires live dev server + Supabase)
```

### Test coverage

- Timestamp parsing and formatting
- AI report Zod schema validation
- AI output normalization and hallucination guards
- Share report sanitization (all 4 visibility modes)
- Permission helper functions
- Component smoke tests (ConfidenceBadge, VerificationBadge, EmptyState)
- Auth redirect safety (14 tests)
- Auth form validation (22 tests)

See [`FINAL_TESTING_INSTRUCTIONS.md`](FINAL_TESTING_INSTRUCTIONS.md) and [`TESTING_STRATEGY.md`](TESTING_STRATEGY.md).

---

## 12. How to Deploy

**Target:** Vercel (Next.js) + Supabase Pro (Auth + Postgres + Storage)

**Quick deployment:**

1. Push to GitHub
2. Connect Vercel to the repo (vercel.com → Add New Project)
3. Set all environment variables in Vercel Settings → Environment Variables
4. Click Deploy
5. Configure Auth redirect URLs in Supabase to match Vercel domain
6. Run the 20-step production smoke test

**Before going live with real coaches:**
- Upgrade Supabase to Pro plan (prevents auto-pause, enables backups)
- Configure Sentry for production error tracking
- Set OpenAI monthly spend cap
- Complete the full 20-step smoke test: [`PRODUCTION_SMOKE_TEST.md`](PRODUCTION_SMOKE_TEST.md)

See [`DEPLOYMENT.md`](DEPLOYMENT.md).

---

## 13. Security Notes

| Layer | Status |
|-------|--------|
| Row Level Security (all 17 tables) | ✅ Enabled — verified in migrations |
| Service role key (server-only) | ✅ Never in `NEXT_PUBLIC_` prefix |
| Share token entropy (144-bit) | ✅ `crypto.randomBytes(18)` |
| Share token DB UNIQUE constraint | ✅ Migration 0012 |
| Video access (signed URLs, 1-hour TTL) | ✅ Never exposed in shared views |
| Admin routes | ✅ `ADMIN_EMAILS` env + authenticated user check |
| Safe redirect (open-redirect prevention) | ✅ `isSafeRedirect()` in proxy + callback |
| AI API keys (server-only) | ✅ Never in `NEXT_PUBLIC_` |
| Slug randomness | ✅ `crypto.getRandomValues()` |

**Known security limitations (acceptable for MVP):**
- View count increment is non-atomic (race condition on concurrent views — fire-and-forget, not security-sensitive)
- No rate limiting on analysis generation (P1 — must fix before self-serve pilot)
- Admin role is env-var-based, not DB-enforced (P3 — acceptable for small founder team)

---

## 14. Known Risks

### Technical

1. **No production error tracking** — Production failures are invisible without Sentry. Fix before pilot.
2. **No rate limiting on generation endpoint** — A misconfigured client or bad actor can spam reports (OpenAI cost exposure). Fix before self-serve pilot.
3. **`any` types in shared report page** — Type safety gap on the public-facing route. P2.
4. **No AI retry logic** — One failed API call requires manual retry. P2.
5. **No prompt versioning** — Can't trace which prompt produced a given report. P2.

### Product

1. **Coaches may reject manual tagging** — This is the highest-impact assumption. If coaches won't tag events, reports are generic. Validate in Week 1 pilot sessions.
2. **AI report quality depends on input quality** — GIGO. A 3-event game produces a weak report. Enforce the readiness gate and educate coaches.
3. **Report quality untested with real sports data** — Mock outputs look correct; OpenAI with real game data is untested.

### Privacy

1. **No formal privacy policy** — MVP placeholder at `/privacy`. Legally reviewed policy required for public beta.
2. **No COPPA compliance** — If any pilot team has under-13 players, defer or add explicit consent workflow.
3. **Data deletion is manual** — Runbook exists (`DATA_DELETION_PLAN.md`), but no in-app deletion UI for coaches.

---

## 15. Next 10 Engineering Tasks

Priority order — do not start v1.2 features until v1.1 is complete.

1. **Set OpenAI monthly spend cap** — 5 minutes in OpenAI dashboard. Do today.
2. **Add Sentry error tracking** — `@sentry/nextjs`, `SENTRY_DSN` in Vercel, instrument server actions. ~3 hours.
3. **Upgrade Supabase to Pro** — enables backups, prevents auto-pause. Operational, not code.
4. **Wire settings page** — profile name update via server action + "Reset password" button via `resetPasswordForEmail`. ~3 hours.
5. **Add rate limiting on analysis generation** — server-side, per-team-per-hour limit. ~4 hours.
6. **Add OpenAI token/cost tracking** — `tokens_used` + `estimated_cost_usd` in `analysis_jobs`. ~2 hours.
7. **Add AI retry logic** — max 2 retries with exponential backoff in the generation server action. ~2 hours.
8. **Add `prompt_version` to `analysis_jobs`** — store `"v1.0"` at generation time. ~1 hour.
9. **Add `idx_event_timestamps_game_id` index** — migration adds index for performance at real scale. ~30 minutes.
10. **Set up Uptime Robot monitoring** — free plan, 5-min checks on production URL. ~30 minutes.

---

## 16. Next 10 Founder / Customer Tasks

Coaches before code. The most important thing right now is not engineering.

1. **Send outreach to 15 candidate coaches today** — people you know or one warm introduction away.
2. **Schedule 3 discovery calls this week** — use [`COACH_DISCOVERY_GUIDE.md`](COACH_DISCOVERY_GUIDE.md).
3. **Run 3 discovery calls** — listen for: how they currently review film, what their biggest pain is, what they wish they had.
4. **Deploy to production** — run the full flow from a fresh account (not mock mode).
5. **Run the 20-step production smoke test** — personally, before the first coach session.
6. **Prepare the pilot guide** — 1-page plain-language overview for coaches (use [`PILOT_PARTICIPANT_EXPECTATIONS.md`](PILOT_PARTICIPANT_EXPECTATIONS.md)).
7. **Demo to at least 2 interested coaches** — use [`FINAL_DEMO_INSTRUCTIONS.md`](FINAL_DEMO_INSTRUCTIONS.md).
8. **Get 1 real game uploaded and reported** — with a willing coach, real data, real workflow.
9. **Score the pilot report** — use [`REPORT_QUALITY_EVALUATION.md`](REPORT_QUALITY_EVALUATION.md), identify the weakest dimension.
10. **Ask at least 1 coach: "Would you pay $X/month for this if it worked perfectly?"** — this is the most important question.

---

## 17. Recommended Immediate Next Action

**Do these four things today, in order:**

1. Open the OpenAI dashboard and set a $20/month hard cap. (5 minutes)
2. Deploy to Vercel + Supabase Pro and run the 20-step smoke test. (2–3 hours)
3. Install Sentry. (2–3 hours)
4. Send 5 outreach messages to coaches you know or can reach through one introduction. (30 minutes)

**This week:**
- Schedule 3 coach discovery calls
- Add rate limiting on analysis generation
- Wire the settings page

**The rule for the next 30 days:**

> Spend more time talking to coaches than building features. If you went 3 days without a coach conversation, that is the problem to fix — not the codebase.

---

## Key Document Map

| Need | Document |
|------|---------|
| Release status | [`FINAL_RELEASE_STATUS.md`](FINAL_RELEASE_STATUS.md) |
| Demo instructions | [`FINAL_DEMO_INSTRUCTIONS.md`](FINAL_DEMO_INSTRUCTIONS.md) |
| Test instructions | [`FINAL_TESTING_INSTRUCTIONS.md`](FINAL_TESTING_INSTRUCTIONS.md) |
| Startup positioning | [`FINAL_POSITIONING.md`](FINAL_POSITIONING.md) |
| Bug list | [`FINAL_BUG_LIST.md`](FINAL_BUG_LIST.md) |
| RC1 report | [`RELEASE_CANDIDATE_REPORT.md`](RELEASE_CANDIDATE_REPORT.md) |
| Engineering depth | [`TECHNICAL_BRIEF.md`](TECHNICAL_BRIEF.md) |
| Product pitch | [`PITCH_PRODUCT_ONE_PAGER.md`](PITCH_PRODUCT_ONE_PAGER.md) |
| What to fix first | [`PRIORITIZED_ISSUES.md`](PRIORITIZED_ISSUES.md) |
| Technical debt | [`TECHNICAL_DEBT.md`](TECHNICAL_DEBT.md) |
| Next engineering sprint | [`V1_1_ENGINEERING_ROADMAP.md`](V1_1_ENGINEERING_ROADMAP.md) |
| How to demo | [`COACH_DEMO_GUIDE.md`](COACH_DEMO_GUIDE.md) |
| How to run a pilot | [`COACH_PILOT_PLAN.md`](COACH_PILOT_PLAN.md) |
| How to evaluate reports | [`REPORT_QUALITY_EVALUATION.md`](REPORT_QUALITY_EVALUATION.md) |
| Go/no-go decisions | [`GO_NO_GO_CRITERIA.md`](GO_NO_GO_CRITERIA.md) |
| 30-day founder plan | [`30_DAY_FOUNDER_PLAN.md`](30_DAY_FOUNDER_PLAN.md) |
| Privacy risks | [`DATA_PRIVACY_REVIEW.md`](DATA_PRIVACY_REVIEW.md) |
| Product risks | [`PRODUCT_RISK_REGISTER.md`](PRODUCT_RISK_REGISTER.md) |
| All docs | [`docs/README.md`](README.md) |

---

*Last updated: 2026-06-02 — Prompt 26: Final Project Handoff*  
*Prior updates: Prompts 21 (CI/CD + tests), 22 (deployment), 23 (operations), 24A/B (auth hardening), 25 (RC1 lock)*
