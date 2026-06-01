-- =============================================================================
-- GameIQ — Storage Policies for game-videos bucket
-- File: 0003_storage_policies.sql
-- Apply: Run in Supabase SQL Editor OR Supabase Dashboard → Storage → Policies
--
-- NOTE: Supabase Storage policies live in the `storage` schema and are separate
-- from database table RLS policies. Some Supabase environments require applying
-- these via the Dashboard rather than via supabase db push.
--
-- See /docs/VIDEO_ASSETS.md and /docs/SUPABASE_SETUP.md for manual setup
-- instructions if this migration cannot be applied automatically.
--
-- Security model:
--   - The `game-videos` bucket is PRIVATE (no anonymous access).
--   - Authenticated users may upload, read, and delete objects.
--   - Path-based scoping (teams/{teamId}/games/{gameId}/...) provides
--     implicit team isolation. The application layer enforces team membership
--     via the `video_assets` table RLS before serving signed URLs.
--   - Signed URLs (1-hour TTL) are used for playback to avoid exposing direct
--     storage paths.
-- =============================================================================

-- Allow authenticated users to upload video files.
CREATE POLICY "game_videos_insert_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'game-videos' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to read (signed URL generation) video files.
CREATE POLICY "game_videos_select_authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'game-videos' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to update video metadata.
CREATE POLICY "game_videos_update_authenticated"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'game-videos' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to delete video files.
CREATE POLICY "game_videos_delete_authenticated"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'game-videos' AND auth.uid() IS NOT NULL);
