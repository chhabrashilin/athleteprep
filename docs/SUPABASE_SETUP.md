# GameIQ — Supabase Setup Guide

> Step-by-step instructions for setting up Supabase for GameIQ. Do not commit secrets. Use environment variables.

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Choose your organization.
4. Name the project (e.g., `gameiq-dev`).
5. Set a strong database password — save it somewhere secure.
6. Choose a region close to your users.
7. Click **Create new project** and wait for provisioning (~2 minutes).

---

## 2. Get Your Project Keys

In your Supabase project dashboard:
1. Go to **Settings → API**.
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

**Never expose the service_role key to the browser or commit it to git.**

---

## 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

---

## 4. Apply Database Migrations

### Option A: Supabase SQL Editor (recommended for early development)

1. Go to your Supabase project → **SQL Editor**.
2. Open `supabase/migrations/0001_initial_schema.sql` from the project.
3. Paste the full contents into the SQL editor.
4. Click **Run**. Review for errors.
5. Verify tables were created: go to **Table Editor** and confirm all 17 tables exist.

### Option B: Supabase CLI

Install the Supabase CLI if not already installed:
```bash
npm install -g supabase
```

Link your project:
```bash
supabase login
supabase link --project-ref <your-project-ref>
```

Push migrations:
```bash
supabase db push
```

### Option C: Local Supabase (Docker)

For fully local development with the Supabase CLI:
```bash
supabase start
supabase db reset   # Applies all migrations + seed
```

---

## 5. Create Storage Buckets

Storage buckets cannot be created via SQL in all Supabase environments. The recommended approach is the Supabase Dashboard.

### Via Supabase Dashboard

1. Go to **Storage** in your Supabase project.
2. Click **New bucket** and create these three buckets:

| Bucket name | Public | Max file size |
|-------------|--------|--------------|
| `game-videos` | No (private) | 5120 MB |
| `game-thumbnails` | No (private) | 10 MB |
| `report-exports` | No (private) | 50 MB |

3. For `game-videos`, add allowed MIME types: `video/mp4`, `video/quicktime`, `video/x-msvideo`, `video/webm`.
4. For `game-thumbnails`: `image/jpeg`, `image/png`, `image/webp`.
5. For `report-exports`: `application/pdf`.

### Via SQL Editor (if storage extension is available)

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('game-videos',     'game-videos',     false, 5368709120, array['video/mp4','video/quicktime','video/x-msvideo','video/webm']),
  ('game-thumbnails', 'game-thumbnails', false, 10485760,   array['image/jpeg','image/png','image/webp']),
  ('report-exports',  'report-exports',  false, 52428800,   array['application/pdf'])
on conflict (id) do nothing;
```

### Storage RLS Policies

Add these storage policies via the Supabase Dashboard → Storage → Policies, or via SQL:

```sql
-- game-videos: team members can read; staff can write
create policy "game_videos_read" on storage.objects
  for select using (
    bucket_id = 'game-videos'
    and auth.uid() is not null
    -- Additional team scoping is enforced at the application level via signed URLs
  );

create policy "game_videos_write" on storage.objects
  for insert with check (
    bucket_id = 'game-videos'
    and auth.uid() is not null
  );
```

Note: For Phase 3, video access is handled via Supabase signed URLs generated server-side. The storage policy simply ensures the user is authenticated.

---

## 6. Configure Auth

### Email Auth (default, no extra setup needed)

Supabase enables email/password auth by default. No changes required for v1.

### Auth Settings

1. Go to **Authentication → Settings**.
2. Confirm **Enable Email Signup** is on.
3. Set the **Site URL** to your deployed URL (e.g., `https://yourdomain.com`).
4. For local development, add `http://localhost:3000` to **Additional Redirect URLs**.

### URL Configuration (required for email confirmation to work)

1. Go to **Authentication → URL Configuration**.
2. Set **Site URL**:
   - Local: `http://localhost:3000`
   - Production: `https://yourdomain.com`
3. Add to **Redirect URLs** (one per line):
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/confirm
   http://localhost:3000/**
   https://yourdomain.com/auth/callback
   https://yourdomain.com/auth/confirm
   https://yourdomain.com/**
   ```

### Email Template Configuration (strongly recommended)

By default, Supabase uses `{{ .ConfirmationURL }}` in the "Confirm signup" email. This URL routes through Supabase's servers and redirects back to your app using either:
- A PKCE `?code=...` param (if PKCE is enabled and the user opens in the same browser)
- A hash fragment `#access_token=...` (implicit flow)

The hash fragment is invisible to the server-side callback route. To avoid this class of problem entirely, change the email template to use the **token_hash** format, which is always server-visible.

**Steps:**

1. Go to **Authentication → Email Templates → Confirm signup**.
2. Replace the `{{ .ConfirmationURL }}` link in the template body with:
   ```
   {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email
   ```

   Example full template body:
   ```html
   <p>Follow this link to confirm your email:</p>
   <p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Confirm your email</a></p>
   ```

3. Click **Save**.

This makes email confirmation fully server-side (Case B in the callback route), independent of browser cookies or PKCE state.

> **Note:** The `{{ .TokenHash }}` format is a Supabase-managed signed token. It expires after 24 hours and is single-use. This is the recommended format for all new projects.

### Auth Trigger

The `on_auth_user_created` trigger (defined in the migration) automatically creates a `profiles` row when a new user signs up. No manual action needed.

The dashboard (`app/dashboard/page.tsx`) also calls `ensureCurrentUserProfile()` as a fallback in case the trigger races or fails.

---

## 7. Generate TypeScript Types (when schema stabilizes)

Replace the manually-authored `lib/supabase/types.ts` with auto-generated types:

```bash
npx supabase gen types typescript --project-id <your-project-ref> > lib/supabase/types.ts
```

Or with local Supabase:
```bash
supabase gen types typescript --local > lib/supabase/types.ts
```

Regenerate this file after every schema migration.

---

## 8. Local Development Without Supabase

In early development (Phases 1–2), you can run the app without Supabase configured:

1. Set `AI_PROVIDER=mock` and `NEXT_PUBLIC_ENABLE_MOCK_DATA=true` in `.env.local`.
2. Leave Supabase env vars empty.
3. The browser client (`lib/supabase/client.ts`) will log a warning but not crash.
4. Auth-dependent features will not function, but the UI shell is fully accessible.

---

## 9. Verify Setup

After applying migrations, verify in Supabase:

1. **Table Editor**: Confirm all 17 tables exist.
2. **Auth → Users**: No users yet (expected).
3. **Storage**: Confirm 3 buckets exist.
4. **SQL Editor**: Run a quick check:
   ```sql
   select table_name from information_schema.tables
   where table_schema = 'public'
   order by table_name;
   ```
   Should return all 17 app tables.

---

## Security Checklist

- [ ] `.env.local` is in `.gitignore` (never committed)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is only used server-side
- [ ] RLS is enabled on all 17 app tables (confirmed in migration)
- [ ] Storage buckets are private (not public)
- [ ] Auth `Site URL` is set correctly in production
- [ ] JWT expiry is set to a reasonable duration (default is fine for v1)
