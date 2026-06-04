# GameIQ — Error Fix Log

> Records of production-class bugs found and fixed. One entry per bug.

---

## Error 001 — Supabase Email Verification Callback: Missing Authentication Parameters

**Status:** Fixed — 2026-06-02

---

### Symptom

After signing up at `/auth/signup`, Supabase created the user in Authentication → Users. Clicking the Gmail verification link redirected to:

```
/auth/error?message=Missing authentication parameters
```

---

### Cause

The route handler at `app/auth/callback/route.ts` handled two Supabase callback formats:

| Format | Params | Handler |
|--------|--------|---------|
| PKCE code flow | `?code=...` | `supabase.auth.exchangeCodeForSession(code)` |
| Email OTP flow | `?token_hash=...&type=...` | `supabase.auth.verifyOtp(...)` |

A third format was **not** handled:

| Format | Params | Problem |
|--------|--------|---------|
| Implicit / hash flow | `#access_token=...` | Hash fragment is invisible to server |

When Supabase uses the implicit redirect flow, it appends the session to the URL as a **hash fragment** (e.g. `#access_token=...&refresh_token=...&type=signup`). The Next.js Route Handler runs server-side and receives only the path and query string — the browser never sends the hash to the server.

Result: neither `code` nor `token_hash` was present in `request.url`, so the route fell through to the "Missing authentication parameters" error redirect.

This typically occurs when:
- The Supabase project's Auth settings have PKCE disabled for email flows
- The project predates Supabase SSR's PKCE default
- The user opens the email link in a different browser than the one used to sign up (PKCE code verifier not present)

---

### Fix

**Files changed:**

#### 1. `app/auth/callback/route.ts`

- Case A (`?code=...`) and Case B (`?token_hash=...&type=...`) unchanged.
- Case C (neither): instead of redirecting to `/auth/error`, now redirects to `/auth/confirm?next=<safeNext>`. That client page calls `supabase.auth.getSession()`, which the browser Supabase client resolves from the hash fragment automatically.
- Also accepts `redirectTo` as an alias for `next`.
- Error messages are now URL-encoded and user-friendly (no raw Supabase error strings).

#### 2. `app/auth/confirm/page.tsx` (new)

Client component that:
1. Calls `supabase.auth.getSession()` on mount (browser picks up hash fragment automatically).
2. On success: calls `router.replace(next)` to send user to dashboard.
3. On failure: renders a friendly error with links to sign up or sign in.
4. Wrapped in `<Suspense>` for App Router compatibility with `useSearchParams`.

#### 3. `lib/auth/callback.ts` (new)

Extracted `parseCallbackParams(searchParams)` as a pure helper function so unit tests can verify callback parameter detection without mocking Next.js or Supabase internals.

#### 4. `tests/unit/auth-callback.test.ts` (new)

14 unit tests covering:
- Code flow: detection, safe/unsafe `next` param, `redirectTo` alias
- Token hash flow: detection, missing one param falls through
- Confirm flow: empty params, safe/unsafe `next`

---

### Verification

| Step | Status |
|------|--------|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` | ✅ Pass |
| `npm run test` | ✅ Pass |
| `npm run build` | ✅ Pass |
| Signup creates user | Requires live Supabase — not yet browser-tested |
| Email verification callback | Requires live Supabase — not yet browser-tested |
| Login succeeds | Requires live Supabase — not yet browser-tested |
| Profile row created | Requires live Supabase (dashboard calls `ensureCurrentUserProfile`) |
| Dashboard loads | Requires live Supabase — not yet browser-tested |
| Team creation + owner membership | Requires live Supabase — not yet browser-tested |

**Browser smoke test required**: follow steps in `/docs/PRODUCTION_SMOKE_TEST.md` with a fresh test user.

---

### Supabase Configuration Note

To force PKCE (eliminating the implicit hash flow entirely) and avoid this class of bug permanently:

1. **Supabase Dashboard → Authentication → URL Configuration**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: add `http://localhost:3000/auth/callback`, `http://localhost:3000/**`

2. **Authentication → Email Templates → Confirm signup**

   Change template from `{{ .ConfirmationURL }}` to:

   ```
   {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email
   ```

   This uses the token_hash OTP flow (Case B), which is fully server-side and does not depend on PKCE code verifiers stored in browser cookies.

See `/docs/SUPABASE_SETUP.md` → Section 5 for full template instructions.
