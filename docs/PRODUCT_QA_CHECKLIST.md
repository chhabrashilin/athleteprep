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

*Last updated: Prompt 16 — Final QA, Security Review, and Deployment Readiness (2026-06-01)*
