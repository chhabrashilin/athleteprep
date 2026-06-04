-- ---------------------------------------------------------------------------
-- 0022_cricket_streaming_broadcast_overlays.sql
-- Cricket Streaming & Broadcast Overlay System — Prompt 36
--
-- Adds: cricket_streaming_channels, cricket_match_streams,
--       cricket_overlay_themes, cricket_overlay_tokens,
--       cricket_stream_events, cricket_stream_health_checks,
--       cricket_broadcast_checklists.
-- Extends cricket_matches with broadcast columns.
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
-- 2. cricket_streaming_channels
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_streaming_channels (
  id                   uuid         primary key default gen_random_uuid(),
  league_id            uuid         references public.cricket_leagues(id) on delete cascade,
  team_id              uuid         references public.cricket_teams(id) on delete set null,
  name                 text         not null,
  slug                 text         not null,
  provider             text         not null default 'overlay_only',
  provider_channel_id  text,
  public_watch_url     text,
  embed_url            text,
  rtmp_ingest_url      text,
  stream_key_encrypted text,
  is_active            boolean      not null default true,
  created_by           uuid         references auth.users(id) on delete set null,
  created_at           timestamptz  not null default now(),
  updated_at           timestamptz  not null default now(),
  constraint cricket_streaming_channels_league_slug_unique unique (league_id, slug)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_streaming_channels_provider_check'
      and conrelid = 'public.cricket_streaming_channels'::regclass
  ) then
    alter table public.cricket_streaming_channels
      add constraint cricket_streaming_channels_provider_check
      check (provider in ('overlay_only','youtube','twitch','custom_rtmp','external_embed'));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 3. cricket_match_streams
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_match_streams (
  id                      uuid         primary key default gen_random_uuid(),
  match_id                uuid         not null references public.cricket_matches(id) on delete cascade,
  league_id               uuid         references public.cricket_leagues(id) on delete cascade,
  channel_id              uuid         references public.cricket_streaming_channels(id) on delete set null,
  title                   text         not null,
  description             text,
  status                  text         not null default 'not_configured',
  provider                text         not null default 'overlay_only',
  public_watch_url        text,
  embed_url               text,
  scheduled_start         timestamptz,
  actual_start            timestamptz,
  actual_end              timestamptz,
  visibility              text         not null default 'league',
  allow_public_embed      boolean      not null default false,
  overlay_theme_id        uuid,
  stream_operator_user_id uuid         references auth.users(id) on delete set null,
  created_by              uuid         references auth.users(id) on delete set null,
  created_at              timestamptz  not null default now(),
  updated_at              timestamptz  not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_match_streams_status_check'
      and conrelid = 'public.cricket_match_streams'::regclass
  ) then
    alter table public.cricket_match_streams
      add constraint cricket_match_streams_status_check
      check (status in (
        'not_configured','scheduled','ready','live','paused','ended','failed','archived'
      ));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_match_streams_visibility_check'
      and conrelid = 'public.cricket_match_streams'::regclass
  ) then
    alter table public.cricket_match_streams
      add constraint cricket_match_streams_visibility_check
      check (visibility in ('private','league','unlisted','public'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_match_streams_provider_check'
      and conrelid = 'public.cricket_match_streams'::regclass
  ) then
    alter table public.cricket_match_streams
      add constraint cricket_match_streams_provider_check
      check (provider in ('overlay_only','youtube','twitch','custom_rtmp','external_embed'));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 4. cricket_overlay_themes
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_overlay_themes (
  id                uuid        primary key default gen_random_uuid(),
  league_id         uuid        references public.cricket_leagues(id) on delete cascade,
  team_id           uuid        references public.cricket_teams(id) on delete set null,
  name              text        not null,
  slug              text        not null,
  layout            text        not null default 'classic_scorebug',
  primary_color     text,
  secondary_color   text,
  accent_color      text,
  text_color        text,
  background_color  text,
  logo_url          text,
  sponsor_logo_url  text,
  sponsor_text      text,
  font_family       text,
  safe_area_top     integer     not null default 24,
  safe_area_bottom  integer     not null default 24,
  safe_area_left    integer     not null default 24,
  safe_area_right   integer     not null default 24,
  is_default        boolean     not null default false,
  created_by        uuid        references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint cricket_overlay_themes_league_slug_unique unique (league_id, slug)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_overlay_themes_layout_check'
      and conrelid = 'public.cricket_overlay_themes'::regclass
  ) then
    alter table public.cricket_overlay_themes
      add constraint cricket_overlay_themes_layout_check
      check (layout in (
        'classic_scorebug','lower_third','full_scorecard','innings_summary',
        'toss_card','result_card','minimal','vertical_mobile'
      ));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 5. cricket_overlay_tokens
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_overlay_tokens (
  id           uuid        primary key default gen_random_uuid(),
  match_id     uuid        not null references public.cricket_matches(id) on delete cascade,
  league_id    uuid        references public.cricket_leagues(id) on delete cascade,
  token_hash   text        not null unique,
  token_prefix text        not null,
  label        text,
  scope        text        not null default 'match_overlay',
  expires_at   timestamptz,
  revoked_at   timestamptz,
  created_by   uuid        references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_overlay_tokens_scope_check'
      and conrelid = 'public.cricket_overlay_tokens'::regclass
  ) then
    alter table public.cricket_overlay_tokens
      add constraint cricket_overlay_tokens_scope_check
      check (scope in ('match_overlay','scorebug','full_overlay','read_only_stream'));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 6. cricket_stream_events
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_stream_events (
  id               uuid        primary key default gen_random_uuid(),
  match_stream_id  uuid        references public.cricket_match_streams(id) on delete cascade,
  match_id         uuid        references public.cricket_matches(id) on delete cascade,
  league_id        uuid        references public.cricket_leagues(id) on delete cascade,
  actor_user_id    uuid        references auth.users(id) on delete set null,
  event_type       text        not null,
  event_payload    jsonb       not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- 7. cricket_stream_health_checks
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_stream_health_checks (
  id               uuid        primary key default gen_random_uuid(),
  match_stream_id  uuid        references public.cricket_match_streams(id) on delete cascade,
  match_id         uuid        references public.cricket_matches(id) on delete cascade,
  status           text        not null default 'unknown',
  latency_ms       integer,
  dropped_frames   integer,
  bitrate_kbps     integer,
  viewer_count     integer,
  message          text,
  checked_at       timestamptz not null default now(),
  created_by       uuid        references auth.users(id) on delete set null
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_stream_health_checks_status_check'
      and conrelid = 'public.cricket_stream_health_checks'::regclass
  ) then
    alter table public.cricket_stream_health_checks
      add constraint cricket_stream_health_checks_status_check
      check (status in ('unknown','healthy','warning','critical','offline'));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 8. cricket_broadcast_checklists
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_broadcast_checklists (
  id               uuid        primary key default gen_random_uuid(),
  match_id         uuid        not null references public.cricket_matches(id) on delete cascade,
  match_stream_id  uuid        references public.cricket_match_streams(id) on delete cascade,
  checklist_key    text        not null,
  label            text        not null,
  completed        boolean     not null default false,
  completed_by     uuid        references auth.users(id) on delete set null,
  completed_at     timestamptz,
  sort_order       integer     not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint cricket_broadcast_checklists_match_key_unique unique (match_id, checklist_key)
);


-- ---------------------------------------------------------------------------
-- 9. Extend cricket_matches with broadcast columns
-- ---------------------------------------------------------------------------

alter table public.cricket_matches
  add column if not exists broadcast_status         text        not null default 'not_configured',
  add column if not exists default_match_stream_id  uuid        references public.cricket_match_streams(id) on delete set null,
  add column if not exists public_broadcast_url     text,
  add column if not exists overlay_enabled          boolean     not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_matches_broadcast_status_check'
      and conrelid = 'public.cricket_matches'::regclass
  ) then
    alter table public.cricket_matches
      add constraint cricket_matches_broadcast_status_check
      check (broadcast_status in (
        'not_configured','setup','ready','live','ended','failed'
      ));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 10. Indexes
-- ---------------------------------------------------------------------------

create index if not exists cricket_streaming_channels_league_idx
  on public.cricket_streaming_channels (league_id);

create index if not exists cricket_streaming_channels_slug_idx
  on public.cricket_streaming_channels (slug);

create index if not exists cricket_match_streams_match_idx
  on public.cricket_match_streams (match_id);

create index if not exists cricket_match_streams_league_idx
  on public.cricket_match_streams (league_id);

create index if not exists cricket_match_streams_status_idx
  on public.cricket_match_streams (status);

create index if not exists cricket_overlay_themes_league_idx
  on public.cricket_overlay_themes (league_id);

create index if not exists cricket_overlay_themes_slug_idx
  on public.cricket_overlay_themes (slug);

create index if not exists cricket_overlay_tokens_match_idx
  on public.cricket_overlay_tokens (match_id);

create index if not exists cricket_overlay_tokens_prefix_idx
  on public.cricket_overlay_tokens (token_prefix);

create index if not exists cricket_stream_events_match_idx
  on public.cricket_stream_events (match_id);

create index if not exists cricket_stream_events_stream_idx
  on public.cricket_stream_events (match_stream_id);

create index if not exists cricket_stream_events_type_idx
  on public.cricket_stream_events (event_type);

create index if not exists cricket_stream_health_checks_stream_idx
  on public.cricket_stream_health_checks (match_stream_id);

create index if not exists cricket_stream_health_checks_status_idx
  on public.cricket_stream_health_checks (status);

create index if not exists cricket_broadcast_checklists_match_idx
  on public.cricket_broadcast_checklists (match_id);

create index if not exists cricket_matches_broadcast_status_idx
  on public.cricket_matches (broadcast_status);


-- ---------------------------------------------------------------------------
-- 11. updated_at triggers
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_streaming_channels'
  ) then
    create trigger set_updated_at_cricket_streaming_channels
      before update on public.cricket_streaming_channels
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_match_streams'
  ) then
    create trigger set_updated_at_cricket_match_streams
      before update on public.cricket_match_streams
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_overlay_themes'
  ) then
    create trigger set_updated_at_cricket_overlay_themes
      before update on public.cricket_overlay_themes
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_broadcast_checklists'
  ) then
    create trigger set_updated_at_cricket_broadcast_checklists
      before update on public.cricket_broadcast_checklists
      for each row execute function public.set_updated_at();
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 12. Row-Level Security
-- ---------------------------------------------------------------------------

alter table public.cricket_streaming_channels    enable row level security;
alter table public.cricket_match_streams         enable row level security;
alter table public.cricket_overlay_themes        enable row level security;
alter table public.cricket_overlay_tokens        enable row level security;
alter table public.cricket_stream_events         enable row level security;
alter table public.cricket_stream_health_checks  enable row level security;
alter table public.cricket_broadcast_checklists  enable row level security;


-- ── cricket_streaming_channels ───────────────────────────────────────────────

drop policy if exists "channels_select_members" on public.cricket_streaming_channels;
create policy "channels_select_members"
  on public.cricket_streaming_channels for select
  using (
    is_active = true
    and public.is_cricket_league_member(league_id, auth.uid())
  );

drop policy if exists "channels_manage_admins" on public.cricket_streaming_channels;
create policy "channels_manage_admins"
  on public.cricket_streaming_channels for all
  using (
    public.has_cricket_league_role(league_id, auth.uid(), array['owner','admin','manager'])
  )
  with check (
    public.has_cricket_league_role(league_id, auth.uid(), array['owner','admin','manager'])
  );


-- ── cricket_match_streams ─────────────────────────────────────────────────────

drop policy if exists "match_streams_select_league_members" on public.cricket_match_streams;
create policy "match_streams_select_league_members"
  on public.cricket_match_streams for select
  using (
    visibility in ('league','unlisted','public')
    and (
      visibility = 'public'
      or public.is_cricket_league_member(league_id, auth.uid())
    )
  );

drop policy if exists "match_streams_select_public" on public.cricket_match_streams;
create policy "match_streams_select_public"
  on public.cricket_match_streams for select
  using (
    visibility = 'public'
    and allow_public_embed = true
    and auth.uid() is null
  );

drop policy if exists "match_streams_manage_admins" on public.cricket_match_streams;
create policy "match_streams_manage_admins"
  on public.cricket_match_streams for all
  using (
    public.has_cricket_league_role(league_id, auth.uid(), array['owner','admin','manager'])
  )
  with check (
    public.has_cricket_league_role(league_id, auth.uid(), array['owner','admin','manager'])
  );


-- ── cricket_overlay_themes ────────────────────────────────────────────────────

drop policy if exists "overlay_themes_select_members" on public.cricket_overlay_themes;
create policy "overlay_themes_select_members"
  on public.cricket_overlay_themes for select
  using (
    public.is_cricket_league_member(league_id, auth.uid())
  );

drop policy if exists "overlay_themes_manage_admins" on public.cricket_overlay_themes;
create policy "overlay_themes_manage_admins"
  on public.cricket_overlay_themes for all
  using (
    public.has_cricket_league_role(league_id, auth.uid(), array['owner','admin','manager'])
  )
  with check (
    public.has_cricket_league_role(league_id, auth.uid(), array['owner','admin','manager'])
  );


-- ── cricket_overlay_tokens ────────────────────────────────────────────────────

drop policy if exists "overlay_tokens_manage_admins" on public.cricket_overlay_tokens;
create policy "overlay_tokens_manage_admins"
  on public.cricket_overlay_tokens for all
  using (
    public.has_cricket_league_role(league_id, auth.uid(), array['owner','admin','manager'])
  )
  with check (
    public.has_cricket_league_role(league_id, auth.uid(), array['owner','admin','manager'])
  );


-- ── cricket_stream_events ─────────────────────────────────────────────────────

drop policy if exists "stream_events_select_managers" on public.cricket_stream_events;
create policy "stream_events_select_managers"
  on public.cricket_stream_events for select
  using (
    public.has_cricket_league_role(league_id, auth.uid(), array['owner','admin','manager'])
  );

drop policy if exists "stream_events_insert_managers" on public.cricket_stream_events;
create policy "stream_events_insert_managers"
  on public.cricket_stream_events for insert
  with check (
    public.has_cricket_league_role(league_id, auth.uid(), array['owner','admin','manager'])
  );


-- ── cricket_stream_health_checks ─────────────────────────────────────────────

drop policy if exists "stream_health_manage_managers" on public.cricket_stream_health_checks;
create policy "stream_health_manage_managers"
  on public.cricket_stream_health_checks for all
  using (
    exists (
      select 1 from public.cricket_match_streams ms
      where ms.id = match_stream_id
        and public.has_cricket_league_role(ms.league_id, auth.uid(), array['owner','admin','manager'])
    )
  )
  with check (
    exists (
      select 1 from public.cricket_match_streams ms
      where ms.id = match_stream_id
        and public.has_cricket_league_role(ms.league_id, auth.uid(), array['owner','admin','manager'])
    )
  );


-- ── cricket_broadcast_checklists ─────────────────────────────────────────────

drop policy if exists "checklists_select_members" on public.cricket_broadcast_checklists;
create policy "checklists_select_members"
  on public.cricket_broadcast_checklists for select
  using (
    exists (
      select 1 from public.cricket_matches m
      where m.id = match_id
        and public.is_cricket_league_member(m.league_id, auth.uid())
    )
  );

drop policy if exists "checklists_update_managers" on public.cricket_broadcast_checklists;
create policy "checklists_update_managers"
  on public.cricket_broadcast_checklists for update
  using (
    exists (
      select 1 from public.cricket_matches m
      where m.id = match_id
        and public.has_cricket_league_role(m.league_id, auth.uid(), array['owner','admin','manager','scorer'])
    )
  )
  with check (
    exists (
      select 1 from public.cricket_matches m
      where m.id = match_id
        and public.has_cricket_league_role(m.league_id, auth.uid(), array['owner','admin','manager','scorer'])
    )
  );

drop policy if exists "checklists_insert_managers" on public.cricket_broadcast_checklists;
create policy "checklists_insert_managers"
  on public.cricket_broadcast_checklists for insert
  with check (
    exists (
      select 1 from public.cricket_matches m
      where m.id = match_id
        and public.has_cricket_league_role(m.league_id, auth.uid(), array['owner','admin','manager'])
    )
  );
