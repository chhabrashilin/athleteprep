# GameIQ — Row Level Security Policies

> Describes the security model, helper functions, and per-table RLS policies for GameIQ. All policies are defined in `supabase/migrations/0001_initial_schema.sql`.

---

## 1. Security Model Overview

GameIQ uses Supabase's Row Level Security (RLS) to enforce data isolation at the database level. Every table has RLS enabled. No row in any table is accessible unless the current user passes an explicit policy check.

The security model is built on two axes:
- **Identity**: Who is the authenticated user? (determined by `auth.uid()`)
- **Membership**: What teams is that user a member of, and what role do they have?

---

## 2. Role Hierarchy

Roles are defined in the `team_role` Postgres enum and assigned per team in `team_members`.

| Role | Description | Typical User |
|------|-------------|-------------|
| `owner` | Full control over the team | Head coach or team admin |
| `coach` | Can manage games, reports, roster | Assistant coach |
| `analyst` | Can manage games, reports; no membership management | Video analyst |
| `player` | Limited access (future: own player reports) | Athlete on the team |
| `viewer` | Read-only via share links (future) | Parent, scout |

Staff roles for v1: `owner`, `coach`, `analyst` — can read/write all team data.
Manager roles for v1: `owner`, `coach` — can delete and manage team membership.

---

## 3. Helper Functions (SECURITY DEFINER)

These functions are defined as `SECURITY DEFINER` — they run with the function owner's privileges and bypass RLS when querying `team_members`. This is required to avoid infinite recursion when using these functions in RLS policies on `team_members` itself.

```sql
-- Returns true if the current user (auth.uid()) is any kind of member of the team.
public.is_team_member(p_team_id uuid) → boolean

-- Returns true if the current user has one of the specified roles on the team.
public.has_team_role(p_team_id uuid, p_roles team_role[]) → boolean

-- Shorthand: owner, coach, or analyst
public.is_team_staff(p_team_id uuid) → boolean

-- Shorthand: owner or coach only
public.is_team_manager(p_team_id uuid) → boolean
```

**Why SECURITY DEFINER?**

Without it, any RLS policy that queries `team_members` would trigger that table's own RLS check, which would query `team_members` again — infinite recursion. The SECURITY DEFINER wrapper bypasses this by executing as the function owner (postgres) with full table access.

**Security Note:** These functions only return boolean values. They do not expose any row data from `team_members`. The risk of privilege escalation is minimal, but these functions should not be modified to return arbitrary data.

---

## 4. Per-Table Policies

### `profiles`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Self only | `id = auth.uid()` |
| INSERT | Self only | `id = auth.uid()` |
| UPDATE | Self only | `id = auth.uid()` |

Users cannot read each other's profiles directly. Profile data (name, avatar) is accessed through team membership queries in the application layer.

---

### `teams`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Team members | `is_team_member(id)` |
| INSERT | Any authenticated user | `auth.uid() is not null` |
| UPDATE | Owner or coach | `is_team_manager(id)` |
| DELETE | Owner only | `has_team_role(id, ['owner'])` |

Any authenticated user can create a team. When a team is created, the application layer creates a corresponding `team_members` row with `role = 'owner'`.

---

### `team_members`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Self OR team member | `user_id = auth.uid() OR is_team_member(team_id)` |
| INSERT | Owner or coach | `is_team_manager(team_id)` |
| UPDATE | Owner or coach | `is_team_manager(team_id)` |
| DELETE | Owner or coach | `is_team_manager(team_id)` |

The SELECT policy uses two conditions joined with OR:
1. `user_id = auth.uid()` — lets users see their own memberships without calling `is_team_member()`.
2. `is_team_member(team_id)` — lets staff see all members of teams they belong to. Safe because `is_team_member` is SECURITY DEFINER and bypasses `team_members` RLS internally.

---

### Team-Scoped Tables (players, games, video_assets, event_timestamps, clips, analysis_jobs, game_reports, coaching_insights, player_reports, practice_recommendations, opponent_tendencies, exports)

These tables follow the same pattern:

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Any team member | `is_team_member(team_id)` |
| INSERT | Staff (owner, coach, analyst) | `is_team_staff(team_id)` |
| UPDATE | Staff | `is_team_staff(team_id)` |
| DELETE | Manager (owner, coach) | `is_team_manager(team_id)` |

---

### `verification_feedback`

Append-only. No UPDATE or DELETE policies exist.

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Any team member | `is_team_member(team_id)` |
| INSERT | Staff only | `is_team_staff(team_id)` |

Verification history is immutable. If a coach changes their mind, they create a new feedback record — the old one remains.

---

### `share_links`

Two SELECT policies exist:

| Policy | Who | Condition |
|--------|-----|-----------|
| `share_links_select_member` | Team members | `is_team_member(team_id)` |
| `share_links_select_by_token` | Anyone (unauthenticated) | `revoked_at is null AND (expires_at is null OR expires_at > now())` |

The second policy allows the public shared report viewer to read the share link without authentication. The application layer validates the token and uses it to fetch the report.

**Note:** The public policy does not expose all share_link data. The application must only fetch the minimum fields needed (game_report_id, visibility, allowed_player_id) and verify the token matches the request.

---

## 5. V1 Limitations

### Players cannot access player-specific reports

In v1, the `player` role has the same SELECT access as staff (any member can read all data). Player-specific report sharing will be implemented in Phase 6 via share links with `visibility = 'player_specific'` and `allowed_player_id`.

### Viewer role is not yet enforced differently

`viewer` role currently gets the same read access as any other member. Future phases may restrict viewers to only seeing shareable summaries, not full reports.

### No cross-team data protection beyond RLS

If a user is a member of multiple teams, they can see data for all their teams. There is no additional isolation between teams — RLS ensures team A's data is not visible to team B's members, but a user who belongs to both can see both. This is the intended behavior.

---

## 6. Future: Player-Specific Sharing

The schema supports a future model where:
1. Coach creates a share link with `visibility = 'player_specific'` and `allowed_player_id = <playerId>`.
2. The player receives the link.
3. The share viewer uses the token to look up the report and serve only the relevant player report section.
4. RLS on `player_reports` will be updated to also allow players to read their own reports when linked via `players.user_id`.

---

## 7. Testing RLS Policies

To test policies in the Supabase SQL editor:

```sql
-- Impersonate a user
set role authenticated;
set request.jwt.claims = '{"sub": "USER_UUID_HERE", "role": "authenticated"}';

-- Now test queries — they should be RLS-filtered
select * from teams;
select * from games;
```

Reset after testing:
```sql
reset role;
```

---

## 8. Adding New Tables

When adding a new table, always:
1. Enable RLS: `alter table public.new_table enable row level security;`
2. Add at minimum a SELECT policy using `is_team_member(team_id)`.
3. Add INSERT/UPDATE policies using `is_team_staff(team_id)`.
4. Add DELETE policy using `is_team_manager(team_id)`.
5. Document the table's access rules in this file.

Never create a table without RLS. Never disable RLS for convenience.
