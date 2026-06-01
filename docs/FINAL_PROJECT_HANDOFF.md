# GameIQ — Final Project Handoff

> Read this document first. This is the single file you need to understand where the project is, what to do next, and what decisions to make. Every other doc linked here has more detail.

**Date:** June 2026  
**State:** MVP Complete — Moving to Pilot Phase

---

## 1. What GameIQ Is

**One sentence:** GameIQ is a coach-first AI sports intelligence platform that turns game film, roster data, and manually tagged key moments into evidence-linked coaching reports.

**The core workflow:**
1. Coach creates a team workspace and adds roster
2. Coach creates a game record (opponent, date, result, score, notes)
3. Coach uploads game video to private cloud storage
4. Coach tags key moments (timestamps, event types, players involved, importance)
5. AI generates a structured report: coaching insights, player feedback, opponent tendencies, practice recommendations
6. Each insight shows its evidence (which tagged events) and confidence score
7. Coach verifies, edits, shares, or exports the report

**What makes it different:** Not a video storage tool. Not a highlight generator. Not a chatbot. An evidence-linked, coach-verified AI report — where every claim is traceable and every mistake is correctable.

---

## 2. What Is Built

### All Core MVP Features — Complete

| Feature | Status |
|---------|--------|
| Email/password auth with protected routes | ✅ |
| Team workspaces with role-based access | ✅ |
| Roster management (full CRUD, archive, filter) | ✅ |
| Game creation with 4-section metadata form | ✅ |
| Video upload to private Supabase Storage | ✅ |
| Manual timestamp tagging (12 event fields, AI readiness badge) | ✅ |
| Mock AI report generation (no API cost) | ✅ |
| OpenAI GPT-4o-mini report generation (production) | ✅ |
| Strict Zod schema validation on all AI outputs | ✅ |
| 14 AI guardrail rules (no hallucinated IDs, no frame claims) | ✅ |
| Report dashboard (insights, players, opponent, practice, evidence) | ✅ |
| Coach verification (4 states) + inline editing + audit trail | ✅ |
| 4-mode shareable reports with entropy-based tokens | ✅ |
| Export-ready print/PDF view with section selector | ✅ |
| Founder analytics (13 events, admin dashboard) | ✅ |
| Landing page, demo experience, feedback forms | ✅ |
| Demo workspace (cricket team, 12 timestamps, full report) | ✅ |
| Pitch assets, portfolio docs, technical brief | ✅ |

### Not Built (Honest)

- No automated video frame analysis / computer vision
- No team member invitations
- No password reset flow (requires Supabase dashboard)
- No server-side PDF generation
- No season analytics / cross-game trends
- No OAuth sign-in
- No subscription billing
- No automated test suite
- No CI/CD pipeline
- No production error tracking

---

## 3. How to Run It

### Quick start (mock mode, no Supabase required)

```bash
npm install
cp .env.example .env.local
# Edit .env.local: set AI_PROVIDER=mock, NEXT_PUBLIC_ENABLE_MOCK_DATA=true
npm run dev
# Open http://localhost:3000
```

### Full development (with Supabase)

1. Create a Supabase project
2. Run migrations: `supabase/migrations/0001_*.sql` through `0010_*.sql`
3. Create `game-videos` storage bucket (private)
4. Copy Supabase URL and keys to `.env.local`
5. `npm run dev`

See [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) and [`ENVIRONMENT.md`](ENVIRONMENT.md).

### Production deployment

1. Push to GitHub
2. Connect Vercel to the repository
3. Set all environment variables in Vercel
4. Configure Supabase Auth redirect URLs
5. Deploy

See [`DEPLOYMENT.md`](DEPLOYMENT.md).

---

## 4. How to Demo It

### Demo in 60 seconds (mock mode)
1. `npm run dev`
2. Sign in (or sign up)
3. Go to `/demo/setup`
4. Click "Create demo workspace"
5. You're on the full AI report in ~10 seconds

### Founder demo (10–12 minutes)
Follow [`COACH_DEMO_GUIDE.md`](COACH_DEMO_GUIDE.md) step by step.

### For investors/advisors
Follow [`FOUNDER_DEMO_SCRIPT.md`](FOUNDER_DEMO_SCRIPT.md).

### Pitch materials
- One-pager: [`PITCH_PRODUCT_ONE_PAGER.md`](PITCH_PRODUCT_ONE_PAGER.md)
- Investor brief: [`INVESTOR_ADVISOR_BRIEF.md`](INVESTOR_ADVISOR_BRIEF.md)
- Pitch lines: [`PITCH_LINES.md`](PITCH_LINES.md)
- Portfolio: [`PORTFOLIO_SUMMARY.md`](PORTFOLIO_SUMMARY.md)

---

## 5. What Is Not Built (Honest)

**The most important limitation to communicate:**

> GameIQ does not analyze video frames automatically. The AI report is generated from structured inputs: notes, roster data, and manually tagged events. This is intentional — it delivers trustworthy reports immediately while computer vision is built for the future.

**Other gaps:**
- No team invitations (manual DB insert or founder adds directly)
- No password reset (Supabase dashboard only)
- No OAuth login (email/password only)
- Anthropic and Gemini AI providers are stubs (OpenAI and mock are production-ready)
- No automated tests or CI/CD
- No season-level analytics
- Browser PDF only (no server-side generation)

See [`KNOWN_LIMITATIONS.md`](KNOWN_LIMITATIONS.md) for the complete list.

---

## 6. Top Technical Risks

1. **No production error tracking** — Production errors are invisible. Fix: Add Sentry before any real pilot. (P1 issue)
2. **No automated tests** — Regressions during a pilot are caught manually. Fix: Add Vitest for critical lib functions. (P1 issue)
3. **No CI/CD** — A broken build can ship to production. Fix: Add GitHub Actions CI. (P1 issue)
4. **AI retry logic is minimal** — One failed API call requires manual retry. Fix: Add retry wrapper (P2 issue)
5. **`any` types in shared report page** — Type safety gap on the public-facing route. Fix: Type the database row interfaces. (P2 issue)
6. **No prompt versioning** — Can't trace which prompt version produced a given report. Fix: Store `prompt_version` in analysis_jobs. (P2 issue)

Full audit: [`TECHNICAL_DEBT.md`](TECHNICAL_DEBT.md)

---

## 7. Top Product Risks

1. **Coaches reject manual tagging** — The highest-impact assumption in the entire product. If coaches won't tag events, the product doesn't generate useful reports. Validate in Week 1 pilot sessions.
2. **AI reports are too generic** — If the output is vague, coaches dismiss it immediately. Input quality is the lever — enforce the readiness gate.
3. **Coaches don't trust AI** — The trust architecture (evidence links, confidence scores, verification) is designed for this. But if the AI is wrong too often, trust collapses.
4. **Founder overbuilds before validation** — The most common early-stage failure mode. The 30-day plan is the antidote.
5. **Input quality determines report quality** — GIGO risk. Enforce minimum inputs and educate coaches on what good tagging looks like.

Full register: [`PRODUCT_RISK_REGISTER.md`](PRODUCT_RISK_REGISTER.md)

---

## 8. Next 10 Engineering Tasks

In priority order. Do not start v1.2 features until v1.1 is complete.

1. Set OpenAI monthly spend cap (non-code — do today)
2. Add GitHub Actions CI/CD pipeline
3. Add Sentry error tracking
4. Upgrade Supabase to Pro + confirm backups
5. Add `share_links.token` UNIQUE constraint (migration)
6. Wire settings page (profile update + password reset trigger)
7. Add OpenAI token/cost tracking in `analysis_jobs`
8. Add AI retry logic (max 2 retries)
9. Add `prompt_version` field to `analysis_jobs`
10. Add `idx_event_timestamps_game_id` index

Roadmap: [`V1_1_ENGINEERING_ROADMAP.md`](V1_1_ENGINEERING_ROADMAP.md)

---

## 9. Next 10 Founder/Customer Tasks

In priority order. Coaches before features.

1. Send outreach to 15 candidate coaches (today)
2. Schedule 3 discovery calls for this week
3. Run 3 discovery calls using `COACH_DISCOVERY_GUIDE.md`
4. Prepare pilot guide (1-page plain-language overview)
5. Run 3 demo sessions with interested coaches
6. Get at least 1 real game uploaded and reported
7. Score the pilot report using `REPORT_QUALITY_EVALUATION.md`
8. Write a 5-bullet debrief after each session
9. Identify the #1 friction point from pilot sessions
10. Ask at least 1 coach: "Would you pay $X/month for this if it worked perfectly?"

Plan: [`30_DAY_FOUNDER_PLAN.md`](30_DAY_FOUNDER_PLAN.md) · [`COACH_PILOT_PLAN.md`](COACH_PILOT_PLAN.md)

---

## 10. Recommended Immediate Next Action

**Today:**

1. Open the OpenAI dashboard and set a $20 monthly hard cap. (5 minutes)
2. Read `COACH_DISCOVERY_GUIDE.md` end to end. (15 minutes)
3. Identify 5 coaches you could reach out to today — people you know or people reachable through one warm introduction. (20 minutes)
4. Send those 5 outreach messages. (30 minutes)

**This week:**

5. Deploy to production and run the full flow (not mock mode) from a fresh account.
6. Add GitHub Actions CI/CD (`.github/workflows/ci.yml` — 2-hour task).
7. Add Sentry (3-hour task).
8. Schedule 3 discovery calls.

**Rule for the next 30 days:**

> Spend more time talking to coaches than building features. If you went 3 days without a coach conversation, that's the problem to fix — not the codebase.

---

## Key Document Map

| Need | Document |
|------|---------|
| What's built | [`PITCH_PRODUCT_ONE_PAGER.md`](PITCH_PRODUCT_ONE_PAGER.md) |
| Engineering depth | [`TECHNICAL_BRIEF.md`](TECHNICAL_BRIEF.md) |
| What to fix first | [`PRIORITIZED_ISSUES.md`](PRIORITIZED_ISSUES.md) |
| Technical debt | [`TECHNICAL_DEBT.md`](TECHNICAL_DEBT.md) |
| Next engineering sprint | [`V1_1_ENGINEERING_ROADMAP.md`](V1_1_ENGINEERING_ROADMAP.md) |
| Next product version | [`V1_2_PRODUCT_ROADMAP.md`](V1_2_PRODUCT_ROADMAP.md) |
| How to run a demo | [`COACH_DEMO_GUIDE.md`](COACH_DEMO_GUIDE.md) |
| How to run a pilot | [`COACH_PILOT_PLAN.md`](COACH_PILOT_PLAN.md) |
| How to evaluate reports | [`REPORT_QUALITY_EVALUATION.md`](REPORT_QUALITY_EVALUATION.md) |
| Go/no-go decisions | [`GO_NO_GO_CRITERIA.md`](GO_NO_GO_CRITERIA.md) |
| 30-day plan | [`30_DAY_FOUNDER_PLAN.md`](30_DAY_FOUNDER_PLAN.md) |
| Privacy risks | [`DATA_PRIVACY_REVIEW.md`](DATA_PRIVACY_REVIEW.md) |
| Product risks | [`PRODUCT_RISK_REGISTER.md`](PRODUCT_RISK_REGISTER.md) |
| CV roadmap | [`COMPUTER_VISION_ROADMAP.md`](COMPUTER_VISION_ROADMAP.md) |
| All docs | [`docs/README.md`](README.md) |

---

*Last updated: June 2026*  
*Next review: After first 3 pilot sessions — update risks, priorities, and go/no-go status.*
