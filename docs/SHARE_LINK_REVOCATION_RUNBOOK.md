# GameIQ — Share Link Revocation Runbook

> This runbook covers how to revoke share links — both through the app (for coaches) and via Supabase (for the founder in emergency situations).

---

## 1. How Share Links Work

- Share links use 144-bit random tokens with a `giq_` prefix (e.g., `giq_abc123...`)
- Each link has a visibility mode: `public_summary`, `staff_only`, `player_specific`, or `private_link`
- Links can have an optional expiry date
- Links can be individually revoked
- The `is_revoked` flag is checked before any content is returned — revoked links show "Link revoked" to the visitor

---

## 2. Revoke a Single Share Link (In-App)

**Who can do this:** Coach, analyst, or team owner (staff role)

**How:**
1. Open the report in the app
2. Click **Share** in the report header
3. Find the active link in the Share modal
4. Click **Revoke** next to the link
5. Confirm revocation

**Expected result:** The link immediately returns "This link has been revoked" to any visitor.

**Verify:** Open the share URL in an incognito window — it should show the revocation message.

---

## 3. Revoke All Links for a Specific Report (SQL)

Use when a coach accidentally created a link with the wrong visibility mode and needs all links for a report disabled immediately.

```sql
-- Replace <REPORT_UUID> with the actual game_reports.id
update public.share_links
  set is_revoked = true, updated_at = now()
  where report_id = '<REPORT_UUID>'
    and is_revoked = false;
```

**Verify:**
```sql
select id, token, visibility_mode, is_revoked
from public.share_links
where report_id = '<REPORT_UUID>';
```
All rows should show `is_revoked = true`.

---

## 4. Revoke All Links for a Team (SQL)

Use when a team is being deleted, or when a security incident requires all links for a team to be disabled.

```sql
-- Replace <TEAM_UUID> with the actual teams.id
update public.share_links
  set is_revoked = true, updated_at = now()
  where report_id in (
    select gr.id
    from public.game_reports gr
    join public.games g on g.id = gr.game_id
    where g.team_id = '<TEAM_UUID>'
  )
  and is_revoked = false;
```

**Verify:**
```sql
select count(*) as active_links
from public.share_links sl
join public.game_reports gr on gr.id = sl.report_id
join public.games g on g.id = gr.game_id
where g.team_id = '<TEAM_UUID>'
  and sl.is_revoked = false;
```
Result should be 0.

---

## 5. Delete Share Links (Permanent)

Revocation is preferred over deletion because it leaves an audit trail. Only delete links when:
- The team or report is being permanently deleted
- A coach explicitly requests all trace of a link be removed

```sql
-- Delete all links for a specific report
delete from public.share_links where report_id = '<REPORT_UUID>';

-- Delete all links for a team (use as part of full team deletion)
delete from public.share_links
  where report_id in (
    select gr.id
    from public.game_reports gr
    join public.games g on g.id = gr.game_id
    where g.team_id = '<TEAM_UUID>'
  );
```

---

## 6. Verify a Link Is No Longer Accessible

After revoking or deleting a link:

1. Copy the share URL (format: `https://yourdomain.com/share/reports/giq_<token>`)
2. Open it in an incognito/private browser window
3. Expect to see: "This link has been revoked" or "Link not found"
4. If the link still shows content, check that:
   - The `is_revoked` flag is `true` in the `share_links` table
   - The Next.js cache has not cached the response (CDN edge caching)
   - The deployment is using the current code

---

## 7. What to Do If Private Data Was Accidentally Shared

**This is a privacy incident. Follow the Incident Response Runbook.**

Immediate steps:

1. **Revoke the link immediately** (Section 2 or 3 above)
2. **Verify revocation** by opening the URL in incognito
3. **Identify what was exposed:**
   - What visibility mode was the link?
   - What content is included in that mode?
   - Who was the link shared with?
4. **Assess the severity:**
   - `public_summary` — low sensitivity (only executive summary and insight titles, no player data)
   - `player_specific` — medium (one player's report section)
   - `staff_only` — high (full report, requires login — check if recipient was a team member)
   - `private_link` — high (full report visible without login)
5. **Notify the coach** that the link has been revoked and explain what was visible
6. **Document the incident** in the Incident Response log

---

## 8. What Share Links Include vs. Exclude

| Content | public_summary | staff_only | player_specific | private_link |
|---------|---------------|------------|-----------------|--------------|
| Executive summary | ✅ | ✅ | ✅ | ✅ |
| Insight titles | ✅ | ✅ | ✅ | ✅ |
| Insight details/evidence | ❌ | ✅ | ❌ | ✅ |
| Player reports | ❌ | ✅ | ✅ (one player only) | ✅ |
| Practice recommendations | ❌ | ✅ | ✅ (player's recs) | ✅ |
| Opponent tendencies | ❌ | ✅ | ❌ | ✅ |
| Video | ❌ | ❌ | ❌ | ❌ |
| Coach notes | ❌ | ❌ | ❌ | ❌ |
| Requires login | ❌ | ✅ | ❌ | ❌ |

**Video is never included in any share mode.** Coach notes and raw event data are not included.

---

## 9. Share Token Security Notes

- Tokens are generated with `crypto.randomBytes(18).toString('base64url')` — 144 bits of entropy
- The probability of guessing a valid token is negligible (1 in 2^144)
- Tokens are prefixed with `giq_` for easy identification in logs
- No rate limiting on token lookup is currently implemented (acceptable for 144-bit entropy; add rate limiting before public beta)

---

*See also: [`DATA_DELETION_PLAN.md`](DATA_DELETION_PLAN.md) · [`INCIDENT_RESPONSE_RUNBOOK.md`](INCIDENT_RESPONSE_RUNBOOK.md) · [`STORAGE_SECURITY.md`](STORAGE_SECURITY.md)*  
*Last updated: Prompt 23 — Pilot Support, Data Deletion, and Operational Runbook (June 2026)*
