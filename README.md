# 🏀 NBA 82-0

> NBA stats, standings & addictive basketball mini-games. Build an all-time team and chase a perfect 82-0 season.
> Live at **[nba82-0.com](https://nba82-0.com)**.

The basketball entry in the **0 Series**, alongside [AFL 23-0](https://afl23-0.com), [NRL 24-0](https://nrl24-0.com) and [Football Invincibles](https://footballinvincibles.com).

## What's inside

**Stats & data (SEO-optimised, static-rendered)**
- **Standings** for every season, computed from real game results
- **Stat leaders** — points, rebounds, assists, blocks, games
- **Player profiles** with career stats + a static page per player
- **Schedule & results**

**Perfect Season**
Spin a franchise and era, draft a legend into every position, chase a flawless 82-0. Six modes — Starting Five, Rotation Eight, Active Thirteen, Salary Cap, The Gauntlet and The Tank — with a Monte-Carlo season simulator.

**The Games Vault**
| Game | What it is |
|------|-----------|
| 🏆 **Invincibles** | Draft a five, simulate a season, chase an undefeated record |
| 🟧 **Hoople** | The NBA Wordle — daily mystery player in 8 guesses |
| 📈 **Higher or Lower** | More or fewer points/boards/dimes? Build a streak |
| 🕵️ **Guess the Player** | Clues revealed one at a time; fewer = more points |
| 🧭 **Career Path** | Name the player from their profile |
| ⏱️ **Beat the Clock** | Name the top scorers in 60 seconds |
| 🔮 **Score Predictor** | Call the scoreline on real games |

Ratings are built from real NBA box-score stats. The full method is on the [About page](https://nba82-0.com/about).

## Tech

- **Next.js (App Router) + TypeScript + React 19**, exported as a **static site** for GitHub Pages
- **Tailwind v4** + a small CSS design system
- **SEO**: per-page metadata, Open Graph/Twitter, `sitemap.ts`, `robots.ts`, `manifest.ts`, JSON-LD
- A **pipeline** snapshots the public NBA Stats API into JSON the pages read at build time; a global leaderboard runs on a Cloudflare Worker

## Data

The dataset is committed under `web/public/data` so the build is pure-static.

- `npm run data` — fetch live box scores from `stats.nba.com` (used by the weekly refresh workflow). The NBA Stats API black-holes some datacenter IPs, so this can fail from CI/cloud runners.
- `npm run seed` — regenerate the committed fallback dataset (real legends + a modelled, internally-consistent set of standings/schedule). Always works offline.

The weekly refresh runs `npm run data || npm run seed`, so the site is never left without data.

## Project layout

```
pipeline/        # build-data.mjs (live NBA Stats API) + seed-data.mjs (offline fallback)
web/app/         # routes (pages, games, sitemap/robots/manifest)
web/components/  # UI + games/ (client game components)
web/lib/         # game engine, simulator, SEO helpers
web/public/data/ # generated JSON (pool, games, standings, schedule)
worker/          # Cloudflare Worker + KV leaderboard (optional)
```

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export to web/out
npm run seed     # regenerate the committed dataset
```

## Deploy (GitHub Pages)

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the static export and publishes it to GitHub Pages. One-time setup: **Settings → Pages → Source: GitHub Actions**, add the custom domain `nba82-0.com` (a `CNAME` file ships in `web/public`), and point Cloudflare DNS at GitHub Pages.

---

Independent project. Not affiliated with or endorsed by the NBA or any team. Data is for informational and entertainment use.
# nba-82-0
