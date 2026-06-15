/**
 * Real playoff brackets — reconstructed from stats.nba.com/stats/leaguegamelog
 * (SeasonType=Playoffs). Every series, winner and series score is real; rounds
 * are derived from each winner's prior series, seeds from the regular-season
 * standings. Writes playoffs.json (latest) + playoffsBySeason.json.
 *
 * Env: PO_SEASONS=10  RATE_MS=2000
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HOST = "https://stats.nba.com/stats";
const RATE_MS = Number(process.env.RATE_MS || 2000);
const PO_SEASONS = Number(process.env.PO_SEASONS || 10);
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, "..", "web", "public", "data");
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*", "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.nba.com/", Origin: "https://www.nba.com",
  Connection: "keep-alive", "x-nba-stats-origin": "stats", "x-nba-stats-token": "true",
  "Sec-Fetch-Dest": "empty", "Sec-Fetch-Mode": "cors", "Sec-Fetch-Site": "same-site",
};
const TEAM_NAME = {
  ATL: "Atlanta Hawks", BOS: "Boston Celtics", BKN: "Brooklyn Nets", CHA: "Charlotte Hornets",
  CHI: "Chicago Bulls", CLE: "Cleveland Cavaliers", DAL: "Dallas Mavericks", DEN: "Denver Nuggets",
  DET: "Detroit Pistons", GSW: "Golden State Warriors", HOU: "Houston Rockets", IND: "Indiana Pacers",
  LAC: "LA Clippers", LAL: "Los Angeles Lakers", MEM: "Memphis Grizzlies", MIA: "Miami Heat",
  MIL: "Milwaukee Bucks", MIN: "Minnesota Timberwolves", NOP: "New Orleans Pelicans", NYK: "New York Knicks",
  OKC: "Oklahoma City Thunder", ORL: "Orlando Magic", PHI: "Philadelphia 76ers", PHX: "Phoenix Suns",
  POR: "Portland Trail Blazers", SAC: "Sacramento Kings", SAS: "San Antonio Spurs", TOR: "Toronto Raptors",
  UTA: "Utah Jazz", WAS: "Washington Wizards", SEA: "Seattle SuperSonics", VAN: "Memphis Grizzlies",
  NJN: "Brooklyn Nets", NOH: "New Orleans Pelicans", NOK: "New Orleans Pelicans",
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(op, params) {
  const url = `${HOST}/${op}?${new URLSearchParams(params)}`;
  for (let a = 0; a < 3; a++) {
    try { const c = new AbortController(); const id = setTimeout(() => c.abort(), 40000); const r = await fetch(url, { headers: HEADERS, signal: c.signal }); clearTimeout(id); if (r.ok) return await r.json(); } catch { /* retry */ }
    await sleep(RATE_MS * (a + 1));
  }
  return null;
}
function rowsOf(j, name) { const rs = (j.resultSets || []).find((r) => r.name === name) || j.resultSets?.[0]; if (!rs) return []; const ix = Object.fromEntries(rs.headers.map((h, i) => [h, i])); return rs.rowSet.map((row) => new Proxy({}, { get: (_, k) => row[ix[k]] })); }

function bracketFromGames(season, gl, standings, teamMeta) {
  const confOf = (club) => (teamMeta[club]?.conf) || "";
  // seed = rank within conference by regular-season wins
  const seedOf = {};
  for (const conf of ["East", "West"]) {
    standings.filter((t) => t.conf === conf).sort((a, b) => b.w - a.w).forEach((t, i) => { seedOf[t.club] = i + 1; });
  }
  // group playoff games into series
  const byGame = {};
  for (const r of rowsOf(gl, "LeagueGameLog")) (byGame[r.GAME_ID] = byGame[r.GAME_ID] || []).push(r);
  const series = {};
  for (const gid in byGame) {
    const [a, b] = byGame[gid]; if (!a || !b) continue;
    const an = TEAM_NAME[a.TEAM_ABBREVIATION], bn = TEAM_NAME[b.TEAM_ABBREVIATION]; if (!an || !bn) continue;
    const key = [an, bn].sort().join("|");
    const s = (series[key] = series[key] || { teams: [an, bn].sort(), wins: {}, date: r9(a.GAME_DATE) });
    s.date = Math.min(s.date, r9(a.GAME_DATE));
    const winner = a.WL === "W" ? an : bn; s.wins[winner] = (s.wins[winner] || 0) + 1;
  }
  function r9(d) { return Number(String(d || "").replace(/-/g, "")) || 0; }
  const list = Object.values(series).map((s) => {
    const [t1, t2] = s.teams; const w1 = s.wins[t1] || 0, w2 = s.wins[t2] || 0;
    const winner = w1 >= w2 ? t1 : t2, loser = w1 >= w2 ? t2 : t1;
    return { teams: s.teams, winner, loser, score: `${Math.max(w1, w2)}-${Math.min(w1, w2)}`, date: s.date };
  });
  if (!list.length) return null;
  // round = 1 + (# of series this winner already won earlier)
  list.sort((a, b) => a.date - b.date);
  const priorWins = {};
  for (const s of list) { s.round = 1 + (priorWins[s.winner] || 0); priorWins[s.winner] = (priorWins[s.winner] || 0) + 1; }
  const maxRound = Math.max(...list.map((s) => s.round));
  const roundName = (r) => r === maxRound ? "NBA Finals" : r === maxRound - 1 ? "Conference Finals" : r === maxRound - 2 ? "Conference Semifinals" : r === 1 ? "First Round" : `Round ${r}`;
  const mkSeries = (s) => {
    const cf = confOf(s.teams[0]) === confOf(s.teams[1]) ? confOf(s.teams[0]) : "Finals";
    const seeded = s.teams.map((t) => ({ team: t, seed: seedOf[t] || 0 })).sort((a, b) => a.seed - b.seed);
    return { conf: cf, hi: seeded[0], lo: seeded[1], winner: s.winner, loserTeam: s.loser, score: s.score };
  };
  const rounds = [];
  for (let r = 1; r <= maxRound; r++) {
    const ss = list.filter((s) => s.round === r).map(mkSeries);
    if (ss.length) rounds.push({ name: roundName(r), series: ss });
  }
  const finals = list.find((s) => s.round === maxRound);
  return { season, active: true, champion: finals ? finals.winner : "", runnerUp: finals ? finals.loser : "", rounds, seeds: {
    East: standings.filter((t) => t.conf === "East").slice(0, 8).map((t, i) => ({ team: t.club, seed: i + 1, w: t.w, l: t.l })),
    West: standings.filter((t) => t.conf === "West").slice(0, 8).map((t, i) => ({ team: t.club, seed: i + 1, w: t.w, l: t.l })),
  } };
}

async function main() {
  const results = JSON.parse(readFileSync(join(DATA, "results.json"), "utf8"));
  const meta = JSON.parse(readFileSync(join(DATA, "meta.json"), "utf8"));
  const seasons = results.seasons.slice(0, PO_SEASONS);
  const bySeason = {};
  for (const season of seasons) {
    const standings = results.laddersBySeason[season]; if (!standings) continue;
    const gl = await call("leaguegamelog", { LeagueID: "00", Season: season, SeasonType: "Playoffs", PlayerOrTeam: "T", Counter: "1000", Sorter: "DATE", Direction: "ASC" });
    await sleep(RATE_MS);
    if (!gl) { console.log(`  ! ${season}: no playoff log`); continue; }
    const b = bracketFromGames(season, gl, standings, meta.teamMeta || {});
    if (b) { bySeason[season] = b; console.log(`✓ ${season}: champion ${b.champion} (${b.rounds.length} rounds)`); }
  }
  const latest = bySeason[seasons[0]] || { season: seasons[0], active: false, champion: "", rounds: [], seeds: {} };
  // the current season's playoffs are only "active" (shown on home) if they exist
  latest.active = Boolean(meta.playoffsActive && bySeason[seasons[0]]);
  writeFileSync(join(DATA, "playoffs.json"), JSON.stringify(latest));
  writeFileSync(join(DATA, "playoffsBySeason.json"), JSON.stringify(bySeason));
  console.log(`✓ playoffs.json + playoffsBySeason.json — ${Object.keys(bySeason).length} seasons`);
}
main().catch((e) => { console.error("✗ playoffs failed:", e); process.exit(1); });
