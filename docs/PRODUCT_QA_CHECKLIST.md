# GameIQ — Product QA Checklist

Use this checklist before demos, releases, or significant changes. Each section covers a distinct product flow.

Mark items:  
- `[x]` Pass  
- `[ ]` Fail / Not tested  
- `[~]` Partial / Known limitation

---

## 1. Authentication

- [ ] Landing page loads without error for unauthenticated user
- [ ] Sign up form loads at `/auth/signup`
- [ ] Sign up with email + password creates a new account
- [ ] Confirmation email flow works (if email confirmation is enabled)
- [ ] Email callback route handles PKCE correctly
- [ ] Sign in form loads at `/auth/login`
- [ ] Sign in with valid credentials creates a session
- [ ] Sign in with invalid credentials shows appropriate error
- [ ] Sign out redirects to landing page and clears session
- [ ] Accessing `/dashboard` without auth redirects to `/auth/login`
- [ ] `?next=` redirect parameter works after login

---

## 2. Team Creation

- [ ] `/teams/new` form loads
- [ ] Team name validation (required, min 2, max 80)
- [ ] Sport selection required
- [ ] Optional fields (org, level, location, description) save correctly
- [ ] Successful creation redirects to team workspace
- [ ] Creator is assigned `owner` role in `team_members`
- [ ] Team appears on `/teams` page after creation
- [ ] Team appears on `/dashboard` after creation
- [ ] Duplicate slug handled gracefully (suffix appended)

---

## 3. Roster Management

- [ ] `/teams/[teamId]/players` loads with correct player list
- [ ] Search/filter by name works
- [ ] Filter by status works (active, injured, etc.)
- [ ] Empty state shown when no players exist
- [ ] Add player form at `/teams/[teamId]/players/new` loads
- [ ] All player fields save correctly (name, jersey, position, role, etc.)
- [ ] Edit player at `/teams/[teamId]/players/[playerId]/edit` works
- [ ] Archive player changes status to `archived` (soft delete)
- [ ] Archived players not shown by default
- [ ] Delete player (permanent) requires confirmation
- [ ] Player count on team workspace card updates after add/delete
- [ ] Non-staff users (player/viewer) cannot access add/edit forms

---

## 4. Game Creation

- [ ] `/teams/[teamId]/games` shows game list
- [ ] Search/filter by title, opponent, type, status works
- [ ] Empty state shown when no games exist
- [ ] New game form at `/teams/[teamId]/games/new` loads
- [ ] All four form sections present: Analysis Type, Opponent & Context, Score/Result, Notes for AI
- [ ] Title, sport, game type validation enforced
- [ ] Optional fields save correctly
- [ ] Game appears in list after creation
- [ ] Game detail page `/teams/[teamId]/games/[gameId]` loads
- [ ] Edit game at `/teams/[teamId]/games/[gameId]/edit` works
- [ ] Archive game (soft delete) with confirmation
- [ ] Delete game with confirmation (manager only)
- [ ] Game count on team workspace card updates

---

## 5. Video Upload

- [ ] Video upload card renders on game detail page
- [ ] Drag-and-drop upload works
- [ ] File picker upload works
- [ ] File type validation (video/* only)
- [ ] File size validation
- [ ] Upload progress shown
- [ ] Uploaded video appears as `GameVideoPlayer`
- [ ] Video player loads and plays
- [ ] Video player shows loading state
- [ ] Signed URL is generated for playback
- [ ] Setup checklist step 3 (Video) shows complete after upload
- [ ] Re-upload (replace video) works
- [ ] Non-staff cannot upload video

---

## 6. Timestamps / Key Moments

- [ ] Timestamps page `/teams/[teamId]/games/[gameId]/timestamps` loads
- [ ] Event list shows existing events in chronological order
- [ ] Search/filter by label, type, importance, player works
- [ ] Add event form renders (label, importance, type, team context, description, players, tags)
- [ ] Event saves correctly with all fields
- [ ] Event appears in list immediately after save
- [ ] Edit event works
- [ ] Delete event with confirmation works
- [ ] Timestamp parser accepts seconds, `MM:SS`, `H:MM:SS`
- [ ] "Add event at current time" prefills from video position (when video exists)
- [ ] Click event in list seeks video to that timestamp (when video loaded)
- [ ] Event stats (total, high-impact, players, types) update correctly
- [ ] AI readiness badge updates based on event count
- [ ] Setup checklist step 4 (Key moments) shows complete after adding events
- [ ] Non-staff users see events read-only (no add/edit/delete)

---

## 7. AI Report Generation

- [ ] Report page `/teams/[teamId]/games/[gameId]/report` loads
- [ ] No-report state shown with readiness card when no report exists
- [ ] Readiness levels show correctly: not_ready / needs_context / ready / strong
- [ ] Generate report button visible for staff with sufficient data
- [ ] Generate report button hidden or disabled for non-staff
- [ ] Clicking Generate starts the analysis job (status shows as running)
- [ ] Page transitions to report dashboard after job completes
- [ ] Report generation works with mock AI provider
- [ ] Report generation works with OpenAI provider (if configured)
- [ ] Failed generation shows error state with retry option
- [ ] Re-generating creates v2, v3, etc. (not overwriting v1)
- [ ] Provider label shows correct mode (Mock AI / OpenAI / etc.)
- [ ] Analysis job is created and tracked in `analysis_jobs` table

---

## 8. Report Dashboard

- [ ] Report dashboard renders all sections
- [ ] Executive summary is present
- [ ] Section nav (Overview / Insights / Players / Opponent / Practice / Evidence) scrolls
- [ ] Up to 5 coaching insights shown
- [ ] Each insight has confidence badge and evidence
- [ ] Player reports section shows tagged players
- [ ] Opponent tendencies section shown when available
- [ ] Practice recommendations shown with drill names
- [ ] Assumptions & limitations section present
- [ ] Evidence references resolve to event labels and timestamps
- [ ] Report version badge shows current version
- [ ] Report generates correctly after re-generation

---

## 9. Insight Detail

- [ ] Insight detail `/teams/[teamId]/games/[gameId]/report/insights/[insightId]` loads
- [ ] Two-column layout renders (video left, evidence right)
- [ ] Evidence events listed with formatted timestamps
- [ ] Clicking timestamp evidence seeks video (if video present)
- [ ] Back link returns to report dashboard
- [ ] Insight title, summary, why-it-matters, and recommended action shown
- [ ] Verification history shown if feedback exists
- [ ] Coach-edited badge shown if insight has been edited

---

## 10. Verification and Editing

- [ ] Verify button appears for staff users
- [ ] Marking verification status (Accurate / Partially Accurate / Inaccurate) saves correctly
- [ ] Feedback text and correction notes saved
- [ ] Verification badge appears on insight after marking
- [ ] Edit controls appear for staff
- [ ] Editing coaching insight title and summary saves correctly
- [ ] Editing player report saves correctly
- [ ] Editing practice recommendation saves correctly
- [ ] Editing opponent tendency saves correctly
- [ ] Editing game report summary (executive summary, title) saves
- [ ] Original AI content preserved (never overwritten)
- [ ] Coach-edited badge appears on edited items
- [ ] Player and viewer users cannot access verify or edit controls

---

## 11. Sharing

- [ ] Share button appears in report header for staff
- [ ] Share modal opens and lists existing links
- [ ] Creating share link with "Public summary" visibility works
- [ ] Creating share link with "Staff only" visibility works
- [ ] Creating share link with "Player specific" visibility works
- [ ] Shared URL `/share/reports/[token]` opens for unauthenticated user
- [ ] Public summary shows executive summary and insight titles only (no player data)
- [ ] Staff-only link requires authenticated team membership
- [ ] Player-specific link shows only the selected player's report
- [ ] Active link count badge on Share button updates
- [ ] Revoke share link disables access immediately
- [ ] Expired links show error, not report
- [ ] View count increments on each access
- [ ] Share page has no team navigation or edit controls

---

## 12. Export

- [ ] Export button appears for staff in report header
- [ ] Export modal opens with section selector
- [ ] All 8 sections can be toggled
- [ ] Export page `/teams/[teamId]/games/[gameId]/report/export` loads
- [ ] Export page has no sidebar or app chrome
- [ ] Print Controls button visible on screen, hidden in print
- [ ] All selected sections render in print-ready format
- [ ] Browser print dialog opens
- [ ] Saved PDF looks clean (cover, sections, evidence)
- [ ] Export record created in `exports` table
- [ ] Export history shown in modal (last 5)
- [ ] Non-staff users (player/viewer) cannot access export page

---

## 13. Permissions / Access Control

- [ ] Player role: can view report, timestamps, roster — cannot edit anything
- [ ] Viewer role: same as player
- [ ] Analyst role: can generate reports, verify, edit — cannot delete team/games
- [ ] Coach role: all analyst permissions + can manage roster
- [ ] Owner role: all permissions including delete team, delete game, remove members
- [ ] Non-member: cannot access any team routes (returns 404)
- [ ] Unauthenticated: all protected routes redirect to login
- [ ] RLS policies enforce membership at database level

---

## 14. Empty States

- [ ] No teams → `TeamEmptyState` with CTA to create team
- [ ] No players → roster empty state with CTA to add player
- [ ] No games → games empty state with CTA to create game
- [ ] No video → upload card shown with clear instructions
- [ ] No timestamps → empty state with 5+ events guidance
- [ ] No report → readiness card with current readiness level
- [ ] No share links → empty state in share modal
- [ ] No exports → empty state in export modal
- [ ] No recent reports on dashboard → empty state with CTA

---

## 15. Loading States

- [ ] Dashboard shows correct data without layout jump
- [ ] Team workspace loads data correctly
- [ ] Roster list loads without flicker
- [ ] Game list loads without flicker
- [ ] Report generation shows spinner and "Generating…" state
- [ ] Video upload shows progress
- [ ] Insight detail loads video and evidence correctly
- [ ] Share modal loads existing links before showing controls

---

## 16. Error States

- [ ] 404 page renders for unknown routes
- [ ] Team not found → 404 or redirect
- [ ] Game not found → 404
- [ ] Insight not found → 404
- [ ] Share token invalid or revoked → clear error message
- [ ] Share token expired → clear error message
- [ ] Supabase not configured → graceful degradation (returns empty/null, no crash)
- [ ] AI provider not configured → clear error with instructions
- [ ] Report generation failure → error state with retry CTA
- [ ] Video signed URL failure → clear error, not crash

---

## 17. Mobile Responsiveness

- [ ] Landing page readable on mobile
- [ ] Dashboard layout works on mobile (stacked)
- [ ] Team workspace cards stack correctly
- [ ] Roster list readable on mobile
- [ ] Game list readable on mobile
- [ ] Timestamp workspace usable on mobile (scrollable event list)
- [ ] Report dashboard sections readable
- [ ] Report section nav accessible on mobile
- [ ] Share modal usable on mobile
- [ ] Export page readable on mobile (pre-print)
- [ ] No horizontal overflow on core pages

---

## 18. Build / Type / Lint

- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm run lint` passes with 0 errors (or only approved warnings)
- [ ] `npm run build` completes successfully
- [ ] No unresolved imports
- [ ] No unused variables causing build failures
- [ ] No `any` types in critical paths

---

## 19. Demo Flow (End-to-End)

- [ ] Landing page loads
- [ ] Auth works (sign up or sign in)
- [ ] Dashboard loads with correct user greeting
- [ ] Demo setup CTA shown when `NEXT_PUBLIC_ENABLE_MOCK_DATA=true` and no team
- [ ] Navigate to `/demo/setup`
- [ ] Click Create demo workspace — completes in < 15 seconds
- [ ] Redirect to AI report
- [ ] Report dashboard shows all sections
- [ ] Coaching insights visible with evidence
- [ ] Click insight → detail page loads with evidence panel
- [ ] Verification controls work
- [ ] Share link created and opens in incognito
- [ ] Export page loads and print works
- [ ] Back navigation works throughout
- [ ] Setup checklists show correct completion state

---

## 20. Security

- [ ] No API keys in client-side code or browser console
- [ ] Share tokens are cryptographically random (not sequential IDs)
- [ ] Expired/revoked share tokens return error, not report data
- [ ] Video signed URLs expire after 1 hour
- [ ] RLS prevents accessing other users' team data
- [ ] Service role key never used in client components
- [ ] No raw stack traces in error UI
- [ ] Demo data is user-scoped, not globally visible

---

---

## Prompt 16 QA Results — 2026-06-01

**Method:** Code review, build verification, static analysis. Browser testing requires a live Supabase project — marked "Not tested" where browser runtime is required.

### 18. Build / Type / Lint

- [x] `npm run typecheck` passes with 0 errors
- [x] `npm run lint` passes with 0 errors
- [x] `npm run build` completes successfully (26 routes)
- [x] No unresolved imports
- [x] No unused variables causing build failures

### Auth Flow (code review)

- [x] Landing page — no auth required (public)
- [x] `/auth/login`, `/auth/signup` — public routes
- [x] `/auth/callback` — validates `next` param before redirect (open-redirect protected)
- [x] `proxy.ts` (Next.js 16 middleware) — enforces auth on all non-public routes
- [x] `redirectTo` param validated both in proxy and in LoginForm
- [x] Logout route clears session server-side
- [x] Supabase not configured → graceful degradation (no crash)
- [ ] Sign up creates account — **Not tested (requires Supabase)**
- [ ] Sign in with invalid credentials shows error — **Not tested (requires Supabase)**

### Security (code review)

- [x] No API keys in client-side code (confirmed: no `NEXT_PUBLIC_OPENAI_API_KEY` etc.)
- [x] Share tokens use `crypto.randomBytes(18)` — 144-bit entropy, URL-safe
- [x] Revoked/expired tokens return error before any report data is fetched
- [x] Service role client created server-side only (`createServiceSupabaseClient` in server.ts)
- [x] `SUPABASE_SERVICE_ROLE_KEY` not prefixed with `NEXT_PUBLIC_`
- [x] RLS enabled on all tables (confirmed in migration SQL)
- [x] Staff role verified server-side for share link creation, revocation, export access
- [x] Open-redirect prevented in login redirect and callback

### Permissions (code review)

- [x] Export page redirects non-staff to report page
- [x] Share link creation/revocation verifies staff role
- [x] Report generation gated by `canGenerate` (staff only in UI and server action)
- [x] `notFound()` returned when team or game not found for current user
- [x] `player`/`viewer` roles cannot write (server-side RLS enforced)

### Known Bugs Fixed in Prompt 16

- [x] Settings page stale "Phase 1" banner removed — replaced with accurate placeholder notice
- [x] Export page footer inverted `aiGenerated` logic fixed — now shows "AI-generated report"
- [x] Deleted conflicting `middleware.ts` (Next.js 16 uses `proxy.ts`)

### Remaining Known Issues (P2 — safe to ship)

- [ ] Settings page is a UI placeholder — profile/password editing not wired
- [ ] No automated test suite (TypeScript + lint + build is the quality gate)
- [ ] View count increment is non-atomic (acceptable for MVP)
- [ ] Player role reads all team data (documented limitation, roadmap item)
- [ ] Notification banner in settings referenced "Phase 1" — fixed

### Not Tested (requires live Supabase + browser)

- All Supabase-dependent flows (signup, signin, team creation, video upload, AI generation, sharing, export)
- Mobile responsiveness
- Browser print dialog quality

---

---

## Prompt 24A + 24B QA Results — 2026-06-02

**Method:** Automated quality checks + code-review smoke test + static analysis. Supabase project is configured locally. Browser runtime testing requires founder to run manually.

### Quality Gates

- [x] `npm run typecheck` passes with 0 errors
- [x] `npm run lint` passes with 0 warnings
- [x] `npm run build` completes successfully (35 routes, "Proxy (Middleware)" confirmed active)
- [x] `npm run test` passes (167/167 tests, 9 files)

### Auth Flow (Prompt 24B fixes applied)

- [x] SignupForm has confirm password field
- [x] SignupForm validates full name: 2–100 chars
- [x] SignupForm validates email format (regex)
- [x] LoginForm validates email format (regex)
- [x] `lib/auth/redirect.ts` — shared safe redirect helper, unit-tested (14 tests)
- [x] All `redirectTo`/`next` params pass through `safeRedirect()` — external URLs rejected
- [x] `ensureCurrentUserProfile()` called on dashboard load (profile guaranteed)
- [x] `docs/AUTH_FLOW_QA.md` created — complete auth QA reference

### Auth / Middleware (code review)

- [x] `/` — public, accessible without auth
- [x] `/auth/login`, `/auth/signup`, `/auth/error`, `/auth/callback`, `/auth/logout` — public
- [x] `/privacy`, `/feedback`, `/request-access`, `/support`, `/demo` — public
- [x] All other routes redirect unauthenticated users to login with `?redirectTo=`
- [x] Open-redirect prevention — `safeRedirect()` blocks external URLs
- [x] Auth callback handles PKCE (code exchange) and email confirmation (token_hash)
- [x] Supabase not configured → no crash (returns null gracefully)
- [x] Next.js 16: proxy.ts is the correct middleware file (not middleware.ts)

### Security (code review)

- [x] No API keys in `NEXT_PUBLIC_` variables
- [x] `SUPABASE_SERVICE_ROLE_KEY` never in `NEXT_PUBLIC_` prefix
- [x] Share tokens use `crypto.randomBytes(18)` — 144-bit entropy
- [x] Revoked/expired share links return error before content
- [x] Video never included in any share mode (`canShowVideo = false`)
- [x] RLS enabled on all tables (confirmed in migration SQL)
- [x] Staff role verified server-side for all writes
- [x] Admin routes gated by `ADMIN_EMAILS` env var

### Core Library Unit Tests (167 passing, 9 files)

- [x] Timestamp parsing: seconds, MM:SS, H:MM:SS formats
- [x] Timestamp formatting
- [x] AI report schema validation (Zod)
- [x] Report normalization (hallucination guard — unknown event IDs removed)
- [x] Share report sanitization (all 4 visibility modes)
- [x] Permission helpers
- [x] Component smoke tests: ConfidenceBadge, VerificationBadge, EmptyState
- [x] Auth redirect safety — 14 tests for `isSafeRedirect` / `safeRedirect`
- [x] Auth validation — 22 tests for name, email, password, confirm-password

### Not Tested (requires live Supabase + browser — founder must run before coach demo)

- [ ] Sign up creates account + confirms profile row
- [ ] Confirm password mismatch shows error
- [ ] Login / logout flow
- [ ] Dashboard loads, shows team or empty state
- [ ] Unsafe redirect (`?redirectTo=https://evil.com`) blocked in browser
- [ ] Team creation (RLS + RPC verification)
- [ ] Roster CRUD
- [ ] Game creation
- [ ] Video upload (storage bucket)
- [ ] Timestamp entry
- [ ] Mock AI report generation
- [ ] Report dashboard all sections
- [ ] Insight verification and editing
- [ ] Share link creation (incognito access test)
- [ ] Export print view
- [ ] Support form submission
- [ ] Admin pages (analytics, feedback, support)
- [ ] Demo workspace creation + no duplicate check

**Complete browser smoke test:** See [`/docs/PRODUCTION_SMOKE_TEST.md`](PRODUCTION_SMOKE_TEST.md) and [`/docs/AUTH_FLOW_QA.md`](AUTH_FLOW_QA.md).

### Deployment Fix

- [x] `DEPLOYMENT.md` migration list updated — now lists all 7 migrations (0001–0011, skipping gaps)

*Last updated: Prompt 24A — Local Configuration, First Run, and MVP Smoke Test (2026-06-01)*

---

---

## Prompt 25 QA Results — 2026-06-02 (Release Candidate Lock)

**Method:** Full automated sweep + code review + security audit. No new Supabase browser testing (unchanged from Prompt 24B). Fixes applied in this pass.

### Quality Gates

- [x] `npm run typecheck` passes with 0 errors
- [x] `npm run lint` passes with 0 warnings
- [x] `npm run build` completes successfully (34 routes, Proxy Middleware confirmed)
- [x] `npm run test` passes (167/167 tests, 9 files)
- [ ] `npm run test:e2e` — Playwright (requires running dev server; public routes only)
- [ ] `npm run benchmark:ai` — no benchmark script exists (AI quality evaluated via mock output inspection)

### Code Fixes Applied (Prompt 25)

- [x] `lib/utils/slug.ts` — replaced `Math.random()` with `crypto.getRandomValues()` (P2-7 resolved)
- [x] `supabase/migrations/0012_share_links_token_unique.sql` — added UNIQUE constraint on `share_links.token` (P1-4 resolved)
- [x] `app/settings/page.tsx` — removed internal "Phase 7" reference from Notifications card

### Documentation Updates Applied (Prompt 25)

- [x] `docs/FINAL_PROJECT_HANDOFF.md` — removed stale "Not Built" items (automated tests, CI/CD now exist); updated top-10 engineering task list
- [x] `docs/TECHNICAL_DEBT.md` — marked D3 and S3 as resolved
- [x] `docs/PRIORITIZED_ISSUES.md` — marked P1-4 and P2-7 as resolved
- [x] `docs/GO_NO_GO_CRITERIA.md` — updated Level 3 and Level 4 status for Prompt 25
- [x] `docs/PRODUCT_QA_CHECKLIST.md` — this entry
- [x] `docs/MVP_READINESS_REPORT.md` — Prompt 25 section added
- [x] `docs/FINAL_BUG_LIST.md` — created
- [x] `docs/RELEASE_CANDIDATE_REPORT.md` — created

### Route Audit (build output confirms all 34 routes compile)

- [x] `/` — public, static, confirmed
- [x] `/auth/signup`, `/auth/login`, `/auth/callback`, `/auth/error`, `/auth/logout` — public
- [x] `/privacy`, `/feedback`, `/support`, `/request-access` — public static pages
- [x] `/demo`, `/demo/setup` — public (middleware patched in Prompt 24A)
- [x] `/dashboard` — protected, redirects to login without auth
- [x] `/teams`, `/teams/new`, `/teams/[teamId]`, `/teams/[teamId]/players`, `/teams/[teamId]/games` — protected team routes
- [x] `/teams/[teamId]/games/[gameId]`, `/setup`, `/timestamps`, `/report`, `/report/export`, `/report/insights/[insightId]` — all compile
- [x] `/share/reports/[token]` — public token-gated
- [x] `/settings` — protected
- [x] `/admin`, `/admin/analytics`, `/admin/feedback`, `/admin/support` — protected + admin-email-gated
- [x] `app/error.tsx`, `app/not-found.tsx` — global error boundary and 404 confirmed

### Security Review (code review — unchanged from Prompt 24B, confirmed)

- [x] No API keys in any `NEXT_PUBLIC_` variable
- [x] `SUPABASE_SERVICE_ROLE_KEY` server-only
- [x] Share tokens: 144-bit entropy via `crypto.randomBytes(18)`
- [x] `share_links.token` now has DB-level UNIQUE constraint
- [x] Revoked/expired share links checked before content returned
- [x] RLS on all 17 tables confirmed
- [x] Admin routes gated by `ADMIN_EMAILS` + authenticated user check
- [x] Video never exposed in any share mode (`canShowVideo = false`)
- [x] Safe redirect: `isSafeRedirect()` blocks external URLs in proxy and auth callback
- [x] Slug suffix: now uses `crypto.getRandomValues()` instead of `Math.random()`

### UX Honesty Review

- [x] Landing page MVP honesty section explicitly disclaims: no frame analysis, no player/ball tracking
- [x] `AssumptionsLimitationsCard` shows limitations in every report
- [x] `ReportOverview` correctly references "computer vision" as roadmap only
- [x] No overclaims found in source or marketing components
- [x] Settings "Phase 7" internal reference removed

### AI Safety Review

- [x] Mock AI output: structured, evidence-linked, no hallucinated IDs (verified via tests)
- [x] Zod validation rejects malformed AI outputs before storage
- [x] System prompt enforces 14 guardrails (no invented IDs, no frame analysis claims)
- [x] `normalize-generated-report.ts`: removes evidence_ids that don't map to real events
- [x] Assumptions & limitations always included in report output
- [x] No injury diagnosis, no offensive player judgments in mock output
- [ ] `benchmark:ai` script — not implemented; deferred to v1.1

### Remaining Not Tested (requires live Supabase + browser)

Same as Prompt 24B — see "Not Tested" section above. Founder must run production smoke test before coach demo.

*Last updated: 2026-06-02 — Prompt 25: Final Full Test Sweep and Release Candidate Lock*
