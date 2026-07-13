# NBA Summer League support

This repo serves a third league — the **NBA Summer League** under `/summer` — alongside
the NBA at the root (`/`) and the WNBA under `/wnba`. Unlike the other two, Summer League is a
**stats-&-projections surface only**: there is no perfect-season chase, no games vault and no shot
charts. A ~5-game neutral-site July event has no 82-0 analogue, and ESPN publishes no player/box-score
feed for it, so the section is intentionally lean.

Like the WNBA, it's layered on **additively** — every league-aware function still defaults to `"nba"`,
so the NBA and WNBA sites are byte-for-byte unchanged.

## What's under `/summer`

| Route | What it is |
| --- | --- |
| `/summer` | Overview — hero + **power ratings** table (results-based Elo + opponent-adjusted off/def/pace for all 30 franchises) |
| `/summer/model` | The model view — **Projections**, **Pick'em** and **Value** tabs, plus the full per-game market book (moneyline, spread, total, team totals, margins, quarters, halves) |

The header renders an `SL` badge, an `NBA Summer League` wordmark and a third **Summer** pill in the
league switcher, with a trimmed nav (Overview / Projections) so it never links to pages that don't
exist for this league.

## Where the data comes from

Everything on `/summer` is read at runtime from the published **Basketball-Modelling** feed
(`https://danieltomaro13.github.io/Basketball-Modelling/data/`), the same feed the NBA/WNBA model
pages use. That repo publishes an `nbasummer` league (see its README): `predictions.json`,
`ratings.json`, `odds.json` and `games/nbasummer-*.json`. There is **no site-native Summer League
dataset** under `web/public/data/` — the site's own pipeline (`pipeline/build-data.mjs`) is not run
for Summer League, because ESPN exposes no season table / player profiles / shots for it.

Consequences, baked into the UI:

- **Populated:** Projections, Pick'em, the per-game market book, and power ratings.
- **Empty by design:** player props (the game modal's Players tab), Fantasy, Futures, Compare and
  Leaders — so the model view hides those tabs for `nbasummer` (see `LEAGUE_TABS` in
  `web/components/ModelView.tsx`). They render gracefully if ever fed.

## How the league abstraction extends

- `web/lib/league.ts` — the `nbasummer` entry in the `LEAGUES` registry (`basePath: "/summer"`,
  `dataSub: "summer"`, branding). `LeagueId` widened to include it.
- `web/lib/clubs.ts` — Summer League fields the real NBA franchises, so its colour/abbr maps alias
  the NBA ones.
- `web/components/SiteHeader.tsx` — three-way league detection, the Summer switcher pill, per-league
  branding (`THEME`) and a reduced nav (`NAV_BY_LEAGUE`).
- `web/components/ModelView.tsx` — `league` prop widened; `LEAGUE_TABS` limits Summer League to the
  tabs it has data for.
- `web/components/SummerRatings.tsx` — the power-ratings table on the overview page (reads
  `ratings.json` → `nbasummer`).
- `web/app/summer/` — the two routes; `web/app/sitemap.ts` lists them.
