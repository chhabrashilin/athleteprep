-- Migration 0007: Add verification and editing fields to tables that were
-- missing them (practice_recommendations and opponent_tendencies).
-- coaching_insights and player_reports already have these columns from 0001.

alter table public.practice_recommendations
  add column if not exists verification_status verification_status not null default 'unreviewed',
  add column if not exists is_edited           boolean            not null default false,
  add column if not exists original_ai_content jsonb;

alter table public.opponent_tendencies
  add column if not exists verification_status verification_status not null default 'unreviewed',
  add column if not exists is_edited           boolean            not null default false,
  add column if not exists original_ai_content jsonb;

create index if not exists practice_recs_verification_idx
  on public.practice_recommendations(verification_status);

create index if not exists opponent_tendencies_verification_idx
  on public.opponent_tendencies(verification_status);
