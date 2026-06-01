# GameIQ — Build Rules

> Every implementation prompt must comply with these rules. They exist to keep the codebase coherent, maintainable, and production-grade across all incremental builds.

---

## 1. No-Break Rules

After every prompt, the following must remain true:

- `npm run build` (or equivalent) completes without errors.
- All existing routes still work.
- TypeScript type checking passes with zero `any` shortcuts unless explicitly justified.
- The database schema remains coherent — no orphaned foreign keys, no missing tables for existing UI.
- No major feature is silently removed without instruction.
- No major concept is renamed without explicit instruction.
- The UI remains polished — no layout regressions, no orphaned components.

These are non-negotiable. If a prompt would break any of these, surface the conflict and resolve it before proceeding.

---

## 2. Engineering Standards

### TypeScript

- Use TypeScript everywhere. No JavaScript files in `src/`.
- Never use `any` unless wrapping a truly untyped third-party boundary, and comment why.
- All API responses must have explicit types. Define them in `src/types/`.
- Prefer `interface` for object shapes, `type` for unions and aliases.
- Export types from a barrel file per domain (e.g., `src/types/game.ts`, `src/types/report.ts`).
- Use `zod` or equivalent for runtime validation of external data (API responses, form submissions).

### Functions and Components

- Pure functions over classes unless using a class-based pattern for services.
- React components should be small and focused. If a component exceeds ~150 lines, consider splitting it.
- Co-locate component logic unless it is genuinely reusable.
- Avoid default exports on named utilities. Use named exports.
- Use default exports only for Next.js pages/layouts.

### State Management

- Server state via Supabase queries and Next.js data fetching (server components or SWR/React Query for client).
- Local UI state via `useState` / `useReducer`.
- Avoid global client state managers (Redux, Zustand) unless genuinely necessary for cross-route state. Justify if introduced.

### Error Handling

- Every async function that can fail must handle its error path explicitly.
- Surface errors to the user in a readable, actionable way.
- Never silently swallow errors. Use `console.error` at minimum during development; structured logging in production.
- API routes must return consistent error shapes: `{ error: string, code?: string }`.

---

## 3. File and Folder Organization

```
/src
  /app              # Next.js App Router pages and layouts
    /api            # API route handlers
    /(auth)         # Auth group routes
    /(dashboard)    # Authenticated app routes
  /components
    /ui             # Primitive UI components (buttons, cards, badges, inputs)
    /layout         # Layout components (nav, sidebar, shell)
    /[feature]      # Feature-specific components, co-located
  /lib
    /supabase       # Supabase client setup and helpers
    /ai             # AI service layer (provider-agnostic)
    /video          # Video utilities
    /utils          # Shared utilities
  /types            # Shared TypeScript types, one file per domain
  /hooks            # Shared custom React hooks
  /constants        # Product-wide constants
/docs               # Project documentation (never delete)
/public             # Static assets
```

- Do not create arbitrary top-level folders without documenting the reason.
- Each feature should be cohesive. Avoid scattering a feature's files across many directories.
- Shared primitives go in `/components/ui`. Feature-specific components go in `/components/[feature]`.

---

## 4. Naming Conventions

### Files

- React components: `PascalCase.tsx` (e.g., `GameReportCard.tsx`)
- Utilities, hooks, services: `camelCase.ts` (e.g., `generateReport.ts`, `useGameData.ts`)
- Route files: Next.js conventions (`page.tsx`, `layout.tsx`, `route.ts`)
- Type files: `camelCase.ts` matching domain (e.g., `game.ts`, `report.ts`)
- Constants files: `camelCase.ts` or `SCREAMING_SNAKE_CASE.ts` — pick one and be consistent

### Variables and Functions

- Variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE` for module-level constants
- Components: `PascalCase`
- Types and interfaces: `PascalCase`
- Database column names: `snake_case` (Postgres convention)
- API response fields: `camelCase` (JavaScript convention) — transform at the data layer

### Domain Entities

Use the canonical entity names from `PROJECT_CONSTITUTION.md` Section 11 everywhere. Never substitute vague names:

| Good | Bad |
|------|-----|
| `coachingInsight` | `aiItem`, `outputRecord`, `thing` |
| `eventTimestamp` | `tag`, `marker`, `data` |
| `analysisJob` | `job`, `task`, `aiRun` |
| `playerReport` | `playerData`, `feedback`, `stuff` |

---

## 5. Database Rules

- All tables use `snake_case` names.
- Every table has `id uuid primary key default gen_random_uuid()`.
- Every table has `created_at timestamptz default now()` and `updated_at timestamptz default now()`.
- Use Row Level Security (RLS) on every table from the start. Never disable RLS for convenience.
- Foreign keys must have explicit `references` constraints.
- Use database-level constraints for required fields (`not null`, `check`).
- No business logic in raw SQL unless it is a trigger or constraint — keep logic in the application layer.
- Migrations must be sequential and named clearly: `001_create_users.sql`, `002_create_teams.sql`.
- Never rename a column without a migration. Never drop a column without confirming it is unused.

---

## 6. API and Server Action Rules

- Every API route must authenticate the user before handling any data.
- Never trust client-sent user IDs. Derive the user from the session server-side.
- Validate all incoming payloads before processing.
- Return HTTP status codes correctly: 200 for success, 201 for created, 400 for bad input, 401 for unauthenticated, 403 for unauthorized, 404 for not found, 500 for server errors.
- Wrap handler logic in try/catch. Never let unhandled exceptions return 500 with stack traces in production.

---

## 7. AI Service Layer Rules

- All AI calls must go through a provider-agnostic service layer in `/lib/ai/`.
- Never call OpenAI, Anthropic, or other providers directly from components or pages.
- The service layer must support swapping providers without changing call sites.
- In development, the service layer must support a `MOCK_AI=true` environment variable that returns hardcoded realistic mock data without making real API calls.
- All prompts must be versioned and stored as constants, not inline strings scattered through code.
- AI output must always be parsed and validated before being stored or displayed.
- See `/docs/AI_OUTPUT_PRINCIPLES.md` for output content rules.

---

## 8. UI and Component Rules

- All UI must use the design system in `/components/ui`.
- Do not use raw HTML `<button>`, `<input>`, or `<select>` elements outside of the UI primitives. Always use the wrapped component.
- All interactive elements must have `disabled` and loading states.
- Every data-fetching component must handle: loading state, empty state, error state.
- Loading states should explain what is happening (not just a spinner).
- Empty states should guide the user toward the next action.
- Error states should help the user recover or report the issue.
- Never use inline styles. Use Tailwind utility classes exclusively.
- Never use `!important` unless overriding a third-party library with no other option.
- Colors, spacing, typography must use Tailwind's design tokens, not arbitrary values.

---

## 9. Placeholder and Mock Rules

- Placeholder features are allowed during phased development, but must be clearly marked.
- Acceptable placeholder patterns:
  - A button that is `disabled` with tooltip "Coming in Phase X"
  - A section with a clear "Coming soon" card
  - Mock data behind `DEMO_MODE=true` environment variable
- Not acceptable:
  - A button that appears functional but silently does nothing
  - Fake data shown as if it were real without a clear indicator
  - Hardcoded production data that does not match the database
- If a route or feature is not yet built, the UI must show a useful placeholder state, not a blank page or 404.

---

## 10. Security Rules

- Never expose API keys or secrets in client-side code.
- Never store secrets in environment variables that are prefixed `NEXT_PUBLIC_` unless they are genuinely public.
- All Supabase queries must be RLS-protected. Do not use the service key on the client.
- Validate file uploads: check MIME type, file size limits, allowed extensions.
- Never pass user-controlled input directly into SQL strings. Use parameterized queries (Supabase client handles this, but verify for edge cases).
- Sanitize any user-generated content before rendering it as HTML.

---

## 11. Comments and Documentation

- Default to writing no comments.
- Only add a comment when the WHY is non-obvious: a hidden constraint, a subtle invariant, a workaround for a specific bug, or behavior that would surprise a reader.
- Never write comments explaining WHAT the code does — well-named identifiers do that.
- Never write multi-paragraph docstrings or multi-line comment blocks.
- Do not write task references in code comments (e.g., "added for the auth flow"). That belongs in the commit message.

---

## 12. Testing Expectations

- Minimum acceptable standard: the build passes and the main user flows work end-to-end.
- Unit tests are encouraged for AI output parsing logic, utility functions, and data transformations.
- Integration tests are preferred over mocked unit tests for database interactions.
- Do not mock the database in integration tests. Use a test database or Supabase local dev.
- E2E tests (Playwright or Cypress) are out of scope for early phases but the architecture should not block them.
- A test file must not be committed if it is permanently `.skip`-ped with no intent to fix.

---

## 13. Dependency Rules

- Do not add a dependency to solve a problem that can be solved cleanly in 20 lines of application code.
- Prefer packages with strong TypeScript support and active maintenance.
- Any new dependency must be justifiable: what problem does it solve, and why can't the existing stack handle it?
- Do not upgrade major dependency versions speculatively. Upgrades are intentional.
- Audit for security issues before adding any npm package that handles auth, crypto, or file uploads.

---

## 14. Git and Change Management

- Commit messages should be clear and scoped: `feat(game): add metadata form`, `fix(report): correct confidence badge rendering`.
- Never force push to main.
- Never commit secrets, `.env` files, or database credentials.
- Never commit `node_modules/`, build output, or `.next/`.
- The `.gitignore` must cover: `.env*`, `node_modules/`, `.next/`, `out/`, `*.local`.
