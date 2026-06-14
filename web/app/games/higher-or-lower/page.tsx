import GameShell from "@/components/games/GameShell";
import HigherOrLower from "@/components/games/HigherOrLower";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Higher or Lower — NBA stat streak game",
  description: "Two NBA players, one hidden stat. Does the next player have more or fewer points, rebounds, assists or games? Keep the streak alive.",
  path: "/games/higher-or-lower",
  keywords: ["NBA higher or lower", "NBA stats game", "basketball streak game"],
});

export default function Page() {
  return (
    <GameShell
      slug="higher-or-lower"
      title="Higher or Lower"
      emoji="📈"
      intro="One stat, two players. Does the challenger have more or fewer than the player on the board? Each correct call extends your streak — one wrong answer ends the run."
      howTo={[
        "A stat is chosen at random: career points, rebounds, assists or games.",
        "Decide whether the challenger's number is higher or lower than the shown player.",
        "Guess right and the challenger becomes the new benchmark.",
        "One wrong call ends the game — chase your best streak.",
      ]}
    >
      <HigherOrLower />
    </GameShell>
  );
}
