import GameShell from "@/components/games/GameShell";
import EfficiencyDuel from "@/components/games/EfficiencyDuel";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Efficiency Duel — NBA advanced-stat streak game",
  description: "Two NBA players, one advanced stat. Who had the higher true shooting %, usage rate or player impact (PIE)? Keep the streak alive with real NBA data.",
  path: "/games/efficiency-duel",
  keywords: ["NBA efficiency", "true shooting", "NBA advanced stats game", "PIE", "usage rate"],
});

export default function Page() {
  return (
    <GameShell
      slug="efficiency-duel"
      title="Efficiency Duel"
      emoji="🎯"
      intro="Counting stats are easy — efficiency is the real test. Two players, one advanced metric: who was better? Each correct call extends your streak; one miss ends the run."
      howTo={[
        "A metric is chosen at random: true shooting %, usage rate or player impact (PIE).",
        "Decide whether the challenger's number is higher or lower than the player shown.",
        "Guess right and the challenger becomes the new benchmark.",
        "One wrong call ends the game — chase your best streak.",
      ]}
    >
      <EfficiencyDuel />
    </GameShell>
  );
}
