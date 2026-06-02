# GameIQ — Pilot Support Runbook

> Day-to-day operations guide for running the early coach pilot. Run these checks regularly and use the response templates for common support scenarios.

---

## Daily Checks (While Pilot Is Active)

| Check | Where | Expected |
|-------|-------|---------|
| New support requests | `/admin/support` | Review and triage |
| Production is up | Visit the production URL | Landing page loads, login works |
| Supabase project is not paused | Supabase Dashboard → Overview | Status: Running |
| Recent product events | `/admin/analytics` | Activity visible if coaches are using the app |

---

## Weekly Checks

| Check | Where | Expected |
|-------|-------|---------|
| New feedback submissions | `/admin/feedback` | Read coach feedback |
| New access requests | `/admin/analytics` → Access requests section | Follow up with interested coaches |
| Failed analysis jobs | Supabase → `analysis_jobs` table where `status = 'failed'` | None (or investigated) |
| Storage upload issues | Check `video_assets` where `status = 'failed'` | None (or cleaned up) |
| OpenAI usage (if real AI enabled) | OpenAI dashboard | Within expected range, below cap |
| CI status | GitHub → Actions tab | All jobs green |
| Share link health | `share_links` table — check for unexpired/unrevoked links | No surprises |

```sql
-- Weekly: check for failed jobs
select id, game_id, provider, status, error_message, created_at
from public.analysis_jobs
where status = 'failed'
  and created_at > now() - interval '7 days'
order by created_at desc;

-- Weekly: check for stuck video uploads
select id, storage_path, status, created_at
from public.video_assets
where status in ('uploading', 'failed')
  and created_at < now() - interval '24 hours';
```

---

## Common Support Scenarios

### Scenario 1 — Coach Cannot Log In

**Likely causes:**
- Wrong password
- Email address not confirmed (if email confirmation is enabled)
- Supabase project paused

**Steps:**
1. Ask the coach to confirm the email address they signed up with
2. Check Supabase Dashboard → Authentication → Users → find the user
3. If `email_confirmed_at` is null: resend confirmation email or manually confirm in the dashboard
4. If the project is paused: unpause immediately and upgrade to Pro
5. If password issue: manually reset via Supabase dashboard (last resort)

---

### Scenario 2 — Coach Cannot Create a Team

**Likely causes:**
- Auth session expired
- `create_team_with_owner` RPC error
- Missing `profiles` row (auth trigger failed)

**Steps:**
1. Ask the coach to sign out and sign back in
2. Check Supabase → `profiles` table — does a row exist for their user UUID?
3. If no `profiles` row: the auth trigger failed. Insert manually:
   ```sql
   insert into public.profiles (id, email)
   values ('<USER_UUID>', '<EMAIL>');
   ```
4. Check the Supabase logs for errors from the `create_team_with_owner` RPC

---

### Scenario 3 — Video Upload Failed

**Likely causes:**
- Network interruption during upload
- File size too large (> 5 GB limit)
- Browser timeout on slow connection
- Storage policy issue

**Steps:**
1. Ask the coach to retry with a smaller test video (< 100 MB)
2. If the retry succeeds: the original file may be too large or the connection too slow
3. If retry fails: check Supabase Storage policies are applied
4. Check browser DevTools → Network tab for the specific Supabase error code
5. Check `NEXT_PUBLIC_STORAGE_BUCKET` in Vercel matches `game-videos` exactly

---

### Scenario 4 — Report Generation Failed

**Likely causes:**
- Not enough tagged events (AI readiness too low)
- Mock AI error (rare — deterministic)
- Real AI timeout or quota exceeded
- Database write error

**Steps:**
1. Ask the coach to check the AI Readiness badge — is it at least "Basic"?
2. Ask them to add at least 5 tagged timestamps and retry
3. Check the `analysis_jobs` table:
   ```sql
   select status, error_message, provider
   from public.analysis_jobs
   where game_id = '<GAME_UUID>'
   order by created_at desc
   limit 5;
   ```
4. If `error_message` contains an OpenAI error: check OpenAI usage/quota dashboard
5. If `error_message` contains a Zod validation error: the AI output was malformed — retry

---

### Scenario 5 — Share Link Not Working

**Likely causes:**
- Link was revoked
- Link has expired
- Wrong URL copied (truncated)

**Steps:**
1. Ask the coach to verify the share link in the Share modal is still active
2. Check the `share_links` table:
   ```sql
   select is_revoked, expires_at, view_count, visibility_mode
   from public.share_links
   where token = 'giq_<token>';
   ```
3. If `is_revoked = true`: coach needs to create a new link
4. If `expires_at` is past: coach needs to create a new link with a later expiry
5. If the URL looks wrong: ask the coach to copy the full URL from the Share modal

---

### Scenario 6 — Coach Wants Data Deleted

**Steps:**
1. Confirm you have received the request: "We have received your deletion request and will process it within 24 hours."
2. Ask them to confirm: their email address and team name
3. Follow the full process in [`DATA_DELETION_PLAN.md`](DATA_DELETION_PLAN.md)
4. Confirm deletion is complete via email: "Your team data and video files have been deleted."
5. Update the support request status to "resolved"

---

### Scenario 7 — AI Report Seems Wrong

**Steps:**
1. Acknowledge: "AI outputs can be incorrect. This is why the verification step exists."
2. Ask the coach to:
   - Use the verification controls (mark insight as Partially Accurate / Inaccurate)
   - Edit the text using the inline editing controls
   - Note the specific claim that is wrong and which tagged event it cited
3. Check if the evidence reference is a real event (open the insight detail → evidence panel)
4. If the AI fabricated an event that doesn't exist: this is a hallucination — note it for the quality log
5. Ask: "Were there enough tagged timestamps with clear descriptions?" (< 5 events produces weaker reports)

---

## Founder Response Templates

### Template 1 — Video Upload Issue

> Hi [Name],
>
> Thanks for reaching out. Video upload issues are often caused by a slow connection, a very large file, or a temporary service hiccup.
>
> A few things to try:
> 1. Upload a smaller test video (under 100 MB) to confirm the feature is working
> 2. Try from a different network if possible
> 3. If the issue continues, let me know the exact error message you see (or check browser DevTools → Console for details)
>
> I'll look into this on my end as well. If you can share your team name and game name, I can check the server logs.
>
> — [Your name], GameIQ

---

### Template 2 — Report Quality Issue

> Hi [Name],
>
> Thanks for flagging this. AI-generated reports can be wrong, especially when the input data is thin. Here's what I'd suggest:
>
> 1. **Use the verification controls** — on each insight, you can mark it as Accurate, Partially Accurate, Inaccurate, or Edited. Your corrections are saved.
> 2. **Edit the text directly** — the Edit button on each insight lets you rewrite it in your own words. The original AI text is preserved.
> 3. **Add more timestamps** — reports with 10+ well-labeled key moments tend to be much more specific. Try regenerating after adding more events.
>
> I'd love to understand specifically what felt wrong — that's exactly the kind of feedback that helps us improve. What was the claim and what was the actual reality?
>
> — [Your name], GameIQ

---

### Template 3 — Deletion Request Received

> Hi [Name],
>
> We have received your request to delete your GameIQ data. We will process this within 24 hours.
>
> To confirm your identity before deletion, could you reply with:
> - The email address on your GameIQ account
> - The name of your team workspace
>
> Once confirmed, we will delete your team data, all associated reports and game files, your uploaded video, and your account. We will follow up to confirm when deletion is complete.
>
> — [Your name], GameIQ

---

### Template 4 — Share Link Concern

> Hi [Name],
>
> Thanks for reaching out about your share link. You can revoke any share link at any time from the Share modal in your report — just click "Revoke" next to the active link.
>
> A few things to know about share link visibility:
> - "Public summary" shows only the executive summary and insight titles — no player data
> - "Private link" shows the full report without requiring login — use with care
> - "Staff only" requires team login — safest for full-report sharing
>
> If you need me to revoke the link on your behalf, send me the URL or the team/report name and I'll handle it immediately.
>
> — [Your name], GameIQ

---

### Template 5 — Thanks for Feedback

> Hi [Name],
>
> Thank you for taking the time to share this — it's exactly the kind of honest reaction that makes the pilot valuable. I've read your response in full.
>
> [Acknowledge 1–2 specific things they mentioned]
>
> A few of these are already on our roadmap; others are new signals we hadn't heard before. I'll follow up when the relevant features ship.
>
> — [Your name], GameIQ

---

### Template 6 — Pilot Limitation Explanation

> Hi [Name],
>
> Great question. [Feature they asked about] is not yet part of GameIQ v1. Here's the honest picture:
>
> **What v1 does:** AI reports generated from the structured data you tag — game notes, timestamps, roster data.
>
> **What v1 does not do:** Automated video analysis, player tracking, or [feature]. This is intentional — we're building the coaching intelligence layer first, which delivers most of the value without requiring expensive infrastructure.
>
> [Feature] is on the roadmap and your interest in it helps prioritize it. In the meantime, [workaround if any].
>
> — [Your name], GameIQ

---

*See also: [`INCIDENT_RESPONSE_RUNBOOK.md`](INCIDENT_RESPONSE_RUNBOOK.md) · [`DATA_DELETION_PLAN.md`](DATA_DELETION_PLAN.md) · [`PILOT_PARTICIPANT_EXPECTATIONS.md`](PILOT_PARTICIPANT_EXPECTATIONS.md)*  
*Last updated: Prompt 23 — Pilot Support, Data Deletion, and Operational Runbook (June 2026)*
