-- Anthariksha Trekkers — Supabase schema + RLS policies + seed data
-- Run this in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT.

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists pgcrypto;

-- ============================================================
-- PROFILES (auth-linked, role gate for admin)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Auto-create a profile when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Profile RLS: each user can read their own; admins read all
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_admin_read on public.profiles;
create policy profiles_admin_read on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- TREKS (public read, admin write)
-- ============================================================
create table if not exists public.treks (
  id text primary key,                       -- e.g. 'kudremukh'
  name text not null,
  region text,
  tag text,
  image text,
  hero_video text,
  difficulty text,
  duration text,
  altitude text,
  distance text,
  best_season text,
  from_bangalore text,
  price integer,                             -- INR
  highlights jsonb default '[]'::jsonb,
  itinerary jsonb default '[]'::jsonb,
  gallery jsonb default '[]'::jsonb,
  is_active boolean not null default true,
  display_order integer not null default 100,
  updated_at timestamptz not null default now()
);

alter table public.treks enable row level security;

drop policy if exists treks_public_read on public.treks;
create policy treks_public_read on public.treks
  for select using (is_active = true);

drop policy if exists treks_admin_all on public.treks;
create policy treks_admin_all on public.treks
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- BOOKINGS (anonymous insert, admin read)
-- ============================================================
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  trek_id text not null references public.treks(id) on delete restrict,
  full_name text not null check (char_length(full_name) between 2 and 80),
  phone text not null check (char_length(phone) between 7 and 20),
  trek_date date,
  party_size integer not null default 1 check (party_size between 1 and 60),
  pickup_location text,
  notes text check (char_length(coalesce(notes, '')) <= 1000),
  status text not null default 'new' check (status in ('new', 'contacted', 'confirmed', 'cancelled')),
  ip_hash text,
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

-- Allow anonymous booking inserts (the booking form on the public site)
drop policy if exists bookings_anon_insert on public.bookings;
create policy bookings_anon_insert on public.bookings
  for insert with check (true);

drop policy if exists bookings_admin_all on public.bookings;
create policy bookings_admin_all on public.bookings
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- AUDIT LOG (admin actions)
-- ============================================================
create table if not exists public.audit_log (
  id bigserial primary key,
  actor uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  meta jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;
drop policy if exists audit_admin_read on public.audit_log;
create policy audit_admin_read on public.audit_log
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- STORAGE BUCKETS
-- Run these only if not already present.
-- For the `trek-media` bucket: public read, authenticated admin write
-- ============================================================
-- (Open Storage → New bucket → name: trek-media → public)
-- Storage policies are configured in the UI; SQL example:
--
-- insert into storage.buckets (id, name, public) values ('trek-media','trek-media', true)
--   on conflict (id) do nothing;
--
-- create policy "Public media read" on storage.objects for select
--   using (bucket_id = 'trek-media');
-- create policy "Admin media write" on storage.objects for insert
--   with check (
--     bucket_id = 'trek-media' and
--     exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
--   );

-- ============================================================
-- SEED — 20 treks (idempotent)
-- ============================================================
insert into public.treks (id, name, region, tag, difficulty, duration, altitude, distance, best_season, from_bangalore, price, is_active, display_order) values
  ('kudremukh',                'Kudremukh Trek',                'Chikmagalur · Karnataka',     'Karnataka''s classic ridgeline. The horse-face peak.',          'Moderate',     '2 Days',      '1,894 m', '22 km',     'Sept–Feb',    '330 km',         4499,  true, 10),
  ('kodachadri',               'Kodachadri Trek',               'Shimoga · Karnataka',         'Sunset peak of the Sahyadris.',                                 'Moderate',     '2 Days',      '1,343 m', '18 km',     'Oct–Feb',     '410 km',         4799,  true, 20),
  ('tadiandamol',              'Tadiandamol Trek',              'Coorg · Karnataka',           'Coorg''s highest peak. Second-highest in Karnataka.',           'Moderate',     '1 Day',       '1,748 m', '12 km',     'Oct–Mar',     '265 km',         3699,  true, 30),
  ('kumara-parvatha',          'Kumara Parvatha Trek',          'Kukke Subramanya · Karnataka','South India''s toughest forest climb.',                         'Tough',        '2 Days',      '1,712 m', '26 km',     'Oct–Feb',     '285 km',         4999,  true, 40),
  ('netravati',                'Netravati Peak Trek',           'Charmadi · Karnataka',        'Where clouds spill over the cliff.',                            'Difficult',    '2 Days',      '1,513 m', '20 km',     'Aug–Feb',     '320 km',         4499,  true, 50),
  ('skandagiri',               'Skandagiri Sunrise Trek',       'Chikkaballapur · Karnataka',  'Sunrise above the clouds. 60 km from Bangalore.',               'Easy',         '1 Night',     '1,450 m', '8 km',      'Year-round',  '60 km',          1899,  true, 60),
  ('kunti-betta',              'Kunti Betta Night Trek',        'Pandavapura · Karnataka',     'Stars, summit, sunrise. One night.',                            'Easy',         '1 Night',     '882 m',   '6 km',      'Year-round',  '125 km',         2199,  true, 70),
  ('ettina-bhuja',             'Ettina Bhuja Trek',             'Charmadi · Karnataka',        'The bull''s shoulder of the Ghats.',                            'Moderate',     '1 Day',       '1,300 m', '10 km',     'Sept–Feb',    '280 km',         3799,  true, 80),
  ('mullayanagiri',            'Mullayanagiri Trek',            'Chikmagalur · Karnataka',     'Karnataka''s highest peak. The summit Shiva temple.',           'Easy-Moderate','1 Day',       '1,930 m', '8 km',      'Sept–Mar',    '260 km',         3499,  true, 90),
  ('narasimha-parvatha',       'Narasimha Parvatha Trek',       'Agumbe · Karnataka',          'Through king cobra country — the Cherrapunji of the South.',    'Moderate',     '2 Days',      '826 m',   '24 km',     'Oct–Feb',     '380 km',         4699,  true, 100),
  ('gokarna',                  'Gokarna Beach Trek',            'Karwar Coast · Karnataka',    'Five beaches. One coastline. Bare feet.',                       'Easy',         '2 Days',      'Sea Level','14 km',    'Oct–Mar',     '480 km',         4899,  true, 110),
  ('dudhsagar',                'Dudhsagar Falls Trek',          'Goa-Karnataka border',        'India''s tallest waterfall, up close. (Closed in monsoon.)',    'Moderate',     '1 Day',       '310 m',   '14 km',     'Oct–May',     '560 km',         4299,  true, 120),
  ('bandaje',                  'Bandaje Falls Trek',            'Charmadi · Karnataka',        'A 200-foot drop into the wild.',                                'Difficult',    '2 Days',      '1,054 m', '24 km',     'Oct–Feb',     '290 km',         4100,  true, 130),
  ('kurinjal',                 'Kurinjal Peak Trek',            'Kudremukh Range · Karnataka', 'The quieter ridge of Kudremukh.',                               'Moderate',     '1 Day',       '1,573 m', '12 km',     'Sept–Feb',    '335 km',         3899,  true, 140),
  ('ballalarayana-durga',      'Ballalarayana Durga Trek',      'Charmadi · Karnataka',        'Fort ruins on a ridge of fog.',                                 'Moderate',     '2 Days',      '1,509 m', '22 km',     'Oct–Feb',     '290 km',         4299,  true, 150),
  ('chikmagalur-backpacking',  'Chikmagalur Backpacking',       'Chikmagalur · Karnataka',     'Coffee estates, two peaks, slow weekend.',                      'Easy',         '3 Days',      '1,200 m', 'Flexible',  'Year-round',  '245 km',         6499,  true, 160),
  ('coorg',                    'Coorg Adventure Trek',          'Madikeri · Karnataka',        'Coffee, rafting, ridgeline.',                                   'Easy',         '3 Days',      '1,400 m', 'Flexible',  'Oct–May',     '240 km',         6999,  true, 170),
  ('wayanad',                  'Wayanad Expedition',            'Wayanad · Kerala',            'Chembra Peak. Edakkal Caves. Tea country.',                     'Moderate',     '3 Days',      '2,100 m', 'Flexible',  'Sept–May',    '290 km',         7299,  true, 180),
  ('meghalaya',                'Meghalaya Adventure Expedition','Shillong · North-East India', 'Living root bridges. Cherrapunji. Dawki.',                      'Moderate',     '7 Days',      'Varies',  'Multi-stop','Oct–May',     'Fly to Guwahati', 28999, true, 190),
  ('himalayan-basecamp',       'Himalayan Basecamp Expedition', 'Uttarakhand · Himalayas',     'Our flagship Himalayan expedition.',                            'Difficult',    '7-10 Days',   '4,200 m+','60–90 km',  'Apr–Jun · Sept–Oct','Fly to Dehradun', 19999, true, 200)
on conflict (id) do update set
  name = excluded.name,
  region = excluded.region,
  tag = excluded.tag,
  difficulty = excluded.difficulty,
  duration = excluded.duration,
  altitude = excluded.altitude,
  distance = excluded.distance,
  best_season = excluded.best_season,
  from_bangalore = excluded.from_bangalore,
  price = excluded.price,
  display_order = excluded.display_order,
  updated_at = now();

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists treks_is_active_order_idx on public.treks (is_active, display_order);
create index if not exists bookings_trek_created_idx on public.bookings (trek_id, created_at desc);
create index if not exists bookings_status_idx on public.bookings (status);

-- ============================================================
-- TO PROMOTE A USER TO ADMIN (run once after signing up)
-- update public.profiles set role = 'admin' where email = 'you@example.com';
-- ============================================================
