/**
 * Basketball "X-0" data pipeline — 100% sourced from the public Stats API.
 * ---------------------------------------------------------------------------
 * One pipeline, two leagues. Pick with `LEAGUE=nba` (default) or `LEAGUE=wnba`.
 * Everything is fetched from the league's stats.*.com/stats/* feed (the same
 * JSON nba.com / wnba.com read) or derived from it. Nothing is hardcoded — no
 * curated player lists, no made-up numbers.
 *
 *   playerindex (Historical)   every player ever: position, bio, draft, career
 *                              PTS/REB/AST, year span  → legends + positions
 *   leaguedashplayerstats      real per-game Base + Advanced stats, per season
 *   leaguestandingsv3          real standings w/ conf/div/home/road/L10/streak
 *   leaguegamelog              real game results (recent seasons → schedule)
 *
 * NBA: leaguedashplayerstats only covers 1996-97 onward, so pre-1996 players
 * come from their real playerindex career line (cached in legends-raw.json).
 * The WNBA's first season is 1997, so the season feed already spans its whole
 * history and no legends pass is needed.
 *
 * Season strings differ: NBA spans two calendar years ("2023-24"); the WNBA
 * season fits one ("2024"). The whole pipeline keys off a numeric season "end"
 * year and the per-league `seasonStr()` renders it.
 *
 * Env: LEAGUE=nba|wnba  FROM_SEASON_END=<first season>  RATE_MS=2000  FIXTURE_SEASONS=4
 *
 * Outputs → web/public/data/<league-sub>/: meta, pool, poolYears, games,
 * playerSeasons, results, strengths (shot charts come from fetch-shots.mjs).
 */
import { writeFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const LEAGUE = (process.env.LEAGUE || "nba").toLowerCase();

// ---- WNBA franchise maps ---------------------------------------------------
// Stats tricode → continuing franchise (factual relocation lineage). The WNBA
// has only two conferences and no divisions, so we set the "division" equal to
// the conference. Defunct franchises with no continuing club are kept as
// themselves (the WNBA's history is short and the Comets/Monarchs etc. matter),
// unlike the NBA build which drops no-lineage teams.
// NOTE: tricodes below are the WNBA's official 3-letter codes; if a team is
// silently missing after a run, verify its TEAM_ABBREVIATION in the live
// standings response and add it here.
const WNBA_TEAM_NAME = {
  ATL: "Atlanta Dream", CHI: "Chicago Sky", CON: "Connecticut Sun", DAL: "Dallas Wings",
  GSV: "Golden State Valkyries", IND: "Indiana Fever", LVA: "Las Vegas Aces", LAS: "Los Angeles Sparks",
  MIN: "Minnesota Lynx", NYL: "New York Liberty", PHO: "Phoenix Mercury", SEA: "Seattle Storm",
  WAS: "Washington Mystics",
  // 2026 expansion
  TOR: "Toronto Tempo", PDX: "Portland Fire",
  // common tricode variants
  CONN: "Connecticut Sun", NY: "New York Liberty", LA: "Los Angeles Sparks", LV: "Las Vegas Aces",
  PHX: "Phoenix Mercury", GS: "Golden State Valkyries", GSW: "Golden State Valkyries",
  // relocation lineage → continuing franchise
  UTA: "Las Vegas Aces", UTS: "Las Vegas Aces", SAS: "Las Vegas Aces", SAN: "Las Vegas Aces", SA: "Las Vegas Aces",
  DET: "Dallas Wings", TUL: "Dallas Wings",
  ORL: "Connecticut Sun",
  // defunct, kept as themselves (no continuing franchise)
  HOU: "Houston Comets", CLE: "Cleveland Rockers", CHA: "Charlotte Sting",
  MIA: "Miami Sol", POR: "Portland Fire", SAC: "Sacramento Monarchs",
};
const WNBA_TEAM_META = {
  "Atlanta Dream": ["East", "East"], "Chicago Sky": ["East", "East"], "Connecticut Sun": ["East", "East"],
  "Indiana Fever": ["East", "East"], "New York Liberty": ["East", "East"], "Washington Mystics": ["East", "East"],
  "Toronto Tempo": ["East", "East"], // 2026 expansion (Portland Fire below)
  "Dallas Wings": ["West", "West"], "Golden State Valkyries": ["West", "West"], "Las Vegas Aces": ["West", "West"],
  "Los Angeles Sparks": ["West", "West"], "Minnesota Lynx": ["West", "West"], "Phoenix Mercury": ["West", "West"],
  "Seattle Storm": ["West", "West"],
  // defunct
  "Houston Comets": ["West", "West"], "Cleveland Rockers": ["East", "East"], "Charlotte Sting": ["East", "East"],
  "Miami Sol": ["East", "East"], "Portland Fire": ["West", "West"], "Sacramento Monarchs": ["West", "West"],
};

const NBA_TEAM_NAME = {
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
const NBA_TEAM_META = {
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

// ---- per-league configuration ----------------------------------------------
const LEAGUES = {
  nba: {
    host: "https://stats.nba.com/stats", site: "https://www.nba.com", leagueId: "00",
    fromEnd: 1997, useLegends: true, gamesPerRound: 40, outSub: "", dropUnmapped: true,
    seasonStr: (end) => `${end - 1}-${String(end).slice(2)}`,
    latestEnd: (m, y) => (m >= 10 ? y + 1 : y),          // NBA season tips off in October
    playoffsActive: (m) => m >= 4 && m <= 7,
    teamName: NBA_TEAM_NAME, teamMeta: NBA_TEAM_META,
  },
  wnba: {
    host: "https://stats.wnba.com/stats", site: "https://www.wnba.com", leagueId: "10",
    fromEnd: 1997, useLegends: false, gamesPerRound: 6, outSub: "wnba", dropUnmapped: false,
    seasonStr: (end) => String(end),                      // WNBA season = one calendar year
    latestEnd: (m, y) => (m >= 5 ? y : y - 1),           // WNBA season runs ~May–Oct
    playoffsActive: (m) => m >= 9 && m <= 10,
    teamName: WNBA_TEAM_NAME, teamMeta: WNBA_TEAM_META,
  },
};
const cfg = LEAGUES[LEAGUE];
if (!cfg) throw new Error(`unknown LEAGUE "${LEAGUE}" — use nba or wnba`);

const HOST = cfg.host;
const RATE_MS = Number(process.env.RATE_MS || 2000);
const FROM_END = Number(process.env.FROM_SEASON_END || cfg.fromEnd);
const FIXTURE_SEASONS = Number(process.env.FIXTURE_SEASONS || 4);
// Seasons that get full per-game player box scores (lineups) → static match
// pages. Bounded because each season = ~1,225 pre-rendered pages (NBA).
const LINEUP_SEASONS = Number(process.env.LINEUP_SEASONS || 2);
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "web", "public", "data", cfg.outSub);

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*", "Accept-Language": "en-US,en;q=0.9",
  Referer: `${cfg.site}/`, Origin: cfg.site,
  Connection: "keep-alive", "x-nba-stats-origin": "stats", "x-nba-stats-token": "true",
  "Sec-Fetch-Dest": "empty", "Sec-Fetch-Mode": "cors", "Sec-Fetch-Site": "same-site",
  "Cache-Control": "no-cache", Pragma: "no-cache",
};
const TEAM_NAME = cfg.teamName;
const TEAM_META = cfg.teamMeta;
const LEAGUE_ID = cfg.leagueId;
const POS_CODE_LABEL = { PG: "Point Guard", SG: "Shooting Guard", SF: "Small Forward", PF: "Power Forward", C: "Center" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const seasonStr = cfg.seasonStr;
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
  const latestEnd = cfg.latestEnd(month, yr);
  const ends = []; for (let e = latestEnd; e >= FROM_END; e--) ends.push(e);
  const playoffsActive = cfg.playoffsActive(month);

  /* ---- playerindex: positions + bio + career line for every player ------ */
  console.log("→ playerindex (all players, historical)…");
  const posByPid = {}, bioByPid = {}, indexRows = [];
  try {
    const pi = await statsCall("playerindex", { LeagueID: LEAGUE_ID, Season: seasonStr(latestEnd), Historical: "1" });
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
  const gameBox = {}; const lineupSeasons = [];
  const unmappedAbbr = new Set(); // tricodes seen in the feed but absent from TEAM_NAME
  const dashParams = (season, mt) => ({
    College: "", Conference: "", Country: "", DateFrom: "", DateTo: "", Division: "", DraftPick: "", DraftYear: "",
    GameScope: "", GameSegment: "", Height: "", LastNGames: "0", LeagueID: LEAGUE_ID, Location: "", MeasureType: mt,
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
      // Map tricode → franchise. For the NBA we deliberately drop unmapped
      // (defunct, no-lineage) teams; for the WNBA we keep them under the raw
      // tricode and warn, so a missing/changed tricode never silently loses a
      // whole team's players — the warning tells you exactly what to add.
      let club = TEAM_NAME[r.TEAM_ABBREVIATION];
      if (!club) {
        if (cfg.dropUnmapped) continue;
        club = r.TEAM_ABBREVIATION;
        unmappedAbbr.add(r.TEAM_ABBREVIATION);
      }
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
      yearCards.push({ id: `${LEAGUE}-${r.PLAYER_ID}-${end}`, pid: Number(r.PLAYER_ID), name: r.PLAYER_NAME, club, era: season, year: end, decade: decadeOf(end), pos, posName: POS_CODE_LABEL[pos], elig, rating: rt, g: gp, ...s });
      n++;
    }

    try {
      const st = await statsCall("leaguestandingsv3", { LeagueID: LEAGUE_ID, Season: season, SeasonType: "Regular Season" });
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

  /* ---- fixtures for recent seasons (with full per-team box scores) ------- */
  const num = (x) => Number(x) || 0;
  const mins = (m) => { const v = String(m ?? "").split(":")[0]; return Number(v) || 0; }; // "34:12" or 34 → 34
  const fixSeasons = seasonsDone.slice(0, FIXTURE_SEASONS);
  for (let si = 0; si < fixSeasons.length; si++) {
    const season = fixSeasons[si];
    try {
      const gl = await statsCall("leaguegamelog", { LeagueID: LEAGUE_ID, Season: season, SeasonType: "Regular Season", PlayerOrTeam: "T", Counter: "1230", Sorter: "DATE", Direction: "ASC" });
      const byGame = new Map();
      for (const r of rows(gl, "LeagueGameLog")) {
        const e = byGame.get(r.GAME_ID) || { date: r.GAME_DATE }; const home = !String(r.MATCHUP || "").includes("@");
        e[home ? "home" : "away"] = {
          name: TEAM_NAME[r.TEAM_ABBREVIATION] || r.TEAM_ABBREVIATION, abbr: r.TEAM_ABBREVIATION,
          pts: num(r.PTS), fgm: num(r.FGM), fga: num(r.FGA), fg3m: num(r.FG3M), fg3a: num(r.FG3A),
          ftm: num(r.FTM), fta: num(r.FTA), oreb: num(r.OREB), dreb: num(r.DREB), reb: num(r.REB),
          ast: num(r.AST), stl: num(r.STL), blk: num(r.BLK), tov: num(r.TOV), pf: num(r.PF),
        };
        byGame.set(r.GAME_ID, e);
      }
      const games = []; let gi = 0;
      for (const [gid, g] of byGame.entries()) {
        if (!g.home || !g.away) continue;
        games.push({ id: gid, date: g.date, round: Math.floor(gi / cfg.gamesPerRound) + 1, home: g.home.name, away: g.away.name, hs: g.home.pts, as: g.away.pts, box: { home: g.home, away: g.away } });
        gi++;
      }
      if (games.length) resultsBySeason[season] = games;
      await sleep(RATE_MS);

      /* per-game player lineups for the most recent seasons → static match pages */
      if (si < LINEUP_SEASONS) {
        const pl = await statsCall("leaguegamelog", { LeagueID: LEAGUE_ID, Season: season, SeasonType: "Regular Season", PlayerOrTeam: "P", Counter: "30000", Sorter: "DATE", Direction: "ASC" });
        const players = new Map(); // gid -> { home:[], away:[] }
        for (const r of rows(pl, "LeagueGameLog")) {
          const gid = r.GAME_ID; const g = byGame.get(gid); if (!g || !g.home || !g.away) continue;
          const side = r.TEAM_ABBREVIATION === g.home.abbr ? "home" : "away";
          const e = players.get(gid) || { home: [], away: [] };
          e[side].push({
            pid: Number(r.PLAYER_ID), name: r.PLAYER_NAME, min: mins(r.MIN),
            pts: num(r.PTS), reb: num(r.REB), ast: num(r.AST), stl: num(r.STL), blk: num(r.BLK), tov: num(r.TOV),
            fgm: num(r.FGM), fga: num(r.FGA), fg3m: num(r.FG3M), fg3a: num(r.FG3A), ftm: num(r.FTM), fta: num(r.FTA),
            pf: num(r.PF), pm: num(r.PLUS_MINUS),
          });
          players.set(gid, e);
        }
        let lc = 0;
        for (const [gid, g] of byGame.entries()) {
          const ply = players.get(gid); if (!g.home || !g.away || !ply) continue;
          const byMin = (a, b) => b.min - a.min || b.pts - a.pts;
          gameBox[gid] = { season, date: g.date,
            home: { ...g.home, players: ply.home.sort(byMin) },
            away: { ...g.away, players: ply.away.sort(byMin) } };
          lc++;
        }
        if (lc) lineupSeasons.push(season);
        console.log(`  ✓ ${season} lineups: ${lc} games with player box scores`);
        await sleep(RATE_MS);
      }
    } catch (e) { console.log(`  ! ${season} fixtures: ${e.message}`); }
  }

  /* ---- pre-1996 seasons: real playercareerstats, cached in legends-raw.json
         by fetch-legends.mjs (the season feed only covers 1996-97 on). Each is
         a real season on the real team — no synthesis. ------------------------ */
  let legendRows = {};
  if (cfg.useLegends) {
    try { legendRows = JSON.parse(readFileSync(join(__dirname, "legends-raw.json"), "utf8")); }
    catch { console.log("  ! legends-raw.json missing — run `npm run legends` first"); }
  }
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

  /* ---- per-season statistical leaders (derived from real year cards) ----- */
  // Only rank players with a credible sample so per-game rates aren't noise.
  // `vol` is a volume guard (key + per-game minimum) so rate/% leaders aren't
  // dominated by tiny samples (e.g. a 1-for-1 three-point night).
  const LEAD_CATS = [
    { key: "pts", label: "Points", min: 30 }, { key: "reb", label: "Rebounds", min: 30 },
    { key: "ast", label: "Assists", min: 30 }, { key: "stl", label: "Steals", min: 30 },
    { key: "blk", label: "Blocks", min: 30 }, { key: "fg3", label: "Threes", min: 30 },
    { key: "mpg", label: "Minutes", min: 30 },
    { key: "ts", label: "True Shooting %", min: 40 }, { key: "pie", label: "Player Impact", min: 40 },
    { key: "netRtg", label: "Net Rating", min: 40 },
    { key: "fg3Pct", label: "Three-Point %", min: 40, vol: { key: "fg3", min: 1.2 } },
    { key: "ftPct", label: "Free Throw %", min: 40, vol: { key: "pts", min: 8 } },
    { key: "fgPct", label: "Field Goal %", min: 40, vol: { key: "pts", min: 8 } },
  ];
  const cardsBySeasonForLeaders = {};
  for (const c of yearCards) (cardsBySeasonForLeaders[c.era] ||= []).push(c);
  const seasonLeaders = {};
  for (const [season, cards] of Object.entries(cardsBySeasonForLeaders)) {
    const cats = {};
    for (const cat of LEAD_CATS) {
      const ranked = cards
        .filter((c) => (c.g || 0) >= cat.min && (c[cat.key] || 0) > 0 && (!cat.vol || (c[cat.vol.key] || 0) >= cat.vol.min))
        .sort((a, b) => (b[cat.key] || 0) - (a[cat.key] || 0)).slice(0, 15)
        .map((c) => ({ pid: c.pid, name: c.name, club: c.club, value: c[cat.key] }));
      if (ranked.length) cats[cat.key] = ranked;
    }
    if (Object.keys(cats).length) seasonLeaders[season] = cats;
  }
  const leaderCats = LEAD_CATS.map((c) => ({ key: c.key, label: c.label }));

  /* ---- ladders, strengths, playoffs ------------------------------------- */
  const laddersBySeason = {}, strengthsBySeason = {};
  for (const [s, table] of Object.entries(standingsBySeason)) {
    laddersBySeason[s] = table;
    strengthsBySeason[s] = table.map((t) => (t.p ? t.w / t.p : 0)).sort((a, b) => a - b).map((x) => +x.toFixed(3));
  }
  const seasons = seasonsDone.filter((s) => laddersBySeason[s]);
  const latestSeason = seasons[0];
  // NOTE: playoffs.json / playoffsBySeason.json are produced by
  // pipeline/fetch-playoffs.mjs from the real playoff game logs — this script
  // deliberately does NOT write them, so a committed real bracket is never
  // clobbered by a placeholder. Run `npm run playoffs` after this.

  if (unmappedAbbr.size) {
    console.warn(`  ⚠ ${unmappedAbbr.size} unmapped tricode(s) kept under the raw code: ${[...unmappedAbbr].sort().join(", ")}`);
    console.warn(`    Add them to ${LEAGUE.toUpperCase()}_TEAM_NAME/${LEAGUE.toUpperCase()}_TEAM_META in build-data.mjs to merge them into the right franchise.`);
  }

  /* ---- write ------------------------------------------------------------ */
  await mkdir(OUT_DIR, { recursive: true });
  const clubsBySeason = {}; for (const s of seasons) clubsBySeason[s] = (laddersBySeason[s] || []).map((t) => t.club);
  const allClubs = [...new Set(pool.map((p) => p.club))].sort();
  const divisions = {}; for (const [t, [conf, div]] of Object.entries(TEAM_META)) { (divisions[conf] ||= {}); (divisions[conf][div] ||= []).push(t); }
  const meta = { generatedAt: new Date().toISOString(), seasons, latestSeason, clubs: allClubs, clubsBySeason, teamMeta: Object.fromEntries(Object.entries(TEAM_META).map(([k, v]) => [k, { conf: v[0], div: v[1] }])), divisions, playoffsActive, lineupSeasons };

  await Promise.all([
    writeFile(join(OUT_DIR, "meta.json"), JSON.stringify(meta)),
    writeFile(join(OUT_DIR, "pool.json"), JSON.stringify(pool)),
    writeFile(join(OUT_DIR, "poolYears.json"), JSON.stringify(poolYears)),
    writeFile(join(OUT_DIR, "games.json"), JSON.stringify({ season: latestSeason, players: gamePlayers, strengthsBySeason })),
    writeFile(join(OUT_DIR, "playerSeasons.json"), JSON.stringify(playerSeasons)),
    writeFile(join(OUT_DIR, "results.json"), JSON.stringify({ seasons, lineupSeasons, bySeason: resultsBySeason, laddersBySeason })),
    writeFile(join(OUT_DIR, "strengths.json"), JSON.stringify({ bySeason: strengthsBySeason })),
    writeFile(join(OUT_DIR, "seasonLeaders.json"), JSON.stringify({ cats: leaderCats, bySeason: seasonLeaders })),
    writeFile(join(OUT_DIR, "gameBox.json"), JSON.stringify({ seasons: lineupSeasons, games: gameBox })),
  ]);
  console.log(`✓ ${pool.length} era cards, ${poolYears.length} year cards, ${gamePlayers.length} players, ${seasons.length} seasons, ${Object.keys(gameBox).length} match box scores in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
main().catch((e) => { console.error("✗ pipeline failed:", e); process.exit(1); });
