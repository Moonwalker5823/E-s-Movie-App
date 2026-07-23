# Eric's Movie App 🎬♛

One central hub for movies, TV, live TV, and sports — themed black & gold.
Unified search + favorites + recommendations across every service, "where to watch"
that launches the right app, free live TV, and today's games with scores.

## What it does

- **Discovery hub** — search across all services; each title shows *where to watch* and
  one-click launches the official app (paid streams are DRM-locked and can only play in
  their own app — this app never re-streams them).
- **Favorites & Watchlist** — saved in your browser, and they power the "Because You Liked…"
  recommendation row.
- **Live TV** — launch tiles for free services (Pluto, Tubi, Samsung TV+, Plex, Roku, Xumo)
  plus 24/7 live channels on YouTube grouped by interest.
- **Sports** — live scores/schedules from ESPN, plus a **My Teams** dashboard (Giants, Bulls,
  Mets, Tar Heels, UConn) with records and next games.
- **Fantasy Football** — a TV-ready **Draft Room** with an **AI draft assistant** (pick advice,
  Q&A, scouting), roster/needs tracking, and player film/stats/news. Works offline via a built-in
  value-based "draft brain"; add a Claude API key for live AI advice.
- **Built for the TV** — big type that scales up on 4K sets (e.g. Hisense U8 100"), arrow-key /
  D-pad navigation, safe margins.

## Setup

1. Get a **free** TMDB key: https://www.themoviedb.org/settings/api (copy the *API Read Access Token*).
2. Copy `.env.example` to `.env` and paste it after `VITE_TMDB_TOKEN=`.
3. Install and run:

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Deploy (free)

Push to GitHub and import into [Vercel](https://vercel.com), or run `npx vercel`.
In the Vercel project's **Environment Variables**, add:

- `VITE_TMDB_TOKEN` — your TMDB token (movies/TV data). Required.
- `ANTHROPIC_API_KEY` — optional; enables the live AI draft assistant. Server-side only
  (no `VITE_` prefix, so it's never exposed to the browser). Used by `api/draft-assistant.ts`.

Without the Anthropic key, the Draft Room still works using the offline draft brain.

## Tech

Vite · React · TypeScript · Tailwind · framer-motion · TMDB API · ESPN public API.
No backend, no accounts. See [DESIGN.md](DESIGN.md) for the design system.
