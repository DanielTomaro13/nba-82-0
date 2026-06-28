/**
 * Shared types + loaders for the mini-games dataset (public/data/games.json),
 * produced by pipeline/build-data.mjs from real NBA box-score stats.
 *
 * The NBA Stats API exposes per-season box-score totals but not nationality /
 * birthdate, so the games are built on what the feeds *do* give us: team,
 * position, era span and real career per-game stat lines.
 */
export interface GamePlayer {
  id: number;
  name: string;
  club: string;       // NBA franchise (full name)
  pos: string;        // PG | SG | SF | PF | C
  posName: string;
  firstYear: number;
  lastYear: number;
  apps: number;       // career games played
  pts: number;        // points per game
  reb: number;        // rebounds per game
  ast: number;        // assists per game
  stl: number;        // steals per game
  blk: number;        // blocks per game
  fg3?: number;       // three-pointers made per game
  fgPct?: number;     // field-goal %
  fg3Pct?: number;    // three-point %
  ftPct?: number;     // free-throw %
  mpg?: number;       // minutes per game
  ts?: number;        // true shooting %
  usg?: number;       // usage %
  pie?: number;       // player impact estimate
  bio?: PlayerBio | null;
  rating: number;
  fame: number;
}

export interface PlayerBio {
  height: string; weight: string; college: string; country: string;
  draftYear: number | null; draftRound: number | null; draftNumber: number | null; jersey: string;
}

export interface SeasonLine {
  season: string; club: string; gp: number; rating: number;
  pts: number; reb: number; ast: number; stl: number; blk: number; fg3: number;
  fgPct: number; fg3Pct: number; ftPct: number; mpg: number;
  ts: number; usg: number; pie: number; netRtg: number;
}

export interface PlayerShots {
  season: string;
  total: number;
  /** zone name -> [made, attempted] */
  zones: Record<string, [number, number]>;
}

export interface GamesData {
  season: string;
  players: GamePlayer[];
  strengthsBySeason: Record<string, number[]>;
}

import { dataPath, type LeagueId } from "@/lib/league";

const VER = process.env.NEXT_PUBLIC_DATA_VERSION ? `?v=${process.env.NEXT_PUBLIC_DATA_VERSION}` : "";
const _cache = new Map<LeagueId, GamesData>();

/**
 * Load the mini-games dataset for a league. NBA reads /data/games.json
 * (unchanged); WNBA reads /data/wnba/games.json. Cached per league.
 */
export async function loadGamesData(league: LeagueId = "nba"): Promise<GamesData> {
  const hit = _cache.get(league);
  if (hit) return hit;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data/${dataPath(league)}games.json${VER}`,
    { cache: "force-cache" },
  );
  const data = (await res.json()) as GamesData;
  _cache.set(league, data);
  return data;
}

/**
 * Deterministic daily seed so "today's" puzzles are the same for everyone.
 * The optional `league` keeps NBA and WNBA daily instances independent.
 */
export function dailySeed(salt = "", league: LeagueId = "nba"): number {
  const d = new Date();
  const lg = league === "nba" ? "" : `-${league}`;
  const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${salt}${lg}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const dayNumber = () =>
  Math.floor((Date.now() - Date.UTC(2026, 0, 1)) / 86400000) + 1;

/**
 * Namespace a game's storage/leaderboard key by league so NBA and WNBA boards,
 * streaks and daily results never collide. NBA keeps the bare slug (unchanged);
 * WNBA gets a "wnba-" prefix, e.g. "wnba-footle".
 */
export function gameKey(slug: string, league: LeagueId = "nba"): string {
  return league === "nba" ? slug : `${league}-${slug}`;
}

/** Mulberry32 seeded PRNG. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickN<T>(arr: T[], n: number, rand: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}
