/**
 * Build-time player database (server only). Reads the generated games.json
 * from disk so we can statically pre-render a profile page per notable player
 * and list them in the sitemap.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { GamePlayer, SeasonLine, PlayerShots } from "@/lib/games-data";
import { slugify } from "@/lib/format";

export interface ProfilePlayer extends GamePlayer {
  slug: string;
}

let _all: ProfilePlayer[] | null = null;

export function allPlayers(): ProfilePlayer[] {
  if (_all) return _all;
  const file = join(process.cwd(), "public", "data", "games.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as { players: GamePlayer[] };
  _all = data.players.map((p) => ({ ...p, slug: slugify(p.name) }));
  return _all;
}

/**
 * Players notable enough to get a statically pre-rendered profile page. Capped
 * to the most famous so the static build stays a sensible size (the dataset has
 * 2,000+ players; we pre-render the top tier and the rest 404 gracefully).
 */
export function notablePlayers(): ProfilePlayer[] {
  return [...allPlayers()].sort((a, b) => b.fame - a.fame).slice(0, 800);
}

export function playerById(id: string): ProfilePlayer | null {
  return allPlayers().find((p) => String(p.id) === String(id)) ?? null;
}

let _seasons: Record<string, SeasonLine[]> | null = null;
/** A player's real season-by-season log (newest first). */
export function seasonsFor(id: number | string): SeasonLine[] {
  if (!_seasons) {
    try {
      _seasons = JSON.parse(readFileSync(join(process.cwd(), "public", "data", "playerSeasons.json"), "utf8"));
    } catch { _seasons = {}; }
  }
  const list = _seasons![String(id)] ?? [];
  return [...list].sort((a, b) => b.season.localeCompare(a.season));
}

let _shots: Record<string, PlayerShots> | null = null;
/** A player's real shot-zone breakdown, if we fetched it (top players). */
export function shotsFor(id: number | string): PlayerShots | null {
  if (!_shots) {
    try {
      _shots = JSON.parse(readFileSync(join(process.cwd(), "public", "data", "shots.json"), "utf8"));
    } catch { _shots = {}; }
  }
  return _shots![String(id)] ?? null;
}
