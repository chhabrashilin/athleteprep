# GameIQ — Storage Security

> This document describes the storage architecture, privacy model, and production security posture for all Supabase Storage buckets used by GameIQ.

---

## Buckets Overview

| Bucket | Purpose | Privacy | Status |
|--------|---------|---------|--------|
| `game-videos` | Uploaded game and practice video files | **Private** — signed URLs only | Active in v1 |
| `game-thumbnails` | Video thumbnail images | **Private** — signed URLs only | Placeholder in v1 |
| `report-exports` | Server-side export artifacts | **Private** — not yet used | Placeholder in v1 |

**All buckets are private.** No bucket is public. There are no public-read objects.

---

## game-videos

### Purpose

Stores full game and practice video files uploaded by coaches and analysts. This is the primary storage bucket in v1.

### Privacy Model

- **Bucket access:** Private (not public). Supabase enforces this at the infrastructure level.
- **Read access:** Only authenticated users who are members of the team that owns the video.
- **Write access:** Only authenticated users with `owner`, `coach`, or `analyst` roles on the team.
- **Anonymous access:** Rejected at the storage policy level.
- **Shared reports:** Video is **never included** in any shared report view. The `canShowVideo` flag is always `false` in the `buildSharedReportViewModel` function, regardless of share visibility mode.

### Object Path Structure

```
game-videos/
  {team_id}/
    {game_id}/
      {filename}
```

Example: `game-videos/550e8400-e29b-41d4-a716-446655440000/c56a4180-65aa-4ec7-b784-d1d5ad71a77d/match_vs_lakeside.mp4`

The team UUID in the path is validated against `team_members` in the storage policy. This prevents users from guessing or constructing paths to access other teams' videos.

### Signed URL Strategy

- Server-side only: signed URLs are generated using the **service role client** in Server Components and Route Handlers.
- TTL: **3600 seconds (1 hour)**.
- The signed URL is returned to the browser for video playback. It is **never stored** in the database or included in share links.
- After 1 hour, the browser must reload the page to receive a fresh signed URL. This is a known limitation documented in [`KNOWN_LIMITATIONS.md`](KNOWN_LIMITATIONS.md).
- Signed URLs contain a short-lived HMAC signature. They cannot be extended or forged without the service role key.

### Upload Permissions

```sql
-- Team staff (owner, coach, analyst) can upload
create policy "game_videos_upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'game-videos'
  and auth.uid() is not null
  and (storage.foldername(name))[1] in (
    select team_id::text from team_members
    where user_id = auth.uid()
    and role in ('owner', 'coach', 'analyst')
  )
);
```

### Read Permissions

```sql
-- All team members can read (for playback)
create policy "game_videos_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'game-videos'
  and auth.uid() is not null
  and (storage.foldername(name))[1] in (
    select team_id::text from team_members
    where user_id = auth.uid()
  )
);
```

### Delete Permissions

```sql
-- Only team staff can delete uploaded videos
create policy "game_videos_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'game-videos'
  and auth.uid() is not null
  and (storage.foldername(name))[1] in (
    select team_id::text from team_members
    where user_id = auth.uid()
    and role in ('owner', 'coach', 'analyst')
  )
);
```

### Public Sharing Policy

**Video is never shared publicly.** Even for `private_link` (public URL) share modes, the shared report view model sets `canShowVideo = false`. Shared reports show all text content (insights, player reports, practice recommendations, opponent tendencies) but never include a video player or signed URL.

This is intentional for v1:
- Sharing signed video URLs with unknown recipients raises copyright concerns.
- Bandwidth costs for video delivery are not yet controlled.
- Coach opt-in for video sharing is planned for a future release.

---

## game-thumbnails

### Purpose

Placeholder for future video thumbnail images extracted server-side. Not used in v1.

### Privacy Model

Private bucket. Same team-scoped access model as `game-videos`. No objects are written here in v1.

---

## report-exports

### Purpose

Placeholder for server-side PDF export artifacts. Not used in v1. Currently, exports use browser print-to-PDF (`window.print()`), which produces no server-side artifact.

### Privacy Model

Private bucket. Only the generating user's team can access exports. No objects are written here in v1.

---

## Known Limitations

| Limitation | Severity | Mitigation |
|------------|----------|-----------|
| Signed URLs expire after 1 hour | Low | Reload page for a fresh URL |
| Video sharing not supported in any share mode | Low — intentional | Documented in KNOWN_LIMITATIONS.md |
| No server-side thumbnail generation | Low | Planned for v1.1 |
| Storage policies use authenticated check only for `game_thumbnails` and `report-exports` | Low | Buckets have no objects in v1 |

---

## Production Verification Checklist

Before inviting any pilot coach:

- [ ] `game-videos` bucket is private (not public) in Supabase Dashboard → Storage
- [ ] `game-thumbnails` bucket is private
- [ ] `report-exports` bucket is private
- [ ] Upload a test video → succeeds ✓
- [ ] Access the bucket URL directly (without signed URL) → 403 Forbidden ✓
- [ ] Open a shared report link → no video player shown ✓
- [ ] Storage policies from `0003_storage_policies.sql` are applied ✓
- [ ] `NEXT_PUBLIC_STORAGE_BUCKET=game-videos` matches the bucket name exactly ✓
- [ ] Service role key is **not** in any `NEXT_PUBLIC_` variable ✓
- [ ] `.gitignore` excludes all `.env*` files ✓

---

## Data Privacy Note for Pilot Coaches

During pilot onboarding, coaches should be told:

> "Your game video is stored in a private cloud storage bucket (Supabase/AWS S3). It is not shared with any third party. Only members of your team workspace can access it. Videos are never included in shared report links. You can request deletion of all your data at any time by contacting us — we will remove your team, all associated data, and all uploaded video files within 24 hours."

See [`DATA_PRIVACY_REVIEW.md`](DATA_PRIVACY_REVIEW.md) for the full privacy posture.

---

*See also: [`PRODUCTION_SUPABASE_CHECKLIST.md`](PRODUCTION_SUPABASE_CHECKLIST.md) · [`KNOWN_LIMITATIONS.md`](KNOWN_LIMITATIONS.md) · [`RLS_POLICIES.md`](RLS_POLICIES.md)*  
*Last updated: Prompt 22 — Pilot Deployment and Production Environment Setup (June 2026)*
