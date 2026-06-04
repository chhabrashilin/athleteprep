-- ---------------------------------------------------------------------------
-- 0015_cricket_league_admin_foundation.sql
-- Cricket League Admin Foundation — Prompt 29
--
-- Safely extends the cricket league foundation without destroying existing data.
-- Adds admin columns to cricket_leagues, creates cricket_league_settings,
-- cricket_league_invitations, and cricket_league_admin_audit_logs.
-- Also creates helper RLS functions and updates cricket_leagues UPDATE policy
-- to allow admin-role members to update leagues they manage.
--
-- Safe to run multiple times: uses IF NOT EXISTS / DO blocks.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 0. Helper functions for RLS (idempotent via CREATE OR REPLACE)
-- ---------------------------------------------------------------------------

create or replace function public.is_cricket_league_member(
  _league_id uuid,
  _user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.cricket_league_members
    where league_id = _league_id
      and user_id = _user_id
  );
$$;

create or replace function public.has_cricket_league_role(
  _league_id uuid,
  _user_id uuid,
  _roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.cricket_league_members
    where league_id = _league_id
      and user_id = _user_id
      and role = any(_roles)
  );
$$;


-- ---------------------------------------------------------------------------
-- 1A. Add new admin columns to cricket_leagues (idempotent)
-- ---------------------------------------------------------------------------

alter table public.cricket_leagues
  add column if not exists visibility           text        not null default 'private',
  add column if not exists registration_status  text        not null default 'draft',
  add column if not exists timezone             text        not null default 'America/New_York',
  add column if not exists ball_type            text,
  add column if not exists match_days           text[]      not null default '{}',
  add column if not exists rules_summary        text,
  add column if not exists contact_email        text,
  add column if not exists website_url          text,
  add column if not exists allow_public_scorecards   boolean not null default false,
  add column if not exists allow_team_registration   boolean not null default false,
  add column if not exists allow_player_registration boolean not null default false,
  add column if not exists require_admin_approval    boolean not null default true;


-- ---------------------------------------------------------------------------
-- 1B. Add check constraints on cricket_leagues (idempotent via DO block)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_leagues_visibility_check'
      and conrelid = 'public.cricket_leagues'::regclass
  ) then
    alter table public.cricket_leagues
      add constraint cricket_leagues_visibility_check
      check (visibility in ('private', 'unlisted', 'public'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_leagues_registration_status_check'
      and conrelid = 'public.cricket_leagues'::regclass
  ) then
    alter table public.cricket_leagues
      add constraint cricket_leagues_registration_status_check
      check (registration_status in ('draft', 'open', 'closed', 'archived'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_leagues_format_check'
      and conrelid = 'public.cricket_leagues'::regclass
  ) then
    alter table public.cricket_leagues
      add constraint cricket_leagues_format_check
      check (format in ('round_robin', 'knockout', 'group_stage', 'franchise', 'friendly', 'custom'));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 1C. Update cricket_leagues UPDATE policy to include admin-role members
-- ---------------------------------------------------------------------------

drop policy if exists "cricket_leagues_update" on public.cricket_leagues;

create policy "cricket_leagues_update"
  on public.cricket_leagues for update
  to authenticated
  using (
    created_by = auth.uid()
    or public.has_cricket_league_role(id, auth.uid(), array['owner', 'admin'])
  );


-- ---------------------------------------------------------------------------
-- 1D. Indexes on new cricket_leagues columns
-- ---------------------------------------------------------------------------

create index if not exists cricket_leagues_visibility_idx
  on public.cricket_leagues(visibility);

create index if not exists cricket_leagues_registration_status_idx
  on public.cricket_leagues(registration_status);


-- ---------------------------------------------------------------------------
-- 2. cricket_league_settings
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_league_settings (
  id                       uuid        primary key default gen_random_uuid(),
  league_id                uuid        not null references public.cricket_leagues(id) on delete cascade,
  scoring_mode             text        not null default 'standard',
  default_overs            integer     not null default 20,
  max_players_per_team     integer,
  min_players_per_team     integer,
  allow_substitutes        boolean     not null default true,
  allow_super_over         boolean     not null default true,
  allow_duckworth_lewis    boolean     not null default false,
  points_win               integer     not null default 2,
  points_loss              integer     not null default 0,
  points_tie               integer     not null default 1,
  points_no_result         integer     not null default 1,
  net_run_rate_enabled     boolean     not null default true,
  bonus_points_enabled     boolean     not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique(league_id),
  constraint league_settings_default_overs_positive check (default_overs > 0),
  constraint league_settings_max_players_positive   check (max_players_per_team is null or max_players_per_team > 0),
  constraint league_settings_min_players_positive   check (min_players_per_team is null or min_players_per_team > 0)
);

create index if not exists cricket_league_settings_league_id_idx
  on public.cricket_league_settings(league_id);

create trigger cricket_league_settings_updated_at
  before update on public.cricket_league_settings
  for each row execute function public.set_updated_at();

alter table public.cricket_league_settings enable row level security;

-- Read: league members can read settings
create policy "league_settings_read"
  on public.cricket_league_settings for select
  to authenticated
  using (
    public.is_cricket_league_member(league_id, auth.uid())
    or exists (
      select 1 from public.cricket_leagues
      where id = league_id and created_by = auth.uid()
    )
  );

-- Insert: league creator or owner/admin can insert settings
create policy "league_settings_insert"
  on public.cricket_league_settings for insert
  to authenticated
  with check (
    public.has_cricket_league_role(league_id, auth.uid(), array['owner', 'admin'])
    or exists (
      select 1 from public.cricket_leagues
      where id = league_id and created_by = auth.uid()
    )
  );

-- Update: league owner/admin can update settings
create policy "league_settings_update"
  on public.cricket_league_settings for update
  to authenticated
  using (
    public.has_cricket_league_role(league_id, auth.uid(), array['owner', 'admin'])
    or exists (
      select 1 from public.cricket_leagues
      where id = league_id and created_by = auth.uid()
    )
  );


-- ---------------------------------------------------------------------------
-- 3. cricket_league_invitations
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_league_invitations (
  id           uuid        primary key default gen_random_uuid(),
  league_id    uuid        not null references public.cricket_leagues(id) on delete cascade,
  email        text        not null,
  role         text        not null default 'member'
                           check (role in ('admin', 'manager', 'scorer', 'player', 'fan', 'member')),
  status       text        not null default 'pending'
                           check (status in ('pending', 'accepted', 'expired', 'revoked')),
  invited_by   uuid        references auth.users(id) on delete set null,
  invited_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  expires_at   timestamptz,
  token        text        unique
);

create index if not exists cricket_league_invitations_league_id_idx
  on public.cricket_league_invitations(league_id);

create index if not exists cricket_league_invitations_email_idx
  on public.cricket_league_invitations(email);

create index if not exists cricket_league_invitations_status_idx
  on public.cricket_league_invitations(status);

alter table public.cricket_league_invitations enable row level security;

-- Read: league owner/admin can read invitations for their league
create policy "league_invitations_read"
  on public.cricket_league_invitations for select
  to authenticated
  using (
    public.has_cricket_league_role(league_id, auth.uid(), array['owner', 'admin'])
    or exists (
      select 1 from public.cricket_leagues
      where id = league_id and created_by = auth.uid()
    )
  );

-- Insert: league owner/admin can create invitations
create policy "league_invitations_insert"
  on public.cricket_league_invitations for insert
  to authenticated
  with check (
    public.has_cricket_league_role(league_id, auth.uid(), array['owner', 'admin'])
    or exists (
      select 1 from public.cricket_leagues
      where id = league_id and created_by = auth.uid()
    )
  );

-- Update: league owner/admin can update invitations (e.g., revoke)
create policy "league_invitations_update"
  on public.cricket_league_invitations for update
  to authenticated
  using (
    public.has_cricket_league_role(league_id, auth.uid(), array['owner', 'admin'])
    or exists (
      select 1 from public.cricket_leagues
      where id = league_id and created_by = auth.uid()
    )
  );


-- ---------------------------------------------------------------------------
-- 4. cricket_league_admin_audit_logs
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_league_admin_audit_logs (
  id             uuid        primary key default gen_random_uuid(),
  league_id      uuid        references public.cricket_leagues(id) on delete cascade,
  actor_user_id  uuid        references auth.users(id) on delete set null,
  action         text        not null,
  entity_type    text,
  entity_id      uuid,
  metadata       jsonb       not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists cricket_league_admin_audit_logs_league_id_idx
  on public.cricket_league_admin_audit_logs(league_id);

create index if not exists cricket_league_admin_audit_logs_actor_idx
  on public.cricket_league_admin_audit_logs(actor_user_id);

create index if not exists cricket_league_admin_audit_logs_created_at_idx
  on public.cricket_league_admin_audit_logs(created_at);

alter table public.cricket_league_admin_audit_logs enable row level security;

-- Read: league owner/admin can read audit logs
create policy "league_audit_logs_read"
  on public.cricket_league_admin_audit_logs for select
  to authenticated
  using (
    public.has_cricket_league_role(league_id, auth.uid(), array['owner', 'admin'])
    or exists (
      select 1 from public.cricket_leagues
      where id = league_id and created_by = auth.uid()
    )
  );

-- Insert: authenticated users can insert logs where they are the actor
-- The server action is responsible for ensuring only valid actions are logged.
create policy "league_audit_logs_insert"
  on public.cricket_league_admin_audit_logs for insert
  to authenticated
  with check (actor_user_id = auth.uid());
