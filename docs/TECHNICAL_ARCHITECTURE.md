# GameIQ — Technical Architecture

> This document is the authoritative reference for the technical stack, architecture decisions, and system design for the GameIQ MVP.

---

## 1. Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js App Router | 16.x |
| Language | TypeScript | 5.x (strict mode) |
| UI Library | React | 19.x |
| Styling | Tailwind CSS | 4.x (CSS-first config) |
| Font | Geist Sans / Geist Mono | Google Fonts |
| Auth | Supabase Auth | Phase 1 |
| Database | Supabase Postgres (+ RLS) | Phase 2 |
| File Storage | Supabase Storage | Phase 3 |
| AI Layer | Provider-agnostic (Mock → OpenAI/Anthropic) | Phase 4–5 |
| Icons | Lucide React | Current |
| Class utility | clsx + tailwind-merge | Current |
| Deployment | Vercel (target) | Phase 7 |

---

## 2. Frontend Architecture

### App Router

All routes use the Next.js App Router (`app/` directory). No Pages Router.

- **Server Components** (default): Data fetching, layout wrappers, static content.
- **Client Components** (`"use client"`): Interactive UI — forms, toggles, video player, real-time state.

Key convention in Next.js 16: `params` in dynamic routes is a `Promise`. All dynamic page components must `await params`:
```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
}
```

### Component Organization

```
components/
  ui/          — Primitive, reusable design system components
  layout/      — App shell, sidebar, header, page header
  marketing/   — Landing page sections
  dashboard/   — Dashboard-specific cards and widgets
  [feature]/   — Feature-specific components (co-located with the feature they serve)
```

### Design System

Tailwind CSS v4 uses CSS-first configuration via `@theme` in `globals.css`. No `tailwind.config.ts` is required for color definitions — all standard Tailwind color utilities are available by default.

Custom theme tokens are defined in `app/globals.css`:
```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
}
```

Core palette:
- Backgrounds: `slate-950` (page), `slate-900` (card/surface), `slate-800` (elevated)
- Text: `slate-50` (primary), `slate-400` (secondary), `slate-600` (muted)
- Accent/Brand: `sky-500` / `sky-400`
- Success: `emerald-500`
- Warning: `amber-500`
- Danger: `red-500`

---

## 3. Backend and API Architecture

### API Approach

In MVP phases, backend logic is handled via:
- **Next.js Server Actions** — For form submissions and user-triggered mutations (preferred). Team creation uses a server action (`app/teams/new/actions.ts`) with `useActionState` on the client side.
- **Next.js Route Handlers** (`app/api/`) — For REST-style endpoints required by external services or more complex workflows (e.g., analysis job status polling).
- **Supabase RPC (SECURITY DEFINER functions)** — For operations that require bypassing RLS in a controlled, atomic way. The `create_team_with_owner` function (`supabase/migrations/0002_team_creation_rpc.sql`) is the canonical example: it atomically creates a team and its owner membership without exposing the service role key to the browser.

No separate backend server in v1. The full stack runs within the Next.js application.

### Future Scalability

The architecture is designed to extract a dedicated backend (Node.js service or Python for ML/CV) in the future:
- AI service layer is already provider-agnostic and isolated in `lib/ai/`.
- Video processing is isolated in `lib/video/`.
- Database interactions will be concentrated in `lib/supabase/` and dedicated server-side service files.

---

## 4. Supabase Architecture

### Services Used

| Service | Purpose |
|---------|---------|
| Supabase Auth | User sign-up, sign-in, session management |
| Supabase Postgres | All relational data |
| Supabase Storage | Video file storage, report exports |
| Supabase Realtime | Future: analysis job status streaming |
| Row Level Security | Authorization on every table |

### Client Setup

```
lib/supabase/
  client.ts   — Browser client (singleton, safe for client components)
  server.ts   — Server client (for server actions and route handlers)
  types.ts    — Generated database type definitions (updated after schema work)
```

The browser client checks for missing env vars and warns in development rather than crashing. The server client throws if env vars are missing — this is intentional, since server-side calls always require a valid connection.

### RLS Policy Approach

Every table will have RLS enabled from creation. Policies will follow this pattern:

```sql
-- Users can only access data within teams they are members of
create policy "team_member_read" on games
  for select using (
    team_id in (
      select team_id from team_members where user_id = auth.uid()
    )
  );
```

No table will ever disable RLS for convenience. If a service-role operation is required, it will use the server-side client with the service key, never expose the service key to the browser.

---

## 5. AI Service Architecture

### Provider-Agnostic Design

All AI calls go through the service layer in `lib/ai/`:

```
lib/ai/
  types.ts      — Input/output type definitions for AI operations
  providers.ts  — Router that dispatches to the active provider
  mock-ai.ts    — Mock implementation (returns realistic structured data)
```

The active provider is selected via the `AI_PROVIDER` environment variable. In development, `AI_PROVIDER=mock` returns deterministic mock data without incurring API costs.

### Switching Providers

To add a real AI provider:
1. Add a new case in `lib/ai/providers.ts`.
2. Implement the provider in a new file: `lib/ai/openai.ts`, `lib/ai/anthropic.ts`, etc.
3. Match the `GenerateReportInput` and `GenerateReportResult` interfaces.
4. Set `AI_PROVIDER=openai` (or chosen provider) in environment.

The call sites in the product never change — only `providers.ts` and the provider implementation files change.

### AI Output Contract

All real AI outputs must be validated against the schema defined in `types/ai.ts` before storage or display. Use `zod` for runtime validation (to be added in Phase 5 when real AI is connected).

---

## 6. Video Processing Architecture

### Current State (Phases 1–3)

- Video files are uploaded to Supabase Storage.
- Metadata (filename, size, MIME type) is stored in the `video_assets` table.
- The video is served via Supabase Storage public URL for in-browser playback.

### Future State (Phase 7+)

- Post-upload, a server-side job will extract video metadata (duration, resolution, frame rate) using FFmpeg.
- Thumbnail generation at regular intervals.
- Future: automated event detection via a computer vision service (separate microservice, not in Next.js).

Types for video are defined in `lib/video/types.ts` to scaffold the future integration.

---

## 7. Type System

### File Organization

```
types/
  core.ts       — Shared primitives (ID, timestamps, confidence, verification status)
  sports.ts     — Sport-specific enums and metadata types
  ai.ts         — AI input/output types (report drafts, insights, evidence)
  database.ts   — Application-level database entity interfaces
```

These types are for application use. The Supabase-generated database types (from `supabase gen types`) will live in `lib/supabase/types.ts` and be updated after each schema migration.

### Strict Mode

TypeScript strict mode is enabled. No `any` types are allowed without explicit justification and a comment explaining why. All API responses have explicit types.

---

## 8. Path Aliases

The `@/*` alias maps to the project root:

```json
"paths": { "@/*": ["./*"] }
```

Usage:
- `@/components/ui/Button` → `./components/ui/Button.tsx`
- `@/lib/ai/providers` → `./lib/ai/providers.ts`
- `@/types/core` → `./types/core.ts`

---

## 9. Environment Variables

See `/docs/ENVIRONMENT.md` for the full variable reference.

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

Optional for early development (app works without them in mock mode):
- AI provider keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.)
- `AI_PROVIDER` (defaults to `mock`)

---

## 10. Future Scalability Considerations

| Concern | Current Approach | Future Path |
|---------|-----------------|-------------|
| CV / event detection | Manual timestamps | Computer vision microservice |
| Video processing | Supabase Storage direct | FFmpeg job queue (BullMQ or similar) |
| Real-time AI status | Polling | Supabase Realtime subscription |
| Multi-sport modules | Single AI prompt | Sport-specific prompt packs |
| Background AI jobs | Synchronous request | Async job queue (Phase 5+) |
| Scale beyond Supabase | N/A | Postgres remains; add read replicas |
| Multi-tenancy | Team-scoped RLS | Already scoped; add org layer later |
