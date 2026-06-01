-- =============================================================================
-- GameIQ — Initial Schema Migration
-- File: 0001_initial_schema.sql
-- Apply: supabase db push  OR  run in Supabase SQL editor
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";


-- ---------------------------------------------------------------------------
-- 1. Custom Enum Types
-- ---------------------------------------------------------------------------

create type public.team_role as enum (
  'owner',
  'coach',
  'analyst',
  'player',
  'viewer'
);

create type public.sport_type as enum (
  'soccer',
  'cricket',
  'basketball',
  'american_football',
  'hockey',
  'volleyball',
  'other'
);

create type public.game_type as enum (
  'match',
  'practice',
  'scrimmage',
  'film_session'
);

create type public.home_away_status as enum (
  'home',
  'away',
  'neutral',
  'not_applicable'
);

create type public.event_importance as enum (
  'low',
  'medium',
  'high',
  'critical'
);

create type public.analysis_job_status as enum (
  'pending',
  'running',
  'completed',
  'failed'
);

create type public.confidence_level as enum (
  'high',
  'medium',
  'low'
);

create type public.verification_status as enum (
  'unreviewed',
  'accurate',
  'partially_accurate',
  'inaccurate',
  'edited'
);

create type public.share_visibility as enum (
  'staff_only',
  'player_specific',
  'public_summary',
  'private_link'
);

create type public.export_status as enum (
  'pending',
  'processing',
  'completed',
  'failed'
);

create type public.video_upload_status as enum (
  'pending',
  'uploading',
  'uploaded',
  'failed'
);

create type public.video_processing_status as enum (
  'not_started',
  'pending',
  'processing',
  'completed',
  'failed'
);


-- ---------------------------------------------------------------------------
-- 2. Reusable updated_at Function and Trigger Helper
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
-- 3. Tables
-- ---------------------------------------------------------------------------

-- 3.1 profiles
-- Linked 1:1 to auth.users. Created automatically via trigger.
create table public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  full_name     text,
  avatar_url    text,
  email         text,
  default_team_id uuid,     -- FK to teams added below after teams table exists
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- 3.2 teams
create table public.teams (
  id                uuid        primary key default gen_random_uuid(),
  name              text        not null,
  slug              text        unique,
  sport             sport_type  not null default 'other',
  organization_name text,
  level             text,
  location          text,
  description       text,
  created_by        uuid        references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index teams_slug_idx        on public.teams(slug);
create index teams_created_by_idx  on public.teams(created_by);

create trigger teams_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

-- Add deferred FK from profiles.default_team_id to teams now that teams exists
alter table public.profiles
  add constraint profiles_default_team_id_fk
  foreign key (default_team_id)
  references public.teams(id)
  on delete set null;


-- 3.3 team_members
create table public.team_members (
  id             uuid        primary key default gen_random_uuid(),
  team_id        uuid        not null references public.teams(id) on delete cascade,
  user_id        uuid        references public.profiles(id) on delete cascade,
  role           team_role   not null default 'viewer',
  invited_email  text,
  joined_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Partial unique index: enforce one membership per (team, user) when user is known
create unique index team_members_team_user_unique
  on public.team_members(team_id, user_id)
  where user_id is not null;

create index team_members_team_id_idx  on public.team_members(team_id);
create index team_members_user_id_idx  on public.team_members(user_id);
create index team_members_role_idx     on public.team_members(role);

create trigger team_members_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();


-- 3.4 players
create table public.players (
  id              uuid        primary key default gen_random_uuid(),
  team_id         uuid        not null references public.teams(id) on delete cascade,
  user_id         uuid        references public.profiles(id) on delete set null,
  first_name      text        not null,
  last_name       text,
  display_name    text,
  jersey_number   text,
  position        text,
  role            text,
  dominant_side   text,
  class_year      text,
  height          text,
  weight          text,
  status          text        not null default 'active',
  notes           text,
  metadata        jsonb       not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index players_team_id_idx       on public.players(team_id);
create index players_user_id_idx       on public.players(user_id);
create index players_display_name_idx  on public.players(display_name);

create trigger players_updated_at
  before update on public.players
  for each row execute function public.set_updated_at();


-- 3.5 games
create table public.games (
  id               uuid              primary key default gen_random_uuid(),
  team_id          uuid              not null references public.teams(id) on delete cascade,
  created_by       uuid              references public.profiles(id) on delete set null,
  sport            sport_type        not null,
  game_type        game_type         not null default 'match',
  title            text              not null,
  opponent_name    text,
  game_date        date,
  start_time       timestamptz,
  home_away        home_away_status  not null default 'not_applicable',
  venue            text,
  competition_name text,
  team_score       text,
  opponent_score   text,
  result           text,
  summary_notes    text,
  coach_notes      text,
  opponent_notes   text,
  status           text              not null default 'draft',
  metadata         jsonb             not null default '{}'::jsonb,
  created_at       timestamptz       not null default now(),
  updated_at       timestamptz       not null default now()
);

create index games_team_id_idx    on public.games(team_id);
create index games_created_by_idx on public.games(created_by);
create index games_game_date_idx  on public.games(game_date desc);
create index games_sport_idx      on public.games(sport);

create trigger games_updated_at
  before update on public.games
  for each row execute function public.set_updated_at();


-- 3.6 video_assets
create table public.video_assets (
  id                  uuid                     primary key default gen_random_uuid(),
  team_id             uuid                     not null references public.teams(id) on delete cascade,
  game_id             uuid                     references public.games(id) on delete cascade,
  uploaded_by         uuid                     references public.profiles(id) on delete set null,
  storage_bucket      text                     not null,
  storage_path        text                     not null,
  public_url          text,
  file_name           text                     not null,
  file_size_bytes     bigint,
  mime_type           text,
  duration_seconds    numeric,
  thumbnail_path      text,
  upload_status       video_upload_status      not null default 'pending',
  processing_status   video_processing_status  not null default 'not_started',
  processing_error    text,
  metadata            jsonb                    not null default '{}'::jsonb,
  created_at          timestamptz              not null default now(),
  updated_at          timestamptz              not null default now(),

  constraint video_assets_storage_unique unique (storage_bucket, storage_path)
);

create index video_assets_team_id_idx      on public.video_assets(team_id);
create index video_assets_game_id_idx      on public.video_assets(game_id);
create index video_assets_uploaded_by_idx  on public.video_assets(uploaded_by);

create trigger video_assets_updated_at
  before update on public.video_assets
  for each row execute function public.set_updated_at();


-- 3.7 event_timestamps
create table public.event_timestamps (
  id                       uuid              primary key default gen_random_uuid(),
  team_id                  uuid              not null references public.teams(id) on delete cascade,
  game_id                  uuid              not null references public.games(id) on delete cascade,
  video_asset_id           uuid              references public.video_assets(id) on delete set null,
  created_by               uuid              references public.profiles(id) on delete set null,
  timestamp_seconds        numeric           not null,
  end_timestamp_seconds    numeric,
  label                    text              not null,
  event_type               text,
  team_context             text,
  description              text,
  importance               event_importance  not null default 'medium',
  tags                     text[]            not null default '{}',
  player_ids               uuid[]            not null default '{}',
  opponent_player_names    text[]            not null default '{}',
  is_ai_generated          boolean           not null default false,
  confidence               confidence_level,
  metadata                 jsonb             not null default '{}'::jsonb,
  created_at               timestamptz       not null default now(),
  updated_at               timestamptz       not null default now()
);

create index event_timestamps_team_id_idx         on public.event_timestamps(team_id);
create index event_timestamps_game_id_idx         on public.event_timestamps(game_id);
create index event_timestamps_video_asset_id_idx  on public.event_timestamps(video_asset_id);
create index event_timestamps_seconds_idx         on public.event_timestamps(timestamp_seconds);
create index event_timestamps_tags_gin            on public.event_timestamps using gin(tags);
create index event_timestamps_player_ids_gin      on public.event_timestamps using gin(player_ids);

create trigger event_timestamps_updated_at
  before update on public.event_timestamps
  for each row execute function public.set_updated_at();


-- 3.8 clips
create table public.clips (
  id                  uuid        primary key default gen_random_uuid(),
  team_id             uuid        not null references public.teams(id) on delete cascade,
  game_id             uuid        not null references public.games(id) on delete cascade,
  video_asset_id      uuid        references public.video_assets(id) on delete set null,
  event_timestamp_id  uuid        references public.event_timestamps(id) on delete set null,
  title               text        not null,
  description         text,
  start_seconds       numeric     not null,
  end_seconds         numeric,
  storage_path        text,
  thumbnail_path      text,
  tags                text[]      not null default '{}',
  metadata            jsonb       not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index clips_team_id_idx            on public.clips(team_id);
create index clips_game_id_idx            on public.clips(game_id);
create index clips_video_asset_id_idx     on public.clips(video_asset_id);
create index clips_event_timestamp_id_idx on public.clips(event_timestamp_id);

create trigger clips_updated_at
  before update on public.clips
  for each row execute function public.set_updated_at();


-- 3.9 analysis_jobs
create table public.analysis_jobs (
  id               uuid                  primary key default gen_random_uuid(),
  team_id          uuid                  not null references public.teams(id) on delete cascade,
  game_id          uuid                  not null references public.games(id) on delete cascade,
  requested_by     uuid                  references public.profiles(id) on delete set null,
  status           analysis_job_status   not null default 'pending',
  provider         text                  not null default 'mock',
  model_name       text,
  started_at       timestamptz,
  completed_at     timestamptz,
  failed_at        timestamptz,
  error_message    text,
  input_snapshot   jsonb                 not null default '{}'::jsonb,
  output_snapshot  jsonb,
  metadata         jsonb                 not null default '{}'::jsonb,
  created_at       timestamptz           not null default now(),
  updated_at       timestamptz           not null default now()
);

create index analysis_jobs_team_id_idx      on public.analysis_jobs(team_id);
create index analysis_jobs_game_id_idx      on public.analysis_jobs(game_id);
create index analysis_jobs_status_idx       on public.analysis_jobs(status);
create index analysis_jobs_requested_by_idx on public.analysis_jobs(requested_by);

create trigger analysis_jobs_updated_at
  before update on public.analysis_jobs
  for each row execute function public.set_updated_at();


-- 3.10 game_reports
create table public.game_reports (
  id               uuid              primary key default gen_random_uuid(),
  team_id          uuid              not null references public.teams(id) on delete cascade,
  game_id          uuid              not null references public.games(id) on delete cascade,
  analysis_job_id  uuid              references public.analysis_jobs(id) on delete set null,
  created_by       uuid              references public.profiles(id) on delete set null,
  title            text              not null,
  executive_summary text,
  overall_confidence confidence_level not null default 'medium',
  report_version   integer           not null default 1,
  is_current       boolean           not null default true,
  ai_generated     boolean           not null default true,
  raw_ai_output    jsonb             not null default '{}'::jsonb,
  edited_output    jsonb,
  assumptions      text[]            not null default '{}',
  limitations      text[]            not null default '{}',
  created_at       timestamptz       not null default now(),
  updated_at       timestamptz       not null default now()
);

create index game_reports_team_id_idx        on public.game_reports(team_id);
create index game_reports_game_id_idx        on public.game_reports(game_id);
create index game_reports_analysis_job_idx   on public.game_reports(analysis_job_id);
create index game_reports_is_current_idx     on public.game_reports(is_current) where is_current = true;

create trigger game_reports_updated_at
  before update on public.game_reports
  for each row execute function public.set_updated_at();


-- 3.11 coaching_insights
create table public.coaching_insights (
  id                   uuid                 primary key default gen_random_uuid(),
  team_id              uuid                 not null references public.teams(id) on delete cascade,
  game_id              uuid                 not null references public.games(id) on delete cascade,
  game_report_id       uuid                 not null references public.game_reports(id) on delete cascade,
  title                text                 not null,
  summary              text                 not null,
  why_it_matters       text,
  recommended_action   text,
  confidence           confidence_level     not null default 'medium',
  verification_status  verification_status  not null default 'unreviewed',
  evidence             jsonb                not null default '[]'::jsonb,
  assumptions          text[]               not null default '{}',
  affected_player_ids  uuid[]               not null default '{}',
  related_event_ids    uuid[]               not null default '{}',
  sort_order           integer              not null default 0,
  is_edited            boolean              not null default false,
  original_ai_content  jsonb,
  metadata             jsonb                not null default '{}'::jsonb,
  created_at           timestamptz          not null default now(),
  updated_at           timestamptz          not null default now()
);

create index coaching_insights_team_id_idx           on public.coaching_insights(team_id);
create index coaching_insights_game_id_idx           on public.coaching_insights(game_id);
create index coaching_insights_game_report_id_idx    on public.coaching_insights(game_report_id);
create index coaching_insights_confidence_idx        on public.coaching_insights(confidence);
create index coaching_insights_verification_idx      on public.coaching_insights(verification_status);

create trigger coaching_insights_updated_at
  before update on public.coaching_insights
  for each row execute function public.set_updated_at();


-- 3.12 player_reports
create table public.player_reports (
  id                    uuid                 primary key default gen_random_uuid(),
  team_id               uuid                 not null references public.teams(id) on delete cascade,
  game_id               uuid                 not null references public.games(id) on delete cascade,
  game_report_id        uuid                 not null references public.game_reports(id) on delete cascade,
  player_id             uuid                 references public.players(id) on delete cascade,
  player_display_name   text,
  summary               text,
  strengths             text[]               not null default '{}',
  improvement_areas     text[]               not null default '{}',
  key_moments           jsonb                not null default '[]'::jsonb,
  recommended_focus     text,
  player_facing_summary text,
  confidence            confidence_level     not null default 'medium',
  verification_status   verification_status  not null default 'unreviewed',
  is_edited             boolean              not null default false,
  original_ai_content   jsonb,
  metadata              jsonb                not null default '{}'::jsonb,
  created_at            timestamptz          not null default now(),
  updated_at            timestamptz          not null default now()
);

create index player_reports_team_id_idx         on public.player_reports(team_id);
create index player_reports_game_id_idx         on public.player_reports(game_id);
create index player_reports_game_report_id_idx  on public.player_reports(game_report_id);
create index player_reports_player_id_idx       on public.player_reports(player_id);

create trigger player_reports_updated_at
  before update on public.player_reports
  for each row execute function public.set_updated_at();


-- 3.13 practice_recommendations
create table public.practice_recommendations (
  id                  uuid              primary key default gen_random_uuid(),
  team_id             uuid              not null references public.teams(id) on delete cascade,
  game_id             uuid              not null references public.games(id) on delete cascade,
  game_report_id      uuid              not null references public.game_reports(id) on delete cascade,
  title               text              not null,
  priority            integer           not null default 0,
  description         text,
  drill_name          text,
  duration_minutes    integer,
  coaching_points     text[]            not null default '{}',
  player_ids          uuid[]            not null default '{}',
  related_insight_ids uuid[]            not null default '{}',
  confidence          confidence_level  not null default 'medium',
  metadata            jsonb             not null default '{}'::jsonb,
  created_at          timestamptz       not null default now(),
  updated_at          timestamptz       not null default now()
);

create index practice_recs_team_id_idx         on public.practice_recommendations(team_id);
create index practice_recs_game_id_idx         on public.practice_recommendations(game_id);
create index practice_recs_game_report_id_idx  on public.practice_recommendations(game_report_id);

create trigger practice_recommendations_updated_at
  before update on public.practice_recommendations
  for each row execute function public.set_updated_at();


-- 3.14 opponent_tendencies
create table public.opponent_tendencies (
  id                  uuid              primary key default gen_random_uuid(),
  team_id             uuid              not null references public.teams(id) on delete cascade,
  game_id             uuid              not null references public.games(id) on delete cascade,
  game_report_id      uuid              not null references public.game_reports(id) on delete cascade,
  title               text              not null,
  description         text              not null,
  evidence            jsonb             not null default '[]'::jsonb,
  recommended_response text,
  confidence          confidence_level  not null default 'medium',
  tags                text[]            not null default '{}',
  metadata            jsonb             not null default '{}'::jsonb,
  created_at          timestamptz       not null default now(),
  updated_at          timestamptz       not null default now()
);

create index opponent_tendencies_team_id_idx         on public.opponent_tendencies(team_id);
create index opponent_tendencies_game_id_idx         on public.opponent_tendencies(game_id);
create index opponent_tendencies_game_report_id_idx  on public.opponent_tendencies(game_report_id);

create trigger opponent_tendencies_updated_at
  before update on public.opponent_tendencies
  for each row execute function public.set_updated_at();


-- 3.15 verification_feedback
-- No updated_at — this is an append-only record of feedback events
create table public.verification_feedback (
  id                  uuid                 primary key default gen_random_uuid(),
  team_id             uuid                 not null references public.teams(id) on delete cascade,
  game_id             uuid                 references public.games(id) on delete cascade,
  game_report_id      uuid                 references public.game_reports(id) on delete cascade,
  submitted_by        uuid                 references public.profiles(id) on delete set null,
  target_type         text                 not null,
  target_id           uuid                 not null,
  verification_status verification_status  not null,
  feedback_text       text,
  correction_text     text,
  metadata            jsonb                not null default '{}'::jsonb,
  created_at          timestamptz          not null default now()
);

create index verification_feedback_team_id_idx        on public.verification_feedback(team_id);
create index verification_feedback_game_id_idx        on public.verification_feedback(game_id);
create index verification_feedback_game_report_id_idx on public.verification_feedback(game_report_id);
create index verification_feedback_submitted_by_idx   on public.verification_feedback(submitted_by);
create index verification_feedback_target_idx         on public.verification_feedback(target_type, target_id);


-- 3.16 share_links
create table public.share_links (
  id                 uuid              primary key default gen_random_uuid(),
  team_id            uuid              not null references public.teams(id) on delete cascade,
  game_id            uuid              references public.games(id) on delete cascade,
  game_report_id     uuid              references public.game_reports(id) on delete cascade,
  created_by         uuid              references public.profiles(id) on delete set null,
  token              text              not null unique,
  visibility         share_visibility  not null default 'private_link',
  allowed_player_id  uuid              references public.players(id) on delete cascade,
  expires_at         timestamptz,
  revoked_at         timestamptz,
  view_count         integer           not null default 0,
  last_viewed_at     timestamptz,
  metadata           jsonb             not null default '{}'::jsonb,
  created_at         timestamptz       not null default now(),
  updated_at         timestamptz       not null default now()
);

create index share_links_token_idx          on public.share_links(token);
create index share_links_team_id_idx        on public.share_links(team_id);
create index share_links_game_report_id_idx on public.share_links(game_report_id);

create trigger share_links_updated_at
  before update on public.share_links
  for each row execute function public.set_updated_at();


-- 3.17 exports
create table public.exports (
  id               uuid           primary key default gen_random_uuid(),
  team_id          uuid           not null references public.teams(id) on delete cascade,
  game_id          uuid           references public.games(id) on delete cascade,
  game_report_id   uuid           references public.game_reports(id) on delete cascade,
  requested_by     uuid           references public.profiles(id) on delete set null,
  export_type      text           not null default 'pdf',
  status           export_status  not null default 'pending',
  storage_bucket   text,
  storage_path     text,
  error_message    text,
  metadata         jsonb          not null default '{}'::jsonb,
  created_at       timestamptz    not null default now(),
  updated_at       timestamptz    not null default now()
);

create index exports_team_id_idx         on public.exports(team_id);
create index exports_game_report_id_idx  on public.exports(game_report_id);
create index exports_requested_by_idx    on public.exports(requested_by);
create index exports_status_idx          on public.exports(status);

create trigger exports_updated_at
  before update on public.exports
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 4. Profile Auto-Create Trigger
-- Creates a profiles row when a new Supabase Auth user is created.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------------
-- 5. RLS Helper Functions (SECURITY DEFINER to prevent recursion)
-- These functions bypass RLS when checking team_members, making them safe
-- to call from within RLS policies on team_members itself.
-- ---------------------------------------------------------------------------

create or replace function public.is_team_member(p_team_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.has_team_role(p_team_id uuid, p_roles team_role[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id
      and user_id = auth.uid()
      and role = any(p_roles)
  );
$$;

-- Shorthand for staff-level access (owner, coach, analyst)
create or replace function public.is_team_staff(p_team_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.has_team_role(p_team_id, array['owner','coach','analyst']::team_role[]);
$$;

-- Shorthand for management-level access (owner, coach)
create or replace function public.is_team_manager(p_team_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.has_team_role(p_team_id, array['owner','coach']::team_role[]);
$$;


-- ---------------------------------------------------------------------------
-- 6. Row Level Security
-- ---------------------------------------------------------------------------

-- Enable RLS on all app tables
alter table public.profiles             enable row level security;
alter table public.teams                enable row level security;
alter table public.team_members         enable row level security;
alter table public.players              enable row level security;
alter table public.games                enable row level security;
alter table public.video_assets         enable row level security;
alter table public.event_timestamps     enable row level security;
alter table public.clips                enable row level security;
alter table public.analysis_jobs        enable row level security;
alter table public.game_reports         enable row level security;
alter table public.coaching_insights    enable row level security;
alter table public.player_reports       enable row level security;
alter table public.practice_recommendations enable row level security;
alter table public.opponent_tendencies  enable row level security;
alter table public.verification_feedback enable row level security;
alter table public.share_links          enable row level security;
alter table public.exports              enable row level security;


-- ── profiles ──────────────────────────────────────────────────────────────────
-- Users can read and update only their own profile.
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());


-- ── teams ─────────────────────────────────────────────────────────────────────
-- Any team member can read their teams.
-- Any authenticated user can create a team.
-- Only owners/coaches can update team details.
-- Only owners can delete a team.
create policy "teams_select_member"
  on public.teams for select
  using (public.is_team_member(id));

create policy "teams_insert_authenticated"
  on public.teams for insert
  with check (auth.uid() is not null);

create policy "teams_update_manager"
  on public.teams for update
  using (public.is_team_manager(id));

create policy "teams_delete_owner"
  on public.teams for delete
  using (public.has_team_role(id, array['owner']::team_role[]));


-- ── team_members ──────────────────────────────────────────────────────────────
-- Safe to use is_team_member() here because that function is SECURITY DEFINER
-- and bypasses RLS — no infinite recursion.
-- Members can read all members of their teams.
-- Owners/coaches can add/manage members.
-- Users can read their own membership records.
create policy "team_members_select_own_or_team"
  on public.team_members for select
  using (
    user_id = auth.uid()
    or public.is_team_member(team_id)
  );

create policy "team_members_insert_manager"
  on public.team_members for insert
  with check (public.is_team_manager(team_id));

create policy "team_members_update_manager"
  on public.team_members for update
  using (public.is_team_manager(team_id));

create policy "team_members_delete_manager"
  on public.team_members for delete
  using (public.is_team_manager(team_id));


-- ── players ───────────────────────────────────────────────────────────────────
create policy "players_select_member"
  on public.players for select
  using (public.is_team_member(team_id));

create policy "players_insert_staff"
  on public.players for insert
  with check (public.is_team_staff(team_id));

create policy "players_update_staff"
  on public.players for update
  using (public.is_team_staff(team_id));

create policy "players_delete_manager"
  on public.players for delete
  using (public.is_team_manager(team_id));


-- ── games ─────────────────────────────────────────────────────────────────────
create policy "games_select_member"
  on public.games for select
  using (public.is_team_member(team_id));

create policy "games_insert_staff"
  on public.games for insert
  with check (public.is_team_staff(team_id));

create policy "games_update_staff"
  on public.games for update
  using (public.is_team_staff(team_id));

create policy "games_delete_manager"
  on public.games for delete
  using (public.is_team_manager(team_id));


-- ── video_assets ──────────────────────────────────────────────────────────────
create policy "video_assets_select_member"
  on public.video_assets for select
  using (public.is_team_member(team_id));

create policy "video_assets_insert_staff"
  on public.video_assets for insert
  with check (public.is_team_staff(team_id));

create policy "video_assets_update_staff"
  on public.video_assets for update
  using (public.is_team_staff(team_id));

create policy "video_assets_delete_manager"
  on public.video_assets for delete
  using (public.is_team_manager(team_id));


-- ── event_timestamps ──────────────────────────────────────────────────────────
create policy "event_timestamps_select_member"
  on public.event_timestamps for select
  using (public.is_team_member(team_id));

create policy "event_timestamps_insert_staff"
  on public.event_timestamps for insert
  with check (public.is_team_staff(team_id));

create policy "event_timestamps_update_staff"
  on public.event_timestamps for update
  using (public.is_team_staff(team_id));

create policy "event_timestamps_delete_staff"
  on public.event_timestamps for delete
  using (public.is_team_staff(team_id));


-- ── clips ─────────────────────────────────────────────────────────────────────
create policy "clips_select_member"
  on public.clips for select
  using (public.is_team_member(team_id));

create policy "clips_insert_staff"
  on public.clips for insert
  with check (public.is_team_staff(team_id));

create policy "clips_update_staff"
  on public.clips for update
  using (public.is_team_staff(team_id));

create policy "clips_delete_manager"
  on public.clips for delete
  using (public.is_team_manager(team_id));


-- ── analysis_jobs ─────────────────────────────────────────────────────────────
create policy "analysis_jobs_select_member"
  on public.analysis_jobs for select
  using (public.is_team_member(team_id));

create policy "analysis_jobs_insert_staff"
  on public.analysis_jobs for insert
  with check (public.is_team_staff(team_id));

create policy "analysis_jobs_update_staff"
  on public.analysis_jobs for update
  using (public.is_team_staff(team_id));

create policy "analysis_jobs_delete_manager"
  on public.analysis_jobs for delete
  using (public.is_team_manager(team_id));


-- ── game_reports ──────────────────────────────────────────────────────────────
create policy "game_reports_select_member"
  on public.game_reports for select
  using (public.is_team_member(team_id));

create policy "game_reports_insert_staff"
  on public.game_reports for insert
  with check (public.is_team_staff(team_id));

create policy "game_reports_update_staff"
  on public.game_reports for update
  using (public.is_team_staff(team_id));

create policy "game_reports_delete_manager"
  on public.game_reports for delete
  using (public.is_team_manager(team_id));


-- ── coaching_insights ─────────────────────────────────────────────────────────
create policy "coaching_insights_select_member"
  on public.coaching_insights for select
  using (public.is_team_member(team_id));

create policy "coaching_insights_insert_staff"
  on public.coaching_insights for insert
  with check (public.is_team_staff(team_id));

create policy "coaching_insights_update_staff"
  on public.coaching_insights for update
  using (public.is_team_staff(team_id));

create policy "coaching_insights_delete_manager"
  on public.coaching_insights for delete
  using (public.is_team_manager(team_id));


-- ── player_reports ────────────────────────────────────────────────────────────
create policy "player_reports_select_member"
  on public.player_reports for select
  using (public.is_team_member(team_id));

create policy "player_reports_insert_staff"
  on public.player_reports for insert
  with check (public.is_team_staff(team_id));

create policy "player_reports_update_staff"
  on public.player_reports for update
  using (public.is_team_staff(team_id));

create policy "player_reports_delete_manager"
  on public.player_reports for delete
  using (public.is_team_manager(team_id));


-- ── practice_recommendations ──────────────────────────────────────────────────
create policy "practice_recs_select_member"
  on public.practice_recommendations for select
  using (public.is_team_member(team_id));

create policy "practice_recs_insert_staff"
  on public.practice_recommendations for insert
  with check (public.is_team_staff(team_id));

create policy "practice_recs_update_staff"
  on public.practice_recommendations for update
  using (public.is_team_staff(team_id));

create policy "practice_recs_delete_manager"
  on public.practice_recommendations for delete
  using (public.is_team_manager(team_id));


-- ── opponent_tendencies ───────────────────────────────────────────────────────
create policy "opponent_tendencies_select_member"
  on public.opponent_tendencies for select
  using (public.is_team_member(team_id));

create policy "opponent_tendencies_insert_staff"
  on public.opponent_tendencies for insert
  with check (public.is_team_staff(team_id));

create policy "opponent_tendencies_update_staff"
  on public.opponent_tendencies for update
  using (public.is_team_staff(team_id));

create policy "opponent_tendencies_delete_manager"
  on public.opponent_tendencies for delete
  using (public.is_team_manager(team_id));


-- ── verification_feedback ─────────────────────────────────────────────────────
-- Append-only by staff; any team member can read.
create policy "verification_feedback_select_member"
  on public.verification_feedback for select
  using (public.is_team_member(team_id));

create policy "verification_feedback_insert_staff"
  on public.verification_feedback for insert
  with check (public.is_team_staff(team_id));

-- No update/delete — verification_feedback is an immutable audit trail.


-- ── share_links ───────────────────────────────────────────────────────────────
-- Anyone can select via valid token (for the public report viewer — no auth required).
-- Only staff can create/manage share links.
create policy "share_links_select_member"
  on public.share_links for select
  using (public.is_team_member(team_id));

-- Public token lookup: allows unauthenticated access for the share viewer.
-- This policy is intentionally permissive for token-based access.
create policy "share_links_select_by_token"
  on public.share_links for select
  using (
    revoked_at is null
    and (expires_at is null or expires_at > now())
  );

create policy "share_links_insert_staff"
  on public.share_links for insert
  with check (public.is_team_staff(team_id));

create policy "share_links_update_staff"
  on public.share_links for update
  using (public.is_team_staff(team_id));

create policy "share_links_delete_manager"
  on public.share_links for delete
  using (public.is_team_manager(team_id));


-- ── exports ───────────────────────────────────────────────────────────────────
create policy "exports_select_member"
  on public.exports for select
  using (public.is_team_member(team_id));

create policy "exports_insert_staff"
  on public.exports for insert
  with check (public.is_team_staff(team_id));

create policy "exports_update_staff"
  on public.exports for update
  using (public.is_team_staff(team_id));

create policy "exports_delete_manager"
  on public.exports for delete
  using (public.is_team_manager(team_id));


-- ---------------------------------------------------------------------------
-- 7. Storage Bucket Setup
-- NOTE: Storage bucket creation may need to be done via the Supabase Dashboard
-- or Supabase CLI depending on your project setup.
-- If running in the SQL editor with storage extension available, uncomment:
-- ---------------------------------------------------------------------------
/*
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('game-videos',     'game-videos',     false, 5368709120, array['video/mp4','video/quicktime','video/x-msvideo','video/webm']),
  ('game-thumbnails', 'game-thumbnails', false, 10485760,   array['image/jpeg','image/png','image/webp']),
  ('report-exports',  'report-exports',  false, 52428800,   array['application/pdf'])
on conflict (id) do nothing;

-- Storage RLS policies (require storage extension policies)
-- See /docs/SUPABASE_SETUP.md for storage policy setup instructions.
*/


-- ---------------------------------------------------------------------------
-- 8. Comments (for documentation in pg_description)
-- ---------------------------------------------------------------------------
comment on table public.profiles             is 'App-level user profiles, 1:1 with auth.users.';
comment on table public.teams               is 'Team workspaces — the core organizational unit in GameIQ.';
comment on table public.team_members        is 'User membership and roles within a team.';
comment on table public.players             is 'Roster players belonging to a team.';
comment on table public.games               is 'Game, practice, scrimmage, or film session records.';
comment on table public.video_assets        is 'Metadata for uploaded game/practice videos.';
comment on table public.event_timestamps    is 'Manual or AI-detected events linked to video timestamps.';
comment on table public.clips               is 'Time-bounded video clip references.';
comment on table public.analysis_jobs       is 'AI analysis request queue and status tracking.';
comment on table public.game_reports        is 'Generated game analysis reports (versioned).';
comment on table public.coaching_insights   is 'Top AI-generated coaching insights from a report.';
comment on table public.player_reports      is 'Player-specific report sections.';
comment on table public.practice_recommendations is 'AI-generated next-practice recommendations.';
comment on table public.opponent_tendencies is 'Opponent patterns inferred from notes and events.';
comment on table public.verification_feedback is 'Immutable log of coach verification actions on AI outputs.';
comment on table public.share_links         is 'Shareable report access tokens with expiry and visibility control.';
comment on table public.exports             is 'PDF/report export job tracking.';
