-- ---------------------------------------------------------------------------
-- 0013_cricket_foundation.sql
-- Cricket Foundation Schema — Prompt 27
--
-- Adds the foundational tables for GameIQ's cricket vertical:
--   cricket_leagues, cricket_league_members, cricket_teams, cricket_players,
--   cricket_team_rosters, cricket_venues, cricket_matches, cricket_feature_audit
--
-- Safe to run multiple times: uses IF NOT EXISTS / CREATE OR REPLACE.
-- Does NOT modify any existing tables.
-- RLS is enabled on every new table with simple, safe initial policies.
-- Future prompts will add league/team admin permission layers.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 0. Ensure set_updated_at trigger function exists (idempotent)
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------------
-- 1. cricket_leagues
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_leagues (
  id                   uuid        primary key default gen_random_uuid(),
  name                 text        not null,
  slug                 text        unique not null,
  description          text,
  logo_url             text,
  country              text,
  region               text,
  city                 text,
  season_name          text,
  start_date           date,
  end_date             date,
  format               text        not null default 'round_robin',
  overs_per_innings    integer     not null default 20,
  max_teams            integer,
  points_win           integer     not null default 2,
  points_loss          integer     not null default 0,
  points_tie           integer     not null default 1,
  points_no_result     integer     not null default 1,
  created_by           uuid        references auth.users(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists cricket_leagues_slug_idx       on public.cricket_leagues(slug);
create index if not exists cricket_leagues_created_by_idx on public.cricket_leagues(created_by);

create trigger cricket_leagues_updated_at
  before update on public.cricket_leagues
  for each row execute function public.set_updated_at();

alter table public.cricket_leagues enable row level security;

-- Read: any authenticated user
create policy "cricket_leagues_read"
  on public.cricket_leagues for select
  to authenticated
  using (true);

-- Insert: authenticated users set themselves as creator
create policy "cricket_leagues_insert"
  on public.cricket_leagues for insert
  to authenticated
  with check (created_by = auth.uid() or created_by is null);

-- Update: only the creator can update
create policy "cricket_leagues_update"
  on public.cricket_leagues for update
  to authenticated
  using (created_by = auth.uid());


-- ---------------------------------------------------------------------------
-- 2. cricket_league_members
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_league_members (
  id          uuid        primary key default gen_random_uuid(),
  league_id   uuid        references public.cricket_leagues(id) on delete cascade,
  user_id     uuid        references auth.users(id) on delete cascade,
  role        text        not null default 'member'
                          check (role in ('owner','admin','manager','scorer','player','fan','member')),
  created_at  timestamptz not null default now(),
  unique (league_id, user_id)
);

create index if not exists cricket_league_members_user_idx on public.cricket_league_members(user_id);

alter table public.cricket_league_members enable row level security;

-- Members can read their own memberships; anyone authenticated can read all
create policy "cricket_league_members_read"
  on public.cricket_league_members for select
  to authenticated
  using (true);

-- Users can add themselves as a member
create policy "cricket_league_members_insert"
  on public.cricket_league_members for insert
  to authenticated
  with check (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 3. cricket_teams
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_teams (
  id                uuid        primary key default gen_random_uuid(),
  league_id         uuid        references public.cricket_leagues(id) on delete set null,
  existing_team_id  uuid,  -- nullable: future mapping to public.teams
  name              text        not null,
  short_name        text,
  slug              text        unique not null,
  logo_url          text,
  primary_color     text,
  secondary_color   text,
  home_ground       text,
  manager_name      text,
  manager_email     text,
  created_by        uuid        references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists cricket_teams_league_idx on public.cricket_teams(league_id);

create trigger cricket_teams_updated_at
  before update on public.cricket_teams
  for each row execute function public.set_updated_at();

alter table public.cricket_teams enable row level security;

create policy "cricket_teams_read"
  on public.cricket_teams for select
  to authenticated
  using (true);

create policy "cricket_teams_insert"
  on public.cricket_teams for insert
  to authenticated
  with check (created_by = auth.uid() or created_by is null);

create policy "cricket_teams_update"
  on public.cricket_teams for update
  to authenticated
  using (created_by = auth.uid());


-- ---------------------------------------------------------------------------
-- 4. cricket_players
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_players (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        references auth.users(id) on delete set null,
  display_name      text        not null,
  slug              text        unique,
  batting_style     text,
  bowling_style     text,
  role              text,
  profile_photo_url text,
  bio               text,
  date_of_birth     date,
  country           text,
  city              text,
  created_by        uuid        references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists cricket_players_user_idx on public.cricket_players(user_id);

create trigger cricket_players_updated_at
  before update on public.cricket_players
  for each row execute function public.set_updated_at();

alter table public.cricket_players enable row level security;

create policy "cricket_players_read"
  on public.cricket_players for select
  to authenticated
  using (true);

create policy "cricket_players_insert"
  on public.cricket_players for insert
  to authenticated
  with check (created_by = auth.uid() or created_by is null);

create policy "cricket_players_update"
  on public.cricket_players for update
  to authenticated
  using (created_by = auth.uid());


-- ---------------------------------------------------------------------------
-- 5. cricket_team_rosters
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_team_rosters (
  id                 uuid        primary key default gen_random_uuid(),
  cricket_team_id    uuid        references public.cricket_teams(id) on delete cascade,
  cricket_player_id  uuid        references public.cricket_players(id) on delete cascade,
  jersey_number      text,
  roster_role        text,
  is_captain         boolean     not null default false,
  is_vice_captain    boolean     not null default false,
  joined_at          timestamptz not null default now(),
  unique (cricket_team_id, cricket_player_id)
);

create index if not exists cricket_team_rosters_team_idx on public.cricket_team_rosters(cricket_team_id);

alter table public.cricket_team_rosters enable row level security;

create policy "cricket_team_rosters_read"
  on public.cricket_team_rosters for select
  to authenticated
  using (true);

create policy "cricket_team_rosters_insert"
  on public.cricket_team_rosters for insert
  to authenticated
  with check (true);


-- ---------------------------------------------------------------------------
-- 6. cricket_venues
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_venues (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        unique,
  address     text,
  city        text,
  region      text,
  country     text,
  latitude    numeric,
  longitude   numeric,
  notes       text,
  created_by  uuid        references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger cricket_venues_updated_at
  before update on public.cricket_venues
  for each row execute function public.set_updated_at();

alter table public.cricket_venues enable row level security;

create policy "cricket_venues_read"
  on public.cricket_venues for select
  to authenticated
  using (true);

create policy "cricket_venues_insert"
  on public.cricket_venues for insert
  to authenticated
  with check (created_by = auth.uid() or created_by is null);

create policy "cricket_venues_update"
  on public.cricket_venues for update
  to authenticated
  using (created_by = auth.uid());


-- ---------------------------------------------------------------------------
-- 7. cricket_matches
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_matches (
  id                    uuid        primary key default gen_random_uuid(),
  league_id             uuid        references public.cricket_leagues(id) on delete set null,
  home_team_id          uuid        references public.cricket_teams(id) on delete set null,
  away_team_id          uuid        references public.cricket_teams(id) on delete set null,
  venue_id              uuid        references public.cricket_venues(id) on delete set null,
  match_type            text        not null default 'league',
  match_status          text        not null default 'scheduled'
                                    check (match_status in (
                                      'scheduled','live','innings_break',
                                      'completed','abandoned','cancelled'
                                    )),
  scheduled_start       timestamptz,
  overs_per_innings     integer     not null default 20,
  toss_winner_team_id   uuid        references public.cricket_teams(id) on delete set null,
  toss_decision         text,
  winner_team_id        uuid        references public.cricket_teams(id) on delete set null,
  result_summary        text,
  created_by            uuid        references auth.users(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists cricket_matches_league_idx           on public.cricket_matches(league_id);
create index if not exists cricket_matches_scheduled_start_idx  on public.cricket_matches(scheduled_start);
create index if not exists cricket_matches_status_idx           on public.cricket_matches(match_status);

create trigger cricket_matches_updated_at
  before update on public.cricket_matches
  for each row execute function public.set_updated_at();

alter table public.cricket_matches enable row level security;

create policy "cricket_matches_read"
  on public.cricket_matches for select
  to authenticated
  using (true);

create policy "cricket_matches_insert"
  on public.cricket_matches for insert
  to authenticated
  with check (created_by = auth.uid() or created_by is null);

create policy "cricket_matches_update"
  on public.cricket_matches for update
  to authenticated
  using (created_by = auth.uid());


-- ---------------------------------------------------------------------------
-- 8. cricket_feature_audit
-- Tracks the rollout status of cricket modules for internal governance.
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_feature_audit (
  id          uuid        primary key default gen_random_uuid(),
  feature_key text        not null,
  status      text        not null default 'planned',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger cricket_feature_audit_updated_at
  before update on public.cricket_feature_audit
  for each row execute function public.set_updated_at();

alter table public.cricket_feature_audit enable row level security;

-- Feature audit is read-only for authenticated users; service role manages it.
create policy "cricket_feature_audit_read"
  on public.cricket_feature_audit for select
  to authenticated
  using (true);


-- ---------------------------------------------------------------------------
-- 9. Seed the feature audit table with known modules from Prompt 27
-- ---------------------------------------------------------------------------

insert into public.cricket_feature_audit (feature_key, status, notes)
values
  ('leagues',              'foundation_ready', 'Schema in place. UI workflow in Prompt 28.'),
  ('tournaments',          'foundation_ready', 'Schema in place. Bracket builder in future prompt.'),
  ('teams',                'foundation_ready', 'cricket_teams table ready. Roster management next.'),
  ('players',              'foundation_ready', 'cricket_players table ready. Stats in future prompt.'),
  ('matches',              'foundation_ready', 'cricket_matches table ready. Scoring in future prompt.'),
  ('schedules',            'foundation_ready', 'Matches ordered by scheduled_start. Calendar UI next.'),
  ('scorecards',           'planned',          'Innings/delivery tables needed in future prompt.'),
  ('points_table',         'planned',          'Requires match results to be recorded.'),
  ('live_scoring',         'planned',          'Ball-by-ball delivery table and real-time layer.'),
  ('analytics',            'planned',          'Wagon wheel, Manhattan, worm chart — after scoring.'),
  ('streaming',            'planned',          'Overlay integration — post-core.'),
  ('community',            'planned',          'Social feed and comments — post-core.'),
  ('marketplace',          'planned',          'Equipment/gear listings — post-core.')
on conflict do nothing;
