# GameIQ — Production Smoke Test

> Run this checklist after every production deployment, before inviting any pilot coach, and after any environment variable change.
>
> **Requirements:** A production deployment is live. You have access to the production URL.  
> Use a personal test account (not a pilot coach's account) for all steps.

---

## Pre-Test Setup

- [ ] You have the production URL (e.g., `https://your-app.vercel.app` or custom domain)
- [ ] You have a test email address (different from any pilot coach's email)
- [ ] You have a private/incognito browser window available for share link testing
- [ ] Admin email is configured in `ADMIN_EMAILS` env var

---

## Step 1 — Landing Page

**Action:** Open the production URL in a fresh browser.

**Expected:**
- Landing page loads within 3 seconds
- Navigation links are present (Features, Demo, Sign In, Request Access)
- No console errors visible (open browser DevTools → Console)
- No "localhost" references in the page

**Pass / Fail:** ___

---

## Step 2 — Sign Up

**Action:** Navigate to `/auth/signup`. Create a new account with your test email.

**Expected:**
- Sign-up form loads correctly
- After submitting: email confirmation sent (if enabled) or redirect to /dashboard
- New user appears in Supabase Dashboard → Authentication → Users
- A `profiles` row is created automatically (verify in Supabase Table Editor)

**Pass / Fail:** ___

---

## Step 3 — Sign In

**Action:** Sign in with the test account at `/auth/login`.

**Expected:**
- Sign-in form loads correctly
- After submitting: redirect to `/dashboard`
- No redirect loops
- User name/email shown in the app header

**Pass / Fail:** ___

---

## Step 4 — Dashboard Loads

**Action:** Observe the `/dashboard` page.

**Expected:**
- Dashboard loads with the "Your teams" section
- "Get started" checklist is visible (no teams yet)
- No 500 errors
- No loading spinner that never resolves

**Pass / Fail:** ___

---

## Step 5 — Create Team

**Action:** Click "Create team" (or navigate to `/teams/new`). Fill in a team name and sport.

**Expected:**
- Form submits successfully
- Redirect to the new team's workspace page
- Team appears in `/dashboard` team grid
- You are assigned the `owner` role (verify in Supabase: `team_members` table)

**Pass / Fail:** ___

---

## Step 6 — Add Player

**Action:** Navigate to Roster → Add player. Fill in name, position, jersey number.

**Expected:**
- Player is created and appears in the roster list
- Player shows in the team's roster count

**Pass / Fail:** ___

---

## Step 7 — Create Game

**Action:** Navigate to Games → New game. Fill in opponent, date, result, score.

**Expected:**
- Game is created and appears in the games list
- Game detail page loads with the setup checklist

**Pass / Fail:** ___

---

## Step 8 — Upload Small Test Video

**Action:** On the game detail page, upload a small video file (< 10 MB for speed).

**Expected:**
- Upload progress shown
- Video appears in the game detail with a player
- Video plays via signed URL (check that it loads)
- No CORS or storage errors in browser console

**If upload fails:**
- Check `NEXT_PUBLIC_STORAGE_BUCKET=game-videos` matches the bucket name exactly
- Check storage policies are applied in Supabase Dashboard → Storage → Policies
- Check browser console for the specific Supabase storage error

**Pass / Fail:** ___

---

## Step 9 — Add Timestamp

**Action:** Navigate to the game's Timestamps page. Add a key moment.

**Expected:**
- Timestamp form loads with all fields
- After submitting: timestamp appears in the list
- AI Readiness badge updates (increases)
- No errors

**Pass / Fail:** ___

---

## Step 10 — Generate Mock AI Report

**Action:** Navigate to the game's Report page. Click "Generate report."

**Expected:**
- Report generation completes in < 10 seconds (mock mode)
- Report dashboard loads with all 6 sections: Executive Summary, Insights, Players, Opponent, Practice, Assumptions
- Provider label shows "Mock AI"
- No JavaScript errors

**Note:** `AI_PROVIDER=mock` and `NEXT_PUBLIC_ENABLE_REAL_AI=false` are required for this step.

**Pass / Fail:** ___

---

## Step 11 — Open Report Dashboard

**Action:** Review all sections of the report dashboard.

**Expected:**
- Executive summary is visible
- At least 1 coaching insight with confidence badge
- Player reports section loads
- Opponent tendencies section loads
- Practice recommendations section loads
- Assumptions section loads

**Pass / Fail:** ___

---

## Step 12 — Verify / Edit an Insight

**Action:** Click on the first coaching insight. Mark it as "Accurate." Then try editing the text.

**Expected:**
- Verification badge updates to "Accurate" (green)
- Edit mode opens and allows text changes
- After saving: edited text persists on reload
- Audit trail row appears (verify in Supabase: `verification_feedback` table)

**Pass / Fail:** ___

---

## Step 13 — Create Share Link

**Action:** From the report page, open the Share modal. Create a "Public summary" share link.

**Expected:**
- Share modal opens
- Link is generated with a `giq_` prefix token
- URL is copied to clipboard
- Share link record appears in Supabase: `share_links` table

**Pass / Fail:** ___

---

## Step 14 — Open Shared Link in Incognito

**Action:** Open the copied share URL in a private/incognito browser window (not signed in).

**Expected:**
- Shared report page loads
- "Public summary" mode: shows executive summary and insight titles only
- No player names, no player-specific data
- No video player
- No login prompt
- "Powered by GameIQ" footer visible

**Pass / Fail:** ___

---

## Step 15 — Open Export View

**Action:** From the report page, click "Export." Configure sections. Click "Open export page."

**Expected:**
- Export page loads with no sidebar or app navigation
- All selected report sections are visible
- Print button / "Print / Save as PDF" dialog opens correctly

**Pass / Fail:** ___

---

## Step 16 — Submit Feedback Form

**Action:** Navigate to `/feedback`. Fill in the feedback form and submit.

**Expected:**
- Form submits successfully
- Confirmation message shown
- Feedback record appears in Supabase: `product_feedback` table

**Pass / Fail:** ___

---

## Step 17 — Admin: View Feedback and Analytics

**Action:** Sign in with the admin email (listed in `ADMIN_EMAILS`). Navigate to `/admin/feedback` and `/admin/analytics`.

**Expected:**
- `/admin/analytics` loads with event count summary, funnel, and recent events
- `/admin/feedback` loads with the submitted feedback
- The test feedback from Step 16 appears

**Pass / Fail:** ___

---

## Step 18 — Non-Admin Cannot Access Admin Pages

**Action:** Sign in with a non-admin test account. Navigate to `/admin/analytics`.

**Expected:**
- Access denied (403 / redirect to dashboard)
- No admin data visible

**Pass / Fail:** ___

---

## Step 19 — Sign Out

**Action:** Click "Sign out" from the settings or user menu.

**Expected:**
- Session cleared
- Redirect to `/` (landing page)
- Navigating to `/dashboard` redirects back to `/auth/login`

**Pass / Fail:** ___

---

## Step 20 — CI / Build Status

**Action:** Check the GitHub repository → Actions tab.

**Expected:**
- The latest commit's CI run is green (all jobs pass)
- Jobs: typecheck → lint → test → build

**Pass / Fail:** ___

---

## Summary

| Step | Check | Pass/Fail |
|------|-------|-----------|
| 1 | Landing page loads | |
| 2 | Sign up works | |
| 3 | Sign in works | |
| 4 | Dashboard loads | |
| 5 | Create team | |
| 6 | Add player | |
| 7 | Create game | |
| 8 | Upload video | |
| 9 | Add timestamp | |
| 10 | Generate mock AI report | |
| 11 | Report dashboard shows all sections | |
| 12 | Verify/edit insight | |
| 13 | Create share link | |
| 14 | Open shared link in incognito | |
| 15 | Open export view | |
| 16 | Submit feedback form | |
| 17 | Admin views feedback/analytics | |
| 18 | Non-admin denied admin pages | |
| 19 | Sign out | |
| 20 | CI build status green | |

**All 20 steps must pass before inviting any pilot coach.**

---

## Common Failures and Fixes

| Failure | Likely Cause | Fix |
|---------|-------------|-----|
| Auth redirect loop | Supabase Site URL or redirect URL misconfigured | Check Auth settings in Supabase dashboard |
| Video upload fails | Missing storage bucket or policies | Apply `0003_storage_policies.sql` |
| Report generation fails | Missing Supabase env vars | Verify all required env vars in Vercel |
| Share link shows wrong content | Share sanitization bug | Check `lib/sharing/sanitize-report.ts` |
| Admin pages not accessible | `ADMIN_EMAILS` not set | Set in Vercel environment variables |
| "Project paused" error | Free tier Supabase | Upgrade to Pro plan |

---

*See also: [`DEPLOYMENT.md`](DEPLOYMENT.md) · [`PRODUCTION_SUPABASE_CHECKLIST.md`](PRODUCTION_SUPABASE_CHECKLIST.md)*  
*Last updated: Prompt 22 — Pilot Deployment and Production Environment Setup (June 2026)*
