# Anthariksha — Supabase + Admin Setup

The marketing site works **without any backend** (static fallback). Once Supabase is configured, prices and trek content become editable from the hidden admin panel.

## 1. Install the new dependency
```bash
npm install
```
(`@supabase/supabase-js` is now in `package.json`.)

## 2. Create a Supabase project
1. https://supabase.com → New project. Pick a strong DB password.
2. **Project Settings → API**: copy `URL` and `anon public key`.

## 3. Run the schema
- Supabase Dashboard → **SQL Editor → New query**
- Open `supabase/schema.sql` from this repo, paste, **Run**.
- This creates: `profiles`, `treks` (seeded with all 20), `bookings`, `audit_log`, RLS policies, indexes.

## 4. Configure env vars locally
- Copy `.env.example` to `.env`:
  ```
  VITE_SUPABASE_URL=https://xxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJ...
  ```
- Restart `npm run dev`.

## 5. Create your admin user
1. Visit `/control-room` on your local site. You'll see the login screen.
2. In Supabase → **Authentication → Users → Add user → Create new user**. Use a long password.
3. Sign in once at `/control-room` so a row is auto-created in `public.profiles`.
4. Promote yourself to admin — in Supabase SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
5. Refresh `/control-room` → you're in.

## 6. Deploy
- Vercel: add the two `VITE_SUPABASE_*` env vars in Project Settings → Environment Variables.
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
