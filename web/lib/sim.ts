/**
 * Season simulator.
 *
 * A drafted team's average rating drives a per-game win chance, and the
 * headline result is a single freshly-played 82-game season. A perfect 82–0 is
 * intentionally hard to reach, so it stays a genuine achievement rather than
 * the default outcome of drafting good players.
 */

/** Default season length (NBA). WNBA callers pass `games` / `opts.games`. */
export const SEASON_GAMES = 82;

// Internal tuning for the win-chance curve and the season roll.
const WIN_PIVOT_AVG = 85;
const WIN_PIVOT_RATE = 0.55;
const WIN_SLOPE = 0.0336;
const WIN_CAP = 0.975;
const TANK_FLOOR = 0.035;

export interface SimResult {
  wins: number;
  losses: number;
  perfectPct: number;       // % of simulated seasons that finished 82–0
  spoonPct: number;         // % that finished 0–82
  realPercentile: number;   // 0–100 vs real NBA team strengths
  distribution: number[];   // index = wins (0..82) -> share 0..1
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const clamp01 = (x: number) => clamp(x, 0, 1);

/** Per-game win probability for a squad of the given average rating + mode. */
export function baseWinRate(avg: number, mode?: string): number {
  if (mode === "spoon") {
    // Tank mode inverts: the worse the team, the closer to a winless season.
    const qLo = clamp01((90 - avg) / 8);
    return clamp(WIN_CAP - (WIN_CAP - TANK_FLOOR) * qLo, TANK_FLOOR, WIN_CAP);
  }
  return clamp(WIN_PIVOT_RATE + WIN_SLOPE * (avg - WIN_PIVOT_AVG), 0.05, WIN_CAP);
}

/** Deterministic expected record — kept for any callers that want the average. */
export function recordFromRating(avg: number, mode?: string, games: number = SEASON_GAMES): { wins: number; losses: number } {
  const wins = Math.round(baseWinRate(avg, mode) * games);
  return { wins, losses: games - wins };
}

/**
 * Season verdict. Tier thresholds scale to the season length, so the same copy
 * works for an 82-game NBA season and a 44-game WNBA season.
 */
export function verdict(wins: number, games: number = SEASON_GAMES): { t: string; s: string; tone?: string } {
  const f = games / 82; // scale the NBA tiers to this league's season length
  if (wins >= games) return { t: "PERFECT SEASON", s: `${games}–0. Immortal. Nobody laid a glove on you.`, tone: "perfect" };
  if (wins >= Math.round(73 * f)) return { t: "ALL-TIME GREAT", s: "One of the best regular seasons ever assembled — and still not flawless." };
  if (wins >= Math.round(64 * f)) return { t: "CHAMPIONSHIP FAVOURITE", s: "Best record in the league and the clear title favourite." };
  if (wins >= Math.round(55 * f)) return { t: "TITLE CONTENDER", s: "A top seed with home court and a real shot at the ring." };
  if (wins >= Math.round(46 * f)) return { t: "PLAYOFF LOCK", s: "Comfortably in the postseason. Anything can happen come playoff time." };
  if (wins >= Math.round(38 * f)) return { t: "PLAYOFF HOPEFUL", s: "Scrapping for the final seeds. One hot week from the dance." };
  if (wins >= Math.round(20 * f)) return { t: "LOTTERY TEAM", s: "Flashes of talent, ping-pong balls in the future." };
  if (wins >= 1) return { t: "TANKING", s: "Long season. The front office is already mock-drafting." };
  return { t: "WINLESS", s: `0–${games}. A perfectly, gloriously terrible team.`, tone: "spoon" };
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Squad quality in 0–1 for the real-strength percentile. */
export function qualityFromRating(avg: number): number {
  return clamp01((avg - 72) / (99 - 72));
}

/** Min-max normalise a strength distribution into 0–1 opponent qualities. */
function normalise(values: number[]): number[] {
  if (!values.length) return [0.3, 0.5, 0.7];
  const lo = Math.min(...values), hi = Math.max(...values);
  const span = hi - lo || 1;
  return values.map((v) => 0.15 + 0.7 * ((v - lo) / span));
}

/** One game's win probability, nudged by the opponent's strength. */
function gameProb(base: number, opp: number): number {
  return clamp(base + 0.12 * (0.5 - opp), 0.02, 0.99);
}

function playSeason(base: number, opp: number[], rand: () => number, games: number): number {
  let wins = 0;
  for (let g = 0; g < games; g++) {
    const o = opp[Math.floor(rand() * opp.length)];
    if (rand() < gameProb(base, o)) wins++;
  }
  return wins;
}

export interface SimOpts { mode?: string; seed?: number; runs?: number; headlineSeed?: number; games?: number }

export function simulateSeason(
  avg: number,
  strengthPool: number[],
  opts: SimOpts = {}
): SimResult {
  const games = opts.games ?? SEASON_GAMES;
  const base = baseWinRate(avg, opts.mode);
  const opp = normalise(strengthPool);
  const runs = opts.runs ?? 5000;

  // Statistical pass: a fixed seed so the odds/distribution are stable.
  const statRand = mulberry32(opts.seed ?? 0x9e3779b9);
  const dist = new Array(games + 1).fill(0);
  let perfect = 0, spoon = 0;
  for (let r = 0; r < runs; r++) {
    const w = playSeason(base, opp, statRand, games);
    dist[w]++;
    if (w === games) perfect++;
    if (w === 0) spoon++;
  }

  // Headline season: a fresh roll, so each completed draft is a real attempt.
  const headSeed = (opts.headlineSeed ?? (Math.floor(Math.random() * 0x7fffffff) >>> 0)) || 1;
  const wins = playSeason(base, opp, mulberry32(headSeed), games);

  const me = qualityFromRating(avg);
  const below = opp.filter((o) => o < me).length;
  return {
    wins,
    losses: games - wins,
    perfectPct: (perfect / runs) * 100,
    spoonPct: (spoon / runs) * 100,
    realPercentile: Math.round((below / opp.length) * 100),
    distribution: dist.map((c) => c / runs),
  };
}
