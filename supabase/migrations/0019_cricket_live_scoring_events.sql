-- ---------------------------------------------------------------------------
-- 0019_cricket_live_scoring_events.sql
-- Cricket Ball-by-Ball Live Scoring Engine — Prompt 33
--
-- Extends cricket_matches with live scoring columns.
-- Adds: cricket_ball_events, cricket_live_match_state,
--       cricket_live_scoring_sessions, cricket_ball_event_corrections.
-- Adds indexes, updated_at triggers, and RLS policies.
--
-- Safe to run multiple times: IF NOT EXISTS / DO blocks throughout.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- 1. Ensure set_updated_at function exists (idempotent)
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
-- 2. Extend cricket_matches with live scoring columns
-- ---------------------------------------------------------------------------

alter table public.cricket_matches
  add column if not exists live_scoring_status   text         not null default 'not_started',
  add column if not exists current_innings_id    uuid         references public.cricket_innings(id) on delete set null,
  add column if not exists current_batter_id     uuid         references public.cricket_players(id) on delete set null,
  add column if not exists current_non_striker_id uuid        references public.cricket_players(id) on delete set null,
  add column if not exists current_bowler_id     uuid         references public.cricket_players(id) on delete set null,
  add column if not exists live_started_at       timestamptz,
  add column if not exists live_ended_at         timestamptz,
  add column if not exists last_scored_at        timestamptz,
  add column if not exists live_score_version    integer      not null default 0;

-- live_scoring_status constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_matches_live_scoring_status_check'
      and conrelid = 'public.cricket_matches'::regclass
  ) then
    alter table public.cricket_matches
      add constraint cricket_matches_live_scoring_status_check
      check (live_scoring_status in (
        'not_started','setup','live','innings_break','paused',
        'completed','locked','abandoned'
      ));
  end if;
end;
$$;

-- Update scoring_mode constraint to allow ball_by_ball
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'cricket_matches_scoring_mode_check'
      and conrelid = 'public.cricket_matches'::regclass
  ) then
    alter table public.cricket_matches
      drop constraint cricket_matches_scoring_mode_check;
  end if;
  alter table public.cricket_matches
    add constraint cricket_matches_scoring_mode_check
    check (scoring_mode in (
      'manual_scorecard','ball_by_ball','ball_by_ball_future','imported','external'
    ));
end;
$$;


-- ---------------------------------------------------------------------------
-- 3. cricket_ball_events
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_ball_events (
  id                     uuid        primary key default gen_random_uuid(),
  match_id               uuid        not null references public.cricket_matches(id) on delete cascade,
  innings_id             uuid        not null references public.cricket_innings(id) on delete cascade,
  batting_team_id        uuid        not null references public.cricket_teams(id) on delete cascade,
  bowling_team_id        uuid        not null references public.cricket_teams(id) on delete cascade,
  over_number            integer     not null,
  ball_in_over           integer     not null,
  legal_ball_number      integer,
  innings_ball_number    integer,
  striker_id             uuid        references public.cricket_players(id) on delete set null,
  non_striker_id         uuid        references public.cricket_players(id) on delete set null,
  bowler_id              uuid        references public.cricket_players(id) on delete set null,
  runs_batter            integer     not null default 0,
  runs_extras            integer     not null default 0,
  runs_total             integer     not null default 0,
  extra_type             text,
  wicket_type            text,
  player_out_id          uuid        references public.cricket_players(id) on delete set null,
  dismissed_by_player_id uuid        references public.cricket_players(id) on delete set null,
  fielder_player_id      uuid        references public.cricket_players(id) on delete set null,
  is_legal_delivery      boolean     not null default true,
  is_wicket              boolean     not null default false,
  is_boundary_four       boolean     not null default false,
  is_boundary_six        boolean     not null default false,
  is_dot_ball            boolean     not null default false,
  shot_type              text,
  line_length            text,
  fielding_position      text,
  commentary             text,
  scorer_user_id         uuid        references auth.users(id) on delete set null,
  correction_of_event_id uuid        references public.cricket_ball_events(id) on delete set null,
  is_correction          boolean     not null default false,
  is_deleted             boolean     not null default false,
  deleted_at             timestamptz,
  deleted_by             uuid        references auth.users(id) on delete set null,
  metadata               jsonb       not null default '{}'::jsonb,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint cricket_ball_events_over_positive   check (over_number >= 0),
  constraint cricket_ball_events_ball_positive   check (ball_in_over >= 0),
  constraint cricket_ball_events_runs_batter_pos check (runs_batter >= 0),
  constraint cricket_ball_events_runs_extras_pos check (runs_extras >= 0),
  constraint cricket_ball_events_runs_total_pos  check (runs_total >= 0)
);

-- extra_type constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_ball_events_extra_type_check'
      and conrelid = 'public.cricket_ball_events'::regclass
  ) then
    alter table public.cricket_ball_events
      add constraint cricket_ball_events_extra_type_check
      check (extra_type is null or extra_type in (
        'wide','no_ball','bye','leg_bye','penalty',
        'no_ball_bye','no_ball_leg_bye'
      ));
  end if;
end;
$$;

-- wicket_type constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_ball_events_wicket_type_check'
      and conrelid = 'public.cricket_ball_events'::regclass
  ) then
    alter table public.cricket_ball_events
      add constraint cricket_ball_events_wicket_type_check
      check (wicket_type is null or wicket_type in (
        'bowled','caught','caught_behind','lbw','run_out','stumped',
        'hit_wicket','retired_hurt','retired_out','obstructing_field',
        'hit_ball_twice','timed_out','absent_hurt','other'
      ));
  end if;
end;
$$;

-- Indexes
create index if not exists cricket_ball_events_match_idx
  on public.cricket_ball_events(match_id);
create index if not exists cricket_ball_events_innings_idx
  on public.cricket_ball_events(innings_id);
create index if not exists cricket_ball_events_match_innings_ball_idx
  on public.cricket_ball_events(match_id, innings_id, over_number, ball_in_over);
create index if not exists cricket_ball_events_created_at_idx
  on public.cricket_ball_events(created_at);
create index if not exists cricket_ball_events_scorer_idx
  on public.cricket_ball_events(scorer_user_id);
create index if not exists cricket_ball_events_striker_idx
  on public.cricket_ball_events(striker_id);
create index if not exists cricket_ball_events_bowler_idx
  on public.cricket_ball_events(bowler_id);
create index if not exists cricket_ball_events_deleted_idx
  on public.cricket_ball_events(is_deleted);

-- updated_at trigger
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'cricket_ball_events_updated_at'
  ) then
    create trigger cricket_ball_events_updated_at
      before update on public.cricket_ball_events
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

-- RLS
alter table public.cricket_ball_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_ball_events' and policyname = 'cricket_ball_events_read'
  ) then
    create policy "cricket_ball_events_read"
      on public.cricket_ball_events for select
      to authenticated
      using (
        public.user_can_score_cricket_match(match_id, auth.uid())
        or exists (
          select 1 from public.cricket_matches m
          join public.cricket_league_members lm on lm.league_id = m.league_id
          where m.id = match_id and lm.user_id = auth.uid()
        )
        or exists (
          select 1 from public.cricket_matches m
          join public.cricket_leagues l on l.id = m.league_id
          where m.id = match_id
            and m.publish_status = 'published'
            and l.allow_public_scorecards = true
        )
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_ball_events' and policyname = 'cricket_ball_events_insert'
  ) then
    create policy "cricket_ball_events_insert"
      on public.cricket_ball_events for insert
      to authenticated
      with check (
        scorer_user_id = auth.uid()
        and public.user_can_score_cricket_match(match_id, auth.uid())
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_ball_events' and policyname = 'cricket_ball_events_update'
  ) then
    create policy "cricket_ball_events_update"
      on public.cricket_ball_events for update
      to authenticated
      using (public.user_can_score_cricket_match(match_id, auth.uid()));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_ball_events' and policyname = 'cricket_ball_events_delete'
  ) then
    create policy "cricket_ball_events_delete"
      on public.cricket_ball_events for delete
      to authenticated
      using (public.user_can_score_cricket_match(match_id, auth.uid()));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 4. cricket_live_match_state
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_live_match_state (
  id                uuid        primary key default gen_random_uuid(),
  match_id          uuid        not null references public.cricket_matches(id) on delete cascade,
  innings_id        uuid        references public.cricket_innings(id) on delete set null,
  batting_team_id   uuid        references public.cricket_teams(id) on delete set null,
  bowling_team_id   uuid        references public.cricket_teams(id) on delete set null,
  total_runs        integer     not null default 0,
  wickets_lost      integer     not null default 0,
  balls_bowled      integer     not null default 0,
  overs_text        text        not null default '0.0',
  extras_total      integer     not null default 0,
  current_run_rate  numeric,
  required_run_rate numeric,
  target_runs       integer,
  striker_id        uuid        references public.cricket_players(id) on delete set null,
  non_striker_id    uuid        references public.cricket_players(id) on delete set null,
  bowler_id         uuid        references public.cricket_players(id) on delete set null,
  last_event_id     uuid        references public.cricket_ball_events(id) on delete set null,
  status            text        not null default 'not_started',
  version           integer     not null default 0,
  updated_by        uuid        references auth.users(id) on delete set null,
  updated_at        timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  constraint cricket_live_state_match_unique  unique (match_id),
  constraint cricket_live_state_runs_pos      check (total_runs >= 0),
  constraint cricket_live_state_wickets_pos   check (wickets_lost >= 0),
  constraint cricket_live_state_balls_pos     check (balls_bowled >= 0),
  constraint cricket_live_state_extras_pos    check (extras_total >= 0)
);

create index if not exists cricket_live_match_state_match_idx
  on public.cricket_live_match_state(match_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'cricket_live_match_state_updated_at'
  ) then
    create trigger cricket_live_match_state_updated_at
      before update on public.cricket_live_match_state
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.cricket_live_match_state enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_live_match_state' and policyname = 'cricket_live_state_read'
  ) then
    create policy "cricket_live_state_read"
      on public.cricket_live_match_state for select
      to authenticated
      using (
        public.user_can_score_cricket_match(match_id, auth.uid())
        or exists (
          select 1 from public.cricket_matches m
          join public.cricket_league_members lm on lm.league_id = m.league_id
          where m.id = match_id and lm.user_id = auth.uid()
        )
        or exists (
          select 1 from public.cricket_matches m
          join public.cricket_leagues l on l.id = m.league_id
          where m.id = match_id
            and m.publish_status = 'published'
            and l.allow_public_scorecards = true
        )
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_live_match_state' and policyname = 'cricket_live_state_insert'
  ) then
    create policy "cricket_live_state_insert"
      on public.cricket_live_match_state for insert
      to authenticated
      with check (public.user_can_score_cricket_match(match_id, auth.uid()));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_live_match_state' and policyname = 'cricket_live_state_update'
  ) then
    create policy "cricket_live_state_update"
      on public.cricket_live_match_state for update
      to authenticated
      using (public.user_can_score_cricket_match(match_id, auth.uid()));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 5. cricket_live_scoring_sessions
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_live_scoring_sessions (
  id              uuid        primary key default gen_random_uuid(),
  match_id        uuid        not null references public.cricket_matches(id) on delete cascade,
  scorer_user_id  uuid        references auth.users(id) on delete set null,
  status          text        not null default 'active',
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  device_label    text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint cricket_live_sessions_status_check
    check (status in ('active','paused','ended','abandoned'))
);

create index if not exists cricket_live_scoring_sessions_match_idx
  on public.cricket_live_scoring_sessions(match_id);
create index if not exists cricket_live_scoring_sessions_scorer_idx
  on public.cricket_live_scoring_sessions(scorer_user_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'cricket_live_scoring_sessions_updated_at'
  ) then
    create trigger cricket_live_scoring_sessions_updated_at
      before update on public.cricket_live_scoring_sessions
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.cricket_live_scoring_sessions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_live_scoring_sessions' and policyname = 'cricket_live_sessions_read'
  ) then
    create policy "cricket_live_sessions_read"
      on public.cricket_live_scoring_sessions for select
      to authenticated
      using (
        scorer_user_id = auth.uid()
        or public.user_can_score_cricket_match(match_id, auth.uid())
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_live_scoring_sessions' and policyname = 'cricket_live_sessions_insert'
  ) then
    create policy "cricket_live_sessions_insert"
      on public.cricket_live_scoring_sessions for insert
      to authenticated
      with check (
        scorer_user_id = auth.uid()
        and public.user_can_score_cricket_match(match_id, auth.uid())
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_live_scoring_sessions' and policyname = 'cricket_live_sessions_update'
  ) then
    create policy "cricket_live_sessions_update"
      on public.cricket_live_scoring_sessions for update
      to authenticated
      using (
        scorer_user_id = auth.uid()
        or public.user_can_score_cricket_match(match_id, auth.uid())
      );
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 6. cricket_ball_event_corrections
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_ball_event_corrections (
  id                   uuid        primary key default gen_random_uuid(),
  match_id             uuid        not null references public.cricket_matches(id) on delete cascade,
  original_event_id    uuid        references public.cricket_ball_events(id) on delete set null,
  replacement_event_id uuid        references public.cricket_ball_events(id) on delete set null,
  correction_type      text        not null,
  reason               text,
  corrected_by         uuid        references auth.users(id) on delete set null,
  created_at           timestamptz not null default now(),
  constraint cricket_ball_corrections_type_check
    check (correction_type in (
      'undo','edit','delete','replace','innings_rebuild'
    ))
);

create index if not exists cricket_ball_event_corrections_match_idx
  on public.cricket_ball_event_corrections(match_id);
create index if not exists cricket_ball_event_corrections_original_idx
  on public.cricket_ball_event_corrections(original_event_id);

alter table public.cricket_ball_event_corrections enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_ball_event_corrections' and policyname = 'cricket_ball_corrections_read'
  ) then
    create policy "cricket_ball_corrections_read"
      on public.cricket_ball_event_corrections for select
      to authenticated
      using (public.user_can_score_cricket_match(match_id, auth.uid()));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_ball_event_corrections' and policyname = 'cricket_ball_corrections_insert'
  ) then
    create policy "cricket_ball_corrections_insert"
      on public.cricket_ball_event_corrections for insert
      to authenticated
      with check (
        corrected_by = auth.uid()
        and public.user_can_score_cricket_match(match_id, auth.uid())
      );
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 7. user_can_view_cricket_scorecard helper (idempotent)
-- ---------------------------------------------------------------------------

create or replace function public.user_can_view_cricket_scorecard(
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
    public.user_can_manage_cricket_match(_match_id, _user_id)
    or public.user_can_score_cricket_match(_match_id, _user_id)
    or exists (
      select 1 from public.cricket_matches m
      join public.cricket_league_members lm on lm.league_id = m.league_id
      where m.id = _match_id and lm.user_id = _user_id
    )
    or exists (
      select 1 from public.cricket_matches m
      join public.cricket_leagues l on l.id = m.league_id
      where m.id = _match_id
        and m.publish_status = 'published'
        and l.allow_public_scorecards = true
    );
$$;
