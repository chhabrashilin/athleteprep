-- Migration 0009: Add access_requests and product_feedback tables
-- for early-user feedback collection and demo interest capture.

-- ============================================================
-- access_requests
-- ============================================================
create table if not exists public.access_requests (
  id                    uuid        primary key default gen_random_uuid(),
  name                  text        not null,
  email                 text        not null,
  role                  text        not null,
  team_or_org           text,
  sport                 text,
  level                 text,
  pain_point            text,
  film_review_frequency text,
  current_tools         text,
  message               text,
  metadata              jsonb       not null default '{}'::jsonb,
  created_at            timestamptz not null default now()
);

-- ============================================================
-- product_feedback
-- ============================================================
create table if not exists public.product_feedback (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        null references public.profiles(id) on delete set null,
  name                text,
  email               text,
  role                text,
  team_or_org         text,
  sport               text,
  usefulness_rating   integer,
  most_valuable       text,
  most_confusing      text,
  must_have_feature   text,
  would_use_after_games text,
  current_tools       text,
  willingness_to_pay  text,
  additional_notes    text,
  metadata            jsonb       not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================
alter table public.access_requests  enable row level security;
alter table public.product_feedback enable row level security;

-- Anyone may insert (public forms).
create policy "access_requests_public_insert"
  on public.access_requests for insert
  with check (true);

create policy "product_feedback_public_insert"
  on public.product_feedback for insert
  with check (true);

-- No public SELECT — admin reads via service role client only.
-- (No SELECT policy defined means no authenticated user can read via anon/user key.)

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists access_requests_created_at_idx
  on public.access_requests(created_at desc);

create index if not exists product_feedback_created_at_idx
  on public.product_feedback(created_at desc);

create index if not exists product_feedback_usefulness_idx
  on public.product_feedback(usefulness_rating)
  where usefulness_rating is not null;
