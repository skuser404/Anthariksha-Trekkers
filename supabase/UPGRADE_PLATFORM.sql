-- ================================================================
-- Anthariksha — PLATFORM UPGRADE (search categories, trip planner,
-- contact inbox, card ribbons)
-- Paste the whole file into Supabase → SQL Editor → Run.
-- Idempotent — safe to re-run. Run AFTER SETUP_ALL.sql.
-- ================================================================

-- ============================================================
-- TRIP CATEGORIES — power the MakeMyTrip-style search tabs.
-- Admin can add/rename/reorder/disable without code.
-- ============================================================
create table if not exists public.trip_categories (
  id uuid primary key default gen_random_uuid(),
  cat_key text unique not null,          -- stable key used by the search form config
  label text not null,
  emoji text,
  is_active boolean not null default true,
  display_order integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.trip_categories enable row level security;

drop policy if exists cats_public_read on public.trip_categories;
create policy cats_public_read on public.trip_categories
  for select using (is_active = true);

drop policy if exists cats_admin_all on public.trip_categories;
create policy cats_admin_all on public.trip_categories
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.trip_categories (cat_key, label, emoji, display_order)
select v.* from (values
  ('trekking',      'Trekking',            '🏔', 10),
  ('sightseeing',   'Sightseeing',         '🌄', 20),
  ('camping',       'Camping',             '🏕', 30),
  ('beach',         'Beach Trips',         '🏖', 40),
  ('weekend',       'Weekend Getaways',    '🚌', 50),
  ('backpacking',   'Backpacking',         '🎒', 60),
  ('holiday',       'Holiday Packages',    '🧳', 70),
  ('international', 'International Trips', '🌏', 80),
  ('couple',        'Couple Packages',     '❤️', 90),
  ('family',        'Family Packages',     '👨‍👩‍👧', 100),
  ('college',       'College Trips',       '🎓', 110),
  ('corporate',     'Corporate Trips',     '🏢', 120),
  ('pilgrimage',    'Pilgrimage Tours',    '🛕', 130),
  ('oneday',        'One Day Trips',       '🚐', 140),
  ('custom',        'Custom Trip Planner', '✨', 150)
) as v(cat_key, label, emoji, display_order)
where not exists (select 1 from public.trip_categories c where c.cat_key = v.cat_key);

-- ============================================================
-- PLANNING REQUESTS — "Start Planning Your Dream Trip" + all
-- search-widget submissions land here for admin follow-up.
-- ============================================================
create table if not exists public.planning_requests (
  id uuid primary key default gen_random_uuid(),
  category text,
  destination text,
  start_date date,
  end_date date,
  people integer check (people is null or people between 1 and 500),
  budget text,
  food_pref text,
  stay_type text,
  transport text,
  activities text,
  special_request text check (char_length(coalesce(special_request, '')) <= 1500),
  full_name text not null check (char_length(full_name) between 2 and 80),
  phone text not null check (char_length(phone) between 7 and 20),
  email text,
  status text not null default 'new' check (status in ('new', 'replied', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.planning_requests enable row level security;

drop policy if exists plan_anon_insert on public.planning_requests;
create policy plan_anon_insert on public.planning_requests
  for insert with check (true);

drop policy if exists plan_admin_all on public.planning_requests;
create policy plan_admin_all on public.planning_requests
  for all using (public.is_admin()) with check (public.is_admin());

create index if not exists plan_status_created_idx on public.planning_requests (status, created_at desc);

-- ============================================================
-- CONTACT MESSAGES
-- ============================================================
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 80),
  phone text check (phone is null or char_length(phone) between 7 and 20),
  email text,
  subject text check (char_length(coalesce(subject, '')) <= 150),
  message text not null check (char_length(message) between 5 and 2000),
  status text not null default 'new' check (status in ('new', 'replied', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists contact_anon_insert on public.contact_messages;
create policy contact_anon_insert on public.contact_messages
  for insert with check (true);

drop policy if exists contact_admin_all on public.contact_messages;
create policy contact_admin_all on public.contact_messages
  for all using (public.is_admin()) with check (public.is_admin());

create index if not exists contact_status_created_idx on public.contact_messages (status, created_at desc);

-- ============================================================
-- TREK CARD RIBBONS + RATING
-- badge: 'Trending' | 'Most Popular' | 'Best Seller' | etc. (free text)
-- ============================================================
alter table public.treks add column if not exists badge text;
alter table public.treks add column if not exists rating numeric(2,1)
  check (rating is null or rating between 0 and 5);

comment on column public.treks.badge is
  'Ribbon shown on the trek card, e.g. Trending / Best Seller / Limited Seats. NULL = no ribbon.';

-- Sensible starter ribbons (only where not already set)
update public.treks set badge = 'Most Popular'   where id = 'kudremukh'  and badge is null;
update public.treks set badge = 'Trending'       where id = 'netravati'  and badge is null;
update public.treks set badge = 'Best Seller'    where id = 'bandaje'    and badge is null;
update public.treks set badge = 'Weekend Special' where id = 'kurinjal'  and badge is null;
update public.treks set badge = 'New Arrival'    where id in ('gangadikal', 'manali') and badge is null;

-- ============================================================
-- REALTIME for the new tables
-- ============================================================
do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['trip_categories', 'planning_requests', 'contact_messages'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
