-- =============================================================
-- Anthariksha — Schema v2 additions
-- Run AFTER schema.sql, in the same SQL Editor.
-- Adds: gallery_images, nearby_places, testimonials, homepage_settings.
-- Storage policies for the trek-images / gallery-images / hero-images buckets.
-- Idempotent — safe to re-run.
-- =============================================================

-- =============================================================
-- GALLERY IMAGES
-- =============================================================
create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  src text not null,
  caption text,
  trek_id text references public.treks(id) on delete set null,
  is_active boolean not null default true,
  display_order integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.gallery_images enable row level security;

drop policy if exists gallery_public_read on public.gallery_images;
create policy gallery_public_read on public.gallery_images
  for select using (is_active = true);

drop policy if exists gallery_admin_all on public.gallery_images;
create policy gallery_admin_all on public.gallery_images
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create index if not exists gallery_active_order_idx on public.gallery_images (is_active, display_order);

-- =============================================================
-- NEARBY PLACES (Explore Around)
-- =============================================================
create table if not exists public.nearby_places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text,
  type text,                                  -- waterfall / temple / viewpoint / heritage / wildlife
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
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create index if not exists nearby_active_order_idx on public.nearby_places (is_active, display_order);

-- Seed Explore Around (idempotent on name)
insert into public.nearby_places (name, region, type, image, description, display_order) values
  ('Hidlumane Falls',     'Near Kodachadri',          'Waterfall',         '/images/waterfall.jpg',     'A monsoon-fed plunge falls mid-route on the Kodachadri trek. Swim, eat lunch, climb on.', 10),
  ('Bhattara Mane',       'Kukke Subramanya',         'Legendary homestay','/images/forest-stream.jpg', 'The mandatory food stop on the Kumara Parvatha trek. Hot meals, mountain folklore.',     20),
  ('Mookambika Temple',   'Kollur · Shimoga',         'Temple',            '/images/misty-trees.jpg',   '8th-century shrine on the Kodachadri route. Trekkers pause here at sunrise.',            30),
  ('Mandalpatti Viewpoint','Coorg',                   'Sunrise spot',      '/images/blue-sky-ridge.jpg','Jeep ride through coffee country to a sea-of-clouds sunrise. 30 min from Madikeri.',     40),
  ('Dubare Elephant Camp','Coorg · Kaveri river',     'Wildlife',          '/images/forest-stream.jpg', 'Wade across the Kaveri to bathe and feed elephants. Side-trip after the Coorg trek.',    50),
  ('Mawlynnong Village',  'East Khasi Hills · Meghalaya','Heritage',       '/images/green-ridge.jpg',   'Cleanest village in Asia. Living-root bridges, sky walk, bamboo cafes.',                 60),
  ('Agumbe Sunset Point', 'Shimoga · Karnataka',      'Sunset',            '/images/hero-sunrise.jpg',  'Watch the Arabian Sea swallow the sun from the rainforest cliffs of Agumbe.',            70),
  ('Banasura Sagar Dam',  'Wayanad · Kerala',         'Reservoir',         '/images/cliff-summit.jpg',  'Largest earth dam in India. Backwaters set against the Banasura Hills.',                 80)
on conflict do nothing;

-- =============================================================
-- TESTIMONIALS
-- =============================================================
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
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- =============================================================
-- HOMEPAGE SETTINGS (singleton)
-- =============================================================
create table if not exists public.homepage_settings (
  id smallint primary key default 1 check (id = 1),
  hero_headline text default 'Born to Trek. Built to Explore.',
  hero_subline text,
  hero_image text,
  hero_video text,
  featured_trek_ids text[] default array['kudremukh','netravati','bandaje','kumara-parvatha','kurinjal'],
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
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- =============================================================
-- STORAGE BUCKETS — images only, no videos
-- Run these in the SQL editor. Buckets are public-read, admin-write.
-- =============================================================
insert into storage.buckets (id, name, public)
values
  ('trek-images',    'trek-images',    true),
  ('gallery-images', 'gallery-images', true),
  ('hero-images',    'hero-images',    true)
on conflict (id) do nothing;

-- Public read on all three image buckets
drop policy if exists "Public images read" on storage.objects;
create policy "Public images read" on storage.objects
  for select using (
    bucket_id in ('trek-images', 'gallery-images', 'hero-images')
  );

-- Admin-only insert / update / delete
drop policy if exists "Admin images write" on storage.objects;
create policy "Admin images write" on storage.objects
  for insert with check (
    bucket_id in ('trek-images', 'gallery-images', 'hero-images') and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Admin images update" on storage.objects;
create policy "Admin images update" on storage.objects
  for update using (
    bucket_id in ('trek-images', 'gallery-images', 'hero-images') and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Admin images delete" on storage.objects;
create policy "Admin images delete" on storage.objects
  for delete using (
    bucket_id in ('trek-images', 'gallery-images', 'hero-images') and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Block image file types only — enforce in client too (use upload widget that filters MIME).
-- For server-side mime enforcement, add a CHECK constraint in a wrapper RPC,
-- or use Supabase's bucket file_size_limit / allowed_mime_types via the dashboard:
--   Storage → bucket → Settings → Allowed MIME types: image/jpeg, image/png, image/webp
--   File size limit: 5MB (recommended for trek-images / gallery-images)
-- =============================================================
