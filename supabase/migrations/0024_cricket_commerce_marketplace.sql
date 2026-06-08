-- ---------------------------------------------------------------------------
-- 0024_cricket_commerce_marketplace.sql
-- Cricket Commerce & Marketplace — Prompt 38
--
-- Adds: cricket_vendors, cricket_product_categories, cricket_products,
--       cricket_product_variants, cricket_product_reviews,
--       cricket_carts, cricket_cart_items,
--       cricket_orders, cricket_order_items,
--       cricket_team_kit_requests,
--       cricket_sponsorship_packages, cricket_sponsorship_inquiries,
--       cricket_commerce_events.
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
-- 2. cricket_vendors
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_vendors (
  id               uuid         primary key default gen_random_uuid(),
  league_id        uuid         references public.cricket_leagues(id) on delete set null,
  name             text         not null,
  slug             text         not null,
  description      text,
  logo_url         text,
  website_url      text,
  contact_name     text,
  contact_email    text,
  contact_phone    text,
  business_address text,
  city             text,
  region           text,
  country          text,
  status           text         not null default 'pending',
  visibility       text         not null default 'private',
  vendor_type      text         not null default 'equipment',
  approved_by      uuid         references auth.users(id) on delete set null,
  approved_at      timestamptz,
  created_by       uuid         references auth.users(id) on delete set null,
  created_at       timestamptz  not null default now(),
  updated_at       timestamptz  not null default now(),
  constraint cricket_vendors_league_slug_unique unique (league_id, slug)
);

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_vendors_status_check'
      and conrelid = 'public.cricket_vendors'::regclass
  ) then
    alter table public.cricket_vendors
      add constraint cricket_vendors_status_check
      check (status in ('pending','approved','rejected','suspended','archived'));
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_vendors_visibility_check'
      and conrelid = 'public.cricket_vendors'::regclass
  ) then
    alter table public.cricket_vendors
      add constraint cricket_vendors_visibility_check
      check (visibility in ('private','league','unlisted','public'));
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_vendors_vendor_type_check'
      and conrelid = 'public.cricket_vendors'::regclass
  ) then
    alter table public.cricket_vendors
      add constraint cricket_vendors_vendor_type_check
      check (vendor_type in (
        'equipment','apparel','team_kits','coaching_services',
        'ground_services','photography','streaming_services','sponsor','other'
      ));
  end if;
end; $$;


-- ---------------------------------------------------------------------------
-- 3. cricket_product_categories
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_product_categories (
  id                 uuid         primary key default gen_random_uuid(),
  parent_category_id uuid         references public.cricket_product_categories(id) on delete set null,
  name               text         not null,
  slug               text         not null unique,
  description        text,
  is_active          boolean      not null default true,
  sort_order         integer      not null default 0,
  created_at         timestamptz  not null default now(),
  updated_at         timestamptz  not null default now()
);


-- ---------------------------------------------------------------------------
-- 4. cricket_products
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_products (
  id                      uuid         primary key default gen_random_uuid(),
  vendor_id               uuid         references public.cricket_vendors(id) on delete set null,
  league_id               uuid         references public.cricket_leagues(id) on delete set null,
  category_id             uuid         references public.cricket_product_categories(id) on delete set null,
  name                    text         not null,
  slug                    text         not null,
  short_description       text,
  description             text,
  product_type            text         not null default 'physical',
  status                  text         not null default 'draft',
  visibility              text         not null default 'private',
  currency                text         not null default 'USD',
  price_cents             integer,
  compare_at_price_cents  integer,
  min_order_quantity      integer      not null default 1,
  max_order_quantity      integer,
  inventory_status        text         not null default 'unknown',
  inventory_quantity      integer,
  sku                     text,
  image_urls              text[]       not null default '{}',
  tags                    text[]       not null default '{}',
  specifications          jsonb        not null default '{}'::jsonb,
  sizing_info             jsonb        not null default '{}'::jsonb,
  shipping_info           jsonb        not null default '{}'::jsonb,
  approval_status         text         not null default 'pending',
  approved_by             uuid         references auth.users(id) on delete set null,
  approved_at             timestamptz,
  created_by              uuid         references auth.users(id) on delete set null,
  created_at              timestamptz  not null default now(),
  updated_at              timestamptz  not null default now(),
  constraint cricket_products_vendor_slug_unique unique (vendor_id, slug)
);

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_products_price_check'
      and conrelid = 'public.cricket_products'::regclass
  ) then
    alter table public.cricket_products
      add constraint cricket_products_price_check
      check (price_cents is null or price_cents >= 0);
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_products_compare_price_check'
      and conrelid = 'public.cricket_products'::regclass
  ) then
    alter table public.cricket_products
      add constraint cricket_products_compare_price_check
      check (compare_at_price_cents is null or compare_at_price_cents >= 0);
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_products_min_qty_check'
      and conrelid = 'public.cricket_products'::regclass
  ) then
    alter table public.cricket_products
      add constraint cricket_products_min_qty_check
      check (min_order_quantity > 0);
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_products_max_qty_check'
      and conrelid = 'public.cricket_products'::regclass
  ) then
    alter table public.cricket_products
      add constraint cricket_products_max_qty_check
      check (max_order_quantity is null or max_order_quantity >= min_order_quantity);
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_products_product_type_check'
      and conrelid = 'public.cricket_products'::regclass
  ) then
    alter table public.cricket_products
      add constraint cricket_products_product_type_check
      check (product_type in ('physical','service','team_kit','sponsorship','digital','quote_only'));
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_products_status_check'
      and conrelid = 'public.cricket_products'::regclass
  ) then
    alter table public.cricket_products
      add constraint cricket_products_status_check
      check (status in ('draft','active','inactive','archived'));
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_products_visibility_check'
      and conrelid = 'public.cricket_products'::regclass
  ) then
    alter table public.cricket_products
      add constraint cricket_products_visibility_check
      check (visibility in ('private','league','unlisted','public'));
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_products_inventory_status_check'
      and conrelid = 'public.cricket_products'::regclass
  ) then
    alter table public.cricket_products
      add constraint cricket_products_inventory_status_check
      check (inventory_status in (
        'unknown','in_stock','low_stock','out_of_stock',
        'made_to_order','quote_only','discontinued'
      ));
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_products_approval_status_check'
      and conrelid = 'public.cricket_products'::regclass
  ) then
    alter table public.cricket_products
      add constraint cricket_products_approval_status_check
      check (approval_status in ('pending','approved','rejected','needs_changes'));
  end if;
end; $$;


-- ---------------------------------------------------------------------------
-- 5. cricket_product_variants
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_product_variants (
  id                 uuid         primary key default gen_random_uuid(),
  product_id         uuid         not null references public.cricket_products(id) on delete cascade,
  name               text         not null,
  sku                text,
  option_values      jsonb        not null default '{}'::jsonb,
  price_cents        integer,
  inventory_quantity integer,
  inventory_status   text         not null default 'unknown',
  image_url          text,
  is_active          boolean      not null default true,
  created_at         timestamptz  not null default now(),
  updated_at         timestamptz  not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_product_variants_price_check'
      and conrelid = 'public.cricket_product_variants'::regclass
  ) then
    alter table public.cricket_product_variants
      add constraint cricket_product_variants_price_check
      check (price_cents is null or price_cents >= 0);
  end if;
end; $$;


-- ---------------------------------------------------------------------------
-- 6. cricket_product_reviews
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_product_reviews (
  id          uuid         primary key default gen_random_uuid(),
  product_id  uuid         not null references public.cricket_products(id) on delete cascade,
  user_id     uuid         references auth.users(id) on delete set null,
  rating      integer      not null,
  title       text,
  body        text,
  status      text         not null default 'pending',
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now(),
  constraint cricket_product_reviews_rating_check check (rating between 1 and 5),
  constraint cricket_product_reviews_unique_user unique (product_id, user_id)
);

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_product_reviews_status_check'
      and conrelid = 'public.cricket_product_reviews'::regclass
  ) then
    alter table public.cricket_product_reviews
      add constraint cricket_product_reviews_status_check
      check (status in ('pending','approved','rejected','hidden'));
  end if;
end; $$;


-- ---------------------------------------------------------------------------
-- 7. cricket_carts
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_carts (
  id         uuid         primary key default gen_random_uuid(),
  user_id    uuid         references auth.users(id) on delete cascade,
  session_id text,
  league_id  uuid         references public.cricket_leagues(id) on delete set null,
  currency   text         not null default 'USD',
  status     text         not null default 'active',
  created_at timestamptz  not null default now(),
  updated_at timestamptz  not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_carts_status_check'
      and conrelid = 'public.cricket_carts'::regclass
  ) then
    alter table public.cricket_carts
      add constraint cricket_carts_status_check
      check (status in ('active','converted','abandoned','archived'));
  end if;
end; $$;


-- ---------------------------------------------------------------------------
-- 8. cricket_cart_items
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_cart_items (
  id              uuid         primary key default gen_random_uuid(),
  cart_id         uuid         not null references public.cricket_carts(id) on delete cascade,
  product_id      uuid         not null references public.cricket_products(id) on delete cascade,
  variant_id      uuid         references public.cricket_product_variants(id) on delete set null,
  quantity        integer      not null default 1,
  unit_price_cents integer,
  customization   jsonb        not null default '{}'::jsonb,
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now(),
  constraint cricket_cart_items_qty_check check (quantity > 0)
);


-- ---------------------------------------------------------------------------
-- 9. cricket_orders
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_orders (
  id                        uuid         primary key default gen_random_uuid(),
  order_number              text         not null unique,
  user_id                   uuid         references auth.users(id) on delete set null,
  league_id                 uuid         references public.cricket_leagues(id) on delete set null,
  team_id                   uuid         references public.cricket_teams(id) on delete set null,
  vendor_id                 uuid         references public.cricket_vendors(id) on delete set null,
  cart_id                   uuid         references public.cricket_carts(id) on delete set null,
  order_type                text         not null default 'request',
  status                    text         not null default 'submitted',
  payment_status            text         not null default 'not_required',
  fulfillment_status        text         not null default 'not_started',
  currency                  text         not null default 'USD',
  subtotal_cents            integer      not null default 0,
  tax_cents                 integer      not null default 0,
  shipping_cents            integer      not null default 0,
  discount_cents            integer      not null default 0,
  total_cents               integer      not null default 0,
  customer_name             text,
  customer_email            text,
  customer_phone            text,
  shipping_address          jsonb        not null default '{}'::jsonb,
  billing_address           jsonb        not null default '{}'::jsonb,
  notes                     text,
  internal_notes            text,
  provider                  text         not null default 'request_only',
  provider_checkout_id      text,
  provider_payment_intent_id text,
  submitted_at              timestamptz  not null default now(),
  confirmed_at              timestamptz,
  cancelled_at              timestamptz,
  created_at                timestamptz  not null default now(),
  updated_at                timestamptz  not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_orders_order_type_check'
      and conrelid = 'public.cricket_orders'::regclass
  ) then
    alter table public.cricket_orders
      add constraint cricket_orders_order_type_check
      check (order_type in ('request','quote','purchase','team_kit','sponsorship','service'));
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_orders_status_check'
      and conrelid = 'public.cricket_orders'::regclass
  ) then
    alter table public.cricket_orders
      add constraint cricket_orders_status_check
      check (status in (
        'draft','submitted','reviewing','quoted','awaiting_payment',
        'confirmed','in_progress','completed','cancelled','rejected','archived'
      ));
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_orders_payment_status_check'
      and conrelid = 'public.cricket_orders'::regclass
  ) then
    alter table public.cricket_orders
      add constraint cricket_orders_payment_status_check
      check (payment_status in (
        'not_required','pending','paid','failed','refunded',
        'partially_refunded','provider_not_configured'
      ));
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_orders_fulfillment_status_check'
      and conrelid = 'public.cricket_orders'::regclass
  ) then
    alter table public.cricket_orders
      add constraint cricket_orders_fulfillment_status_check
      check (fulfillment_status in (
        'not_started','processing','ready','shipped',
        'delivered','completed','cancelled'
      ));
  end if;
end; $$;


-- ---------------------------------------------------------------------------
-- 10. cricket_order_items
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_order_items (
  id               uuid         primary key default gen_random_uuid(),
  order_id         uuid         not null references public.cricket_orders(id) on delete cascade,
  product_id       uuid         references public.cricket_products(id) on delete set null,
  variant_id       uuid         references public.cricket_product_variants(id) on delete set null,
  product_name     text         not null,
  variant_name     text,
  quantity         integer      not null default 1,
  unit_price_cents integer,
  total_price_cents integer,
  customization    jsonb        not null default '{}'::jsonb,
  notes            text,
  created_at       timestamptz  not null default now(),
  constraint cricket_order_items_qty_check check (quantity > 0)
);


-- ---------------------------------------------------------------------------
-- 11. cricket_team_kit_requests
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_team_kit_requests (
  id                  uuid         primary key default gen_random_uuid(),
  league_id           uuid         references public.cricket_leagues(id) on delete set null,
  team_id             uuid         not null references public.cricket_teams(id) on delete cascade,
  vendor_id           uuid         references public.cricket_vendors(id) on delete set null,
  requested_by        uuid         references auth.users(id) on delete set null,
  status              text         not null default 'draft',
  kit_type            text         not null default 'full_team_kit',
  quantity_players    integer,
  quantity_staff      integer,
  primary_color       text,
  secondary_color     text,
  accent_color        text,
  logo_url            text,
  sponsor_logo_url    text,
  design_notes        text,
  size_breakdown      jsonb        not null default '{}'::jsonb,
  delivery_deadline   date,
  budget_cents        integer,
  currency            text         not null default 'USD',
  quote_amount_cents  integer,
  order_id            uuid         references public.cricket_orders(id) on delete set null,
  created_at          timestamptz  not null default now(),
  updated_at          timestamptz  not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_team_kit_requests_status_check'
      and conrelid = 'public.cricket_team_kit_requests'::regclass
  ) then
    alter table public.cricket_team_kit_requests
      add constraint cricket_team_kit_requests_status_check
      check (status in (
        'draft','submitted','reviewing','quoted','approved',
        'ordered','in_production','delivered','cancelled','rejected'
      ));
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_team_kit_requests_kit_type_check'
      and conrelid = 'public.cricket_team_kit_requests'::regclass
  ) then
    alter table public.cricket_team_kit_requests
      add constraint cricket_team_kit_requests_kit_type_check
      check (kit_type in (
        'jerseys_only','pants_only','full_team_kit',
        'training_kit','fan_merch','custom'
      ));
  end if;
end; $$;


-- ---------------------------------------------------------------------------
-- 12. cricket_sponsorship_packages
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_sponsorship_packages (
  id                uuid         primary key default gen_random_uuid(),
  league_id         uuid         not null references public.cricket_leagues(id) on delete cascade,
  team_id           uuid         references public.cricket_teams(id) on delete set null,
  match_id          uuid         references public.cricket_matches(id) on delete set null,
  name              text         not null,
  slug              text         not null,
  description       text,
  package_type      text         not null default 'league',
  status            text         not null default 'draft',
  visibility        text         not null default 'private',
  currency          text         not null default 'USD',
  price_cents       integer,
  inventory_quantity integer,
  benefits          jsonb        not null default '[]'::jsonb,
  placement_options jsonb        not null default '{}'::jsonb,
  start_date        date,
  end_date          date,
  created_by        uuid         references auth.users(id) on delete set null,
  created_at        timestamptz  not null default now(),
  updated_at        timestamptz  not null default now(),
  constraint cricket_sponsorship_packages_league_slug_unique unique (league_id, slug)
);

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_sponsorship_packages_price_check'
      and conrelid = 'public.cricket_sponsorship_packages'::regclass
  ) then
    alter table public.cricket_sponsorship_packages
      add constraint cricket_sponsorship_packages_price_check
      check (price_cents is null or price_cents >= 0);
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_sponsorship_packages_package_type_check'
      and conrelid = 'public.cricket_sponsorship_packages'::regclass
  ) then
    alter table public.cricket_sponsorship_packages
      add constraint cricket_sponsorship_packages_package_type_check
      check (package_type in (
        'league','team','match','broadcast','overlay',
        'jersey','ground','digital','custom'
      ));
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_sponsorship_packages_status_check'
      and conrelid = 'public.cricket_sponsorship_packages'::regclass
  ) then
    alter table public.cricket_sponsorship_packages
      add constraint cricket_sponsorship_packages_status_check
      check (status in ('draft','active','inactive','sold_out','archived'));
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_sponsorship_packages_visibility_check'
      and conrelid = 'public.cricket_sponsorship_packages'::regclass
  ) then
    alter table public.cricket_sponsorship_packages
      add constraint cricket_sponsorship_packages_visibility_check
      check (visibility in ('private','league','unlisted','public'));
  end if;
end; $$;


-- ---------------------------------------------------------------------------
-- 13. cricket_sponsorship_inquiries
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_sponsorship_inquiries (
  id             uuid         primary key default gen_random_uuid(),
  package_id     uuid         references public.cricket_sponsorship_packages(id) on delete set null,
  league_id      uuid         not null references public.cricket_leagues(id) on delete cascade,
  team_id        uuid         references public.cricket_teams(id) on delete set null,
  match_id       uuid         references public.cricket_matches(id) on delete set null,
  company_name   text         not null,
  contact_name   text         not null,
  contact_email  text         not null,
  contact_phone  text,
  message        text,
  status         text         not null default 'submitted',
  assigned_to    uuid         references auth.users(id) on delete set null,
  created_at     timestamptz  not null default now(),
  updated_at     timestamptz  not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cricket_sponsorship_inquiries_status_check'
      and conrelid = 'public.cricket_sponsorship_inquiries'::regclass
  ) then
    alter table public.cricket_sponsorship_inquiries
      add constraint cricket_sponsorship_inquiries_status_check
      check (status in ('submitted','reviewing','contacted','quoted','won','lost','archived'));
  end if;
end; $$;


-- ---------------------------------------------------------------------------
-- 14. cricket_commerce_events (audit log)
-- ---------------------------------------------------------------------------

create table if not exists public.cricket_commerce_events (
  id             uuid         primary key default gen_random_uuid(),
  league_id      uuid         references public.cricket_leagues(id) on delete cascade,
  team_id        uuid         references public.cricket_teams(id) on delete set null,
  vendor_id      uuid         references public.cricket_vendors(id) on delete set null,
  order_id       uuid         references public.cricket_orders(id) on delete set null,
  actor_user_id  uuid         references auth.users(id) on delete set null,
  event_type     text         not null,
  event_payload  jsonb        not null default '{}'::jsonb,
  created_at     timestamptz  not null default now()
);


-- ---------------------------------------------------------------------------
-- 15. Indexes (all created with IF NOT EXISTS safety)
-- ---------------------------------------------------------------------------

create index if not exists cricket_vendors_league_idx      on public.cricket_vendors (league_id);
create index if not exists cricket_vendors_slug_idx        on public.cricket_vendors (slug);
create index if not exists cricket_vendors_status_idx      on public.cricket_vendors (status);

create index if not exists cricket_products_vendor_idx     on public.cricket_products (vendor_id);
create index if not exists cricket_products_league_idx     on public.cricket_products (league_id);
create index if not exists cricket_products_category_idx   on public.cricket_products (category_id);
create index if not exists cricket_products_status_idx     on public.cricket_products (status);
create index if not exists cricket_products_visibility_idx on public.cricket_products (visibility);

create index if not exists cricket_product_variants_product_idx on public.cricket_product_variants (product_id);
create index if not exists cricket_product_reviews_product_idx  on public.cricket_product_reviews (product_id);

create index if not exists cricket_carts_user_idx          on public.cricket_carts (user_id);
create index if not exists cricket_cart_items_cart_idx     on public.cricket_cart_items (cart_id);

create index if not exists cricket_orders_user_idx         on public.cricket_orders (user_id);
create index if not exists cricket_orders_league_idx       on public.cricket_orders (league_id);
create index if not exists cricket_orders_team_idx         on public.cricket_orders (team_id);
create index if not exists cricket_orders_vendor_idx       on public.cricket_orders (vendor_id);
create index if not exists cricket_orders_status_idx       on public.cricket_orders (status);
create index if not exists cricket_orders_order_number_idx on public.cricket_orders (order_number);

create index if not exists cricket_order_items_order_idx   on public.cricket_order_items (order_id);

create index if not exists cricket_team_kit_requests_team_idx   on public.cricket_team_kit_requests (team_id);
create index if not exists cricket_team_kit_requests_status_idx on public.cricket_team_kit_requests (status);

create index if not exists cricket_sponsorship_packages_league_idx on public.cricket_sponsorship_packages (league_id);
create index if not exists cricket_sponsorship_packages_status_idx on public.cricket_sponsorship_packages (status);

create index if not exists cricket_sponsorship_inquiries_league_idx on public.cricket_sponsorship_inquiries (league_id);
create index if not exists cricket_sponsorship_inquiries_status_idx on public.cricket_sponsorship_inquiries (status);

create index if not exists cricket_commerce_events_league_idx on public.cricket_commerce_events (league_id);
create index if not exists cricket_commerce_events_order_idx  on public.cricket_commerce_events (order_id);
create index if not exists cricket_commerce_events_type_idx   on public.cricket_commerce_events (event_type);


-- ---------------------------------------------------------------------------
-- 16. updated_at triggers
-- ---------------------------------------------------------------------------

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_vendors'
      and tgrelid = 'public.cricket_vendors'::regclass
  ) then
    create trigger set_updated_at_cricket_vendors
      before update on public.cricket_vendors
      for each row execute function public.set_updated_at();
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_product_categories'
      and tgrelid = 'public.cricket_product_categories'::regclass
  ) then
    create trigger set_updated_at_cricket_product_categories
      before update on public.cricket_product_categories
      for each row execute function public.set_updated_at();
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_products'
      and tgrelid = 'public.cricket_products'::regclass
  ) then
    create trigger set_updated_at_cricket_products
      before update on public.cricket_products
      for each row execute function public.set_updated_at();
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_product_variants'
      and tgrelid = 'public.cricket_product_variants'::regclass
  ) then
    create trigger set_updated_at_cricket_product_variants
      before update on public.cricket_product_variants
      for each row execute function public.set_updated_at();
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_product_reviews'
      and tgrelid = 'public.cricket_product_reviews'::regclass
  ) then
    create trigger set_updated_at_cricket_product_reviews
      before update on public.cricket_product_reviews
      for each row execute function public.set_updated_at();
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_carts'
      and tgrelid = 'public.cricket_carts'::regclass
  ) then
    create trigger set_updated_at_cricket_carts
      before update on public.cricket_carts
      for each row execute function public.set_updated_at();
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_cart_items'
      and tgrelid = 'public.cricket_cart_items'::regclass
  ) then
    create trigger set_updated_at_cricket_cart_items
      before update on public.cricket_cart_items
      for each row execute function public.set_updated_at();
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_orders'
      and tgrelid = 'public.cricket_orders'::regclass
  ) then
    create trigger set_updated_at_cricket_orders
      before update on public.cricket_orders
      for each row execute function public.set_updated_at();
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_team_kit_requests'
      and tgrelid = 'public.cricket_team_kit_requests'::regclass
  ) then
    create trigger set_updated_at_cricket_team_kit_requests
      before update on public.cricket_team_kit_requests
      for each row execute function public.set_updated_at();
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_sponsorship_packages'
      and tgrelid = 'public.cricket_sponsorship_packages'::regclass
  ) then
    create trigger set_updated_at_cricket_sponsorship_packages
      before update on public.cricket_sponsorship_packages
      for each row execute function public.set_updated_at();
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_cricket_sponsorship_inquiries'
      and tgrelid = 'public.cricket_sponsorship_inquiries'::regclass
  ) then
    create trigger set_updated_at_cricket_sponsorship_inquiries
      before update on public.cricket_sponsorship_inquiries
      for each row execute function public.set_updated_at();
  end if;
end; $$;


-- ---------------------------------------------------------------------------
-- 17. Commerce RLS helper functions
-- ---------------------------------------------------------------------------

-- user_can_manage_cricket_vendor: vendor owner or league admin
create or replace function public.user_can_manage_cricket_vendor(
  p_vendor_id  uuid,
  p_user_id    uuid
)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.cricket_vendors v
    where v.id = p_vendor_id
      and (
        v.created_by = p_user_id
        or (
          v.league_id is not null
          and exists (
            select 1 from public.cricket_league_members m
            where m.league_id = v.league_id
              and m.user_id   = p_user_id
              and m.role in ('owner','admin','manager')
          )
        )
      )
  );
$$;

-- user_can_view_cricket_product: product is public+approved, or user is vendor/league admin
create or replace function public.user_can_view_cricket_product(
  p_product_id uuid,
  p_user_id    uuid
)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.cricket_products p
    where p.id = p_product_id
      and (
        -- public approved active product
        (p.visibility = 'public' and p.approval_status = 'approved' and p.status = 'active')
        -- vendor owner
        or (p.vendor_id is not null and public.user_can_manage_cricket_vendor(p.vendor_id, p_user_id))
        -- league admin
        or (
          p.league_id is not null
          and exists (
            select 1 from public.cricket_league_members m
            where m.league_id = p.league_id
              and m.user_id   = p_user_id
              and m.role in ('owner','admin','manager')
          )
        )
        -- own creation
        or p.created_by = p_user_id
      )
  );
$$;

-- user_can_view_cricket_order: the buyer, vendor owner, or league admin
create or replace function public.user_can_view_cricket_order(
  p_order_id uuid,
  p_user_id  uuid
)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.cricket_orders o
    where o.id = p_order_id
      and (
        o.user_id = p_user_id
        or (o.vendor_id is not null and public.user_can_manage_cricket_vendor(o.vendor_id, p_user_id))
        or (
          o.league_id is not null
          and exists (
            select 1 from public.cricket_league_members m
            where m.league_id = o.league_id
              and m.user_id   = p_user_id
              and m.role in ('owner','admin','manager')
          )
        )
      )
  );
$$;

-- user_can_manage_cricket_order: vendor owner or league admin (not buyer alone)
create or replace function public.user_can_manage_cricket_order(
  p_order_id uuid,
  p_user_id  uuid
)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.cricket_orders o
    where o.id = p_order_id
      and (
        (o.vendor_id is not null and public.user_can_manage_cricket_vendor(o.vendor_id, p_user_id))
        or (
          o.league_id is not null
          and exists (
            select 1 from public.cricket_league_members m
            where m.league_id = o.league_id
              and m.user_id   = p_user_id
              and m.role in ('owner','admin','manager')
          )
        )
      )
  );
$$;


-- ---------------------------------------------------------------------------
-- 18. Row-Level Security
-- ---------------------------------------------------------------------------

alter table public.cricket_vendors                 enable row level security;
alter table public.cricket_product_categories      enable row level security;
alter table public.cricket_products                enable row level security;
alter table public.cricket_product_variants        enable row level security;
alter table public.cricket_product_reviews         enable row level security;
alter table public.cricket_carts                   enable row level security;
alter table public.cricket_cart_items              enable row level security;
alter table public.cricket_orders                  enable row level security;
alter table public.cricket_order_items             enable row level security;
alter table public.cricket_team_kit_requests       enable row level security;
alter table public.cricket_sponsorship_packages    enable row level security;
alter table public.cricket_sponsorship_inquiries   enable row level security;
alter table public.cricket_commerce_events         enable row level security;


-- ── cricket_vendors ─────────────────────────────────────────────────────────

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_vendors' and policyname = 'vendors_public_read'
  ) then
    create policy vendors_public_read on public.cricket_vendors
      for select
      using (status = 'approved' and visibility = 'public');
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_vendors' and policyname = 'vendors_manager_all'
  ) then
    create policy vendors_manager_all on public.cricket_vendors
      for all
      using (public.user_can_manage_cricket_vendor(id, auth.uid()))
      with check (public.user_can_manage_cricket_vendor(id, auth.uid()));
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_vendors' and policyname = 'vendors_insert_authenticated'
  ) then
    create policy vendors_insert_authenticated on public.cricket_vendors
      for insert
      with check (auth.uid() is not null and created_by = auth.uid());
  end if;
end; $$;


-- ── cricket_product_categories ───────────────────────────────────────────────

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_product_categories' and policyname = 'categories_public_read'
  ) then
    create policy categories_public_read on public.cricket_product_categories
      for select
      using (is_active = true);
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_product_categories' and policyname = 'categories_admin_write'
  ) then
    create policy categories_admin_write on public.cricket_product_categories
      for all
      using (auth.uid() is not null)
      with check (auth.uid() is not null);
  end if;
end; $$;


-- ── cricket_products ─────────────────────────────────────────────────────────

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_products' and policyname = 'products_public_read'
  ) then
    create policy products_public_read on public.cricket_products
      for select
      using (
        visibility = 'public'
        and approval_status = 'approved'
        and status = 'active'
      );
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_products' and policyname = 'products_owner_all'
  ) then
    create policy products_owner_all on public.cricket_products
      for all
      using (
        created_by = auth.uid()
        or (vendor_id is not null and public.user_can_manage_cricket_vendor(vendor_id, auth.uid()))
        or (
          league_id is not null
          and exists (
            select 1 from public.cricket_league_members m
            where m.league_id = cricket_products.league_id
              and m.user_id   = auth.uid()
              and m.role in ('owner','admin','manager')
          )
        )
      )
      with check (
        created_by = auth.uid()
        or (vendor_id is not null and public.user_can_manage_cricket_vendor(vendor_id, auth.uid()))
        or (
          league_id is not null
          and exists (
            select 1 from public.cricket_league_members m
            where m.league_id = cricket_products.league_id
              and m.user_id   = auth.uid()
              and m.role in ('owner','admin','manager')
          )
        )
      );
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_products' and policyname = 'products_insert_authenticated'
  ) then
    create policy products_insert_authenticated on public.cricket_products
      for insert
      with check (auth.uid() is not null and created_by = auth.uid());
  end if;
end; $$;


-- ── cricket_product_variants ─────────────────────────────────────────────────

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_product_variants' and policyname = 'variants_read_via_product'
  ) then
    create policy variants_read_via_product on public.cricket_product_variants
      for select
      using (public.user_can_view_cricket_product(product_id, auth.uid()));
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_product_variants' and policyname = 'variants_write_via_vendor'
  ) then
    create policy variants_write_via_vendor on public.cricket_product_variants
      for all
      using (
        exists (
          select 1 from public.cricket_products p
          where p.id = product_id
            and (
              p.created_by = auth.uid()
              or (p.vendor_id is not null and public.user_can_manage_cricket_vendor(p.vendor_id, auth.uid()))
            )
        )
      )
      with check (
        exists (
          select 1 from public.cricket_products p
          where p.id = product_id
            and (
              p.created_by = auth.uid()
              or (p.vendor_id is not null and public.user_can_manage_cricket_vendor(p.vendor_id, auth.uid()))
            )
        )
      );
  end if;
end; $$;


-- ── cricket_product_reviews ──────────────────────────────────────────────────

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_product_reviews' and policyname = 'reviews_public_read_approved'
  ) then
    create policy reviews_public_read_approved on public.cricket_product_reviews
      for select
      using (status = 'approved');
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_product_reviews' and policyname = 'reviews_own_insert'
  ) then
    create policy reviews_own_insert on public.cricket_product_reviews
      for insert
      with check (auth.uid() is not null and user_id = auth.uid());
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_product_reviews' and policyname = 'reviews_own_read'
  ) then
    create policy reviews_own_read on public.cricket_product_reviews
      for select
      using (user_id = auth.uid());
  end if;
end; $$;


-- ── cricket_carts ────────────────────────────────────────────────────────────

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_carts' and policyname = 'carts_own_all'
  ) then
    create policy carts_own_all on public.cricket_carts
      for all
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end; $$;


-- ── cricket_cart_items ───────────────────────────────────────────────────────

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_cart_items' and policyname = 'cart_items_own_all'
  ) then
    create policy cart_items_own_all on public.cricket_cart_items
      for all
      using (
        exists (
          select 1 from public.cricket_carts c
          where c.id = cart_id and c.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from public.cricket_carts c
          where c.id = cart_id and c.user_id = auth.uid()
        )
      );
  end if;
end; $$;


-- ── cricket_orders ───────────────────────────────────────────────────────────

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_orders' and policyname = 'orders_view_permitted'
  ) then
    create policy orders_view_permitted on public.cricket_orders
      for select
      using (public.user_can_view_cricket_order(id, auth.uid()));
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_orders' and policyname = 'orders_insert_authenticated'
  ) then
    create policy orders_insert_authenticated on public.cricket_orders
      for insert
      with check (auth.uid() is not null and user_id = auth.uid());
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_orders' and policyname = 'orders_update_permitted'
  ) then
    create policy orders_update_permitted on public.cricket_orders
      for update
      using (public.user_can_manage_cricket_order(id, auth.uid()))
      with check (public.user_can_manage_cricket_order(id, auth.uid()));
  end if;
end; $$;


-- ── cricket_order_items ──────────────────────────────────────────────────────

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_order_items' and policyname = 'order_items_view_permitted'
  ) then
    create policy order_items_view_permitted on public.cricket_order_items
      for select
      using (public.user_can_view_cricket_order(order_id, auth.uid()));
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_order_items' and policyname = 'order_items_insert_permitted'
  ) then
    create policy order_items_insert_permitted on public.cricket_order_items
      for insert
      with check (public.user_can_view_cricket_order(order_id, auth.uid()));
  end if;
end; $$;


-- ── cricket_team_kit_requests ────────────────────────────────────────────────

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_team_kit_requests' and policyname = 'kit_requests_team_manager_all'
  ) then
    create policy kit_requests_team_manager_all on public.cricket_team_kit_requests
      for all
      using (
        requested_by = auth.uid()
        or public.user_can_manage_cricket_team(team_id, auth.uid())
        or (
          league_id is not null
          and exists (
            select 1 from public.cricket_league_members m
            where m.league_id = cricket_team_kit_requests.league_id
              and m.user_id   = auth.uid()
              and m.role in ('owner','admin','manager')
          )
        )
        or (vendor_id is not null and public.user_can_manage_cricket_vendor(vendor_id, auth.uid()))
      )
      with check (
        requested_by = auth.uid()
        or public.user_can_manage_cricket_team(team_id, auth.uid())
      );
  end if;
end; $$;


-- ── cricket_sponsorship_packages ─────────────────────────────────────────────

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_sponsorship_packages' and policyname = 'sponsor_packages_public_read'
  ) then
    create policy sponsor_packages_public_read on public.cricket_sponsorship_packages
      for select
      using (visibility in ('public','unlisted') and status = 'active');
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_sponsorship_packages' and policyname = 'sponsor_packages_league_admin_all'
  ) then
    create policy sponsor_packages_league_admin_all on public.cricket_sponsorship_packages
      for all
      using (
        created_by = auth.uid()
        or exists (
          select 1 from public.cricket_league_members m
          where m.league_id = cricket_sponsorship_packages.league_id
            and m.user_id   = auth.uid()
            and m.role in ('owner','admin','manager')
        )
      )
      with check (
        created_by = auth.uid()
        or exists (
          select 1 from public.cricket_league_members m
          where m.league_id = cricket_sponsorship_packages.league_id
            and m.user_id   = auth.uid()
            and m.role in ('owner','admin','manager')
        )
      );
  end if;
end; $$;


-- ── cricket_sponsorship_inquiries ────────────────────────────────────────────

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_sponsorship_inquiries' and policyname = 'sponsor_inquiries_insert_any'
  ) then
    create policy sponsor_inquiries_insert_any on public.cricket_sponsorship_inquiries
      for insert
      with check (true);
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_sponsorship_inquiries' and policyname = 'sponsor_inquiries_league_admin_read'
  ) then
    create policy sponsor_inquiries_league_admin_read on public.cricket_sponsorship_inquiries
      for select
      using (
        assigned_to = auth.uid()
        or exists (
          select 1 from public.cricket_league_members m
          where m.league_id = cricket_sponsorship_inquiries.league_id
            and m.user_id   = auth.uid()
            and m.role in ('owner','admin','manager')
        )
      );
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_sponsorship_inquiries' and policyname = 'sponsor_inquiries_league_admin_update'
  ) then
    create policy sponsor_inquiries_league_admin_update on public.cricket_sponsorship_inquiries
      for update
      using (
        assigned_to = auth.uid()
        or exists (
          select 1 from public.cricket_league_members m
          where m.league_id = cricket_sponsorship_inquiries.league_id
            and m.user_id   = auth.uid()
            and m.role in ('owner','admin','manager')
        )
      )
      with check (
        assigned_to = auth.uid()
        or exists (
          select 1 from public.cricket_league_members m
          where m.league_id = cricket_sponsorship_inquiries.league_id
            and m.user_id   = auth.uid()
            and m.role in ('owner','admin','manager')
        )
      );
  end if;
end; $$;


-- ── cricket_commerce_events ──────────────────────────────────────────────────

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_commerce_events' and policyname = 'commerce_events_league_admin_read'
  ) then
    create policy commerce_events_league_admin_read on public.cricket_commerce_events
      for select
      using (
        actor_user_id = auth.uid()
        or (
          league_id is not null
          and exists (
            select 1 from public.cricket_league_members m
            where m.league_id = cricket_commerce_events.league_id
              and m.user_id   = auth.uid()
              and m.role in ('owner','admin','manager')
          )
        )
        or (vendor_id is not null and public.user_can_manage_cricket_vendor(vendor_id, auth.uid()))
      );
  end if;
end; $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cricket_commerce_events' and policyname = 'commerce_events_insert_authenticated'
  ) then
    create policy commerce_events_insert_authenticated on public.cricket_commerce_events
      for insert
      with check (auth.uid() is not null);
  end if;
end; $$;


-- ---------------------------------------------------------------------------
-- 19. Seed default product categories (idempotent)
-- ---------------------------------------------------------------------------

insert into public.cricket_product_categories (name, slug, description, sort_order)
values
  ('Cricket Bats',          'bats',                 'All types of cricket bats',                          10),
  ('Cricket Balls',         'balls',                'Match and practice cricket balls',                   20),
  ('Batting Pads',          'pads',                 'Batting leg pads and arm guards',                    30),
  ('Gloves',                'gloves',               'Batting and wicketkeeping gloves',                   40),
  ('Helmets',               'helmets',              'Batting helmets and head protection',                50),
  ('Cricket Shoes',         'shoes',                'Cricket footwear and spikes',                        60),
  ('Bags & Holdalls',       'bags',                 'Cricket kit bags and holdalls',                      70),
  ('Training Equipment',    'training',             'Training aids, nets, and practice equipment',        80),
  ('Jerseys',               'jerseys',              'Cricket playing shirts and jerseys',                  90),
  ('Team Kits',             'team_kits',            'Complete team kit packages',                        100),
  ('Umpire Gear',           'umpire_gear',          'Umpiring equipment and accessories',               110),
  ('Ground Equipment',      'ground_equipment',     'Pitch covers, rollers, and ground maintenance',    120),
  ('Coaching Services',     'coaching_services',    'Professional coaching and clinics',                130),
  ('Photography & Video',   'photography_video',    'Cricket photography and videography services',     140),
  ('Sponsorship Packages',  'sponsorship_packages', 'League and team sponsorship opportunities',        150)
on conflict (slug) do nothing;
