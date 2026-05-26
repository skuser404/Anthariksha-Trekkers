-- =============================================================
-- Anthariksha — Schema v6: Admin CMS foundation
-- announcements · social_links · terms_documents
-- Run AFTER schema.sql / v2 / v3 / v4 / v5. Idempotent.
-- =============================================================

-- =============================================================
-- ANNOUNCEMENTS — banners / news shown on the public site
-- =============================================================
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  body text check (char_length(coalesce(body, '')) <= 600),
  link_url text,
  link_label text,
  tone text not null default 'info' check (tone in ('info', 'success', 'warning', 'ember')),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  display_order integer not null default 100,
  created_at timestamptz not null default now()
);

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
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create index if not exists ann_active_idx on public.announcements (is_active, display_order);

-- =============================================================
-- SOCIAL LINKS — editable footer / contact links
-- =============================================================
create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,                     -- instagram, whatsapp, phone, google, youtube, etc.
  label text,                                 -- display name
  url text not null,                          -- target URL
  handle text,                                -- @username
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
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Seed default links
insert into public.social_links (platform, label, url, handle, display_order) values
  ('instagram', 'Instagram',         'https://www.instagram.com/anthariksha_trekkers/', '@anthariksha_trekkers', 10),
  ('whatsapp',  'WhatsApp',          'https://wa.me/919902704361',                       '+91 99027 04361',       20),
  ('phone',     'Phone',             'tel:+919902704361',                                 '+91 99027 04361',       30),
  ('google',    'Google Business',   'https://share.google/ufuKbaOOrvE3GrxJg',           'Anthariksha Trekkers',  40)
on conflict do nothing;

-- =============================================================
-- TERMS / POLICY DOCUMENTS — long-form legal/policy text
-- =============================================================
create table if not exists public.terms_documents (
  id uuid primary key default gen_random_uuid(),
  kind text unique not null check (kind in ('terms', 'privacy', 'cancellation', 'safety', 'refund')),
  title text not null,
  body text not null,                         -- markdown
  is_published boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.terms_documents enable row level security;

drop policy if exists terms_public_read on public.terms_documents;
create policy terms_public_read on public.terms_documents
  for select using (is_published = true);

drop policy if exists terms_admin_all on public.terms_documents;
create policy terms_admin_all on public.terms_documents
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Seed defaults
insert into public.terms_documents (kind, title, body) values
  ('terms',        'Terms & Conditions', '# Terms & Conditions\n\nBy booking a trek with Anthariksha Trekkers, you agree to the following terms.\n\n## 1. Bookings\nBookings are confirmed only after full or partial payment. A confirmation voucher is sent within 24 hours.\n\n## 2. Liability\nWe act as a facilitator between you and independent service providers (transport, homestay, jeep). We are not liable for injury, illness, or delays caused by factors beyond our control.\n\n## 3. Forest Permits\nValid photo ID required at all times. Forest staff may deny entry for prohibited items — no refund in such cases.'),
  ('cancellation', 'Cancellation Policy', '# Cancellation Policy\n\n- 60+ days before departure: 10% cancellation fee\n- 30–60 days: 25% cancellation fee\n- 15–30 days: 50% cancellation fee\n- 7–15 days: 75% cancellation fee\n- 0–7 days: 100% cancellation fee\n\nIn case of weather / force-majeure cancellation, alternate batches are offered. Cash refunds are not available in such cases.'),
  ('privacy',      'Privacy Policy', '# Privacy Policy\n\nWe collect only the information you provide when booking — name, phone, email, pickup location. We never sell or share personal data with third parties.\n\nBooking data is stored securely in Supabase with row-level security. Only authenticated admins can access it.')
on conflict (kind) do nothing;
