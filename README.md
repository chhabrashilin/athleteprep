# GameIQ

**AI game review in 10 minutes.**

GameIQ turns game film, roster data, coach notes, and manually tagged key moments into evidence-linked coaching insights, player feedback, opponent tendencies, and next-practice plans — with full coach verification and sharing built in.

---

## What GameIQ Does

Most sports teams record more game footage than they can meaningfully analyze. Post-game film review takes 2–4 hours and still produces vague feedback. Smaller programs cannot afford a dedicated analyst.

GameIQ answers the questions coaches actually need answered:

- What happened and why did it matter?
- Who was involved?
- What evidence supports this claim?
- How confident is the AI?
- What should each player work on individually?
- What should we run at the next practice?

**The workflow:**

1. Coach creates a team workspace and adds roster
2. Coach creates a game record (opponent, date, result, score, notes)
3. Coach uploads game video to private cloud storage
4. Coach tags key moments (timestamp, event type, players involved, importance, description)
5. AI generates a structured coaching report grounded in those inputs
6. Each insight shows its evidence (which tagged events), confidence level, and assumptions
7. Coach verifies, edits, shares, or exports the report

**What makes it different:**

Not a video storage tool. Not a highlight reel. Not a chatbot. An evidence-linked, coach-verified AI report — where every claim is traceable and every mistake is correctable.

---

## Why It Matters

> "I record everything. I just don't have time to turn it into something useful for my players."
> — every coach we talked to

The platform captures the highest-leverage moment in a coach's week: the moment between watching film and communicating decisions to players. GameIQ structures that moment — and builds the data foundation for everything that follows.

**The long-term thesis:** the first platform to capture structured coaching data at scale owns the intelligence layer for sports. Every verified insight, every correction, every player report is training signal for better models.

---

## MVP Feature Set

| Feature | Status |
|---------|--------|
| Email/password auth with protected routes | ✅ |
| Team workspaces with role-based access (owner, coach, analyst, player) | ✅ |
| Roster management — full CRUD, archive, search, position/status filter | ✅ |
| Game/practice creation with 4-section metadata form | ✅ |
| Video upload to private Supabase Storage with signed URL playback | ✅ |
| Manual timestamp tagging (12 event fields per event, AI readiness badge) | ✅ |
| Mock AI report generation (no API cost, deterministic, evidence-linked) | ✅ |
| OpenAI GPT-4o-mini report generation (Zod-validated, guardrail-enforced) | ✅ |
| 14 AI guardrail rules (no hallucinated IDs, no video frame claims, JSON only) | ✅ |
| Report dashboard — 6 sections: insights, players, opponent, practice, evidence, assumptions | ✅ |
| Insight detail with evidence panel and video seek to timestamp | ✅ |
| Coach verification (accurate / partially accurate / inaccurate / edited) | ✅ |
| Inline editing with append-only audit trail | ✅ |
| 4-mode shareable reports with 144-bit entropy tokens | ✅ |
| Export-ready print/PDF view with section selector | ✅ |
| Support intake form + admin support review page | ✅ |
| Founder analytics — 13 instrumented events, admin dashboard | ✅ |
| Landing page, demo experience, request-access form, feedback form | ✅ |
| Demo workspace (cricket team, 10 players, 12 timestamps, full AI report) | ✅ |
| Global error boundary + 404 page | ✅ |
| Centralized feature flags + env validation | ✅ |
| CI/CD via GitHub Actions (typecheck → lint → test → build) | ✅ |
| 6 operational runbooks (support, data deletion, incident response, etc.) | ✅ |
| Auth hardening: confirm-password, email validation, safe redirects, profile guarantee | ✅ |

---

## Demo Flow

With `NEXT_PUBLIC_ENABLE_MOCK_DATA=true`:

1. Sign in to your account
2. Visit `/demo/setup` and click **Create demo workspace**
3. The app creates a demo team, game, roster, and AI report in ~10 seconds
4. You land directly on the full AI report dashboard

The demo workspace contains:
- **Madison Cricket XI** — 10-player cricket team with positions and jersey numbers
- **Match vs Lakeside CC** — game with score, result, coach notes, and opponent notes
- **12 tagged key moments** — batting, bowling, fielding, and opponent events
- **Full AI coaching report** — insights, player reports, practice recommendations, opponent tendencies

See [`/docs/FINAL_DEMO_INSTRUCTIONS.md`](docs/FINAL_DEMO_INSTRUCTIONS.md) and [`/docs/FOUNDER_DEMO_SCRIPT.md`](docs/FOUNDER_DEMO_SCRIPT.md).

---

## Screenshots / Demo Media

> Screenshots are planned but not yet captured. Run the demo setup (`/demo/setup`) to see the full product.
>
> See [`/docs/SCREENSHOTS_AND_DEMO_MEDIA_PLAN.md`](docs/SCREENSHOTS_AND_DEMO_MEDIA_PLAN.md) for the screenshot checklist.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19 + Tailwind CSS 4 |
| Auth | Supabase Auth + `@supabase/ssr` (PKCE flow) |
| Database | Supabase Postgres + Row Level Security (17 tables) |
| Storage | Supabase Storage (private video bucket, signed URLs) |
| AI | Provider-agnostic layer — Mock (default), OpenAI GPT-4o-mini (production) |
| Validation | Zod (strict JSON schema on all AI outputs) |
| Testing | Vitest + React Testing Library (167 tests) + Playwright (E2E) |
| CI/CD | GitHub Actions |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Architecture Overview

```
Browser
  └── Next.js App Router
        ├── Server Components   — data fetching, layout, access control
        ├── Client Components   — forms, video player, interactivity
        ├── Server Actions      — all mutations (team, game, player, report)
        └── Route Handlers      — analysis job API
              └── Supabase (Auth + Postgres + Storage)
                    └── AI Provider Layer
                          ├── Mock (deterministic, zero API cost)
                          ├── OpenAI GPT-4o-mini (production-ready)
                          ├── Anthropic (stub — not implemented)
                          └── Gemini (stub — not implemented)
```

**Key directories:**

```
app/            Next.js routes (pages, layouts, server actions)
  auth/         Auth pages and callbacks
  teams/        Team, roster, game, timestamps, report routes
  share/        Public shared report route (token-gated)
  demo/         Demo setup (feature-flag guarded)
  admin/        Admin hub and review pages (email-gated)
  support/      Public support intake form
components/     Reusable React components
  ui/           Design system primitives (Button, Card, Badge, etc.)
  layout/       App shell (sidebar, header, shell)
  marketing/    Landing page sections
  reports/      Report dashboard components
  auth/         Login/signup forms
lib/            Application logic and services
  supabase/     Client setup (browser + server)
  db/           Data access layer (one file per entity)
  ai/           AI provider layer (mock + real providers)
  analysis/     Analysis pipeline (snapshot, readiness, generate)
  sharing/      Report sanitization by visibility mode
  auth/         Safe redirect helper
  config/       Env validation + feature flags
types/          Shared TypeScript interfaces
docs/           Project documentation (60+ files)
supabase/       Database migrations (0001–0012)
tests/          Vitest unit + component tests (167 tests, 9 files)
.github/        CI/CD workflow (typecheck → lint → test → build)
```

---

## AI Report Pipeline

1. **Build input snapshot** — reads team, game, roster, events, and notes from the database into a typed `GenerateReportInput` object
2. **Evaluate readiness** — scores event count, note quality, and roster completeness; shown as a badge before generation
3. **Select provider** — dispatches to mock, OpenAI, Anthropic, or Gemini based on `AI_PROVIDER` env var
4. **Generate strict JSON** — system prompt enforces 14 guardrail rules (no invented IDs, no video frame claims, evidence must reference real event IDs, JSON output only)
5. **Validate schema** — Zod schema rejects any malformed or hallucinated output before storage
6. **Normalize IDs** — all `evidence_ids` validated against real `event_timestamps` rows; unknown IDs are stripped
7. **Persist report** — report version incremented, all rows inserted, analysis job marked complete
8. **Render dashboard** — server component fetches all sections and renders the full report
9. **Coach verification** — coach marks, edits, and corrects; all corrections stored in append-only audit trail

---

## Trust and Verification Layer

Every AI output in GameIQ shows:

- **Evidence** — which tagged events support this claim
- **Confidence** — High / Medium / Low with reasoning
- **Assumptions** — what the AI assumed when data was incomplete
- **Verification controls** — coach can mark accurate, partially accurate, inaccurate, or edited

Coach corrections are stored in an append-only `verification_feedback` table alongside the original AI text. This data is the foundation for future model evaluation and sport-specific fine-tuning.

---

## Security and Privacy Model

- **Row Level Security** on every table — no exceptions
- Team-scoped access: all data access validates team membership via `team_members` join
- `create_team_with_owner` SECURITY DEFINER RPC prevents RLS race condition on team creation
- Video served via server-generated signed URLs (1-hour TTL) — never exposed from bucket directly
- AI provider keys are server-only — never sent to the browser
- Share tokens use 144-bit entropy with `giq_` prefix; shared reports sanitized server-side by visibility mode
- `share_links.token` has a database-level UNIQUE constraint (migration 0012)
- Admin routes gated by `ADMIN_EMAILS` env var + authenticated user check
- Safe redirect: `isSafeRedirect()` blocks external URLs in middleware and auth callback

See [`/docs/RLS_POLICIES.md`](docs/RLS_POLICIES.md) and [`/docs/STORAGE_SECURITY.md`](docs/STORAGE_SECURITY.md).

---

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Environment

```bash
cp .env.example .env.local
```

**Minimum (mock AI, no Supabase needed):**

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
AI_PROVIDER=mock
NEXT_PUBLIC_ENABLE_MOCK_DATA=true
```

**Full development (with Supabase):**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
AI_PROVIDER=mock
NEXT_PUBLIC_STORAGE_BUCKET=game-videos
NEXT_PUBLIC_ENABLE_MOCK_DATA=true
```

**With real AI:**

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_ENABLE_REAL_AI=true
```

> **Cost warning:** Each OpenAI report generation uses ~3,000–8,000 tokens. Set a monthly spend cap in your OpenAI dashboard before enabling real AI.

See [`/docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) for the complete variable reference.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (prod) | — | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (prod) | — | Supabase anon key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (prod) | — | Service role key — server-side only, never expose |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` | Full app URL |
| `AI_PROVIDER` | No | `mock` | `mock` / `openai` / `anthropic` / `gemini` |
| `OPENAI_API_KEY` | If openai | — | OpenAI API key — server-side only |
| `NEXT_PUBLIC_ENABLE_REAL_AI` | No | `false` | Show real AI option to users |
| `NEXT_PUBLIC_ENABLE_MOCK_DATA` | No | `false` | Enable demo workspace setup at `/demo/setup` |
| `ADMIN_EMAILS` | No | — | Comma-separated admin email list for `/admin/*` |
| `NEXT_PUBLIC_STORAGE_BUCKET` | No | `game-videos` | Supabase Storage bucket name for video uploads |

See [`.env.example`](.env.example) for all variables with documentation.

---

## Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run migrations in order in the SQL Editor:
   - `0001_initial_schema.sql` — full schema (17 tables, 12 enums, RLS, helper functions)
   - `0002_team_creation_rpc.sql` — atomic team creation RPC
   - `0003_storage_policies.sql` — storage bucket RLS
   - `0007_verification_editing_adjustments.sql` — verification schema
   - `0009_feedback_tables.sql` — access_requests, product_feedback
   - `0010_product_events.sql` — founder analytics events
   - `0011_support_requests.sql` — pilot coach support requests
   - `0012_share_links_token_unique.sql` — UNIQUE constraint on share tokens
3. Create storage bucket: `game-videos` (set to **Private**)
4. Configure Auth redirect URLs: Site URL + `/**` wildcard for your domain
5. Copy project URL and keys to `.env.local`

See [`/docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) and [`/docs/PRODUCTION_SUPABASE_CHECKLIST.md`](docs/PRODUCTION_SUPABASE_CHECKLIST.md).

---

## Running Tests

```bash
# All unit + component tests
npm run test

# Watch mode
npm run test:watch

# Unit tests only
npm run test:unit

# Component smoke tests only
npm run test:components

# E2E tests (requires running dev server)
npm run test:e2e

# Full quality sweep
npm run typecheck && npm run lint && npm run test && npm run build
```

**Test coverage:** 167 tests across 9 files — timestamp parsing, AI schema validation, hallucination guards, sharing sanitization, permission helpers, component smoke tests, auth redirect safety, and auth form validation.

See [`/docs/FINAL_TESTING_INSTRUCTIONS.md`](docs/FINAL_TESTING_INSTRUCTIONS.md) and [`/docs/TESTING_STRATEGY.md`](docs/TESTING_STRATEGY.md).

---

## Running the AI Benchmark

A formal AI benchmark script (`npm run benchmark:ai`) is not yet implemented. AI output quality is evaluated via:

- Unit tests covering Zod schema validation and hallucination guard normalization
- Manual review of mock AI output structure
- [`/docs/REPORT_QUALITY_EVALUATION.md`](docs/REPORT_QUALITY_EVALUATION.md) — 10-dimension rubric for scoring report quality with real data

---

## Running the Demo

```bash
# 1. Set up environment
cp .env.example .env.local
# Edit .env.local: set AI_PROVIDER=mock, NEXT_PUBLIC_ENABLE_MOCK_DATA=true

# 2. Install and run
npm install
npm run dev

# 3. Open browser
# http://localhost:3000

# 4. Sign in (or sign up)
# 5. Navigate to /demo/setup
# 6. Click "Create demo workspace"
# 7. You land on the full AI report in ~10 seconds
```

See [`/docs/FINAL_DEMO_INSTRUCTIONS.md`](docs/FINAL_DEMO_INSTRUCTIONS.md) for the full 5-minute and 15-minute demo flows.

---

## Deployment

**Target:** Vercel (Next.js) + Supabase (Auth, Postgres, Storage)

### Quick Steps

1. Create Supabase project (Pro plan for pilot — free tier auto-pauses)
2. Run 8 migrations in order in Supabase SQL Editor
3. Create 3 private storage buckets: `game-videos`, `game-thumbnails`, `report-exports`
4. Configure Auth redirect URLs to match your domain
5. Set environment variables in Vercel (Settings → Environment Variables)
6. Push to GitHub → Vercel auto-deploys
7. Run the 20-step production smoke test

### Required Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...    # Sensitive — server-side only
NEXT_PUBLIC_APP_URL=https://yourdomain.com
AI_PROVIDER=mock                          # Use mock until spend cap is set
NEXT_PUBLIC_ENABLE_REAL_AI=false
NEXT_PUBLIC_ENABLE_MOCK_DATA=false        # false for real pilots
ADMIN_EMAILS=founder@yourdomain.com
```

### Deployment Warnings

> **Real AI costs:** Each OpenAI report uses ~3,000–8,000 tokens. Set a monthly spend cap in your OpenAI account before enabling `NEXT_PUBLIC_ENABLE_REAL_AI=true`.

> **Private sports video:** Game video is stored in a private Supabase Storage bucket and is never included in shared reports. Explain this to pilot coaches during onboarding.

> **Service role key:** `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. Mark it as Sensitive in Vercel. Never prefix it with `NEXT_PUBLIC_`.

> **Supabase Free Tier:** Free projects pause after ~1 week of inactivity. Upgrade to Supabase Pro before any real pilot.

See [`/docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) and [`/docs/PRODUCTION_SMOKE_TEST.md`](docs/PRODUCTION_SMOKE_TEST.md).

---

## Known Limitations

**AI and analysis:**
- No automated video frame analysis — AI reports are generated from structured inputs, not computer vision. This is intentional for v1.
- No player or ball tracking
- Anthropic and Gemini providers are stubs — only Mock and OpenAI are production-ready

**Auth:**
- Email/password only — no OAuth providers
- No password reset UI — requires Supabase dashboard (documented workaround)
- No team invitation workflow — manual DB insert

**Video:**
- Video not included in shared reports
- No server-side video processing (thumbnails, duration extraction)
- Signed URLs expire after 1 hour

**Export:**
- Browser print-to-PDF only — no server-side PDF generation

**Settings:**
- Settings page is a UI placeholder — profile/password editing not yet wired

See [`/docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md) for the complete honest list.

---

## Roadmap

### Now (RC1 — June 2026)
All core MVP features complete and tested. Ready for founder demo and controlled coach demo.

### Near-Term (v1.1 — Pilot Hardening)
- Sentry error tracking
- Settings page wiring (profile update, password reset)
- Rate limiting on analysis generation
- OpenAI token/cost tracking
- AI retry logic
- Onboarding guidance for new teams

### v1.2 — Product Improvements from Coach Feedback
- Team member invitation workflow
- Password reset UI flow
- Player-specific report scoping
- Season analytics (cross-game trends)
- Inline report quality rating

### Long-Term Vision
- Computer vision — automated event detection from video
- Player/ball tracking and formation analysis
- Scouting and recruiting profiles
- Player development history across seasons
- Multi-sport modules with sport-specific AI prompt packs
- Subscription billing and seat-based pricing

See [`/docs/ROADMAP.md`](docs/ROADMAP.md) and [`/docs/V1_1_ENGINEERING_ROADMAP.md`](docs/V1_1_ENGINEERING_ROADMAP.md).

---

## Current Release Status

**Release:** GameIQ MVP RC1  
**Date:** 2026-06-02

| Check | Status |
|-------|--------|
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 warnings |
| `npm run test` | ✅ 167/167 passed |
| `npm run build` | ✅ 34 routes clean |
| E2E tests | ⚠️ Requires live dev server |
| AI benchmark | ❌ Not yet implemented |

**Go/no-go:**

| Context | Status |
|---------|--------|
| Local founder demo | ✅ GO |
| Advisor / professor demo | ✅ GO |
| Early coach demo (production) | ⚠️ Conditional — needs Sentry + Supabase Pro + smoke test |
| Self-serve pilot | ❌ Not yet — P1 items needed |
| Public beta | ❌ Not yet — months of v1.1/v1.2 work |

See [`/docs/RELEASE_CANDIDATE_REPORT.md`](docs/RELEASE_CANDIDATE_REPORT.md) and [`/docs/FINAL_RELEASE_STATUS.md`](docs/FINAL_RELEASE_STATUS.md).

---

## Documentation Index

| Purpose | Key Document |
|---------|-------------|
| Project summary | [`FINAL_PROJECT_HANDOFF.md`](docs/FINAL_PROJECT_HANDOFF.md) |
| Release status | [`FINAL_RELEASE_STATUS.md`](docs/FINAL_RELEASE_STATUS.md) |
| Demo instructions | [`FINAL_DEMO_INSTRUCTIONS.md`](docs/FINAL_DEMO_INSTRUCTIONS.md) |
| Test instructions | [`FINAL_TESTING_INSTRUCTIONS.md`](docs/FINAL_TESTING_INSTRUCTIONS.md) |
| Startup positioning | [`FINAL_POSITIONING.md`](docs/FINAL_POSITIONING.md) |
| Release candidate report | [`RELEASE_CANDIDATE_REPORT.md`](docs/RELEASE_CANDIDATE_REPORT.md) |
| Bug list | [`FINAL_BUG_LIST.md`](docs/FINAL_BUG_LIST.md) |
| Deployment guide | [`DEPLOYMENT.md`](docs/DEPLOYMENT.md) |
| Known limitations | [`KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md) |
| Go/no-go criteria | [`GO_NO_GO_CRITERIA.md`](docs/GO_NO_GO_CRITERIA.md) |
| Technical debt | [`TECHNICAL_DEBT.md`](docs/TECHNICAL_DEBT.md) |
| Full docs index | [`docs/README.md`](docs/README.md) |

---

## For Reviewers

If you want to understand the project quickly:

1. Read [`/docs/PITCH_PRODUCT_ONE_PAGER.md`](docs/PITCH_PRODUCT_ONE_PAGER.md) — product, problem, solution, honest status
2. Read [`/docs/TECHNICAL_BRIEF.md`](docs/TECHNICAL_BRIEF.md) — engineering depth in 5 minutes
3. Run the demo setup (`NEXT_PUBLIC_ENABLE_MOCK_DATA=true` → `/demo/setup`) — see the product in 60 seconds
4. Follow [`/docs/FOUNDER_DEMO_SCRIPT.md`](docs/FOUNDER_DEMO_SCRIPT.md) — guided 5–7 minute walk-through
5. Read [`/docs/FINAL_RELEASE_STATUS.md`](docs/FINAL_RELEASE_STATUS.md) — honest RC1 status

**Project handoff:** [`/docs/FINAL_PROJECT_HANDOFF.md`](docs/FINAL_PROJECT_HANDOFF.md)  
**Full docs:** [`/docs/README.md`](docs/README.md)
