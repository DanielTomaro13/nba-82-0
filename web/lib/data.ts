/** Client loaders for the static datasets in /public/data. */
import type { Meta, PoolPlayer } from "@/lib/types";
import { dataPath, type LeagueId } from "@/lib/league";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export interface LadderRow {
  club: string; conf?: string; div?: string;
  p: number; w: number; l: number; d: number;
  pf: number; pa: number; pts: number; pd: number;
  home?: string; road?: string; l10?: string; streak?: string; confRec?: string;
}
export interface TeamBox {
  name: string; abbr?: string; pts: number;
  fgm: number; fga: number; fg3m: number; fg3a: number; ftm: number; fta: number;
  oreb: number; dreb: number; reb: number; ast: number; stl: number; blk: number; tov: number; pf: number;
}
export interface MatchResult {
  id?: string; date?: string; round: number; home: string; away: string; hs: number; as: number;
  box?: { home: TeamBox; away: TeamBox };
}
export interface Results {
  seasons: string[];
  lineupSeasons?: string[];
  bySeason: Record<string, MatchResult[]>;
  laddersBySeason: Record<string, LadderRow[]>;
}

/** A single player's line in a game box score. */
export interface PlayerLine {
  pid: number; name: string; min: number;
  pts: number; reb: number; ast: number; stl: number; blk: number; tov: number;
  fgm: number; fga: number; fg3m: number; fg3a: number; ftm: number; fta: number; pf: number; pm: number;
}
export type TeamBoxFull = TeamBox & { players: PlayerLine[] };
export interface GameBoxEntry { season: string; date: string; home: TeamBoxFull; away: TeamBoxFull }
export interface GameBoxData { seasons: string[]; games: Record<string, GameBoxEntry> }

export interface Seed { team: string; seed: number; w: number; l: number }
export interface Series { conf: string; hi: Seed; lo: Seed; winner: string; score: string; loserTeam: string }
export interface Playoffs {
  season: string;
  active: boolean;
  champion: string;
  runnerUp?: string;
  rounds: { name: string; series: Series[] }[];
  seeds: Record<string, Seed[]>;
}

// Bust the CDN/browser cache on every deploy so fresh data shows immediately.
export const DATA_VER = process.env.NEXT_PUBLIC_DATA_VERSION ? `?v=${process.env.NEXT_PUBLIC_DATA_VERSION}` : "";

const cache = new Map<string, unknown>();
async function loadJson<T>(file: string, league: LeagueId = "nba"): Promise<T> {
  const key = `${league}:${file}`;
  if (cache.has(key)) return cache.get(key) as T;
  const res = await fetch(`${BASE}/data/${dataPath(league)}${file}${DATA_VER}`, { cache: "force-cache" });
  const data = (await res.json()) as T;
  cache.set(key, data);
  return data;
}

export const loadMeta = (league: LeagueId = "nba") => loadJson<Meta>("meta.json", league);
export const loadPool = (league: LeagueId = "nba") => loadJson<PoolPlayer[]>("pool.json", league);
export const loadPoolYears = (league: LeagueId = "nba") => loadJson<PoolPlayer[]>("poolYears.json", league);
export const loadResults = (league: LeagueId = "nba") => loadJson<Results>("results.json", league);
export const loadStrengths = (league: LeagueId = "nba") => loadJson<{ bySeason: Record<string, number[]> }>("strengths.json", league);
export const loadPlayoffs = (league: LeagueId = "nba") => loadJson<Playoffs>("playoffs.json", league);
export const loadPlayoffsBySeason = (league: LeagueId = "nba") => loadJson<Record<string, Playoffs>>("playoffsBySeason.json", league);

export interface LeaderEntry { pid: number; name: string; club: string; value: number }
export interface SeasonLeaders {
  cats: { key: string; label: string }[];
  bySeason: Record<string, Record<string, LeaderEntry[]>>;
}
export const loadSeasonLeaders = (league: LeagueId = "nba") => loadJson<SeasonLeaders>("seasonLeaders.json", league);
