-- =============================================================
-- Anthariksha — Schema v5: Kudremukh National Park ecosystem
-- Park info, park trails, wildlife, flora — for the
-- "explore the range" educational sections (separate from bookable treks).
-- Run AFTER schema.sql / v2 / v3 / v4. Idempotent.
-- =============================================================

-- =============================================================
-- PARK INFO (singleton)
-- Real Kudremukh National Park reference data.
-- Source: Karnataka Forest Department, UNESCO, IUCN listings.
-- =============================================================
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
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- =============================================================
-- PARK TRAILS — every trail inside / adjacent to the park
-- Separate from `public.treks` (which is the bookable catalog).
-- Used for the "Explore Kudremukh National Park" reference section.
-- =============================================================
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
  tags text[] default '{}',                            -- e.g. {'waterfall','camping','sunrise'}
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
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create index if not exists park_trails_active_order_idx on public.park_trails (is_active, display_order);
create index if not exists park_trails_tags_idx on public.park_trails using gin (tags);

-- Seed 15 trails — distances/elevations sourced from common AllTrails/SahyadriTrek references
insert into public.park_trails (title, slug, location, rating, difficulty, distance_km, elevation_gain_m, route_type, description, best_season, duration, image, tags, permit_required) values
  ('Kudremukh Peak Trail',     'kudremukh-peak',      'Mullodi · Kudremukh NP',      4.7, 'Moderate-Hard', 22, 900,  'Out & Back',     'The classic horse-face peak. Seven rolling shola hills, stream crossings, and a 360° summit at 1,894 m.', 'Sept–Feb', '7–9 hrs', '/images/ridge-peak.jpg',    array['mountain','grassland','sunrise','permit'], true),
  ('Netravati Peak Trek',      'netravati-peak',      'Samse · Western Ghats',       4.6, 'Moderate-Hard', 14, 700,  'Out & Back',     'Cliff-edge meadows where clouds spill over the ridge. Camp option or summit-and-return day hike.',         'Aug–Feb',  '6–8 hrs', '/images/cliff-summit.jpg',  array['mountain','camping','grassland'], true),
  ('Kurinjal Peak Trail',      'kurinjal-peak',       'Bhagavathi · Kudremukh NP',   4.5, 'Moderate',      14, 600,  'Out & Back',     'The quieter sibling of Kudremukh. Shola → grassland with high chance of gaur and macaque sightings.',     'Sept–Feb', '6 hrs',   '/images/green-ridge.jpg',   array['mountain','wildlife','permit'], true),
  ('Bandaje Falls Trek',       'bandaje-falls',       'Charmadi · Karnataka',        4.6, 'Hard',          24, 950,  'Out & Back',     '200-foot waterfall plunging off a cliff-edge meadow. The most dramatic falls trail in the Ghats.',         'Oct–Feb',  '2 days',  '/images/waterfall.jpg',     array['waterfall','camping','mountain'], false),
  ('Narasimha Parvatha',       'narasimha-parvatha',  'Agumbe · Karnataka',          4.4, 'Moderate',      24, 750,  'Out & Back',     'Through the Agumbe rainforest — India\'s king cobra capital. Dense canopy, stream crossings.',             'Oct–Feb',  '2 days',  '/images/forest-stream.jpg', array['forest','wildlife','waterfall'], false),
  ('Jamalabad Fort Trail',     'jamalabad-fort',      'Belthangady · Karnataka',     4.3, 'Easy-Moderate',  4, 450,  'Out & Back',     '1,876 stone steps up a single rock fort built by Tipu Sultan. Two-hour climb with panoramic ghat views.', 'Oct–Mar',  '3–4 hrs', '/images/cliff-summit.jpg',  array['mountain','heritage','kid-friendly'], false),
  ('Valikunja Ridge',          'valikunja',           'Kudremukh NP',                4.4, 'Moderate',      16, 650,  'Loop',           'A lesser-walked ridge inside the national park. Permit-only — request through forest office at Karkala.', 'Oct–Feb',  '7 hrs',   '/images/green-ridge.jpg',   array['mountain','grassland','permit'], true),
  ('Thirumaleguppi Trail',     'thirumaleguppi',      'Kudremukh NP',                4.2, 'Moderate',      12, 500,  'Out & Back',     'Forest trail to a quiet hilltop. Macaque calls + Malabar whistling thrush around dawn.',                   'Sept–Feb', '5 hrs',   '/images/misty-trees.jpg',   array['forest','wildlife','permit'], true),
  ('Mullodi Village Trail',    'mullodi-trail',       'Mullodi · Kudremukh NP',      4.5, 'Easy',           6, 200,  'Loop',           'Coffee estates, stream walks, and homestay backyards. The trek base village walking loop.',                'Year-round','3 hrs',   '/images/forest-stream.jpg', array['forest','kid-friendly'], false),
  ('Lakya Dam Walk',           'lakya-dam',           'Lakya · Kudremukh NP',        4.1, 'Easy',           5, 100,  'Out & Back',     'A scenic walk to the silt-collection dam built when the iron-ore mine was active. Reservoir views.',       'Year-round','2 hrs',   '/images/blue-sky-ridge.jpg',array['kid-friendly','sunset'], false),
  ('Elaneeru Waterfalls',      'elaneeru-waterfalls', 'Kudremukh NP',                4.4, 'Easy-Moderate',  4, 250,  'Out & Back',     'Short forest walk to a tucked-away waterfall fed by monsoon streams. Pool at the base for a quick swim.',  'Jul–Jan',  '3 hrs',   '/images/waterfall.jpg',     array['waterfall','kid-friendly','forest'], false),
  ('Kajuru Hike',              'kajuru-hike',         'Kudremukh NP',                4.2, 'Easy-Moderate',  7, 350,  'Out & Back',     'A gentle hike to a viewpoint that overlooks the park\'s eastern ridge. Good first-trek option.',           'Sept–Feb', '4 hrs',   '/images/green-ridge.jpg',   array['mountain','kid-friendly'], false),
  ('Hanuman Gundi Falls',      'hanuman-gundi-falls', 'Kudremukh NP',                4.6, 'Easy',           2, 60,   'Out & Back',     'A 22-metre waterfall plunging into a natural rock pool. Steps lead to the base — a must-stop after rain.','Jul–Feb',  '2 hrs',   '/images/waterfall.jpg',     array['waterfall','kid-friendly'], false),
  ('Kadambi Waterfalls',       'kadambi-waterfalls',  'Kudremukh NP',                4.5, 'Easy',           1, 40,   'Out & Back',     'A roadside waterfall right on the Kudremukh–Karkala highway. Stop, photograph, refill water, continue.','Jul–Feb',  '1 hr',    '/images/waterfall.jpg',     array['waterfall','kid-friendly'], false),
  ('Ganga Moola Pilgrimage',   'ganga-moola',         'Kudremukh NP',                4.7, 'Moderate',      18, 750,  'Out & Back',     'The source point where the Tunga, Bhadra, and Nethravati rivers rise. A pilgrimage trail inside the park.','Oct–Mar', '8 hrs',   '/images/forest-stream.jpg', array['forest','pilgrimage','permit'], true)
on conflict (slug) do nothing;

-- =============================================================
-- WILDLIFE & FLORA — species found in the park
-- =============================================================
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
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create index if not exists park_wildlife_category_idx on public.park_wildlife (category, display_order) where is_active = true;

-- Seed mammals
insert into public.park_wildlife (common_name, scientific_name, category, iucn_status, description, display_order) values
  ('Bengal Tiger',          'Panthera tigris tigris', 'mammal', 'EN', 'Project Tiger reserve since 2011. Camera traps confirm a small but stable population.', 10),
  ('Indian Leopard',        'Panthera pardus fusca',  'mammal', 'VU', 'Apex nocturnal predator. Heard more than seen on trails.', 20),
  ('Dhole (Asiatic Wild Dog)','Cuon alpinus',         'mammal', 'EN', 'Pack-hunting wild dogs, increasingly rare across the Ghats.', 30),
  ('Lion-Tailed Macaque',   'Macaca silenus',         'mammal', 'EN', 'Endemic to the Western Ghats. Distinctive silver mane. Spotted high in the canopy.', 40),
  ('Indian Gaur',           'Bos gaurus',             'mammal', 'VU', 'The world''s largest bovine. Frequently seen on the Kurinjal grasslands at dawn.', 50),
  ('Sloth Bear',            'Melursus ursinus',       'mammal', 'VU', 'Forest-floor foragers. Termite mounds along the trail are tell-tale signs.', 60),
  ('Malabar Giant Squirrel','Ratufa indica',          'mammal', 'LC', 'Bright tri-colour squirrels that leap between canopy gaps overhead.', 70)
on conflict do nothing;

-- Seed birds
insert into public.park_wildlife (common_name, scientific_name, category, iucn_status, description, display_order) values
  ('Malabar Trogon',                'Harpactes fasciatus',    'bird', 'LC', 'A vivid red-and-black forest bird, shy and stationary — easy to miss, unforgettable when spotted.', 110),
  ('Malabar Whistling Thrush',      'Myophonus horsfieldii',  'bird', 'LC', 'Known locally as the "whistling schoolboy" for its dawn call along streams.', 120),
  ('Mountain Imperial Pigeon',      'Ducula badia',           'bird', 'LC', 'Large canopy pigeon. Slow, low coos echo through the shola at sunrise.', 130),
  ('Great Hornbill',                'Buceros bicornis',       'bird', 'VU', 'Indicator species of healthy old-growth forest. Casque-tipped silhouette unmistakable.', 140)
on conflict do nothing;

-- Seed flora / forest types
insert into public.park_wildlife (common_name, scientific_name, category, iucn_status, description, display_order) values
  ('Shola Forests',         'Stunted evergreen patches', 'flora', 'LC', 'Dwarf tropical montane forests in valley folds, surrounded by grassland. Hold most of the park''s endemic biodiversity.', 210),
  ('Tropical Evergreen',    'Wet evergreen rainforest',  'flora', 'LC', 'Tall canopy, 7+ metres of rain a year, dense undergrowth. The Agumbe biosphere extends here.', 220),
  ('Montane Grasslands',    'High-elevation savanna',    'flora', 'LC', 'The rolling green ridges Kudremukh is famous for. Burnt and regenerated by fire over centuries.', 230)
on conflict do nothing;
