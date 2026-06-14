/** The mini-game catalogue — shared by the home page and the /games hub. */
export interface GameDef {
  slug: string;
  title: string;
  emoji: string;
  blurb: string;
  tag: string;
}

export const GAMES: GameDef[] = [
  { slug: "invincibles", title: "Invincibles", emoji: "🏆", blurb: "Draft a starting five and simulate a whole season. Go 82-0.", tag: "Endless" },
  { slug: "footle", title: "Hoople", emoji: "🟧", blurb: "Guess the mystery NBA player in 8 tries.", tag: "Daily" },
  { slug: "higher-or-lower", title: "Higher or Lower", emoji: "📈", blurb: "More points, boards, dimes or games? Keep the streak alive.", tag: "Endless" },
  { slug: "guess-the-player", title: "Guess the Player", emoji: "🕵️", blurb: "Seven clues, one player. Solve it early for more points.", tag: "Daily" },
  { slug: "career-path", title: "Career Path", emoji: "🧭", blurb: "Read the profile, pick the right legend from four.", tag: "Quiz" },
  { slug: "beat-the-clock", title: "Beat the Clock", emoji: "⏱️", blurb: "Name 30 of the all-time scoring leaders in 60 seconds.", tag: "Timed" },
  { slug: "score-predictor", title: "Score Predictor", emoji: "🔮", blurb: "Predict real NBA results. Exact scoreline scores big.", tag: "Predict" },
];

export const gameBySlug = (slug: string) => GAMES.find((g) => g.slug === slug);
