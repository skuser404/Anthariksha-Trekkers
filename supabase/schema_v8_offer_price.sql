-- ============================================================
-- Schema v8 — Offer pricing system
-- Run once in Supabase SQL Editor.
-- Adds an optional discounted price column to the treks table.
-- When offer_price is set AND less than price, the public site
-- shows the original price struck out + the offer price highlighted.
-- ============================================================

alter table public.treks
  add column if not exists offer_price integer;

comment on column public.treks.offer_price is
  'Optional discounted price. When set (and < price), the site displays a strikethrough and offer badge.';

-- No RLS changes needed — treks is publicly readable, admin-writable already.
