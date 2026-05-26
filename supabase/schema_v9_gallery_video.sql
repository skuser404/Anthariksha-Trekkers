-- ============================================================
-- Schema v9 — Gallery video support
-- Run once in Supabase SQL Editor.
-- Adds a media_type column so the gallery can hold both images
-- and short autoplay video clips from Drive.
-- ============================================================

alter table public.gallery_images
  add column if not exists media_type text not null default 'image';

-- Constrain to known values
alter table public.gallery_images
  drop constraint if exists gallery_images_media_type_check;

alter table public.gallery_images
  add constraint gallery_images_media_type_check
  check (media_type in ('image', 'video'));

comment on column public.gallery_images.media_type is
  'image (default) or video. Videos render inline with hover-autoplay and play with controls in lightbox.';
