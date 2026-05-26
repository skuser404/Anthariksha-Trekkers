-- ============================================================
-- Schema v10 — Seed the treks table
-- Run once in Supabase SQL Editor.
--
-- THIS IS THE FIX for: "Itinerary editor / Image Manager shows
-- 'No treks match'". The treks table was empty — the public site
-- rendered from hardcoded data, but the admin pulls from this
-- table, so it saw zero rows.
--
-- Inserts the 17 trek IDs the frontend already references, with
-- starter metadata. Admin can then edit prices, images, itinerary
-- etc. and the public site picks up changes through useLiveTreks.
--
-- Safe to re-run — uses ON CONFLICT DO NOTHING.
-- ============================================================

insert into public.treks (id, name, region, difficulty, duration, tag, display_order, is_active, is_open) values
  ('kudremukh',              'Kudremukh Trek',           'Chikmagalur · Karnataka',    'Moderate',       '2 Days', 'Where the ridge meets the sky.',                       10, true, true),
  ('netravati',              'Netravati Peak Trek',      'Samse · Karnataka',          'Difficult',      '2 Days', 'Where clouds spill over the cliff.',                   20, true, true),
  ('bandaje',                'Bandaje Falls Trek',       'Charmadi · Karnataka',       'Difficult',      '2 Days', 'A 200-foot drop into the wild.',                       30, true, true),
  ('kumara-parvatha',        'Kumara Parvatha Trek',     'Kukke Subramanya · Karnataka','Tough',         '2 Days', 'The second-highest peak in Karnataka.',                40, true, true),
  ('kurinjal',               'Kurinjal Peak Trek',       'Kudremukh Range · Karnataka','Moderate',       '1 Day',  'The quieter ridge of Kudremukh.',                      50, true, true),
  ('kodachadri',             'Kodachadri Trek',          'Shimoga · Karnataka',        'Moderate',       '2 Days', 'Sunset peak of the Sahyadris.',                        60, true, true),
  ('tadiandamol',            'Tadiandamol Trek',         'Coorg · Karnataka',          'Moderate',       '1 Day',  'Coorg''s highest peak.',                                70, true, true),
  ('skandagiri',             'Skandagiri Sunrise Trek',  'Chikkaballapur · Karnataka', 'Easy',           '1 Night','Sunrise above the clouds. 60 km from Bangalore.',      80, true, true),
  ('kunti-betta',            'Kunti Betta Night Trek',   'Pandavapura · Karnataka',    'Easy',           '1 Night','Stars, summit, sunrise. One night.',                    90, true, true),
  ('ettina-bhuja',           'Ettina Bhuja Trek',        'Charmadi · Karnataka',       'Moderate',       '1 Day',  'A bull''s shoulder above the valley.',                 100, true, true),
  ('mullayanagiri',          'Mullayanagiri Trek',       'Chikmagalur · Karnataka',    'Easy-Moderate',  '1 Day',  'The highest point in Karnataka.',                      110, true, true),
  ('narasimha-parvatha',     'Narasimha Parvatha Trek',  'Agumbe · Karnataka',         'Moderate',       '2 Days', 'Through king cobra country — the Cherrapunji of the South.', 120, true, true),
  ('gokarna',                'Gokarna Beach Trek',       'Karwar Coast · Karnataka',   'Easy',           '2 Days', 'Five beaches. One coastline. Bare feet.',              130, true, true),
  ('ballalarayana-durga',    'Ballalarayana Durga Trek', 'Charmadi · Karnataka',       'Moderate',       '2 Days', 'Fort ruins on a ridge of fog.',                        140, true, true),
  ('chikmagalur-backpacking','Chikmagalur Backpacking',  'Chikmagalur · Karnataka',    'Easy',           '3 Days', 'Coffee estates, two peaks, slow weekend.',             150, true, true),
  ('coorg',                  'Coorg Adventure Trek',     'Madikeri · Karnataka',       'Easy',           '3 Days', 'Coffee, rafting, ridgeline.',                          160, true, true),
  ('wayanad',                'Wayanad Expedition',       'Wayanad · Kerala',           'Moderate',       '3 Days', 'Chembra Peak. Edakkal Caves. Tea country.',            170, true, true)
on conflict (id) do nothing;

-- Verify — should return 17 rows
select id, name, difficulty, is_active from public.treks order by display_order;
