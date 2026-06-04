-- ---------------------------------------------------------------------------
-- 0020_cricket_standings_leaderboards.sql
-- Cricket Points Table, Standings, Player Stats, Leaderboards — Prompt 34
--
-- Adds: cricket_team_standings, cricket_standings_snapshots,
--       cricket_player_stats, cricket_match_team_results,
--       cricket_leaderboard_snapshots.
-- Extends cricket_matches with standings/stats tracking columns.
-- Adds indexes, updated_at triggers, RLS policies, and helper functions.
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
-- 2. cricket_team_standings
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_team_standings (
  id                 uuid        primary key default gen_random_uuid(),
  league_id          uuid        not null references public.cricket_leagues(id) on delete cascade,
  team_id            uuid        not null references public.cricket_teams(id) on delete cascade,
  matches_played     integer     not null default 0,
  wins               integer     not null default 0,
  losses             integer     not null default 0,
  ties               integer     not null default 0,
  no_results         integer     not null default 0,
  abandoned          integer     not null default 0,
  forfeits_for       integer     not null default 0,
  forfeits_against   integer     not null default 0,
  points             integer     not null default 0,
  bonus_points       integer     not null default 0,
  total_points       integer     not null default 0,
  runs_for           integer     not null default 0,
  balls_for          integer     not null default 0,
  runs_against       integer     not null default 0,
  balls_against      integer     not null default 0,
  wickets_for        integer     not null default 0,
  wickets_against    integer     not null default 0,
  net_run_rate       numeric     not null default 0,
  position           integer,
  previous_position  integer,
  form               text[]      not null default '{}',
  last_match_id      uuid        references public.cricket_matches(id) on delete set null,
  calculated_at      timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (league_id, team_id),
  constraint cricket_team_standings_played_pos   check (matches_played >= 0),
  constraint cricket_team_standings_wins_pos     check (wins >= 0),
  constraint cricket_team_standings_losses_pos   check (losses >= 0),
  constraint cricket_team_standings_ties_pos     check (ties >= 0),
  constraint cricket_team_standings_nr_pos       check (no_results >= 0),
  constraint cricket_team_standings_runs_for_pos check (runs_for >= 0),
  constraint cricket_team_standings_balls_for_pos check (balls_for >= 0),
  constraint cricket_team_standings_runs_ag_pos  check (runs_against >= 0),
  constraint cricket_team_standings_balls_ag_pos check (balls_against >= 0)
);

create index if not exists cricket_team_standings_league_idx
  on public.cricket_team_standings(league_id);
create index if not exists cricket_team_standings_team_idx
  on public.cricket_team_standings(team_id);
create index if not exists cricket_team_standings_position_idx
  on public.cricket_team_standings(position);
create index if not exists cricket_team_standings_points_idx
  on public.cricket_team_standings(total_points desc);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'cricket_team_standings_updated_at'
  ) then
    create trigger cricket_team_standings_updated_at
      before update on public.cricket_team_standings
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.cricket_team_standings enable row level security;


-- ---------------------------------------------------------------------------
-- 3. cricket_standings_snapshots
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_standings_snapshots (
  id             uuid        primary key default gen_random_uuid(),
  league_id      uuid        not null references public.cricket_leagues(id) on delete cascade,
  snapshot_type  text        not null default 'manual',
  generated_by   uuid        references auth.users(id) on delete set null,
  standings      jsonb       not null default '[]'::jsonb,
  summary        jsonb       not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  constraint cricket_standings_snapshots_type_check
    check (snapshot_type in ('manual','scheduled','post_match','rebuild','seed'))
);

create index if not exists cricket_standings_snapshots_league_idx
  on public.cricket_standings_snapshots(league_id);

alter table public.cricket_standings_snapshots enable row level security;


-- ---------------------------------------------------------------------------
-- 4. cricket_player_stats
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_player_stats (
  id                    uuid        primary key default gen_random_uuid(),
  league_id             uuid        references public.cricket_leagues(id) on delete cascade,
  team_id               uuid        references public.cricket_teams(id) on delete cascade,
  player_id             uuid        not null references public.cricket_players(id) on delete cascade,
  matches_played        integer     not null default 0,
  innings_batted        integer     not null default 0,
  not_outs              integer     not null default 0,
  runs                  integer     not null default 0,
  balls_faced           integer     not null default 0,
  fours                 integer     not null default 0,
  sixes                 integer     not null default 0,
  highest_score         integer     not null default 0,
  batting_average       numeric,
  batting_strike_rate   numeric,
  ducks                 integer     not null default 0,
  fifties               integer     not null default 0,
  hundreds              integer     not null default 0,
  innings_bowled        integer     not null default 0,
  balls_bowled          integer     not null default 0,
  runs_conceded         integer     not null default 0,
  wickets               integer     not null default 0,
  maidens               integer     not null default 0,
  wides                 integer     not null default 0,
  no_balls              integer     not null default 0,
  bowling_average       numeric,
  economy_rate          numeric,
  bowling_strike_rate   numeric,
  best_bowling_wickets  integer     not null default 0,
  best_bowling_runs     integer,
  catches               integer     not null default 0,
  stumpings             integer     not null default 0,
  run_outs              integer     not null default 0,
  calculated_at         timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (league_id, team_id, player_id),
  constraint cricket_player_stats_played_pos      check (matches_played >= 0),
  constraint cricket_player_stats_innings_pos     check (innings_batted >= 0),
  constraint cricket_player_stats_runs_pos        check (runs >= 0),
  constraint cricket_player_stats_balls_pos       check (balls_faced >= 0),
  constraint cricket_player_stats_wickets_pos     check (wickets >= 0),
  constraint cricket_player_stats_catches_pos     check (catches >= 0)
);

create index if not exists cricket_player_stats_league_idx
  on public.cricket_player_stats(league_id);
create index if not exists cricket_player_stats_team_idx
  on public.cricket_player_stats(team_id);
create index if not exists cricket_player_stats_player_idx
  on public.cricket_player_stats(player_id);
create index if not exists cricket_player_stats_runs_idx
  on public.cricket_player_stats(runs desc);
create index if not exists cricket_player_stats_wickets_idx
  on public.cricket_player_stats(wickets desc);
create index if not exists cricket_player_stats_batting_average_idx
  on public.cricket_player_stats(batting_average desc nulls last);
create index if not exists cricket_player_stats_economy_idx
  on public.cricket_player_stats(economy_rate asc nulls last);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'cricket_player_stats_updated_at'
  ) then
    create trigger cricket_player_stats_updated_at
      before update on public.cricket_player_stats
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.cricket_player_stats enable row level security;


-- ---------------------------------------------------------------------------
-- 5. cricket_match_team_results
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_match_team_results (
  id                 uuid        primary key default gen_random_uuid(),
  match_id           uuid        not null references public.cricket_matches(id) on delete cascade,
  league_id          uuid        references public.cricket_leagues(id) on delete cascade,
  team_id            uuid        not null references public.cricket_teams(id) on delete cascade,
  opponent_team_id   uuid        references public.cricket_teams(id) on delete set null,
  result             text        not null,
  points             integer     not null default 0,
  bonus_points       integer     not null default 0,
  runs_for           integer     not null default 0,
  balls_for          integer     not null default 0,
  wickets_lost       integer     not null default 0,
  runs_against       integer     not null default 0,
  balls_against      integer     not null default 0,
  wickets_taken      integer     not null default 0,
  net_run_rate_delta numeric      not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (match_id, team_id),
  constraint cricket_match_team_results_result_check
    check (result in (
      'win','loss','tie','no_result','abandoned',
      'forfeit_win','forfeit_loss','draw','unknown'
    )),
  constraint cricket_match_team_results_runs_for_pos    check (runs_for >= 0),
  constraint cricket_match_team_results_balls_for_pos   check (balls_for >= 0),
  constraint cricket_match_team_results_runs_ag_pos     check (runs_against >= 0),
  constraint cricket_match_team_results_balls_ag_pos    check (balls_against >= 0)
);

create index if not exists cricket_match_team_results_match_idx
  on public.cricket_match_team_results(match_id);
create index if not exists cricket_match_team_results_league_idx
  on public.cricket_match_team_results(league_id);
create index if not exists cricket_match_team_results_team_idx
  on public.cricket_match_team_results(team_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'cricket_match_team_results_updated_at'
  ) then
    create trigger cricket_match_team_results_updated_at
      before update on public.cricket_match_team_results
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.cricket_match_team_results enable row level security;


-- ---------------------------------------------------------------------------
-- 6. cricket_leaderboard_snapshots
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_leaderboard_snapshots (
  id                uuid        primary key default gen_random_uuid(),
  league_id         uuid        references public.cricket_leagues(id) on delete cascade,
  leaderboard_type  text        not null,
  generated_by      uuid        references auth.users(id) on delete set null,
  data              jsonb       not null default '[]'::jsonb,
  summary           jsonb       not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists cricket_leaderboard_snapshots_league_idx
  on public.cricket_leaderboard_snapshots(league_id);
create index if not exists cricket_leaderboard_snapshots_type_idx
  on public.cricket_leaderboard_snapshots(leaderboard_type);

alter table public.cricket_leaderboard_snapshots enable row level security;


-- ---------------------------------------------------------------------------
-- 7. Extend cricket_matches with standings/stats tracking columns
-- ---------------------------------------------------------------------------

alter table public.cricket_matches
  add column if not exists standings_applied     boolean     not null default false,
  add column if not exists standings_applied_at  timestamptz,
  add column if not exists stats_applied         boolean     not null default false,
  add column if not exists stats_applied_at      timestamptz;


-- ---------------------------------------------------------------------------
-- 8. Helper functions
-- ---------------------------------------------------------------------------

create or replace function public.user_can_view_cricket_league_stats(
  _league_id  uuid,
  _user_id    uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- League is public/unlisted and allows public scorecards
    exists (
      select 1 from public.cricket_leagues
      where id = _league_id
        and visibility in ('public','unlisted')
        and allow_public_scorecards = true
    )
    -- User is a league member
    or public.is_cricket_league_member(_league_id, _user_id)
    -- User can manage the league
    or public.user_can_manage_cricket_league(_league_id, _user_id);
$$;

create or replace function public.user_can_rebuild_cricket_stats(
  _league_id  uuid,
  _user_id    uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.has_cricket_league_role(
      _league_id,
      _user_id,
      array['owner','admin','manager']
    );
$$;


-- ---------------------------------------------------------------------------
-- 9. RLS policies — cricket_team_standings
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_team_standings' and policyname = 'cricket_team_standings_read'
  ) then
    create policy "cricket_team_standings_read"
      on public.cricket_team_standings for select
      to authenticated
      using (
        public.user_can_view_cricket_league_stats(league_id, auth.uid())
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_team_standings' and policyname = 'cricket_team_standings_insert'
  ) then
    create policy "cricket_team_standings_insert"
      on public.cricket_team_standings for insert
      to authenticated
      with check (
        public.user_can_rebuild_cricket_stats(league_id, auth.uid())
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_team_standings' and policyname = 'cricket_team_standings_update'
  ) then
    create policy "cricket_team_standings_update"
      on public.cricket_team_standings for update
      to authenticated
      using (
        public.user_can_rebuild_cricket_stats(league_id, auth.uid())
      );
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 10. RLS policies — cricket_standings_snapshots
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_standings_snapshots' and policyname = 'cricket_standings_snapshots_read'
  ) then
    create policy "cricket_standings_snapshots_read"
      on public.cricket_standings_snapshots for select
      to authenticated
      using (
        public.user_can_view_cricket_league_stats(league_id, auth.uid())
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_standings_snapshots' and policyname = 'cricket_standings_snapshots_insert'
  ) then
    create policy "cricket_standings_snapshots_insert"
      on public.cricket_standings_snapshots for insert
      to authenticated
      with check (
        public.user_can_rebuild_cricket_stats(league_id, auth.uid())
      );
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 11. RLS policies — cricket_player_stats
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_player_stats' and policyname = 'cricket_player_stats_read'
  ) then
    create policy "cricket_player_stats_read"
      on public.cricket_player_stats for select
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
    where tablename = 'cricket_player_stats' and policyname = 'cricket_player_stats_insert'
  ) then
    create policy "cricket_player_stats_insert"
      on public.cricket_player_stats for insert
      to authenticated
      with check (
        league_id is null
        or public.user_can_rebuild_cricket_stats(league_id, auth.uid())
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_player_stats' and policyname = 'cricket_player_stats_update'
  ) then
    create policy "cricket_player_stats_update"
      on public.cricket_player_stats for update
      to authenticated
      using (
        league_id is null
        or public.user_can_rebuild_cricket_stats(league_id, auth.uid())
      );
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 12. RLS policies — cricket_match_team_results
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_match_team_results' and policyname = 'cricket_match_team_results_read'
  ) then
    create policy "cricket_match_team_results_read"
      on public.cricket_match_team_results for select
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
    where tablename = 'cricket_match_team_results' and policyname = 'cricket_match_team_results_insert'
  ) then
    create policy "cricket_match_team_results_insert"
      on public.cricket_match_team_results for insert
      to authenticated
      with check (
        league_id is null
        or public.user_can_rebuild_cricket_stats(league_id, auth.uid())
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_match_team_results' and policyname = 'cricket_match_team_results_update'
  ) then
    create policy "cricket_match_team_results_update"
      on public.cricket_match_team_results for update
      to authenticated
      using (
        league_id is null
        or public.user_can_rebuild_cricket_stats(league_id, auth.uid())
      );
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 13. RLS policies — cricket_leaderboard_snapshots
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_leaderboard_snapshots' and policyname = 'cricket_leaderboard_snapshots_read'
  ) then
    create policy "cricket_leaderboard_snapshots_read"
      on public.cricket_leaderboard_snapshots for select
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
    where tablename = 'cricket_leaderboard_snapshots' and policyname = 'cricket_leaderboard_snapshots_insert'
  ) then
    create policy "cricket_leaderboard_snapshots_insert"
      on public.cricket_leaderboard_snapshots for insert
      to authenticated
      with check (
        league_id is null
        or public.user_can_rebuild_cricket_stats(league_id, auth.uid())
      );
  end if;
end;
$$;
