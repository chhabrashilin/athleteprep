-- ---------------------------------------------------------------------------
-- 0018_cricket_scorecard_foundation.sql
-- Cricket Scorecard Foundation — Prompt 32
--
-- Extends cricket_matches with result/scorecard columns.
-- Adds: cricket_match_squads, cricket_innings,
--       cricket_batting_scorecard_entries, cricket_bowling_scorecard_entries,
--       cricket_fall_of_wickets, cricket_partnerships,
--       cricket_scorecard_change_logs.
-- Adds helper functions and all RLS policies.
--
-- Safe to run multiple times: IF NOT EXISTS / DO blocks throughout.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- 0. Ensure set_updated_at function exists (idempotent)
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
-- 1. Extend cricket_matches with scorecard/result columns
-- ---------------------------------------------------------------------------

alter table public.cricket_matches
  add column if not exists toss_winner_team_id          uuid        references public.cricket_teams(id) on delete set null,
  add column if not exists toss_decision                text,
  add column if not exists match_result_type            text,
  add column if not exists result_margin_runs           integer,
  add column if not exists result_margin_wickets        integer,
  add column if not exists result_margin_balls_remaining integer,
  add column if not exists player_of_match_id           uuid        references public.cricket_players(id) on delete set null,
  add column if not exists result_confirmed_by          uuid        references auth.users(id) on delete set null,
  add column if not exists result_confirmed_at          timestamptz,
  add column if not exists scorecard_status             text        not null default 'not_started',
  add column if not exists scoring_mode                 text        not null default 'manual_scorecard',
  add column if not exists target_runs                  integer,
  add column if not exists winning_team_id              uuid        references public.cricket_teams(id) on delete set null,
  add column if not exists losing_team_id               uuid        references public.cricket_teams(id) on delete set null;

-- toss_decision constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_matches_toss_decision_check'
      and conrelid = 'public.cricket_matches'::regclass
  ) then
    alter table public.cricket_matches
      add constraint cricket_matches_toss_decision_check
      check (toss_decision is null or toss_decision in ('bat','bowl','field'));
  end if;
end;
$$;

-- match_result_type constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_matches_result_type_check'
      and conrelid = 'public.cricket_matches'::regclass
  ) then
    alter table public.cricket_matches
      add constraint cricket_matches_result_type_check
      check (match_result_type is null or match_result_type in (
        'home_win','away_win','tie','no_result','abandoned','cancelled',
        'forfeited','draw','unknown'
      ));
  end if;
end;
$$;

-- scorecard_status constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_matches_scorecard_status_check'
      and conrelid = 'public.cricket_matches'::regclass
  ) then
    alter table public.cricket_matches
      add constraint cricket_matches_scorecard_status_check
      check (scorecard_status in (
        'not_started','setup','in_progress','completed','locked','disputed'
      ));
  end if;
end;
$$;

-- scoring_mode constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_matches_scoring_mode_check'
      and conrelid = 'public.cricket_matches'::regclass
  ) then
    alter table public.cricket_matches
      add constraint cricket_matches_scoring_mode_check
      check (scoring_mode in (
        'manual_scorecard','ball_by_ball_future','imported','external'
      ));
  end if;
end;
$$;

create index if not exists cricket_matches_scorecard_status_idx
  on public.cricket_matches(scorecard_status);


-- ---------------------------------------------------------------------------
-- 2. cricket_match_squads
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_match_squads (
  id              uuid        primary key default gen_random_uuid(),
  match_id        uuid        not null references public.cricket_matches(id) on delete cascade,
  team_id         uuid        not null references public.cricket_teams(id) on delete cascade,
  player_id       uuid        not null references public.cricket_players(id) on delete cascade,
  roster_entry_id uuid        references public.cricket_team_rosters(id) on delete set null,
  is_playing_xi   boolean     not null default true,
  is_substitute   boolean     not null default false,
  batting_position integer,
  is_captain      boolean     not null default false,
  is_wicketkeeper boolean     not null default false,
  notes           text,
  created_by      uuid        references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (match_id, team_id, player_id),
  constraint cricket_match_squads_batting_position_check
    check (batting_position is null or (batting_position >= 1 and batting_position <= 15))
);

create index if not exists cricket_match_squads_match_idx       on public.cricket_match_squads(match_id);
create index if not exists cricket_match_squads_team_idx        on public.cricket_match_squads(team_id);
create index if not exists cricket_match_squads_player_idx      on public.cricket_match_squads(player_id);
create index if not exists cricket_match_squads_playing_xi_idx  on public.cricket_match_squads(is_playing_xi);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'cricket_match_squads_updated_at'
  ) then
    create trigger cricket_match_squads_updated_at
      before update on public.cricket_match_squads
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.cricket_match_squads enable row level security;

create policy "cricket_match_squads_read"
  on public.cricket_match_squads for select
  to authenticated
  using (
    public.user_can_manage_cricket_match(match_id, auth.uid())
    or exists (
      select 1 from public.cricket_matches m
      join public.cricket_league_members lm on lm.league_id = m.league_id
      where m.id = match_id and lm.user_id = auth.uid()
    )
  );

create policy "cricket_match_squads_insert"
  on public.cricket_match_squads for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.user_can_manage_cricket_match(match_id, auth.uid())
  );

create policy "cricket_match_squads_update"
  on public.cricket_match_squads for update
  to authenticated
  using (public.user_can_manage_cricket_match(match_id, auth.uid()));

create policy "cricket_match_squads_delete"
  on public.cricket_match_squads for delete
  to authenticated
  using (public.user_can_manage_cricket_match(match_id, auth.uid()));


-- ---------------------------------------------------------------------------
-- 3. cricket_innings
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_innings (
  id                  uuid        primary key default gen_random_uuid(),
  match_id            uuid        not null references public.cricket_matches(id) on delete cascade,
  innings_number      integer     not null,
  batting_team_id     uuid        not null references public.cricket_teams(id) on delete cascade,
  bowling_team_id     uuid        not null references public.cricket_teams(id) on delete cascade,
  declared            boolean     not null default false,
  forfeited           boolean     not null default false,
  all_out             boolean     not null default false,
  total_runs          integer     not null default 0,
  wickets_lost        integer     not null default 0,
  balls_bowled        integer     not null default 0,
  overs_text          text,
  extras_total        integer     not null default 0,
  byes                integer     not null default 0,
  leg_byes            integer     not null default 0,
  wides               integer     not null default 0,
  no_balls            integer     not null default 0,
  penalty_runs        integer     not null default 0,
  target_runs         integer,
  run_rate            numeric,
  required_run_rate   numeric,
  innings_status      text        not null default 'not_started',
  started_at          timestamptz,
  ended_at            timestamptz,
  notes               text,
  created_by          uuid        references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (match_id, innings_number),
  constraint cricket_innings_number_positive      check (innings_number > 0),
  constraint cricket_innings_total_runs_positive  check (total_runs >= 0),
  constraint cricket_innings_wickets_positive     check (wickets_lost >= 0),
  constraint cricket_innings_balls_positive       check (balls_bowled >= 0),
  constraint cricket_innings_extras_positive      check (extras_total >= 0),
  constraint cricket_innings_status_check
    check (innings_status in ('not_started','in_progress','completed','declared','forfeited'))
);

create index if not exists cricket_innings_match_idx        on public.cricket_innings(match_id);
create index if not exists cricket_innings_batting_team_idx on public.cricket_innings(batting_team_id);
create index if not exists cricket_innings_bowling_team_idx on public.cricket_innings(bowling_team_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'cricket_innings_updated_at'
  ) then
    create trigger cricket_innings_updated_at
      before update on public.cricket_innings
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.cricket_innings enable row level security;

create policy "cricket_innings_read"
  on public.cricket_innings for select
  to authenticated
  using (
    public.user_can_manage_cricket_match(match_id, auth.uid())
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

create policy "cricket_innings_insert"
  on public.cricket_innings for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.user_can_manage_cricket_match(match_id, auth.uid())
  );

create policy "cricket_innings_update"
  on public.cricket_innings for update
  to authenticated
  using (public.user_can_manage_cricket_match(match_id, auth.uid()));


-- ---------------------------------------------------------------------------
-- 4. cricket_batting_scorecard_entries
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_batting_scorecard_entries (
  id                    uuid        primary key default gen_random_uuid(),
  innings_id            uuid        not null references public.cricket_innings(id) on delete cascade,
  match_id              uuid        not null references public.cricket_matches(id) on delete cascade,
  team_id               uuid        not null references public.cricket_teams(id) on delete cascade,
  player_id             uuid        not null references public.cricket_players(id) on delete cascade,
  batting_position      integer,
  runs                  integer     not null default 0,
  balls                 integer     not null default 0,
  fours                 integer     not null default 0,
  sixes                 integer     not null default 0,
  minutes               integer,
  strike_rate           numeric,
  dismissal_type        text,
  dismissed_by_player_id uuid       references public.cricket_players(id) on delete set null,
  bowler_player_id      uuid        references public.cricket_players(id) on delete set null,
  fielder_player_id     uuid        references public.cricket_players(id) on delete set null,
  is_out                boolean     not null default false,
  did_not_bat           boolean     not null default false,
  retired_hurt          boolean     not null default false,
  retired_out           boolean     not null default false,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (innings_id, player_id),
  constraint cricket_batting_position_check check (batting_position is null or (batting_position >= 1 and batting_position <= 15)),
  constraint cricket_batting_runs_positive  check (runs >= 0),
  constraint cricket_batting_balls_positive check (balls >= 0),
  constraint cricket_batting_fours_positive check (fours >= 0),
  constraint cricket_batting_sixes_positive check (sixes >= 0)
);

create index if not exists cricket_batting_entries_innings_idx on public.cricket_batting_scorecard_entries(innings_id);
create index if not exists cricket_batting_entries_match_idx   on public.cricket_batting_scorecard_entries(match_id);
create index if not exists cricket_batting_entries_player_idx  on public.cricket_batting_scorecard_entries(player_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'cricket_batting_entries_updated_at'
  ) then
    create trigger cricket_batting_entries_updated_at
      before update on public.cricket_batting_scorecard_entries
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.cricket_batting_scorecard_entries enable row level security;

create policy "cricket_batting_entries_read"
  on public.cricket_batting_scorecard_entries for select
  to authenticated
  using (
    public.user_can_manage_cricket_match(match_id, auth.uid())
    or exists (
      select 1 from public.cricket_matches m
      join public.cricket_league_members lm on lm.league_id = m.league_id
      where m.id = match_id and lm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.cricket_matches m
      join public.cricket_leagues l on l.id = m.league_id
      where m.id = match_id and m.publish_status = 'published' and l.allow_public_scorecards = true
    )
  );

create policy "cricket_batting_entries_insert"
  on public.cricket_batting_scorecard_entries for insert
  to authenticated
  with check (public.user_can_manage_cricket_match(match_id, auth.uid()));

create policy "cricket_batting_entries_update"
  on public.cricket_batting_scorecard_entries for update
  to authenticated
  using (public.user_can_manage_cricket_match(match_id, auth.uid()));

create policy "cricket_batting_entries_delete"
  on public.cricket_batting_scorecard_entries for delete
  to authenticated
  using (public.user_can_manage_cricket_match(match_id, auth.uid()));


-- ---------------------------------------------------------------------------
-- 5. cricket_bowling_scorecard_entries
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_bowling_scorecard_entries (
  id              uuid        primary key default gen_random_uuid(),
  innings_id      uuid        not null references public.cricket_innings(id) on delete cascade,
  match_id        uuid        not null references public.cricket_matches(id) on delete cascade,
  team_id         uuid        not null references public.cricket_teams(id) on delete cascade,
  player_id       uuid        not null references public.cricket_players(id) on delete cascade,
  balls_bowled    integer     not null default 0,
  overs_text      text,
  maidens         integer     not null default 0,
  runs_conceded   integer     not null default 0,
  wickets         integer     not null default 0,
  wides           integer     not null default 0,
  no_balls        integer     not null default 0,
  economy_rate    numeric,
  dots            integer     not null default 0,
  fours_conceded  integer     not null default 0,
  sixes_conceded  integer     not null default 0,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (innings_id, player_id),
  constraint cricket_bowling_balls_positive    check (balls_bowled >= 0),
  constraint cricket_bowling_maidens_positive  check (maidens >= 0),
  constraint cricket_bowling_runs_positive     check (runs_conceded >= 0),
  constraint cricket_bowling_wickets_check     check (wickets >= 0 and wickets <= 10),
  constraint cricket_bowling_wides_positive    check (wides >= 0),
  constraint cricket_bowling_noballs_positive  check (no_balls >= 0)
);

create index if not exists cricket_bowling_entries_innings_idx on public.cricket_bowling_scorecard_entries(innings_id);
create index if not exists cricket_bowling_entries_match_idx   on public.cricket_bowling_scorecard_entries(match_id);
create index if not exists cricket_bowling_entries_player_idx  on public.cricket_bowling_scorecard_entries(player_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'cricket_bowling_entries_updated_at'
  ) then
    create trigger cricket_bowling_entries_updated_at
      before update on public.cricket_bowling_scorecard_entries
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.cricket_bowling_scorecard_entries enable row level security;

create policy "cricket_bowling_entries_read"
  on public.cricket_bowling_scorecard_entries for select
  to authenticated
  using (
    public.user_can_manage_cricket_match(match_id, auth.uid())
    or exists (
      select 1 from public.cricket_matches m
      join public.cricket_league_members lm on lm.league_id = m.league_id
      where m.id = match_id and lm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.cricket_matches m
      join public.cricket_leagues l on l.id = m.league_id
      where m.id = match_id and m.publish_status = 'published' and l.allow_public_scorecards = true
    )
  );

create policy "cricket_bowling_entries_insert"
  on public.cricket_bowling_scorecard_entries for insert
  to authenticated
  with check (public.user_can_manage_cricket_match(match_id, auth.uid()));

create policy "cricket_bowling_entries_update"
  on public.cricket_bowling_scorecard_entries for update
  to authenticated
  using (public.user_can_manage_cricket_match(match_id, auth.uid()));

create policy "cricket_bowling_entries_delete"
  on public.cricket_bowling_scorecard_entries for delete
  to authenticated
  using (public.user_can_manage_cricket_match(match_id, auth.uid()));


-- ---------------------------------------------------------------------------
-- 6. cricket_fall_of_wickets
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_fall_of_wickets (
  id                uuid        primary key default gen_random_uuid(),
  innings_id        uuid        not null references public.cricket_innings(id) on delete cascade,
  match_id          uuid        not null references public.cricket_matches(id) on delete cascade,
  wicket_number     integer     not null,
  team_score        integer     not null,
  balls_elapsed     integer,
  overs_text        text,
  player_out_id     uuid        references public.cricket_players(id) on delete set null,
  partnership_runs  integer,
  partnership_balls integer,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (innings_id, wicket_number),
  constraint cricket_fow_wicket_positive check (wicket_number > 0),
  constraint cricket_fow_score_positive  check (team_score >= 0)
);

create index if not exists cricket_fow_innings_idx on public.cricket_fall_of_wickets(innings_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'cricket_fall_of_wickets_updated_at'
  ) then
    create trigger cricket_fall_of_wickets_updated_at
      before update on public.cricket_fall_of_wickets
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.cricket_fall_of_wickets enable row level security;

create policy "cricket_fow_read"
  on public.cricket_fall_of_wickets for select
  to authenticated
  using (
    public.user_can_manage_cricket_match(match_id, auth.uid())
    or exists (
      select 1 from public.cricket_matches m
      join public.cricket_league_members lm on lm.league_id = m.league_id
      where m.id = match_id and lm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.cricket_matches m
      join public.cricket_leagues l on l.id = m.league_id
      where m.id = match_id and m.publish_status = 'published' and l.allow_public_scorecards = true
    )
  );

create policy "cricket_fow_insert"
  on public.cricket_fall_of_wickets for insert
  to authenticated
  with check (public.user_can_manage_cricket_match(match_id, auth.uid()));

create policy "cricket_fow_update"
  on public.cricket_fall_of_wickets for update
  to authenticated
  using (public.user_can_manage_cricket_match(match_id, auth.uid()));

create policy "cricket_fow_delete"
  on public.cricket_fall_of_wickets for delete
  to authenticated
  using (public.user_can_manage_cricket_match(match_id, auth.uid()));


-- ---------------------------------------------------------------------------
-- 7. cricket_partnerships
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_partnerships (
  id             uuid        primary key default gen_random_uuid(),
  innings_id     uuid        not null references public.cricket_innings(id) on delete cascade,
  match_id       uuid        not null references public.cricket_matches(id) on delete cascade,
  wicket_number  integer,
  player_one_id  uuid        references public.cricket_players(id) on delete set null,
  player_two_id  uuid        references public.cricket_players(id) on delete set null,
  runs           integer     not null default 0,
  balls          integer     not null default 0,
  start_score    integer,
  end_score      integer,
  start_ball     integer,
  end_ball       integer,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists cricket_partnerships_innings_idx on public.cricket_partnerships(innings_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'cricket_partnerships_updated_at'
  ) then
    create trigger cricket_partnerships_updated_at
      before update on public.cricket_partnerships
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.cricket_partnerships enable row level security;

create policy "cricket_partnerships_read"
  on public.cricket_partnerships for select
  to authenticated
  using (
    public.user_can_manage_cricket_match(match_id, auth.uid())
    or exists (
      select 1 from public.cricket_matches m
      join public.cricket_league_members lm on lm.league_id = m.league_id
      where m.id = match_id and lm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.cricket_matches m
      join public.cricket_leagues l on l.id = m.league_id
      where m.id = match_id and m.publish_status = 'published' and l.allow_public_scorecards = true
    )
  );

create policy "cricket_partnerships_insert"
  on public.cricket_partnerships for insert
  to authenticated
  with check (public.user_can_manage_cricket_match(match_id, auth.uid()));

create policy "cricket_partnerships_update"
  on public.cricket_partnerships for update
  to authenticated
  using (public.user_can_manage_cricket_match(match_id, auth.uid()));

create policy "cricket_partnerships_delete"
  on public.cricket_partnerships for delete
  to authenticated
  using (public.user_can_manage_cricket_match(match_id, auth.uid()));


-- ---------------------------------------------------------------------------
-- 8. cricket_scorecard_change_logs
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_scorecard_change_logs (
  id           uuid        primary key default gen_random_uuid(),
  match_id     uuid        references public.cricket_matches(id) on delete cascade,
  innings_id   uuid        references public.cricket_innings(id) on delete cascade,
  actor_user_id uuid       references auth.users(id) on delete set null,
  action       text        not null,
  entity_type  text,
  entity_id    uuid,
  old_value    jsonb       not null default '{}'::jsonb,
  new_value    jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists cricket_scorecard_change_logs_match_idx on public.cricket_scorecard_change_logs(match_id);
create index if not exists cricket_scorecard_change_logs_actor_idx on public.cricket_scorecard_change_logs(actor_user_id);

alter table public.cricket_scorecard_change_logs enable row level security;

create policy "cricket_scorecard_change_logs_read"
  on public.cricket_scorecard_change_logs for select
  to authenticated
  using (
    match_id is not null and public.user_can_manage_cricket_match(match_id, auth.uid())
  );

create policy "cricket_scorecard_change_logs_insert"
  on public.cricket_scorecard_change_logs for insert
  to authenticated
  with check (actor_user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 9. user_can_score_cricket_match helper
-- ---------------------------------------------------------------------------

create or replace function public.user_can_score_cricket_match(
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
    -- Can manage the match/league
    public.user_can_manage_cricket_match(_match_id, _user_id)
    or
    -- Assigned scorer on the match
    exists (
      select 1 from public.cricket_matches
      where id = _match_id and scorer_user_id = _user_id
    )
    or
    -- Assigned official (scorer role)
    exists (
      select 1 from public.cricket_match_officials
      where match_id = _match_id
        and user_id = _user_id
        and role = 'scorer'
        and status not in ('removed','declined')
    )
    or
    -- Scorer/admin on the league
    exists (
      select 1
      from public.cricket_matches m
      join public.cricket_league_members lm on lm.league_id = m.league_id
      where m.id = _match_id
        and lm.user_id = _user_id
        and lm.role in ('owner','admin','manager','scorer')
    );
$$;
