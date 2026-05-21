# Anthariksha Trekkers — Western Ghats Adventures

Cinematic, editorial single-page site for **Anthariksha Trekkers**, a Bangalore-based trekking collective.

> Born to Trek. Built to Explore.

## Stack
- React 18 + Vite
- Tailwind CSS
- Framer Motion (scroll + hover motion)
- @studio-freight/lenis (smooth scroll)
- lucide-react (icons)
- Google Fonts: **Manrope** (body) + **Fraunces** (editorial display)

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:5173

## Build
```bash
npm run build
npm run preview
```

## Deploy
**Vercel (recommended):**
1. Push this repo to GitHub.
2. Import into Vercel — framework auto-detects as Vite.
3. Deploy. `vercel.json` is included.

**Netlify:** Build command `npm run build`, publish directory `dist`.

## Folder structure
```
.
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json
├── public/
│   └── favicon.svg
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    └── components/
        ├── Cursor.jsx
        ├── Navbar.jsx
        ├── Hero.jsx
        ├── Marquee.jsx
        ├── Intro.jsx
        ├── FeaturedTreks.jsx
        ├── WhyUs.jsx
        ├── ParallaxBreak.jsx
        ├── Journal.jsx
        ├── VideoStory.jsx
        ├── Testimonials.jsx
        ├── Batches.jsx
        ├── CTABanner.jsx
        ├── Footer.jsx
        └── WhatsAppFloat.jsx
```

## Brand
- **Instagram:** [@anthariksha_trekkers](https://www.instagram.com/anthariksha_trekkers/)
- **Phone / WhatsApp:** +91 9902704361
- **Google Profile:** https://share.google/ufuKbaOOrvE3GrxJg
