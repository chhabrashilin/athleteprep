# GameIQ — Deployment Guide

Recommended deployment: **Vercel** (Next.js app) + **Supabase** (database, auth, storage).

---

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) account (free tier works for development)
- A [Vercel](https://vercel.com) account (free tier works for initial deploy)
- Git repository (GitHub, GitLab, or Bitbucket)

---

## Step 1 — Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Choose a name, database password, and region close to your users.
3. Wait for the project to provision (~1 minute).
4. From **Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — server-side only)

---

## Step 2 — Apply Database Migrations

Run all migrations in order in the **Supabase SQL Editor** (Dashboard → SQL Editor → New query):

1. `supabase/migrations/0001_initial_schema.sql` — Full schema: 17 tables, 12 enums, RLS policies, helper functions, auth trigger.
2. `supabase/migrations/0002_team_creation_rpc.sql` — Atomic team + owner creation RPC (`create_team_with_owner`).
3. `supabase/migrations/0003_storage_policies.sql` — Storage bucket RLS policies.
4. `supabase/migrations/0007_verification_editing_adjustments.sql` — Verification/editing schema adjustments.
5. `supabase/migrations/0009_feedback_tables.sql` — `access_requests` and `product_feedback` tables with RLS.
6. `supabase/migrations/0010_product_events.sql` — `product_events` table for founder analytics.
7. `supabase/migrations/0011_support_requests.sql` — `support_requests` table for pilot coach support.

Run them **in order**. If one fails, fix it before proceeding.

**Verify:**
```sql
select tablename from pg_tables where schemaname = 'public' order by tablename;
```
You should see: `analysis_jobs`, `clips`, `coaching_insights`, `event_timestamps`, `exports`, `game_reports`, `games`, `opponent_tendencies`, `player_reports`, `players`, `practice_recommendations`, `product_events`, `product_feedback`, `profiles`, `share_links`, `support_requests`, `team_members`, `teams`, `verification_feedback`, `video_assets` (plus `access_requests`).

---

## Step 3 — Create Storage Buckets

In Supabase Dashboard → **Storage → Create bucket**:

| Bucket name | Access | Purpose |
|------------|--------|---------|
| `game-videos` | **Private** | Uploaded game/practice video files |
| `game-thumbnails` | **Private** | Video thumbnail images (future) |
| `report-exports` | **Private** | Server-side export artifacts (future) |

**Important:** Keep all buckets private. Video access is controlled via 1-hour signed URLs generated server-side.

After creating the buckets, apply storage RLS policies from `supabase/migrations/0003_storage_policies.sql` if not already done.

---

## Step 4 — Configure Storage Policies

If you need to manually configure storage policies (for `game-videos`), add the following in **Supabase SQL Editor**:

```sql
-- Allow team staff to upload videos
create policy "Team staff can upload videos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'game-videos'
  AND (storage.foldername(name))[1] in (
    select team_id::text from team_members
    where user_id = auth.uid()
    and role in ('owner', 'coach', 'analyst')
  )
);

-- Allow team members to read their team's videos
create policy "Team members can read videos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'game-videos'
  AND (storage.foldername(name))[1] in (
    select team_id::text from team_members
    where user_id = auth.uid()
  )
);
```

See `supabase/migrations/0003_storage_policies.sql` for the complete policy set.

---

## Step 5 — Configure Auth Redirect URLs

In Supabase Dashboard → **Authentication → URL Configuration**:

| Setting | Development | Production |
|---------|------------|-----------|
| **Site URL** | `http://localhost:3000` | `https://yourdomain.com` |
| **Redirect URLs** | `http://localhost:3000/**` | `https://yourdomain.com/**` |

Also set:
- **Email confirmation**: Disable for development; **enable for production**.
- **JWT expiry**: Default (3600s) is fine for MVP.

---

## Step 6 — Set Environment Variables in Vercel

In Vercel Dashboard → Your project → **Settings → Environment Variables**, add:

### Required

```
NEXT_PUBLIC_SUPABASE_URL          = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = eyJhbGci...   (safe for browser)
SUPABASE_SERVICE_ROLE_KEY         = eyJhbGci...   (server-only, mark as "Sensitive")
```

### App Identity

```
NEXT_PUBLIC_APP_URL    = https://yourdomain.com
NEXT_PUBLIC_APP_NAME   = GameIQ
```

### Storage

```
NEXT_PUBLIC_STORAGE_BUCKET       = game-videos
NEXT_PUBLIC_THUMBNAIL_BUCKET     = game-thumbnails
REPORT_EXPORT_BUCKET             = report-exports
```

### AI Provider (default: mock)

```
AI_PROVIDER                     = mock
NEXT_PUBLIC_ENABLE_REAL_AI      = false
NEXT_PUBLIC_ENABLE_MOCK_DATA    = false   (set true only for founder demos)
NEXT_PUBLIC_ENABLE_VIDEO_PROCESSING = false
```

**For real AI (OpenAI):**
```
AI_PROVIDER                  = openai
OPENAI_API_KEY               = sk-...   (mark as "Sensitive")
OPENAI_MODEL                 = gpt-4o-mini
NEXT_PUBLIC_ENABLE_REAL_AI   = true
```

### Admin / Analytics (Prompt 17–18)

```
ADMIN_EMAILS   = founder@example.com,cofounder@example.com
```

Used to gate access to `/admin/analytics` and `/admin/feedback`. If empty, all admin pages deny access. Multiple emails are comma-separated. Also reveals admin nav links in `/settings` for listed users.

---

## Step 7 — Deploy to Vercel

1. Push your code to GitHub (or connect the Vercel project to your repo).
2. In Vercel Dashboard → **Add New Project** → import the repository.
3. Framework preset: **Next.js** (auto-detected).
4. No build command override needed — `next build` is correct.
5. Click **Deploy**.

Vercel will run `npm run build` and deploy to a preview URL.

---

## Step 8 — Verify Production Auth

After deploy, open your production URL and:

1. Navigate to `/auth/signup` — create a test account.
2. Check Supabase **Authentication → Users** — the user should appear.
3. Sign in with the test account.
4. Navigate to `/dashboard` — should load without redirect loops.
5. Create a team — verify you are assigned `owner` role in `team_members`.
6. Sign out — verify you land on `/`.

If auth is broken, check:
- Supabase redirect URLs match your Vercel domain exactly.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct.
- Email confirmation setting (disable it for initial testing).

---

## Step 9 — Verify Storage Uploads

1. Create a game in the app.
2. On the game detail page, upload a small video file.
3. Verify the video uploads and a player appears.
4. Verify the signed URL expires after 1 hour (the video becomes inaccessible after the URL expires).

If upload fails, check:
- `game-videos` bucket exists and is private.
- Storage policies are applied correctly.
- `NEXT_PUBLIC_STORAGE_BUCKET=game-videos` matches the bucket name exactly.

---

## Step 10 — Verify Mock AI

1. With `AI_PROVIDER=mock` and `NEXT_PUBLIC_ENABLE_REAL_AI=false`:
2. Create a game, add timestamps, navigate to the report page.
3. Click **Generate report**.
4. Report should generate in under 5 seconds.
5. Verify all sections: executive summary, insights, player reports, practice recs, opponent tendencies.

---

## Step 11 — Verify Real AI (if configured)

With `AI_PROVIDER=openai`, `OPENAI_API_KEY=sk-...`, and `NEXT_PUBLIC_ENABLE_REAL_AI=true`:

1. Generate a report — should take 10–30 seconds (API call).
2. Provider label should show `OpenAI · gpt-4o-mini` in the report header.
3. Check Supabase `analysis_jobs` table — `provider` column should be `openai`.
4. Monitor your OpenAI usage dashboard to confirm API calls are happening.

**Warning:** Each report generation with OpenAI uses approximately 3,000–8,000 tokens. Set usage limits in your OpenAI account to prevent unexpected costs.

---

## Step 12 — Verify Share Links

1. Generate an AI report.
2. Click **Share** in the report header.
3. Create a **Public summary** share link.
4. Copy the URL and open in an incognito window.
5. Verify the shared report shows executive summary and insight titles only (no player data).
6. Create a **Staff only** link — verify it requires login.
7. Revoke the link — verify the shared URL now shows "Link revoked".

---

## Step 13 — Verify Export Print View

1. Open a report, click **Export**.
2. Configure sections, click **Open export page**.
3. Export page should load with no sidebar or app chrome.
4. Click **Print / Save as PDF** — verify the browser print dialog opens.
5. Save as PDF — verify the PDF is clean with all selected sections.

---

## Step 14 — Configure Custom Domain (Optional)

In Vercel Dashboard → Your project → **Settings → Domains**:

1. Add your custom domain (e.g., `gameiq.yourteam.com`).
2. Follow Vercel's DNS configuration instructions.
3. Update `NEXT_PUBLIC_APP_URL` to your custom domain.
4. Update Supabase Auth redirect URLs to include your custom domain.

---

## Rollback and Debug Notes

### Rollback

In Vercel, every deployment is kept. To rollback:
- Go to **Deployments** → find the previous successful deployment → **Promote to Production**.

### Database issues

If a migration fails:
- Check the exact SQL error in Supabase SQL Editor.
- Do not re-run the entire migration — only run the failing statement.
- Check for dependency ordering (foreign keys, types must exist before tables).

### Auth loops

If users are stuck in a redirect loop:
- Clear browser cookies for the domain.
- Check that `NEXT_PUBLIC_SUPABASE_URL` is correct (no trailing slash).
- Verify the Supabase project is not paused (free tier pauses after 1 week of inactivity).

### RLS errors

If users get "row not found" or empty data that should exist:
- Check RLS policies: run queries as the authenticated user using the Supabase SQL editor (`set role authenticated; set request.jwt.claims = '{"sub": "USER_UUID"}'`).
- Never disable RLS to fix issues — instead, find the correct policy fix.

### Video upload failures

- Check the bucket name in `NEXT_PUBLIC_STORAGE_BUCKET` matches exactly.
- Check storage policies are applied.
- Check the browser network tab for the specific Supabase storage error.

---

## Deployment Warnings

1. **Do not enable real AI publicly without API cost limits.** Set monthly spend limits in your AI provider account before enabling real AI in production.
2. **Do not upload copyrighted or private video content without permission.** GameIQ stores videos in Supabase Storage — ensure you have rights to the content you upload.
3. **Do not disable RLS.** Disabling Row Level Security on any table makes that table's data accessible to all authenticated users. Never disable it.
4. **Do not expose `SUPABASE_SERVICE_ROLE_KEY`.** This key bypasses RLS. It must remain server-side only. Never prefix it with `NEXT_PUBLIC_`.
5. **Enable email confirmation in production.** Development can have it disabled, but production should require email verification.
6. **Rotate secrets if exposed.** If any API key or the service role key is accidentally committed to git or exposed in client code, rotate it immediately in the provider dashboard.

---

## Post-Deploy Smoke Test Checklist

After every production deployment, verify:

- [ ] Landing page loads
- [ ] Sign up creates account
- [ ] Sign in works
- [ ] Dashboard loads with correct user name
- [ ] Create team works
- [ ] Add player works
- [ ] Create game works
- [ ] Generate AI report works (mock mode)
- [ ] Report dashboard shows all sections
- [ ] Share link creates and opens
- [ ] Export page loads and print dialog works
- [ ] Sign out clears session

---

## Environment Variable Reference

See [`/docs/ENVIRONMENT.md`](ENVIRONMENT.md) for the complete variable reference.

See [`/docs/SUPABASE_SETUP.md`](SUPABASE_SETUP.md) for Supabase-specific setup instructions.
