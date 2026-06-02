# GameIQ — Data Deletion Plan

> This document describes how pilot team data can be deleted. It covers what is automated, what is manual, the risks of partial deletion, and the recommended founder process for handling deletion requests.

**This is an internal operations document.** The data deletion process for v1 is manual — executed by the founder via the Supabase dashboard. Self-serve deletion is planned for a future release.

---

## Deletion Request Intake

Coaches and users can request deletion at any time by:
1. Submitting a support request at `/support` with issue type **"Data deletion request"**
2. The founding team commits to processing deletion within **24 hours** of receiving the request

---

## 1. User Account Deletion

### What to delete

| Item | Location | Method |
|------|----------|--------|
| Auth user | Supabase Dashboard → Authentication → Users | Click user → Delete user |
| Profile row | `profiles` table | Cascades automatically when auth user is deleted if FK is set up; verify manually |
| Team memberships | `team_members` table | Delete rows where `user_id = <uuid>` |
| Product events | `product_events` table | Delete rows where `user_id = <uuid>` (optional — may anonymize instead) |
| Access requests / feedback | `access_requests`, `product_feedback` | Delete or anonymize rows where `email = <email>` |
| Support requests | `support_requests` table | Delete or anonymize rows where `email = <email>` |

### SQL (run in Supabase SQL Editor as service role)

```sql
-- Replace <USER_UUID> and <USER_EMAIL> with actual values

-- 1. Delete product events (or anonymize by setting user_id = null)
update public.product_events set user_id = null where user_id = '<USER_UUID>';

-- 2. Delete team memberships
delete from public.team_members where user_id = '<USER_UUID>';

-- 3. Delete profile
delete from public.profiles where id = '<USER_UUID>';

-- 4. Anonymize support/feedback (recommended over deletion to preserve pilot data quality)
update public.support_requests
  set name = 'Deleted User', email = 'deleted@gameiq.invalid', user_id = null
  where user_id = '<USER_UUID>' or email = '<USER_EMAIL>';

update public.product_feedback
  set name = null, email = null, user_id = null
  where user_id = '<USER_UUID>' or email = '<USER_EMAIL>';

update public.access_requests
  set name = 'Deleted User', email = 'deleted@gameiq.invalid'
  where email = '<USER_EMAIL>';
```

5. Delete the Supabase Auth user: Dashboard → Authentication → Users → find the user → Delete

### Notes

- Deleting a user does **not** automatically delete their owned teams. If the user is the sole owner of a team, follow the Team Deletion process below first.
- If the user is a non-owner member of other teams, their `team_members` row is removed but team data is preserved.
- `profiles.id` references `auth.users.id`. Deleting the auth user should cascade to `profiles` if the FK has `ON DELETE CASCADE`. Verify this is the case before skipping the manual delete.

---

## 2. Team Workspace Deletion

### What to delete (in dependency order)

Deleting a team requires removing all child data first, then the storage objects, then the team row.

| Order | Table / Location | Notes |
|-------|-----------------|-------|
| 1 | `verification_feedback` | References `coaching_insights` |
| 2 | `coaching_insights` | References `game_reports` |
| 3 | `player_reports` | References `game_reports` |
| 4 | `practice_recommendations` | References `game_reports` |
| 5 | `opponent_tendencies` | References `game_reports` |
| 6 | `game_reports` | References `analysis_jobs`, `games` |
| 7 | `analysis_jobs` | References `games` |
| 8 | `share_links` | References `game_reports` |
| 9 | `exports` | References `game_reports` |
| 10 | `event_timestamps` | References `games` |
| 11 | `clips` | References `event_timestamps` |
| 12 | `video_assets` | References `games` |
| 13 | Storage objects | Delete from `game-videos/{team_id}/` in Supabase Storage |
| 14 | `games` | References `teams` |
| 15 | `players` | References `teams` |
| 16 | `team_members` | References `teams` |
| 17 | `product_events` | Set `team_id = null` or delete where `team_id = <team_uuid>` |
| 18 | `teams` | Final deletion |

### SQL (run in Supabase SQL Editor)

```sql
-- Replace <TEAM_UUID> with the actual team UUID

-- 1. Verification feedback (via game_reports)
delete from public.verification_feedback
  where insight_id in (
    select ci.id from public.coaching_insights ci
    join public.game_reports gr on gr.id = ci.report_id
    join public.games g on g.id = gr.game_id
    where g.team_id = '<TEAM_UUID>'
  );

-- 2. Coaching insights
delete from public.coaching_insights
  where report_id in (
    select gr.id from public.game_reports gr
    join public.games g on g.id = gr.game_id
    where g.team_id = '<TEAM_UUID>'
  );

-- 3. Player reports
delete from public.player_reports
  where report_id in (
    select gr.id from public.game_reports gr
    join public.games g on g.id = gr.game_id
    where g.team_id = '<TEAM_UUID>'
  );

-- 4. Practice recommendations
delete from public.practice_recommendations
  where report_id in (
    select gr.id from public.game_reports gr
    join public.games g on g.id = gr.game_id
    where g.team_id = '<TEAM_UUID>'
  );

-- 5. Opponent tendencies
delete from public.opponent_tendencies
  where report_id in (
    select gr.id from public.game_reports gr
    join public.games g on g.id = gr.game_id
    where g.team_id = '<TEAM_UUID>'
  );

-- 6. Share links
delete from public.share_links
  where report_id in (
    select gr.id from public.game_reports gr
    join public.games g on g.id = gr.game_id
    where g.team_id = '<TEAM_UUID>'
  );

-- 7. Exports
delete from public.exports
  where report_id in (
    select gr.id from public.game_reports gr
    join public.games g on g.id = gr.game_id
    where g.team_id = '<TEAM_UUID>'
  );

-- 8. Game reports
delete from public.game_reports
  where game_id in (
    select id from public.games where team_id = '<TEAM_UUID>'
  );

-- 9. Analysis jobs
delete from public.analysis_jobs
  where game_id in (
    select id from public.games where team_id = '<TEAM_UUID>'
  );

-- 10. Clips
delete from public.clips
  where event_timestamp_id in (
    select et.id from public.event_timestamps et
    join public.games g on g.id = et.game_id
    where g.team_id = '<TEAM_UUID>'
  );

-- 11. Event timestamps
delete from public.event_timestamps
  where game_id in (
    select id from public.games where team_id = '<TEAM_UUID>'
  );

-- 12. Video assets
delete from public.video_assets
  where game_id in (
    select id from public.games where team_id = '<TEAM_UUID>'
  );

-- 13. Games
delete from public.games where team_id = '<TEAM_UUID>';

-- 14. Players
delete from public.players where team_id = '<TEAM_UUID>';

-- 15. Product events (anonymize rather than delete)
update public.product_events set team_id = null where team_id = '<TEAM_UUID>';

-- 16. Team members
delete from public.team_members where team_id = '<TEAM_UUID>';

-- 17. Team
delete from public.teams where id = '<TEAM_UUID>';
```

**After running SQL:** Delete storage objects (see step 13 above, and the Video Deletion Runbook).

### Risks of Partial Deletion

- **Orphaned storage objects:** If the database rows are deleted but storage objects are not, the video files remain in the bucket consuming space. Always delete storage objects as part of team deletion.
- **Broken share links:** Share links that reference deleted reports will return "Not found" — this is acceptable and safe.
- **FK constraint errors:** Run deletes in the order above. If a constraint error occurs, a row in a dependent table was missed. Add its deletion before retrying.

---

## 3. Game Data Deletion

To delete a single game and all associated data:

```sql
-- Replace <GAME_UUID> with the actual game UUID

delete from public.verification_feedback
  where insight_id in (
    select id from public.coaching_insights
    where report_id in (
      select id from public.game_reports where game_id = '<GAME_UUID>'
    )
  );

delete from public.coaching_insights
  where report_id in (select id from public.game_reports where game_id = '<GAME_UUID>');

delete from public.player_reports
  where report_id in (select id from public.game_reports where game_id = '<GAME_UUID>');

delete from public.practice_recommendations
  where report_id in (select id from public.game_reports where game_id = '<GAME_UUID>');

delete from public.opponent_tendencies
  where report_id in (select id from public.game_reports where game_id = '<GAME_UUID>');

delete from public.share_links
  where report_id in (select id from public.game_reports where game_id = '<GAME_UUID>');

delete from public.exports
  where report_id in (select id from public.game_reports where game_id = '<GAME_UUID>');

delete from public.game_reports where game_id = '<GAME_UUID>';
delete from public.analysis_jobs where game_id = '<GAME_UUID>';
delete from public.clips
  where event_timestamp_id in (
    select id from public.event_timestamps where game_id = '<GAME_UUID>'
  );
delete from public.event_timestamps where game_id = '<GAME_UUID>';
delete from public.video_assets where game_id = '<GAME_UUID>';
delete from public.games where id = '<GAME_UUID>';
```

Then delete the storage object: see [VIDEO_DELETION_RUNBOOK.md](VIDEO_DELETION_RUNBOOK.md).

---

## 4. Video-Only Deletion

See [VIDEO_DELETION_RUNBOOK.md](VIDEO_DELETION_RUNBOOK.md) for the complete process.

Summary:
1. Get the storage path from the `video_assets.storage_path` column
2. Delete the storage object in Supabase Dashboard → Storage → `game-videos`
3. Delete the `video_assets` row
4. Optionally update the `games` table to clear the `video_url` reference

---

## 5. Share Link Revocation / Deletion

See [SHARE_LINK_REVOCATION_RUNBOOK.md](SHARE_LINK_REVOCATION_RUNBOOK.md) for the complete process.

Summary:
- Single link: coach can revoke in-app from the Share modal
- All links for a report: SQL `delete from share_links where report_id = '<REPORT_UUID>'`
- All links for a team: SQL via join through games → game_reports → share_links

---

## 6. What Is Currently Automated vs. Manual

| Operation | Automated | Manual |
|-----------|-----------|--------|
| Revoke a single share link | ✅ In-app (coach can do this) | — |
| Delete a video from game detail | Partial (removes asset row — storage may need manual cleanup) | Storage object deletion |
| Full team deletion | ❌ | Founder via SQL + storage dashboard |
| User account deletion | ❌ | Founder via SQL + Supabase Auth dashboard |
| Storage object deletion | ❌ | Supabase Storage dashboard or API |
| Support request intake | ✅ Stored in DB automatically | Review and response by founder |

---

## 7. Recommended Founder Process for Deletion Requests

When a deletion request arrives via `/support`:

1. **Confirm identity:** Reply to the email on the support request confirming their name, email, and team name.
2. **Backup confirmation (optional):** Note the team UUID before deleting for reference.
3. **Run the appropriate SQL:** Team deletion SQL (Section 2) or game deletion SQL (Section 3).
4. **Delete storage objects:** Supabase Dashboard → Storage → `game-videos` → find the `{team_id}/` folder → delete all objects.
5. **Verify deletion:** Run a count query to confirm no rows remain for the team UUID.
6. **Confirm to the coach:** Respond to their support request (via email) confirming deletion is complete.
7. **Update support request status:** In Supabase → `support_requests` table, set `status = 'resolved'` and add `admin_notes` with the deletion date.

**Target: Complete within 24 hours of receiving the request.**

---

## 8. Future Self-Serve Deletion (Planned)

Self-serve deletion is planned for v1.1 as a P1 priority:
- Coach can delete their own team from the team settings page
- Triggers a soft-delete (30-day grace period) before permanent deletion
- Sends a confirmation email
- Storage objects are cleaned up by a background job

Until then, all deletions require founder involvement.

---

*See also: [`VIDEO_DELETION_RUNBOOK.md`](VIDEO_DELETION_RUNBOOK.md) · [`SHARE_LINK_REVOCATION_RUNBOOK.md`](SHARE_LINK_REVOCATION_RUNBOOK.md) · [`INCIDENT_RESPONSE_RUNBOOK.md`](INCIDENT_RESPONSE_RUNBOOK.md)*  
*Last updated: Prompt 23 — Pilot Support, Data Deletion, and Operational Runbook (June 2026)*
