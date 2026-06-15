/**
 * Build-time team database (server only) — derived entirely from the generated
 * datasets (meta, pool, games, results, playoffsBySeason). No hardcoded team
 * facts beyond conference/division (which live in meta from the API).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { clubAbbr } from "@/lib/clubs";
import { slugify } from "@/lib/format";
import type { GamePlayer } from "@/lib/games-data";
import type { Meta, PoolPlayer } from "@/lib/types";
import type { LadderRow } from "@/lib/data";

function read<T>(file: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), "public", "data", file), "utf8")) as T;
}
type ResultsData = { laddersBySeason: Record<string, LadderRow[]>; seasons: string[] };
let _meta: Meta | null = null;
let _pool: PoolPlayer[] | null = null;
let _games: GamePlayer[] | null = null;
let _results: ResultsData | null = null;
interface BracketSeries { conf: string; hi: { team: string }; lo: { team: string }; winner: string; loserTeam: string; score: string }
interface Bracket { champion: string; runnerUp?: string; rounds: { name: string; series: BracketSeries[] }[] }
let _po: Record<string, Bracket> | null = null;

const meta = (): Meta => (_meta ??= read<Meta>("meta.json"));
const pool = (): PoolPlayer[] => (_pool ??= read<PoolPlayer[]>("pool.json"));
const games = (): GamePlayer[] => (_games ??= read<{ players: GamePlayer[] }>("games.json").players);
const results = (): ResultsData => (_results ??= read<ResultsData>("results.json"));
const playoffs = (): Record<string, Bracket> => {
  if (!_po) { try { _po = read<Record<string, Bracket>>("playoffsBySeason.json"); } catch { _po = {}; } }
  return _po ?? {};
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

export function allTeams(): Team[] {
  const tm = meta().teamMeta || {};
  return Object.entries(tm).map(([club, m]) => ({ club, abbr: clubAbbr(club), conf: m.conf, div: m.div }))
    .sort((a, b) => a.club.localeCompare(b.club));
}
export function teamByAbbr(abbr: string): Team | null {
  return allTeams().find((t) => t.abbr.toLowerCase() === String(abbr).toLowerCase()) ?? null;
}

/** Every player with a card for this franchise — best card per player. */
export function teamRoster(club: string) {
  const byPid = new Map<number, PoolPlayer & { slug: string }>();
  for (const c of pool()) {
    if (c.club !== club) continue;
    const cur = byPid.get(c.pid);
    if (!cur || c.rating > cur.rating) byPid.set(c.pid, { ...c, slug: slugify(c.name) });
  }
  return [...byPid.values()].sort((a, b) => b.rating - a.rating);
}

/** Career players whose primary franchise is this team (for leaderboards). */
export function teamLeaders(club: string): (GamePlayer & { slug: string })[] {
  return games().filter((p) => p.club === club).map((p) => ({ ...p, slug: slugify(p.name) }));
}

/** Per-season record for the franchise (newest first). */
export function teamRecords(club: string) {
  const out: { season: string; w: number; l: number; pf: number; pa: number; rank: number; champ: boolean; finals: boolean; result: string }[] = [];
  const po = playoffs();
  for (const season of results().seasons) {
    const table = results().laddersBySeason[season] || [];
    const row = table.find((t) => t.club === club);
    if (!row) continue;
    const conf = table.filter((t) => t.conf === row.conf).sort((a, b) => b.w - a.w);
    const rank = conf.findIndex((t) => t.club === club) + 1;
    const b = po[season];
    out.push({ season, w: row.w, l: row.l, pf: row.pf, pa: row.pa, rank, champ: b?.champion === club, finals: b?.champion === club || b?.runnerUp === club, result: playoffResult(b, club) });
  }
  return out;
}

export function teamTitles(club: string): string[] {
  return Object.entries(playoffs()).filter(([, b]) => b.champion === club).map(([s]) => s).sort();
}
