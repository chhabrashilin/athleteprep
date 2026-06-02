# GameIQ — Testing Strategy

**Date:** June 2026  
**Status:** Implemented in Prompt 21

---

## 1. Testing Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit tests | Vitest | Pure functions: utilities, AI schema, normalization |
| Component tests | Vitest + React Testing Library + jsdom | UI component smoke tests |
| E2E tests | Playwright | Public route smoke tests |
| CI | GitHub Actions | Runs typecheck, lint, unit tests, and build on every push/PR |

---

## 2. What Is Covered

### Unit Tests (`tests/unit/`)

| File | Tests | Critical Path |
|------|-------|---------------|
| `time-utils.test.ts` | Timestamp parsing (plain, MM:SS, H:MM:SS), formatting, clamping | Evidence linking depends on correct timestamps |
| `ai-report-schema.test.ts` | Zod schema validation for all AI report sections | Protects against schema-breaking LLM output |
| `ai-normalization.test.ts` | ID stripping, fallback evidence, V1 limitation guard, warning counter | Protects against hallucinated player/event IDs |
| `sharing-sanitization.test.ts` | All 4 visibility modes, field exclusions, privacy guarantees | Sharing privacy is safety-critical |
| `permissions.test.ts` | All 5 permission helpers, role consistency invariants | UI-level permission decisions |

### Component Tests (`tests/components/`)

| File | Tests |
|------|-------|
| `confidence-badge.test.tsx` | ConfidenceBadge (3 levels), VerificationBadge (5 states), Badge primitive |
| `report-card-smoke.test.tsx` | Badge variants, EmptyState rendering |

### E2E Tests (`tests/e2e/`)

| File | Tests |
|------|-------|
| `smoke.spec.ts` | 6 public routes: landing, login, signup, request-access, demo, privacy |

---

## 3. What Is Not Covered Yet

| Area | Reason | Future Plan |
|------|--------|-------------|
| CoachingInsightCard | Imports `next/link` — needs Next.js test environment or E2E | Authenticated E2E test in Prompt 22 |
| PlayerReportCard | Same as above | E2E |
| Supabase DB layer (`lib/db/`) | Requires a live database connection | Test Supabase project + integration tests |
| RLS policies | Must be tested against a real Postgres instance | Manual QA via PRODUCT_QA_CHECKLIST.md |
| AI generation with real providers | Requires API keys and cost | Manual testing with `AI_PROVIDER=openai` |
| Authenticated E2E flows | Requires a real Supabase project | Prompt 22 / pilot setup |
| Video upload and signed URLs | Requires Supabase Storage | Manual QA |

---

## 4. How to Run Tests

### Prerequisites

```bash
npm install
```

### Run all unit + component tests

```bash
npm run test
```

### Watch mode (during development)

```bash
npm run test:watch
```

### Unit tests only

```bash
npm run test:unit
```

### Component tests only

```bash
npm run test:components
```

### E2E tests (requires running dev server)

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:e2e
```

### Full quality check (matches CI)

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

---

## 5. How CI Works

File: `.github/workflows/ci.yml`

**Triggers:** Every push, every pull request (all branches).

**Steps:**
1. `actions/checkout@v4`
2. `actions/setup-node@v4` with Node 20 and npm cache
3. `npm ci` — installs exact lockfile dependencies
4. `npm run typecheck` — TypeScript strict mode
5. `npm run lint` — ESLint
6. `npm run test` — Vitest unit + component tests
7. `npm run build` — Next.js production build

**Environment:** Placeholder Supabase values are injected for the build step. The build degrades gracefully when Supabase is not configured (returns null/empty, no crash). AI provider is set to `mock` — no real API calls in CI.

**E2E tests are not run in CI** because they require a running server and (for authenticated tests) a live Supabase project. They are run locally before significant releases.

---

## 6. How to Add Future Tests

### Adding a unit test

1. Create `tests/unit/your-module.test.ts`
2. Import the function under test using `@/` alias
3. Use `describe` / `it` / `expect` from vitest globals

```ts
import { describe, it, expect } from "vitest";
import { myFunction } from "@/lib/utils/my-module";

describe("myFunction", () => {
  it("does the thing", () => {
    expect(myFunction("input")).toBe("expected");
  });
});
```

### Adding a component test

1. Create `tests/components/MyComponent.test.tsx`
2. Avoid components that import `next/link`, `next/navigation`, or `next/image` directly — test those at E2E level
3. Use `render` from `@testing-library/react` and `screen` queries

### Adding an authenticated E2E test

1. Create a Supabase test project
2. Seed it with known test data using the demo setup flow
3. Add auth credentials to GitHub Actions secrets (never in code)
4. Add to `.github/workflows/ci-e2e.yml` (separate workflow to keep CI fast)

---

## 7. Testing Supabase / RLS Manually

RLS policies cannot be unit tested without a real Postgres instance. Manual verification:

1. Create a test Supabase project
2. Run all migrations: `supabase/migrations/0001_*.sql` through latest
3. Create 2 test users with different team roles
4. Verify access patterns using the QA checklist: `/docs/PRODUCT_QA_CHECKLIST.md`
5. Use the Supabase dashboard's "SQL Editor" to test policy queries directly

---

## 8. Testing Real AI Provider Manually

The mock AI provider handles CI and local development. To test real OpenAI:

1. Set `AI_PROVIDER=openai` and `OPENAI_API_KEY=sk-...` in `.env.local`
2. Create a demo workspace via `/demo/setup`
3. Navigate to the game and click "Generate Report"
4. Verify report sections render correctly
5. Check the `analysis_jobs` row for provider, status, and output

**Do not set a real API key in `.env.example`, CI env vars, or any committed file.**

---

## 9. Future E2E Plan

Phase 1 (Prompt 22): Authenticated E2E against a Supabase test project
- Login with test credentials
- Demo workspace creation
- Report generation (mock AI)
- Sharing (create link, open in incognito)

Phase 2 (Pilot period): Full regression suite
- Team creation
- Player CRUD
- Game CRUD
- Timestamp tagging
- Report verification and editing
- Export / print flow

---

## 10. Permission Layer Note

Permission helper functions in `lib/utils/permissions.ts` were created as part of this testing infrastructure. They are pure functions tested in `tests/unit/permissions.test.ts`. They are not yet wired into page components (which use local `STAFF_ROLES` / `MANAGER_ROLES` array constants). Future work: replace in-page constants with imports from `lib/utils/permissions.ts` for consistency.

---

*Last updated: Prompt 21 — Automated Test Suite and CI Foundation (2026-06-01)*
