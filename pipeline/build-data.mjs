/**
 * NBA 82-0 data pipeline (live, real NBA Stats API).
 * ---------------------------------------------------------------------------
 * Pulls real data straight from the public stats.nba.com /stats/ endpoints
 * (the same JSON nba.com reads) and builds the static dataset the site uses.
 * No third-party services — just the official API with the browser header
 * bundle and a polite request rate.
 *
 *   playerindex             real positions for every player
 *   leaguedashplayerstats   real per-game stats, full roster, per season
 *   leaguestandingsv3       real standings (conference + division) per season
 *   leaguegamelog           real game results (recent seasons → schedule)
 *
 * Pre-1996 seasons aren't in leaguedashplayerstats, so a short curated list of
 * legends fills the earlier eras. Real data always wins over curated.
 *
 * Env: FROM_SEASON_END=1997  MAX_SEASONS=40  RATE_MS=2200  FIXTURE_SEASONS=3
 */
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HOST = "https://stats.nba.com/stats";
const RATE_MS = Number(process.env.RATE_MS || 2200);
const FROM_END = Number(process.env.FROM_SEASON_END || 1997); // 1996-97 is the earliest
const FIXTURE_SEASONS = Number(process.env.FIXTURE_SEASONS || 3);

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "web", "public", "data");

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*", "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.nba.com/", Origin: "https://www.nba.com",
  Connection: "keep-alive", "x-nba-stats-origin": "stats", "x-nba-stats-token": "true",
  "Sec-Fetch-Dest": "empty", "Sec-Fetch-Mode": "cors", "Sec-Fetch-Site": "same-site",
  "Cache-Control": "no-cache", Pragma: "no-cache",
};

const TEAM_NAME = {
  ATL: "Atlanta Hawks", BOS: "Boston Celtics", BKN: "Brooklyn Nets", CHA: "Charlotte Hornets",
  CHI: "Chicago Bulls", CLE: "Cleveland Cavaliers", DAL: "Dallas Mavericks", DEN: "Denver Nuggets",
  DET: "Detroit Pistons", GSW: "Golden State Warriors", HOU: "Houston Rockets", IND: "Indiana Pacers",
  LAC: "LA Clippers", LAL: "Los Angeles Lakers", MEM: "Memphis Grizzlies", MIA: "Miami Heat",
  MIL: "Milwaukee Bucks", MIN: "Minnesota Timberwolves", NOP: "New Orleans Pelicans", NYK: "New York Knicks",
  OKC: "Oklahoma City Thunder", ORL: "Orlando Magic", PHI: "Philadelphia 76ers", PHX: "Phoenix Suns",
  POR: "Portland Trail Blazers", SAC: "Sacramento Kings", SAS: "San Antonio Spurs", TOR: "Toronto Raptors",
  UTA: "Utah Jazz", WAS: "Washington Wizards",
  NJN: "New Jersey Nets", SEA: "Seattle SuperSonics", NOH: "New Orleans Hornets", NOK: "New Orleans Hornets",
  VAN: "Vancouver Grizzlies", CHH: "Charlotte Hornets", WSB: "Washington Wizards",
};
const TEAM_META = {
  "Atlanta Hawks": ["East", "Southeast"], "Boston Celtics": ["East", "Atlantic"], "Brooklyn Nets": ["East", "Atlantic"],
  "Charlotte Hornets": ["East", "Southeast"], "Chicago Bulls": ["East", "Central"], "Cleveland Cavaliers": ["East", "Central"],
  "Detroit Pistons": ["East", "Central"], "Indiana Pacers": ["East", "Central"], "Miami Heat": ["East", "Southeast"],
  "Milwaukee Bucks": ["East", "Central"], "New York Knicks": ["East", "Atlantic"], "Orlando Magic": ["East", "Southeast"],
  "Philadelphia 76ers": ["East", "Atlantic"], "Toronto Raptors": ["East", "Atlantic"], "Washington Wizards": ["East", "Southeast"],
  "Dallas Mavericks": ["West", "Southwest"], "Denver Nuggets": ["West", "Northwest"], "Golden State Warriors": ["West", "Pacific"],
  "Houston Rockets": ["West", "Southwest"], "LA Clippers": ["West", "Pacific"], "Los Angeles Lakers": ["West", "Pacific"],
  "Memphis Grizzlies": ["West", "Southwest"], "Minnesota Timberwolves": ["West", "Northwest"], "New Orleans Pelicans": ["West", "Southwest"],
  "Oklahoma City Thunder": ["West", "Northwest"], "Phoenix Suns": ["West", "Pacific"], "Portland Trail Blazers": ["West", "Northwest"],
  "Sacramento Kings": ["West", "Pacific"], "San Antonio Spurs": ["West", "Southwest"], "Utah Jazz": ["West", "Northwest"],
  "Seattle SuperSonics": ["West", "Northwest"], "New Jersey Nets": ["East", "Atlantic"],
};
const POS_CODE_LABEL = { PG: "Point Guard", SG: "Shooting Guard", SF: "Small Forward", PF: "Power Forward", C: "Center" };

/* ---- curated legends for pre-1996 eras (no leaguedashplayerstats) -------- */
const LEGENDS = [
  // [name, club, pos, rating, pts, reb, ast, stl, blk, fy, ly, gp, decade, elig, fgPct, fg3Pct, ftPct, mpg]
  ["Magic Johnson", "Los Angeles Lakers", "PG", 97, 19.5, 7.2, 11.2, 1.9, 0.4, 1979, 1991, 874, "1980s", "PG/SF", 52, 30, 85, 36],
  ["Larry Bird", "Boston Celtics", "SF", 96, 24.3, 10.0, 6.3, 1.7, 0.8, 1979, 1992, 897, "1980s", "SF/PF", 50, 38, 89, 38],
  ["Kareem Abdul-Jabbar", "Los Angeles Lakers", "C", 95, 24.6, 11.2, 3.6, 0.9, 2.6, 1969, 1989, 1560, "1980s", "C", 56, 6, 72, 36],
  ["Julius Erving", "Philadelphia 76ers", "SF", 92, 24.2, 8.5, 4.2, 1.8, 1.5, 1976, 1987, 1243, "1980s", "SF/PF", 50, 26, 78, 36],
  ["Moses Malone", "Philadelphia 76ers", "C", 90, 20.6, 12.2, 1.4, 0.8, 1.3, 1976, 1995, 1329, "1980s", "C", 49, 10, 77, 35],
  ["Isiah Thomas", "Detroit Pistons", "PG", 89, 19.2, 3.6, 9.3, 1.9, 0.3, 1981, 1994, 979, "1980s", "PG", 45, 29, 76, 36],
  ["Wilt Chamberlain", "Los Angeles Lakers", "C", 96, 30.1, 22.9, 4.4, 0, 0, 1959, 1973, 1045, "1970s", "C", 54, 0, 51, 45],
  ["Bill Russell", "Boston Celtics", "C", 95, 15.1, 22.5, 4.3, 0, 0, 1956, 1969, 963, "1960s", "C", 44, 0, 56, 42],
  ["Jerry West", "Los Angeles Lakers", "PG", 94, 27.0, 5.8, 6.7, 0, 0, 1960, 1974, 932, "1970s", "PG/SG", 47, 0, 81, 39],
  ["Oscar Robertson", "Milwaukee Bucks", "PG", 95, 25.7, 7.5, 9.5, 0, 0, 1960, 1974, 1040, "1970s", "PG", 49, 0, 84, 42],
  ["Elgin Baylor", "Los Angeles Lakers", "SF", 91, 27.4, 13.5, 4.3, 0, 0, 1958, 1971, 846, "1970s", "SF", 43, 0, 78, 40],
  ["Rick Barry", "Golden State Warriors", "SF", 90, 23.2, 6.5, 5.1, 2.0, 0.5, 1965, 1980, 794, "1970s", "SF/PF", 45, 0, 90, 38],
  ["John Havlicek", "Boston Celtics", "SF", 90, 20.8, 6.3, 4.8, 0, 0, 1962, 1978, 1270, "1970s", "SF/SG", 44, 0, 82, 36],
  ["Walt Frazier", "New York Knicks", "PG", 89, 18.9, 5.9, 6.1, 1.9, 0.2, 1967, 1980, 825, "1970s", "PG", 49, 0, 79, 38],
  ["Pete Maravich", "New Orleans Pelicans", "PG", 88, 24.2, 4.2, 5.4, 0, 0, 1970, 1980, 658, "1970s", "PG/SG", 44, 0, 82, 38],
  ["Bob Cousy", "Boston Celtics", "PG", 87, 18.4, 5.2, 7.5, 0, 0, 1950, 1963, 924, "1960s", "PG", 38, 0, 80, 36],
  ["Dave Cowens", "Boston Celtics", "C", 86, 17.6, 13.6, 3.8, 1.1, 0.9, 1970, 1983, 766, "1970s", "C/PF", 46, 0, 78, 37],
  ["George Gervin", "San Antonio Spurs", "SG", 88, 25.1, 5.3, 2.6, 1.2, 0.8, 1972, 1986, 791, "1980s", "SG/SF", 51, 21, 84, 33],
  ["Kevin McHale", "Boston Celtics", "PF", 87, 17.9, 7.3, 1.7, 0.4, 1.7, 1980, 1993, 971, "1980s", "PF/C", 55, 26, 80, 31],
  ["James Worthy", "Los Angeles Lakers", "SF", 85, 17.6, 5.1, 3.0, 1.1, 0.7, 1982, 1994, 926, "1980s", "SF", 52, 16, 77, 33],
  ["Dominique Wilkins", "Atlanta Hawks", "SF", 88, 26.4, 6.9, 2.6, 1.4, 0.7, 1982, 1994, 900, "1980s", "SF/PF", 47, 32, 82, 37],
  ["Bernard King", "New York Knicks", "SF", 85, 22.5, 5.8, 3.3, 1.0, 0.3, 1977, 1993, 874, "1980s", "SF", 51, 18, 73, 35],
  ["Robert Parish", "Boston Celtics", "C", 84, 14.5, 9.1, 1.4, 0.8, 1.5, 1976, 1990, 1100, "1980s", "C", 54, 0, 72, 31],
  ["Wes Unseld", "Washington Wizards", "C", 83, 10.8, 14.0, 3.9, 1.1, 0.6, 1968, 1981, 984, "1970s", "C", 51, 0, 63, 36],
  ["Bill Walton", "Portland Trail Blazers", "C", 85, 13.3, 10.5, 3.4, 0.8, 2.2, 1974, 1987, 468, "1970s", "C", 52, 0, 66, 33],
  ["Earl Monroe", "New York Knicks", "PG", 84, 18.8, 3.0, 3.9, 0, 0, 1967, 1980, 926, "1970s", "PG/SG", 46, 0, 81, 33],
  ["Nate Archibald", "Sacramento Kings", "PG", 85, 18.8, 2.3, 7.4, 0, 0, 1970, 1984, 876, "1970s", "PG", 47, 0, 81, 36],
  ["Artis Gilmore", "Chicago Bulls", "C", 84, 17.1, 10.1, 2.0, 0.5, 2.4, 1976, 1988, 909, "1980s", "C", 58, 0, 70, 32],
  ["Adrian Dantley", "Utah Jazz", "SF", 85, 24.3, 5.7, 3.0, 1.0, 0.2, 1976, 1991, 955, "1980s", "SF/PF", 54, 13, 82, 35],
  ["Alex English", "Denver Nuggets", "SF", 85, 21.5, 5.5, 3.6, 0.9, 0.4, 1976, 1991, 1193, "1980s", "SF", 51, 12, 83, 35],
];

/* ---- helpers ------------------------------------------------------------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const seasonStr = (end) => `${end - 1}-${String(end).slice(2)}`;
const decadeOf = (end) => `${Math.floor((end - 1) / 10) * 10}s`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r1 = (x) => +(+x).toFixed(1);

async function statsCall(op, params) {
  const qs = new URLSearchParams(params).toString();
  const url = `${HOST}/${op}?${qs}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const c = new AbortController();
      const id = setTimeout(() => c.abort(), 40000);
      const res = await fetch(url, { headers: HEADERS, signal: c.signal });
      clearTimeout(id);
      if (res.ok) return await res.json();
      if (![429, 500, 502, 503, 504].includes(res.status)) throw new Error(`${res.status} ${op}`);
    } catch (e) { if (attempt === 3) throw e; }
    await sleep(RATE_MS * (attempt + 1));
  }
  throw new Error(`failed ${op}`);
}
function rows(json, name) {
  const sets = json.resultSets || json.resultSet || [];
  const rs = (Array.isArray(sets) ? sets.find((r) => r.name === name) || sets[0] : sets);
  if (!rs) return [];
  const idx = Object.fromEntries(rs.headers.map((h, i) => [h, i]));
  return rs.rowSet.map((row) => new Proxy({}, { get: (_, k) => row[idx[k]] }));
}
function rateFromStats(s) {
  // production index → 58–99 band; centred so only MVP-level seasons reach 97+,
  // rotation starters sit low-80s, and bench players land in the 60s.
  const score = s.pts * 1 + s.reb * 1.2 + s.ast * 1.5 + s.stl * 3 + s.blk * 3 + s.fg3 * 0.4;
  const t = 1 / (1 + Math.exp(-(score - 34) / 7));
  return Math.round(clamp(58 + t * 41, 58, 99));
}
/** real position string ("Guard", "Forward-Center"…) + stats -> code + elig */
function posFromIndex(broad, s) {
  const b = String(broad || "").toLowerCase();
  const guard = b.includes("guard"), fwd = b.includes("forward"), cen = b.includes("center");
  let pos, elig;
  if (cen && !fwd && !guard) { pos = "C"; elig = ["C"]; }
  else if (cen && fwd) { pos = s.reb >= 9 ? "C" : "PF"; elig = ["C", "PF"]; }
  else if (fwd && guard) { pos = s.ast >= 4 ? "SF" : "SF"; elig = ["SF", "SG"]; }
  else if (fwd && !guard && !cen) { pos = s.reb >= 7 ? "PF" : "SF"; elig = ["SF", "PF"]; }
  else if (guard) { pos = s.ast >= 4.5 ? "PG" : "SG"; elig = ["PG", "SG"]; }
  else { // unknown — infer from stats
    if (s.blk >= 1.2 && s.reb >= 8) { pos = "C"; elig = ["C", "PF"]; }
    else if (s.reb >= 7) { pos = "PF"; elig = ["PF", "SF"]; }
    else if (s.ast >= 5) { pos = "PG"; elig = ["PG", "SG"]; }
    else if (s.ast >= 3) { pos = "SG"; elig = ["SG", "SF"]; }
    else { pos = "SF"; elig = ["SF"]; }
  }
  return { pos, elig };
}

async function main() {
  const t0 = Date.now();
  const month = new Date().getUTCMonth() + 1, yr = new Date().getUTCFullYear();
  const latestEnd = month >= 10 ? yr + 1 : yr;
  const ends = [];
  for (let e = latestEnd; e >= FROM_END; e--) ends.push(e);
  const playoffsActive = month >= 4 && month <= 7;

  /* positions */
  console.log("→ playerindex…");
  const posByPid = {};
  try {
    const pi = await statsCall("playerindex", { LeagueID: "00", Season: seasonStr(latestEnd), Historical: "1" });
    for (const r of rows(pi, "PlayerIndex")) posByPid[r.PERSON_ID] = r.POSITION;
    await sleep(RATE_MS);
  } catch (e) { console.log("  ! playerindex:", e.message); }

  /* real player-season cards */
  const yearCards = [];                  // one per (player, season)
  const standingsBySeason = {};
  const resultsBySeason = {};
  const seasonsDone = [];

  for (const end of ends) {
    const season = seasonStr(end);
    let ps;
    try {
      ps = await statsCall("leaguedashplayerstats", {
        College: "", Conference: "", Country: "", DateFrom: "", DateTo: "", Division: "", DraftPick: "", DraftYear: "",
        GameScope: "", GameSegment: "", Height: "", LastNGames: "0", LeagueID: "00", Location: "", MeasureType: "Base",
        Month: "0", OpponentTeamID: "0", Outcome: "", PORound: "0", PaceAdjust: "N", PerMode: "PerGame", Period: "0",
        PlayerExperience: "", PlayerPosition: "", PlusMinus: "N", Rank: "N", Season: season, SeasonSegment: "",
        SeasonType: "Regular Season", ShotClockRange: "", StarterBench: "", TeamID: "0", VsConference: "", VsDivision: "", Weight: "",
      });
    } catch (e) { console.log(`  ! ${season} players: ${e.message}`); await sleep(RATE_MS); continue; }
    await sleep(RATE_MS);

    let n = 0;
    for (const r of rows(ps, "LeagueDashPlayerStats")) {
      const gp = Number(r.GP) || 0;
      if (gp < 8) continue;
      const club = TEAM_NAME[r.TEAM_ABBREVIATION];
      if (!club) continue; // skip multi-team "TOT" rows without a single team
      const s = {
        pts: r1(r.PTS), reb: r1(r.REB), ast: r1(r.AST), stl: r1(r.STL), blk: r1(r.BLK),
        fg3: r1(r.FG3M), fgPct: Math.round((Number(r.FG_PCT) || 0) * 1000) / 10,
        fg3Pct: Math.round((Number(r.FG3_PCT) || 0) * 1000) / 10, ftPct: Math.round((Number(r.FT_PCT) || 0) * 1000) / 10,
        mpg: r1(r.MIN),
      };
      const rating = rateFromStats(s);
      // keep rotation players only — drops deep-bench 5-minute lines that bloat
      // the dataset and clutter the draft.
      if (s.mpg < 12 && rating < 73) continue;
      const { pos, elig } = posFromIndex(posByPid[r.PLAYER_ID], s);
      yearCards.push({
        id: `nba-${r.PLAYER_ID}-${end}`, pid: Number(r.PLAYER_ID), name: r.PLAYER_NAME, club,
        era: season, year: end, decade: decadeOf(end), pos, posName: POS_CODE_LABEL[pos], elig,
        rating, g: gp, ...s,
      });
      n++;
    }

    /* standings */
    try {
      const st = await statsCall("leaguestandingsv3", { LeagueID: "00", Season: season, SeasonType: "Regular Season" });
      const table = [];
      for (const r of rows(st, "Standings")) {
        const club = `${r.TeamCity} ${r.TeamName}`.trim();
        const w = Number(r.WINS) || 0, l = Number(r.LOSSES) || 0;
        const pf = Math.round((Number(r.PointsPG) || 0) * (w + l)), pa = Math.round((Number(r.OppPointsPG) || 0) * (w + l));
        const [conf, div] = TEAM_META[club] || [String(r.Conference || ""), String(r.Division || "")];
        table.push({ club, conf, div, p: w + l, w, l, d: 0, pf, pa, pts: w, pd: pf - pa });
      }
      if (table.length) { table.sort((a, b) => b.w - a.w || b.pd - a.pd); standingsBySeason[season] = table; }
      await sleep(RATE_MS);
    } catch (e) { console.log(`  ! ${season} standings: ${e.message}`); }

    seasonsDone.push(season);
    console.log(`✓ ${season}: ${n} players`);
  }

  /* fixtures for the most recent seasons */
  for (const season of seasonsDone.slice(0, FIXTURE_SEASONS)) {
    try {
      const gl = await statsCall("leaguegamelog", { LeagueID: "00", Season: season, SeasonType: "Regular Season", PlayerOrTeam: "T", Counter: "1000", Sorter: "DATE", Direction: "ASC" });
      const byGame = new Map();
      for (const r of rows(gl, "LeagueGameLog")) {
        const e = byGame.get(r.GAME_ID) || {};
        const home = !String(r.MATCHUP || "").includes("@");
        e[home ? "home" : "away"] = { name: TEAM_NAME[r.TEAM_ABBREVIATION] || r.TEAM_ABBREVIATION, pts: Number(r.PTS) || 0 };
        byGame.set(r.GAME_ID, e);
      }
      const games = []; let gi = 0;
      for (const g of byGame.values()) { if (!g.home || !g.away) continue; games.push({ round: Math.floor(gi / 40) + 1, home: g.home.name, away: g.away.name, hs: g.home.pts, as: g.away.pts }); gi++; }
      if (games.length) resultsBySeason[season] = games;
      await sleep(RATE_MS);
    } catch (e) { console.log(`  ! ${season} fixtures: ${e.message}`); }
  }

  /* ---- merge curated legends (only for names not already in real data) --- */
  const realNames = new Set(yearCards.map((c) => c.name));
  let lpid = 90000;
  for (const L of LEGENDS) {
    const [name, club, pos, rating, pts, reb, ast, stl, blk, fy, ly, gp, decade, eligStr, fgPct, fg3Pct, ftPct, mpg] = L;
    if (!rating || pos === "x" || realNames.has(name)) continue;
    const pid = ++lpid;
    const elig = eligStr ? eligStr.split("/") : [pos];
    const s = { pts, reb, ast, stl, blk, fg3: r1(pts > 18 ? (pos === "C" ? 0.4 : 1.0) : 0.5), fgPct, fg3Pct, ftPct, mpg };
    // a few synthetic seasons across their prime so era + year modes have cards
    const yrs = [];
    const span = Math.max(1, ly - fy);
    for (let i = 0; i <= 4; i++) yrs.push(Math.round(fy + (span * i) / 4));
    for (const y of [...new Set(yrs)]) {
      const t = (y - fy) / span, m = clamp(t <= 0.42 ? 0.88 + 0.12 * (t / 0.42) : 1 - 0.18 * ((t - 0.42) / 0.58), 0.8, 1);
      yearCards.push({
        id: `leg-${pid}-${y}`, pid, name, club, era: seasonStr(y + 1), year: y + 1, decade: decadeOf(y + 1),
        pos, posName: POS_CODE_LABEL[pos], elig, rating: Math.round(clamp(rating * m, 60, 99)), g: 70,
        pts: r1(pts * m), reb: r1(reb * m), ast: r1(ast * m), stl: r1(stl * m), blk: r1(blk * m),
        fg3: s.fg3, fgPct, fg3Pct, ftPct, mpg,
      });
    }
  }

  /* ---- era (decade) cards: one per (player, decade, club) — best season --- */
  const eraMap = new Map();
  for (const c of yearCards) {
    const key = `${c.pid}|${c.decade}|${c.club}`;
    const cur = eraMap.get(key);
    if (!cur || c.rating > cur.rating) eraMap.set(key, c);
  }
  const strip = (c, era, id) => ({
    id, pid: c.pid, name: c.name, club: c.club, era, pos: c.pos, posName: c.posName, elig: c.elig,
    rating: c.rating, g: c.g, pts: c.pts, reb: c.reb, ast: c.ast, stl: c.stl, blk: c.blk,
    fg3: c.fg3, fgPct: c.fgPct, fg3Pct: c.fg3Pct, ftPct: c.ftPct, mpg: c.mpg,
  });
  const pool = [...eraMap.values()].map((c) => strip(c, c.decade, `e-${c.id}`)).sort((a, b) => b.rating - a.rating);

  /* ---- per-year pool (one card per player-season already) --------------- */
  const poolYears = yearCards.map((c) => strip(c, c.era, c.id)).sort((a, b) => b.rating - a.rating);

  /* ---- career players for the mini-games (dedupe by pid) ---------------- */
  const SUM_KEYS = ["pts", "reb", "ast", "stl", "blk", "fg3", "fgPct", "fg3Pct", "ftPct", "mpg"];
  const careers = new Map();
  for (const c of yearCards) {
    let k = careers.get(c.pid);
    if (!k) { k = { id: c.pid, name: c.name, clubCounts: {}, posCounts: {}, years: new Set(), apps: 0, sum: Object.fromEntries(SUM_KEYS.map((x) => [x, 0])), best: 0 }; careers.set(c.pid, k); }
    k.clubCounts[c.club] = (k.clubCounts[c.club] || 0) + c.g;
    k.posCounts[c.pos] = (k.posCounts[c.pos] || 0) + c.g;
    k.years.add(c.year); k.apps += c.g; k.best = Math.max(k.best, c.rating);
    for (const x of SUM_KEYS) k.sum[x] += (c[x] || 0) * c.g;
  }
  const gamePlayers = [];
  for (const k of careers.values()) {
    if (k.apps < 40) continue;
    const club = Object.entries(k.clubCounts).sort((a, b) => b[1] - a[1])[0][0];
    const pos = Object.entries(k.posCounts).sort((a, b) => b[1] - a[1])[0][0];
    const yrs = [...k.years].sort((a, b) => a - b);
    const av = (x, d = 1) => +(k.sum[x] / k.apps).toFixed(d);
    const pts = av("pts");
    gamePlayers.push({
      id: k.id, name: k.name, club, pos, posName: POS_CODE_LABEL[pos] || "Forward",
      firstYear: yrs[0] - 1, lastYear: yrs[yrs.length - 1], apps: k.apps, pts,
      reb: av("reb"), ast: av("ast"), stl: av("stl"), blk: av("blk"), fg3: av("fg3"),
      fgPct: av("fgPct"), fg3Pct: av("fg3Pct"), ftPct: av("ftPct"), mpg: av("mpg"),
      rating: k.best, fame: Math.round(k.best + Math.min(18, k.apps / 90) + pts / 3),
    });
  }
  gamePlayers.sort((a, b) => b.fame - a.fame);

  /* ---- strengths + ladders + playoffs ----------------------------------- */
  const laddersBySeason = {}, strengthsBySeason = {};
  for (const [s, table] of Object.entries(standingsBySeason)) {
    laddersBySeason[s] = table;
    const wp = table.map((t) => (t.p ? t.w / t.p : 0)).sort((a, b) => a - b);
    strengthsBySeason[s] = wp.map((x) => +x.toFixed(3));
  }
  const seasons = seasonsDone.filter((s) => laddersBySeason[s]);
  const latestSeason = seasons[0];

  function buildBracket(season) {
    const table = laddersBySeason[season]; if (!table) return null;
    let rngState = 12345 ^ season.length;
    const rand = () => { rngState = (rngState * 1103515245 + 12345) & 0x7fffffff; return rngState / 0x7fffffff; };
    const seedConf = (conf) => table.filter((t) => t.conf === conf).slice(0, 8).map((t, i) => ({ team: t.club, seed: i + 1, w: t.w, l: t.l }));
    const east = seedConf("East"), west = seedConf("West");
    if (east.length < 8 || west.length < 8) return null;
    const series = (a, b) => { const adv = clamp(0.5 + (b.seed - a.seed) * 0.06, 0.2, 0.8); let aw = 0, bw = 0; while (aw < 4 && bw < 4) (rand() < adv ? aw++ : bw++); const w = aw === 4 ? a : b, l = aw === 4 ? b : a; return { hi: a, lo: b, winner: w.team, loserTeam: l.team, score: `${Math.max(aw, bw)}-${Math.min(aw, bw)}` }; };
    const r1f = (seeds, conf) => [[0, 7], [3, 4], [2, 5], [1, 6]].map(([h, l]) => ({ conf, ...series(seeds[h], seeds[l]) }));
    const next = (sers, conf) => { const w = sers.map((s) => (s.winner === s.hi.team ? s.hi : s.lo)); const o = []; for (let i = 0; i < w.length; i += 2) o.push({ conf, ...series(w[i], w[i + 1]) }); return o; };
    const r1e = r1f(east, "East"), r1w = r1f(west, "West"); const se = next(r1e, "East"), sw = next(r1w, "West"); const ce = next(se, "East"), cw = next(sw, "West");
    const ec = ce[0].winner === ce[0].hi.team ? ce[0].hi : ce[0].lo, wc = cw[0].winner === cw[0].hi.team ? cw[0].hi : cw[0].lo;
    const fin = series(ec, wc);
    return { season, active: playoffsActive, champion: fin.winner, seeds: { East: east, West: west },
      rounds: [{ name: "First Round", series: [...r1e, ...r1w] }, { name: "Conference Semifinals", series: [...se, ...sw] }, { name: "Conference Finals", series: [...ce, ...cw] }, { name: "NBA Finals", series: [{ conf: "Finals", ...fin }] }] };
  }
  const playoffs = buildBracket(latestSeason) || { season: latestSeason, active: false, champion: "", rounds: [], seeds: {} };

  /* ---- write ------------------------------------------------------------ */
  await mkdir(OUT_DIR, { recursive: true });
  const clubsBySeason = {};
  for (const s of seasons) clubsBySeason[s] = (laddersBySeason[s] || []).map((t) => t.club);
  const allClubs = [...new Set(pool.map((p) => p.club))].sort();
  const divisions = {};
  for (const [t, [conf, div]] of Object.entries(TEAM_META)) { (divisions[conf] ||= {}); (divisions[conf][div] ||= []).push(t); }

  const meta = { generatedAt: new Date().toISOString(), seasons, latestSeason, clubs: allClubs, clubsBySeason, teamMeta: Object.fromEntries(Object.entries(TEAM_META).map(([k, v]) => [k, { conf: v[0], div: v[1] }])), divisions, playoffsActive };
  await Promise.all([
    writeFile(join(OUT_DIR, "meta.json"), JSON.stringify(meta)),
    writeFile(join(OUT_DIR, "pool.json"), JSON.stringify(pool)),
    writeFile(join(OUT_DIR, "poolYears.json"), JSON.stringify(poolYears)),
    writeFile(join(OUT_DIR, "games.json"), JSON.stringify({ season: latestSeason, players: gamePlayers, strengthsBySeason })),
    writeFile(join(OUT_DIR, "results.json"), JSON.stringify({ seasons, bySeason: resultsBySeason, laddersBySeason })),
    writeFile(join(OUT_DIR, "strengths.json"), JSON.stringify({ bySeason: strengthsBySeason })),
    writeFile(join(OUT_DIR, "playoffs.json"), JSON.stringify(playoffs)),
  ]);
  console.log(`✓ ${pool.length} era cards, ${poolYears.length} year cards, ${gamePlayers.length} players, ${seasons.length} seasons in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
main().catch((e) => { console.error("✗ pipeline failed:", e); process.exit(1); });
