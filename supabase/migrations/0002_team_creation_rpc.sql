-- =============================================================================
-- GameIQ — Team Creation RPC
-- File: 0002_team_creation_rpc.sql
-- Apply: supabase db push  OR  run in Supabase SQL editor
--
-- Rationale: The team_members INSERT policy requires is_team_manager(team_id),
-- which checks whether the current user is already an owner/coach of the team.
-- When a user creates a brand-new team they are not yet a member, so the direct
-- INSERT would be blocked by RLS. This SECURITY DEFINER function runs as the
-- function owner (postgres) and bypasses that policy, allowing it to atomically
-- create both the team row and the owner membership in a single transaction.
-- =============================================================================

create or replace function public.create_team_with_owner(
  p_name             text,
  p_sport            sport_type,
  p_slug             text    default null,
  p_organization_name text   default null,
  p_level            text    default null,
  p_location         text    default null,
  p_description      text    default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id  uuid;
  v_team_id  uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'create_team_with_owner: caller is not authenticated';
  end if;

  -- 1. Insert the team row (passes teams_insert_authenticated policy).
  insert into public.teams (
    name,
    slug,
    sport,
    organization_name,
    level,
    location,
    description,
    created_by
  ) values (
    p_name,
    p_slug,
    p_sport,
    p_organization_name,
    p_level,
    p_location,
    p_description,
    v_user_id
  )
  returning id into v_team_id;

  -- 2. Insert the owner membership (bypasses team_members_insert_manager policy
  --    because this function is SECURITY DEFINER — the RLS check is skipped).
  insert into public.team_members (
    team_id,
    user_id,
    role,
    joined_at
  ) values (
    v_team_id,
    v_user_id,
    'owner',
    now()
  );

  -- 3. Set profiles.default_team_id if the user has none yet.
  update public.profiles
  set default_team_id = v_team_id
  where id = v_user_id
    and default_team_id is null;

  return v_team_id;
end;
$$;

-- Grant execution rights to authenticated users only.
revoke execute on function public.create_team_with_owner(text, sport_type, text, text, text, text, text) from public;
grant  execute on function public.create_team_with_owner(text, sport_type, text, text, text, text, text) to authenticated;
