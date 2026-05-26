-- =============================================================
-- Anthariksha — Schema v7: Phase 2 enhancements
-- - gallery_images.category (Group Pic, Waterfall, Summit, Campfire, etc.)
-- - announcements.display_as (banner | popup | both)
-- - treks.gallery already exists (jsonb) — used for 5-slot trek image manager
-- Idempotent. Run AFTER schema.sql / v2-v6.
-- =============================================================

-- Category field on gallery — admin sets a free-text category, public groups by it
alter table public.gallery_images
  add column if not exists category text;

create index if not exists gallery_category_idx on public.gallery_images (category) where is_active = true;

-- Announcement display mode
alter table public.announcements
  add column if not exists display_as text not null default 'banner'
    check (display_as in ('banner', 'popup', 'both'));

-- treks.gallery already exists as jsonb default '[]' from schema.sql.
-- No migration needed for the 5-image array. Confirm with:
--   select id, gallery from public.treks limit 1;
