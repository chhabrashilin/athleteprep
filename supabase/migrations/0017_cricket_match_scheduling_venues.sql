-- ---------------------------------------------------------------------------
-- 0017_cricket_match_scheduling_venues.sql
-- Cricket Match Scheduling & Venue Management — Prompt 31
--
-- Safely extends cricket_venues and cricket_matches with scheduling columns.
-- Adds: cricket_match_officials, cricket_venue_availability,
--       cricket_schedule_change_logs, cricket_schedule_generation_runs.
-- Adds helper SQL functions for match/venue management.
-- Adds all indexes and updated_at triggers.
-- RLS uses existing league helper functions to avoid recursion.
--
-- Safe to run multiple times: IF NOT EXISTS / DO blocks throughout.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- 0. Ensure set_updated_at function exists (from migration 0001/0013)
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------------
-- 1. Extend cricket_venues with scheduling/facility columns
-- ---------------------------------------------------------------------------

alter table public.cricket_venues
  add column if not exists short_name             text,
  add column if not exists venue_type             text        not null default 'ground',
  add column if not exists capacity               integer,
  add column if not exists timezone               text        not null default 'America/New_York',
  add column if not exists contact_name           text,
  add column if not exists contact_email          text,
  add column if not exists contact_phone          text,
  add column if not exists booking_notes          text,
  add column if not exists pitch_type             text,
  add column if not exists boundary_size_meters   integer,
  add column if not exists has_lights             boolean     not null default false,
  add column if not exists has_turf_pitch         boolean     not null default false,
  add column if not exists has_matting_pitch      boolean     not null default false,
  add column if not exists has_practice_nets      boolean     not null default false,
  add column if not exists has_changing_rooms     boolean     not null default false,
  add column if not exists has_parking            boolean     not null default false,
  add column if not exists is_active              boolean     not null default true,
  add column if not exists archived_at            timestamptz;

-- venue_type constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_venues_venue_type_check'
      and conrelid = 'public.cricket_venues'::regclass
  ) then
    alter table public.cricket_venues
      add constraint cricket_venues_venue_type_check
      check (venue_type in ('ground','stadium','school','university','indoor','practice_facility','other'));
  end if;
end;
$$;

-- capacity positive check
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_venues_capacity_positive'
      and conrelid = 'public.cricket_venues'::regclass
  ) then
    alter table public.cricket_venues
      add constraint cricket_venues_capacity_positive
      check (capacity is null or capacity > 0);
  end if;
end;
$$;

-- boundary size positive check
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_venues_boundary_size_positive'
      and conrelid = 'public.cricket_venues'::regclass
  ) then
    alter table public.cricket_venues
      add constraint cricket_venues_boundary_size_positive
      check (boundary_size_meters is null or boundary_size_meters > 0);
  end if;
end;
$$;

-- Indexes on cricket_venues
create index if not exists cricket_venues_slug_idx   on public.cricket_venues(slug);
create index if not exists cricket_venues_city_idx   on public.cricket_venues(city);
create index if not exists cricket_venues_active_idx on public.cricket_venues(is_active);

-- updated_at trigger on cricket_venues
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'cricket_venues_updated_at'
  ) then
    create trigger cricket_venues_updated_at
      before update on public.cricket_venues
      for each row execute function public.set_updated_at();
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 2. Extend cricket_matches with scheduling/publish columns
-- ---------------------------------------------------------------------------

alter table public.cricket_matches
  add column if not exists slug                   text,
  add column if not exists match_number           integer,
  add column if not exists round_name             text,
  add column if not exists group_name             text,
  add column if not exists stage                  text,
  add column if not exists title                  text,
  add column if not exists scheduled_end          timestamptz,
  add column if not exists timezone               text        not null default 'America/New_York',
  add column if not exists publish_status         text        not null default 'draft',
  add column if not exists schedule_status        text        not null default 'unscheduled',
  add column if not exists home_team_label        text,
  add column if not exists away_team_label        text,
  add column if not exists neutral_match          boolean     not null default false,
  add column if not exists scorer_user_id         uuid        references auth.users(id) on delete set null,
  add column if not exists primary_umpire_name    text,
  add column if not exists secondary_umpire_name  text,
  add column if not exists match_referee_name     text,
  add column if not exists livestream_url         text,
  add column if not exists notes                  text,
  add column if not exists internal_notes         text,
  add column if not exists weather_notes          text,
  add column if not exists cancellation_reason    text,
  add column if not exists rescheduled_from       timestamptz,
  add column if not exists published_at           timestamptz,
  add column if not exists archived_at            timestamptz;

-- slug unique index (partial, only when slug is not null)
create unique index if not exists cricket_matches_slug_unique_idx
  on public.cricket_matches(slug)
  where slug is not null;

-- publish_status constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_matches_publish_status_check'
      and conrelid = 'public.cricket_matches'::regclass
  ) then
    alter table public.cricket_matches
      add constraint cricket_matches_publish_status_check
      check (publish_status in ('draft','published','hidden','archived'));
  end if;
end;
$$;

-- schedule_status constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_matches_schedule_status_check'
      and conrelid = 'public.cricket_matches'::regclass
  ) then
    alter table public.cricket_matches
      add constraint cricket_matches_schedule_status_check
      check (schedule_status in ('unscheduled','scheduled','rescheduled','postponed','cancelled','completed'));
  end if;
end;
$$;

-- match_number positive check
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_matches_match_number_positive'
      and conrelid = 'public.cricket_matches'::regclass
  ) then
    alter table public.cricket_matches
      add constraint cricket_matches_match_number_positive
      check (match_number is null or match_number > 0);
  end if;
end;
$$;

-- Indexes on cricket_matches
create index if not exists cricket_matches_slug_idx            on public.cricket_matches(slug)            where slug is not null;
create index if not exists cricket_matches_league_id_idx       on public.cricket_matches(league_id);
create index if not exists cricket_matches_home_team_idx       on public.cricket_matches(home_team_id);
create index if not exists cricket_matches_away_team_idx       on public.cricket_matches(away_team_id);
create index if not exists cricket_matches_venue_id_idx        on public.cricket_matches(venue_id);
create index if not exists cricket_matches_scheduled_start_idx on public.cricket_matches(scheduled_start);
create index if not exists cricket_matches_schedule_status_idx on public.cricket_matches(schedule_status);
create index if not exists cricket_matches_publish_status_idx  on public.cricket_matches(publish_status);

-- updated_at trigger on cricket_matches
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'cricket_matches_updated_at'
  ) then
    create trigger cricket_matches_updated_at
      before update on public.cricket_matches
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

-- Update cricket_matches INSERT/UPDATE policies to use league management check
drop policy if exists "cricket_matches_insert" on public.cricket_matches;
drop policy if exists "cricket_matches_update" on public.cricket_matches;

create policy "cricket_matches_insert"
  on public.cricket_matches for insert
  to authenticated
  with check (
    created_by = auth.uid()
    or (league_id is not null and public.user_can_manage_cricket_league(league_id, auth.uid()))
  );

create policy "cricket_matches_update"
  on public.cricket_matches for update
  to authenticated
  using (
    created_by = auth.uid()
    or (league_id is not null and public.user_can_manage_cricket_league(league_id, auth.uid()))
  );


-- ---------------------------------------------------------------------------
-- 3. cricket_match_officials
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_match_officials (
  id            uuid        primary key default gen_random_uuid(),
  match_id      uuid        not null references public.cricket_matches(id) on delete cascade,
  user_id       uuid        references auth.users(id) on delete set null,
  name          text,
  email         text,
  role          text        not null,
  status        text        not null default 'assigned',
  assigned_by   uuid        references auth.users(id) on delete set null,
  assigned_at   timestamptz not null default now(),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint cricket_match_officials_role_check
    check (role in ('scorer','umpire','square_leg_umpire','match_referee','ground_manager','stream_operator','admin','other')),
  constraint cricket_match_officials_status_check
    check (status in ('assigned','accepted','declined','replaced','removed'))
);

create index if not exists cricket_match_officials_match_idx on public.cricket_match_officials(match_id);
create index if not exists cricket_match_officials_user_idx  on public.cricket_match_officials(user_id);
create index if not exists cricket_match_officials_role_idx  on public.cricket_match_officials(role);

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'cricket_match_officials_updated_at'
  ) then
    create trigger cricket_match_officials_updated_at
      before update on public.cricket_match_officials
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.cricket_match_officials enable row level security;

-- League owner/admin/manager can read officials for matches in their league
create policy "cricket_match_officials_read"
  on public.cricket_match_officials for select
  to authenticated
  using (
    -- assigned user can read their own assignment
    user_id = auth.uid()
    or exists (
      select 1 from public.cricket_matches m
      where m.id = match_id
        and m.league_id is not null
        and public.user_can_manage_cricket_league(m.league_id, auth.uid())
    )
  );

create policy "cricket_match_officials_insert"
  on public.cricket_match_officials for insert
  to authenticated
  with check (
    assigned_by = auth.uid()
    and exists (
      select 1 from public.cricket_matches m
      where m.id = match_id
        and m.league_id is not null
        and public.user_can_manage_cricket_league(m.league_id, auth.uid())
    )
  );

create policy "cricket_match_officials_update"
  on public.cricket_match_officials for update
  to authenticated
  using (
    exists (
      select 1 from public.cricket_matches m
      where m.id = match_id
        and m.league_id is not null
        and public.user_can_manage_cricket_league(m.league_id, auth.uid())
    )
  );

create policy "cricket_match_officials_delete"
  on public.cricket_match_officials for delete
  to authenticated
  using (
    exists (
      select 1 from public.cricket_matches m
      where m.id = match_id
        and m.league_id is not null
        and public.user_can_manage_cricket_league(m.league_id, auth.uid())
    )
  );


-- ---------------------------------------------------------------------------
-- 4. cricket_venue_availability
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_venue_availability (
  id           uuid        primary key default gen_random_uuid(),
  venue_id     uuid        not null references public.cricket_venues(id) on delete cascade,
  day_of_week  integer     not null,
  start_time   time        not null,
  end_time     time        not null,
  is_available boolean     not null default true,
  notes        text,
  created_by   uuid        references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint cricket_venue_availability_day_check
    check (day_of_week between 0 and 6),
  constraint cricket_venue_availability_time_check
    check (start_time < end_time)
);

create index if not exists cricket_venue_availability_venue_idx on public.cricket_venue_availability(venue_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'cricket_venue_availability_updated_at'
  ) then
    create trigger cricket_venue_availability_updated_at
      before update on public.cricket_venue_availability
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.cricket_venue_availability enable row level security;

create policy "cricket_venue_availability_read"
  on public.cricket_venue_availability for select
  to authenticated
  using (true);

create policy "cricket_venue_availability_insert"
  on public.cricket_venue_availability for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "cricket_venue_availability_update"
  on public.cricket_venue_availability for update
  to authenticated
  using (created_by = auth.uid());


-- ---------------------------------------------------------------------------
-- 5. cricket_schedule_change_logs
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_schedule_change_logs (
  id             uuid        primary key default gen_random_uuid(),
  league_id      uuid        references public.cricket_leagues(id) on delete cascade,
  match_id       uuid        references public.cricket_matches(id) on delete cascade,
  actor_user_id  uuid        references auth.users(id) on delete set null,
  action         text        not null,
  old_value      jsonb       not null default '{}'::jsonb,
  new_value      jsonb       not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists cricket_schedule_change_logs_league_idx on public.cricket_schedule_change_logs(league_id);
create index if not exists cricket_schedule_change_logs_match_idx  on public.cricket_schedule_change_logs(match_id);
create index if not exists cricket_schedule_change_logs_actor_idx  on public.cricket_schedule_change_logs(actor_user_id);

alter table public.cricket_schedule_change_logs enable row level security;

create policy "cricket_schedule_change_logs_read"
  on public.cricket_schedule_change_logs for select
  to authenticated
  using (
    league_id is not null
    and public.user_can_manage_cricket_league(league_id, auth.uid())
  );

create policy "cricket_schedule_change_logs_insert"
  on public.cricket_schedule_change_logs for insert
  to authenticated
  with check (actor_user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 6. cricket_schedule_generation_runs
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_schedule_generation_runs (
  id              uuid        primary key default gen_random_uuid(),
  league_id       uuid        not null references public.cricket_leagues(id) on delete cascade,
  generated_by    uuid        references auth.users(id) on delete set null,
  algorithm       text        not null default 'round_robin_v1',
  input           jsonb       not null default '{}'::jsonb,
  output_summary  jsonb       not null default '{}'::jsonb,
  status          text        not null default 'completed',
  created_at      timestamptz not null default now(),
  constraint cricket_schedule_gen_runs_status_check
    check (status in ('completed','failed','partial'))
);

create index if not exists cricket_schedule_generation_runs_league_idx
  on public.cricket_schedule_generation_runs(league_id);

alter table public.cricket_schedule_generation_runs enable row level security;

create policy "cricket_schedule_generation_runs_read"
  on public.cricket_schedule_generation_runs for select
  to authenticated
  using (
    public.user_can_manage_cricket_league(league_id, auth.uid())
  );

create policy "cricket_schedule_generation_runs_insert"
  on public.cricket_schedule_generation_runs for insert
  to authenticated
  with check (
    generated_by = auth.uid()
    and public.user_can_manage_cricket_league(league_id, auth.uid())
  );


-- ---------------------------------------------------------------------------
-- 7. SQL helper functions
-- ---------------------------------------------------------------------------

-- user_can_manage_cricket_match: true if user can manage the league that owns the match
create or replace function public.user_can_manage_cricket_match(
  _match_id uuid,
  _user_id  uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cricket_matches m
    where m.id = _match_id
      and m.league_id is not null
      and public.user_can_manage_cricket_league(m.league_id, _user_id)
  )
  or exists (
    select 1 from public.cricket_matches
    where id = _match_id and created_by = _user_id
  );
$$;

-- user_can_view_cricket_match: true for league/team members or public published matches
create or replace function public.user_can_view_cricket_match(
  _match_id uuid,
  _user_id  uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- match manager
    public.user_can_manage_cricket_match(_match_id, _user_id)
    or
    -- league member
    exists (
      select 1
      from public.cricket_matches m
      join public.cricket_league_members lm on lm.league_id = m.league_id
      where m.id = _match_id and lm.user_id = _user_id
    )
    or
    -- published public match (league allows public scorecards)
    exists (
      select 1
      from public.cricket_matches m
      join public.cricket_leagues l on l.id = m.league_id
      where m.id = _match_id
        and m.publish_status = 'published'
        and l.allow_public_scorecards = true
    );
$$;

-- Update cricket_venues RLS to use league management (venues are shared resources)
-- Authenticated users can read active venues
drop policy if exists "cricket_venues_read" on public.cricket_venues;
create policy "cricket_venues_read"
  on public.cricket_venues for select
  to authenticated
  using (is_active = true or created_by = auth.uid());

drop policy if exists "cricket_venues_insert" on public.cricket_venues;
create policy "cricket_venues_insert"
  on public.cricket_venues for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "cricket_venues_update" on public.cricket_venues;
create policy "cricket_venues_update"
  on public.cricket_venues for update
  to authenticated
  using (created_by = auth.uid());
