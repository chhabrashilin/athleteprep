# GameIQ — Technical Architecture Brief

> A concise engineering reference for technical reviewers, advisors, and collaborators. For the full architecture reference, see [`TECHNICAL_ARCHITECTURE.md`](TECHNICAL_ARCHITECTURE.md).

---

## Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js (App Router) | Server + client components, server actions |
| Language | TypeScript 5 (strict mode) | No `any` without justification |
| UI | React 19 + Tailwind CSS 4 | CSS-first config via `@theme` in `globals.css` |
| Font | Geist Sans / Geist Mono | |
| Auth | Supabase Auth + `@supabase/ssr` | PKCE flow, session middleware |
| Database | Supabase Postgres + RLS | 17 tables, 12 enums, 10 migrations |
| Storage | Supabase Storage | Private video bucket, signed URLs |
| AI | Provider-agnostic layer | Mock (default) → OpenAI (production) → Anthropic/Gemini (stubs) |
| Validation | Zod | Strict JSON schema validation on all AI outputs |
| Icons | Lucide React | |
| Utilities | clsx, tailwind-merge | |
| Deployment | Vercel | |

---

## Architecture Overview

The application is a single Next.js project with no separate backend server. All business logic runs server-side via Next.js Server Actions and Route Handlers.

```
Browser
  └── Next.js App Router
        ├── Server Components (data fetching, layout)
        ├── Client Components (forms, video player, interactivity)
        ├── Server Actions (mutations — team, game, player, report)
        └── Route Handlers (REST endpoints — analysis, AI triggers)
              └── Supabase (Auth + Postgres + Storage)
                    └── AI Provider Layer
                          ├── Mock (deterministic, no API cost)
                          ├── OpenAI GPT-4o-mini (production-ready)
                          ├── Anthropic stub (configured, not implemented)
                          └── Gemini stub (configured, not implemented)
```

**Key Next.js convention:** In this version, `params` in dynamic routes is a `Promise`. All dynamic page components `await params` before use.

---

## Data Model

All tables have Row Level Security enabled. Access is scoped to team membership.

| Table | Purpose |
|-------|---------|
| `profiles` | User display name and metadata (created by DB trigger on auth.users insert) |
| `teams` | Team workspace (name, sport, level, org, location, slug) |
| `team_members` | User ↔ Team junction (role: owner, coach, analyst, player) |
| `players` | Roster entries per team (name, jersey, position, role, dominant side, class year, height, weight, notes, status) |
| `games` | Game/practice record (opponent, date, home/away/neutral, result, score, analysis type, notes, status) |
| `video_assets` | Video file metadata (filename, size, duration, bucket path, status) |
| `event_timestamps` | Manual key moment entries (time_seconds, label, event_type, importance, team_context, description, player_ids, tags) |
| `analysis_jobs` | AI generation request and status lifecycle (pending → running → completed/failed) |
| `game_reports` | Completed structured report (JSON blob + typed section references, version number) |
| `coaching_insights` | Individual insight rows (title, description, confidence, evidence_ids, assumptions, recommendation) |
| `player_reports` | Per-player report rows (strengths, improvement_areas, key_moments, overall_rating) |
| `practice_recommendations` | Drill/exercise recommendations (drill_name, focus_area, duration, coaching_points, priority_players) |
| `opponent_tendencies` | Opponent pattern analysis (pattern, frequency, recommended_response, evidence_ids) |
| `verification_feedback` | Coach verification/edit records (target_type, target_id, status, feedback, correction, appended to audit trail) |
| `share_links` | Secure shareable report tokens (token, visibility_mode, expires_at, revoked_at, view_count) |
| `exports` | Export history records (sections_included, generated_by, timestamp) |
| `product_events` | Founder analytics events (event_type, user_id, team_id, game_id, metadata) |
| `access_requests` | Early interest form submissions |
| `product_feedback` | Coach/user feedback form submissions |

---

## AI Pipeline (Detailed)

```
1. BUILD INPUT SNAPSHOT
   lib/analysis/snapshot.ts
   → reads team, game, roster, events, notes from DB
   → produces typed GenerateReportInput object

2. EVALUATE READINESS
   lib/analysis/readiness.ts
   → checks event count, note quality, roster completeness
   → returns AIReadinessStatus (ready / partial / not_ready)
   → displayed as badge in the UI before generation

3. SELECT PROVIDER
   lib/ai/providers.ts
   → reads AI_PROVIDER env var
   → dispatches to: mock | openai | anthropic | gemini

4. GENERATE STRICT JSON
   lib/ai/openai.ts (or mock-ai.ts)
   → system prompt: 14 hard guardrail rules
     (no invented IDs, no video frame analysis claims, evidence must
      reference real event IDs from input, JSON-only output format,
      all confidence levels must be justified, etc.)
   → response_format: { type: "json_object" } (OpenAI)
   → returns raw JSON string

5. VALIDATE SCHEMA
   lib/ai/validate.ts
   → Zod schema validates all sections
   → rejects reports with invented player IDs or event IDs
   → throws on validation failure (no silent corruption)

6. NORMALIZE IDS / EVIDENCE
   lib/analysis/normalize.ts
   → replaces AI-generated references with real DB IDs
   → validates all evidence_ids against real event_timestamps rows

7. PERSIST REPORT
   lib/db/game-reports.ts
   → inserts game_reports row (version incremented)
   → inserts coaching_insights, player_reports, practice_recommendations,
      opponent_tendencies as separate rows
   → marks analysis_job as completed

8. RENDER DASHBOARD
   app/teams/[teamId]/games/[gameId]/report/page.tsx
   → server component fetches all report sections
   → renders multi-section dashboard with anchor nav

9. HUMAN VERIFICATION / EDITING
   components/reports/InsightVerification.tsx
   → coach marks insight as accurate / partially accurate / inaccurate / edited
   → inline editing saves corrected text
   → original AI output preserved in original_* columns
   → audit trail appended to verification_feedback
```

---

## Security Model

| Layer | Mechanism |
|-------|---------|
| Authentication | Supabase Auth PKCE + email confirmation |
| Session management | `@supabase/ssr` middleware on all protected routes |
| Data access | RLS policies on all 17 tables — team_members join enforced |
| Team creation | SECURITY DEFINER RPC (`create_team_with_owner`) — prevents RLS race condition |
| Video storage | Private bucket — access only via server-generated signed URLs (1-hour TTL) |
| AI keys | Server-only env vars — never exposed to browser |
| Share tokens | 144-bit entropy, `giq_` prefix, server-side validation, revocation support |
| Shared report sanitization | Server-side field filtering by visibility mode before any data reaches client |
| Admin routes | `ADMIN_EMAILS` env var gating — not RLS-based, server-side check |

---

## Key Engineering Decisions

**No separate backend server** — Next.js Server Actions handle all mutations. Sufficient for MVP scale. Extraction to a dedicated Node service is straightforward given the isolated `lib/` layer.

**Provider-agnostic AI layer** — Switching from OpenAI to Anthropic or Gemini requires changing only `lib/ai/providers.ts` and adding a provider file. No call-site changes.

**Strict JSON validation** — Every AI output passes through Zod before storage. Malformed or hallucinated reports fail loudly. No silent partial storage.

**Evidence grounding** — The AI system prompt requires all `evidence_ids` to reference real `event_timestamps.id` values from the input snapshot. The normalizer validates this at generation time.

**Append-only verification audit trail** — Coach corrections append to `verification_feedback`. Original AI output is preserved. This data is the foundation for future model evaluation.

**Report versioning** — Each new report generation increments the version number. All versions are preserved. The UI always shows the latest version by default.

**Demo data isolation** — The demo workspace is created via a server action guarded by `NEXT_PUBLIC_ENABLE_MOCK_DATA=true`. Demo data is real database rows — not mocked at the API layer.

---

## File Structure

```
app/                    Next.js routes (pages, layouts, server actions)
  teams/[teamId]/       Team workspace routes
    games/[gameId]/     Game detail, video, timestamps, report
  share/reports/        Public shared report route
  auth/                 Auth pages and callbacks
  demo/                 Demo setup routes (feature-flagged)
  admin/                Admin analytics and feedback (email-gated)

components/
  ui/                   Design system primitives (Button, Card, Badge, etc.)
  layout/               App shell (sidebar, header, shell, page header)
  marketing/            Landing page sections
  dashboard/            Dashboard widgets
  analysis/             AI report generation flow components
  reports/              Report dashboard section components
  sharing/              Share link management components
  export/               Export-ready view components

lib/
  supabase/             Client setup (browser + server)
  db/                   Data access layer (one file per entity)
  ai/                   AI provider layer (mock + real providers + types)
  analysis/             Analysis pipeline (snapshot, readiness, generate)
  sharing/              Report sanitization by visibility mode
  utils/                Utilities (cn, format, time, tokens, slug)
  constants/            Sports metadata, navigation config, event types
  analytics/            Product event tracking (fire-and-forget)
  demo/                 Demo data constants

types/                  Shared TypeScript interfaces
  core.ts               Primitives (ID, timestamps, confidence, verification)
  sports.ts             Sport enums and metadata
  ai.ts                 AI input/output types
  database.ts           Entity interfaces (Team, Game, Player, Report, etc.)
  analytics.ts          Analytics event types

supabase/
  migrations/           10 SQL migrations (schema, RLS, storage, feedback)
```

---

## Future Technical Work

| Area | Work Required |
|------|-------------|
| Background jobs | Replace synchronous AI generation with async job queue (BullMQ or similar) |
| Automated tests | Vitest unit tests, Playwright E2E tests |
| FFmpeg clip extraction | Extract video segments around tagged timestamps |
| Server-side PDF | Puppeteer/Playwright PDF generation with automatic export storage |
| Storage policy hardening | Per-team storage quotas, upload size limits, format validation |
| AI evaluation harness | Automated scoring of AI report quality against coach verification data |
| Computer vision | Separate microservice for event detection from video frames |
| Real-time job status | Supabase Realtime subscription replacing polling |
| Season analytics | Cross-game aggregation queries and trend detection |
