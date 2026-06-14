/**
 * Season simulator — the difficulty engine.
 *
 * A drafted squad no longer maps deterministically to a record. Instead its
 * average rating sets a per-game win probability, and the headline result is a
 * single freshly-rolled 82-game season. Going a perfect 82–0 is deliberately
 * rare: even a maxed-out, all-99 starting five only runs the table ~5% of the
 * time, so a perfect season is a genuine, brag-worthy event rather than the
 * default outcome of drafting good players.
 *
 *   • baseWinRate(avg, mode) — per-game win probability for a squad.
 *   • simulateSeason()       — Monte-Carlo over `runs` seasons for the win
 *     distribution + true 82–0 odds, PLUS one fresh random "headline" season
 *     that is the actual W–L the player gets this attempt.
 *
 * Opponent strengths are sampled from real per-season team records
 * (public/data/strengths.json) for colour and variance.
 */

export const SEASON_GAMES = 82;

/**
 * Win-rate calibration. The best *draftable* starting five averages ~97.4
 * (Jordan 99, LeBron 98, Magic/Jokić 97, Giannis 96). We anchor the per-game
 * win rate so that lineup sits at ~0.967 — and 0.967^82 ≈ 0.05, so even the
 * single best team a player can assemble only runs the table about 1 attempt in
 * 20. Everything below it falls away fast: a merely "great" 95-avg squad wins
 * ~70 games but essentially never goes perfect.
 */
const WIN_PIVOT_AVG = 85;     // a 48-win, play-in-level squad
const WIN_PIVOT_RATE = 0.55;
const WIN_SLOPE = 0.0336;     // win-rate gained per rating point
const WIN_CAP = 0.975;
const TANK_FLOOR = 0.035;     // best-case tank → ~5% chance of an 0–82 season

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
    // Tank mode inverts: the *worse* the squad the closer to a winless season.
    // The realistically-worst achievable starting five (~82 avg) bottoms out at
    // the tank floor so it goes 0–82 about 5% of the time; anything better
    // wins too often to ever run the table in reverse.
    const qLo = clamp01((90 - avg) / 8);
    return clamp(WIN_CAP - (WIN_CAP - TANK_FLOOR) * qLo, TANK_FLOOR, WIN_CAP);
  }
  return clamp(WIN_PIVOT_RATE + WIN_SLOPE * (avg - WIN_PIVOT_AVG), 0.05, WIN_CAP);
}

/** Deterministic expected record — kept for any callers that want the average. */
export function recordFromRating(avg: number, mode?: string): { wins: number; losses: number } {
  const wins = Math.round(baseWinRate(avg, mode) * SEASON_GAMES);
  return { wins, losses: SEASON_GAMES - wins };
}

export function verdict(wins: number): { t: string; s: string; tone?: string } {
  if (wins >= 82) return { t: "PERFECT SEASON", s: "82–0. Immortal. Nobody laid a glove on you.", tone: "perfect" };
  if (wins >= 73) return { t: "ALL-TIME GREAT", s: "One of the best regular seasons ever assembled — and still not flawless." };
  if (wins >= 64) return { t: "CHAMPIONSHIP FAVOURITE", s: "Best record in the league and the clear title favourite." };
  if (wins >= 55) return { t: "TITLE CONTENDER", s: "A top seed with home court and a real shot at the ring." };
  if (wins >= 46) return { t: "PLAYOFF LOCK", s: "Comfortably in the postseason. Anything can happen in April." };
  if (wins >= 38) return { t: "PLAY-IN HOPEFUL", s: "Scrapping for the 7–10 seeds. One hot week from the dance." };
  if (wins >= 20) return { t: "LOTTERY TEAM", s: "Flashes of talent, ping-pong balls in the future." };
  if (wins >= 1) return { t: "TANKING", s: "Long season. The front office is already mock-drafting." };
  return { t: "WINLESS", s: "0–82. A perfectly, gloriously terrible team.", tone: "spoon" };
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

function playSeason(base: number, opp: number[], rand: () => number): number {
  let wins = 0;
  for (let g = 0; g < SEASON_GAMES; g++) {
    const o = opp[Math.floor(rand() * opp.length)];
    if (rand() < gameProb(base, o)) wins++;
  }
  return wins;
}

export interface SimOpts { mode?: string; seed?: number; runs?: number; headlineSeed?: number }

export function simulateSeason(
  avg: number,
  strengthPool: number[],
  opts: SimOpts = {}
): SimResult {
  const base = baseWinRate(avg, opts.mode);
  const opp = normalise(strengthPool);
  const runs = opts.runs ?? 5000;

  // Statistical pass: a fixed seed so the odds/distribution are stable.
  const statRand = mulberry32(opts.seed ?? 0x9e3779b9);
  const dist = new Array(SEASON_GAMES + 1).fill(0);
  let perfect = 0, spoon = 0;
  for (let r = 0; r < runs; r++) {
    const w = playSeason(base, opp, statRand);
    dist[w]++;
    if (w === SEASON_GAMES) perfect++;
    if (w === 0) spoon++;
  }

  // Headline season: a fresh roll, so each completed draft is a real attempt.
  const headSeed = (opts.headlineSeed ?? (Math.floor(Math.random() * 0x7fffffff) >>> 0)) || 1;
  const wins = playSeason(base, opp, mulberry32(headSeed));

  const me = qualityFromRating(avg);
  const below = opp.filter((o) => o < me).length;
  return {
    wins,
    losses: SEASON_GAMES - wins,
    perfectPct: (perfect / runs) * 100,
    spoonPct: (spoon / runs) * 100,
    realPercentile: Math.round((below / opp.length) * 100),
    distribution: dist.map((c) => c / runs),
  };
}
