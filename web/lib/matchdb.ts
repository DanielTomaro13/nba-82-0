/**
 * Build-time match database (server only). Reads gameBox.json (real per-game
 * player box scores for the most recent seasons) so we can statically
 * pre-render a detail page per game with both teams' full lineups.
 */
import { readData } from "@/lib/serverdata";
import type { GameBoxData, GameBoxEntry } from "@/lib/data";
import type { LeagueId } from "@/lib/league";

const _box: Partial<Record<LeagueId, GameBoxData>> = {};
function box(league: LeagueId = "nba"): GameBoxData {
  if (_box[league]) return _box[league]!;
  try { _box[league] = readData<GameBoxData>("gameBox.json", league); }
  catch { _box[league] = { seasons: [], games: {} }; }
  return _box[league]!;
}

/** Every game id that has a pre-rendered match page. */
export function allMatchIds(league: LeagueId = "nba"): string[] {
  return Object.keys(box(league).games);
}

export function matchById(id: string, league: LeagueId = "nba"): GameBoxEntry | null {
  return box(league).games[id] ?? null;
}

/** Most recent games first (by date), capped — for "recent games" lists. */
export function recentMatchesForTeam(abbr: string, limit = 10, league: LeagueId = "nba"): (GameBoxEntry & { id: string })[] {
  const out: (GameBoxEntry & { id: string })[] = [];
  for (const [id, g] of Object.entries(box(league).games)) {
    if (g.home.abbr === abbr || g.away.abbr === abbr) out.push({ ...g, id });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit);
}
