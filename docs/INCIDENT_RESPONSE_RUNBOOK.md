# GameIQ — Incident Response Runbook

> Practical response playbook for the most likely incidents during the early coach pilot. This is not a formal security incident management system — it is a founder-level guide for fast, honest, and responsible response.

**Severity levels:**
- **P0 — Critical:** Data exposure, auth bypass, or production completely down
- **P1 — High:** Feature broken for all users, data integrity issue
- **P2 — Medium:** Feature broken for some users, performance degradation
- **P3 — Low:** Minor UI issue, cosmetic bug

---

## Incident 1 — Private Report Link Accidentally Exposed

**Scenario:** A coach created a `private_link` or `player_specific` share link and sent it to the wrong person, or posted it publicly.

**Severity:** P1 (P0 if sensitive player data is involved)

### Immediate Action
1. Revoke the link immediately — either the coach revokes in-app, or the founder revokes via SQL:
   ```sql
   update public.share_links set is_revoked = true where token = 'giq_<token>';
   ```
2. Verify the URL returns "Link revoked" in an incognito window

### Investigation
- Check `share_links` table: what visibility mode was the link? (`public_summary` = low risk, `private_link` = higher risk)
- Check `view_count` — how many times was it accessed?
- Determine what content was visible in that mode (see `SHARE_LINK_REVOCATION_RUNBOOK.md` Section 8)

### Communication
- Notify the coach promptly: "Your share link has been revoked. Here's what was visible before revocation: [describe by mode]."
- If player data was potentially exposed to unauthorized persons, notify the affected coach to handle player communication

### Remediation
- Revocation is immediate — no further technical action needed
- Document in the support request or an incident log

### Prevention Follow-Up
- Review whether share modal UI makes the visibility modes clearer
- Consider adding a warning step for `private_link` mode creation

---

## Incident 2 — Video Uploaded to Wrong Team

**Scenario:** A video appears in the wrong team's workspace due to a path construction error or user error.

**Severity:** P1

### Immediate Action
1. Revoke any share links for the affected game/report immediately
2. Identify the storage path from `video_assets.storage_path`
3. Check whether the video is accessible via signed URL — if yes, revoke access by deleting the storage object

### Investigation
```sql
-- Find the video and its team
select va.id, va.storage_path, g.team_id, g.id as game_id
from public.video_assets va
join public.games g on g.id = va.game_id
where va.id = '<VIDEO_ASSET_UUID>';
```

### Remediation
1. Delete the `video_assets` row
2. Delete the storage object from the `game-videos` bucket
3. Notify the team whose workspace was affected

### Prevention Follow-Up
- Verify that storage path construction always uses the correct `team_id` from the authenticated user's team

---

## Incident 3 — User Cannot Log In

**Scenario:** A pilot coach is locked out of their account.

**Severity:** P2

### Immediate Action
1. Ask the coach to try password reset (currently manual — go to Supabase Dashboard)
2. In Supabase Dashboard → Authentication → Users → find the user → **Send reset email** (if email confirmation is configured)

### Investigation
- Is the user in `auth.users`? Check Supabase Authentication → Users
- Is the Supabase project paused (free tier)? Check the project status
- Is the Site URL and redirect URL configured correctly?

### Remediation Options
- Resend email confirmation if the user hasn't confirmed
- Manually set a temporary password via Supabase dashboard (last resort)
- If the project is paused: unpause immediately and upgrade to Pro

### Communication
- Respond to the coach's support request within 2 hours for login issues (higher urgency)
- Provide step-by-step instructions for what to try

### Prevention Follow-Up
- Supabase Pro plan prevents auto-pause
- Password reset flow is a P1 engineering priority

---

## Incident 4 — AI Report Contains Inappropriate or Fabricated Output

**Scenario:** A generated AI report contains content that is factually wrong, fabricated, or inappropriate.

**Severity:** P2 (P1 if a coach shared the report externally)

### Immediate Action
1. If the report was shared, revoke the share link
2. Advise the coach not to act on the report until verified

### Investigation
- Check the `analysis_jobs` table: which provider was used? (`provider` column)
- Check the `game_reports.raw_ai_output` if available — what did the model actually return?
- Was the Zod validation schema bypassed? Check if `normalize-generated-report.ts` logs errors

### Remediation
1. Coach can edit any AI output inline using the verification/edit controls
2. Coach can regenerate the report (overwrites with a new version)
3. If it's a systematic issue with the mock AI, file a bug and fix `lib/ai/mock-ai.ts`
4. If it's a real AI issue, review the system prompt guardrails in `lib/ai/report-prompts.ts`

### Communication
- Be honest with the coach: "AI outputs can be wrong. This is why the verification step exists."
- Remind them that AI claims are tagged with confidence scores and evidence

### Prevention Follow-Up
- Review whether the hallucination guardrails in the system prompt are sufficient
- Add the case to the report quality evaluation framework

---

## Incident 5 — Real AI Provider Costs Spike

**Scenario:** OpenAI costs exceed expectations due to unexpected usage or a runaway generation loop.

**Severity:** P1 if uncapped, P2 if within cap

### Immediate Action
1. Check the OpenAI usage dashboard immediately
2. If costs are approaching or exceeding the monthly cap: disable real AI in Vercel environment variables
   - Set `NEXT_PUBLIC_ENABLE_REAL_AI=false` and `AI_PROVIDER=mock`
   - Redeploy

### Investigation
- Check `analysis_jobs` table: how many jobs ran? Which users/teams generated them?
- Were there any failed jobs that retried repeatedly?

### Remediation
- Switch to mock AI while investigating
- Set a spend cap in the OpenAI dashboard if not already set
- Review whether any generation loop or retry is causing repeated calls

### Prevention Follow-Up
- **Set OpenAI monthly spend cap before enabling real AI.** This is a hard requirement.
- Consider tracking `tokens_used` and `estimated_cost_usd` per report in the `analysis_jobs` table

---

## Incident 6 — Storage Upload Fails Repeatedly

**Scenario:** Coaches report that video uploads are failing consistently.

**Severity:** P2

### Immediate Action
1. Check Supabase Storage status at status.supabase.com
2. Check the browser console error on the upload page — what specific error does Supabase return?
3. Verify the `game-videos` bucket exists and is private

### Investigation
- Check storage policies are applied (Dashboard → Storage → Policies)
- Check that `NEXT_PUBLIC_STORAGE_BUCKET=game-videos` matches the bucket name exactly
- Check for CORS errors in browser DevTools

### Common Causes and Fixes
| Cause | Fix |
|-------|-----|
| Bucket does not exist | Create it in Supabase Dashboard → Storage |
| Storage policies not applied | Run `0003_storage_policies.sql` |
| Env var mismatch | Check `NEXT_PUBLIC_STORAGE_BUCKET` in Vercel |
| Supabase project paused | Unpause and upgrade to Pro |
| File too large | Current limit is 5 GB — check if coach is exceeding this |

### Prevention Follow-Up
- Check the smoke test covers video upload after every deployment

---

## Incident 7 — Suspected Non-Member Access to Team Data

**Scenario:** A coach reports that someone without team access may have seen their team's data, or an audit shows unexpected data access.

**Severity:** P0 (potential RLS bypass)

### Immediate Action
1. Immediately review RLS policies in Supabase Dashboard → Database → RLS
2. Run a query to check if RLS is enabled on all tables:
   ```sql
   select tablename, rowsecurity
   from pg_tables
   where schemaname = 'public'
     and rowsecurity = false;
   ```
   Any result here is a critical finding — RLS must be on for all tables.

### Investigation
- Check Supabase logs for unexpected queries
- Check if any server action or route handler is using the service role client inappropriately
- Check if any `createServiceSupabaseClient()` call is reachable from a client component

### Remediation
- Re-enable RLS on any table that has it disabled
- Patch the code path that bypassed authorization
- Redeploy immediately

### Communication
- Do not wait to notify affected coaches — even suspected data exposure requires prompt communication
- Be honest and specific: "We identified a potential access issue and have taken action. Here is what data may have been accessible."

### Prevention Follow-Up
- Never disable RLS to fix a permission issue — always find the correct policy
- Add RLS verification to the production smoke test

---

## Incident 8 — Supabase RLS Misconfiguration Found

**Scenario:** A policy review reveals that an RLS policy is more permissive than intended (e.g., a policy allows all authenticated users to read all teams).

**Severity:** P0

### Immediate Action
1. Identify the affected table and policy
2. In Supabase SQL Editor, update or replace the policy immediately
3. Test the corrected policy with a non-member user

### Example Fix
```sql
-- Drop the permissive policy
drop policy if exists "overly_permissive_policy_name" on public.teams;

-- Re-create the correct policy
create policy "teams_member_read"
on public.teams for select
to authenticated
using (
  exists (
    select 1 from public.team_members
    where team_id = teams.id
    and user_id = auth.uid()
  )
);
```

### Verification
```sql
-- Test as a specific user (substitute their UUID)
set local role authenticated;
set local request.jwt.claims = '{"sub": "<USER_UUID>", "role": "authenticated"}';
select * from public.teams;
-- Should only return teams where the user is a member
```

---

## Incident 9 — Deployment Breaks After Release

**Scenario:** A new deployment causes 500 errors, broken routes, or a completely broken app.

**Severity:** P1

### Immediate Action
1. In Vercel Dashboard → Deployments → find the previous working deployment → **Promote to Production**
2. This reverts the live app to the last good build in ~30 seconds

### Investigation
- Check the failed build's deployment logs in Vercel
- Check the runtime logs for the broken deployment
- Identify the failing route or server component

### Prevention Follow-Up
- Ensure the CI pipeline (typecheck → lint → test → build) is passing before promoting to production
- Never deploy a branch with a failing build

---

## Incident 10 — User Requests Deletion

**Scenario:** A coach or pilot user requests that their data be deleted.

**Severity:** Operational (not a security incident, but time-sensitive)

### Immediate Action
1. Acknowledge the request in the support system within 24 hours
2. Confirm their identity: ask them to confirm the email and team name on their account

### Process
Follow the full deletion process in [`DATA_DELETION_PLAN.md`](DATA_DELETION_PLAN.md):
1. Delete team data (SQL) — includes all games, reports, players, timestamps
2. Delete storage objects — Supabase Storage → `game-videos/{team_id}/`
3. Delete user account — Supabase Authentication → Users
4. Confirm deletion to the coach via email

### Target Response Time
- **Acknowledge:** Within 24 hours
- **Complete deletion:** Within 48 hours of identity confirmation

---

## Incident Log Template

For each incident, record:

```
Date:
Severity:
Incident type:
Description:
Immediate actions taken:
Investigation findings:
Remediation:
Coach communication (if applicable):
Prevention follow-ups:
Status: [Open / Resolved]
Resolved at:
```

---

*See also: [`DATA_DELETION_PLAN.md`](DATA_DELETION_PLAN.md) · [`SHARE_LINK_REVOCATION_RUNBOOK.md`](SHARE_LINK_REVOCATION_RUNBOOK.md) · [`VIDEO_DELETION_RUNBOOK.md`](VIDEO_DELETION_RUNBOOK.md) · [`PILOT_SUPPORT_RUNBOOK.md`](PILOT_SUPPORT_RUNBOOK.md)*  
*Last updated: Prompt 23 — Pilot Support, Data Deletion, and Operational Runbook (June 2026)*
