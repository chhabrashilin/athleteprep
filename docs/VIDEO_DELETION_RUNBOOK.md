# GameIQ — Video Deletion Runbook

> This runbook covers how to delete video files uploaded to Supabase Storage, how to handle mismatches between database rows and storage objects, and cleanup for failed uploads.

---

## 1. How Video Storage Works

- Videos are uploaded to the `game-videos` Supabase Storage bucket
- Object path format: `game-videos/{team_id}/{game_id}/{filename}`
- The `video_assets` table stores metadata: `storage_path`, `file_name`, `file_size`, `mime_type`, `status`
- Signed URLs for playback are generated server-side with a 1-hour TTL
- The bucket is **private** — objects cannot be accessed directly without a signed URL

---

## 2. Find the Storage Path for a Video

Before deleting, get the exact storage path:

```sql
-- Find video assets for a game
select id, game_id, storage_path, file_name, status, created_at
from public.video_assets
where game_id = '<GAME_UUID>';

-- Find video assets for a team
select va.id, va.game_id, va.storage_path, va.file_name, va.status
from public.video_assets va
join public.games g on g.id = va.game_id
where g.team_id = '<TEAM_UUID>';
```

The `storage_path` column contains the full path relative to the bucket root (e.g., `team_uuid/game_uuid/filename.mp4`).

---

## 3. Delete a Video Via Supabase Dashboard

**Who:** Founder (admin)

**Steps:**
1. Go to Supabase Dashboard → **Storage** → `game-videos` bucket
2. Navigate the folder tree: `{team_id}/` → `{game_id}/`
3. Find the video file by name
4. Select the file → **Delete**
5. Confirm deletion

After deleting the storage object:

```sql
-- Delete the video_assets row
delete from public.video_assets where id = '<VIDEO_ASSET_UUID>';

-- Optionally clear the games.video_url reference if set
update public.games set video_url = null where id = '<GAME_UUID>';
```

---

## 4. Delete a Video Via Supabase API (Programmatic)

For batch deletions or automation:

```bash
# Using Supabase CLI (requires service role key)
# List objects in a team's folder
supabase storage ls game-videos/{team_id}/

# Remove a specific object
supabase storage rm game-videos/{team_id}/{game_id}/filename.mp4
```

Or via the JavaScript client (server-side, service role only):

```typescript
const supabase = createServiceSupabaseClient();
const { error } = await supabase.storage
  .from("game-videos")
  .remove([`${teamId}/${gameId}/${fileName}`]);
```

---

## 5. Verify a Video Is Deleted

After deletion:
1. Try to generate a signed URL for the deleted path — it should fail or return a "not found" error
2. Check Supabase Storage dashboard — the file should no longer appear
3. Check the `video_assets` row — it should be deleted
4. If a coach tries to play the video in the app, the player should show an error (not a 500 crash)

---

## 6. Handle DB Row vs. Storage Object Mismatch

**Scenario A: Storage object exists, but `video_assets` row is deleted**
- The storage object consumes space but is inaccessible through the app
- Fix: Delete the orphaned storage object via the dashboard
- Run a monthly check: query `video_assets.storage_path` values and compare against bucket contents

**Scenario B: `video_assets` row exists, but storage object is deleted**
- The app shows a video player that fails to load
- Fix: Delete the `video_assets` row from the database
- The signed URL generation will fail silently; the player will show an error

**Detection query:**
```sql
-- List all video_assets with their storage paths for manual cross-check
select va.id, va.storage_path, va.status, g.team_id, g.id as game_id
from public.video_assets va
join public.games g on g.id = va.game_id
order by va.created_at desc;
```
Compare these paths against the objects visible in the Supabase Storage dashboard.

---

## 7. Handle Failed Upload Cleanup

If a video upload fails partway through:
- A partial object may exist in the `game-videos` bucket
- The `video_assets` row may have `status = 'uploading'` or `status = 'failed'`

**Cleanup:**
```sql
-- Find stuck/failed uploads older than 24 hours
select id, storage_path, status, created_at
from public.video_assets
where status in ('uploading', 'failed')
  and created_at < now() - interval '24 hours';
```

For each row:
1. Check if the storage object exists (Supabase dashboard → Storage)
2. If it exists, delete it via the dashboard
3. Delete the `video_assets` row

**Recommended frequency:** Run this cleanup check weekly during the pilot.

---

## 8. Team Deletion — Video Cleanup

When deleting a full team (see `DATA_DELETION_PLAN.md`):

1. Get all storage paths for the team:
```sql
select va.storage_path
from public.video_assets va
join public.games g on g.id = va.game_id
where g.team_id = '<TEAM_UUID>';
```

2. In Supabase Dashboard → Storage → `game-videos`:
   - Navigate to the `{team_id}/` folder
   - Select all → **Delete**

3. This deletes all videos for all games in the team folder at once.

4. Run the DB deletion SQL from `DATA_DELETION_PLAN.md` which handles `video_assets` rows.

---

## 9. Future Improvements

| Improvement | Priority | Notes |
|-------------|---------|-------|
| In-app video delete button (staff role) | P2 | Coach can delete their own video from the game page |
| Automatic cleanup of failed uploads | P2 | Background job to clean up `status = 'failed'` rows and storage objects |
| Storage lifecycle policy | P2 | Supabase Storage lifecycle to auto-delete objects in archived-team folders |
| Admin delete tooling | P3 | Admin UI for listing and deleting storage paths without needing the dashboard |

---

*See also: [`DATA_DELETION_PLAN.md`](DATA_DELETION_PLAN.md) · [`STORAGE_SECURITY.md`](STORAGE_SECURITY.md) · [`INCIDENT_RESPONSE_RUNBOOK.md`](INCIDENT_RESPONSE_RUNBOOK.md)*  
*Last updated: Prompt 23 — Pilot Support, Data Deletion, and Operational Runbook (June 2026)*
