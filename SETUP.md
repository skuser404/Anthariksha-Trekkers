# Anthariksha — Supabase + Admin Setup

The marketing site works **without any backend** (static fallback). Once Supabase is configured, prices and trek content become editable from the hidden admin panel at `/control-room` (or `/antariksha-control-panel`).

> **⚠️ Free-tier Supabase projects are PAUSED after ~1 week of inactivity and eventually deleted.**
> If the admin panel stops working and the login says "Cannot reach the server", the project is gone —
> follow the steps below to restore it (takes ~10 minutes). To prevent it happening again, open the
> Supabase dashboard at least once a week, or upgrade the project to a paid plan.

## 1. Install dependencies
```bash
npm install
```

## 2. Create a Supabase project
1. https://supabase.com → New project. Pick a strong DB password.
2. **Project Settings → API**: copy the `Project URL` and the `anon` / `publishable` key.

## 3. Run the schema — ONE file
- Supabase Dashboard → **SQL Editor → New query**
- Open **`supabase/SETUP_ALL.sql`** from this repo, paste the whole file, **Run**.
- This creates *everything* in one shot: all 15 tables, RLS policies, storage buckets,
  seed data (20 treks, park trails, wildlife, social links, terms, guidelines), indexes,
  and realtime subscriptions.
- The old `schema.sql` + `schema_v2…v11` files are kept for reference only — you do **not**
  need to run them (SETUP_ALL.sql supersedes them and fixes two bugs: an RLS infinite-recursion
  error on `profiles`, and invalid `\'` escapes in the v5 seed).

## 4. Configure env vars locally
- Edit `.env` (copy from `.env.example` if missing):
  ```
  VITE_SUPABASE_URL=https://YOUR-NEW-PROJECT.supabase.co
  VITE_SUPABASE_ANON_KEY=sb_publishable_...
  ```
- Restart `npm run dev`.

## 5. Create your admin user
1. In Supabase → **Authentication → Users → Add user → Create new user**.
   Use a long password and tick **Auto Confirm User**.
2. Promote the user to admin — in Supabase SQL Editor:
   ```sql
   insert into public.profiles (id, email, role)
   select id, email, 'admin' from auth.users
   where email = 'you@example.com'
   on conflict (id) do update set role = 'admin';
   ```
3. Visit `/control-room`, sign in → you're in.

## 6. Deploy
- Vercel → Project Settings → **Environment Variables**: set `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` to the new project's values (they are baked into the bundle
  at build time, so a **redeploy is required** after changing them).
- `vercel.json` already sends strict security headers (HSTS, CSP, X-Frame, COOP, X-Robots-Tag noindex on `/control-room`).

## Security recap (what's already in place)
- **PKCE flow** for Supabase auth (no token in URL).
- **Idle session timeout** — admin signs out after 30 min of inactivity.
- **Login throttling** — 5 failed attempts → 10 min client-side lockout (Supabase Auth also rate-limits server-side).
- **Row Level Security** on every table.
- **`anon` role can only**: read active treks + insert their own bookings. Cannot read profiles, audit log, or other users' bookings.
- **Admin role** required for any `treks` / `bookings` mutation.
- **CSP** limits scripts to self + Supabase. Frame ancestors denied (no clickjacking).
- **`X-Robots-Tag: noindex`** on `/control-room` → not indexed by Google.
- **robots.txt** disallows `/control-room` from honest crawlers.
- **No service-role key** is ever shipped to the browser. Only the anon key, which is safe by design — RLS does the work.

## What to do from the admin panel today
- **Edit price** of any trek (live, instant on public site after refresh).
- **Toggle Active** to hide a trek from the public grid without deleting it.
- **Edit tag** (1-line subtitle on the card).
- **View bookings** as users submit them through the booking flow (when wired).

## Future expansion (already scaffolded in schema)
- `treks.gallery` (jsonb) — drop image URLs in to power per-trek gallery.
- `treks.hero_video` — point at a Supabase Storage signed URL.
- `treks.itinerary` (jsonb) — admin form can edit day-by-day directly.
- `bookings.status` — workflow: `new → contacted → confirmed → cancelled`.
- `audit_log` — track every admin action server-side.

For media management, create a Supabase Storage bucket called `trek-media` (public read, admin write) — the policy SQL is commented at the bottom of `schema.sql` ready to paste.
