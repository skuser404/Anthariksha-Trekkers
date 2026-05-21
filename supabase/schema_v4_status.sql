-- =============================================================
-- Anthariksha — Schema v4: Trek booking status
-- Adds `is_open` (booking status) to treks.
-- Run AFTER schema.sql in Supabase SQL Editor. Idempotent.
-- =============================================================

alter table public.treks
  add column if not exists is_open boolean not null default true;

-- Default every trek to Open. Admin can close individual treks
-- (e.g., monsoon shutdowns for Dudhsagar, Aug–Sept for Bandaje, etc.)
update public.treks set is_open = true where is_open is null;

create index if not exists treks_is_open_idx on public.treks (is_open) where is_active = true;

-- Optional: pre-close treks that are typically off-season right now.
-- Uncomment and adjust as needed.
-- update public.treks set is_open = false where id in ('dudhsagar');
