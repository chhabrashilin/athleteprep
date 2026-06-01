# GameIQ — Authentication

> This document describes the authentication strategy, implementation details, protected routes, and known limitations for GameIQ's auth system.

---

## 1. Auth Strategy

GameIQ uses **Supabase Auth** (email + password in v1) managed through `@supabase/ssr` for proper cookie-based session handling in Next.js App Router.

- Sessions are stored in HTTP-only cookies, managed by `@supabase/ssr`.
- Middleware refreshes sessions on every request.
- Server Components, Server Actions, and Route Handlers read sessions server-side via cookies.
- Client Components use the browser Supabase client for interactive auth (sign-up, sign-in, sign-out).
- Passwords are never stored by the application — Supabase Auth handles all credential management.

---

## 2. Required Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...   # safe for browser
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...        # server-side only, NEVER in browser
```

Without these, the app builds and renders (including the UI shell), but authentication will not function and forms will show a clear configuration notice.

---

## 3. Public Routes

These routes do not require authentication and are accessible to all users:

| Route | Purpose |
|-------|---------|
| `/` | Landing page (marketing) |
| `/auth/login` | Sign-in form |
| `/auth/signup` | Account creation form |
| `/auth/callback` | Supabase auth callback (email confirmation, OAuth) |
| `/auth/error` | Auth error display page |
| `/auth/logout` | Sign-out route handler (GET) |

---

## 4. Protected Routes

All routes not listed above require authentication. Unauthenticated users are redirected to:
```
/auth/login?redirectTo=<original-path>
```

After signing in, they are redirected to the original path (if it is a safe same-origin path) or `/dashboard`.

Protected routes include:
- `/dashboard`
- `/teams` and all sub-routes
- `/settings`

---

## 5. Middleware Behavior

`middleware.ts` runs on every matching request (all paths except `_next/static`, `_next/image`, and static file extensions).

Flow:
1. `updateSession()` is called to refresh the Supabase session from request cookies.
2. If the path is public, the request passes through with updated session cookies.
3. If the path is protected and the user is not authenticated, redirect to `/auth/login?redirectTo=<path>`.
4. If the path is protected and the user is authenticated, pass through.

If Supabase is not configured (missing env vars), `updateSession()` is a no-op and all routes pass through without session handling. This allows the UI to function in development without Supabase configured.

---

## 6. Auth Files

| File | Role |
|------|------|
| `middleware.ts` | Root middleware — session refresh + route protection |
| `lib/supabase/client.ts` | Browser Supabase client (for Client Components) |
| `lib/supabase/server.ts` | Server Supabase client (for Server Components + Route Handlers) |
| `lib/supabase/middleware.ts` | Session update helper used by middleware.ts |
| `app/auth/login/page.tsx` | Sign-in page (Server Component wrapping LoginForm) |
| `app/auth/signup/page.tsx` | Sign-up page (Server Component wrapping SignupForm) |
| `app/auth/callback/route.ts` | Auth callback Route Handler (email confirm + PKCE) |
| `app/auth/logout/route.ts` | Logout Route Handler (GET, clears session, redirects to /) |
| `app/auth/error/page.tsx` | Auth error display page |
| `components/auth/AuthCard.tsx` | Reusable branded card wrapper for auth forms |
| `components/auth/LoginForm.tsx` | Client Component — login form with validation + error handling |
| `components/auth/SignupForm.tsx` | Client Component — signup form with confirmation handling |
| `lib/db/profiles.ts` | Server-side profile CRUD (getCurrentProfile, ensureCurrentUserProfile, etc.) |

---

## 7. Sign-Up Flow

1. User fills out the signup form (name, email, password ≥ 8 chars).
2. Client calls `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`.
3. **If email confirmation is disabled** (default for many Supabase projects): a session is created immediately and the user is redirected to `/dashboard`.
4. **If email confirmation is enabled**: a confirmation email is sent and the user sees a "check your email" message. Clicking the link in the email triggers `/auth/callback`, which exchanges the token and redirects to `/dashboard`.
5. On first authenticated load, the `on_auth_user_created` database trigger automatically inserts a row in `profiles`. If the trigger fails, `ensureCurrentUserProfile()` provides a safe fallback upsert.

### Disabling email confirmation (recommended for development)

In your Supabase project → **Authentication → Settings → Email Auth**:
- Disable "Confirm email" for local development.
- Re-enable before going to production.

---

## 8. Sign-In Flow

1. User fills out the login form (email, password).
2. Client calls `supabase.auth.signInWithPassword({ email, password })`.
3. On success, the session is written to cookies and the user is redirected to `redirectTo` or `/dashboard`.
4. On failure, a user-friendly error is shown (invalid credentials, unconfirmed email, etc.).

---

## 9. Sign-Out Flow

1. User clicks "Sign out" in the header or sidebar.
2. Browser navigates to `/auth/logout` (GET Route Handler).
3. Server calls `supabase.auth.signOut()`, which clears the session cookie.
4. User is redirected to `/`.

---

## 10. Profile Creation Strategy

Profiles are created automatically via a Postgres trigger (`on_auth_user_created`) defined in the database migration. This trigger fires after any `auth.users` INSERT and creates the corresponding `profiles` row.

As a safety fallback, `ensureCurrentUserProfile()` in `lib/db/profiles.ts` performs an upsert that is safe to call even if the trigger already ran. This can be called after sign-up or on first visit to the dashboard if needed.

The profile stores:
- `full_name` (from `raw_user_meta_data`, populated during sign-up)
- `email`
- `avatar_url` (null initially)
- `default_team_id` (null until a team is created)

---

## 11. Client vs. Server Client

| Context | Client to use | Import from |
|---------|--------------|-------------|
| Client Components (browser) | `getSupabaseBrowserClient()` | `@/lib/supabase/client` |
| Server Components | `createServerSupabaseClient()` | `@/lib/supabase/server` |
| Server Actions | `createServerSupabaseClient()` | `@/lib/supabase/server` |
| Route Handlers | `createServerClient` directly or `createServerSupabaseClient()` | `@supabase/ssr` or `@/lib/supabase/server` |
| Middleware | `updateSession()` | `@/lib/supabase/middleware` |

Never use the service role key in the browser. Never use the anon key where RLS should not apply.

---

## 12. Security Rules

1. The `SUPABASE_SERVICE_ROLE_KEY` is used server-side only and never exposed to the browser.
2. Redirect URLs are validated (`startsWith("/") && !startsWith("//")`) to prevent open redirects.
3. Middleware runs on the server — client-side route guards alone are not the security boundary.
4. RLS policies are the database-level security boundary. Middleware is a UX layer.
5. Passwords are never stored by the application — Supabase Auth manages credentials.
6. Auth errors shown to users are generic enough to avoid leaking account existence.

---

## 13. Supabase Auth Settings (Recommended for v1)

| Setting | Development | Production |
|---------|------------|-----------|
| Email confirmation | Disabled | Enabled |
| Site URL | `http://localhost:3000` | Your domain |
| JWT expiry | Default (3600s) | Default |
| Redirect URLs | `http://localhost:3000/**` | `https://yourdomain.com/**` |

---

## 14. Known Limitations (V1)

- **Only email/password auth.** OAuth (Google, GitHub) is not yet implemented but the callback route is designed to support it.
- **No password reset flow.** A "Forgot password?" flow using `/auth/callback?type=recovery` is not yet built.
- **No email change flow.** Profile email updates require Supabase Dashboard or a future settings implementation.
- **No avatar upload.** `profiles.avatar_url` is stored but the upload UI is not yet built.
- **Player-facing auth is not yet scoped.** Players with the `player` role have the same access as staff in v1.

---

## 15. Future Improvements

- Add OAuth sign-in (Google, GitHub).
- Add password reset flow.
- Add email re-send for confirmation.
- Add player-scoped sign-in for player-specific report sharing.
- Add two-factor authentication.
- Add session timeout configuration.
