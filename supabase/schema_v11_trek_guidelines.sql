-- ============================================================
-- Schema v11 — Trek Guidelines (Do's, Don'ts, mandatory rules)
-- Run once in Supabase SQL Editor.
--
-- Single-row table holding the global guidelines shown in every
-- trek modal. Editable from admin, syncs to public via realtime.
-- ============================================================

create table if not exists public.trek_guidelines (
  id           integer primary key default 1,
  intro_note   text,
  dos          jsonb not null default '[]'::jsonb,
  donts        jsonb not null default '[]'::jsonb,
  updated_at   timestamptz not null default now(),
  -- Single-row constraint
  constraint single_row check (id = 1)
);

alter table public.trek_guidelines enable row level security;

drop policy if exists trek_guidelines_public_read on public.trek_guidelines;
create policy trek_guidelines_public_read on public.trek_guidelines
  for select using (true);

drop policy if exists trek_guidelines_admin_write on public.trek_guidelines;
create policy trek_guidelines_admin_write on public.trek_guidelines
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  ) with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Default content
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

-- Verify
select id, jsonb_array_length(dos) as do_count, jsonb_array_length(donts) as dont_count
from public.trek_guidelines;
