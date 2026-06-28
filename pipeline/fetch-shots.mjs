/**
 * Shot charts — real zone data from the league's stats API shotchartdetail
 * feed. Reads the generated games.json + playerSeasons.json, picks each top
 * player's peak real season, fetches their shot chart and stores a compact
 * per-zone make/attempt breakdown in shots.json (read by the player profile
 * pages).
 *
 * One pipeline, two leagues. Pick with `LEAGUE=nba` (default) or `LEAGUE=wnba`.
 *
 * Env: LEAGUE=nba|wnba  SHOT_TOP=120  RATE_MS=2000
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const LEAGUE = (process.env.LEAGUE || "nba").toLowerCase();

// ---- per-league configuration ----------------------------------------------
// shotchartdetail keys shots by PlayerID, so no team map is needed here; only
// the data source (host/site/leagueId) and output dir vary by league.
const LEAGUES = {
  nba: { host: "https://stats.nba.com/stats", site: "https://www.nba.com", leagueId: "00", outSub: "" },
  wnba: { host: "https://stats.wnba.com/stats", site: "https://www.wnba.com", leagueId: "10", outSub: "wnba" },
};
const cfg = LEAGUES[LEAGUE];
if (!cfg) throw new Error(`unknown LEAGUE "${LEAGUE}" — use nba or wnba`);

const HOST = cfg.host;
const RATE_MS = Number(process.env.RATE_MS || 2000);
const TOP = Number(process.env.SHOT_TOP || 120);
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, "..", "web", "public", "data", cfg.outSub);
const LEAGUE_ID = cfg.leagueId;
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*", "Accept-Language": "en-US,en;q=0.9",
  Referer: `${cfg.site}/`, Origin: cfg.site,
  Connection: "keep-alive", "x-nba-stats-origin": "stats", "x-nba-stats-token": "true",
  "Sec-Fetch-Dest": "empty", "Sec-Fetch-Mode": "cors", "Sec-Fetch-Site": "same-site",
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(op, params) {
  const url = `${HOST}/${op}?${new URLSearchParams(params)}`;
  for (let a = 0; a < 3; a++) {
    try {
      const c = new AbortController(); const id = setTimeout(() => c.abort(), 45000);
      const res = await fetch(url, { headers: HEADERS, signal: c.signal }); clearTimeout(id);
      if (res.ok) return await res.json();
    } catch { /* retry */ }
    await sleep(RATE_MS * (a + 1));
  }
  return null;
}

async function main() {
  const players = JSON.parse(readFileSync(join(DATA, "games.json"), "utf8")).players;
  const seasonsByPid = JSON.parse(readFileSync(join(DATA, "playerSeasons.json"), "utf8"));
  let existing = {};
  try { existing = JSON.parse(readFileSync(join(DATA, "shots.json"), "utf8")); } catch { /* fresh */ }

  // top players who have a real (1996+) season with shooting data
  const targets = [];
  for (const p of players) {
    const ss = (seasonsByPid[p.id] || []).filter((s) => s.fgPct > 0);
    if (!ss.length) continue;
    const peak = ss.reduce((a, b) => (b.rating > a.rating ? b : a));
    targets.push({ pid: p.id, name: p.name, season: peak.season });
    if (targets.length >= TOP) break;
  }
  console.log(`→ ${targets.length} shot charts to fetch…`);

  const out = { ...existing };
  let done = 0;
  for (const t of targets) {
    if (out[t.pid]) { done++; continue; } // already have it
    const j = await call("shotchartdetail", {
      CFID: "", CFPARAMS: "", ContextFilter: "", ContextMeasure: "FGA", DateFrom: "", DateTo: "", GameID: "",
      GameSegment: "", LastNGames: "0", LeagueID: LEAGUE_ID, Location: "", Month: "0", OpponentTeamID: "0", Outcome: "",
      Period: "0", PlayerID: String(t.pid), PlayerPosition: "", RookieYear: "", Season: t.season,
      SeasonSegment: "", SeasonType: "Regular Season", TeamID: "0", VsConference: "", VsDivision: "",
    });
    await sleep(RATE_MS);
    if (!j) { console.log(`  ! ${t.name}: no data`); continue; }
    const rs = (j.resultSets || []).find((r) => r.name === "Shot_Chart_Detail") || j.resultSets?.[0];
    if (!rs || !rs.rowSet?.length) { console.log(`  · ${t.name}: empty`); continue; }
    const idx = Object.fromEntries(rs.headers.map((h, i) => [h, i]));
    const zones = {}; let total = 0;
    for (const row of rs.rowSet) {
      const z = row[idx.SHOT_ZONE_BASIC]; if (!z) continue;
      zones[z] ||= [0, 0]; zones[z][1] += 1; zones[z][0] += row[idx.SHOT_MADE_FLAG] ? 1 : 0; total += 1;
    }
    out[t.pid] = { season: t.season, total, zones };
    done++;
    if (done % 15 === 0) { writeFileSync(join(DATA, "shots.json"), JSON.stringify(out)); console.log(`  …${done}/${targets.length}`); }
  }
  writeFileSync(join(DATA, "shots.json"), JSON.stringify(out));
  console.log(`✓ shots.json — ${Object.keys(out).length} players`);
}
main().catch((e) => { console.error("✗ shots failed:", e); process.exit(1); });
