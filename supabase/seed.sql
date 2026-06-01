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
