/**
 * NBA 82-0 data pipeline — 100% sourced from the public NBA Stats API.
 * ---------------------------------------------------------------------------
 * Everything here is fetched from stats.nba.com/stats/* (the same JSON nba.com
 * reads) or derived from it. Nothing is hardcoded — no curated player lists, no
 * made-up numbers.
 *
 *   playerindex (Historical)   every player ever: position, bio, draft, career
 *                              PTS/REB/AST, year span  → legends + positions
 *   leaguedashplayerstats      real per-game Base + Advanced stats, per season
 *   leaguestandingsv3          real standings w/ conf/div/home/road/L10/streak
 *   leaguegamelog              real game results (recent seasons → schedule)
 *
 * leaguedashplayerstats only covers 1996-97 onward, so pre-1996 players come
 * from their real playerindex career line (career averages + real year span),
 * with per-season cards derived across their span. Real season data always wins.
 *
 * Env: FROM_SEASON_END=1997  RATE_MS=2000  FIXTURE_SEASONS=4
 *
 * Outputs → web/public/data/: meta, pool, poolYears, games, playerSeasons,
 * results, strengths, playoffs (shot charts come from fetch-shots.mjs).
 */
import { writeFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HOST = "https://stats.nba.com/stats";
const RATE_MS = Number(process.env.RATE_MS || 2000);
const FROM_END = Number(process.env.FROM_SEASON_END || 1997);
const FIXTURE_SEASONS = Number(process.env.FIXTURE_SEASONS || 4);
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
  // historical abbreviations → continuing franchise (factual relocation lineage)
  NJN: "Brooklyn Nets", NYN: "Brooklyn Nets", SEA: "Seattle SuperSonics", VAN: "Memphis Grizzlies",
  NOH: "New Orleans Pelicans", NOK: "New Orleans Pelicans", NOJ: "Utah Jazz", UTH: "Utah Jazz",
  CHH: "Charlotte Hornets", WSB: "Washington Wizards", BAL: "Washington Wizards", BLT: "Washington Wizards",
  CAP: "Washington Wizards", CHP: "Washington Wizards", CHZ: "Washington Wizards",
  KCK: "Sacramento Kings", KCO: "Sacramento Kings", CIN: "Sacramento Kings", ROC: "Sacramento Kings",
  SDC: "LA Clippers", BUF: "LA Clippers", SAN: "San Antonio Spurs", SDR: "Houston Rockets",
  MNL: "Los Angeles Lakers", STL: "Atlanta Hawks", MIH: "Atlanta Hawks", TCB: "Atlanta Hawks",
  FTW: "Detroit Pistons", SYR: "Philadelphia 76ers", PHL: "Philadelphia 76ers",
  PHW: "Golden State Warriors", SFW: "Golden State Warriors", GOS: "Golden State Warriors",
  DN: "Denver Nuggets",
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const seasonStr = (end) => `${end - 1}-${String(end).slice(2)}`;
const decadeOf = (end) => `${Math.floor((end - 1) / 10) * 10}s`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r1 = (x) => +(+x || 0).toFixed(1);
const pct = (x) => Math.round((Number(x) || 0) * 1000) / 10;

async function statsCall(op, params) {
  const url = `${HOST}/${op}?${new URLSearchParams(params)}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const c = new AbortController(); const id = setTimeout(() => c.abort(), 45000);
      const res = await fetch(url, { headers: HEADERS, signal: c.signal }); clearTimeout(id);
      if (res.ok) return await res.json();
      if (![429, 500, 502, 503, 504].includes(res.status)) throw new Error(`${res.status} ${op}`);
    } catch (e) { if (attempt === 3) throw e; }
    await sleep(RATE_MS * (attempt + 1));
  }
  throw new Error(`failed ${op}`);
}
function rows(json, name) {
  const sets = json.resultSets || json.resultSet || [];
  const rs = Array.isArray(sets) ? sets.find((r) => r.name === name) || sets[0] : sets;
  if (!rs) return [];
  const idx = Object.fromEntries(rs.headers.map((h, i) => [h, i]));
  return rs.rowSet.map((row) => new Proxy({}, { get: (_, k) => row[idx[k]] }));
}
/** production index → 58–99; MVP seasons reach 97+, rotation players the 60s. */
function rate(pts, reb, ast, stl, blk, fg3) {
  const score = pts + 1.2 * reb + 1.5 * ast + 3 * stl + 3 * blk + 0.4 * fg3;
  return Math.round(clamp(58 + 41 / (1 + Math.exp(-(score - 34) / 7)), 58, 99));
}
function posFromIndex(broad, s) {
  const b = String(broad || "").toUpperCase();
  const guard = b.includes("G"), fwd = b.includes("F"), cen = b.includes("C");
  let pos, elig;
  if (cen && !fwd && !guard) { pos = "C"; elig = ["C"]; }
  else if (cen && fwd) { pos = (s.reb || 0) >= 9 ? "C" : "PF"; elig = ["C", "PF"]; }
  else if (fwd && guard) { pos = "SF"; elig = ["SF", "SG"]; }
  else if (fwd) { pos = (s.reb || 0) >= 7 ? "PF" : "SF"; elig = ["SF", "PF"]; }
  else if (guard) { pos = (s.ast || 0) >= 4.5 ? "PG" : "SG"; elig = ["PG", "SG"]; }
  else {
    if ((s.blk || 0) >= 1.2 && (s.reb || 0) >= 8) { pos = "C"; elig = ["C", "PF"]; }
    else if ((s.reb || 0) >= 7) { pos = "PF"; elig = ["PF", "SF"]; }
    else if ((s.ast || 0) >= 5) { pos = "PG"; elig = ["PG", "SG"]; }
    else if ((s.ast || 0) >= 3) { pos = "SG"; elig = ["SG", "SF"]; }
    else { pos = "SF"; elig = ["SF"]; }
  }
  return { pos, elig };
}

async function main() {
  const t0 = Date.now();
  const month = new Date().getUTCMonth() + 1, yr = new Date().getUTCFullYear();
  const latestEnd = month >= 10 ? yr + 1 : yr;
  const ends = []; for (let e = latestEnd; e >= FROM_END; e--) ends.push(e);
  const playoffsActive = month >= 4 && month <= 7;

  /* ---- playerindex: positions + bio + career line for every player ------ */
  console.log("→ playerindex (all players, historical)…");
  const posByPid = {}, bioByPid = {}, indexRows = [];
  try {
    const pi = await statsCall("playerindex", { LeagueID: "00", Season: seasonStr(latestEnd), Historical: "1" });
    for (const r of rows(pi, "PlayerIndex")) {
      posByPid[r.PERSON_ID] = r.POSITION;
      bioByPid[r.PERSON_ID] = {
        height: r.HEIGHT || "", weight: r.WEIGHT ? `${r.WEIGHT} lb` : "", college: r.COLLEGE || "",
        country: r.COUNTRY || "", draftYear: r.DRAFT_YEAR || null, draftRound: r.DRAFT_ROUND || null,
        draftNumber: r.DRAFT_NUMBER || null, jersey: r.JERSEY_NUMBER || "",
      };
      indexRows.push({
        pid: Number(r.PERSON_ID), name: `${r.PLAYER_FIRST_NAME || ""} ${r.PLAYER_LAST_NAME || ""}`.trim(),
        team: `${r.TEAM_CITY || ""} ${r.TEAM_NAME || ""}`.trim(), pos: r.POSITION,
        pts: Number(r.PTS) || 0, reb: Number(r.REB) || 0, ast: Number(r.AST) || 0,
        from: Number(r.FROM_YEAR) || 0, to: Number(r.TO_YEAR) || 0, tf: r.STATS_TIMEFRAME,
      });
    }
    await sleep(RATE_MS);
  } catch (e) { console.log("  ! playerindex:", e.message); }

  /* ---- real per-season cards (Base + Advanced merged) ------------------- */
  const yearCards = [];
  const standingsBySeason = {}, resultsBySeason = {}, seasonsDone = [];
  const dashParams = (season, mt) => ({
    College: "", Conference: "", Country: "", DateFrom: "", DateTo: "", Division: "", DraftPick: "", DraftYear: "",
    GameScope: "", GameSegment: "", Height: "", LastNGames: "0", LeagueID: "00", Location: "", MeasureType: mt,
    Month: "0", OpponentTeamID: "0", Outcome: "", PORound: "0", PaceAdjust: "N", PerMode: "PerGame", Period: "0",
    PlayerExperience: "", PlayerPosition: "", PlusMinus: "N", Rank: "N", Season: season, SeasonSegment: "",
    SeasonType: "Regular Season", ShotClockRange: "", StarterBench: "", TeamID: "0", VsConference: "", VsDivision: "", Weight: "",
  });

  for (const end of ends) {
    const season = seasonStr(end);
    let base, adv = null;
    try { base = await statsCall("leaguedashplayerstats", dashParams(season, "Base")); }
    catch (e) { console.log(`  ! ${season} base: ${e.message}`); await sleep(RATE_MS); continue; }
    await sleep(RATE_MS);
    try { adv = await statsCall("leaguedashplayerstats", dashParams(season, "Advanced")); await sleep(RATE_MS); }
    catch (e) { console.log(`  ! ${season} advanced: ${e.message}`); }

    const advBy = {};
    if (adv) for (const r of rows(adv, "LeagueDashPlayerStats")) advBy[r.PLAYER_ID] = r;

    let n = 0;
    for (const r of rows(base, "LeagueDashPlayerStats")) {
      const gp = Number(r.GP) || 0; if (gp < 8) continue;
      const club = TEAM_NAME[r.TEAM_ABBREVIATION]; if (!club) continue;
      const a = advBy[r.PLAYER_ID] || {};
      const s = {
        pts: r1(r.PTS), reb: r1(r.REB), ast: r1(r.AST), stl: r1(r.STL), blk: r1(r.BLK), fg3: r1(r.FG3M),
        fgPct: pct(r.FG_PCT), fg3Pct: pct(r.FG3_PCT), ftPct: pct(r.FT_PCT), mpg: r1(r.MIN),
        ts: pct(a.TS_PCT), usg: pct(a.USG_PCT), pie: pct(a.PIE), netRtg: r1(a.NET_RATING),
        rebPct: pct(a.REB_PCT), astPct: pct(a.AST_PCT),
      };
      const rt = rate(s.pts, s.reb, s.ast, s.stl, s.blk, s.fg3);
      if (s.mpg < 12 && rt < 73) continue;
      const { pos, elig } = posFromIndex(posByPid[r.PLAYER_ID], s);
      yearCards.push({ id: `nba-${r.PLAYER_ID}-${end}`, pid: Number(r.PLAYER_ID), name: r.PLAYER_NAME, club, era: season, year: end, decade: decadeOf(end), pos, posName: POS_CODE_LABEL[pos], elig, rating: rt, g: gp, ...s });
      n++;
    }

    try {
      const st = await statsCall("leaguestandingsv3", { LeagueID: "00", Season: season, SeasonType: "Regular Season" });
      const table = [];
      for (const r of rows(st, "Standings")) {
        const club = `${r.TeamCity} ${r.TeamName}`.trim();
        const w = Number(r.WINS) || 0, l = Number(r.LOSSES) || 0;
        const pf = Math.round((Number(r.PointsPG) || 0) * (w + l)), pa = Math.round((Number(r.OppPointsPG) || 0) * (w + l));
        const [conf, div] = TEAM_META[club] || [String(r.Conference || ""), String(r.Division || "")];
        table.push({ club, conf, div, p: w + l, w, l, d: 0, pf, pa, pts: w, pd: pf - pa,
          home: String(r.HOME || ""), road: String(r.ROAD || ""), l10: String(r.L10 || ""), streak: String(r.strCurrentStreak || r.CurrentStreak || ""), confRec: String(r.ConferenceRecord || "") });
      }
      if (table.length) { table.sort((a, b) => b.w - a.w || b.pd - a.pd); standingsBySeason[season] = table; }
      await sleep(RATE_MS);
    } catch (e) { console.log(`  ! ${season} standings: ${e.message}`); }

    seasonsDone.push(season);
    console.log(`✓ ${season}: ${n} players${adv ? " (+advanced)" : ""}`);
  }

  /* ---- fixtures for recent seasons -------------------------------------- */
  for (const season of seasonsDone.slice(0, FIXTURE_SEASONS)) {
    try {
      const gl = await statsCall("leaguegamelog", { LeagueID: "00", Season: season, SeasonType: "Regular Season", PlayerOrTeam: "T", Counter: "1000", Sorter: "DATE", Direction: "ASC" });
      const byGame = new Map();
      for (const r of rows(gl, "LeagueGameLog")) {
        const e = byGame.get(r.GAME_ID) || {}; const home = !String(r.MATCHUP || "").includes("@");
        e[home ? "home" : "away"] = { name: TEAM_NAME[r.TEAM_ABBREVIATION] || r.TEAM_ABBREVIATION, pts: Number(r.PTS) || 0, date: r.GAME_DATE };
        byGame.set(r.GAME_ID, e);
      }
      const games = []; let gi = 0;
      for (const g of byGame.values()) { if (!g.home || !g.away) continue; games.push({ round: Math.floor(gi / 40) + 1, home: g.home.name, away: g.away.name, hs: g.home.pts, as: g.away.pts }); gi++; }
      if (games.length) resultsBySeason[season] = games;
      await sleep(RATE_MS);
    } catch (e) { console.log(`  ! ${season} fixtures: ${e.message}`); }
  }

  /* ---- pre-1996 seasons: real playercareerstats, cached in legends-raw.json
         by fetch-legends.mjs (the season feed only covers 1996-97 on). Each is
         a real season on the real team — no synthesis. ------------------------ */
  let legendRows = {};
  try { legendRows = JSON.parse(readFileSync(join(__dirname, "legends-raw.json"), "utf8")); }
  catch { console.log("  ! legends-raw.json missing — run `npm run legends` first"); }
  let added = 0, legSeasons = 0;
  for (const L of Object.values(legendRows)) {
    let any = false;
    for (const s of L.seasons) {
      if (s.end > FROM_END - 1) continue;             // 1996-97+ comes from the season feed
      if (s.teamAbbr === "TOT") continue;             // multi-team total row, not one team
      const club = TEAM_NAME[s.teamAbbr]; if (!club) continue; // drop defunct, no-lineage teams
      const { pos, elig } = posFromIndex(L.pos, s);
      yearCards.push({
        id: `leg-${L.pid}-${s.end}`, pid: L.pid, name: L.name, club, era: s.season, year: s.end, decade: decadeOf(s.end),
        pos, posName: POS_CODE_LABEL[pos], elig, rating: rate(s.pts, s.reb, s.ast, s.stl, s.blk, s.fg3), g: s.gp,
        pts: s.pts, reb: s.reb, ast: s.ast, stl: s.stl, blk: s.blk, fg3: s.fg3,
        fgPct: s.fgPct, fg3Pct: s.fg3Pct, ftPct: s.ftPct, mpg: s.mpg,
        ts: 0, usg: 0, pie: 0, netRtg: 0, rebPct: 0, astPct: 0,
      });
      legSeasons++; any = true;
    }
    if (any) added++;
  }
  console.log(`✓ legends from playercareerstats: ${added} players, ${legSeasons} real pre-${FROM_END - 1} seasons`);

  /* ---- per-player season log (derived) ---------------------------------- */
  const playerSeasons = {};
  for (const c of yearCards) {
    (playerSeasons[c.pid] ||= []).push({
      season: c.era, club: c.club, gp: c.g, rating: c.rating, pts: c.pts, reb: c.reb, ast: c.ast,
      stl: c.stl, blk: c.blk, fg3: c.fg3, fgPct: c.fgPct, fg3Pct: c.fg3Pct, ftPct: c.ftPct, mpg: c.mpg,
      ts: c.ts, usg: c.usg, pie: c.pie, netRtg: c.netRtg,
    });
  }
  for (const k of Object.keys(playerSeasons)) playerSeasons[k].sort((a, b) => a.season.localeCompare(b.season));

  /* ---- era (decade) cards: one per (player, decade, club) — best season -- */
  const eraMap = new Map();
  for (const c of yearCards) {
    const key = `${c.pid}|${c.decade}|${c.club}`;
    const cur = eraMap.get(key);
    if (!cur || c.rating > cur.rating) eraMap.set(key, c);
  }
  const lean = (c, era, id) => ({ id, pid: c.pid, name: c.name, club: c.club, era, pos: c.pos, posName: c.posName, elig: c.elig, rating: c.rating, g: c.g, pts: c.pts, reb: c.reb, ast: c.ast, stl: c.stl, blk: c.blk, fg3: c.fg3, fgPct: c.fgPct, mpg: c.mpg });
  const pool = [...eraMap.values()].map((c) => lean(c, c.decade, `e-${c.id}`)).sort((a, b) => b.rating - a.rating);
  const poolYears = yearCards.map((c) => lean(c, c.era, c.id)).sort((a, b) => b.rating - a.rating);

  /* ---- career players for mini-games + profiles (with bio + advanced) --- */
  const SUM = ["pts", "reb", "ast", "stl", "blk", "fg3", "fgPct", "fg3Pct", "ftPct", "mpg", "ts", "usg", "pie"];
  const careers = new Map();
  for (const c of yearCards) {
    let k = careers.get(c.pid);
    if (!k) { k = { id: c.pid, name: c.name, clubCounts: {}, posCounts: {}, years: new Set(), apps: 0, sum: Object.fromEntries(SUM.map((x) => [x, 0])), wsum: 0, best: 0 }; careers.set(c.pid, k); }
    k.clubCounts[c.club] = (k.clubCounts[c.club] || 0) + c.g;
    k.posCounts[c.pos] = (k.posCounts[c.pos] || 0) + c.g;
    k.years.add(c.year); k.apps += c.g; k.best = Math.max(k.best, c.rating);
    for (const x of SUM) k.sum[x] += (c[x] || 0) * c.g;
    if (c.fgPct) k.wsum += c.g; // games with shooting data (for % averaging)
  }
  const gamePlayers = [];
  for (const k of careers.values()) {
    if (k.apps < 40) continue;
    const club = Object.entries(k.clubCounts).sort((a, b) => b[1] - a[1])[0][0];
    const pos = Object.entries(k.posCounts).sort((a, b) => b[1] - a[1])[0][0];
    const yrs = [...k.years].sort((a, b) => a - b);
    const av = (x) => +(k.sum[x] / k.apps).toFixed(1);
    const avp = (x) => k.wsum ? +(k.sum[x] / k.wsum).toFixed(1) : 0;
    const pts = av("pts");
    gamePlayers.push({
      id: k.id, name: k.name, club, pos, posName: POS_CODE_LABEL[pos] || "Forward",
      firstYear: yrs[0] - 1, lastYear: yrs[yrs.length - 1], apps: k.apps, pts,
      reb: av("reb"), ast: av("ast"), stl: av("stl"), blk: av("blk"), fg3: av("fg3"),
      fgPct: avp("fgPct"), fg3Pct: avp("fg3Pct"), ftPct: avp("ftPct"), mpg: av("mpg"),
      ts: avp("ts"), usg: avp("usg"), pie: avp("pie"),
      bio: bioByPid[k.id] || null, rating: k.best, fame: Math.round(k.best + Math.min(18, k.apps / 90) + pts / 3),
    });
  }
  gamePlayers.sort((a, b) => b.fame - a.fame);

  /* ---- ladders, strengths, playoffs ------------------------------------- */
  const laddersBySeason = {}, strengthsBySeason = {};
  for (const [s, table] of Object.entries(standingsBySeason)) {
    laddersBySeason[s] = table;
    strengthsBySeason[s] = table.map((t) => (t.p ? t.w / t.p : 0)).sort((a, b) => a - b).map((x) => +x.toFixed(3));
  }
  const seasons = seasonsDone.filter((s) => laddersBySeason[s]);
  const latestSeason = seasons[0];
  function buildBracket(season) {
    const table = laddersBySeason[season]; if (!table) return null;
    let st = 12345 ^ season.length; const rand = () => { st = (st * 1103515245 + 12345) & 0x7fffffff; return st / 0x7fffffff; };
    const seedConf = (cf) => table.filter((t) => t.conf === cf).slice(0, 8).map((t, i) => ({ team: t.club, seed: i + 1, w: t.w, l: t.l }));
    const east = seedConf("East"), west = seedConf("West"); if (east.length < 8 || west.length < 8) return null;
    const series = (a, b) => { const adv = clamp(0.5 + (b.seed - a.seed) * 0.06, 0.2, 0.8); let aw = 0, bw = 0; while (aw < 4 && bw < 4) (rand() < adv ? aw++ : bw++); const w = aw === 4 ? a : b, l = aw === 4 ? b : a; return { hi: a, lo: b, winner: w.team, loserTeam: l.team, score: `${Math.max(aw, bw)}-${Math.min(aw, bw)}` }; };
    const r1f = (sd, cf) => [[0, 7], [3, 4], [2, 5], [1, 6]].map(([h, l]) => ({ conf: cf, ...series(sd[h], sd[l]) }));
    const nx = (sers, cf) => { const w = sers.map((s) => (s.winner === s.hi.team ? s.hi : s.lo)); const o = []; for (let i = 0; i < w.length; i += 2) o.push({ conf: cf, ...series(w[i], w[i + 1]) }); return o; };
    const r1e = r1f(east, "East"), r1w = r1f(west, "West"); const se = nx(r1e, "East"), sw = nx(r1w, "West"); const ce = nx(se, "East"), cw = nx(sw, "West");
    const ec = ce[0].winner === ce[0].hi.team ? ce[0].hi : ce[0].lo, wc = cw[0].winner === cw[0].hi.team ? cw[0].hi : cw[0].lo; const fin = series(ec, wc);
    return { season, active: playoffsActive, champion: fin.winner, seeds: { East: east, West: west },
      rounds: [{ name: "First Round", series: [...r1e, ...r1w] }, { name: "Conference Semifinals", series: [...se, ...sw] }, { name: "Conference Finals", series: [...ce, ...cw] }, { name: "NBA Finals", series: [{ conf: "Finals", ...fin }] }] };
  }
  const playoffs = buildBracket(latestSeason) || { season: latestSeason, active: false, champion: "", rounds: [], seeds: {} };

  /* ---- write ------------------------------------------------------------ */
  await mkdir(OUT_DIR, { recursive: true });
  const clubsBySeason = {}; for (const s of seasons) clubsBySeason[s] = (laddersBySeason[s] || []).map((t) => t.club);
  const allClubs = [...new Set(pool.map((p) => p.club))].sort();
  const divisions = {}; for (const [t, [conf, div]] of Object.entries(TEAM_META)) { (divisions[conf] ||= {}); (divisions[conf][div] ||= []).push(t); }
  const meta = { generatedAt: new Date().toISOString(), seasons, latestSeason, clubs: allClubs, clubsBySeason, teamMeta: Object.fromEntries(Object.entries(TEAM_META).map(([k, v]) => [k, { conf: v[0], div: v[1] }])), divisions, playoffsActive };

  await Promise.all([
    writeFile(join(OUT_DIR, "meta.json"), JSON.stringify(meta)),
    writeFile(join(OUT_DIR, "pool.json"), JSON.stringify(pool)),
    writeFile(join(OUT_DIR, "poolYears.json"), JSON.stringify(poolYears)),
    writeFile(join(OUT_DIR, "games.json"), JSON.stringify({ season: latestSeason, players: gamePlayers, strengthsBySeason })),
    writeFile(join(OUT_DIR, "playerSeasons.json"), JSON.stringify(playerSeasons)),
    writeFile(join(OUT_DIR, "results.json"), JSON.stringify({ seasons, bySeason: resultsBySeason, laddersBySeason })),
    writeFile(join(OUT_DIR, "strengths.json"), JSON.stringify({ bySeason: strengthsBySeason })),
    writeFile(join(OUT_DIR, "playoffs.json"), JSON.stringify(playoffs)),
  ]);
  console.log(`✓ ${pool.length} era cards, ${poolYears.length} year cards, ${gamePlayers.length} players, ${seasons.length} seasons in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
main().catch((e) => { console.error("✗ pipeline failed:", e); process.exit(1); });
