-- P1-4: Add database-level UNIQUE constraint on share_links.token
-- Idempotent version: only adds the constraint if it does not already exist.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'share_links_token_key'
      AND conrelid = 'public.share_links'::regclass
  ) THEN
    ALTER TABLE public.share_links
      ADD CONSTRAINT share_links_token_key UNIQUE (token);
  END IF;
END $$;