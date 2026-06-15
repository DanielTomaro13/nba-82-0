/**
 * Build-time match database (server only). Reads gameBox.json (real per-game
 * player box scores for the most recent seasons) so we can statically
 * pre-render a detail page per game with both teams' full lineups.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { GameBoxData, GameBoxEntry } from "@/lib/data";

let _box: GameBoxData | null = null;
function box(): GameBoxData {
  if (_box) return _box;
  try { _box = JSON.parse(readFileSync(join(process.cwd(), "public", "data", "gameBox.json"), "utf8")) as GameBoxData; }
  catch { _box = { seasons: [], games: {} }; }
  return _box;
}

/** Every game id that has a pre-rendered match page. */
export function allMatchIds(): string[] {
  return Object.keys(box().games);
}

export function matchById(id: string): GameBoxEntry | null {
  return box().games[id] ?? null;
}

/** Most recent games first (by date), capped — for "recent games" lists. */
export function recentMatchesForTeam(abbr: string, limit = 10): (GameBoxEntry & { id: string })[] {
  const out: (GameBoxEntry & { id: string })[] = [];
  for (const [id, g] of Object.entries(box().games)) {
    if (g.home.abbr === abbr || g.away.abbr === abbr) out.push({ ...g, id });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit);
}
