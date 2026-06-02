# GameIQ — Product Roadmap

> This roadmap defines the phased build order. Each phase must be fully stable before the next begins. Future implementation prompts should reference these phase numbers to indicate which phase they belong to.

---

## Phase 0 — Product Constitution and Setup ✅

**Goal:** Establish the product vision, principles, and build rules before writing any application code.

Deliverables:
- `/docs/PROJECT_CONSTITUTION.md`
- `/docs/BUILD_RULES.md`
- `/docs/ROADMAP.md`
- `/docs/AI_OUTPUT_PRINCIPLES.md`
- `/docs/DESIGN_PRINCIPLES.md`

Acceptance criteria:
- All five documentation files exist and are detailed.
- No application code has been written.
- The project has a clear founder-grade product direction.

---

## Phase 1 — Foundation, Auth, and Project Setup

**Goal:** Initialize the full-stack project with working authentication and a shell layout.

Deliverables:
- Next.js project initialized with TypeScript, Tailwind CSS, App Router.
- Supabase project created, local dev configured.
- Auth flow: sign up, log in, log out, session management.
- Protected route middleware.
- Basic shell layout: nav, sidebar, main content area.
- Landing/marketing page (minimal).
- Environment variable structure established.
- CI-ready build (no errors, no type failures).

Acceptance criteria:
- A user can sign up, log in, and be redirected to the dashboard.
- Unauthenticated users are redirected to the login page.
- The layout is clean and matches design principles.
- The build passes with zero TypeScript errors.

---

## Phase 2 — Team Workspace Foundation ✅

**Goal:** Users can create and manage a team workspace.

Deliverables (complete):
- Team creation flow at `/teams/new` with full form validation.
- `create_team_with_owner` SECURITY DEFINER RPC for atomic creation.
- Creator automatically assigned `owner` role in `team_members`.
- `/teams` page lists user teams with sport badges, role, and metadata.
- `/teams/[teamId]` workspace with membership access control.
- Team-aware sidebar navigation (shows team context links when inside a team).
- `/dashboard` shows teams, setup checklist, recent reports placeholder.
- `lib/db/teams.ts` typed data access layer.
- `lib/utils/slug.ts` slug generation with collision handling.
- `/docs/TEAM_WORKSPACES.md` architecture documentation.

---

## Phase 2b — Roster Management ✅

**Goal:** Users can manage the player roster for each team.

Deliverables (complete):
- `/teams/[teamId]/players` roster list with search (name), filter (status, position), and roster stats.
- `/teams/[teamId]/players/new` — add player form (staff: owner, coach, analyst).
- `/teams/[teamId]/players/[playerId]/edit` — edit player + archive/delete.
- Archive (status='archived', soft delete, data preserved) and permanent delete (manager only, with confirmation).
- `lib/db/players.ts` typed data access layer with all CRUD + count functions.
- `PlayerStatus` type, full `Player` interface update in `types/database.ts`.
- Roster count shown in team workspace progress cards and dashboard team cards.
- Setup checklist step 2 (Add roster) live — marks complete when any team has ≥ 1 player.
- `/docs/ROSTER_MANAGEMENT.md` architecture documentation.

---

## Phase 3 — Game and Practice Creation Flow ✅

**Goal:** Users can create and manage game/practice analysis records.

Deliverables (complete):
- `/teams/[teamId]/games` list with search/filter and summary stats.
- `/teams/[teamId]/games/new` 4-section creation form.
- `/teams/[teamId]/games/[gameId]` detail page with workflow steps and setup checklist.
- `/teams/[teamId]/games/[gameId]/setup` preparation checklist.
- `/teams/[teamId]/games/[gameId]/edit` edit form + archive/delete.
- `lib/db/games.ts` typed data access layer with full CRUD + count functions.
- `getGameSetupStatus` checking all analysis prerequisites.
- Game counts shown in team workspace and dashboard.
- Setup checklist step 3 (Create first game) live.
- `/docs/GAME_CREATION.md` architecture documentation.

---

## Phase 3b — Video Upload and Asset Management ✅

**Goal:** Coaches can upload game film and view it inside the analysis workflow.

Deliverables (complete):
- Direct client-side browser upload to Supabase Storage `game-videos` bucket.
- `video_assets` DB records created via server action after successful upload.
- `GameVideoPlayer` with signed URL playback (1-hour TTL), loading/error states.
- `VideoUploadCard` with drag-drop, file validation, upload state, success/delete.
- `VideoAssetSummary` showing filename, size, duration, status.
- Video step in `GameSetupChecklist` now live.
- Video status indicator per game in the games list (batch query).
- `lib/db/video-assets.ts`, `lib/storage/videos.ts`, `lib/actions/video.ts`.
- Storage policies documented in `supabase/migrations/0003_storage_policies.sql`.
- `/docs/VIDEO_ASSETS.md` architecture documentation.

---

## Phase 4 — Manual Timestamp and Event Input

Deliverables:
- Team creation flow.
- Team settings and profile.
- Team member roles: Owner, Coach, Analyst, Player.
- Player roster CRUD: add, edit, deactivate players.
- Player profile: name, number, position, notes.
- Database schema: `teams`, `team_members`, `players`.
- RLS policies for all new tables.

Acceptance criteria:
- A user can create a team, add players, and see the roster.
- A user without team membership cannot access another team's data.
- Player data is editable and persisted correctly.

---

## Phase 3 — Game Creation, Video Upload, and Event Timestamps

**Goal:** Users can create a game/practice record, upload video, enter metadata, and add manual event timestamps.

Deliverables:
- Game/practice creation form with full metadata fields.
- Video upload to Supabase Storage with progress indicator.
- Video player embedded in the game detail view.
- Manual event/timestamp entry:
  - Time in video
  - Event type (configurable list per sport)
  - Players involved
  - Team or opponent
  - Description
  - Importance level
  - Tags
- Event timestamp list and editing UI.
- Database schema: `games`, `video_assets`, `event_timestamps`.
- RLS policies for all new tables.

Acceptance criteria:
- A user can create a game, upload a video, and see it play back.
- A user can add, edit, and delete event timestamps.
- Timestamps are linked to video time and the user can jump to them.
- All data is persisted and team-scoped.

---

## Phase 4 — Report Schema, Analysis Jobs, and Mock AI

**Goal:** Define the complete report data schema, implement the analysis job queue, and generate reports using mock AI for local development.

Deliverables:
- Analysis job creation and status tracking.
- Report schema: `analysis_jobs`, `game_reports`, `coaching_insights`, `player_reports`, `practice_recommendations`, `opponent_tendencies`.
- Mock AI service that generates realistic structured reports from available inputs.
- Report dashboard UI showing all report sections.
- Confidence badge component.
- Evidence reference component.
- Assumption display component.
- `MOCK_AI=true` environment variable support.
- RLS policies for all new tables.

Acceptance criteria:
- A user can trigger an analysis job.
- The job processes using the mock AI service and produces a structured report.
- The report dashboard displays: executive summary, top insights, player reports, opponent tendencies, practice recommendations.
- Each insight shows confidence, evidence, and assumptions.
- The build passes with zero errors.

---

## Phase 5 — Real AI Report Generation

**Goal:** Replace the mock AI service with real LLM-powered analysis using the provider-agnostic service layer.

Deliverables:
- Production AI service layer connected to OpenAI (or Anthropic as primary or fallback).
- Prompt templates for: executive summary, coaching insights, player reports, opponent tendencies, practice recommendations.
- AI output parsing and validation with zod schemas.
- Structured JSON output stored in database.
- Graceful fallback to mock output if AI API fails.
- Token usage tracking (optional for v1 but scaffolded).

Acceptance criteria:
- A real game with metadata, timestamps, and notes produces a real AI-generated report.
- AI output is parsed, validated, and stored as structured JSON.
- If the AI call fails, the user sees a clear error state and can retry.
- AI output contains evidence references, confidence levels, and assumptions — never fabricated data.

---

## Phase 6 — Verification, Editing, Sharing, and Export

**Goal:** Coaches can verify, edit, share, and export reports. The verification feedback loop is complete.

Deliverables:
- Coach verification UI for each insight: Accurate / Partially Accurate / Inaccurate / Edited.
- Inline editing for any AI-generated insight or player report.
- Verification state persisted to database.
- Share link generation (public or team-restricted).
- Shared report view (read-only, presentation-ready).
- Export to PDF (at minimum a print-friendly report view).
- Verification feedback stored for future use.

Acceptance criteria:
- A coach can verify every insight in a report.
- A coach can edit any AI-generated text.
- Edited state is shown clearly in the UI.
- A share link opens a clean read-only report view for recipients.
- The report can be exported as a PDF.

---

## Phase 7 — Polish, Demo Data, and Deployment Readiness

**Goal:** The product is ready for real users and investor/user demos.

Deliverables:
- Demo mode with realistic seeded data (a complete game with timestamps, notes, and a polished report).
- Onboarding flow for new teams.
- Empty states for all major views.
- Loading states for all async operations.
- Error handling across all flows.
- Mobile-responsive layout (basic responsive, not native mobile).
- SEO metadata and Open Graph tags.
- Environment variable validation on startup.
- Production Supabase setup with proper RLS audit.
- Deployment to Vercel (or equivalent).
- Performance audit: no obvious N+1 queries, no unnecessary client waterfalls.
- Accessibility: basic WCAG AA for core flows.

Acceptance criteria:
- A new user can sign up and complete the full workflow on a real deployment.
- The demo mode is convincing for investor or user demos.
- The product loads fast, handles errors gracefully, and looks polished.

---

## Phase 8 — Final QA, Security, and Deployment Readiness ✅

**Goal:** Harden the MVP for real coach demos and early pilots.

Deliverables (complete):
- `proxy.ts` auth enforcement middleware
- RLS review across all 17 tables
- Share link security (entropy, expiry, revocation, sanitization)
- `/docs/PRODUCT_QA_CHECKLIST.md` — 20-flow manual QA checklist
- `/docs/DEPLOYMENT.md` — Vercel + Supabase deployment guide
- `/docs/KNOWN_LIMITATIONS.md` — honest v1 scope documentation
- `/docs/MVP_READINESS_REPORT.md` — feature status and go/no-go assessment
- `npm run typecheck`, `npm run lint`, `npm run build` all pass clean

---

## Phase 9 — Investor/Coach Demo Landing and First-User Feedback Loop ✅

**Goal:** Make GameIQ pitch-ready and user-research-ready for coaches, advisors, and investors.

Deliverables (complete):
- Polished 7-section landing page (`/`) with honest MVP positioning
- `/demo` — demo explanation page with what's included and what to look for
- `/request-access` — early interest form (name, email, role, sport, pain point, tools)
- `/feedback` — product feedback form (1–5 rating, most valuable, WTP research)
- `/privacy` — MVP privacy notice
- `/admin/feedback` — founder-only admin review (gated by `ADMIN_EMAILS` env var)
- `supabase/migrations/0009_feedback_tables.sql` — `access_requests` and `product_feedback` tables with RLS
- `lib/db/feedback.ts` — typed data access for insert and admin read
- Feedback CTA links in dashboard footer and shared report footer
- 3 new docs: `FIRST_USER_FEEDBACK.md`, `LANDING_PAGE_STRATEGY.md`, `COACH_DISCOVERY_GUIDE.md`

---

## Future — Post-MVP Expansion

These are intentional future capabilities. Architecture must not block them, but they are not to be built until explicitly requested.

### Computer Vision and Automated Detection

- Automated event detection from video frames
- Player identification and tracking
- Ball tracking
- Pose estimation and biomechanics
- Zone analysis and heatmaps

### Scouting and Recruiting

- Scouting report generation
- Player profile search and comparison
- Cross-team player analysis
- Recruiting pipeline integration

### Injury and Load Management

- Load monitoring integration
- Injury risk flags from workload data
- Wellness survey integration
- Training periodization recommendations

### Team Trends and Historical Analysis

- Season-over-season trend reports
- Player development arc tracking
- Opponent historical tendencies
- Tactical evolution analysis

### Media, Highlights, and Fan Features

- Auto-generated highlight reels
- Shareable clip creation
- Parent/fan report access
- Social media export formats

### Multi-Sport Expansion

- Sport-specific intelligence modules
- Custom event type libraries per sport
- Sport-specific AI prompt packs

### Platform and Business Features

- Subscription billing
- Seat-based team pricing
- Multi-organization enterprise accounts
- API access for partners
- Marketplace for sport-specific modules

---

## Summary: Built vs. What Is Next

### Built in MVP (Complete — GameIQ MVP RC1, 2026-06-02)

| Feature | Status |
|---------|--------|
| Supabase Auth (email/password, PKCE, session middleware, confirm-password, safe redirects) | ✅ |
| Team workspaces with role-based access (owner, coach, analyst, player) | ✅ |
| Roster management (CRUD, archive, search, filter) | ✅ |
| Game/practice creation with 4-section metadata form | ✅ |
| Video upload to private Supabase Storage + signed URL playback | ✅ |
| Manual timestamp tagging workspace (12 event fields) | ✅ |
| AI readiness scoring badge | ✅ |
| AI report generation — mock provider (deterministic, evidence-linked) | ✅ |
| AI report generation — OpenAI GPT-4o-mini (production-ready) | ✅ |
| Strict Zod validation on all AI JSON outputs | ✅ |
| 14 AI guardrail rules in system prompt | ✅ |
| Full report dashboard (6 sections: insights, players, opponent, practice, evidence, assumptions) | ✅ |
| Insight detail pages with video seek to timestamp | ✅ |
| Coach verification (4 states: accurate/partial/inaccurate/edited) | ✅ |
| Inline editing with append-only audit trail | ✅ |
| 4-mode shareable reports with 144-bit entropy tokens + DB UNIQUE constraint | ✅ |
| Server-side report sanitization by visibility mode | ✅ |
| Export-ready print/PDF view with section selector | ✅ |
| Founder analytics (13 instrumented events, admin dashboard) | ✅ |
| Landing page (7 sections), demo page, request-access form, feedback form | ✅ |
| Support intake form + admin support review | ✅ |
| Admin hub (/admin, /admin/analytics, /admin/feedback, /admin/support) | ✅ |
| Demo workspace (cricket team, 10 players, 12 timestamps, full AI report) | ✅ |
| Global error boundary + 404 page | ✅ |
| Centralized feature flags + env validation | ✅ |
| CI/CD via GitHub Actions | ✅ |
| 167 automated tests (Vitest + React Testing Library) across 9 files | ✅ |
| 6 operational runbooks | ✅ |
| share_links.token DB UNIQUE constraint (migration 0012) | ✅ |

### v1.1 — Pilot Hardening (Next Sprint)

| Task | Priority |
|------|----------|
| Sentry error tracking | P1 |
| Settings page wiring (profile update + password reset) | P1 |
| Rate limiting on analysis generation endpoint | P1 |
| OpenAI token/cost tracking in analysis_jobs | P2 |
| AI retry logic (max 2 retries) | P2 |
| prompt_version field in analysis_jobs | P2 |
| idx_event_timestamps_game_id DB index | P2 |
| Signed video URL expiry UX | P2 |
| Onboarding guidance for new teams | P2 |

### v1.2 — Product Improvements from Coach Feedback

- Team member invitation workflow (email-based, in-app)
- Password reset UI flow
- Player role scoping (players see only their own report section)
- Season analytics — cross-game aggregation and trend detection
- Inline report quality rating widget
- Timestamp form — collapse optional fields behind "Advanced" toggle

### Near-Term (Product / Validation)

- 5–10 structured coach discovery interviews
- 3 pilot teams complete a real game upload and report review
- Report quality evaluation against coach expectations
- Team member invitation workflow (in-app, email-based)
- Password reset / account recovery flow
- Better onboarding (empty state guidance, guided first-game flow)
- Richer player-specific share link (player receives only their section)
- Real AI provider testing with real coach game data
- First usability fixes from coach interview findings
- OAuth sign-in (Google) for lower-friction registration

### Technical Next

- Background job queue for async AI generation (BullMQ or similar)
- Automated test suite (Vitest unit tests, Playwright E2E)
- FFmpeg clip extraction around tagged timestamps
- Server-side PDF generation (Puppeteer/Playwright) with automatic storage
- Storage policy hardening (per-team quotas, upload size limits)
- AI evaluation harness (auto-score outputs vs. coach verification data)
- Supabase Realtime subscription for real-time analysis job status
- Season analytics — cross-game aggregation and trend detection

### Long-Term Vision

- Computer vision microservice — automated event detection from video frames
- Player/ball tracking and formation analysis
- Pose estimation and biomechanics
- Scouting and recruiting profiles
- Player development history across seasons
- Wearable/load monitoring integrations
- Multi-sport modules with sport-specific AI prompt packs
- Subscription billing and seat-based pricing
- Native mobile app (iOS/Android) for sideline tagging
- Highlight generation and social media export formats
