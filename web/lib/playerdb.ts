/**
 * Build-time player database (server only). Reads the generated games.json
 * from disk so we can statically pre-render a profile page per notable player
 * and list them in the sitemap.
 */
import type { GamePlayer, SeasonLine, PlayerShots } from "@/lib/games-data";
import { slugify } from "@/lib/format";
import { readData } from "@/lib/serverdata";
import type { LeagueId } from "@/lib/league";

export interface ProfilePlayer extends GamePlayer {
  slug: string;
}

const _all: Partial<Record<LeagueId, ProfilePlayer[]>> = {};

export function allPlayers(league: LeagueId = "nba"): ProfilePlayer[] {
  if (_all[league]) return _all[league]!;
  const data = readData<{ players: GamePlayer[] }>("games.json", league);
  _all[league] = data.players.map((p) => ({ ...p, slug: slugify(p.name) }));
  return _all[league]!;
}

/**
 * The most famous players first — used for "featured" lists and the sitemap.
 * (Every player in the dataset gets a page; this is just an ordering/cap.)
 */
export function notablePlayers(league: LeagueId = "nba"): ProfilePlayer[] {
  return [...allPlayers(league)].sort((a, b) => b.fame - a.fame).slice(0, 800);
}

export function playerById(id: string, league: LeagueId = "nba"): ProfilePlayer | null {
  return allPlayers(league).find((p) => String(p.id) === String(id)) ?? null;
}

const _ids: Partial<Record<LeagueId, Set<number>>> = {};
/** True if this player id has a profile page (i.e. exists in the dataset). */
export function playerHasPage(id: number | string, league: LeagueId = "nba"): boolean {
  if (!_ids[league]) _ids[league] = new Set(allPlayers(league).map((p) => p.id));
  return _ids[league]!.has(Number(id));
}

const _seasons: Partial<Record<LeagueId, Record<string, SeasonLine[]>>> = {};
/** A player's real season-by-season log (newest first). */
export function seasonsFor(id: number | string, league: LeagueId = "nba"): SeasonLine[] {
  if (!_seasons[league]) {
    try { _seasons[league] = readData<Record<string, SeasonLine[]>>("playerSeasons.json", league); }
    catch { _seasons[league] = {}; }
  }
  const list = _seasons[league]![String(id)] ?? [];
  return [...list].sort((a, b) => b.season.localeCompare(a.season));
}

const _shots: Partial<Record<LeagueId, Record<string, PlayerShots>>> = {};
/** A player's real shot-zone breakdown, if we fetched it (top players). */
export function shotsFor(id: number | string, league: LeagueId = "nba"): PlayerShots | null {
  if (!_shots[league]) {
    try { _shots[league] = readData<Record<string, PlayerShots>>("shots.json", league); }
    catch { _shots[league] = {}; }
  }
  return _shots[league]![String(id)] ?? null;
}
