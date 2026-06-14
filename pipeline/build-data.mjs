/**
 * NBA 82-0 data pipeline (live).
 * ---------------------------------------------------------------------------
 * Pulls real box-score data from the public NBA Stats API (stats.nba.com) and
 * aggregates it into the static dataset the web app reads at build time. The
 * same five JSON files the seed generator (seed-data.mjs) emits, but from live
 * data: meta, pool, games, results, strengths.
 *
 * stats.nba.com is fronted by Akamai, which requires the full browser header
 * bundle and rate-limits hard (~1 req / 2.5s). Datacenter IPs (incl. some CI
 * runners) are frequently black-holed — if every request times out, fall back
 * to the committed seed dataset by running `npm run seed` instead.
 *
 * Endpoints used:
 *   leaguedashplayerstats  per-player per-game season stats  -> pool / games
 *   leaguestandingsv3      standings per season              -> ladder
 *   leaguegamelog (T)      every team game line               -> fixtures
 *
 * Env knobs:
 *   MAX_SEASONS=8   number of seasons (newest first)
 *   RATE_MS=2600    delay between stats.nba.com requests
 */
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HOST = "https://stats.nba.com/stats";
const MAX_SEASONS = Number(process.env.MAX_SEASONS || 8);
const RATE_MS = Number(process.env.RATE_MS || 2600);

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "web", "public", "data");

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.nba.com/",
  Origin: "https://www.nba.com",
  Connection: "keep-alive",
  "x-nba-stats-origin": "stats",
  "x-nba-stats-token": "true",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-site",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

/* abbreviation -> full franchise name (matches web/lib/clubs.ts colour keys) */
const TEAM_NAME = {
  ATL: "Atlanta Hawks", BOS: "Boston Celtics", BKN: "Brooklyn Nets", CHA: "Charlotte Hornets",
  CHI: "Chicago Bulls", CLE: "Cleveland Cavaliers", DAL: "Dallas Mavericks", DEN: "Denver Nuggets",
  DET: "Detroit Pistons", GSW: "Golden State Warriors", HOU: "Houston Rockets", IND: "Indiana Pacers",
  LAC: "LA Clippers", LAL: "Los Angeles Lakers", MEM: "Memphis Grizzlies", MIA: "Miami Heat",
  MIL: "Milwaukee Bucks", MIN: "Minnesota Timberwolves", NOP: "New Orleans Pelicans", NYK: "New York Knicks",
  OKC: "Oklahoma City Thunder", ORL: "Orlando Magic", PHI: "Philadelphia 76ers", PHX: "Phoenix Suns",
  POR: "Portland Trail Blazers", SAC: "Sacramento Kings", SAS: "San Antonio Spurs", TOR: "Toronto Raptors",
  UTA: "Utah Jazz", WAS: "Washington Wizards", NJN: "New Jersey Nets", SEA: "Seattle SuperSonics",
  NOH: "New Orleans Hornets", VAN: "Vancouver Grizzlies",
};
const POS_CODE_LABEL = {
  PG: "Point Guard", SG: "Shooting Guard", SF: "Small Forward", PF: "Power Forward", C: "Center",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function statsCall(op, params) {
  const qs = new URLSearchParams(params).toString();
  const url = `${HOST}/${op}?${qs}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (res.ok) return await res.json();
      if (![429, 500, 502, 503, 504].includes(res.status)) throw new Error(`${res.status} ${op}`);
    } catch (e) {
      if (attempt === 3) throw e;
    }
    await sleep(RATE_MS * (attempt + 1));
  }
  throw new Error(`failed ${op}`);
}

/** Zip a classic resultSets[i] into array-of-objects. */
function rows(json, name) {
  const rs = (json.resultSets || json.resultSet || []).find?.((r) => r.name === name)
    || (json.resultSets || [])[0];
  if (!rs) return [];
  const idx = Object.fromEntries(rs.headers.map((h, i) => [h, i]));
  return rs.rowSet.map((row) => new Proxy({}, { get: (_, k) => row[idx[k]] }));
}

function seasonStr(endYear) {
  const a = endYear - 1;
  return `${a}-${String(endYear).slice(2)}`;
}

/* per-game stat line -> 60–99 rating via a game-score-like index + logistic */
function rateFromStats(s) {
  const score = s.pts * 1 + s.reb * 1.2 + s.ast * 1.5 + s.stl * 3 + s.blk * 3 + s.fg3 * 0.5;
  const t = 1 / (1 + Math.exp(-(score - 24) / 9));
  return Math.round(Math.min(99, Math.max(60, 60 + t * 39)));
}

/* heuristic 5-position code from the API's broad position + stat profile */
function posCode(broad, s) {
  const b = String(broad || "").toUpperCase();
  if (b.startsWith("C")) return "C";
  if (b.startsWith("F")) return s.reb >= 7.5 ? "PF" : "SF";
  if (b.startsWith("G")) return s.ast >= 4.5 ? "PG" : "SG";
  // fall back from stat shape
  if (s.blk >= 1.2 && s.reb >= 8) return "C";
  if (s.reb >= 7) return "PF";
  if (s.ast >= 4.5) return "PG";
  return "SG";
}

async function main() {
  const t0 = Date.now();
  const thisYear = new Date().getUTCFullYear();
  const month = new Date().getUTCMonth() + 1;
  // a season ending in year Y runs Oct (Y-1) -> Jun Y; pick the latest finished.
  const latestEnd = month >= 10 ? thisYear + 1 : thisYear;
  const endYears = Array.from({ length: MAX_SEASONS }, (_, i) => latestEnd - i);

  /* lightweight position lookup (broad G/F/C) from playerindex (current) */
  console.log("→ playerindex…");
  let posByPid = {};
  try {
    const pi = await statsCall("playerindex", {
      LeagueID: "00", Season: seasonStr(latestEnd), Historical: "1",
    });
    for (const r of rows(pi, "PlayerIndex")) posByPid[r.PERSON_ID] = r.POSITION;
    await sleep(RATE_MS);
  } catch (e) { console.log(`  ! playerindex skipped: ${e.message}`); }

  const agg = new Map();           // pid-season -> card
  const resultsBySeason = {};
  const laddersBySeason = {};
  const strengthsBySeason = {};
  const seasonsOut = [];

  for (const end of endYears) {
    const season = seasonStr(end);
    let pstats;
    try {
      pstats = await statsCall("leaguedashplayerstats", {
        LeagueID: "00", Season: season, SeasonType: "Regular Season", PerMode: "PerGame",
        MeasureType: "Base", PaceAdjust: "N", PlusMinus: "N", Rank: "N", Outcome: "",
        Location: "", Month: "0", SeasonSegment: "", DateFrom: "", DateTo: "", OpponentTeamID: "0",
        VsConference: "", VsDivision: "", GameSegment: "", Period: "0", LastNGames: "0",
        TeamID: "0", Conference: "", Division: "", GameScope: "", PlayerExperience: "",
        PlayerPosition: "", StarterBench: "", DraftYear: "", DraftPick: "", College: "", Country: "", Height: "", Weight: "",
      });
    } catch (e) { console.log(`  ! ${season} player stats skipped: ${e.message}`); continue; }
    await sleep(RATE_MS);

    for (const r of rows(pstats, "LeagueDashPlayerStats")) {
      const gp = Number(r.GP) || 0;
      if (gp < 10) continue;
      const s = {
        pts: +Number(r.PTS || 0).toFixed(1), reb: +Number(r.REB || 0).toFixed(1),
        ast: +Number(r.AST || 0).toFixed(1), stl: +Number(r.STL || 0).toFixed(1),
        blk: +Number(r.BLK || 0).toFixed(1), fg3: +Number(r.FG3M || 0).toFixed(1),
      };
      const code = posCode(posByPid[r.PLAYER_ID], s);
      const club = TEAM_NAME[r.TEAM_ABBREVIATION] || r.TEAM_ABBREVIATION || "NBA";
      const key = `${r.PLAYER_ID}-${season}`;
      agg.set(key, {
        id: `nba-${key}`, pid: Number(r.PLAYER_ID), name: r.PLAYER_NAME, club, era: season,
        pos: code, posName: POS_CODE_LABEL[code], elig: [code], rating: rateFromStats(s),
        g: gp, ...s,
      });
    }

    /* standings */
    try {
      const st = await statsCall("leaguestandingsv3", { LeagueID: "00", Season: season, SeasonType: "Regular Season" });
      const table = [];
      for (const r of rows(st, "Standings")) {
        const club = `${r.TeamCity} ${r.TeamName}`.trim();
        const w = Number(r.WINS) || 0, l = Number(r.LOSSES) || 0;
        const pf = Math.round((Number(r.PointsPG) || 0) * (w + l));
        const pa = Math.round((Number(r.OppPointsPG) || 0) * (w + l));
        table.push({ club, p: w + l, w, l, d: 0, pf, pa, pts: w, pd: pf - pa });
      }
      if (table.length) {
        table.sort((a, b) => b.w - a.w || b.pd - a.pd);
        laddersBySeason[season] = table;
        const winPct = table.map((t) => (t.p ? t.w / t.p : 0)).sort((a, b) => a - b);
        strengthsBySeason[season] = winPct.map((x) => +x.toFixed(3));
      }
      await sleep(RATE_MS);
    } catch (e) { console.log(`  ! ${season} standings skipped: ${e.message}`); }

    /* fixtures via team game log */
    try {
      const gl = await statsCall("leaguegamelog", {
        LeagueID: "00", Season: season, SeasonType: "Regular Season", PlayerOrTeam: "T",
        Counter: "1000", Sorter: "DATE", Direction: "ASC",
      });
      const byGame = new Map();
      for (const r of rows(gl, "LeagueGameLog")) {
        const gid = r.GAME_ID;
        const home = !String(r.MATCHUP || "").includes("@");
        const e = byGame.get(gid) || {};
        e[home ? "home" : "away"] = { name: TEAM_NAME[r.TEAM_ABBREVIATION] || r.TEAM_ABBREVIATION, pts: Number(r.PTS) || 0, date: r.GAME_DATE };
        byGame.set(gid, e);
      }
      const games = [];
      let gi = 0;
      for (const g of byGame.values()) {
        if (!g.home || !g.away) continue;
        games.push({ round: Math.floor(gi / 30) + 1, home: g.home.name, away: g.away.name, hs: g.home.pts, as: g.away.pts });
        gi++;
      }
      if (games.length) resultsBySeason[season] = games;
      await sleep(RATE_MS);
    } catch (e) { console.log(`  ! ${season} fixtures skipped: ${e.message}`); }

    if (laddersBySeason[season] || resultsBySeason[season]) seasonsOut.push(season);
    console.log(`✓ ${season}`);
  }

  if (!agg.size) throw new Error("no data fetched — IP likely blocked; commit the seed dataset instead");

  /* pool */
  const pool = [...agg.values()].sort((a, b) => b.rating - a.rating);

  /* careers / mini-game players (career agg by pid) */
  const careers = new Map();
  for (const p of pool) {
    let c = careers.get(p.pid);
    if (!c) { c = { id: p.pid, name: p.name, clubCounts: {}, posCounts: {}, seasons: new Set(), apps: 0, sum: { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 }, best: 0 }; careers.set(p.pid, c); }
    c.clubCounts[p.club] = (c.clubCounts[p.club] || 0) + p.g;
    c.posCounts[p.pos] = (c.posCounts[p.pos] || 0) + p.g;
    c.seasons.add(Number(p.era.slice(0, 4)) + 1);
    c.apps += p.g;
    for (const k of ["pts", "reb", "ast", "stl", "blk"]) c.sum[k] += p[k] * p.g;
    c.best = Math.max(c.best, p.rating);
  }
  const gamePlayers = [];
  for (const c of careers.values()) {
    if (c.apps < 20) continue;
    const club = Object.entries(c.clubCounts).sort((a, b) => b[1] - a[1])[0][0];
    const pos = Object.entries(c.posCounts).sort((a, b) => b[1] - a[1])[0][0];
    const yrs = [...c.seasons].sort((a, b) => a - b);
    const pts = +(c.sum.pts / c.apps).toFixed(1);
    gamePlayers.push({
      id: c.id, name: c.name, club, pos, posName: POS_CODE_LABEL[pos] || "Forward",
      firstYear: yrs[0], lastYear: yrs[yrs.length - 1], apps: c.apps,
      pts, reb: +(c.sum.reb / c.apps).toFixed(1), ast: +(c.sum.ast / c.apps).toFixed(1),
      stl: +(c.sum.stl / c.apps).toFixed(1), blk: +(c.sum.blk / c.apps).toFixed(1),
      rating: c.best, fame: Math.round(c.best + Math.min(18, c.apps / 90) + pts / 3),
    });
  }
  gamePlayers.sort((a, b) => b.fame - a.fame);

  await mkdir(OUT_DIR, { recursive: true });
  const seasons = seasonsOut.length ? seasonsOut : endYears.map(seasonStr);
  const latestSeason = seasons[0];
  const clubsBySeason = {};
  for (const s of seasons) clubsBySeason[s] = (laddersBySeason[s] || []).map((t) => t.club);
  const allClubs = [...new Set(pool.map((p) => p.club))].sort();

  const meta = { generatedAt: new Date().toISOString(), seasons, latestSeason, clubs: allClubs, clubsBySeason };
  const games = { season: latestSeason, players: gamePlayers, strengthsBySeason };
  const results = { seasons, bySeason: resultsBySeason, laddersBySeason };
  const strengths = { bySeason: strengthsBySeason };

  await Promise.all([
    writeFile(join(OUT_DIR, "meta.json"), JSON.stringify(meta)),
    writeFile(join(OUT_DIR, "pool.json"), JSON.stringify(pool)),
    writeFile(join(OUT_DIR, "games.json"), JSON.stringify(games)),
    writeFile(join(OUT_DIR, "results.json"), JSON.stringify(results)),
    writeFile(join(OUT_DIR, "strengths.json"), JSON.stringify(strengths)),
  ]);
  console.log(`✓ wrote ${pool.length} cards, ${gamePlayers.length} players, ${seasons.length} seasons in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch((e) => { console.error("✗ pipeline failed:", e); process.exit(1); });
