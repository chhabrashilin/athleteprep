# GameIQ

**AI game review in 10 minutes.**

GameIQ turns game film into coach-ready insights, player feedback, evidence-linked clips, and next-practice plans — powered by AI.

---

## What is GameIQ?

GameIQ is a coach-first AI sports intelligence platform. Coaches and analysts upload game film, add structured metadata, tag key events with timestamps and notes, and receive a structured AI-generated report with:

- Top 5 coaching insights with confidence scores and evidence
- Player-by-player reports
- Opponent tendency analysis
- Next-practice recommendations
- Coach verification workflow

See [`/docs/PROJECT_CONSTITUTION.md`](docs/PROJECT_CONSTITUTION.md) for the full product vision.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| UI | React 19 + Tailwind CSS 4 |
| Font | Geist Sans / Geist Mono |
| Auth | Supabase Auth + @supabase/ssr |
| Database | Supabase Postgres + RLS (Phase 2) |
| Storage | Supabase Storage (Phase 3) |
| AI | Provider-agnostic layer (mock → OpenAI/Anthropic) |
| Icons | Lucide React |
| Utilities | clsx, tailwind-merge |
| Deployment | Vercel (Phase 7) |

---

## Project Status

**Current phase: Phase 5/6 — Real AI Provider Layer + Strict JSON Generation implemented**

### Authentication foundation ✅
- Next.js 16 + TypeScript + Tailwind v4 + App Router
- Full Postgres schema — 17 tables, 12 enums, RLS on all tables
- Supabase Auth (email/password) via `@supabase/ssr`
- Session middleware — refresh + protected route enforcement
- Sign-up and sign-in forms with validation and error handling
- Auth callback route (email confirmation + PKCE), logout route handler
- Auth-aware app shell (header + sidebar show user + sign-out)
- Login/signup redirect back to originally requested path
- Profile creation (DB trigger + safe fallback)

### Team workspace ✅
- Real team creation form at `/teams/new` (sport, name, org, level, location, description)
- Atomic team + owner creation via `create_team_with_owner` SECURITY DEFINER RPC
- Creator automatically assigned `owner` role in `team_members`
- `/teams` page lists all user teams with sport badges and role info
- `/teams/[teamId]` team workspace with live roster count, membership check, and next-action CTAs
- Team-aware sidebar navigation — shows team context when inside a team workspace
- `/dashboard` shows user's teams, setup checklist, player counts, and recent reports placeholder
- Slug generation for all new teams (`lib/utils/slug.ts`)
- Full data access layer (`lib/db/teams.ts`) with typed functions and RLS enforcement

### Roster management ✅
- `/teams/[teamId]/players` — roster list with real-time search and filter (name, status, position)
- `/teams/[teamId]/players/new` — add player form (staff only)
- `/teams/[teamId]/players/[playerId]/edit` — edit player + archive/delete (staff only)
- Player fields: name, jersey number, position, role, dominant side, class year, height, weight, status, notes
- Archive (soft delete) with preserved history; permanent delete with confirmation (managers only)
- Roster stats card (total, active, positions, missing jersey numbers)
- Full data access layer (`lib/db/players.ts`) with typed functions and RLS enforcement
- Role-based permission enforcement at application + RLS layers
- `SetupChecklist` and `TeamCard` show live player counts from the database

### Game and practice creation ✅
- `/teams/[teamId]/games` — game list with search/filter (title, opponent, type, status) and summary stats
- `/teams/[teamId]/games/new` — 4-section create form: Analysis Type, Opponent & Context, Score/Result, Notes for AI
- `/teams/[teamId]/games/[gameId]` — game detail: metadata header, 4-step workflow card, setup checklist, opponent notes preview
- `/teams/[teamId]/games/[gameId]/setup` — real setup checklist (game details, roster, video placeholder, timestamps placeholder, report placeholder)
- `/teams/[teamId]/games/[gameId]/edit` — edit form + archive/delete with inline confirmation
- Coach notes and opponent notes collected at creation time as AI context
- Archive (soft delete) and permanent delete (manager only) with 2-click confirmation
- Live game counts in team workspace progress card and next-steps section
- Dashboard and setup checklist step 3 now live (reflects game creation status)
- `getGameSetupStatus` checks all analysis prerequisites (video/timestamps are placeholders for Phase 7)

### Video upload and asset management ✅
- `VideoUploadCard` — client-side drag-and-drop or file picker with type/size validation
- Direct browser-to-Supabase Storage upload (no server buffering — handles large files)
- `game-videos` private bucket; signed URLs (1-hour TTL) for playback
- `GameVideoPlayer` — native HTML5 player with loading/error states; future-ready for timestamp sync
- `VideoAssetSummary` — filename, size, duration, upload date, status badge
- Video status indicator per game in the games list (single batch query, no N+1)
- Game setup checklist step 3 (Video upload) now live — links to video section on game detail
- `lib/db/video-assets.ts` typed data access layer: CRUD + signed URL generation
- `lib/storage/videos.ts` pure utilities: path building, sanitization, validation, duration extraction
- `lib/actions/video.ts` server actions: save video record + best-effort storage cleanup on failure
- Storage policies documented in `supabase/migrations/0003_storage_policies.sql`

### Manual timestamps and event input ✅
- `/teams/[teamId]/games/[gameId]/timestamps` — full film-tagging workspace
- Video player with `seekTo` imperative ref — click any event to jump the video
- "Add event at current time" prefills the form from video position
- Event form: label, importance, event type (sport-specific suggestions + custom), team context, description, related players (multi-select from roster), opponent player names, tags
- Event list: chronological, search/filter by label/type/importance/context/player
- Event stats: total events, high-impact count, players tagged, event types
- Timestamp parsing: accepts plain seconds (`83`), `MM:SS` (`1:23`), `H:MM:SS` (`1:02:15`)
- Full CRUD: create, edit, delete with confirmation — staff only; players/viewers read-only
- `lib/db/timestamps.ts` typed data access layer with RLS enforcement
- `lib/actions/timestamps.ts` server actions with revalidation
- `lib/utils/time.ts` timestamp formatting and parsing utilities
- AI readiness badge: Not ready / Needs context / Ready / Strong evidence base
- Setup checklist key moments step now live — links to timestamps page
- Game detail page shows key moments stats (total, high impact, players, types)
- 5+ events recommended for best AI report quality

### Analysis job system and mock AI report generation ✅
- `analysis_jobs` table: create, track, complete, and fail generation attempts
- Input snapshot collected from DB (team, game, roster, video, all events) — stored verbatim on the job for reproducibility
- Readiness check: not_ready / needs_context / ready / strong — gates generation appropriately
- Mock AI generator: fully data-driven from real input (events, notes, players, sport)
  - Executive summary from real game context
  - Up to 5 coaching insights from event patterns, type clusters, tag clusters, coach notes
  - Player reports for tagged roster players, referencing actual event labels + timestamps
  - 3–5 practice recommendations with sport-specific drill names
  - Opponent tendencies from opponent notes + opponent-context events
  - Confidence levels (high/medium/low) based on evidence count
  - Explicit assumptions + limitations on every report
  - Evidence references with real event IDs for future DB linking
- Report persistence: `game_reports`, `coaching_insights`, `player_reports`, `practice_recommendations`, `opponent_tendencies` all inserted
- Report versioning: regenerating creates v2, v3, etc. — previous reports preserved with `is_current = false`
- Report page: no-report / running / failed / report-exists states
- `GenerateReportButton` client component — permission-aware, loading state, error handling
- `AnalysisReadinessCard`, `AnalysisJobStatusCard`, `ReportPreviewCard` components
- Setup checklist step 5 (AI Report) now live — links to report page
- Game detail page shows report status and generate/view CTA
- Provider-agnostic AI layer: `generateReport(snapshot)` → mock now, real LLM later
- `lib/db/analysis-jobs.ts`, `lib/db/reports.ts`, `lib/analysis/` pipeline
- `docs/ANALYSIS_JOBS.md` and `docs/MOCK_AI_REPORTS.md` created

### Full game report dashboard ✅
- `/teams/[teamId]/games/[gameId]/report` — polished multi-section report dashboard
- `/teams/[teamId]/games/[gameId]/report/insights/[insightId]` — insight detail with video seeking
- 4 report page states: no-report (with readiness card), running, failed, report-exists
- **ReportHeader** — title, version badge, confidence badge, regenerate button, back nav
- **ReportSectionNav** — sticky anchor nav (Overview / Insights / Players / Opponent / Practice / Evidence)
- **ReportOverview** — executive summary + report basis (events, video, notes, roster)
- **CoachingInsightsSection** — up to 5 insight cards with evidence type chips and detail links
- **PlayerReportsSection** — expandable player cards with strengths, improvement areas, key moments
- **OpponentTendenciesSection** — tendency cards with recommended responses
- **PracticePlanSection** — numbered recommendation cards with drill names, timing, coaching points
- **AssumptionsLimitationsCard** — full transparency section for trust
- **InsightDetailView** (client) — two-column layout with video player + evidence seek
- `EvidenceCard`, `EvidenceList`, `EvidenceTypeBadge` — evidence rendering components
- Evidence resolution: `lib/analysis/evidence.ts` resolves `eventId` → event data, formats timestamps
- Video seeking: clicking timestamp evidence calls `videoRef.current.seekTo(seconds)`
- `getFullGameReportData()` — single parallel fetch for all report data
- `getCoachingInsightById()` — for insight detail page
- `getReportVersionsForGame()` — version history (display-only, selector coming in Prompt 11)
- Report version badge — current vs. older version
- Mock AI disclosure in report header (honest transparency)
- `docs/REPORT_DASHBOARD.md` created

### Coach verification and report editing ✅
- Coaches can mark any AI output as accurate, partially accurate, or inaccurate
- Optional feedback text and correction notes saved to `verification_feedback` (append-only audit trail)
- Coaches can edit content on coaching insights, player reports, practice recommendations, opponent tendencies
- Game report summary (title, executive summary, assumptions, limitations) is editable
- Original AI output preserved in `original_ai_content` / `raw_ai_output` before first edit — never overwritten
- Edited records show "Coach-edited" badge; verification status updated to "edited"
- Verification history visible on insight detail page
- Permission enforcement: only owner / coach / analyst can verify or edit; player and viewer are read-only
- `lib/db/verification.ts`, `lib/db/report-editing.ts` data access layer
- `VerificationControls`, `EditedBadge`, edit form modals per entity type
- `docs/VERIFICATION_AND_EDITING.md` created

### Shareable reports and role-aware access ✅
- Owner/coach/analyst can create share links for any report
- 4 visibility modes: private link, staff only, player specific, public summary
- Secure cryptographic tokens (`giq_` prefix + 24 base64url chars, 144-bit entropy)
- `/share/reports/[token]` — public shared route with clean branded layout, no team nav, no edit controls
- Server-side sanitization via `lib/sharing/sanitize-report.ts` — data filtered before reaching browser
- `player_specific` shows only the selected player's report + tagged practice recs
- `public_summary` shows executive summary + insight titles only — no player data
- `staff_only` requires authenticated team membership
- Expiration date support — expired links show error, not report
- Revocation with confirmation — revoked links show error immediately
- View count + last viewed time tracked per link
- Share modal in report dashboard with existing links list, copy button, revoke button
- Active link count indicator on Share button
- `lib/db/share-links.ts`, `lib/utils/tokens.ts`, `lib/sharing/sanitize-report.ts` created
- `docs/SHARING_AND_ACCESS.md` created

### Export-ready report view and browser PDF ✅
- Owner/coach/analyst can click **Export** in the report header
- `ExportReportModal` opens with section selector, instructions, and export history
- 8 configurable sections: Overview, Coaching Insights, Player Reports, Opponent Tendencies, Practice Plan, Evidence, Assumptions & Limitations, Verification Status
- `/teams/[teamId]/games/[gameId]/report/export` — clean print-ready page with no sidebar or app chrome
- `PrintControls` component shows on screen with Print button (hidden in print via `@media print`)
- Export page renders cover header, executive summary, all selected sections with confidence labels
- Evidence displayed as formatted timestamps (MM:SS) with labels, descriptions, and player names
- Assumptions & Limitations section preserves trust transparency in exported document
- Browser print dialog → Save as PDF produces a clean, readable PDF
- `exports` DB records created with `browser_pdf` type; status tracked as `processing` → `completed`
- Export history shown in modal (5 most recent)
- Players/viewers cannot access export — redirected from export route
- `lib/db/exports.ts` data access layer; `lib/actions/exports.ts` server action
- Print CSS in `app/globals.css`: `.no-print`, `.avoid-break`, `@page` margins
- Export layout in `app/.../report/export/layout.tsx` (no sidebar, white background)
- `docs/EXPORTS_AND_PRINTING.md` created documenting strategy, lifecycle, permissions, and future plans
- Server-side PDF generation (Puppeteer/Playwright) and stored PDF downloads are planned for a future prompt

### Real AI provider layer and strict JSON generation ✅
- Provider-agnostic AI system: `mock | openai | anthropic | gemini`
- **Mock provider** — retained and default; deterministic, data-driven, zero cost
- **OpenAI provider** — fully implemented (`gpt-4o-mini` default); uses `response_format: json_object`
- **Anthropic provider** — clean stub with setup instructions
- **Gemini provider** — clean stub with setup instructions
- Strict Zod schema validation for all AI output (`lib/ai/report-schema.ts`)
- JSON extraction + validation pipeline handles code fences, preamble, malformed text
- Hallucination guardrails: unknown player/event IDs stripped post-generation
- Normalization ensures v1 limitation always present, priorities/sort orders assigned
- System prompt: 14 hard rules — no invented IDs, no video frame claims, JSON-only, sport-specific guidance
- User prompt: compact structured input with explicit allowed player/event ID lists
- Cost control: `MAX_ANALYSIS_EVENTS=80`, `MAX_ANALYSIS_PLAYERS=40`, `MAX_NOTE_CHARS=6000`
- Analysis job now stores provider + model + token usage + normalization warnings
- `ReportHeader` and `GenerateReportButton` show current provider mode
- Provider config UI note: "Reports generated from structured game data, notes, and tagged key moments"
- `lib/ai/errors.ts` typed error classes for config, provider, schema, parse failures
- `lib/analysis/normalize-generated-report.ts` normalization + ID validation
- `lib/ai/generate-game-report.ts` high-level async entry point
- `lib/ai/provider-factory.ts` environment-driven factory
- `docs/REAL_AI_PROVIDER_LAYER.md` created documenting architecture, env vars, prompts, guardrails

### Upcoming
- **Prompt 15** — Product Polish, Demo Data, and End-to-End Founder Demo Flow

---

## Local Setup

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

For early development (mock AI, no Supabase required), add only:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
AI_PROVIDER=mock
```

See [`/docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) for the full variable reference.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Start Next.js development server |
| Build | `npm run build` | Production build |
| Start | `npm run start` | Start production server |
| Lint | `npm run lint` | Run ESLint |
| Typecheck | `npm run typecheck` | Run `tsc --noEmit` |

---

## Folder Overview

```
app/            Next.js routes (pages, layouts, API routes)
components/     Reusable React components
  ui/           Design system primitives
  layout/       App shell (sidebar, header, shell)
  marketing/    Landing page sections
  dashboard/    Dashboard widgets
lib/            Application logic and services
  supabase/     Supabase client setup
  ai/           AI service layer (mock + future providers)
  video/        Video processing types
  utils/        Shared utilities (cn, format)
  constants/    App-wide constants and navigation
types/          Shared TypeScript types
docs/           Project documentation
public/         Static assets
```

See [`/docs/REPO_STRUCTURE.md`](docs/REPO_STRUCTURE.md) for the detailed guide.

---

## Documentation

| Document | Description |
|----------|-------------|
| [`PROJECT_CONSTITUTION.md`](docs/PROJECT_CONSTITUTION.md) | Product vision, users, workflow, trust principles |
| [`BUILD_RULES.md`](docs/BUILD_RULES.md) | Engineering rules, naming conventions |
| [`ROADMAP.md`](docs/ROADMAP.md) | Phased build plan |
| [`AI_OUTPUT_PRINCIPLES.md`](docs/AI_OUTPUT_PRINCIPLES.md) | AI output rules and schemas |
| [`DESIGN_PRINCIPLES.md`](docs/DESIGN_PRINCIPLES.md) | UI design system and component rules |
| [`TECHNICAL_ARCHITECTURE.md`](docs/TECHNICAL_ARCHITECTURE.md) | Stack and architecture reference |
| [`REPO_STRUCTURE.md`](docs/REPO_STRUCTURE.md) | Folder organization guide |
| [`ENVIRONMENT.md`](docs/ENVIRONMENT.md) | Environment variable reference |
| [`DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) | Full schema reference — tables, enums, indexes, design decisions |
| [`SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) | Supabase project setup, migrations, storage, auth |
| [`RLS_POLICIES.md`](docs/RLS_POLICIES.md) | Row Level Security model, helper functions, per-table policies |
| [`AUTHENTICATION.md`](docs/AUTHENTICATION.md) | Auth strategy, flows, protected routes, profile creation, security |
| [`TEAM_WORKSPACES.md`](docs/TEAM_WORKSPACES.md) | Team workspace concept, creation flow, membership model, role model |
| [`ROSTER_MANAGEMENT.md`](docs/ROSTER_MANAGEMENT.md) | Player data model, fields, permissions, archive vs delete, AI integration |
| [`GAME_CREATION.md`](docs/GAME_CREATION.md) | Game/practice data model, setup checklist, permissions, future AI integration |
| [`VIDEO_ASSETS.md`](docs/VIDEO_ASSETS.md) | Video upload architecture, storage paths, signed URL strategy, future processing roadmap |
| [`TIMESTAMPS_AND_EVENTS.md`](docs/TIMESTAMPS_AND_EVENTS.md) | Manual timestamp feature, evidence layer, data model, video integration, AI readiness, roadmap |
| [`ANALYSIS_JOBS.md`](docs/ANALYSIS_JOBS.md) | Analysis job lifecycle, input/output snapshots, versioning, permissions, transaction limitations |
| [`MOCK_AI_REPORTS.md`](docs/MOCK_AI_REPORTS.md) | Mock AI generator design, confidence logic, evidence grounding, LLM integration roadmap |
| [`REPORT_DASHBOARD.md`](docs/REPORT_DASHBOARD.md) | Report dashboard layout, insight detail, evidence linking, video seeking, permissions |
| [`VERIFICATION_AND_EDITING.md`](docs/VERIFICATION_AND_EDITING.md) | Coach verification system, report editing, original AI content preservation, permissions |
| [`SHARING_AND_ACCESS.md`](docs/SHARING_AND_ACCESS.md) | Share links, visibility modes, token strategy, sanitization, expiration, revocation, view tracking |
