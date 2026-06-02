-- Migration 0011: Support requests table for pilot operations.
-- Stores coach and user support submissions for founder review.

-- ============================================================
-- support_requests
-- ============================================================
create table if not exists public.support_requests (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        null references public.profiles(id) on delete set null,
  name             text        not null,
  email            text        not null,
  issue_type       text        not null,
  team_name        text,
  related_url      text,
  urgency          text,
  message          text        not null,
  consent_to_contact boolean  not null default true,
  status           text        not null default 'open',
  admin_notes      text,
  metadata         jsonb       not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.support_requests enable row level security;

-- Anyone (authenticated or anonymous) can INSERT a support request.
-- This allows logged-out users to submit login/account issues.
create policy "support_requests_public_insert"
  on public.support_requests for insert
  with check (true);

-- Authenticated users can read their own requests.
create policy "support_requests_own_read"
  on public.support_requests for select
  to authenticated
  using (user_id = auth.uid());

-- No public SELECT for admin view — admin reads bypass RLS via service role client.
-- No UPDATE policy — founders update via service role only.

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists support_requests_user_id_idx
  on public.support_requests(user_id);

create index if not exists support_requests_status_idx
  on public.support_requests(status);

create index if not exists support_requests_issue_type_idx
  on public.support_requests(issue_type);

create index if not exists support_requests_created_at_idx
  on public.support_requests(created_at desc);

-- ============================================================
-- updated_at trigger (reuse if trigger function already exists)
-- ============================================================
-- Only create the trigger function if it doesn't already exist.
do $$
begin
  if not exists (
    select 1 from pg_proc where proname = 'set_updated_at'
  ) then
    execute $func$
      create or replace function set_updated_at()
      returns trigger language plpgsql as $body$
      begin
        new.updated_at = now();
        return new;
      end;
      $body$;
    $func$;
  end if;
end;
$$;

create trigger support_requests_updated_at
  before update on public.support_requests
  for each row execute function set_updated_at();
