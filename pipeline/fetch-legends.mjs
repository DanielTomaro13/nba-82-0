/**
 * Pre-1996 seasons — real, from stats.nba.com/stats/playercareerstats.
 * leaguedashplayerstats only goes back to 1996-97, but playercareerstats returns
 * a player's full season-by-season log (correct team + real stats) for every era.
 * This fetches the notable players who debuted before 1996 and caches their real
 * pre-1996 seasons to legends-raw.json, which build-data.mjs folds in.
 *
 * Resumable: re-run to continue (skips players already cached).
 * Env: LEGEND_TOP=320  MIN_PTS=11  RATE_MS=1700
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HOST = "https://stats.nba.com/stats";
const RATE_MS = Number(process.env.RATE_MS || 1700);
const TOP = Number(process.env.LEGEND_TOP || 320);
const MIN_PTS = Number(process.env.MIN_PTS || 11);
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "legends-raw.json");
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*", "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.nba.com/", Origin: "https://www.nba.com",
  Connection: "keep-alive", "x-nba-stats-origin": "stats", "x-nba-stats-token": "true",
  "Sec-Fetch-Dest": "empty", "Sec-Fetch-Mode": "cors", "Sec-Fetch-Site": "same-site",
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r1 = (x) => +(+x || 0).toFixed(1);
const pct = (x) => Math.round((Number(x) || 0) * 1000) / 10;

async function call(op, params) {
  const url = `${HOST}/${op}?${new URLSearchParams(params)}`;
  for (let a = 0; a < 3; a++) {
    try { const c = new AbortController(); const id = setTimeout(() => c.abort(), 40000); const r = await fetch(url, { headers: HEADERS, signal: c.signal }); clearTimeout(id); if (r.ok) return await r.json(); } catch { /* retry */ }
    await sleep(RATE_MS * (a + 1));
  }
  return null;
}
function rowsOf(json, name) {
  const rs = (json.resultSets || []).find((r) => r.name === name); if (!rs) return [];
  const ix = Object.fromEntries(rs.headers.map((h, i) => [h, i]));
  return rs.rowSet.map((row) => new Proxy({}, { get: (_, k) => row[ix[k]] }));
}

async function main() {
  console.log("→ playerindex…");
  const pi = await call("playerindex", { LeagueID: "00", Season: "2025-26", Historical: "1" });
  await sleep(RATE_MS);
  const cands = [];
  for (const r of rowsOf(pi, "PlayerIndex")) {
    const from = Number(r.FROM_YEAR) || 0, to = Number(r.TO_YEAR) || 0, pts = Number(r.PTS) || 0;
    if (from && from < 1996 && pts >= MIN_PTS && to - from >= 2) {
      cands.push({ pid: Number(r.PERSON_ID), name: `${r.PLAYER_FIRST_NAME || ""} ${r.PLAYER_LAST_NAME || ""}`.trim(), pos: r.POSITION || "", pts });
    }
  }
  cands.sort((a, b) => b.pts - a.pts);
  const targets = cands.slice(0, TOP);
  console.log(`  ${cands.length} pre-1996 candidates; fetching top ${targets.length}`);

  let out = {};
  try { out = JSON.parse(readFileSync(OUT, "utf8")); } catch { /* fresh */ }

  let done = 0, fetched = 0;
  for (const t of targets) {
    if (out[t.pid]) { done++; continue; }
    const j = await call("playercareerstats", { LeagueID: "00", PerMode: "PerGame", PlayerID: String(t.pid) });
    await sleep(RATE_MS);
    if (!j) { console.log(`  ! ${t.name}`); continue; }
    const seasons = [];
    for (const r of rowsOf(j, "SeasonTotalsRegularSeason")) {
      const sid = String(r.SEASON_ID || ""); const end = Number(sid.slice(0, 4)) + 1;
      if (!end || end > 1996) continue;                 // 1996-97+ comes from leaguedashplayerstats
      const gp = Number(r.GP) || 0; if (gp < 8) continue;
      seasons.push({
        season: `${end - 1}-${String(end).slice(2)}`, end, teamAbbr: r.TEAM_ABBREVIATION, gp,
        pts: r1(r.PTS), reb: r1(r.REB), ast: r1(r.AST), stl: r1(r.STL), blk: r1(r.BLK), fg3: r1(r.FG3M),
        fgPct: pct(r.FG_PCT), fg3Pct: pct(r.FG3_PCT), ftPct: pct(r.FT_PCT), mpg: r1(r.MIN),
      });
    }
    if (seasons.length) { out[t.pid] = { pid: t.pid, name: t.name, pos: t.pos, seasons }; fetched++; }
    done++;
    if (done % 20 === 0) { writeFileSync(OUT, JSON.stringify(out)); console.log(`  …${done}/${targets.length} (${fetched} with pre-96 data)`); }
  }
  writeFileSync(OUT, JSON.stringify(out));
  console.log(`✓ legends-raw.json — ${Object.keys(out).length} players`);
}
main().catch((e) => { console.error("✗ legends failed:", e); process.exit(1); });
