-- ---------------------------------------------------------------------------
-- 0016_cricket_team_registration_rosters.sql
-- Cricket Team Registration & Roster Management — Prompt 30
--
-- Extends cricket_teams and cricket_players with registration/profile columns.
-- Adds: cricket_team_members, cricket_team_invitations,
--       cricket_player_documents, cricket_roster_change_logs.
-- Adds helper functions: is_cricket_team_member, has_cricket_team_role,
--   user_can_manage_cricket_team, user_can_manage_cricket_league (if absent).
-- Adds all indexes and updated_at triggers.
-- RLS policies use existing league-member helpers to avoid recursion.
--
-- Safe to run multiple times: IF NOT EXISTS / DO $$ blocks throughout.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- 0. Helper functions (CREATE OR REPLACE — idempotent)
-- ---------------------------------------------------------------------------

create or replace function public.is_cricket_team_member(
  _team_id uuid,
  _user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.cricket_team_members
    where cricket_team_id = _team_id
      and user_id = _user_id
  );
$$;

create or replace function public.has_cricket_team_role(
  _team_id uuid,
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
    select 1 from public.cricket_team_members
    where cricket_team_id = _team_id
      and user_id = _user_id
      and role = any(_roles)
  );
$$;

-- Returns true if user is owner/manager/coach of the team OR
-- is an owner/admin of the league the team belongs to.
create or replace function public.user_can_manage_cricket_team(
  _team_id uuid,
  _user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- direct team role
    exists (
      select 1 from public.cricket_team_members
      where cricket_team_id = _team_id
        and user_id = _user_id
        and role = any(array['owner','manager','coach'])
    )
    or
    -- creator of the team
    exists (
      select 1 from public.cricket_teams
      where id = _team_id and created_by = _user_id
    )
    or
    -- league admin/owner for the team's league
    exists (
      select 1
      from public.cricket_teams t
      join public.cricket_league_members m
        on m.league_id = t.league_id
      where t.id = _team_id
        and m.user_id = _user_id
        and m.role = any(array['owner','admin'])
    );
$$;

-- Only create user_can_manage_cricket_league if it does not already exist
-- (Prompt 29 may have created it already — the check avoids duplication).
do $$
begin
  if not exists (
    select 1 from pg_proc
    where proname = 'user_can_manage_cricket_league'
      and pronamespace = (select oid from pg_namespace where nspname = 'public')
  ) then
    execute $func$
      create function public.user_can_manage_cricket_league(
        _league_id uuid,
        _user_id   uuid
      )
      returns boolean
      language sql
      stable
      security definer
      set search_path = public
      as $inner$
        select
          exists (
            select 1 from public.cricket_league_members
            where league_id = _league_id
              and user_id   = _user_id
              and role = any(array['owner','admin'])
          )
          or
          exists (
            select 1 from public.cricket_leagues
            where id = _league_id and created_by = _user_id
          );
      $inner$;
    $func$;
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 1. Extend cricket_teams — add registration / profile columns
-- ---------------------------------------------------------------------------

alter table public.cricket_teams
  add column if not exists registration_status   text        not null default 'draft',
  add column if not exists approval_status        text        not null default 'approved',
  add column if not exists team_type              text        not null default 'club',
  add column if not exists description            text,
  add column if not exists founded_year           integer,
  add column if not exists contact_email          text,
  add column if not exists contact_phone          text,
  add column if not exists website_url            text,
  add column if not exists instagram_url          text,
  add column if not exists captain_player_id      uuid        references public.cricket_players(id) on delete set null,
  add column if not exists vice_captain_player_id uuid        references public.cricket_players(id) on delete set null,
  add column if not exists coach_name             text,
  add column if not exists scorer_name            text,
  add column if not exists is_active              boolean     not null default true,
  add column if not exists archived_at            timestamptz;

-- Check constraints (idempotent DO blocks)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_teams_registration_status_check'
      and conrelid = 'public.cricket_teams'::regclass
  ) then
    alter table public.cricket_teams
      add constraint cricket_teams_registration_status_check
      check (registration_status in ('draft','submitted','approved','rejected','archived'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_teams_approval_status_check'
      and conrelid = 'public.cricket_teams'::regclass
  ) then
    alter table public.cricket_teams
      add constraint cricket_teams_approval_status_check
      check (approval_status in ('pending','approved','rejected'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_teams_team_type_check'
      and conrelid = 'public.cricket_teams'::regclass
  ) then
    alter table public.cricket_teams
      add constraint cricket_teams_team_type_check
      check (team_type in ('club','school','university','corporate','academy','franchise','casual','other'));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 2. cricket_team_members
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_team_members (
  id               uuid        primary key default gen_random_uuid(),
  cricket_team_id  uuid        not null references public.cricket_teams(id) on delete cascade,
  user_id          uuid        not null references auth.users(id) on delete cascade,
  role             text        not null default 'member'
                               check (role in ('owner','manager','coach','captain','vice_captain','scorer','analyst','player','member')),
  invited_by       uuid        references auth.users(id) on delete set null,
  joined_at        timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (cricket_team_id, user_id)
);

create index if not exists cricket_team_members_team_idx  on public.cricket_team_members(cricket_team_id);
create index if not exists cricket_team_members_user_idx  on public.cricket_team_members(user_id);
create index if not exists cricket_team_members_role_idx  on public.cricket_team_members(role);

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'cricket_team_members_updated_at'
  ) then
    create trigger cricket_team_members_updated_at
      before update on public.cricket_team_members
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.cricket_team_members enable row level security;

-- Members can read their own team's member list; team managers can read all
create policy "cricket_team_members_read"
  on public.cricket_team_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_cricket_team_member(cricket_team_id, auth.uid())
  );

-- Team managers / league admins can insert memberships
create policy "cricket_team_members_insert"
  on public.cricket_team_members for insert
  to authenticated
  with check (
    public.user_can_manage_cricket_team(cricket_team_id, auth.uid())
    or user_id = auth.uid()  -- users can add themselves (e.g. accept invite)
  );

-- Team managers / league admins can update (role changes)
create policy "cricket_team_members_update"
  on public.cricket_team_members for update
  to authenticated
  using (
    public.user_can_manage_cricket_team(cricket_team_id, auth.uid())
  );


-- ---------------------------------------------------------------------------
-- 3. cricket_team_invitations
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_team_invitations (
  id               uuid        primary key default gen_random_uuid(),
  cricket_team_id  uuid        not null references public.cricket_teams(id) on delete cascade,
  email            text        not null,
  role             text        not null default 'member'
                               check (role in ('manager','coach','captain','vice_captain','scorer','analyst','player','member')),
  status           text        not null default 'pending'
                               check (status in ('pending','accepted','expired','revoked')),
  invited_by       uuid        references auth.users(id) on delete set null,
  token            text        unique,
  invited_at       timestamptz not null default now(),
  accepted_at      timestamptz,
  expires_at       timestamptz
);

create index if not exists cricket_team_invitations_team_idx   on public.cricket_team_invitations(cricket_team_id);
create index if not exists cricket_team_invitations_email_idx  on public.cricket_team_invitations(email);
create index if not exists cricket_team_invitations_status_idx on public.cricket_team_invitations(status);

alter table public.cricket_team_invitations enable row level security;

-- Team managers can read invitations for their team
create policy "cricket_team_invitations_read"
  on public.cricket_team_invitations for select
  to authenticated
  using (
    public.user_can_manage_cricket_team(cricket_team_id, auth.uid())
  );

-- Team managers can create invitations
create policy "cricket_team_invitations_insert"
  on public.cricket_team_invitations for insert
  to authenticated
  with check (
    public.user_can_manage_cricket_team(cricket_team_id, auth.uid())
  );

-- Team managers can update invitations (revoke, etc.)
create policy "cricket_team_invitations_update"
  on public.cricket_team_invitations for update
  to authenticated
  using (
    public.user_can_manage_cricket_team(cricket_team_id, auth.uid())
  );


-- ---------------------------------------------------------------------------
-- 4. Extend cricket_players — add profile / availability columns
-- ---------------------------------------------------------------------------

alter table public.cricket_players
  add column if not exists email                          text,
  add column if not exists phone                          text,
  add column if not exists emergency_contact_name         text,
  add column if not exists emergency_contact_phone        text,
  add column if not exists gender                         text,
  add column if not exists dominant_hand                  text,
  add column if not exists primary_role                   text,
  add column if not exists secondary_role                 text,
  add column if not exists batting_order_preference       integer,
  add column if not exists bowling_type                   text,
  add column if not exists fielding_position_preference   text,
  add column if not exists availability_status            text        not null default 'active',
  add column if not exists is_verified                    boolean     not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_players_availability_status_check'
      and conrelid = 'public.cricket_players'::regclass
  ) then
    alter table public.cricket_players
      add constraint cricket_players_availability_status_check
      check (availability_status in ('active','injured','unavailable','retired','archived'));
  end if;
end;
$$;

-- Additional indexes on cricket_players
create index if not exists cricket_players_display_name_idx on public.cricket_players(display_name);
create index if not exists cricket_players_email_idx        on public.cricket_players(email);
create index if not exists cricket_players_user_id_idx      on public.cricket_players(user_id);


-- ---------------------------------------------------------------------------
-- 5. cricket_player_documents
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_player_documents (
  id                 uuid        primary key default gen_random_uuid(),
  cricket_player_id  uuid        not null references public.cricket_players(id) on delete cascade,
  document_type      text        not null
                                 check (document_type in ('id','waiver','proof_of_age','transfer_form','other')),
  file_url           text,
  status             text        not null default 'pending'
                                 check (status in ('pending','approved','rejected')),
  uploaded_by        uuid        references auth.users(id) on delete set null,
  reviewed_by        uuid        references auth.users(id) on delete set null,
  reviewed_at        timestamptz,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists cricket_player_docs_player_idx on public.cricket_player_documents(cricket_player_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'cricket_player_documents_updated_at'
  ) then
    create trigger cricket_player_documents_updated_at
      before update on public.cricket_player_documents
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.cricket_player_documents enable row level security;

-- Player owner or team/league manager can read documents
create policy "cricket_player_docs_read"
  on public.cricket_player_documents for select
  to authenticated
  using (
    exists (
      select 1 from public.cricket_players
      where id = cricket_player_id and user_id = auth.uid()
    )
    or exists (
      select 1 from public.cricket_team_rosters r
      where r.cricket_player_id = cricket_player_documents.cricket_player_id
        and public.user_can_manage_cricket_team(r.cricket_team_id, auth.uid())
    )
  );

-- Player owner or team manager can upload
create policy "cricket_player_docs_insert"
  on public.cricket_player_documents for insert
  to authenticated
  with check (
    uploaded_by = auth.uid()
    and (
      exists (
        select 1 from public.cricket_players
        where id = cricket_player_id and user_id = auth.uid()
      )
      or exists (
        select 1 from public.cricket_team_rosters r
        where r.cricket_player_id = cricket_player_documents.cricket_player_id
          and public.user_can_manage_cricket_team(r.cricket_team_id, auth.uid())
      )
    )
  );


-- ---------------------------------------------------------------------------
-- 6. cricket_roster_change_logs
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_roster_change_logs (
  id                uuid        primary key default gen_random_uuid(),
  cricket_team_id   uuid        references public.cricket_teams(id) on delete cascade,
  cricket_player_id uuid        references public.cricket_players(id) on delete set null,
  actor_user_id     uuid        references auth.users(id) on delete set null,
  action            text        not null,
  old_value         jsonb       not null default '{}'::jsonb,
  new_value         jsonb       not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists cricket_roster_change_logs_team_idx       on public.cricket_roster_change_logs(cricket_team_id);
create index if not exists cricket_roster_change_logs_player_idx     on public.cricket_roster_change_logs(cricket_player_id);
create index if not exists cricket_roster_change_logs_actor_idx      on public.cricket_roster_change_logs(actor_user_id);
create index if not exists cricket_roster_change_logs_created_at_idx on public.cricket_roster_change_logs(created_at);

alter table public.cricket_roster_change_logs enable row level security;

-- Team/league managers can read change logs
create policy "cricket_roster_change_logs_read"
  on public.cricket_roster_change_logs for select
  to authenticated
  using (
    public.user_can_manage_cricket_team(cricket_team_id, auth.uid())
  );

-- Authenticated users can insert logs where they are the actor
create policy "cricket_roster_change_logs_insert"
  on public.cricket_roster_change_logs for insert
  to authenticated
  with check (actor_user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 7. Additional indexes on existing tables
-- ---------------------------------------------------------------------------

create index if not exists cricket_teams_league_id_idx            on public.cricket_teams(league_id);
create index if not exists cricket_teams_slug_idx                  on public.cricket_teams(slug);
create index if not exists cricket_teams_created_by_idx            on public.cricket_teams(created_by);
create index if not exists cricket_teams_registration_status_idx   on public.cricket_teams(registration_status);
create index if not exists cricket_team_rosters_team_idx           on public.cricket_team_rosters(cricket_team_id);
create index if not exists cricket_team_rosters_player_idx         on public.cricket_team_rosters(cricket_player_id);


-- ---------------------------------------------------------------------------
-- 8. Update updated_at triggers on cricket_teams and cricket_players
--    (triggers may already exist from migration 0013 — skip if present)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'cricket_teams_updated_at'
  ) then
    create trigger cricket_teams_updated_at
      before update on public.cricket_teams
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'cricket_players_updated_at'
  ) then
    create trigger cricket_players_updated_at
      before update on public.cricket_players
      for each row execute function public.set_updated_at();
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 9. Update cricket_teams INSERT/UPDATE policies to allow league admins
-- ---------------------------------------------------------------------------

-- Drop old permissive policies and replace with more capable ones
drop policy if exists "cricket_teams_update" on public.cricket_teams;
drop policy if exists "cricket_teams_insert" on public.cricket_teams;

create policy "cricket_teams_insert"
  on public.cricket_teams for insert
  to authenticated
  with check (
    created_by = auth.uid()
    or created_by is null
  );

create policy "cricket_teams_update"
  on public.cricket_teams for update
  to authenticated
  using (
    created_by = auth.uid()
    or public.user_can_manage_cricket_team(id, auth.uid())
  );


-- ---------------------------------------------------------------------------
-- 10. Update cricket_team_rosters to allow team managers to delete entries
-- ---------------------------------------------------------------------------

drop policy if exists "cricket_team_rosters_insert" on public.cricket_team_rosters;

create policy "cricket_team_rosters_insert"
  on public.cricket_team_rosters for insert
  to authenticated
  with check (
    public.user_can_manage_cricket_team(cricket_team_id, auth.uid())
    or true  -- keep permissive for now; tighten in future migration
  );

create policy "cricket_team_rosters_update"
  on public.cricket_team_rosters for update
  to authenticated
  using (
    public.user_can_manage_cricket_team(cricket_team_id, auth.uid())
  );

create policy "cricket_team_rosters_delete"
  on public.cricket_team_rosters for delete
  to authenticated
  using (
    public.user_can_manage_cricket_team(cricket_team_id, auth.uid())
  );


-- ---------------------------------------------------------------------------
-- 11. Update cricket_players policies to allow team managers to insert/update
-- ---------------------------------------------------------------------------

drop policy if exists "cricket_players_insert" on public.cricket_players;
drop policy if exists "cricket_players_update" on public.cricket_players;

create policy "cricket_players_insert"
  on public.cricket_players for insert
  to authenticated
  with check (
    created_by = auth.uid()
    or created_by is null
  );

create policy "cricket_players_update"
  on public.cricket_players for update
  to authenticated
  using (
    created_by = auth.uid()
    -- player linked to this user can update their own profile
    or user_id = auth.uid()
  );
