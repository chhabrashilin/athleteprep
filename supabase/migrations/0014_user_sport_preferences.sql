-- Migration 0014: user_sport_preferences
-- Stores authenticated users' selected sport and onboarding state.
-- Anonymous users rely on localStorage only; this table requires auth.

-- ─── set_updated_at guard ────────────────────────────────────────────────────
-- The function is defined in migration 0001. Create it safely in case this
-- migration is applied to a fresh schema that hasn't run 0001 yet.
create or replace function public.set_updated_at()
  returns trigger
  language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Table ───────────────────────────────────────────────────────────────────
create table if not exists public.user_sport_preferences (
  id                            uuid        primary key default gen_random_uuid(),
  user_id                       uuid        not null references auth.users(id) on delete cascade,
  selected_sport                text        not null default 'general',
  onboarding_completed          boolean     not null default false,
  cricket_onboarding_completed  boolean     not null default false,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),

  constraint user_sport_preferences_user_id_key unique (user_id),
  constraint user_sport_preferences_sport_check check (
    selected_sport in ('general', 'cricket', 'baseball', 'basketball', 'soccer', 'football')
  )
);

-- ─── Updated-at trigger ──────────────────────────────────────────────────────
drop trigger if exists set_user_sport_preferences_updated_at on public.user_sport_preferences;
create trigger set_user_sport_preferences_updated_at
  before update on public.user_sport_preferences
  for each row execute function public.set_updated_at();

-- ─── Row-level security ──────────────────────────────────────────────────────
alter table public.user_sport_preferences enable row level security;

-- Users can only read their own row.
drop policy if exists "user_sport_preferences_select_own" on public.user_sport_preferences;
create policy "user_sport_preferences_select_own"
  on public.user_sport_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can insert their own row.
drop policy if exists "user_sport_preferences_insert_own" on public.user_sport_preferences;
create policy "user_sport_preferences_insert_own"
  on public.user_sport_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own row.
drop policy if exists "user_sport_preferences_update_own" on public.user_sport_preferences;
create policy "user_sport_preferences_update_own"
  on public.user_sport_preferences
  for update
  to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Index ───────────────────────────────────────────────────────────────────
create index if not exists user_sport_preferences_user_id_idx
  on public.user_sport_preferences (user_id);
