-- =============================================================================
-- GameIQ — Seed Data
-- =============================================================================
-- This file documents the seed data strategy and contains commented examples.
-- Real seed data cannot be inserted until a user exists in auth.users,
-- because profiles.id must match auth.users.id.
--
-- HOW TO SEED DEMO DATA:
-- 1. Create a user via Supabase Auth (Dashboard or sign-up flow)
-- 2. Copy the user's UUID from auth.users
-- 3. Replace DEMO_USER_ID below with that UUID
-- 4. Run the uncommented section in the Supabase SQL editor
--
-- DEMO MODE:
-- The application has NEXT_PUBLIC_ENABLE_MOCK_DATA=true flag for UI-level
-- mock data. Use that for early development without a real Supabase connection.
-- This seed file is for populating a real Supabase database for testing/demos.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Step 1: Verify your user exists (replace DEMO_USER_ID with your UUID)
-- ---------------------------------------------------------------------------
-- select id, email from auth.users limit 5;

-- ---------------------------------------------------------------------------
-- Step 2: Demo Team (uncomment and run after replacing DEMO_USER_ID)
-- ---------------------------------------------------------------------------
/*
do $$
declare
  demo_user_id uuid := 'REPLACE_WITH_YOUR_USER_UUID';  -- from auth.users
  demo_team_id uuid := gen_random_uuid();
  demo_player_1 uuid := gen_random_uuid();
  demo_player_2 uuid := gen_random_uuid();
  demo_player_3 uuid := gen_random_uuid();
  demo_game_id  uuid := gen_random_uuid();
begin

  -- Create demo team
  insert into public.teams (id, name, slug, sport, organization_name, level, description, created_by)
  values (
    demo_team_id,
    'Madison FC U18',
    'madison-fc-u18',
    'soccer',
    'Madison Football Club',
    'U18 Academy',
    'U18 competitive academy team. 2024 Fall Season.',
    demo_user_id
  );

  -- Add user as owner
  insert into public.team_members (team_id, user_id, role, joined_at)
  values (demo_team_id, demo_user_id, 'owner', now());

  -- Update default team on profile
  update public.profiles
  set default_team_id = demo_team_id
  where id = demo_user_id;

  -- Add demo players
  insert into public.players (id, team_id, first_name, last_name, display_name, jersey_number, position, status)
  values
    (demo_player_1, demo_team_id, 'Alex',    'Rodriguez', 'A. Rodriguez', '10', 'Midfielder',  'active'),
    (demo_player_2, demo_team_id, 'Jordan',  'Kim',       'J. Kim',       '4',  'Defender',    'active'),
    (demo_player_3, demo_team_id, 'Sam',     'Okonkwo',   'S. Okonkwo',   '9',  'Forward',     'active');

  -- Create demo game
  insert into public.games (
    id, team_id, created_by, sport, game_type, title,
    opponent_name, game_date, home_away, venue, competition_name,
    team_score, opponent_score, result,
    coach_notes, opponent_notes, status
  )
  values (
    demo_game_id,
    demo_team_id,
    demo_user_id,
    'soccer',
    'match',
    'vs. Riverside FC — Regional League',
    'Riverside FC',
    current_date - interval '3 days',
    'home',
    'City Stadium',
    'Regional League',
    '2',
    '1',
    'win',
    'Good first half. Struggled with transitions in the second half. Set pieces need work.',
    'Riverside played a high press in first half, dropped into 4-4-2 mid block after halftime.',
    'analyzed'
  );

  raise notice 'Demo data inserted. Team ID: %  Game ID: %', demo_team_id, demo_game_id;
end;
$$;
*/

-- =============================================================================
-- Cricket Demo Data — Prompt 31 (Venue Management & Match Scheduling)
-- =============================================================================
-- Idempotent: uses INSERT ... ON CONFLICT DO NOTHING / DO UPDATE.
-- To run: uncomment the block below and replace DEMO_USER_ID with your UUID.
-- =============================================================================

/*
do $$
declare
  demo_user_id         uuid := 'REPLACE_WITH_YOUR_USER_UUID';
  league_id            uuid;
  venue_1_id           uuid;
  venue_2_id           uuid;
  team_strikers_id     uuid;
  team_royals_id       uuid;
  team_chargers_id     uuid;
begin

  -- -------------------------------------------------------------------------
  -- 1. Create / find demo league
  -- -------------------------------------------------------------------------
  insert into public.cricket_leagues (
    name, slug, description, format, overs_per_innings, visibility,
    registration_status, timezone, season_name, created_by
  )
  values (
    'Madison Cricket League',
    'madison-cricket-league',
    'Demo league for GameIQ cricket features.',
    'round_robin',
    20,
    'public',
    'open',
    'America/Chicago',
    '2026 Summer',
    demo_user_id
  )
  on conflict (slug) do update
    set updated_at = now()
  returning id into league_id;

  -- Owner membership
  insert into public.cricket_league_members (league_id, user_id, role)
  values (league_id, demo_user_id, 'owner')
  on conflict (league_id, user_id) do nothing;

  -- League settings
  insert into public.cricket_league_settings (
    league_id, default_overs, points_win, points_loss, points_tie, points_no_result
  )
  values (league_id, 20, 2, 0, 1, 1)
  on conflict (league_id) do nothing;

  -- -------------------------------------------------------------------------
  -- 2. Demo venues
  -- -------------------------------------------------------------------------
  insert into public.cricket_venues (
    name, slug, city, region, country, venue_type,
    has_lights, has_turf_pitch, has_matting_pitch, has_practice_nets, has_parking,
    capacity, timezone, is_active, created_by
  )
  values (
    'Demo Cricket Ground',
    'demo-cricket-ground',
    'Madison',
    'Wisconsin',
    'USA',
    'ground',
    true, false, true, true, true,
    800,
    'America/Chicago',
    true,
    demo_user_id
  )
  on conflict (slug) do update set updated_at = now()
  returning id into venue_1_id;

  insert into public.cricket_venues (
    name, slug, city, region, country, venue_type,
    has_lights, has_turf_pitch, has_matting_pitch, has_practice_nets, has_parking,
    capacity, timezone, is_active, created_by
  )
  values (
    'Madison Community Cricket Field',
    'madison-community-cricket-field',
    'Madison',
    'Wisconsin',
    'USA',
    'ground',
    false, false, true, false, true,
    300,
    'America/Chicago',
    true,
    demo_user_id
  )
  on conflict (slug) do update set updated_at = now()
  returning id into venue_2_id;

  -- -------------------------------------------------------------------------
  -- 3. Demo teams
  -- -------------------------------------------------------------------------
  insert into public.cricket_teams (
    name, slug, league_id, primary_color, secondary_color,
    is_active, created_by
  )
  values
    ('Madison Strikers',  'madison-strikers',  league_id, '#0369a1', '#e0f2fe', true, demo_user_id),
    ('Ann Arbor Royals',  'ann-arbor-royals',  league_id, '#7e22ce', '#f3e8ff', true, demo_user_id),
    ('Chicago Chargers',  'chicago-chargers',  league_id, '#b45309', '#fef3c7', true, demo_user_id)
  on conflict (slug) do update set updated_at = now();

  select id into team_strikers_id from public.cricket_teams where slug = 'madison-strikers';
  select id into team_royals_id   from public.cricket_teams where slug = 'ann-arbor-royals';
  select id into team_chargers_id from public.cricket_teams where slug = 'chicago-chargers';

  -- -------------------------------------------------------------------------
  -- 4. Demo matches
  -- -------------------------------------------------------------------------
  insert into public.cricket_matches (
    league_id, home_team_id, away_team_id, venue_id,
    match_type, overs_per_innings, match_number, round_name, stage,
    scheduled_start, scheduled_end, timezone,
    schedule_status, publish_status, match_status,
    slug, created_by
  )
  values
    (
      league_id, team_strikers_id, team_royals_id, venue_1_id,
      'T20', 20, 1, 'Round 1', 'league',
      '2026-07-05T10:00:00-05:00', '2026-07-05T14:00:00-05:00', 'America/Chicago',
      'scheduled', 'published', 'scheduled',
      'madison-strikers-vs-ann-arbor-royals-2026-07-05',
      demo_user_id
    ),
    (
      league_id, team_chargers_id, team_strikers_id, venue_2_id,
      'T20', 20, 2, 'Round 1', 'league',
      '2026-07-12T10:00:00-05:00', '2026-07-12T14:00:00-05:00', 'America/Chicago',
      'scheduled', 'published', 'scheduled',
      'chicago-chargers-vs-madison-strikers-2026-07-12',
      demo_user_id
    ),
    (
      league_id, team_royals_id, team_chargers_id, venue_1_id,
      'T20', 20, 3, 'Round 1', 'league',
      '2026-07-19T10:00:00-05:00', '2026-07-19T14:00:00-05:00', 'America/Chicago',
      'scheduled', 'draft', 'scheduled',
      'ann-arbor-royals-vs-chicago-chargers-2026-07-19',
      demo_user_id
    )
  on conflict (slug) do nothing;

  raise notice 'Cricket demo data inserted. League: %  Venues: %, %', league_id, venue_1_id, venue_2_id;
end;
$$;
*/

-- ---------------------------------------------------------------------------
-- Cricket Foundation Demo Data (Prompt 27)
-- Safe to run multiple times: all inserts use ON CONFLICT DO NOTHING.
-- created_by is NULL for all rows — no real auth user required.
-- ---------------------------------------------------------------------------

-- Demo league
insert into public.cricket_leagues (
  id, name, slug, description, country, city,
  season_name, format, overs_per_innings, max_teams,
  points_win, points_loss, points_tie, points_no_result
) values (
  'a1000000-0000-0000-0000-000000000001',
  'GameIQ Demo Cricket League',
  'gameiq-demo-cricket-league',
  'A demonstration league pre-loaded with teams, players, and matches for the GameIQ cricket rehaul.',
  'United States', 'Madison', 'Summer 2026', 'round_robin', 20, 6, 2, 0, 1, 1
)
on conflict (slug) do nothing;

-- Demo teams (extended with 0016 columns)
insert into public.cricket_teams (
  id, league_id, name, short_name, slug, home_ground,
  description, team_type, registration_status, approval_status,
  coach_name, scorer_name, founded_year, primary_color
) values
  (
    'b1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Madison Strikers', 'MDS', 'madison-strikers', 'Madison Cricket Ground',
    'The flagship cricket team of Madison, WI. Established 2018.',
    'club', 'approved', 'approved',
    'Rajiv Kumar', 'Anita Sharma', 2018, '#0284c7'
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Ann Arbor Royals', 'AAR', 'ann-arbor-royals', 'Ann Arbor Cricket Club',
    'University-backed team from Ann Arbor, MI.',
    'university', 'approved', 'approved',
    'Priya Nair', null, 2020, '#7c3aed'
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'Chicago Chargers', 'CHC', 'chicago-chargers', 'Chicago Cricket Academy',
    'Corporate and community cricket from the greater Chicago area.',
    'corporate', 'approved', 'approved',
    null, null, 2019, '#dc2626'
  )
on conflict (slug) do nothing;

-- Demo players (extended with 0016 columns)
insert into public.cricket_players (
  id, display_name, slug, batting_style, bowling_style, role,
  primary_role, country, city, availability_status, is_verified
) values
  ('c1000000-0000-0000-0000-000000000001','Aarav Singh',    'aarav-singh',    'right_hand_bat','right_arm_medium',  'All-rounder','all_rounder','United States','Madison',   'active', false),
  ('c1000000-0000-0000-0000-000000000002','Shilin Chhabra', 'shilin-chhabra', 'right_hand_bat','right_arm_spin',    'Batsman',    'batter',    'United States','Madison',   'active', false),
  ('c1000000-0000-0000-0000-000000000003','Rahul Mehta',    'rahul-mehta',    'left_hand_bat', 'left_arm_medium',   'Bowler',     'bowler',    'United States','Ann Arbor', 'active', false),
  ('c1000000-0000-0000-0000-000000000004','Arjun Patel',    'arjun-patel',    'right_hand_bat','right_arm_spin',    'All-rounder','all_rounder','United States','Ann Arbor', 'active', false),
  ('c1000000-0000-0000-0000-000000000005','Sameer Khan',    'sameer-khan',    'right_hand_bat','right_arm_fast',    'Bowler',     'bowler',    'United States','Chicago',   'active', false),
  ('c1000000-0000-0000-0000-000000000006','Rohan Iyer',     'rohan-iyer',     'left_hand_bat', 'left_arm_spin',     'All-rounder','all_rounder','United States','Chicago',   'active', false),
  ('c1000000-0000-0000-0000-000000000007','Priya Nair',     'priya-nair',     'right_hand_bat','right_arm_medium',  'Batsman',    'batter',    'United States','Ann Arbor', 'active', false),
  ('c1000000-0000-0000-0000-000000000008','Dev Kapoor',     'dev-kapoor',     'right_hand_bat','right_arm_fast',    'All-rounder','wicketkeeper','United States','Chicago',  'active', false),
  ('c1000000-0000-0000-0000-000000000009','Nitesh Sharma',  'nitesh-sharma',  'left_hand_bat', 'left_arm_spin',     'Bowler',     'bowler',    'United States','Madison',   'active', false)
on conflict (slug) do nothing;

-- Demo rosters (assign players to teams)
-- Madison Strikers: Aarav (captain), Shilin (vc), Nitesh
insert into public.cricket_team_rosters
  (cricket_team_id, cricket_player_id, jersey_number, roster_role, is_captain, is_vice_captain)
values
  ('b1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','7',  'all_rounder', true,  false),
  ('b1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002','18', 'batter',      false, true),
  ('b1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000009','22', 'bowler',      false, false)
on conflict (cricket_team_id, cricket_player_id) do nothing;

-- Ann Arbor Royals: Rahul (captain), Arjun (vc), Priya
insert into public.cricket_team_rosters
  (cricket_team_id, cricket_player_id, jersey_number, roster_role, is_captain, is_vice_captain)
values
  ('b1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000003','5',  'bowler',      true,  false),
  ('b1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000004','11', 'all_rounder', false, true),
  ('b1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000007','3',  'batter',      false, false)
on conflict (cricket_team_id, cricket_player_id) do nothing;

-- Chicago Chargers: Sameer (captain), Rohan (vc), Dev
insert into public.cricket_team_rosters
  (cricket_team_id, cricket_player_id, jersey_number, roster_role, is_captain, is_vice_captain)
values
  ('b1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000005','9',  'bowler',      true,  false),
  ('b1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000006','16', 'all_rounder', false, true),
  ('b1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000008','1',  'wicketkeeper',false, false)
on conflict (cricket_team_id, cricket_player_id) do nothing;

-- Update team captain fields to match roster
update public.cricket_teams
  set captain_player_id      = 'c1000000-0000-0000-0000-000000000001',
      vice_captain_player_id = 'c1000000-0000-0000-0000-000000000002'
  where id = 'b1000000-0000-0000-0000-000000000001';

update public.cricket_teams
  set captain_player_id      = 'c1000000-0000-0000-0000-000000000003',
      vice_captain_player_id = 'c1000000-0000-0000-0000-000000000004'
  where id = 'b1000000-0000-0000-0000-000000000002';

update public.cricket_teams
  set captain_player_id      = 'c1000000-0000-0000-0000-000000000005',
      vice_captain_player_id = 'c1000000-0000-0000-0000-000000000006'
  where id = 'b1000000-0000-0000-0000-000000000003';

-- Demo venue
insert into public.cricket_venues (id, name, slug, city, country)
values ('d1000000-0000-0000-0000-000000000001','Demo Cricket Ground','demo-cricket-ground','Madison','United States')
on conflict (slug) do nothing;

-- Demo matches
insert into public.cricket_matches (
  id, league_id, home_team_id, away_team_id, venue_id,
  match_type, match_status, scheduled_start, overs_per_innings
) values
  (
    'e1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000002',
    'd1000000-0000-0000-0000-000000000001',
    'league','scheduled','2026-07-05 10:00:00+00',20
  ),
  (
    'e1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000002',
    'b1000000-0000-0000-0000-000000000003',
    'd1000000-0000-0000-0000-000000000001',
    'league','scheduled','2026-07-12 10:00:00+00',20
  )
on conflict (id) do nothing;

-- Demo scorecard for match e1000000-0000-0000-0000-000000000001
-- Madison Strikers (home) vs Ann Arbor Royals (away)
-- Result: Madison Strikers won by 4 runs (142 vs 138)

update public.cricket_matches
  set toss_winner_team_id              = 'b1000000-0000-0000-0000-000000000001',
      toss_decision                    = 'bat',
      scorecard_status                 = 'completed',
      match_status                     = 'completed',
      schedule_status                  = 'completed',
      match_result_type                = 'home_win',
      winning_team_id                  = 'b1000000-0000-0000-0000-000000000001',
      losing_team_id                   = 'b1000000-0000-0000-0000-000000000002',
      result_margin_runs               = 4,
      result_summary                   = 'Madison Strikers won by 4 runs',
      player_of_match_id               = 'c1000000-0000-0000-0000-000000000001',
      result_confirmed_at              = now()
  where id = 'e1000000-0000-0000-0000-000000000001';

-- Innings 1: Madison Strikers batting
insert into public.cricket_innings (
  id, match_id, innings_number,
  batting_team_id, bowling_team_id,
  total_runs, wickets_lost, balls_bowled, overs_text,
  extras_total, byes, leg_byes, wides, no_balls,
  run_rate, innings_status, all_out
) values (
  'f1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0000-000000000001', 1,
  'b1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000002',
  142, 7, 120, '20.0',
  12, 2, 3, 5, 2,
  7.1, 'completed', false
) on conflict (match_id, innings_number) do nothing;

-- Innings 2: Ann Arbor Royals batting
insert into public.cricket_innings (
  id, match_id, innings_number,
  batting_team_id, bowling_team_id,
  total_runs, wickets_lost, balls_bowled, overs_text,
  extras_total, byes, leg_byes, wides, no_balls,
  target_runs, run_rate, innings_status, all_out
) values (
  'f1000000-0000-0000-0000-000000000002',
  'e1000000-0000-0000-0000-000000000001', 2,
  'b1000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000001',
  138, 8, 120, '20.0',
  10, 1, 2, 5, 2,
  143, 6.9, 'completed', false
) on conflict (match_id, innings_number) do nothing;

-- Batting entries — Innings 1 (Madison Strikers)
insert into public.cricket_batting_scorecard_entries (
  innings_id, match_id, team_id, player_id,
  batting_position, runs, balls, fours, sixes,
  strike_rate, dismissal_type, is_out
) values
  ('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
   1, 56, 42, 6, 2, 133.33, 'caught', true),
  ('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002',
   2, 34, 28, 3, 1, 121.43, 'bowled', true),
  ('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000007',
   3, 40, 32, 4, 0, 125.0, 'not_out', false)
on conflict (innings_id, player_id) do nothing;

-- Batting entries — Innings 2 (Ann Arbor Royals)
insert into public.cricket_batting_scorecard_entries (
  innings_id, match_id, team_id, player_id,
  batting_position, runs, balls, fours, sixes,
  strike_rate, dismissal_type, is_out
) values
  ('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003',
   1, 48, 38, 5, 1, 126.32, 'lbw', true),
  ('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000004',
   2, 52, 44, 4, 2, 118.18, 'run_out', true),
  ('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000008',
   3, 28, 30, 2, 0, 93.33, 'caught', true)
on conflict (innings_id, player_id) do nothing;

-- ---------------------------------------------------------------------------
-- Prompt 33: Ball-by-Ball Live Scoring Demo Data
-- Uses match e1000000-0000-0000-0000-000000000002 (b1000000-0000-0000-0000-000000000002 vs b1000000-0000-0000-0000-000000000003)
-- Adds: live match state, innings, 12 ball events across 2 overs, scorecard entries
-- Idempotent: use on conflict (id) do nothing / on conflict do nothing throughout
-- ---------------------------------------------------------------------------

do $$
declare
  live_match_id  uuid := 'e1000000-0000-0000-0000-000000000002';
  batting_team   uuid := 'b1000000-0000-0000-0000-000000000002'; -- Ann Arbor Royals
  bowling_team   uuid := 'b1000000-0000-0000-0000-000000000003'; -- Riverside Hawks
  innings_id     uuid := 'f2000000-0000-0000-0000-000000000001';
  live_state_id  uuid := 'f2000000-0000-0000-0000-000000000002';
  -- Players from existing seed (c1000000... series)
  striker_id     uuid := 'c1000000-0000-0000-0000-000000000001';
  non_striker_id uuid := 'c1000000-0000-0000-0000-000000000002';
  bowler_id      uuid := 'c1000000-0000-0000-0000-000000000007';
begin

  -- Mark match as live
  update public.cricket_matches
  set
    live_scoring_status = 'live',
    match_status        = 'live',
    scoring_mode        = 'ball_by_ball',
    scorecard_status    = 'in_progress',
    current_innings_id  = innings_id,
    current_batter_id   = striker_id,
    current_non_striker_id = non_striker_id,
    current_bowler_id   = bowler_id,
    live_started_at     = now() - interval '15 minutes',
    last_scored_at      = now() - interval '1 minute',
    toss_winner_team_id = batting_team,
    toss_decision       = 'bat'
  where id = live_match_id;

  -- Seed innings if not already present
  insert into public.cricket_innings
    (id, match_id, innings_number, batting_team_id, bowling_team_id,
     innings_status, total_runs, wickets_lost, balls_bowled, overs_text, extras_total,
     wides, no_balls, byes, leg_byes, started_at)
  values
    (innings_id, live_match_id, 1, batting_team, bowling_team,
     'in_progress', 23, 1, 12, '2.0', 2,
     1, 1, 0, 0, now() - interval '15 minutes')
  on conflict (id) do nothing;

  -- Seed 12 demo ball events (2 complete overs)
  -- Over 0
  insert into public.cricket_ball_events
    (id, match_id, innings_id, batting_team_id, bowling_team_id,
     over_number, ball_in_over, legal_ball_number, innings_ball_number,
     striker_id, non_striker_id, bowler_id,
     runs_batter, runs_extras, runs_total,
     is_legal_delivery, is_wicket, is_boundary_four, is_boundary_six, is_dot_ball,
     commentary, scorer_user_id)
  values
    -- 0.1 dot ball
    ('bb000000-0000-0000-0000-000000000001', live_match_id, innings_id, batting_team, bowling_team,
     0, 1, 1, 1, striker_id, non_striker_id, bowler_id,
     0, 0, 0, true, false, false, false, true,
     '0.1 Khan to Sharma, dot ball.', null),
    -- 0.2 single
    ('bb000000-0000-0000-0000-000000000002', live_match_id, innings_id, batting_team, bowling_team,
     0, 2, 2, 2, striker_id, non_striker_id, bowler_id,
     1, 0, 1, true, false, false, false, false,
     '0.2 Khan to Sharma, 1 run.', null),
    -- 0.3 wide
    ('bb000000-0000-0000-0000-000000000003', live_match_id, innings_id, batting_team, bowling_team,
     0, 3, 2, 2, non_striker_id, striker_id, bowler_id,
     0, 1, 1, false, false, false, false, false,
     '0.3 Khan, WIDE. +1 run.', null),
    -- 0.4 no ball + 0
    ('bb000000-0000-0000-0000-000000000004', live_match_id, innings_id, batting_team, bowling_team,
     0, 4, 2, 2, non_striker_id, striker_id, bowler_id,
     0, 1, 1, false, false, false, false, false,
     '0.4 Khan to Singh, NO BALL. +1 penalty.', null),
    -- 0.5 four (batter)
    ('bb000000-0000-0000-0000-000000000005', live_match_id, innings_id, batting_team, bowling_team,
     0, 5, 3, 3, non_striker_id, striker_id, bowler_id,
     4, 0, 4, true, false, true, false, false,
     '0.5 Khan to Singh, FOUR! Through the covers.', null),
    -- 0.6 wicket (bowled)
    ('bb000000-0000-0000-0000-000000000006', live_match_id, innings_id, batting_team, bowling_team,
     0, 6, 4, 4, striker_id, non_striker_id, bowler_id,
     0, 0, 0, true, true, false, false, true,
     '0.6 Khan to Sharma, OUT! Bowled through the gate.', null),
    -- Over 1
    -- 1.1 six
    ('bb000000-0000-0000-0000-000000000007', live_match_id, innings_id, batting_team, bowling_team,
     1, 1, 5, 5, non_striker_id, striker_id, bowler_id,
     6, 0, 6, true, false, false, true, false,
     '1.1 Mehta to Singh, SIX! Over mid-wicket.', null),
    -- 1.2 dot
    ('bb000000-0000-0000-0000-000000000008', live_match_id, innings_id, batting_team, bowling_team,
     1, 2, 6, 6, non_striker_id, striker_id, bowler_id,
     0, 0, 0, true, false, false, false, true,
     '1.2 Mehta to Singh, dot ball.', null),
    -- 1.3 two runs
    ('bb000000-0000-0000-0000-000000000009', live_match_id, innings_id, batting_team, bowling_team,
     1, 3, 7, 7, non_striker_id, striker_id, bowler_id,
     2, 0, 2, true, false, false, false, false,
     '1.3 Mehta to Singh, 2 runs. Driven through mid-on.', null),
    -- 1.4 leg bye 1
    ('bb000000-0000-0000-0000-000000000010', live_match_id, innings_id, batting_team, bowling_team,
     1, 4, 8, 8, striker_id, non_striker_id, bowler_id,
     0, 1, 1, true, false, false, false, false,
     '1.4 Mehta to Patel, LEG BYE. 1 run.', null),
    -- 1.5 single
    ('bb000000-0000-0000-0000-000000000011', live_match_id, innings_id, batting_team, bowling_team,
     1, 5, 9, 9, non_striker_id, striker_id, bowler_id,
     1, 0, 1, true, false, false, false, false,
     '1.5 Mehta to Singh, 1 run.', null),
    -- 1.6 dot
    ('bb000000-0000-0000-0000-000000000012', live_match_id, innings_id, batting_team, bowling_team,
     1, 6, 10, 10, striker_id, non_striker_id, bowler_id,
     0, 0, 0, true, false, false, false, true,
     '1.6 Mehta to Patel, dot ball.', null)
  on conflict (id) do nothing;

  -- Upsert live match state
  insert into public.cricket_live_match_state
    (id, match_id, innings_id, batting_team_id, bowling_team_id,
     total_runs, wickets_lost, balls_bowled, overs_text, extras_total,
     current_run_rate, striker_id, non_striker_id, bowler_id,
     last_event_id, status, version)
  values
    (live_state_id, live_match_id, innings_id, batting_team, bowling_team,
     16, 1, 10, '1.4', 2,
     9.60, striker_id, non_striker_id, bowler_id,
     'bb000000-0000-0000-0000-000000000012', 'live', 12)
  on conflict (match_id) do update set
    total_runs        = excluded.total_runs,
    wickets_lost      = excluded.wickets_lost,
    balls_bowled      = excluded.balls_bowled,
    overs_text        = excluded.overs_text,
    extras_total      = excluded.extras_total,
    current_run_rate  = excluded.current_run_rate,
    striker_id        = excluded.striker_id,
    non_striker_id    = excluded.non_striker_id,
    bowler_id         = excluded.bowler_id,
    last_event_id     = excluded.last_event_id,
    status            = excluded.status,
    version           = excluded.version;

end;
$$;

-- ---------------------------------------------------------------------------
-- Step 3: Demo event timestamps (after game_id is known)
-- ---------------------------------------------------------------------------
/*
-- Replace the UUIDs below with values from step 2
-- insert into public.event_timestamps (team_id, game_id, timestamp_seconds, label, event_type, importance, description)
-- values
--   (demo_team_id, demo_game_id, 234,  'Goal scored',              'goal',                 'critical', 'Alex Rodriguez header from corner. 1-0.'),
--   (demo_team_id, demo_game_id, 890,  'Defensive transition error', 'defensive_breakdown',  'high',     'Lost shape after turnover in midfield. Opponent countered.'),
--   (demo_team_id, demo_game_id, 1455, 'Opponent equalizer',        'goal_conceded',        'critical', 'Conceded from counter-attack after our corner kick.'),
--   (demo_team_id, demo_game_id, 2340, 'Winning goal',              'goal',                 'critical', 'Sam Okonkwo 1v1 with keeper. 2-1.'),
--   (demo_team_id, demo_game_id, 3120, 'Set piece opportunity',     'set_piece',            'medium',   'Free kick 25 yards. Poor delivery.'),
--   (demo_team_id, demo_game_id, 3600, 'Pressing trap success',     'tactical_success',     'high',     'Won the ball in opponent half via coordinated press. Led to chance.');
*/
