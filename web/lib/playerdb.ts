/**
 * Build-time player database (server only). Reads the generated games.json
 * from disk so we can statically pre-render a profile page per notable player
 * and list them in the sitemap.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { GamePlayer } from "@/lib/games-data";
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
