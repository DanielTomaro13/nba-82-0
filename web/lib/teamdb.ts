/**
 * Build-time team database (server only) — derived entirely from the generated
 * datasets (meta, pool, games, results, playoffsBySeason). No hardcoded team
 * facts beyond conference/division (which live in meta from the API).
 */
import { clubAbbr } from "@/lib/clubs";
import { slugify } from "@/lib/format";
import { readData } from "@/lib/serverdata";
import type { GamePlayer } from "@/lib/games-data";
import type { Meta, PoolPlayer } from "@/lib/types";
import type { LadderRow } from "@/lib/data";
import type { LeagueId } from "@/lib/league";

type ResultsData = { laddersBySeason: Record<string, LadderRow[]>; seasons: string[] };
interface BracketSeries { conf: string; hi: { team: string }; lo: { team: string }; winner: string; loserTeam: string; score: string }
interface Bracket { champion: string; runnerUp?: string; rounds: { name: string; series: BracketSeries[] }[] }

const _meta: Partial<Record<LeagueId, Meta>> = {};
const _pool: Partial<Record<LeagueId, PoolPlayer[]>> = {};
const _games: Partial<Record<LeagueId, GamePlayer[]>> = {};
const _results: Partial<Record<LeagueId, ResultsData>> = {};
const _po: Partial<Record<LeagueId, Record<string, Bracket>>> = {};

const meta = (lg: LeagueId = "nba"): Meta => (_meta[lg] ??= readData<Meta>("meta.json", lg));
const pool = (lg: LeagueId = "nba"): PoolPlayer[] => (_pool[lg] ??= readData<PoolPlayer[]>("pool.json", lg));
const games = (lg: LeagueId = "nba"): GamePlayer[] => (_games[lg] ??= readData<{ players: GamePlayer[] }>("games.json", lg).players);
const results = (lg: LeagueId = "nba"): ResultsData => (_results[lg] ??= readData<ResultsData>("results.json", lg));
const playoffs = (lg: LeagueId = "nba"): Record<string, Bracket> => {
  if (!_po[lg]) { try { _po[lg] = readData<Record<string, Bracket>>("playoffsBySeason.json", lg); } catch { _po[lg] = {}; } }
  return _po[lg] ?? {};
};

/** Deepest round a team reached, as a human label — derived from the real bracket. */
function playoffResult(b: Bracket | undefined, club: string): string {
  if (!b || !b.rounds?.length) return "";
  if (b.champion === club) return "Champions";
  if (b.runnerUp === club) return "Runner-up";
  // find the deepest round the club appears in as a participant
  let deepest = -1;
  b.rounds.forEach((rd, i) => {
    if (rd.series.some((s) => s.hi.team === club || s.lo.team === club)) deepest = i;
  });
  if (deepest < 0) return "Missed playoffs";
  const name = b.rounds[deepest].name;
  // they lost in this round (champion/runner-up handled above)
  if (name === "Conference Finals") return "Conf Finals";
  if (name === "Conference Semifinals") return "Conf Semis";
  if (name === "First Round") return "First Round";
  return name;
}

export interface Team { club: string; abbr: string; conf: string; div: string }

export function allTeams(league: LeagueId = "nba"): Team[] {
  const tm = meta(league).teamMeta || {};
  return Object.entries(tm).map(([club, m]) => ({ club, abbr: clubAbbr(club, league), conf: m.conf, div: m.div }))
    .sort((a, b) => a.club.localeCompare(b.club));
}
export function teamByAbbr(abbr: string, league: LeagueId = "nba"): Team | null {
  return allTeams(league).find((t) => t.abbr.toLowerCase() === String(abbr).toLowerCase()) ?? null;
}

/** Every player with a card for this franchise — best card per player. */
export function teamRoster(club: string, league: LeagueId = "nba") {
  const byPid = new Map<number, PoolPlayer & { slug: string }>();
  for (const c of pool(league)) {
    if (c.club !== club) continue;
    const cur = byPid.get(c.pid);
    if (!cur || c.rating > cur.rating) byPid.set(c.pid, { ...c, slug: slugify(c.name) });
  }
  return [...byPid.values()].sort((a, b) => b.rating - a.rating);
}

/** Career players whose primary franchise is this team (for leaderboards). */
export function teamLeaders(club: string, league: LeagueId = "nba"): (GamePlayer & { slug: string })[] {
  return games(league).filter((p) => p.club === club).map((p) => ({ ...p, slug: slugify(p.name) }));
}

/** Per-season record for the franchise (newest first). */
export function teamRecords(club: string, league: LeagueId = "nba") {
  const out: { season: string; w: number; l: number; pf: number; pa: number; rank: number; champ: boolean; finals: boolean; result: string }[] = [];
  const po = playoffs(league);
  for (const season of results(league).seasons) {
    const table = results(league).laddersBySeason[season] || [];
    const row = table.find((t) => t.club === club);
    if (!row) continue;
    const conf = table.filter((t) => t.conf === row.conf).sort((a, b) => b.w - a.w);
    const rank = conf.findIndex((t) => t.club === club) + 1;
    const b = po[season];
    out.push({ season, w: row.w, l: row.l, pf: row.pf, pa: row.pa, rank, champ: b?.champion === club, finals: b?.champion === club || b?.runnerUp === club, result: playoffResult(b, club) });
  }
  return out;
}

export function teamTitles(club: string, league: LeagueId = "nba"): string[] {
  return Object.entries(playoffs(league)).filter(([, b]) => b.champion === club).map(([s]) => s).sort();
}
