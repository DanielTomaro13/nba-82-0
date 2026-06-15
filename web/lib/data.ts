/** Client loaders for the static datasets in /public/data. */
import type { Meta, PoolPlayer } from "@/lib/types";

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
  bySeason: Record<string, MatchResult[]>;
  laddersBySeason: Record<string, LadderRow[]>;
}

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
async function loadJson<T>(file: string): Promise<T> {
  if (cache.has(file)) return cache.get(file) as T;
  const res = await fetch(`${BASE}/data/${file}${DATA_VER}`, { cache: "force-cache" });
  const data = (await res.json()) as T;
  cache.set(file, data);
  return data;
}

export const loadMeta = () => loadJson<Meta>("meta.json");
export const loadPool = () => loadJson<PoolPlayer[]>("pool.json");
export const loadPoolYears = () => loadJson<PoolPlayer[]>("poolYears.json");
export const loadResults = () => loadJson<Results>("results.json");
export const loadStrengths = () => loadJson<{ bySeason: Record<string, number[]> }>("strengths.json");
export const loadPlayoffs = () => loadJson<Playoffs>("playoffs.json");
export const loadPlayoffsBySeason = () => loadJson<Record<string, Playoffs>>("playoffsBySeason.json");

export interface LeaderEntry { pid: number; name: string; club: string; value: number }
export interface SeasonLeaders {
  cats: { key: string; label: string }[];
  bySeason: Record<string, Record<string, LeaderEntry[]>>;
}
export const loadSeasonLeaders = () => loadJson<SeasonLeaders>("seasonLeaders.json");
