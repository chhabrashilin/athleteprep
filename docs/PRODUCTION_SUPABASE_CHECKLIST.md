# GameIQ — Production Supabase Setup Checklist

> Complete this checklist before inviting any pilot coach to use the live deployment.
> Each section must be fully checked before moving to the next.

**Legend:** ✅ Done · ⬜ Not done · ⚠️ Needs attention

---

## 1. Project Setup

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Create Supabase project at supabase.com | ⬜ | Choose region close to pilot users |
| 1.2 | Set a strong database password and store it securely | ⬜ | Save in a password manager — not in a file |
| 1.3 | Copy Project URL → `NEXT_PUBLIC_SUPABASE_URL` | ⬜ | Settings → API |
| 1.4 | Copy anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⬜ | Safe for browser |
| 1.5 | Copy service_role key → `SUPABASE_SERVICE_ROLE_KEY` | ⬜ | **Server-side only. Mark as Sensitive in Vercel.** |
| 1.6 | Upgrade to Supabase Pro plan | ⬜ | Free tier pauses after 1 week inactivity — unacceptable for a live pilot |

---

## 2. Database Migrations

Run migrations in order in the Supabase SQL Editor (Dashboard → SQL Editor → New query).

| # | Migration File | Status | Notes |
|---|----------------|--------|-------|
| 2.1 | `supabase/migrations/0001_initial_schema.sql` | ⬜ | Full schema: 17 tables, 12 enums, RLS, auth trigger |
| 2.2 | `supabase/migrations/0002_team_creation_rpc.sql` | ⬜ | `create_team_with_owner` RPC |
| 2.3 | `supabase/migrations/0003_storage_policies.sql` | ⬜ | Storage bucket RLS policies |
| 2.4 | `supabase/migrations/0007_verification_editing_adjustments.sql` | ⬜ | Verification/editing schema adjustments |

**Verify all tables exist:**
```sql
select tablename from pg_tables
where schemaname = 'public'
order by tablename;
```
Expected tables (17):
`analysis_jobs`, `clips`, `coaching_insights`, `event_timestamps`, `exports`,
`game_reports`, `games`, `opponent_tendencies`, `player_reports`, `players`,
`practice_recommendations`, `profiles`, `share_links`, `team_members`, `teams`,
`verification_feedback`, `video_assets`

| # | Verification | Status |
|---|--------------|--------|
| 2.5 | All 17 tables present | ⬜ |
| 2.6 | All 12 enums present (check `pg_type`) | ⬜ |
| 2.7 | Auth trigger `on_auth_user_created` exists | ⬜ |
| 2.8 | `create_team_with_owner` RPC exists | ⬜ |
| 2.9 | `is_team_member` / `has_team_role` / `is_team_staff` helper functions exist | ⬜ |

**Check enums:**
```sql
select typname from pg_type where typtype = 'e' order by typname;
```

**Check trigger:**
```sql
select trigger_name from information_schema.triggers
where event_object_table = 'users'
and trigger_schema = 'auth';
```

---

## 3. Row Level Security

RLS must be enabled on every table. Never disable RLS to "fix" a permission issue.

| # | Check | Status |
|---|-------|--------|
| 3.1 | RLS enabled on all 17 tables | ⬜ |
| 3.2 | Non-team-members cannot read team data | ⬜ |
| 3.3 | Players/viewers cannot write team data | ⬜ |
| 3.4 | Coach/owner/analyst can write team data | ⬜ |
| 3.5 | Share links accessible by token (no auth required for public share) | ⬜ |
| 3.6 | `profiles` table is self-only access | ⬜ |
| 3.7 | `verification_feedback` is append-only (no UPDATE/DELETE policies) | ⬜ |

**Verify RLS is on:**
```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```
All `rowsecurity` values must be `true`.

---

## 4. Auth Configuration

In Supabase Dashboard → Authentication → Settings:

| # | Setting | Required Value | Status |
|---|---------|----------------|--------|
| 4.1 | Email/password auth enabled | Yes | ⬜ |
| 4.2 | Site URL | `https://yourdomain.com` (production domain) | ⬜ |
| 4.3 | Redirect URLs | `https://yourdomain.com/**` | ⬜ |
| 4.4 | Also add localhost to redirect URLs | `http://localhost:3000/**` (dev/testing) | ⬜ |
| 4.5 | Email confirmation | **Enabled** in production | ⬜ |
| 4.6 | JWT expiry | 3600s (default, fine for MVP) | ⬜ |

**Verify after deploy:**
- Sign up a test user → user appears in Authentication → Users ✓
- Email confirmation sent → user confirms → can sign in ✓
- Sign in → redirected to /dashboard (not a loop) ✓
- Sign out → redirected to / ✓

**If auth loops occur:**
- Check Site URL has no trailing slash
- Check redirect URLs include the exact production domain
- Check `NEXT_PUBLIC_SUPABASE_URL` in Vercel has no trailing slash

---

## 5. Storage Buckets

In Supabase Dashboard → Storage → New bucket:

| # | Bucket Name | Public | File Size Limit | Allowed MIME Types | Status |
|---|-------------|--------|-----------------|-------------------|--------|
| 5.1 | `game-videos` | **No (Private)** | 5120 MB | `video/mp4`, `video/quicktime`, `video/x-msvideo`, `video/webm` | ⬜ |
| 5.2 | `game-thumbnails` | **No (Private)** | 10 MB | `image/jpeg`, `image/png`, `image/webp` | ⬜ |
| 5.3 | `report-exports` | **No (Private)** | 50 MB | `application/pdf` | ⬜ |

**Critical:** All buckets must be **private**. Video access is served via server-generated signed URLs (1-hour TTL). Never make `game-videos` public.

**Alternative via SQL (if dashboard is unavailable):**
```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('game-videos',     'game-videos',     false, 5368709120, array['video/mp4','video/quicktime','video/x-msvideo','video/webm']),
  ('game-thumbnails', 'game-thumbnails', false, 10485760,   array['image/jpeg','image/png','image/webp']),
  ('report-exports',  'report-exports',  false, 52428800,   array['application/pdf'])
on conflict (id) do nothing;
```

---

## 6. Storage RLS Policies

Apply `supabase/migrations/0003_storage_policies.sql` after creating the buckets.

Verify manually in Supabase Dashboard → Storage → Policies:

| # | Policy | Status |
|---|--------|--------|
| 6.1 | Authenticated team staff can upload to `game-videos` | ⬜ |
| 6.2 | Authenticated team members can read from `game-videos` | ⬜ |
| 6.3 | No anonymous/unauthenticated access to any bucket | ⬜ |
| 6.4 | Shared report pages do NOT serve video URLs | ⬜ |

**Smoke test storage:**
1. Upload a small video file in the app → succeeds ✓
2. Signed URL plays the video → works ✓
3. Access the bucket directly (without signed URL) → 403 Forbidden ✓
4. Open a shared report link → no video player shown ✓

---

## 7. Admin Configuration

| # | Task | Status |
|---|------|--------|
| 7.1 | Set `ADMIN_EMAILS` in Vercel to your email(s) | ⬜ |
| 7.2 | Sign in with an admin email → /admin/analytics loads | ⬜ |
| 7.3 | Sign in with a non-admin email → /admin/analytics returns 403 | ⬜ |
| 7.4 | Admin links appear in /settings for admin user only | ⬜ |

---

## 8. Post-Deployment Verification

After the full deployment is live, run through the complete smoke test:

→ See [`/docs/PRODUCTION_SMOKE_TEST.md`](PRODUCTION_SMOKE_TEST.md) for the full 20-step checklist.

---

## 9. Ongoing Maintenance

| Task | Frequency | Notes |
|------|-----------|-------|
| Check Supabase project is not paused | Weekly | Pro plan prevents auto-pause |
| Review `product_events` table for coach activity | After each pilot session | Via /admin/analytics |
| Review `product_feedback` table for coach feedback | Weekly | Via /admin/feedback |
| Rotate API keys if exposed | Immediately | Rotate in Supabase dashboard + Vercel |
| Check OpenAI usage dashboard | Daily (when real AI enabled) | Verify spend cap is respected |
| Database backups | Automatic on Pro plan | Verify backup settings in Supabase |

---

*See also: [`DEPLOYMENT.md`](DEPLOYMENT.md) · [`STORAGE_SECURITY.md`](STORAGE_SECURITY.md) · [`PRODUCTION_SMOKE_TEST.md`](PRODUCTION_SMOKE_TEST.md)*  
*Last updated: Prompt 22 — Pilot Deployment and Production Environment Setup (June 2026)*
