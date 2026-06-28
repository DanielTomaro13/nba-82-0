/** Build-time (server) readers for the static datasets. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Meta } from "@/lib/types";
import type { Results, Playoffs } from "@/lib/data";
import { getLeague, type LeagueId } from "@/lib/league";

/** Read a dataset for a league: NBA from public/data, WNBA from public/data/wnba. */
export function readData<T>(file: string, league: LeagueId = "nba"): T {
  const sub = getLeague(league).dataSub;
  return JSON.parse(readFileSync(join(process.cwd(), "public", "data", sub, file), "utf8")) as T;
}

/**
 * Like readData but returns `fallback` instead of throwing when the dataset is
 * missing. Used by WNBA pages so the static build stays green before the WNBA
 * pipeline has been run (`npm run data:wnba`).
 */
export function readDataSafe<T>(file: string, fallback: T, league: LeagueId = "nba"): T {
  try { return readData<T>(file, league); } catch { return fallback; }
}

export const serverMeta = (league: LeagueId = "nba") => readData<Meta>("meta.json", league);
export const serverResults = (league: LeagueId = "nba") => readData<Results>("results.json", league);
export const serverPlayoffs = (league: LeagueId = "nba") => readData<Playoffs>("playoffs.json", league);
