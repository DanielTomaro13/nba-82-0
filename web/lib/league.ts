/**
 * League registry — the single source of truth for everything that differs
 * between the NBA and the WNBA. The site ships NBA at the root (/) and the WNBA
 * under /wnba, sharing the same components; this config is what each side reads
 * to know its season length, data directory, branding and model feed.
 *
 * Every consumer that takes a `LeagueId` defaults to "nba", so the existing NBA
 * site behaves identically — the WNBA is layered on additively.
 */

export type LeagueId = "nba" | "wnba";

export interface LeagueConfig {
  id: LeagueId;
  /** Short league name, e.g. "NBA". */
  short: string;
  /** Brand/wordmark used in headings + metadata, e.g. "NBA 82-0". */
  brand: string;
  /** Regular-season game count that drives the perfect-season chase. */
  seasonGames: number;
  /** The "X–0" perfect-season label, e.g. "82–0". */
  perfectLabel: string;
  /** Route base path: "" for NBA (root), "/wnba" for the WNBA. */
  basePath: string;
  /**
   * Sub-directory under /data (client) and public/data (server) that holds this
   * league's generated JSON. "" keeps the NBA at the data root (unchanged);
   * "wnba" reads from /data/wnba.
   */
  dataSub: string;
  /** Official site (for "real stats from…" copy + outbound links). */
  officialSite: string;
  /** Human label for the official stats source. */
  statsSource: string;
  /**
   * Whether the league has divisions within conferences. The NBA does (6
   * divisions); the WNBA has conferences only, so UI hides "Division" wording.
   */
  hasDivisions: boolean;
}

export const LEAGUES: Record<LeagueId, LeagueConfig> = {
  nba: {
    id: "nba",
    short: "NBA",
    brand: "NBA 82-0",
    seasonGames: 82,
    perfectLabel: "82–0",
    basePath: "",
    dataSub: "",
    officialSite: "https://www.nba.com",
    statsSource: "NBA Stats",
    hasDivisions: true,
  },
  wnba: {
    id: "wnba",
    short: "WNBA",
    brand: "WNBA 44-0",
    seasonGames: 44, // current WNBA regular season (2025+); historically 34–40
    perfectLabel: "44–0",
    basePath: "/wnba",
    dataSub: "wnba",
    officialSite: "https://www.wnba.com",
    statsSource: "WNBA Stats",
    hasDivisions: false,
  },
};

export const DEFAULT_LEAGUE: LeagueId = "nba";
export const ALL_LEAGUES: LeagueId[] = ["nba", "wnba"];

export function getLeague(id?: LeagueId | string | null): LeagueConfig {
  const key = (id ?? DEFAULT_LEAGUE) as LeagueId;
  return LEAGUES[key] ?? LEAGUES[DEFAULT_LEAGUE];
}

/** Path prefix for client fetches: "" → "/data/", "wnba" → "/data/wnba/". */
export function dataPath(id?: LeagueId): string {
  const sub = getLeague(id).dataSub;
  return sub ? `${sub}/` : "";
}

/** Prefix a route with the league base path, e.g. nbaHref("/play") → "/wnba/play". */
export function leagueHref(id: LeagueId | undefined, path: string): string {
  const base = getLeague(id).basePath;
  if (path === "/") return base || "/";
  return `${base}${path}`;
}
