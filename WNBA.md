# WNBA support

This repo now serves **two leagues from one codebase**: the NBA at the root (`/`)
and the WNBA under `/wnba`, sharing the same components, pipeline and model. A
league switcher in the site header toggles between them.

The WNBA is layered on **additively** — every league-aware function defaults to
`"nba"`, so the existing NBA site is byte-for-byte unchanged.

## Generating the data

The data pipeline is one script parameterized by a `LEAGUE` env var. The WNBA is
sourced from the public WNBA Stats API (`stats.wnba.com`, the WNBA twin of
`stats.nba.com`) with `LeagueID=10` and single-calendar-year seasons.

```bash
# NBA (unchanged)
npm run data         # → web/public/data/*.json
npm run playoffs
npm run shots

# WNBA
npm run data:wnba    # → web/public/data/wnba/*.json
npm run playoffs:wnba
npm run shots:wnba
```

> The WNBA has no pre-1996 "legends" pass — its first season is 1997, so the
> season feed already spans its entire history.

### Key WNBA differences baked into the pipeline (`pipeline/build-data.mjs`)

| Aspect | NBA | WNBA |
| --- | --- | --- |
| Stats host | `stats.nba.com` | `stats.wnba.com` |
| `LeagueID` | `00` | `10` |
| Season string | `2023-24` | `2024` |
| Season window | tips off in October | runs ~May–October |
| Season length (perfect chase) | 82 | 44 |
| Conferences / divisions | 2 conf, 6 div | 2 conf, no divisions |
| Output dir | `web/public/data/` | `web/public/data/wnba/` |

### ⚠️ Verify team tricodes after the first run

The WNBA franchise maps (`WNBA_TEAM_NAME` / `WNBA_TEAM_META` in
`pipeline/build-data.mjs`) use the WNBA's official 3-letter codes plus relocation
lineage (Utah/San Antonio → Las Vegas, Detroit/Tulsa → Dallas, Orlando →
Connecticut) and keep defunct franchises (Comets, Monarchs, Rockers, Sting, Sol,
Fire) as themselves. If a team is silently missing after a run, check its
`TEAM_ABBREVIATION` in the live standings response and add it to the map.

The WNBA **playoff** bracket reconstruction (`fetch-playoffs.mjs`) carries a
warning: the modern WNBA seeds 1–8 league-wide rather than by conference, so the
conference-based bracket builder may need league-specific handling — verify
`web/public/data/wnba/playoffs.json` before relying on it.

## How the league abstraction works

- `web/lib/league.ts` — the single source of truth. `LeagueId`, `LEAGUES`
  registry (season length, data dir, base path, branding), `getLeague()`,
  `dataPath()`, `leagueHref()`.
- All data loaders (`data.ts`, `serverdata.ts`, `teamdb.ts`, `playerdb.ts`,
  `matchdb.ts`) take an optional `league` and read NBA from `/data/` and WNBA
  from `/data/wnba/`. `readDataSafe()` lets WNBA pages build before the WNBA
  pipeline has been run.
- `sim.ts` — `simulateSeason(..., { games })`, `verdict(wins, games)` and
  `recordFromRating(..., games)` scale to the season length (82 vs 44).
- `clubs.ts` — per-league team colours and abbreviations.
- `SiteHeader.tsx` — detects the active league from the path and renders the
  NBA/WNBA switcher + league-prefixed nav.

## The model (separate repo)

The prediction model lives in **`Basketball-Modelling`** (published to
`https://danieltomaro13.github.io/Basketball-Modelling/data/`). It already serves
NBA + NBL; WNBA is added there as a third league. The site's `ModelView` is
league-generic and reads `predictions.json`, `futures.json`, `odds.json`,
`fantasy-wnba.json`, `leaders.json`, `futures-odds.json` and `games/wnba-*.json`
— filtering by `league === "wnba"`. Once the model repo publishes WNBA entries,
the `/wnba/model` page (Projections / Compare odds / Futures / Value / Fantasy /
Leaders) lights up automatically.
