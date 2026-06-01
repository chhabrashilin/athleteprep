# GameIQ — Team Workspaces

> This document describes the team workspace model, creation flow, membership model, roles, route structure, data access functions, and known limitations as of Prompt 4.

---

## 1. Concept

A **Team Workspace** is the core organizational unit in GameIQ. Everything in the product — roster, games, video, timestamps, AI reports — belongs to a team. A user can belong to multiple teams with different roles on each.

The team workspace is intentionally minimal in Prompt 4. It provides the foundation that roster management (Prompt 5), game creation (Prompt 6), and AI analysis (Prompt 7+) are built upon.

---

## 2. Team Creation Flow

**Route:** `/teams/new`

**Component:** `components/teams/CreateTeamForm.tsx` (Client Component)

**Server Action:** `app/teams/new/actions.ts` → `createTeamAction`

**Data access:** `lib/db/teams.ts` → `createTeamForCurrentUser(input)`

**RPC:** `create_team_with_owner` (defined in `supabase/migrations/0002_team_creation_rpc.sql`)

### Why an RPC?

The `team_members` INSERT policy (`team_members_insert_manager`) requires the user to already be an owner or coach of the team. When creating a brand-new team, no membership exists yet — causing an RLS chicken-and-egg deadlock.

The solution is a `SECURITY DEFINER` Postgres function that runs as the function owner (postgres), bypassing the policy. It atomically:

1. Inserts the team row (passes `teams_insert_authenticated`).
2. Inserts the `team_members` row with `role = 'owner'` (bypasses `team_members_insert_manager`).
3. Updates `profiles.default_team_id` if the user doesn't have one set.

The function validates that `auth.uid()` is not null, so unauthenticated callers are rejected even without RLS.

### Slug generation

Slugs are generated from the team name using `lib/utils/slug.ts`:

- lowercase
- trim whitespace
- normalize diacritics
- remove non-alphanumeric characters (except hyphens)
- collapse consecutive hyphens

If a slug uniqueness constraint fires (duplicate slug), `createTeamForCurrentUser` retries with `generateSlugWithSuffix`, which appends 4 random alphanumeric characters (e.g. `wisconsin-cricket-club-7f3a`).

Slugs are stored but **not yet used in routes**. Routes use UUIDs (`/teams/[teamId]`).

### Form fields

| Field | Required | Validation |
|-------|----------|-----------|
| Team name | Yes | 2–80 characters |
| Sport | Yes | Must match `SportType` enum |
| Organization name | No | Max 120 characters |
| Level | No | Select from predefined list; max 60 characters |
| Location | No | Max 120 characters |
| Description | No | Max 500 characters |

### Post-creation redirect

On success, the server action calls `redirect(\`/teams/${teamId}\`)`. This is a hard server-side redirect — the client component never sees the team ID directly.

---

## 3. Team Membership Model

Each user–team relationship is stored in `team_members`:

```
team_members
  id         uuid PK
  team_id    uuid → teams.id
  user_id    uuid → profiles.id
  role       team_role enum
  joined_at  timestamptz
  created_at timestamptz
  updated_at timestamptz
```

A unique partial index (`team_members_team_user_unique`) prevents duplicate memberships for the same (team, user) pair.

---

## 4. Role Model

| Role | Description | Prompt 4 access |
|------|-------------|----------------|
| `owner` | Full team control | View team workspace |
| `coach` | Manage games and reports | View team workspace |
| `analyst` | Contribute to analysis | View team workspace |
| `player` | Limited access (future) | View team workspace |
| `viewer` | Read-only via share links (future) | View team workspace |

In Prompt 4, all roles have the same read access. Role-specific restrictions are enforced in later prompts when shared reports and player-specific views are built.

---

## 5. Route Structure

| Route | Status | Description |
|-------|--------|-------------|
| `/dashboard` | Live | Team-aware home; shows teams, setup checklist |
| `/teams` | Live | Lists all user teams with TeamCard components |
| `/teams/new` | Live | Team creation form wired to Supabase |
| `/teams/[teamId]` | Live | Team workspace overview with membership check |
| `/teams/[teamId]/players` | Placeholder | Roster management (Prompt 5) |
| `/teams/[teamId]/games` | Placeholder | Game listing (Prompt 6) |
| `/teams/[teamId]/games/new` | Placeholder | Game creation (Prompt 6) |
| `/teams/[teamId]/games/[gameId]` | Placeholder | Game detail (Prompt 6) |
| `/teams/[teamId]/games/[gameId]/report` | Placeholder | AI report (Prompt 7) |

### Access denied handling

`/teams/[teamId]` calls `getTeamByIdForCurrentUser` and `getCurrentUserTeamMembership`. If either returns null (no team found, or user is not a member), `notFound()` is called. This returns the same 404 response for both cases, preventing team existence leakage.

---

## 6. Data Access Functions (`lib/db/teams.ts`)

| Function | Returns | Description |
|----------|---------|-------------|
| `getTeamsForCurrentUser()` | `Team[]` | All teams for current user |
| `getTeamsWithMembershipForCurrentUser()` | `TeamWithMembership[]` | Teams + role for each |
| `getTeamByIdForCurrentUser(teamId)` | `Team \| null` | Single team, RLS-enforced |
| `getCurrentUserTeamMembership(teamId)` | `TeamMember \| null` | User's membership on a team |
| `createTeamForCurrentUser(input)` | `string` (teamId) | Creates team via RPC; throws on failure |

All functions use `createServerSupabaseClient()` — server-side only. They return `null` or `[]` when Supabase is not configured rather than throwing, so the UI renders gracefully without env vars.

`createTeamForCurrentUser` is the exception: it throws descriptive errors because team creation is a user-triggered mutation that must surface errors.

---

## 7. Team-Aware Navigation

The `AppShell` component accepts an optional `teamContext: { teamId, teamName }` prop.

When `teamContext` is provided:
- The sidebar shows a team name label above team-scoped nav links.
- Nav links point to `/teams/[teamId]`, `/teams/[teamId]/players`, `/teams/[teamId]/games`.
- A "New game" shortcut is shown in the sidebar (disabled until Prompt 6).
- The header shows the team name.

When `teamContext` is absent:
- The sidebar shows general nav: Dashboard, Teams, Settings.

The sidebar is a Client Component using `usePathname()` for active link detection. `teamContext` is passed from Server Components (team pages), maintaining the server/client boundary cleanly.

---

## 8. UI Components

| Component | Location | Description |
|-----------|----------|-------------|
| `TeamCard` | `components/teams/TeamCard.tsx` | Team card for listings; shows name, sport badge, role, metadata |
| `CreateTeamForm` | `components/teams/CreateTeamForm.tsx` | Client form with `useActionState` + server action |
| `TeamEmptyState` | `components/teams/TeamEmptyState.tsx` | Premium empty state for no-teams scenario |
| `TeamOverviewHeader` | `components/teams/TeamOverviewHeader.tsx` | Team identity block on workspace page |
| `SetupChecklist` | `components/dashboard/SetupChecklist.tsx` | Step-by-step product checklist on dashboard |
| `TeamSummaryGrid` | `components/dashboard/TeamSummaryGrid.tsx` | Grid of TeamCards on dashboard |

---

## 9. Current Limitations

- **No team invitations.** A user can only join a team by being the creator (owner). Invitations come in a later prompt.
- **No team settings editing.** Team name, sport, description cannot be changed yet. A settings page is planned.
- **No team switching in sidebar.** There is a placeholder for a team switcher but no dropdown or switcher UI yet.
- **Slugs not used in routes.** Routes use UUIDs for now. Slug-based routing (`/teams/my-team`) may be added later.
- **Roster/game counts are static.** The workspace page shows "0 players" and "0 games" as static text. Real counts come in Prompts 5 and 6.

---

## 10. Future: Invitations and Team Switching

When team invitations are built:
- An `invited_email` column exists on `team_members` for pending invitations.
- The invitation flow will create a `team_members` row with `user_id = null` and `invited_email` set.
- When the invited user accepts, the row is updated to link their `user_id`.

When team switching is built:
- The sidebar will show a team picker dropdown above the team nav.
- `profiles.default_team_id` is already stored and will be used to remember the last active team.
- The dropdown will list all teams the user belongs to and allow switching without going back to `/teams`.
