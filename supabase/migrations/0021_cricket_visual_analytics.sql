-- ---------------------------------------------------------------------------
-- 0021_cricket_visual_analytics.sql
-- Cricket Visual Analytics Foundation — Prompt 35
--
-- Extends cricket_ball_events with shot/phase metadata columns.
-- Adds: cricket_match_analytics_snapshots,
--       cricket_player_analytics_snapshots,
--       cricket_team_analytics_snapshots.
-- Adds indexes and RLS policies.
--
-- Safe to run multiple times: IF NOT EXISTS / DO blocks throughout.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- 1. Extend cricket_ball_events with visual analytics columns
-- ---------------------------------------------------------------------------

alter table public.cricket_ball_events
  add column if not exists shot_x                     numeric,
  add column if not exists shot_y                     numeric,
  add column if not exists wagon_zone                 text,
  add column if not exists wagon_angle_degrees        numeric,
  add column if not exists wagon_distance_meters      numeric,
  add column if not exists bat_contact_type           text,
  add column if not exists batting_phase              text,
  add column if not exists bowling_phase              text,
  add column if not exists pressure_index             numeric,
  add column if not exists momentum_delta             numeric,
  add column if not exists expected_runs              numeric,
  add column if not exists expected_wicket_probability numeric;

-- bat_contact_type constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_ball_events_bat_contact_check'
      and conrelid = 'public.cricket_ball_events'::regclass
  ) then
    alter table public.cricket_ball_events
      add constraint cricket_ball_events_bat_contact_check
      check (bat_contact_type is null or bat_contact_type in (
        'middle','edge','inside_edge','top_edge','missed','pad','unknown'
      ));
  end if;
end;
$$;

-- batting_phase constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_ball_events_batting_phase_check'
      and conrelid = 'public.cricket_ball_events'::regclass
  ) then
    alter table public.cricket_ball_events
      add constraint cricket_ball_events_batting_phase_check
      check (batting_phase is null or batting_phase in (
        'powerplay','middle_overs','death_overs',
        'chase_setup','chase_finish','unknown'
      ));
  end if;
end;
$$;

-- bowling_phase constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_ball_events_bowling_phase_check'
      and conrelid = 'public.cricket_ball_events'::regclass
  ) then
    alter table public.cricket_ball_events
      add constraint cricket_ball_events_bowling_phase_check
      check (bowling_phase is null or bowling_phase in (
        'new_ball','middle_overs','death_overs',
        'spin_phase','pace_phase','unknown'
      ));
  end if;
end;
$$;

-- Indexes for new analytics columns
create index if not exists cricket_ball_events_wagon_zone_idx
  on public.cricket_ball_events(wagon_zone)
  where wagon_zone is not null;

create index if not exists cricket_ball_events_batting_phase_idx
  on public.cricket_ball_events(batting_phase)
  where batting_phase is not null;

create index if not exists cricket_ball_events_bowling_phase_idx
  on public.cricket_ball_events(bowling_phase)
  where bowling_phase is not null;


-- ---------------------------------------------------------------------------
-- 2. cricket_match_analytics_snapshots
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_match_analytics_snapshots (
  id             uuid        primary key default gen_random_uuid(),
  match_id       uuid        not null references public.cricket_matches(id) on delete cascade,
  league_id      uuid        references public.cricket_leagues(id) on delete cascade,
  snapshot_type  text        not null,
  generated_by   uuid        references auth.users(id) on delete set null,
  data           jsonb       not null default '{}'::jsonb,
  summary        jsonb       not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  constraint cricket_match_analytics_snapshot_type_check
    check (snapshot_type in (
      'worm_chart','manhattan_chart','run_rate_graph','wagon_wheel',
      'partnerships','momentum','phase_summary','full_match_analytics'
    ))
);

create index if not exists cricket_match_analytics_snapshots_match_idx
  on public.cricket_match_analytics_snapshots(match_id);
create index if not exists cricket_match_analytics_snapshots_type_idx
  on public.cricket_match_analytics_snapshots(snapshot_type);

alter table public.cricket_match_analytics_snapshots enable row level security;


-- ---------------------------------------------------------------------------
-- 3. cricket_player_analytics_snapshots
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_player_analytics_snapshots (
  id             uuid        primary key default gen_random_uuid(),
  player_id      uuid        not null references public.cricket_players(id) on delete cascade,
  league_id      uuid        references public.cricket_leagues(id) on delete cascade,
  team_id        uuid        references public.cricket_teams(id) on delete set null,
  snapshot_type  text        not null,
  generated_by   uuid        references auth.users(id) on delete set null,
  data           jsonb       not null default '{}'::jsonb,
  summary        jsonb       not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  constraint cricket_player_analytics_snapshot_type_check
    check (snapshot_type in (
      'batting_wagon_wheel','scoring_zones','phase_performance',
      'bowling_lengths','player_momentum','full_player_analytics'
    ))
);

create index if not exists cricket_player_analytics_snapshots_player_idx
  on public.cricket_player_analytics_snapshots(player_id);
create index if not exists cricket_player_analytics_snapshots_type_idx
  on public.cricket_player_analytics_snapshots(snapshot_type);

alter table public.cricket_player_analytics_snapshots enable row level security;


-- ---------------------------------------------------------------------------
-- 4. cricket_team_analytics_snapshots
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_team_analytics_snapshots (
  id             uuid        primary key default gen_random_uuid(),
  team_id        uuid        not null references public.cricket_teams(id) on delete cascade,
  league_id      uuid        references public.cricket_leagues(id) on delete cascade,
  snapshot_type  text        not null,
  generated_by   uuid        references auth.users(id) on delete set null,
  data           jsonb       not null default '{}'::jsonb,
  summary        jsonb       not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  constraint cricket_team_analytics_snapshot_type_check
    check (snapshot_type in (
      'team_scoring_phases','team_wicket_phases','run_rate_profile',
      'bowling_pressure','full_team_analytics'
    ))
);

create index if not exists cricket_team_analytics_snapshots_team_idx
  on public.cricket_team_analytics_snapshots(team_id);
create index if not exists cricket_team_analytics_snapshots_type_idx
  on public.cricket_team_analytics_snapshots(snapshot_type);

alter table public.cricket_team_analytics_snapshots enable row level security;


-- ---------------------------------------------------------------------------
-- 5. RLS policies — cricket_match_analytics_snapshots
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_match_analytics_snapshots'
      and policyname = 'cricket_match_analytics_snapshots_read'
  ) then
    create policy "cricket_match_analytics_snapshots_read"
      on public.cricket_match_analytics_snapshots for select
      to authenticated
      using (
        public.user_can_view_cricket_scorecard(match_id, auth.uid())
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_match_analytics_snapshots'
      and policyname = 'cricket_match_analytics_snapshots_insert'
  ) then
    create policy "cricket_match_analytics_snapshots_insert"
      on public.cricket_match_analytics_snapshots for insert
      to authenticated
      with check (
        public.user_can_manage_cricket_match(match_id, auth.uid())
        or (
          league_id is not null
          and public.user_can_rebuild_cricket_stats(league_id, auth.uid())
        )
      );
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 6. RLS policies — cricket_player_analytics_snapshots
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_player_analytics_snapshots'
      and policyname = 'cricket_player_analytics_snapshots_read'
  ) then
    create policy "cricket_player_analytics_snapshots_read"
      on public.cricket_player_analytics_snapshots for select
      to authenticated
      using (
        league_id is null
        or public.user_can_view_cricket_league_stats(league_id, auth.uid())
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_player_analytics_snapshots'
      and policyname = 'cricket_player_analytics_snapshots_insert'
  ) then
    create policy "cricket_player_analytics_snapshots_insert"
      on public.cricket_player_analytics_snapshots for insert
      to authenticated
      with check (
        league_id is null
        or public.user_can_rebuild_cricket_stats(league_id, auth.uid())
      );
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 7. RLS policies — cricket_team_analytics_snapshots
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_team_analytics_snapshots'
      and policyname = 'cricket_team_analytics_snapshots_read'
  ) then
    create policy "cricket_team_analytics_snapshots_read"
      on public.cricket_team_analytics_snapshots for select
      to authenticated
      using (
        league_id is null
        or public.user_can_view_cricket_league_stats(league_id, auth.uid())
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_team_analytics_snapshots'
      and policyname = 'cricket_team_analytics_snapshots_insert'
  ) then
    create policy "cricket_team_analytics_snapshots_insert"
      on public.cricket_team_analytics_snapshots for insert
      to authenticated
      with check (
        league_id is null
        or public.user_can_rebuild_cricket_stats(league_id, auth.uid())
      );
  end if;
end;
$$;
