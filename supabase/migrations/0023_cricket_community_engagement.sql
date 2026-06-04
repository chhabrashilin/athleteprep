-- ---------------------------------------------------------------------------
-- 0023_cricket_community_engagement.sql
-- Cricket Community & Fan Engagement — Prompt 37
--
-- Adds: cricket_community_spaces, cricket_posts, cricket_comments,
--       cricket_reactions, cricket_polls, cricket_poll_options,
--       cricket_poll_votes, cricket_match_threads,
--       cricket_match_thread_messages, cricket_reports,
--       cricket_moderation_actions, cricket_notifications,
--       cricket_follows.
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
-- 2. cricket_community_spaces
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_community_spaces (
  id                  uuid         primary key default gen_random_uuid(),
  league_id           uuid         references public.cricket_leagues(id) on delete cascade,
  team_id             uuid         references public.cricket_teams(id) on delete cascade,
  match_id            uuid         references public.cricket_matches(id) on delete cascade,
  space_type          text         not null,
  name                text         not null,
  slug                text         not null,
  description         text,
  visibility          text         not null default 'league',
  posting_policy      text         not null default 'members',
  commenting_policy   text         not null default 'members',
  moderation_policy   text         not null default 'post_moderation',
  is_active           boolean      not null default true,
  created_by          uuid         references auth.users(id) on delete set null,
  created_at          timestamptz  not null default now(),
  updated_at          timestamptz  not null default now(),
  constraint cricket_community_spaces_unique_slug
    unique (league_id, team_id, match_id, slug)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_community_spaces_space_type_check'
      and conrelid = 'public.cricket_community_spaces'::regclass
  ) then
    alter table public.cricket_community_spaces
      add constraint cricket_community_spaces_space_type_check
      check (space_type in (
        'league','team','match','broadcast','announcement_board','discussion','news'
      ));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_community_spaces_visibility_check'
      and conrelid = 'public.cricket_community_spaces'::regclass
  ) then
    alter table public.cricket_community_spaces
      add constraint cricket_community_spaces_visibility_check
      check (visibility in ('private','league','team','unlisted','public'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_community_spaces_posting_policy_check'
      and conrelid = 'public.cricket_community_spaces'::regclass
  ) then
    alter table public.cricket_community_spaces
      add constraint cricket_community_spaces_posting_policy_check
      check (posting_policy in (
        'admins_only','managers_only','members','verified_players','public_disabled'
      ));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_community_spaces_commenting_policy_check'
      and conrelid = 'public.cricket_community_spaces'::regclass
  ) then
    alter table public.cricket_community_spaces
      add constraint cricket_community_spaces_commenting_policy_check
      check (commenting_policy in (
        'disabled','admins_only','members','public_authenticated'
      ));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_community_spaces_moderation_policy_check'
      and conrelid = 'public.cricket_community_spaces'::regclass
  ) then
    alter table public.cricket_community_spaces
      add constraint cricket_community_spaces_moderation_policy_check
      check (moderation_policy in (
        'pre_moderation','post_moderation','admins_only'
      ));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 3. cricket_posts
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_posts (
  id                  uuid         primary key default gen_random_uuid(),
  space_id            uuid         references public.cricket_community_spaces(id) on delete cascade,
  league_id           uuid         references public.cricket_leagues(id) on delete cascade,
  team_id             uuid         references public.cricket_teams(id) on delete set null,
  match_id            uuid         references public.cricket_matches(id) on delete set null,
  author_user_id      uuid         references auth.users(id) on delete set null,
  author_player_id    uuid         references public.cricket_players(id) on delete set null,
  post_type           text         not null default 'post',
  title               text,
  body                text         not null,
  media_urls          text[]       not null default '{}',
  link_url            text,
  visibility          text         not null default 'league',
  status              text         not null default 'published',
  pinned              boolean      not null default false,
  featured            boolean      not null default false,
  allow_comments      boolean      not null default true,
  moderation_status   text         not null default 'approved',
  published_at        timestamptz,
  edited_at           timestamptz,
  deleted_at          timestamptz,
  metadata            jsonb        not null default '{}'::jsonb,
  created_at          timestamptz  not null default now(),
  updated_at          timestamptz  not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_posts_post_type_check'
      and conrelid = 'public.cricket_posts'::regclass
  ) then
    alter table public.cricket_posts
      add constraint cricket_posts_post_type_check
      check (post_type in (
        'post','announcement','match_update','news','article',
        'poll_share','highlight','broadcast_update','result_update','admin_notice'
      ));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_posts_status_check'
      and conrelid = 'public.cricket_posts'::regclass
  ) then
    alter table public.cricket_posts
      add constraint cricket_posts_status_check
      check (status in ('draft','published','hidden','archived','deleted'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_posts_moderation_status_check'
      and conrelid = 'public.cricket_posts'::regclass
  ) then
    alter table public.cricket_posts
      add constraint cricket_posts_moderation_status_check
      check (moderation_status in (
        'pending','approved','rejected','flagged','removed'
      ));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_posts_visibility_check'
      and conrelid = 'public.cricket_posts'::regclass
  ) then
    alter table public.cricket_posts
      add constraint cricket_posts_visibility_check
      check (visibility in ('private','league','team','unlisted','public'));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 4. cricket_comments
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_comments (
  id                  uuid         primary key default gen_random_uuid(),
  post_id             uuid         not null references public.cricket_posts(id) on delete cascade,
  parent_comment_id   uuid         references public.cricket_comments(id) on delete cascade,
  author_user_id      uuid         references auth.users(id) on delete set null,
  author_player_id    uuid         references public.cricket_players(id) on delete set null,
  body                text         not null,
  status              text         not null default 'published',
  moderation_status   text         not null default 'approved',
  edited_at           timestamptz,
  deleted_at          timestamptz,
  created_at          timestamptz  not null default now(),
  updated_at          timestamptz  not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_comments_status_check'
      and conrelid = 'public.cricket_comments'::regclass
  ) then
    alter table public.cricket_comments
      add constraint cricket_comments_status_check
      check (status in ('published','hidden','deleted'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_comments_moderation_status_check'
      and conrelid = 'public.cricket_comments'::regclass
  ) then
    alter table public.cricket_comments
      add constraint cricket_comments_moderation_status_check
      check (moderation_status in (
        'pending','approved','rejected','flagged','removed'
      ));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 5. cricket_reactions
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_reactions (
  id            uuid         primary key default gen_random_uuid(),
  target_type   text         not null,
  target_id     uuid         not null,
  user_id       uuid         not null references auth.users(id) on delete cascade,
  reaction_type text         not null default 'like',
  created_at    timestamptz  not null default now(),
  constraint cricket_reactions_unique
    unique (target_type, target_id, user_id, reaction_type)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_reactions_target_type_check'
      and conrelid = 'public.cricket_reactions'::regclass
  ) then
    alter table public.cricket_reactions
      add constraint cricket_reactions_target_type_check
      check (target_type in ('post','comment','match','player','team'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_reactions_reaction_type_check'
      and conrelid = 'public.cricket_reactions'::regclass
  ) then
    alter table public.cricket_reactions
      add constraint cricket_reactions_reaction_type_check
      check (reaction_type in ('like','love','clap','fire','wow','support'));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 6. cricket_polls
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_polls (
  id                          uuid         primary key default gen_random_uuid(),
  post_id                     uuid         references public.cricket_posts(id) on delete cascade,
  league_id                   uuid         references public.cricket_leagues(id) on delete cascade,
  team_id                     uuid         references public.cricket_teams(id) on delete set null,
  match_id                    uuid         references public.cricket_matches(id) on delete set null,
  question                    text         not null,
  visibility                  text         not null default 'league',
  allow_multiple_votes        boolean      not null default false,
  allow_vote_change           boolean      not null default true,
  show_results_before_close   boolean      not null default true,
  status                      text         not null default 'open',
  opens_at                    timestamptz,
  closes_at                   timestamptz,
  created_by                  uuid         references auth.users(id) on delete set null,
  created_at                  timestamptz  not null default now(),
  updated_at                  timestamptz  not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_polls_status_check'
      and conrelid = 'public.cricket_polls'::regclass
  ) then
    alter table public.cricket_polls
      add constraint cricket_polls_status_check
      check (status in ('draft','open','closed','archived'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_polls_visibility_check'
      and conrelid = 'public.cricket_polls'::regclass
  ) then
    alter table public.cricket_polls
      add constraint cricket_polls_visibility_check
      check (visibility in ('private','league','team','unlisted','public'));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 7. cricket_poll_options
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_poll_options (
  id          uuid     primary key default gen_random_uuid(),
  poll_id     uuid     not null references public.cricket_polls(id) on delete cascade,
  option_text text     not null,
  sort_order  integer  not null default 0,
  created_at  timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- 8. cricket_poll_votes
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_poll_votes (
  id          uuid         primary key default gen_random_uuid(),
  poll_id     uuid         not null references public.cricket_polls(id) on delete cascade,
  option_id   uuid         not null references public.cricket_poll_options(id) on delete cascade,
  user_id     uuid         not null references auth.users(id) on delete cascade,
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now(),
  constraint cricket_poll_votes_unique
    unique (poll_id, option_id, user_id)
);


-- ---------------------------------------------------------------------------
-- 9. cricket_match_threads
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_match_threads (
  id                  uuid         primary key default gen_random_uuid(),
  match_id            uuid         not null references public.cricket_matches(id) on delete cascade,
  league_id           uuid         references public.cricket_leagues(id) on delete cascade,
  title               text         not null,
  visibility          text         not null default 'league',
  status              text         not null default 'open',
  slow_mode_seconds   integer      not null default 0,
  pinned_message      text,
  created_by          uuid         references auth.users(id) on delete set null,
  created_at          timestamptz  not null default now(),
  updated_at          timestamptz  not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_match_threads_status_check'
      and conrelid = 'public.cricket_match_threads'::regclass
  ) then
    alter table public.cricket_match_threads
      add constraint cricket_match_threads_status_check
      check (status in ('open','locked','archived'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_match_threads_visibility_check'
      and conrelid = 'public.cricket_match_threads'::regclass
  ) then
    alter table public.cricket_match_threads
      add constraint cricket_match_threads_visibility_check
      check (visibility in ('private','league','team','unlisted','public'));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 10. cricket_match_thread_messages
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_match_thread_messages (
  id                  uuid         primary key default gen_random_uuid(),
  thread_id           uuid         not null references public.cricket_match_threads(id) on delete cascade,
  match_id            uuid         references public.cricket_matches(id) on delete cascade,
  author_user_id      uuid         references auth.users(id) on delete set null,
  body                text         not null,
  message_type        text         not null default 'message',
  status              text         not null default 'published',
  moderation_status   text         not null default 'approved',
  edited_at           timestamptz,
  deleted_at          timestamptz,
  created_at          timestamptz  not null default now(),
  updated_at          timestamptz  not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_thread_messages_message_type_check'
      and conrelid = 'public.cricket_match_thread_messages'::regclass
  ) then
    alter table public.cricket_match_thread_messages
      add constraint cricket_thread_messages_message_type_check
      check (message_type in ('message','scorer_update','system','admin_notice'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_thread_messages_status_check'
      and conrelid = 'public.cricket_match_thread_messages'::regclass
  ) then
    alter table public.cricket_match_thread_messages
      add constraint cricket_thread_messages_status_check
      check (status in ('published','hidden','deleted'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_thread_messages_moderation_status_check'
      and conrelid = 'public.cricket_match_thread_messages'::regclass
  ) then
    alter table public.cricket_match_thread_messages
      add constraint cricket_thread_messages_moderation_status_check
      check (moderation_status in (
        'pending','approved','rejected','flagged','removed'
      ));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 11. cricket_reports
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_reports (
  id                  uuid         primary key default gen_random_uuid(),
  reporter_user_id    uuid         references auth.users(id) on delete set null,
  target_type         text         not null,
  target_id           uuid         not null,
  league_id           uuid         references public.cricket_leagues(id) on delete cascade,
  reason              text         not null,
  details             text,
  status              text         not null default 'open',
  assigned_to         uuid         references auth.users(id) on delete set null,
  resolved_by         uuid         references auth.users(id) on delete set null,
  resolved_at         timestamptz,
  resolution_notes    text,
  created_at          timestamptz  not null default now(),
  updated_at          timestamptz  not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_reports_target_type_check'
      and conrelid = 'public.cricket_reports'::regclass
  ) then
    alter table public.cricket_reports
      add constraint cricket_reports_target_type_check
      check (target_type in (
        'post','comment','thread_message','poll','player_profile','team_profile'
      ));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_reports_status_check'
      and conrelid = 'public.cricket_reports'::regclass
  ) then
    alter table public.cricket_reports
      add constraint cricket_reports_status_check
      check (status in ('open','reviewing','resolved','dismissed'));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 12. cricket_moderation_actions
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_moderation_actions (
  id                  uuid         primary key default gen_random_uuid(),
  league_id           uuid         references public.cricket_leagues(id) on delete cascade,
  moderator_user_id   uuid         references auth.users(id) on delete set null,
  target_type         text         not null,
  target_id           uuid         not null,
  action              text         not null,
  reason              text,
  notes               text,
  created_at          timestamptz  not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_moderation_actions_action_check'
      and conrelid = 'public.cricket_moderation_actions'::regclass
  ) then
    alter table public.cricket_moderation_actions
      add constraint cricket_moderation_actions_action_check
      check (action in (
        'approve','reject','hide','unhide','remove','restore',
        'pin','unpin','lock_thread','unlock_thread',
        'resolve_report','dismiss_report'
      ));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 13. cricket_notifications
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_notifications (
  id                  uuid         primary key default gen_random_uuid(),
  recipient_user_id   uuid         not null references auth.users(id) on delete cascade,
  actor_user_id       uuid         references auth.users(id) on delete set null,
  league_id           uuid         references public.cricket_leagues(id) on delete cascade,
  team_id             uuid         references public.cricket_teams(id) on delete set null,
  match_id            uuid         references public.cricket_matches(id) on delete set null,
  notification_type   text         not null,
  title               text         not null,
  body                text,
  action_url          text,
  read_at             timestamptz,
  metadata            jsonb        not null default '{}'::jsonb,
  created_at          timestamptz  not null default now()
);


-- ---------------------------------------------------------------------------
-- 14. cricket_follows
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_follows (
  id          uuid         primary key default gen_random_uuid(),
  user_id     uuid         not null references auth.users(id) on delete cascade,
  target_type text         not null,
  target_id   uuid         not null,
  created_at  timestamptz  not null default now(),
  constraint cricket_follows_unique
    unique (user_id, target_type, target_id)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_follows_target_type_check'
      and conrelid = 'public.cricket_follows'::regclass
  ) then
    alter table public.cricket_follows
      add constraint cricket_follows_target_type_check
      check (target_type in ('league','team','player','match'));
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 15. Indexes
-- ---------------------------------------------------------------------------

create index if not exists cricket_community_spaces_league_idx
  on public.cricket_community_spaces (league_id);
create index if not exists cricket_community_spaces_team_idx
  on public.cricket_community_spaces (team_id);
create index if not exists cricket_community_spaces_match_idx
  on public.cricket_community_spaces (match_id);
create index if not exists cricket_community_spaces_slug_idx
  on public.cricket_community_spaces (slug);

create index if not exists cricket_posts_space_idx
  on public.cricket_posts (space_id);
create index if not exists cricket_posts_league_idx
  on public.cricket_posts (league_id);
create index if not exists cricket_posts_team_idx
  on public.cricket_posts (team_id);
create index if not exists cricket_posts_match_idx
  on public.cricket_posts (match_id);
create index if not exists cricket_posts_author_idx
  on public.cricket_posts (author_user_id);
create index if not exists cricket_posts_type_idx
  on public.cricket_posts (post_type);
create index if not exists cricket_posts_status_idx
  on public.cricket_posts (status);
create index if not exists cricket_posts_published_at_idx
  on public.cricket_posts (published_at desc);

create index if not exists cricket_comments_post_idx
  on public.cricket_comments (post_id);
create index if not exists cricket_comments_author_idx
  on public.cricket_comments (author_user_id);

create index if not exists cricket_reactions_target_idx
  on public.cricket_reactions (target_type, target_id);
create index if not exists cricket_reactions_user_idx
  on public.cricket_reactions (user_id);

create index if not exists cricket_polls_league_idx
  on public.cricket_polls (league_id);
create index if not exists cricket_polls_match_idx
  on public.cricket_polls (match_id);

create index if not exists cricket_poll_options_poll_idx
  on public.cricket_poll_options (poll_id);

create index if not exists cricket_poll_votes_poll_idx
  on public.cricket_poll_votes (poll_id);
create index if not exists cricket_poll_votes_user_idx
  on public.cricket_poll_votes (user_id);

create index if not exists cricket_match_threads_match_idx
  on public.cricket_match_threads (match_id);

create index if not exists cricket_thread_messages_thread_idx
  on public.cricket_match_thread_messages (thread_id);
create index if not exists cricket_thread_messages_created_at_idx
  on public.cricket_match_thread_messages (created_at desc);

create index if not exists cricket_reports_league_idx
  on public.cricket_reports (league_id);
create index if not exists cricket_reports_status_idx
  on public.cricket_reports (status);

create index if not exists cricket_moderation_actions_league_idx
  on public.cricket_moderation_actions (league_id);

create index if not exists cricket_notifications_recipient_idx
  on public.cricket_notifications (recipient_user_id);
create index if not exists cricket_notifications_read_idx
  on public.cricket_notifications (recipient_user_id, read_at);

create index if not exists cricket_follows_user_idx
  on public.cricket_follows (user_id);
create index if not exists cricket_follows_target_idx
  on public.cricket_follows (target_type, target_id);


-- ---------------------------------------------------------------------------
-- 16. updated_at triggers
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_community_spaces'
      and tgrelid = 'public.cricket_community_spaces'::regclass
  ) then
    create trigger set_updated_at_cricket_community_spaces
      before update on public.cricket_community_spaces
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_posts'
      and tgrelid = 'public.cricket_posts'::regclass
  ) then
    create trigger set_updated_at_cricket_posts
      before update on public.cricket_posts
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_comments'
      and tgrelid = 'public.cricket_comments'::regclass
  ) then
    create trigger set_updated_at_cricket_comments
      before update on public.cricket_comments
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_polls'
      and tgrelid = 'public.cricket_polls'::regclass
  ) then
    create trigger set_updated_at_cricket_polls
      before update on public.cricket_polls
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_poll_votes'
      and tgrelid = 'public.cricket_poll_votes'::regclass
  ) then
    create trigger set_updated_at_cricket_poll_votes
      before update on public.cricket_poll_votes
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_match_threads'
      and tgrelid = 'public.cricket_match_threads'::regclass
  ) then
    create trigger set_updated_at_cricket_match_threads
      before update on public.cricket_match_threads
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_match_thread_messages'
      and tgrelid = 'public.cricket_match_thread_messages'::regclass
  ) then
    create trigger set_updated_at_cricket_match_thread_messages
      before update on public.cricket_match_thread_messages
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_reports'
      and tgrelid = 'public.cricket_reports'::regclass
  ) then
    create trigger set_updated_at_cricket_reports
      before update on public.cricket_reports
      for each row execute function public.set_updated_at();
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 17. RLS helper functions
-- ---------------------------------------------------------------------------

-- Returns true if the user is an admin/manager/moderator of the league.
create or replace function public.user_can_moderate_cricket_league(
  p_league_id  uuid,
  p_user_id    uuid
) returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1
    from public.cricket_league_members
    where league_id = p_league_id
      and user_id   = p_user_id
      and role in ('owner','admin','manager','moderator')
      and status = 'active'
  );
end;
$$;

-- Returns true if user is a member of the league (any active role).
create or replace function public.user_is_cricket_league_member(
  p_league_id  uuid,
  p_user_id    uuid
) returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1
    from public.cricket_league_members
    where league_id = p_league_id
      and user_id   = p_user_id
      and status    = 'active'
  );
end;
$$;

-- Returns true if user is a member/manager of the team.
create or replace function public.user_is_cricket_team_member(
  p_team_id  uuid,
  p_user_id  uuid
) returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1
    from public.cricket_team_members
    where team_id = p_team_id
      and user_id = p_user_id
      and status  = 'active'
  );
end;
$$;

-- Returns true if user can view the given community space.
create or replace function public.user_can_view_cricket_space(
  p_space_id   uuid,
  p_user_id    uuid
) returns boolean
language plpgsql
security definer
stable
as $$
declare
  v_visibility   text;
  v_league_id    uuid;
  v_team_id      uuid;
begin
  select visibility, league_id, team_id
    into v_visibility, v_league_id, v_team_id
  from public.cricket_community_spaces
  where id = p_space_id and is_active = true;

  if not found then
    return false;
  end if;

  case v_visibility
    when 'public' then
      return true;
    when 'unlisted' then
      return p_user_id is not null;
    when 'league' then
      return p_user_id is not null
        and (
          v_league_id is null
          or public.user_is_cricket_league_member(v_league_id, p_user_id)
          or public.user_can_moderate_cricket_league(v_league_id, p_user_id)
        );
    when 'team' then
      return p_user_id is not null
        and (
          (v_team_id is not null and public.user_is_cricket_team_member(v_team_id, p_user_id))
          or (v_league_id is not null and public.user_can_moderate_cricket_league(v_league_id, p_user_id))
        );
    when 'private' then
      return p_user_id is not null
        and v_league_id is not null
        and public.user_can_moderate_cricket_league(v_league_id, p_user_id);
    else
      return false;
  end case;
end;
$$;

-- Returns true if user can post in the given community space.
create or replace function public.user_can_post_in_cricket_space(
  p_space_id   uuid,
  p_user_id    uuid
) returns boolean
language plpgsql
security definer
stable
as $$
declare
  v_posting_policy  text;
  v_league_id       uuid;
  v_team_id         uuid;
begin
  if p_user_id is null then return false; end if;

  select posting_policy, league_id, team_id
    into v_posting_policy, v_league_id, v_team_id
  from public.cricket_community_spaces
  where id = p_space_id and is_active = true;

  if not found then
    return false;
  end if;

  case v_posting_policy
    when 'public_disabled' then
      return false;
    when 'admins_only', 'managers_only' then
      return v_league_id is not null
        and public.user_can_moderate_cricket_league(v_league_id, p_user_id);
    when 'members' then
      return (v_league_id is not null and public.user_is_cricket_league_member(v_league_id, p_user_id))
          or (v_league_id is not null and public.user_can_moderate_cricket_league(v_league_id, p_user_id));
    when 'verified_players' then
      -- For now, treat verified_players same as members; extend with player verification later.
      return (v_league_id is not null and public.user_is_cricket_league_member(v_league_id, p_user_id))
          or (v_league_id is not null and public.user_can_moderate_cricket_league(v_league_id, p_user_id));
    else
      return false;
  end case;
end;
$$;

-- Returns true if user can comment in the given community space.
create or replace function public.user_can_comment_in_cricket_space(
  p_space_id   uuid,
  p_user_id    uuid
) returns boolean
language plpgsql
security definer
stable
as $$
declare
  v_commenting_policy  text;
  v_league_id          uuid;
begin
  if p_user_id is null then return false; end if;

  select commenting_policy, league_id
    into v_commenting_policy, v_league_id
  from public.cricket_community_spaces
  where id = p_space_id and is_active = true;

  if not found then
    return false;
  end if;

  case v_commenting_policy
    when 'disabled' then
      return false;
    when 'admins_only' then
      return v_league_id is not null
        and public.user_can_moderate_cricket_league(v_league_id, p_user_id);
    when 'members' then
      return (v_league_id is not null and public.user_is_cricket_league_member(v_league_id, p_user_id))
          or (v_league_id is not null and public.user_can_moderate_cricket_league(v_league_id, p_user_id));
    when 'public_authenticated' then
      return true;
    else
      return false;
  end case;
end;
$$;

-- Returns true if user can view the match thread.
create or replace function public.user_can_view_cricket_match_thread(
  p_thread_id  uuid,
  p_user_id    uuid
) returns boolean
language plpgsql
security definer
stable
as $$
declare
  v_visibility  text;
  v_league_id   uuid;
begin
  select visibility, league_id
    into v_visibility, v_league_id
  from public.cricket_match_threads
  where id = p_thread_id;

  if not found then
    return false;
  end if;

  case v_visibility
    when 'public' then
      return true;
    when 'unlisted' then
      return p_user_id is not null;
    when 'league' then
      return p_user_id is not null
        and (
          v_league_id is null
          or public.user_is_cricket_league_member(v_league_id, p_user_id)
          or public.user_can_moderate_cricket_league(v_league_id, p_user_id)
        );
    when 'private' then
      return p_user_id is not null
        and v_league_id is not null
        and public.user_can_moderate_cricket_league(v_league_id, p_user_id);
    else
      return false;
  end case;
end;
$$;

-- Returns true if user can vote in a poll.
create or replace function public.user_can_vote_in_cricket_poll(
  p_poll_id   uuid,
  p_user_id   uuid
) returns boolean
language plpgsql
security definer
stable
as $$
declare
  v_visibility  text;
  v_status      text;
  v_league_id   uuid;
begin
  if p_user_id is null then return false; end if;

  select visibility, status, league_id
    into v_visibility, v_status, v_league_id
  from public.cricket_polls
  where id = p_poll_id;

  if not found then
    return false;
  end if;

  if v_status != 'open' then
    return false;
  end if;

  case v_visibility
    when 'public', 'unlisted' then
      return true;
    when 'league' then
      return v_league_id is null
          or public.user_is_cricket_league_member(v_league_id, p_user_id)
          or public.user_can_moderate_cricket_league(v_league_id, p_user_id);
    when 'private' then
      return v_league_id is not null
        and public.user_can_moderate_cricket_league(v_league_id, p_user_id);
    else
      return false;
  end case;
end;
$$;


-- ---------------------------------------------------------------------------
-- 18. Enable RLS on all new tables
-- ---------------------------------------------------------------------------

alter table public.cricket_community_spaces   enable row level security;
alter table public.cricket_posts              enable row level security;
alter table public.cricket_comments           enable row level security;
alter table public.cricket_reactions          enable row level security;
alter table public.cricket_polls              enable row level security;
alter table public.cricket_poll_options       enable row level security;
alter table public.cricket_poll_votes         enable row level security;
alter table public.cricket_match_threads      enable row level security;
alter table public.cricket_match_thread_messages enable row level security;
alter table public.cricket_reports            enable row level security;
alter table public.cricket_moderation_actions enable row level security;
alter table public.cricket_notifications      enable row level security;
alter table public.cricket_follows            enable row level security;


-- ---------------------------------------------------------------------------
-- 19. RLS Policies
-- ---------------------------------------------------------------------------

-- ── cricket_community_spaces ─────────────────────────────────────────────────

drop policy if exists "spaces_select" on public.cricket_community_spaces;
create policy "spaces_select"
  on public.cricket_community_spaces for select
  using (
    public.user_can_view_cricket_space(id, auth.uid())
  );

drop policy if exists "spaces_insert" on public.cricket_community_spaces;
create policy "spaces_insert"
  on public.cricket_community_spaces for insert
  with check (
    auth.uid() is not null
    and (
      league_id is null
      or public.user_can_moderate_cricket_league(league_id, auth.uid())
    )
  );

drop policy if exists "spaces_update" on public.cricket_community_spaces;
create policy "spaces_update"
  on public.cricket_community_spaces for update
  using (
    auth.uid() is not null
    and (
      league_id is null
      or public.user_can_moderate_cricket_league(league_id, auth.uid())
    )
  );


-- ── cricket_posts ─────────────────────────────────────────────────────────────

drop policy if exists "posts_select" on public.cricket_posts;
create policy "posts_select"
  on public.cricket_posts for select
  using (
    status in ('published')
    and moderation_status in ('approved','flagged')
    and (
      -- public posts
      visibility = 'public'
      -- authenticated league/space members
      or (
        auth.uid() is not null
        and (
          space_id is null
          or public.user_can_view_cricket_space(space_id, auth.uid())
        )
        and (
          league_id is null
          or public.user_is_cricket_league_member(league_id, auth.uid())
          or public.user_can_moderate_cricket_league(league_id, auth.uid())
        )
      )
    )
    -- author can always see own posts
    or author_user_id = auth.uid()
  );

drop policy if exists "posts_insert" on public.cricket_posts;
create policy "posts_insert"
  on public.cricket_posts for insert
  with check (
    auth.uid() is not null
    and author_user_id = auth.uid()
    and (
      space_id is null
      or public.user_can_post_in_cricket_space(space_id, auth.uid())
    )
  );

drop policy if exists "posts_update_author" on public.cricket_posts;
create policy "posts_update_author"
  on public.cricket_posts for update
  using (
    author_user_id = auth.uid()
    and deleted_at is null
  );

drop policy if exists "posts_update_moderator" on public.cricket_posts;
create policy "posts_update_moderator"
  on public.cricket_posts for update
  using (
    auth.uid() is not null
    and league_id is not null
    and public.user_can_moderate_cricket_league(league_id, auth.uid())
  );


-- ── cricket_comments ──────────────────────────────────────────────────────────

drop policy if exists "comments_select" on public.cricket_comments;
create policy "comments_select"
  on public.cricket_comments for select
  using (
    status = 'published'
    and moderation_status in ('approved','flagged')
    and (
      author_user_id = auth.uid()
      or exists (
        select 1 from public.cricket_posts p
        where p.id = post_id
          and p.status = 'published'
          and (
            p.visibility = 'public'
            or (
              auth.uid() is not null
              and (
                p.league_id is null
                or public.user_is_cricket_league_member(p.league_id, auth.uid())
                or public.user_can_moderate_cricket_league(p.league_id, auth.uid())
              )
            )
          )
      )
    )
  );

drop policy if exists "comments_insert" on public.cricket_comments;
create policy "comments_insert"
  on public.cricket_comments for insert
  with check (
    auth.uid() is not null
    and author_user_id = auth.uid()
    and exists (
      select 1 from public.cricket_posts p
      where p.id = post_id
        and p.allow_comments = true
        and p.status = 'published'
        and (
          p.space_id is null
          or public.user_can_comment_in_cricket_space(p.space_id, auth.uid())
        )
    )
  );

drop policy if exists "comments_update_author" on public.cricket_comments;
create policy "comments_update_author"
  on public.cricket_comments for update
  using (author_user_id = auth.uid() and deleted_at is null);


-- ── cricket_reactions ─────────────────────────────────────────────────────────

drop policy if exists "reactions_select" on public.cricket_reactions;
create policy "reactions_select"
  on public.cricket_reactions for select
  using (true);

drop policy if exists "reactions_insert" on public.cricket_reactions;
create policy "reactions_insert"
  on public.cricket_reactions for insert
  with check (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "reactions_delete" on public.cricket_reactions;
create policy "reactions_delete"
  on public.cricket_reactions for delete
  using (user_id = auth.uid());


-- ── cricket_polls ─────────────────────────────────────────────────────────────

drop policy if exists "polls_select" on public.cricket_polls;
create policy "polls_select"
  on public.cricket_polls for select
  using (
    status != 'archived'
    and (
      visibility = 'public'
      or (
        auth.uid() is not null
        and (
          league_id is null
          or public.user_is_cricket_league_member(league_id, auth.uid())
          or public.user_can_moderate_cricket_league(league_id, auth.uid())
        )
      )
    )
  );

drop policy if exists "polls_insert" on public.cricket_polls;
create policy "polls_insert"
  on public.cricket_polls for insert
  with check (
    auth.uid() is not null
    and created_by = auth.uid()
    and (
      league_id is null
      or public.user_can_moderate_cricket_league(league_id, auth.uid())
    )
  );

drop policy if exists "polls_update" on public.cricket_polls;
create policy "polls_update"
  on public.cricket_polls for update
  using (
    auth.uid() is not null
    and (
      created_by = auth.uid()
      or (
        league_id is not null
        and public.user_can_moderate_cricket_league(league_id, auth.uid())
      )
    )
  );


-- ── cricket_poll_options ──────────────────────────────────────────────────────

drop policy if exists "poll_options_select" on public.cricket_poll_options;
create policy "poll_options_select"
  on public.cricket_poll_options for select
  using (
    exists (
      select 1 from public.cricket_polls p
      where p.id = poll_id
        and (
          p.visibility = 'public'
          or (
            auth.uid() is not null
            and (
              p.league_id is null
              or public.user_is_cricket_league_member(p.league_id, auth.uid())
              or public.user_can_moderate_cricket_league(p.league_id, auth.uid())
            )
          )
        )
    )
  );

drop policy if exists "poll_options_insert" on public.cricket_poll_options;
create policy "poll_options_insert"
  on public.cricket_poll_options for insert
  with check (
    exists (
      select 1 from public.cricket_polls p
      where p.id = poll_id
        and p.created_by = auth.uid()
    )
  );


-- ── cricket_poll_votes ────────────────────────────────────────────────────────

drop policy if exists "poll_votes_select_own" on public.cricket_poll_votes;
create policy "poll_votes_select_own"
  on public.cricket_poll_votes for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.cricket_polls p
      where p.id = poll_id
        and p.league_id is not null
        and public.user_can_moderate_cricket_league(p.league_id, auth.uid())
    )
  );

drop policy if exists "poll_votes_insert" on public.cricket_poll_votes;
create policy "poll_votes_insert"
  on public.cricket_poll_votes for insert
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and public.user_can_vote_in_cricket_poll(poll_id, auth.uid())
  );

drop policy if exists "poll_votes_delete_own" on public.cricket_poll_votes;
create policy "poll_votes_delete_own"
  on public.cricket_poll_votes for delete
  using (user_id = auth.uid());


-- ── cricket_match_threads ─────────────────────────────────────────────────────

drop policy if exists "threads_select" on public.cricket_match_threads;
create policy "threads_select"
  on public.cricket_match_threads for select
  using (
    public.user_can_view_cricket_match_thread(id, auth.uid())
  );

drop policy if exists "threads_insert" on public.cricket_match_threads;
create policy "threads_insert"
  on public.cricket_match_threads for insert
  with check (
    auth.uid() is not null
    and (
      league_id is null
      or public.user_can_moderate_cricket_league(league_id, auth.uid())
    )
  );

drop policy if exists "threads_update" on public.cricket_match_threads;
create policy "threads_update"
  on public.cricket_match_threads for update
  using (
    auth.uid() is not null
    and (
      created_by = auth.uid()
      or (
        league_id is not null
        and public.user_can_moderate_cricket_league(league_id, auth.uid())
      )
    )
  );


-- ── cricket_match_thread_messages ─────────────────────────────────────────────

drop policy if exists "thread_messages_select" on public.cricket_match_thread_messages;
create policy "thread_messages_select"
  on public.cricket_match_thread_messages for select
  using (
    status = 'published'
    and moderation_status in ('approved','flagged')
    and (
      author_user_id = auth.uid()
      or public.user_can_view_cricket_match_thread(thread_id, auth.uid())
    )
  );

drop policy if exists "thread_messages_insert" on public.cricket_match_thread_messages;
create policy "thread_messages_insert"
  on public.cricket_match_thread_messages for insert
  with check (
    auth.uid() is not null
    and author_user_id = auth.uid()
    and exists (
      select 1 from public.cricket_match_threads t
      where t.id = thread_id
        and t.status = 'open'
        and public.user_can_view_cricket_match_thread(t.id, auth.uid())
    )
  );

drop policy if exists "thread_messages_update_author" on public.cricket_match_thread_messages;
create policy "thread_messages_update_author"
  on public.cricket_match_thread_messages for update
  using (author_user_id = auth.uid() and deleted_at is null);

drop policy if exists "thread_messages_update_moderator" on public.cricket_match_thread_messages;
create policy "thread_messages_update_moderator"
  on public.cricket_match_thread_messages for update
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.cricket_match_threads t
      join public.cricket_leagues l on l.id = t.league_id
      where t.id = thread_id
        and public.user_can_moderate_cricket_league(t.league_id, auth.uid())
    )
  );


-- ── cricket_reports ───────────────────────────────────────────────────────────

drop policy if exists "reports_select_reporter" on public.cricket_reports;
create policy "reports_select_reporter"
  on public.cricket_reports for select
  using (
    reporter_user_id = auth.uid()
    or (
      league_id is not null
      and public.user_can_moderate_cricket_league(league_id, auth.uid())
    )
  );

drop policy if exists "reports_insert" on public.cricket_reports;
create policy "reports_insert"
  on public.cricket_reports for insert
  with check (
    auth.uid() is not null
    and reporter_user_id = auth.uid()
  );

drop policy if exists "reports_update_moderator" on public.cricket_reports;
create policy "reports_update_moderator"
  on public.cricket_reports for update
  using (
    auth.uid() is not null
    and league_id is not null
    and public.user_can_moderate_cricket_league(league_id, auth.uid())
  );


-- ── cricket_moderation_actions ────────────────────────────────────────────────

drop policy if exists "moderation_actions_select" on public.cricket_moderation_actions;
create policy "moderation_actions_select"
  on public.cricket_moderation_actions for select
  using (
    auth.uid() is not null
    and (
      league_id is null
      or public.user_can_moderate_cricket_league(league_id, auth.uid())
    )
  );

drop policy if exists "moderation_actions_insert" on public.cricket_moderation_actions;
create policy "moderation_actions_insert"
  on public.cricket_moderation_actions for insert
  with check (
    auth.uid() is not null
    and moderator_user_id = auth.uid()
    and (
      league_id is null
      or public.user_can_moderate_cricket_league(league_id, auth.uid())
    )
  );


-- ── cricket_notifications ─────────────────────────────────────────────────────

drop policy if exists "notifications_select" on public.cricket_notifications;
create policy "notifications_select"
  on public.cricket_notifications for select
  using (recipient_user_id = auth.uid());

drop policy if exists "notifications_update_read" on public.cricket_notifications;
create policy "notifications_update_read"
  on public.cricket_notifications for update
  using (recipient_user_id = auth.uid());

drop policy if exists "notifications_delete_own" on public.cricket_notifications;
create policy "notifications_delete_own"
  on public.cricket_notifications for delete
  using (recipient_user_id = auth.uid());

-- Service-role insert (used from server actions only)
drop policy if exists "notifications_insert_service" on public.cricket_notifications;
create policy "notifications_insert_service"
  on public.cricket_notifications for insert
  with check (
    -- Allow inserts from authenticated server-side context
    -- (service role bypasses RLS; this covers the anon-key server path)
    auth.uid() is not null
    or auth.role() = 'service_role'
  );


-- ── cricket_follows ───────────────────────────────────────────────────────────

drop policy if exists "follows_select" on public.cricket_follows;
create policy "follows_select"
  on public.cricket_follows for select
  using (user_id = auth.uid());

drop policy if exists "follows_insert" on public.cricket_follows;
create policy "follows_insert"
  on public.cricket_follows for insert
  with check (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "follows_delete" on public.cricket_follows;
create policy "follows_delete"
  on public.cricket_follows for delete
  using (user_id = auth.uid());
