# GameIQ — Repository Structure

> This document explains what belongs where in the GameIQ repository. Follow it strictly to keep the codebase navigable as it grows.

---

## Top-Level Layout

```
/
  app/              Next.js App Router — pages, layouts, API routes
  components/       Reusable React components
  lib/              Non-UI application logic and service layers
  types/            Shared TypeScript type definitions
  docs/             Project documentation (never delete)
  public/           Static assets served from the root
  .env.example      Environment variable template
  next.config.ts    Next.js configuration
  tsconfig.json     TypeScript configuration
  package.json      Dependencies and scripts
```

---

## `app/` — Routes and Layouts

All Next.js App Router pages live here. Follows file-system routing.

```
app/
  layout.tsx              Root layout (HTML, fonts, global CSS)
  page.tsx                Landing page (public, marketing)
  globals.css             Tailwind import + global design system tokens

  auth/
    login/page.tsx        Sign-in page
    signup/page.tsx       Account creation page

  dashboard/
    page.tsx              User dashboard overview

  teams/
    page.tsx              Team list
    new/page.tsx          Team creation form
    [teamId]/
      page.tsx            Team overview
      players/page.tsx    Roster management
      games/
        page.tsx          Game list
        new/page.tsx      Game creation form
        [gameId]/
          page.tsx        Game overview (video + status)
          setup/page.tsx  Metadata and player selection
          timestamps/page.tsx  Event timestamp editor
          report/
            page.tsx      AI game report dashboard
            insights/[insightId]/page.tsx  Individual insight detail

  settings/
    page.tsx              User account settings

  api/                    Route Handlers (added as needed in later phases)
```

**Rules:**
- Route segment folders contain only routing files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`).
- No business logic in page files. Pages call services and render UI.
- Keep page files short. Extract complex UI into `components/[feature]/`.

---

## `components/` — UI Components

```
components/
  ui/                     Primitive design system components
    Button.tsx
    Card.tsx
    Badge.tsx
    Input.tsx
    Textarea.tsx
    Select.tsx
    EmptyState.tsx
    LoadingState.tsx
    ErrorState.tsx

  layout/                 App shell and structural components
    AppShell.tsx
    AppHeader.tsx
    AppSidebar.tsx
    PageHeader.tsx

  marketing/              Landing page sections
    HeroSection.tsx
    FeatureGrid.tsx

  dashboard/              Dashboard widgets
    DashboardCard.tsx

  teams/                  Team workspace components
    TeamCard.tsx          Team card for /teams and /dashboard listings
    CreateTeamForm.tsx    Client form with useActionState + server action
    TeamEmptyState.tsx    Empty state for no-teams scenario
    TeamOverviewHeader.tsx Team identity block on /teams/[teamId]

  [feature]/              Feature-specific components (add as features grow)
    game/                 e.g., GameMetadataForm, VideoPlayer, TimestampEditor
    report/               e.g., InsightCard, PlayerReportSection, ConfidenceDetail
    roster/               e.g., PlayerCard, RosterTable
```

**Rules:**
- `ui/` contains only pure, reusable primitives. No business logic, no data fetching.
- Feature components go in `components/[feature]/` — co-locate them with the feature they serve.
- Never import from `components/[featureA]` into `components/[featureB]` — extract to `ui/` if shared.
- All `ui/` components must accept `className` and spread props where applicable.
- No default exports in `ui/` or `layout/`. Use named exports.

---

## `lib/` — Application Logic and Services

```
lib/
  supabase/
    client.ts             Browser-side Supabase client
    server.ts             Server-side Supabase client
    types.ts              Generated database types (updated after migrations)

  ai/
    types.ts              AI input/output interfaces
    providers.ts          Provider router (mock → openai → anthropic)
    mock-ai.ts            Mock AI implementation for local development
    openai.ts             (Future) OpenAI implementation
    anthropic.ts          (Future) Anthropic implementation

  video/
    types.ts              Video asset and processing type definitions

  utils/
    cn.ts                 className composition utility (clsx + tailwind-merge)
    format.ts             Formatting helpers (date, duration, confidence, file size)
    slug.ts               Team slug generation (generateSlug, generateSlugWithSuffix)

  db/
    profiles.ts           Profile CRUD (getCurrentProfile, ensureCurrentUserProfile, updateCurrentUserProfile)
    teams.ts              Team data access (getTeamsForCurrentUser, createTeamForCurrentUser, etc.)

  constants/
    app.ts                Product-level constants (name, tagline, limits)
    navigation.ts         Navigation item definitions
```

**Rules:**
- `lib/` contains only non-UI logic. No JSX in any `lib/` file.
- `lib/supabase/` is the only place that imports from `@supabase/supabase-js`.
- `lib/ai/` is the only place that imports from AI provider SDKs.
- Service files are called from Server Components, Server Actions, or Route Handlers — not from UI components directly.
- Business logic that spans multiple services goes in `lib/` as a dedicated service file (e.g., `lib/reports/generate.ts`).

---

## `types/` — Shared TypeScript Types

```
types/
  core.ts         Primitive types: ID, timestamps, ConfidenceLevel, VerificationStatus, JobStatus
  sports.ts       Sport-specific: SportType, GameType, HomeAwayStatus, EventImportance
  ai.ts           AI output shapes: CoachingInsightDraft, PlayerReportDraft, etc.
  database.ts     Application-level database entity interfaces
```

**Rules:**
- `types/` contains only type and interface declarations. No runtime logic.
- `core.ts` exports should be stable — other type files depend on them.
- `database.ts` types are application types, not raw Supabase query results. Transform at the data layer.
- Do not put component prop types here — define them in the component file or co-locate them.

---

## `docs/` — Project Documentation

```
docs/
  PROJECT_CONSTITUTION.md     Product vision, users, workflow, trust principles
  BUILD_RULES.md              Engineering rules, naming conventions, quality standards
  ROADMAP.md                  Phased build plan with acceptance criteria
  AI_OUTPUT_PRINCIPLES.md     AI output rules, schemas, hallucination prevention
  DESIGN_PRINCIPLES.md        UI design system, color, spacing, component rules
  TECHNICAL_ARCHITECTURE.md   Stack, frontend/backend/AI/video architecture
  REPO_STRUCTURE.md           This file — folder organization reference
  ENVIRONMENT.md              Environment variable reference and setup guide
```

**Rules:**
- Never delete a doc file. Update or supersede it instead.
- Docs are the authoritative source of product truth. Code should agree with docs, not the other way around.
- When a design decision is made that contradicts a doc, update the doc immediately.

---

## `public/` — Static Assets

```
public/
  logo-placeholder.svg      Temporary logo SVG
  (future) logos, icons, OG images
```

**Rules:**
- Only truly static assets go here (no generated files, no data files).
- Video files are stored in Supabase Storage, never in `public/`.

---

## Naming Conventions Quick Reference

| Thing | Convention | Example |
|-------|-----------|---------|
| React component file | `PascalCase.tsx` | `GameReportCard.tsx` |
| Non-component TS file | `camelCase.ts` | `generateReport.ts` |
| CSS files | `camelCase.css` | `globals.css` |
| Route folder | `kebab-case` | `[gameId]/` |
| DB column | `snake_case` | `team_id` |
| TS type/interface | `PascalCase` | `CoachingInsight` |
| Exported constant | `SCREAMING_SNAKE_CASE` | `MAX_INSIGHTS_PER_REPORT` |
| Supabase table | `snake_case` (plural) | `coaching_insights` |

---

## What Goes Where — Decision Guide

| Scenario | Location |
|----------|----------|
| New primitive UI (button variant, input type) | `components/ui/` |
| Feature-specific component (game metadata card) | `components/game/` or `components/[feature]/` |
| Supabase query function | `lib/supabase/` (new file per domain) |
| AI prompt or generation logic | `lib/ai/` |
| Video utility | `lib/video/` |
| Shared formatting helper | `lib/utils/format.ts` |
| Cross-feature shared hook | `hooks/` (create this folder when needed) |
| Product constant (max file size, sport labels) | `lib/constants/app.ts` |
| Route-level data fetching | Inside the `page.tsx` Server Component itself |
| Business logic | `lib/[domain]/` service file |
| Type shared between features | `types/` |
| Type used only by one component | Component file or co-located type file |
