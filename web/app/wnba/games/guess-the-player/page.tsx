import GameShell from "@/components/games/GameShell";
import GuessThePlayer from "@/components/games/GuessThePlayer";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Guess the Player — daily seven-clue WNBA puzzle",
  description: "Seven clues, one WNBA player. Solve it on the first clue for a perfect score. A new mystery player every day.",
  path: "/wnba/games/guess-the-player",
  keywords: ["guess the WNBA player", "WNBA clue game", "daily WNBA puzzle"],
});

export default function Page() {
  return (
    <GameShell
      league="wnba"
      slug="guess-the-player"
      title="Guess the Player"
      emoji="🕵️"
      intro="Seven clues stand between you and today's mystery WNBA player. Solve it early for a bigger score — every extra clue and wrong guess costs you points."
      howTo={[
        "Start with one clue and guess any time.",
        "Reveal another clue for −14 points, or guess and miss for −8 (which also reveals the next clue).",
        "Solve on the first clue for a perfect 100.",
        "One puzzle a day — keep your daily streak going.",
      ]}
    >
      <GuessThePlayer league="wnba" />
    </GameShell>
  );
}
