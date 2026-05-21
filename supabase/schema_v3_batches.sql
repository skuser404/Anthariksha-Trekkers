-- =============================================================
-- Anthariksha — Schema v3: Batches table
-- Run in Supabase SQL Editor AFTER schema.sql and schema_v2_additions.sql.
-- Idempotent — safe to re-run.
-- =============================================================

create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  trek_id text not null references public.treks(id) on delete cascade,
  trek_label text,                         -- short display name; falls back to trek name
  start_date date not null,
  end_date date,
  date_label text,                         -- optional override ("Dec 14-15"). Auto-formatted otherwise.
  price integer,                           -- INR. NULL → falls back to trek.price
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
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create index if not exists batches_active_start_idx on public.batches (is_active, start_date);
create index if not exists batches_trek_idx on public.batches (trek_id);

-- =============================================================
-- OPTIONAL: bootstrap with the next 5 weekends for the featured 5 treks
-- Comment this out if you want to manage everything by hand.
-- Calculates upcoming Fri→Sun ranges from today.
-- =============================================================
do $$
declare
  feat text[] := array['kudremukh','netravati','bandaje','kumara-parvatha','kurinjal'];
  trek text;
  fri date := (current_date + ((5 - extract(dow from current_date)::int + 7) % 7))::date;
  i int := 0;
begin
  -- If `current_date` happens to BE Friday, push to next Friday
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
