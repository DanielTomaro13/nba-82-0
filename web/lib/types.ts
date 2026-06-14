/** Game engine types for the Perfect-Season draft (/play). */

export interface PoolPlayer {
  id: string;
  pid: number;
  name: string;
  club: string;       // NBA franchise (full name, e.g. "Los Angeles Lakers")
  era: string;        // the decade / season label the card belongs to
  pos: string;        // PG | SG | SF | PF | C (primary)
  posName: string;
  elig: string[];     // every position the player genuinely played
  rating: number;
  g: number;          // games that season / span
  pts: number;        // points per game
  reb: number;        // rebounds per game
  ast: number;        // assists per game
  stl: number;        // steals per game
  blk: number;        // blocks per game
  fg3: number;        // three-pointers made per game
  fgPct?: number;     // field-goal %
  fg3Pct?: number;    // three-point %
  ftPct?: number;     // free-throw %
  mpg?: number;       // minutes per game
}

export interface Meta {
  generatedAt: string;
  seasons: string[];
  latestSeason: string;
  clubs: string[];
  clubsBySeason: Record<string, string[]>;
  teamMeta?: Record<string, { conf: string; div: string }>;
  divisions?: Record<string, Record<string, string[]>>;
  playoffsActive?: boolean;
}

export type Mode = "quick" | "classic" | "full17" | "cap" | "gauntlet" | "spoon";

export interface Slot {
  code: string; // a position code, or "INT" for the bench (any player)
  n: number;    // roster number
}

const STARTING_5: Slot[] = [
  { code: "PG", n: 1 }, { code: "SG", n: 2 }, { code: "SF", n: 3 },
  { code: "PF", n: 4 }, { code: "C", n: 5 },
];

// Starting five plus one bench spot (the 6th man).
const STARTING_6: Slot[] = [
  ...STARTING_5,
  { code: "INT", n: 6 },
];

const ROTATION_8: Slot[] = [
  ...STARTING_5,
  { code: "INT", n: 6 }, { code: "INT", n: 7 }, { code: "INT", n: 8 },
];

const ROSTER_13: Slot[] = [
  ...STARTING_5,
  { code: "INT", n: 6 }, { code: "INT", n: 7 }, { code: "INT", n: 8 },
  { code: "INT", n: 9 }, { code: "INT", n: 10 }, { code: "INT", n: 11 },
  { code: "INT", n: 12 }, { code: "INT", n: 13 },
];

export const SQUADS: Record<Mode, Slot[]> = {
  quick: STARTING_6,
  classic: ROTATION_8,
  full17: ROSTER_13,
  cap: ROSTER_13,
  gauntlet: ROTATION_8,
  spoon: STARTING_5,
};

export const REROLLS: Record<Mode, { club: number; era: number }> = {
  quick: { club: 1, era: 1 },
  classic: { club: 1, era: 1 },
  full17: { club: 2, era: 2 },
  cap: { club: 2, era: 2 },
  gauntlet: { club: 1, era: 1 },
  spoon: { club: 1, era: 1 },
};

export const MODE_INFO: Record<Mode, { name: string; tag: string; desc: string }> = {
  quick: { name: "Starting Six", tag: "the spine", desc: "One player for each of the five positions plus a bench spot — your 6th man. Versatile bench players get a small boost." },
  classic: { name: "Rotation Eight", tag: "the core", desc: "The starting five plus a three-man bench that takes any player. The unit that wins playoff games." },
  full17: { name: "Active Thirteen", tag: "deep bench", desc: "The full game-day 13: a starting five plus an eight-man bench. Depth wins championships." },
  cap: { name: "Salary Cap 13", tag: "hard mode", desc: "Build a 13-man roster under the salary cap. Superstars cost a fortune — spend like a GM." },
  gauntlet: { name: "The Gauntlet", tag: "survival", desc: "Draft an eight-man rotation, then beat every season's champion head-to-head. Lose once and the run is over." },
  spoon: { name: "The Tank", tag: "anti-ball", desc: "Build the worst starting five imaginable and chase a perfect 0–82. Harder than it sounds." },
};

/** A versatile player coming off the bench (an INT slot) gets a small boost. */
export const BENCH_BOOST = 1.05;
export function effectiveRating(p: { rating: number; elig?: string[] }, isBench: boolean): number {
  if (isBench && (p.elig?.length ?? 1) > 1) return Math.min(99, Math.round(p.rating * BENCH_BOOST));
  return p.rating;
}

/** Salary cap mode — a player's price ($) modelled off their rating. */
export const SALARY_CAP = 165_000_000;
export function salaryFor(rating: number): number {
  const t = Math.max(0, (rating - 60) / 39); // 0..1
  return Math.round((2_000_000 + Math.pow(t, 2.3) * 53_000_000) / 100_000) * 100_000;
}

/** Does a player fit a slot? INT slots take anyone. */
export function fitsSlot(slot: Slot, posCode: string): boolean {
  return slot.code === "INT" || slot.code === posCode;
}
