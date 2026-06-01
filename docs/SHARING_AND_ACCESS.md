# Sharing and Role-Aware Report Access

GameIQ allows coaches to share reports via controlled share links, giving different levels of access to different audiences — staff, specific players, or the public — without exposing sensitive team data.

---

## Purpose

Reports contain sensitive data: player evaluations, opponent strategy, coach notes, and AI-generated assessments. Sharing must be controlled and explicit.

Coaches create share links manually. Each link has a visibility mode that determines what the recipient can see.

---

## Visibility Modes

| Mode | Who can view | Content shown |
|---|---|---|
| `private_link` | Anyone with the link | Full report (sanitized — no edit controls, no raw AI output, no video) |
| `staff_only` | Authenticated team members only | Full report (same as private_link) |
| `player_specific` | Anyone with the link | One player's report + their relevant practice recs |
| `public_summary` | Anyone with the link | Executive summary + insight summaries + practice titles only |

---

## Token Strategy

Share tokens are generated with `crypto.randomBytes(18).toString("base64url")`, prefixed with `giq_`.

- **Format**: `giq_<24 base64url chars>` (28 chars total)
- **Entropy**: 144 bits — not guessable
- **URL-safe**: base64url encoding, no special chars
- **No sequential IDs**: tokens are random, not derived from DB IDs

Token generation lives in `lib/utils/tokens.ts`.

---

## Shared Route Behavior

### Route

```
/share/reports/[token]
```

This route:
1. Looks up the share link by token (service role, bypasses RLS).
2. Checks revocation and expiration.
3. For `staff_only`: checks authenticated team membership.
4. Fetches full report data (service role).
5. Sanitizes via `buildSharedReportViewModel()`.
6. Increments view count (fire-and-forget).
7. Renders the visibility-appropriate read-only view.

The route has a separate clean layout with no sidebar, no team nav, and GameIQ branding only.

### Error states

| Condition | Message shown |
|---|---|
| Token not found | "Link not found" |
| Revoked | "Link revoked" |
| Expired | "Link expired" |
| `staff_only` + not authenticated | "Access restricted — sign in" |
| `staff_only` + not team member | "Access restricted — not a team member" |
| Report data unavailable | "Report not found" |

---

## Sanitization Rules

Sanitization runs server-side in `lib/sharing/sanitize-report.ts` before data reaches the browser. The UI cannot show what the data layer has excluded.

### `private_link` and `staff_only`
- Include: all coaching insights, player reports, practice recs, opponent tendencies, assumptions, limitations
- Exclude: video signed URLs, raw AI output, edit controls, verification history, internal metadata, original AI content

### `public_summary`
- Include: executive summary, insight titles + summaries only, practice rec titles + durations
- Exclude: player reports, opponent tendencies, insight `whyItMatters` / `recommendedAction`, coaching points, player IDs, assumptions

### `player_specific`
- Include: the selected player's report only, their tagged practice recs with coaching points, limitations
- Exclude: other player reports, team insights, opponent tendencies, assumptions

---

## Permissions

| Role | Can create share links | Can revoke share links | Can view internal report |
|---|---|---|---|
| owner | ✅ | ✅ | ✅ |
| coach | ✅ | ✅ | ✅ |
| analyst | ✅ | ✅ | ✅ |
| player | ❌ | ❌ | ✅ (own data only, per Prompt 12) |
| viewer | ❌ | ❌ | ✅ |

Server actions enforce this check independently of the UI.

---

## Expiration and Revocation

### Expiration
- Optional date set at creation time.
- If `expires_at` is in the past, the shared route shows "Link expired."
- No report content is shown.

### Revocation
- Staff can revoke any active link.
- Revocation sets `revoked_at` to the current timestamp.
- Revoked links show "Link revoked" immediately.
- Revocation is confirmation-protected in the UI.

### Status display in share modal
- `Active` — green
- `Expired` — muted/grey
- `Revoked` — red

---

## View Tracking

When a valid shared report is viewed:
1. `view_count` is incremented by 1.
2. `last_viewed_at` is set to the current timestamp.

Tracking is fire-and-forget. If it fails, the view continues rendering normally. It never blocks the page load.

Implementation uses the service role client to update the `share_links` table.

---

## Video Sharing

Video is **not shared** in v1.

Even for `private_link` and `staff_only`, signed video URLs are never generated for shared routes. `canShowVideo` is always `false` in the `SharedReportViewModel`.

Future releases may add optional video sharing with explicit coach approval.

---

## Service Role Usage

The shared report route uses `createServiceSupabaseClient()` to:
1. Look up the share link by token (no auth required).
2. Fetch report data from the database.

The service role bypasses RLS. To keep this safe:
- The service client is only created in server-side code (page.tsx, server actions).
- It is never passed to the browser.
- All data is sanitized server-side before rendering.
- The `SUPABASE_SERVICE_ROLE_KEY` env var is server-only (no `NEXT_PUBLIC_` prefix).

If `SUPABASE_SERVICE_ROLE_KEY` is not configured, the shared route returns a "Service unavailable" error.

---

## Current Limitations

- Video sharing is not supported.
- Email delivery of share links is not implemented.
- No granular per-section sharing (e.g., "share only insights, not player reports").
- Player-specific view requires the player to be tagged in `player_reports` — if a player report doesn't exist, the shared view will show no player content.
- View count is not deduplicated (multiple page loads increment it).

---

## Future Improvements

- Email share links directly to players or staff.
- Per-section visibility controls.
- Password-protected links.
- Analytics dashboard per link.
- Allow video sharing for private_link with explicit coach opt-in.
- Rate limiting on token lookup to prevent brute force.
- Webhook notification when a link is first viewed.
