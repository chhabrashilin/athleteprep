# GameIQ

**AI game review in 10 minutes.**

GameIQ is a coach-first AI sports intelligence platform. Coaches upload game film, tag key moments, and receive a structured AI report with evidence-linked coaching insights, player feedback, opponent tendencies, and next-practice recommendations.

---

## What GameIQ Does

GameIQ takes the raw material coaches already have — game video, a roster, and their own observations — and turns it into a structured, evidence-backed report that is ready to share with players and staff.

**Input:**
- Game metadata (opponent, date, result, score, home/away, competition level)
- Roster and player data
- Coach notes and opponent notes
- Manually tagged key moments (timestamp, event type, players involved, importance, description)

**Output:**
- Executive summary
- Top 5 coaching insights with confidence scores (High / Medium / Low) and evidence references
- Player-by-player reports (strengths, improvement areas, key moments)
- Opponent tendency analysis with recommended responses
- Next-practice drill recommendations with coaching points
- Coach verification and inline editing for every AI output
- Shareable reports with 4 visibility modes (staff, player-specific, private link, public summary)
- Export-ready print/PDF view

Every AI claim is grounded in the inputs the coach provided. Nothing is invented. Coaches can verify, correct, or edit any output — and those corrections are preserved in an audit trail.

---

## Why This Exists

Most sports teams record more game footage than they can meaningfully analyze. A coaching staff might spend 2–4 hours on post-game film review and still produce vague player feedback ("play smarter," "work harder"). Smaller programs cannot afford dedicated analysts.

GameIQ answers the questions coaches actually need answered:
- What happened and why did it matter?
- Who was involved?
- What evidence supports this?
- How confident is the AI?
- What should each player work on individually?
- What should we run at the next practice?

The v1 approach does not require computer vision. AI reports are generated from structured inputs — what coaches tag and note. This is intentional: it delivers immediate, trustworthy value while the platform builds toward automated event detection.

---

## Core MVP Features

| Feature | Status |
|---------|--------|
| Email/password auth with protected routes | ✅ |
| Team workspaces with role-based access (owner, coach, analyst, player) | ✅ |
| Roster management — full CRUD, archive, search, position/status filter | ✅ |
| Game/practice creation with 4-section metadata form | ✅ |
| Video upload to private Supabase Storage with signed URL playback | ✅ |
| Manual timestamp tagging (12 event fields per event, AI readiness badge) | ✅ |
| AI report generation — mock (no API cost) or OpenAI GPT-4o-mini | ✅ |
| Strict Zod validation on all AI JSON outputs | ✅ |
| 14 AI guardrail rules in system prompt | ✅ |
| Report dashboard — insights, players, opponent, practice, evidence sections | ✅ |
| Insight detail with video seek to timestamp | ✅ |
| Coach verification (accurate / partially accurate / inaccurate / edited) | ✅ |
| Inline editing with append-only audit trail | ✅ |
| 4-mode shareable reports with 144-bit entropy tokens | ✅ |
| Export-ready print/PDF view with section selector | ✅ |
| Founder analytics — 13 instrumented events, admin dashboard | ✅ |
| Landing page, demo experience, request-access form, feedback form | ✅ |
| Demo workspace (cricket team, 12 timestamps, full AI report) | ✅ |

---

## Product Demo Flow

With demo mode enabled (`NEXT_PUBLIC_ENABLE_MOCK_DATA=true`):

1. Sign in to your account
2. Visit `/demo/setup` and click **Create demo workspace**
3. The app creates a demo team, game, roster, and AI report in ~10 seconds
4. You are redirected to the full AI report dashboard

The demo workspace contains:
- **Madison Cricket XI** — 10-player cricket team with positions and jersey numbers
- **Match vs Lakeside CC** — game with score, result, coach notes, and opponent notes
- **12 tagged key moments** — batting, bowling, fielding, and opponent events
- **Full AI coaching report** — insights, player reports, practice recommendations, opponent tendencies

See [`/docs/DEMO_DATA.md`](docs/DEMO_DATA.md) and [`/docs/FOUNDER_DEMO_SCRIPT.md`](docs/FOUNDER_DEMO_SCRIPT.md) for the full demo guide.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19 + Tailwind CSS 4 |
| Auth | Supabase Auth + `@supabase/ssr` |
| Database | Supabase Postgres + Row Level Security |
| Storage | Supabase Storage (private video bucket) |
| AI | Provider-agnostic layer — mock default, OpenAI production, Anthropic/Gemini stubs |
| Validation | Zod (strict JSON schema on all AI outputs) |
| Icons | Lucide React |
| Utilities | clsx, tailwind-merge |
| Deployment | Vercel |

---

## Architecture Overview

```
Browser
  └── Next.js App Router
        ├── Server Components — data fetching, layout
        ├── Client Components — forms, video player, interactivity
        ├── Server Actions — all mutations (team, game, player, report)
        └── Route Handlers — analysis job API
              └── Supabase (Auth + Postgres + Storage)
                    └── AI Provider Layer
                          ├── Mock (deterministic, no API cost)
                          ├── OpenAI GPT-4o-mini (production-ready)
                          ├── Anthropic stub (clean interface, not implemented)
                          └── Gemini stub (clean interface, not implemented)
```

**Key directories:**
```
app/            Next.js routes (pages, layouts, server actions)
  teams/        Team, roster, game, timestamps, report routes
  share/        Public shared report route
  auth/         Auth pages and callbacks
  demo/         Demo setup (guarded by feature flag)
  admin/        Admin analytics and feedback (email-gated)
components/     Reusable React components
  ui/           Design system primitives (Button, Card, Badge, etc.)
  layout/       App shell (sidebar, header, shell)
  marketing/    Landing page sections
lib/            Application logic and services
  supabase/     Client setup (browser + server)
  db/           Data access layer (one file per entity)
  ai/           AI provider layer (mock + real providers)
  analysis/     Analysis pipeline (snapshot, readiness, generate)
  sharing/      Report sanitization by visibility mode
types/          Shared TypeScript interfaces
docs/           Project documentation (34 files)
supabase/       Database migrations and storage policies
```

---

## AI System

### Pipeline

The AI pipeline runs entirely server-side:

1. **Build input snapshot** — reads team, game, roster, events, and notes from the database into a typed `GenerateReportInput` object
2. **Evaluate readiness** — scores event count, note quality, and roster completeness; shows as a badge before generation
3. **Select provider** — dispatches to mock, OpenAI, Anthropic, or Gemini based on `AI_PROVIDER` env var
4. **Generate strict JSON** — system prompt enforces 14 guardrail rules (no invented IDs, no video frame claims, evidence must reference real event IDs, JSON output only)
5. **Validate schema** — Zod schema rejects any malformed or hallucinated output before storage
6. **Normalize IDs** — all `evidence_ids` are validated against real `event_timestamps` rows
7. **Persist report** — report version incremented, all rows inserted, analysis job marked complete
8. **Render dashboard** — server component fetches all sections and renders the report
9. **Coach verification** — coach marks, edits, and corrects outputs; all corrections stored in audit trail

### Hallucination Prevention

- System prompt explicitly forbids: inventing player names, fabricating timestamps, claiming to analyze video frames, referencing events not in the input
- Zod validation rejects outputs that do not match the expected schema
- ID normalization validates every evidence reference against real database rows
- Original AI output is always preserved alongside any edits

---

## Trust and Safety Layer

Every AI output in GameIQ shows:
- **Evidence** — which tagged events support this claim
- **Confidence** — High / Medium / Low with reasoning
- **Assumptions** — what the AI assumed when data was incomplete
- **Verification controls** — the coach can mark accurate, partially accurate, inaccurate, or edited

Coach corrections are stored in an append-only `verification_feedback` table alongside the original AI text. This data is the foundation for future model evaluation and improvement.

---

## Database and Security

**Schema:** 17 tables, 12 PostgreSQL enums, 10 versioned migrations

**Key tables:** `profiles`, `teams`, `team_members`, `players`, `games`, `video_assets`, `event_timestamps`, `analysis_jobs`, `game_reports`, `coaching_insights`, `player_reports`, `practice_recommendations`, `opponent_tendencies`, `verification_feedback`, `share_links`, `exports`, `product_events`

**Security:**
- Row Level Security on every table — no exceptions
- Team-scoped access: all data access validates team membership via `team_members` join
- `create_team_with_owner` SECURITY DEFINER RPC prevents RLS race condition on team creation
- Video served via server-generated signed URLs (1-hour TTL) — never exposed from bucket directly
- AI provider keys are server-only — never sent to the browser
- Share tokens use 144-bit entropy with `giq_` prefix; shared reports sanitized server-side by visibility mode
- Admin routes gated by `ADMIN_EMAILS` env var

See [`/docs/RLS_POLICIES.md`](docs/RLS_POLICIES.md) for the full RLS reference.

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
```

**Full development (with Supabase):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
AI_PROVIDER=mock
NEXT_PUBLIC_STORAGE_BUCKET=game-videos
```

**With real AI (OpenAI):**
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_ENABLE_REAL_AI=true
```

**With demo data:**
```env
NEXT_PUBLIC_ENABLE_MOCK_DATA=true
```

See [`/docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) for the full variable reference.

---

## Supabase Setup

1. Create a Supabase project
2. Run migrations in order: `supabase/migrations/0001_*.sql` through `0010_*.sql`
3. Create storage bucket: `game-videos` (private)
4. Configure Auth redirect URLs in Supabase dashboard
5. Copy project URL and keys to `.env.local`

See [`/docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) for the full setup guide.

---

## Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run `tsc --noEmit` |

---

## Demo Data

With `NEXT_PUBLIC_ENABLE_MOCK_DATA=true`:

1. Sign in and visit `/demo/setup`
2. Click **Create demo workspace**
3. Redirected to the AI report in ~10 seconds

Creates: Madison Cricket XI team, 10-player roster, Match vs Lakeside CC game, 12 tagged key moments, full AI coaching report.

See [`/docs/DEMO_DATA.md`](docs/DEMO_DATA.md) for full details.

---

## Testing and QA

No automated test suite is set up in v1. Quality gates:
- TypeScript strict mode (`npm run typecheck`)
- ESLint (`npm run lint`)
- Production build (`npm run build`)

Manual QA checklist: [`/docs/PRODUCT_QA_CHECKLIST.md`](docs/PRODUCT_QA_CHECKLIST.md)

---

## Deployment

See [`/docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full Vercel + Supabase deployment guide.

Quick summary:
1. Create Supabase project → run 10 migrations → create storage bucket
2. Configure Auth redirect URLs
3. Set environment variables in Vercel
4. Deploy from GitHub → verify auth, storage, AI, sharing, export

---

## Current Limitations

**AI and analysis:**
- No automated video frame analysis — AI reports are generated from structured inputs (notes, tagged events), not computer vision. This is intentional for v1.
- No player or ball tracking
- Anthropic and Gemini providers are stubs — only Mock and OpenAI are production-ready

**Auth and access:**
- Email/password only — no OAuth providers
- No password reset flow (must use Supabase dashboard)
- No team invitation workflow

**Video:**
- Video is not included in shared reports (only text content)
- No server-side video processing (thumbnails, duration extraction)
- Signed URLs expire after 1 hour

**Export:**
- Browser print-to-PDF only — no server-side PDF generation
- Export history tracks metadata, not the actual PDF file

**Analytics:**
- Per-game analysis only — no season-level aggregation

See [`/docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md) for the complete, honest list.

---

## Roadmap

### Near-Term
- Coach pilot program (5–10 discovery interviews, 3 pilot teams)
- Team member invitation workflow
- Password reset / account recovery
- Real AI provider testing with real game data
- Server-side PDF generation

### Technical
- Background job queue for async AI generation
- Automated test suite (Vitest + Playwright)
- FFmpeg clip extraction around tagged timestamps
- Season analytics and cross-game trend detection

### Long-Term Vision
- Computer vision — automated event detection from video frames
- Player/ball tracking and formation analysis
- Scouting and recruiting profiles
- Player development history across seasons
- Multi-sport modules with sport-specific AI prompt packs
- Subscription billing and seat-based pricing

See [`/docs/ROADMAP.md`](docs/ROADMAP.md) for the complete phased roadmap.

---

## For Reviewers

If you want to understand the project quickly:

1. Read [`/docs/PITCH_PRODUCT_ONE_PAGER.md`](docs/PITCH_PRODUCT_ONE_PAGER.md)
2. Read [`/docs/TECHNICAL_BRIEF.md`](docs/TECHNICAL_BRIEF.md)
3. Run the demo setup (`NEXT_PUBLIC_ENABLE_MOCK_DATA=true` → `/demo/setup`)
4. Follow [`/docs/FOUNDER_DEMO_SCRIPT.md`](docs/FOUNDER_DEMO_SCRIPT.md)
5. Review [`/docs/MVP_READINESS_REPORT.md`](docs/MVP_READINESS_REPORT.md)

**Project handoff summary:** [`/docs/FINAL_PROJECT_HANDOFF.md`](docs/FINAL_PROJECT_HANDOFF.md)

---

## Documentation Index

| Category | Documents |
|----------|-----------|
| **Product Strategy** | [Project Constitution](docs/PROJECT_CONSTITUTION.md) · [One-Pager](docs/PITCH_PRODUCT_ONE_PAGER.md) · [Investor Brief](docs/INVESTOR_ADVISOR_BRIEF.md) · [Landing Strategy](docs/LANDING_PAGE_STRATEGY.md) · [Demo Script](docs/FOUNDER_DEMO_SCRIPT.md) · [Coach Demo Guide](docs/COACH_DEMO_GUIDE.md) |
| **Features** | [Team Workspaces](docs/TEAM_WORKSPACES.md) · [Roster](docs/ROSTER_MANAGEMENT.md) · [Games](docs/GAME_CREATION.md) · [Video](docs/VIDEO_ASSETS.md) · [Timestamps](docs/TIMESTAMPS_AND_EVENTS.md) · [Reports](docs/REPORT_DASHBOARD.md) · [Verification](docs/VERIFICATION_AND_EDITING.md) · [Sharing](docs/SHARING_AND_ACCESS.md) · [Export](docs/EXPORTS_AND_PRINTING.md) |
| **AI and Trust** | [AI Principles](docs/AI_OUTPUT_PRINCIPLES.md) · [Mock AI](docs/MOCK_AI_REPORTS.md) · [Real AI Layer](docs/REAL_AI_PROVIDER_LAYER.md) · [Analysis Jobs](docs/ANALYSIS_JOBS.md) |
| **Engineering** | [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md) · [Technical Brief](docs/TECHNICAL_BRIEF.md) · [Database Schema](docs/DATABASE_SCHEMA.md) · [RLS Policies](docs/RLS_POLICIES.md) · [Supabase Setup](docs/SUPABASE_SETUP.md) · [Deployment](docs/DEPLOYMENT.md) · [Environment](docs/ENVIRONMENT.md) |
| **Demo and QA** | [Demo Data](docs/DEMO_DATA.md) · [QA Checklist](docs/PRODUCT_QA_CHECKLIST.md) · [MVP Readiness](docs/MVP_READINESS_REPORT.md) · [Known Limitations](docs/KNOWN_LIMITATIONS.md) · [Screenshots Plan](docs/SCREENSHOTS_AND_DEMO_MEDIA_PLAN.md) |
| **User Research** | [First User Feedback](docs/FIRST_USER_FEEDBACK.md) · [Coach Discovery](docs/COACH_DISCOVERY_GUIDE.md) · [Product Analytics](docs/PRODUCT_ANALYTICS.md) |
| **Portfolio** | [Portfolio Summary](docs/PORTFOLIO_SUMMARY.md) · [Pitch Lines](docs/PITCH_LINES.md) |
| **Pilot Planning** | [Final Handoff](docs/FINAL_PROJECT_HANDOFF.md) · [Technical Debt](docs/TECHNICAL_DEBT.md) · [Issues Backlog](docs/PRIORITIZED_ISSUES.md) · [Pilot Readiness](docs/PILOT_READINESS_CHECKLIST.md) · [Coach Pilot Plan](docs/COACH_PILOT_PLAN.md) · [30-Day Plan](docs/30_DAY_FOUNDER_PLAN.md) · [Go/No-Go](docs/GO_NO_GO_CRITERIA.md) |
| **Engineering Roadmap** | [v1.1 Engineering](docs/V1_1_ENGINEERING_ROADMAP.md) · [v1.2 Product](docs/V1_2_PRODUCT_ROADMAP.md) · [CV Roadmap](docs/COMPUTER_VISION_ROADMAP.md) |
| **Risk and Quality** | [Product Risk Register](docs/PRODUCT_RISK_REGISTER.md) · [Report Quality Evaluation](docs/REPORT_QUALITY_EVALUATION.md) · [Data Privacy Review](docs/DATA_PRIVACY_REVIEW.md) |

Full documentation index: [`/docs/README.md`](docs/README.md)
