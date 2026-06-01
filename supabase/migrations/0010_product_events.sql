-- Migration 0010: Product event tracking table for founder analytics.
-- Lightweight, first-party, privacy-conscious event log.

create table if not exists public.product_events (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        references public.profiles(id) on delete set null,
  team_id         uuid        references public.teams(id) on delete set null,
  game_id         uuid        references public.games(id) on delete set null,
  report_id       uuid        references public.game_reports(id) on delete set null,
  event_name      text        not null,
  event_category  text        not null,
  source          text,
  page_path       text,
  metadata        jsonb       not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================
alter table public.product_events enable row level security;

-- Authenticated users can insert their own events.
create policy "product_events_auth_insert"
  on public.product_events for insert
  to authenticated
  with check (user_id = auth.uid() or user_id is null);

-- Allow anonymous inserts for public-facing events (landing, request-access).
-- Restricted to rows where user_id IS NULL to prevent impersonation.
create policy "product_events_anon_insert"
  on public.product_events for insert
  to anon
  with check (user_id is null);

-- No public SELECT — admin reads via service role only.

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists product_events_user_id_idx
  on public.product_events(user_id);

create index if not exists product_events_team_id_idx
  on public.product_events(team_id);

create index if not exists product_events_game_id_idx
  on public.product_events(game_id);

create index if not exists product_events_report_id_idx
  on public.product_events(report_id);

create index if not exists product_events_event_name_idx
  on public.product_events(event_name);

create index if not exists product_events_event_category_idx
  on public.product_events(event_category);

create index if not exists product_events_created_at_idx
  on public.product_events(created_at desc);
