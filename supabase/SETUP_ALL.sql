-- ================================================================
-- Anthariksha Trekkers — COMPLETE database setup (one file)
--
-- Combines schema.sql + v2..v11 into a single idempotent script.
-- Paste the WHOLE file into: Supabase Dashboard → SQL Editor → Run.
-- Safe to re-run any time.
--
-- Fixes over the old per-version files:
--   1. RLS infinite recursion on `profiles` (admin checks now use a
--      SECURITY DEFINER function instead of querying profiles from
--      inside a profiles policy).
--   2. Invalid \' string escapes in the v5 park seed (now '').
--   3. Realtime: all live-synced tables are added to the
--      supabase_realtime publication so the site updates instantly.
--
-- AFTER RUNNING: create your admin user — see the bottom of this file.
-- ================================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists pgcrypto;

-- ============================================================
-- ADMIN CHECK — SECURITY DEFINER (bypasses RLS, no recursion)
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

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

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_admin_read on public.profiles;
create policy profiles_admin_read on public.profiles
  for select using (public.is_admin());

-- ============================================================
-- TREKS (public read, admin write) — includes v4 is_open + v8 offer_price
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
  offer_price integer,                       -- optional discounted price
  highlights jsonb default '[]'::jsonb,
  itinerary jsonb default '[]'::jsonb,
  gallery jsonb default '[]'::jsonb,
  is_active boolean not null default true,
  is_open boolean not null default true,     -- booking open/closed
  display_order integer not null default 100,
  updated_at timestamptz not null default now()
);

-- In case the table pre-exists without the newer columns
alter table public.treks add column if not exists is_open boolean not null default true;
alter table public.treks add column if not exists offer_price integer;

comment on column public.treks.offer_price is
  'Optional discounted price. When set (and < price), the site displays a strikethrough and offer badge.';

alter table public.treks enable row level security;

drop policy if exists treks_public_read on public.treks;
create policy treks_public_read on public.treks
  for select using (is_active = true);

drop policy if exists treks_admin_all on public.treks;
create policy treks_admin_all on public.treks
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- BOOKINGS (anonymous insert, admin read/manage)
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

drop policy if exists bookings_anon_insert on public.bookings;
create policy bookings_anon_insert on public.bookings
  for insert with check (true);

drop policy if exists bookings_admin_all on public.bookings;
create policy bookings_admin_all on public.bookings
  for all using (public.is_admin()) with check (public.is_admin());

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
  for select using (public.is_admin());

drop policy if exists audit_admin_insert on public.audit_log;
create policy audit_admin_insert on public.audit_log
  for insert with check (public.is_admin());

-- ============================================================
-- GALLERY IMAGES — includes v7 category + v9 media_type
-- ============================================================
create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  src text not null,
  caption text,
  category text,
  media_type text not null default 'image',
  trek_id text references public.treks(id) on delete set null,
  is_active boolean not null default true,
  display_order integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.gallery_images add column if not exists category text;
alter table public.gallery_images add column if not exists media_type text not null default 'image';

alter table public.gallery_images drop constraint if exists gallery_images_media_type_check;
alter table public.gallery_images
  add constraint gallery_images_media_type_check
  check (media_type in ('image', 'video'));

comment on column public.gallery_images.media_type is
  'image (default) or video. Videos render inline with hover-autoplay and play with controls in lightbox.';

alter table public.gallery_images enable row level security;

drop policy if exists gallery_public_read on public.gallery_images;
create policy gallery_public_read on public.gallery_images
  for select using (is_active = true);

drop policy if exists gallery_admin_all on public.gallery_images;
create policy gallery_admin_all on public.gallery_images
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- NEARBY PLACES (Explore Around)
-- ============================================================
create table if not exists public.nearby_places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text,
  type text,
  image text,
  description text check (char_length(coalesce(description, '')) <= 500),
  trek_id text references public.treks(id) on delete set null,
  is_active boolean not null default true,
  display_order integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.nearby_places enable row level security;

drop policy if exists nearby_public_read on public.nearby_places;
create policy nearby_public_read on public.nearby_places
  for select using (is_active = true);

drop policy if exists nearby_admin_all on public.nearby_places;
create policy nearby_admin_all on public.nearby_places
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- TESTIMONIALS
-- ============================================================
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  reviewer_name text not null,
  trek_id text references public.treks(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 10 and 600),
  review_date date,
  is_published boolean not null default true,
  display_order integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

drop policy if exists testimonials_public_read on public.testimonials;
create policy testimonials_public_read on public.testimonials
  for select using (is_published = true);

drop policy if exists testimonials_admin_all on public.testimonials;
create policy testimonials_admin_all on public.testimonials
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- HOMEPAGE SETTINGS (singleton)
-- ============================================================
create table if not exists public.homepage_settings (
  id smallint primary key default 1 check (id = 1),
  hero_headline text default 'Born to Trek. Built to Explore.',
  hero_subline text,
  hero_image text,
  hero_video text,
  featured_trek_ids text[] default array['kudremukh','netravati','bandaje','kurinjal','gangadikal','kodachadri'],
  rotating_tags text[] default array[
    'Kudremukh Expedition',
    'Kumara Parvatha Challenge',
    'Netravati Escape',
    'Bandaje Falls Adventure',
    'Kurinjal Peak Trek',
    'Kodachadri Journey',
    'Skandagiri Sunrise',
    'Tadiandamol Expedition'
  ],
  whatsapp_phone text default '+919902704361',
  updated_at timestamptz not null default now()
);

insert into public.homepage_settings (id) values (1) on conflict (id) do nothing;

alter table public.homepage_settings enable row level security;

drop policy if exists homepage_public_read on public.homepage_settings;
create policy homepage_public_read on public.homepage_settings
  for select using (true);

drop policy if exists homepage_admin_write on public.homepage_settings;
create policy homepage_admin_write on public.homepage_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- BATCHES (upcoming departures)
-- ============================================================
create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  trek_id text not null references public.treks(id) on delete cascade,
  trek_label text,
  start_date date not null,
  end_date date,
  date_label text,
  price integer,
  is_active boolean not null default true,
  display_order integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.batches enable row level security;

drop policy if exists batches_public_read on public.batches;
create policy batches_public_read on public.batches
  for select using (is_active = true and start_date >= current_date - interval '1 day');

drop policy if exists batches_admin_all on public.batches;
create policy batches_admin_all on public.batches
  for all using (public.is_admin()) with check (public.is_admin());

create index if not exists batches_active_start_idx on public.batches (is_active, start_date);
create index if not exists batches_trek_idx on public.batches (trek_id);

-- ============================================================
-- PARK INFO (singleton) — Kudremukh National Park reference data
-- ============================================================
create table if not exists public.park_info (
  id smallint primary key default 1 check (id = 1),
  name text not null default 'Kudremukh National Park',
  state text default 'Karnataka, India',
  districts text default 'Chikmagalur · Udupi · Dakshina Kannada',
  coordinates text default '13°10''N · 75°10''E',
  area_sq_km numeric default 600.32,
  established_year smallint default 1987,
  tiger_reserve_year smallint default 2011,
  elevation_min_m smallint default 134,
  elevation_max_m smallint default 1894,
  annual_rainfall_mm integer default 7000,
  forest_types text default 'Shola · Tropical Evergreen · Semi-Evergreen · Grassland',
  rivers text default 'Tunga · Bhadra · Nethravati',
  biodiversity_note text default 'Part of the Western Ghats UNESCO World Heritage Site',
  intro text default 'One of the largest protected areas in South India and a Project Tiger reserve. Three rivers — the Tunga, the Bhadra, and the Nethravati — all rise here, fed by 7 metres of monsoon rain a year.',
  hero_image text default '/images/ridge-peak.jpg',
  updated_at timestamptz not null default now()
);

insert into public.park_info (id) values (1) on conflict (id) do nothing;

alter table public.park_info enable row level security;

drop policy if exists park_info_public_read on public.park_info;
create policy park_info_public_read on public.park_info
  for select using (true);

drop policy if exists park_info_admin_write on public.park_info;
create policy park_info_admin_write on public.park_info
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- PARK TRAILS
-- ============================================================
create table if not exists public.park_trails (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  location text,
  rating numeric(2, 1) check (rating is null or rating between 0 and 5),
  difficulty text check (difficulty in ('Easy', 'Easy-Moderate', 'Moderate', 'Moderate-Hard', 'Hard')),
  distance_km numeric,
  elevation_gain_m integer,
  route_type text check (route_type in ('Out & Back', 'Loop', 'Point to Point', 'One Way')),
  description text,
  best_season text,
  duration text,
  image text,
  tags text[] default '{}',
  permit_required boolean default false,
  wildlife_likely text[] default '{}',
  is_active boolean not null default true,
  display_order integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.park_trails enable row level security;

drop policy if exists park_trails_public_read on public.park_trails;
create policy park_trails_public_read on public.park_trails
  for select using (is_active = true);

drop policy if exists park_trails_admin_all on public.park_trails;
create policy park_trails_admin_all on public.park_trails
  for all using (public.is_admin()) with check (public.is_admin());

create index if not exists park_trails_active_order_idx on public.park_trails (is_active, display_order);
create index if not exists park_trails_tags_idx on public.park_trails using gin (tags);

-- ============================================================
-- PARK WILDLIFE & FLORA
-- ============================================================
create table if not exists public.park_wildlife (
  id uuid primary key default gen_random_uuid(),
  common_name text not null,
  scientific_name text,
  category text not null check (category in ('mammal', 'bird', 'reptile', 'flora', 'tree')),
  iucn_status text check (iucn_status in ('LC', 'NT', 'VU', 'EN', 'CR', 'EX', 'DD')),
  description text,
  image text,
  is_active boolean not null default true,
  display_order integer not null default 100
);

alter table public.park_wildlife enable row level security;

drop policy if exists park_wildlife_public_read on public.park_wildlife;
create policy park_wildlife_public_read on public.park_wildlife
  for select using (is_active = true);

drop policy if exists park_wildlife_admin_all on public.park_wildlife;
create policy park_wildlife_admin_all on public.park_wildlife
  for all using (public.is_admin()) with check (public.is_admin());

create index if not exists park_wildlife_category_idx on public.park_wildlife (category, display_order) where is_active = true;

-- ============================================================
-- ANNOUNCEMENTS — includes v7 display_as
-- ============================================================
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  body text check (char_length(coalesce(body, '')) <= 600),
  link_url text,
  link_label text,
  tone text not null default 'info' check (tone in ('info', 'success', 'warning', 'ember')),
  display_as text not null default 'banner' check (display_as in ('banner', 'popup', 'both')),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  display_order integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.announcements
  add column if not exists display_as text not null default 'banner'
    check (display_as in ('banner', 'popup', 'both'));

alter table public.announcements enable row level security;

drop policy if exists ann_public_read on public.announcements;
create policy ann_public_read on public.announcements
  for select using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

drop policy if exists ann_admin_all on public.announcements;
create policy ann_admin_all on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

create index if not exists ann_active_idx on public.announcements (is_active, display_order);

-- ============================================================
-- SOCIAL LINKS
-- ============================================================
create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  label text,
  url text not null,
  handle text,
  is_active boolean not null default true,
  display_order integer not null default 100,
  updated_at timestamptz not null default now()
);

alter table public.social_links enable row level security;

drop policy if exists social_public_read on public.social_links;
create policy social_public_read on public.social_links
  for select using (is_active = true);

drop policy if exists social_admin_all on public.social_links;
create policy social_admin_all on public.social_links
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- TERMS / POLICY DOCUMENTS
-- ============================================================
create table if not exists public.terms_documents (
  id uuid primary key default gen_random_uuid(),
  kind text unique not null check (kind in ('terms', 'privacy', 'cancellation', 'safety', 'refund')),
  title text not null,
  body text not null,
  is_published boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.terms_documents enable row level security;

drop policy if exists terms_public_read on public.terms_documents;
create policy terms_public_read on public.terms_documents
  for select using (is_published = true);

drop policy if exists terms_admin_all on public.terms_documents;
create policy terms_admin_all on public.terms_documents
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- TREK GUIDELINES (singleton)
-- ============================================================
create table if not exists public.trek_guidelines (
  id           integer primary key default 1,
  intro_note   text,
  dos          jsonb not null default '[]'::jsonb,
  donts        jsonb not null default '[]'::jsonb,
  updated_at   timestamptz not null default now(),
  constraint single_row check (id = 1)
);

alter table public.trek_guidelines enable row level security;

drop policy if exists trek_guidelines_public_read on public.trek_guidelines;
create policy trek_guidelines_public_read on public.trek_guidelines
  for select using (true);

drop policy if exists trek_guidelines_admin_write on public.trek_guidelines;
create policy trek_guidelines_admin_write on public.trek_guidelines
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- STORAGE BUCKETS — images only; public read, admin write
-- ============================================================
-- Wrapped so a permissions error on storage never aborts the whole
-- script (some projects restrict SQL-editor access to storage.objects —
-- in that case create the buckets/policies from the Storage UI instead).
do $$
begin
  insert into storage.buckets (id, name, public)
  values
    ('trek-images',    'trek-images',    true),
    ('gallery-images', 'gallery-images', true),
    ('hero-images',    'hero-images',    true)
  on conflict (id) do nothing;

  execute 'drop policy if exists "Public images read" on storage.objects';
  execute $p$create policy "Public images read" on storage.objects
    for select using (
      bucket_id in ('trek-images', 'gallery-images', 'hero-images')
    )$p$;

  execute 'drop policy if exists "Admin images write" on storage.objects';
  execute $p$create policy "Admin images write" on storage.objects
    for insert with check (
      bucket_id in ('trek-images', 'gallery-images', 'hero-images')
      and public.is_admin()
    )$p$;

  execute 'drop policy if exists "Admin images update" on storage.objects';
  execute $p$create policy "Admin images update" on storage.objects
    for update using (
      bucket_id in ('trek-images', 'gallery-images', 'hero-images')
      and public.is_admin()
    )$p$;

  execute 'drop policy if exists "Admin images delete" on storage.objects';
  execute $p$create policy "Admin images delete" on storage.objects
    for delete using (
      bucket_id in ('trek-images', 'gallery-images', 'hero-images')
      and public.is_admin()
    )$p$;
exception when insufficient_privilege then
  raise notice 'Skipped storage buckets/policies (no permission from SQL editor) — configure them in Storage UI.';
end $$;

-- ============================================================
-- SEED — 28 treks (idempotent; updates metadata on re-run)
-- Priority order: Kudremukh → Netravati → Bandaje → Kurinjal →
-- Gangadikal → Kodachadri, then the rest.
-- ============================================================
insert into public.treks (id, name, region, tag, difficulty, duration, altitude, distance, best_season, from_bangalore, price, is_active, display_order) values
  ('kudremukh',                'Kudremukh Trek',                'Chikmagalur · Karnataka',     'Karnataka''s classic ridgeline. The horse-face peak.',          'Moderate',     '2 Days',      '1,894 m', '22 km',     'Sept–Feb',    '330 km',         4499,  true, 10),
  ('netravati',                'Netravati Peak Trek',           'Charmadi · Karnataka',        'Where clouds spill over the cliff.',                            'Difficult',    '2 Days',      '1,513 m', '20 km',     'Aug–Feb',     '320 km',         4499,  true, 20),
  ('bandaje',                  'Bandaje Falls Trek',            'Charmadi · Karnataka',        'A 200-foot drop into the wild.',                                'Difficult',    '2 Days',      '1,054 m', '24 km',     'Oct–Feb',     '290 km',         4100,  true, 30),
  ('kurinjal',                 'Kurinjal Peak Trek',            'Kudremukh Range · Karnataka', 'The quieter ridge of Kudremukh.',                               'Moderate',     '1 Day',       '1,573 m', '12 km',     'Sept–Feb',    '335 km',         3899,  true, 40),
  ('gangadikal',               'Gangadikal Peak Trek',          'Kudremukh NP · Karnataka',    'The newest permit trail in Kudremukh — face-on views of the horse-face peak.', 'Moderate','1 Day','1,690 m','10 km',  'Oct–May',     '330 km',         3999,  true, 50),
  ('kodachadri',               'Kodachadri Trek',               'Shimoga · Karnataka',         'Sunset peak of the Sahyadris.',                                 'Moderate',     '2 Days',      '1,343 m', '18 km',     'Oct–Feb',     '410 km',         4799,  true, 60),
  ('kumara-parvatha',          'Kumara Parvatha Trek',          'Kukke Subramanya · Karnataka','South India''s toughest forest climb.',                         'Tough',        '2 Days',      '1,712 m', '26 km',     'Oct–Feb',     '285 km',         4999,  true, 70),
  ('valikunja',                'Valikunja Trek',                'Kudremukh NP · Karnataka',    'The lesser-walked permit ridge inside the national park.',      'Moderate',     '1 Day',       '1,300 m', '14 km',     'Oct–May',     '350 km',         3999,  true, 80),
  ('seethabumi',               'Seethabumi Peak Trek',          'Kudremukh NP · Karnataka',    'Grassland summit on the quiet side of the Kudremukh range.',    'Moderate',     '1 Day',       '1,450 m', '12 km',     'Oct–May',     '340 km',         4199,  true, 90),
  ('tadiandamol',              'Tadiandamol Trek',              'Coorg · Karnataka',           'Coorg''s highest peak. Second-highest in Karnataka.',           'Moderate',     '1 Day',       '1,748 m', '12 km',     'Oct–Mar',     '265 km',         3699,  true, 100),
  ('skandagiri',               'Skandagiri Sunrise Trek',       'Chikkaballapur · Karnataka',  'Sunrise above the clouds. 60 km from Bangalore.',               'Easy',         '1 Night',     '1,450 m', '8 km',      'Year-round',  '60 km',          1899,  true, 110),
  ('kunti-betta',              'Kunti Betta Night Trek',        'Pandavapura · Karnataka',     'Stars, summit, sunrise. One night.',                            'Easy',         '1 Night',     '882 m',   '6 km',      'Year-round',  '125 km',         2199,  true, 120),
  ('ettina-bhuja',             'Ettina Bhuja Trek',             'Charmadi · Karnataka',        'The bull''s shoulder of the Ghats.',                            'Moderate',     '1 Day',       '1,300 m', '10 km',     'Sept–Feb',    '280 km',         3799,  true, 130),
  ('mullayanagiri',            'Mullayanagiri Trek',            'Chikmagalur · Karnataka',     'Karnataka''s highest peak. The summit Shiva temple.',           'Easy-Moderate','1 Day',       '1,930 m', '8 km',      'Sept–Mar',    '260 km',         3499,  true, 140),
  ('narasimha-parvatha',       'Narasimha Parvatha Trek',       'Agumbe · Karnataka',          'Through king cobra country — the Cherrapunji of the South.',    'Moderate',     '2 Days',      '826 m',   '24 km',     'Oct–Feb',     '380 km',         4699,  true, 150),
  ('gokarna',                  'Gokarna Beach Trek',            'Karwar Coast · Karnataka',    'Five beaches. One coastline. Bare feet.',                       'Easy',         '2 Days',      'Sea Level','14 km',    'Oct–Mar',     '480 km',         4899,  true, 160),
  ('dudhsagar',                'Dudhsagar Falls Trek',          'Goa-Karnataka border',        'India''s tallest waterfall, up close. (Closed in monsoon.)',    'Moderate',     '1 Day',       '310 m',   '14 km',     'Oct–May',     '560 km',         4299,  true, 170),
  ('ballalarayana-durga',      'Ballalarayana Durga Trek',      'Charmadi · Karnataka',        'Fort ruins on a ridge of fog.',                                 'Moderate',     '2 Days',      '1,509 m', '22 km',     'Oct–Feb',     '290 km',         4299,  true, 180),
  ('baba-budangiri',           'Baba Budangiri Trek',           'Chikmagalur · Karnataka',     'The saint''s peak — cave shrine, cliffs, and the Galikere meadow.', 'Easy-Moderate','1 Day',     '1,895 m', '9 km',      'Sept–Mar',    '270 km',         3499,  true, 190),
  ('kemmangundi-z-point',      'Kemmangundi Z-Point Trek',      'Kemmangundi · Chikmagalur',   'A cliff-edge sunrise above the Bhadra valley.',                 'Easy',         '1 Day',       '1,750 m', '6 km',      'Sept–Mar',    '270 km',         3299,  true, 200),
  ('deviramma-betta',          'Deviramma Betta Trek',          'Chikmagalur · Karnataka',     'The bare-rock pilgrim climb opposite Mullayanagiri.',           'Moderate',     '1 Day',       '1,200 m', '8 km',      'Oct–Mar',     '260 km',         3399,  true, 210),
  ('kyatanamakki',             'Kyatanamakki Hill Trek',        'Kalasa · Chikmagalur',        'Sea of clouds at sunrise — Chikmagalur''s wildest viewpoint.',  'Easy',         '1 Day',       '1,400 m', '5 km',      'Sept–Feb',    '300 km',         3299,  true, 220),
  ('chikmagalur-backpacking',  'Chikmagalur Backpacking',       'Chikmagalur · Karnataka',     'Coffee estates, two peaks, slow weekend.',                      'Easy',         '3 Days',      '1,200 m', 'Flexible',  'Year-round',  '245 km',         6499,  true, 230),
  ('coorg',                    'Coorg Adventure Trek',          'Madikeri · Karnataka',        'Coffee, rafting, ridgeline.',                                   'Easy',         '3 Days',      '1,400 m', 'Flexible',  'Oct–May',     '240 km',         6999,  true, 240),
  ('wayanad',                  'Wayanad Expedition',            'Wayanad · Kerala',            'Chembra Peak. Edakkal Caves. Tea country.',                     'Moderate',     '3 Days',      '2,100 m', 'Flexible',  'Sept–May',    '290 km',         7299,  true, 250),
  ('meghalaya',                'Meghalaya Adventure Expedition','Shillong · North-East India', 'Living root bridges. Cherrapunji. Dawki.',                      'Moderate',     '7 Days',      'Varies',  'Multi-stop','Oct–May',     'Fly to Guwahati', 28999, true, 260),
  ('himalayan-basecamp',       'Himalayan Basecamp Expedition', 'Uttarakhand · Himalayas',     'Our flagship Himalayan expedition.',                            'Difficult',    '7-10 Days',   '4,200 m+','60–90 km',  'Apr–Jun · Sept–Oct','Fly to Dehradun', 19999, true, 270),
  ('manali',                   'Manali Adventure Expedition',   'Kullu–Manali · Himachal Pradesh','Snow passes, Old Manali cafes, and the Atal Tunnel to Sissu.','Easy-Moderate','6 Days',     '4,000 m', 'Multi-stop','May–Oct',     'Fly to Delhi · Volvo to Manali', 18999, true, 280)
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
-- SEED — Explore Around places (idempotent)
-- ============================================================
insert into public.nearby_places (name, region, type, image, description, display_order)
select v.* from (values
  ('Hidlumane Falls',      'Near Kodachadri',             'Waterfall',          '/images/waterfall.jpg',      'A monsoon-fed plunge falls mid-route on the Kodachadri trek. Swim, eat lunch, climb on.', 10),
  ('Bhattara Mane',        'Kukke Subramanya',            'Legendary homestay', '/images/forest-stream.jpg',  'The mandatory food stop on the Kumara Parvatha trek. Hot meals, mountain folklore.',      20),
  ('Mookambika Temple',    'Kollur · Shimoga',            'Temple',             '/images/misty-trees.jpg',    '8th-century shrine on the Kodachadri route. Trekkers pause here at sunrise.',             30),
  ('Mandalpatti Viewpoint','Coorg',                       'Sunrise spot',       '/images/blue-sky-ridge.jpg', 'Jeep ride through coffee country to a sea-of-clouds sunrise. 30 min from Madikeri.',      40),
  ('Dubare Elephant Camp', 'Coorg · Kaveri river',        'Wildlife',           '/images/forest-stream.jpg',  'Wade across the Kaveri to bathe and feed elephants. Side-trip after the Coorg trek.',     50),
  ('Mawlynnong Village',   'East Khasi Hills · Meghalaya','Heritage',           '/images/green-ridge.jpg',    'Cleanest village in Asia. Living-root bridges, sky walk, bamboo cafes.',                  60),
  ('Agumbe Sunset Point',  'Shimoga · Karnataka',         'Sunset',             '/images/hero-sunrise.jpg',   'Watch the Arabian Sea swallow the sun from the rainforest cliffs of Agumbe.',             70),
  ('Banasura Sagar Dam',   'Wayanad · Kerala',            'Reservoir',          '/images/cliff-summit.jpg',   'Largest earth dam in India. Backwaters set against the Banasura Hills.',                  80)
) as v(name, region, type, image, description, display_order)
where not exists (select 1 from public.nearby_places p where p.name = v.name);

-- ============================================================
-- SEED — Park trails (idempotent on slug; \' escapes fixed)
-- ============================================================
insert into public.park_trails (title, slug, location, rating, difficulty, distance_km, elevation_gain_m, route_type, description, best_season, duration, image, tags, permit_required) values
  ('Kudremukh Peak Trail',     'kudremukh-peak',      'Mullodi · Kudremukh NP',      4.7, 'Moderate-Hard', 22, 900,  'Out & Back', 'The classic horse-face peak. Seven rolling shola hills, stream crossings, and a 360° summit at 1,894 m.',   'Sept–Feb',  '7–9 hrs', '/images/ridge-peak.jpg',    array['mountain','grassland','sunrise','permit'], true),
  ('Netravati Peak Trek',      'netravati-peak',      'Samse · Western Ghats',       4.6, 'Moderate-Hard', 14, 700,  'Out & Back', 'Cliff-edge meadows where clouds spill over the ridge. Camp option or summit-and-return day hike.',          'Aug–Feb',   '6–8 hrs', '/images/cliff-summit.jpg',  array['mountain','camping','grassland'], true),
  ('Kurinjal Peak Trail',      'kurinjal-peak',       'Bhagavathi · Kudremukh NP',   4.5, 'Moderate',      14, 600,  'Out & Back', 'The quieter sibling of Kudremukh. Shola → grassland with high chance of gaur and macaque sightings.',       'Sept–Feb',  '6 hrs',   '/images/green-ridge.jpg',   array['mountain','wildlife','permit'], true),
  ('Bandaje Falls Trek',       'bandaje-falls',       'Charmadi · Karnataka',        4.6, 'Hard',          24, 950,  'Out & Back', '200-foot waterfall plunging off a cliff-edge meadow. The most dramatic falls trail in the Ghats.',          'Oct–Feb',   '2 days',  '/images/waterfall.jpg',     array['waterfall','camping','mountain'], false),
  ('Narasimha Parvatha',       'narasimha-parvatha',  'Agumbe · Karnataka',          4.4, 'Moderate',      24, 750,  'Out & Back', 'Through the Agumbe rainforest — India''s king cobra capital. Dense canopy, stream crossings.',              'Oct–Feb',   '2 days',  '/images/forest-stream.jpg', array['forest','wildlife','waterfall'], false),
  ('Jamalabad Fort Trail',     'jamalabad-fort',      'Belthangady · Karnataka',     4.3, 'Easy-Moderate',  4, 450,  'Out & Back', '1,876 stone steps up a single rock fort built by Tipu Sultan. Two-hour climb with panoramic ghat views.',   'Oct–Mar',   '3–4 hrs', '/images/cliff-summit.jpg',  array['mountain','heritage','kid-friendly'], false),
  ('Valikunja Ridge',          'valikunja',           'Kudremukh NP',                4.4, 'Moderate',      16, 650,  'Loop',       'A lesser-walked ridge inside the national park. Permit-only — request through forest office at Karkala.',   'Oct–Feb',   '7 hrs',   '/images/green-ridge.jpg',   array['mountain','grassland','permit'], true),
  ('Thirumaleguppi Trail',     'thirumaleguppi',      'Kudremukh NP',                4.2, 'Moderate',      12, 500,  'Out & Back', 'Forest trail to a quiet hilltop. Macaque calls + Malabar whistling thrush around dawn.',                    'Sept–Feb',  '5 hrs',   '/images/misty-trees.jpg',   array['forest','wildlife','permit'], true),
  ('Mullodi Village Trail',    'mullodi-trail',       'Mullodi · Kudremukh NP',      4.5, 'Easy',           6, 200,  'Loop',       'Coffee estates, stream walks, and homestay backyards. The trek base village walking loop.',                 'Year-round','3 hrs',   '/images/forest-stream.jpg', array['forest','kid-friendly'], false),
  ('Lakya Dam Walk',           'lakya-dam',           'Lakya · Kudremukh NP',        4.1, 'Easy',           5, 100,  'Out & Back', 'A scenic walk to the silt-collection dam built when the iron-ore mine was active. Reservoir views.',        'Year-round','2 hrs',   '/images/blue-sky-ridge.jpg',array['kid-friendly','sunset'], false),
  ('Elaneeru Waterfalls',      'elaneeru-waterfalls', 'Kudremukh NP',                4.4, 'Easy-Moderate',  4, 250,  'Out & Back', 'Short forest walk to a tucked-away waterfall fed by monsoon streams. Pool at the base for a quick swim.',   'Jul–Jan',   '3 hrs',   '/images/waterfall.jpg',     array['waterfall','kid-friendly','forest'], false),
  ('Kajuru Hike',              'kajuru-hike',         'Kudremukh NP',                4.2, 'Easy-Moderate',  7, 350,  'Out & Back', 'A gentle hike to a viewpoint that overlooks the park''s eastern ridge. Good first-trek option.',            'Sept–Feb',  '4 hrs',   '/images/green-ridge.jpg',   array['mountain','kid-friendly'], false),
  ('Hanuman Gundi Falls',      'hanuman-gundi-falls', 'Kudremukh NP',                4.6, 'Easy',           2, 60,   'Out & Back', 'A 22-metre waterfall plunging into a natural rock pool. Steps lead to the base — a must-stop after rain.',  'Jul–Feb',   '2 hrs',   '/images/waterfall.jpg',     array['waterfall','kid-friendly'], false),
  ('Kadambi Waterfalls',       'kadambi-waterfalls',  'Kudremukh NP',                4.5, 'Easy',           1, 40,   'Out & Back', 'A roadside waterfall right on the Kudremukh–Karkala highway. Stop, photograph, refill water, continue.',    'Jul–Feb',   '1 hr',    '/images/waterfall.jpg',     array['waterfall','kid-friendly'], false),
  ('Ganga Moola Pilgrimage',   'ganga-moola',         'Kudremukh NP',                4.7, 'Moderate',      18, 750,  'Out & Back', 'The source point where the Tunga, Bhadra, and Nethravati rivers rise. A pilgrimage trail inside the park.', 'Oct–Mar',   '8 hrs',   '/images/forest-stream.jpg', array['forest','pilgrimage','permit'], true)
on conflict (slug) do nothing;

-- ============================================================
-- SEED — Wildlife & flora (idempotent on common_name)
-- ============================================================
insert into public.park_wildlife (common_name, scientific_name, category, iucn_status, description, display_order)
select v.* from (values
  ('Bengal Tiger',              'Panthera tigris tigris',    'mammal', 'EN', 'Project Tiger reserve since 2011. Camera traps confirm a small but stable population.', 10),
  ('Indian Leopard',            'Panthera pardus fusca',     'mammal', 'VU', 'Apex nocturnal predator. Heard more than seen on trails.', 20),
  ('Dhole (Asiatic Wild Dog)',  'Cuon alpinus',              'mammal', 'EN', 'Pack-hunting wild dogs, increasingly rare across the Ghats.', 30),
  ('Lion-Tailed Macaque',       'Macaca silenus',            'mammal', 'EN', 'Endemic to the Western Ghats. Distinctive silver mane. Spotted high in the canopy.', 40),
  ('Indian Gaur',               'Bos gaurus',                'mammal', 'VU', 'The world''s largest bovine. Frequently seen on the Kurinjal grasslands at dawn.', 50),
  ('Sloth Bear',                'Melursus ursinus',          'mammal', 'VU', 'Forest-floor foragers. Termite mounds along the trail are tell-tale signs.', 60),
  ('Malabar Giant Squirrel',    'Ratufa indica',             'mammal', 'LC', 'Bright tri-colour squirrels that leap between canopy gaps overhead.', 70),
  ('Malabar Trogon',            'Harpactes fasciatus',       'bird',   'LC', 'A vivid red-and-black forest bird, shy and stationary — easy to miss, unforgettable when spotted.', 110),
  ('Malabar Whistling Thrush',  'Myophonus horsfieldii',     'bird',   'LC', 'Known locally as the "whistling schoolboy" for its dawn call along streams.', 120),
  ('Mountain Imperial Pigeon',  'Ducula badia',              'bird',   'LC', 'Large canopy pigeon. Slow, low coos echo through the shola at sunrise.', 130),
  ('Great Hornbill',            'Buceros bicornis',          'bird',   'VU', 'Indicator species of healthy old-growth forest. Casque-tipped silhouette unmistakable.', 140),
  ('Shola Forests',             'Stunted evergreen patches', 'flora',  'LC', 'Dwarf tropical montane forests in valley folds, surrounded by grassland. Hold most of the park''s endemic biodiversity.', 210),
  ('Tropical Evergreen',        'Wet evergreen rainforest',  'flora',  'LC', 'Tall canopy, 7+ metres of rain a year, dense undergrowth. The Agumbe biosphere extends here.', 220),
  ('Montane Grasslands',        'High-elevation savanna',    'flora',  'LC', 'The rolling green ridges Kudremukh is famous for. Burnt and regenerated by fire over centuries.', 230)
) as v(common_name, scientific_name, category, iucn_status, description, display_order)
where not exists (select 1 from public.park_wildlife w where w.common_name = v.common_name);

-- ============================================================
-- SEED — Social links (idempotent on platform)
-- ============================================================
insert into public.social_links (platform, label, url, handle, display_order)
select v.* from (values
  ('instagram', 'Instagram',       'https://www.instagram.com/anthariksha_trekkers/', '@anthariksha_trekkers', 10),
  ('whatsapp',  'WhatsApp',        'https://wa.me/919902704361',                      '+91 99027 04361',       20),
  ('phone',     'Phone',           'tel:+919902704361',                               '+91 99027 04361',       30),
  ('google',    'Google Business', 'https://share.google/ufuKbaOOrvE3GrxJg',          'Anthariksha Trekkers',  40)
) as v(platform, label, url, handle, display_order)
where not exists (select 1 from public.social_links s where s.platform = v.platform);

-- ============================================================
-- SEED — Terms / policy documents (idempotent on kind)
-- ============================================================
insert into public.terms_documents (kind, title, body) values
  ('terms',        'Terms & Conditions',  '# Terms & Conditions' || E'\n\n' || 'By booking a trek with Anthariksha Trekkers, you agree to the following terms.' || E'\n\n' || '## 1. Bookings' || E'\n' || 'Bookings are confirmed only after full or partial payment. A confirmation voucher is sent within 24 hours.' || E'\n\n' || '## 2. Liability' || E'\n' || 'We act as a facilitator between you and independent service providers (transport, homestay, jeep). We are not liable for injury, illness, or delays caused by factors beyond our control.' || E'\n\n' || '## 3. Forest Permits' || E'\n' || 'Valid photo ID required at all times. Forest staff may deny entry for prohibited items — no refund in such cases.'),
  ('cancellation', 'Cancellation Policy', '# Cancellation Policy' || E'\n\n' || '- 60+ days before departure: 10% cancellation fee' || E'\n' || '- 30–60 days: 25% cancellation fee' || E'\n' || '- 15–30 days: 50% cancellation fee' || E'\n' || '- 7–15 days: 75% cancellation fee' || E'\n' || '- 0–7 days: 100% cancellation fee' || E'\n\n' || 'In case of weather / force-majeure cancellation, alternate batches are offered. Cash refunds are not available in such cases.'),
  ('privacy',      'Privacy Policy',      '# Privacy Policy' || E'\n\n' || 'We collect only the information you provide when booking — name, phone, email, pickup location. We never sell or share personal data with third parties.' || E'\n\n' || 'Booking data is stored securely in Supabase with row-level security. Only authenticated admins can access it.')
on conflict (kind) do nothing;

-- ============================================================
-- SEED — Trek guidelines singleton
-- ============================================================
insert into public.trek_guidelines (id, intro_note, dos, donts) values (
  1,
  'Empty lunch boxes are mandatory for trekking. Only Tupperware or steel lunch boxes are allowed — disposable or recyclable food containers are strictly NOT allowed.',
  '[
    "Wear proper trekking shoes with strong grip",
    "Keep your raincoat or poncho ready at all times",
    "Follow trek lead and guide instructions carefully",
    "Maintain team spirit and support fellow trekkers",
    "Respect nature — take memories and leave only footprints",
    "Carry enough water and personal essentials",
    "Keep your belongings safe and packed properly"
  ]'::jsonb,
  '[
    "Do not litter trails, campsites, or homestays",
    "Avoid plastic bottles, disposable cups, and plastic waste",
    "Do not leave the trekking group without informing the guide",
    "No loud music during trek or campsite experience",
    "Alcohol, smoking, and prohibited substances are strictly banned",
    "Do not damage plants, rocks, or natural surroundings"
  ]'::jsonb
) on conflict (id) do nothing;

-- ============================================================
-- SEED — Upcoming weekend batches for the 5 featured treks
-- (only when the batches table is empty)
-- ============================================================
do $$
declare
  feat text[] := array['kudremukh','netravati','bandaje','kurinjal','gangadikal','kodachadri'];
  trek text;
  fri date := (current_date + ((5 - extract(dow from current_date)::int + 7) % 7))::date;
  i int := 0;
begin
  if exists (select 1 from public.batches) then
    return;
  end if;

  if extract(dow from current_date) = 5 then
    fri := current_date + 7;
  end if;

  foreach trek in array feat loop
    insert into public.batches (trek_id, trek_label, start_date, end_date, price, is_active, display_order)
    select
      trek,
      initcap(replace(trek, '-', ' ')),
      (fri + (i * 7)),
      (fri + (i * 7) + 2),
      t.price,
      true,
      (i + 1) * 10
    from public.treks t where t.id = trek
    on conflict do nothing;
    i := i + 1;
  end loop;
end $$;

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists treks_is_active_order_idx on public.treks (is_active, display_order);
create index if not exists treks_is_open_idx on public.treks (is_open) where is_active = true;
create index if not exists bookings_trek_created_idx on public.bookings (trek_id, created_at desc);
create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists gallery_active_order_idx on public.gallery_images (is_active, display_order);
create index if not exists gallery_category_idx on public.gallery_images (category) where is_active = true;
create index if not exists nearby_active_order_idx on public.nearby_places (is_active, display_order);

-- ============================================================
-- REALTIME — add live-synced tables to the realtime publication
-- (the site and admin panel subscribe to postgres_changes)
-- ============================================================
do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  foreach t in array array[
    'treks', 'batches', 'bookings', 'gallery_images', 'announcements',
    'social_links', 'terms_documents', 'trek_guidelines', 'testimonials',
    'nearby_places', 'homepage_settings', 'park_info', 'park_trails', 'park_wildlife'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ================================================================
-- DONE. Final manual steps:
--
-- 1. Supabase Dashboard → Authentication → Users → Add user →
--    "Create new user". Email: gsunilkumar6018@gmail.com
--    Enter a strong password (never write it in this file) and
--    tick "Auto Confirm User".
--
-- 2. Then promote that user to admin — run this as-is:
--
--    insert into public.profiles (id, email, role)
--    select id, email, 'admin' from auth.users
--    where email = 'gsunilkumar6018@gmail.com'
--    on conflict (id) do update set role = 'admin';
--
-- 3. Project Settings → API → copy the Project URL and anon/publishable
--    key into `.env` locally AND into Vercel → Project Settings →
--    Environment Variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY),
--    then redeploy.
-- ================================================================
