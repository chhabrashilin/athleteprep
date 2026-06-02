# GameIQ — Auth Flow QA

> Complete reference for the authentication flow: signup, login, session, redirect safety, profile creation, and team onboarding.

---

## 1. Overview

GameIQ uses **Supabase Auth** (email + password) managed by `@supabase/ssr`. Sessions are stored in HTTP-only cookies. The proxy layer (`proxy.ts`) refreshes sessions on every request and enforces route protection.

---

## 2. File Map

| File | Role |
|------|------|
| `proxy.ts` | Next.js 16 proxy — session refresh + route protection |
| `lib/supabase/middleware.ts` | `updateSession()` helper for proxy |
| `lib/supabase/server.ts` | Server-side Supabase client + `getServerUser()` |
| `lib/supabase/client.ts` | Browser Supabase client (singleton) |
| `lib/auth/redirect.ts` | `isSafeRedirect` / `safeRedirect` helpers |
| `lib/db/profiles.ts` | `getCurrentProfile()` / `ensureCurrentUserProfile()` |
| `app/auth/signup/page.tsx` | Signup page (server, redirects if already authed) |
| `components/auth/SignupForm.tsx` | Signup form (client) |
| `app/auth/login/page.tsx` | Login page (server, redirects if already authed) |
| `components/auth/LoginForm.tsx` | Login form (client) |
| `app/auth/callback/route.ts` | OAuth / email-confirmation callback handler |
| `app/auth/logout/route.ts` | GET logout — signs out and redirects to `/` |
| `app/auth/error/page.tsx` | Auth error display |
| `app/dashboard/page.tsx` | First authenticated landing; calls `ensureCurrentUserProfile()` |

---

## 3. Public vs Protected Routes

### Public (no auth required)

```
/
/auth/login
/auth/signup
/auth/callback
/auth/logout
/auth/error
/privacy
/feedback
/request-access
/support
/demo
/share/*          (access validated via share token server-side)
/_next/*
/api/*
Static files (.svg, .ico, .png, etc.)
```

### Protected (auth required)

```
/dashboard
/teams
/teams/new
/teams/[teamId]
/teams/[teamId]/players
/teams/[teamId]/games
/settings
/admin/*
```

Unauthenticated users visiting a protected route are redirected to:

```
/auth/login?redirectTo=<original-path>
```

---

## 4. Redirect Safety

All `redirectTo` / `next` parameters are validated via `lib/auth/redirect.ts`:

```ts
isSafeRedirect(url)   // true only if starts with "/" and not "//"
safeRedirect(url)     // returns url if safe, else "/dashboard"
```

External URLs (e.g. `https://evil.com`, `//evil.com`) are rejected. After login, the user is sent to the safe path or `/dashboard`.

Test: `tests/unit/auth-redirect.test.ts`

---

## 5. Signup Flow

1. User visits `/auth/signup`.
2. Server component checks if already authenticated → redirects to `safeRedirect(redirectTo)`.
3. User fills: **full name** (2–100 chars), **email**, **password** (8+ chars), **confirm password**.
4. Client validates all fields before calling Supabase.
5. `supabase.auth.signUp()` is called with `full_name` in user metadata.
6. **If email confirmation is disabled** (Supabase dashboard):
   - Session is returned immediately.
   - DB trigger `on_auth_user_created` creates `profiles` row.
   - User is redirected to `/dashboard` (or safe `redirectTo`).
7. **If email confirmation is enabled**:
   - A confirmation message is shown: "Check your email inbox for a confirmation link."
   - The email contains a link to `/auth/callback?next=/dashboard`.
   - After clicking, callback verifies the token and redirects to `/dashboard`.

### Error states

| Scenario | Message shown |
|----------|---------------|
| Name < 2 chars | "Name must be at least 2 characters." |
| Name > 100 chars | "Name must be 100 characters or fewer." |
| Invalid email format | "Please enter a valid email address." |
| Password < 8 chars | "Password must be at least 8 characters." |
| Passwords do not match | "Passwords do not match." |
| Email already registered | "An account with this email already exists. Try signing in instead." |
| Supabase not configured | Clear setup notice with link to docs |

---

## 6. Login Flow

1. User visits `/auth/login` (with optional `?redirectTo=<path>`).
2. Server component checks if already authenticated → redirects to safe destination.
3. User fills email + password.
4. Client validates fields before calling Supabase.
5. `supabase.auth.signInWithPassword()` is called.
6. On success, `router.push(safeRedirect(redirectTo))` + `router.refresh()`.

### Error states

| Scenario | Message shown |
|----------|---------------|
| Invalid credentials | "Incorrect email or password. Please try again." |
| Email not confirmed | "Please confirm your email address before signing in. Check your inbox." |
| Bad email format | "Please enter a valid email address." |
| Supabase not configured | Clear setup notice |

---

## 7. Callback / Email Confirmation Flow

Route: `/auth/callback`

Handles two cases:

1. **Token hash** (`token_hash` + `type` params) — email confirmation and password recovery links.
2. **PKCE code** (`code` param) — OAuth exchanges.

On success → redirect to `safeRedirect(next)` (defaults to `/dashboard`).

On failure → redirect to `/auth/error?message=<reason>`.

The `next` parameter is sanitized by `safeRedirect()` — external URLs are blocked.

---

## 8. Logout Flow

Route: `/auth/logout` (GET)

1. Creates redirect response to `/`.
2. Calls `supabase.auth.signOut()` to clear session.
3. Cookie is cleared via the response.
4. If Supabase is not configured, still redirects to `/` without crashing.

The logout link in the sidebar (`/auth/logout`) works as a plain `href` because this is a GET route.

---

## 9. Session Persistence

- Sessions are stored in HTTP-only cookies managed by `@supabase/ssr`.
- `proxy.ts` calls `updateSession()` on every request, refreshing the access token when expired.
- Server components call `getServerUser()` which reads from cookies (never localStorage).
- Browser Supabase client handles token refresh automatically.
- Session survives page refresh and tab close/reopen (within Supabase session lifetime).

---

## 10. Profile Creation

When a new user signs up, a `profiles` row is created in two layers:

1. **Primary: DB trigger** — `on_auth_user_created` on `auth.users` calls `handle_new_user()`, which inserts into `public.profiles` with `id`, `email`, and `full_name` from metadata.

2. **Fallback: `ensureCurrentUserProfile()`** — called on every dashboard load. If the profile row is missing (e.g. trigger raced or failed), this upserts it from the auth user data.

The dashboard will never crash due to a missing profile row.

---

## 11. First Team Creation

After signup, the user lands on `/dashboard` with an empty-state CTA: **"Create Team Workspace"** linking to `/teams/new`.

Flow:
1. User fills team form.
2. `createTeamForCurrentUser()` calls the `create_team_with_owner` RPC (SECURITY DEFINER).
3. This atomically creates a `teams` row and a `team_members` row with role `owner`.
4. User is redirected to `/teams/[teamId]`.

The RPC bypasses the RLS chicken-and-egg problem (can't be a team member before the team exists).

---

## 12. Supabase Auth Settings

### Local development

| Setting | Value |
|---------|-------|
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/auth/callback` |
| Email confirmations | Recommended: **disabled** for fast dev iteration |

### Production

| Setting | Value |
|---------|-------|
| Site URL | `https://your-domain.com` (value of `NEXT_PUBLIC_APP_URL`) |
| Redirect URLs | `https://your-domain.com/auth/callback` |
| Email confirmations | **Enabled** (production) |

To disable email confirmation for testing: Supabase dashboard → Authentication → Email → uncheck "Enable email confirmations".

---

## 13. Manual QA Checklist

### Signup

- [ ] Submit empty form — each field shows a validation error
- [ ] Submit single-char name — "Name must be at least 2 characters."
- [ ] Submit invalid email — "Please enter a valid email address."
- [ ] Submit weak password — "Password must be at least 8 characters."
- [ ] Submit mismatched passwords — "Passwords do not match."
- [ ] Submit valid form with a new email — account created
- [ ] If confirmations disabled: redirect to `/dashboard`, profile row exists in Supabase
- [ ] If confirmations enabled: confirmation message shown, not a broken auth state
- [ ] Submit same email again — "An account with this email already exists."

### Login

- [ ] Submit wrong password — "Incorrect email or password."
- [ ] Submit unconfirmed email account — "Please confirm your email."
- [ ] Submit correct credentials — redirected to `/dashboard`
- [ ] Login with `?redirectTo=/teams` — redirected to `/teams` after login
- [ ] Login with `?redirectTo=https://evil.com` — redirected to `/dashboard`, not evil.com
- [ ] Refresh dashboard — session persists, no flicker to login

### Logout

- [ ] Click Sign out — redirected to `/`
- [ ] Visit `/dashboard` after logout — redirected to `/auth/login?redirectTo=/dashboard`
- [ ] Log in again — session restored

### Callback (if email confirmation enabled)

- [ ] Click email confirmation link — redirected to `/dashboard`
- [ ] Click expired link — redirected to `/auth/error` with helpful message
- [ ] Callback with `?next=https://evil.com` — blocked, lands on `/dashboard`

### Route Protection

- [ ] Unauthenticated visit to `/dashboard` → `/auth/login?redirectTo=/dashboard`
- [ ] Unauthenticated visit to `/teams/new` → login redirect
- [ ] Unauthenticated visit to `/settings` → login redirect
- [ ] Authenticated visit to `/auth/login` → redirect to `/dashboard`
- [ ] Authenticated visit to `/auth/signup` → redirect to `/dashboard`
- [ ] `/` accessible without auth
- [ ] `/privacy`, `/support`, `/feedback` accessible without auth

### Team Creation

- [ ] New user has no teams — empty state CTA shown on dashboard
- [ ] Click "Create Team Workspace" → `/teams/new`
- [ ] Fill and submit team form — team created
- [ ] User is redirected to team workspace
- [ ] User role is `owner` in `team_members`

---

## 14. Known Auth Limitations

- **No password reset flow** — users who forget their password cannot reset via the app (v1 scope). Supabase provides a reset email if configured. Planned for v1.1.
- **No social login** — email + password only in v1.
- **No magic link login** — not planned for v1.
- **No team invitations** — planned for v1.1.
- **Email confirmation UX** — after confirmation, user must click "Go to sign in" on the success screen. A future improvement would auto-sign-in after callback.
- **Session expiry** — if the session expires and the refresh token is also expired, the user is silently redirected to login. No explicit expiry message.

---

## 15. Troubleshooting

### "Supabase is not connected to a database yet"
Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. See `/docs/SUPABASE_SETUP.md`.

### User can sign up but profile row is missing
The `on_auth_user_created` trigger may not have run. `ensureCurrentUserProfile()` is called on dashboard load and will insert the row if missing.

### Redirect loop on login
Check that `proxy.ts` is correctly allowing `/auth/*` paths. The `PUBLIC_PREFIXES` array must include `"/auth/"`.

### Protected route accessible without auth
Verify `proxy.ts` is at the project root and exports `proxy` (not `middleware` — this was renamed in Next.js 16).

### Callback returning "Missing authentication parameters"
The email confirmation link may have expired or the URL parameters were mangled. Try signing up again and clicking the link promptly.

### "Email not confirmed" on login
Email confirmations are enabled in Supabase. Either confirm via email, or disable confirmations in Supabase dashboard for development.
