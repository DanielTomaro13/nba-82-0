import GameShell from "@/components/games/GameShell";
import ScorePredictor from "@/components/games/ScorePredictor";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Score Predictor — call real WNBA results",
  description: "Predict the scoreline of ten real WNBA matches. Nail the exact result for big points, get the winner right for a few.",
  path: "/wnba/games/score-predictor",
  keywords: ["WNBA score predictor", "WNBA tipping", "predict WNBA results"],
});

export default function Page() {
  return (
    <GameShell
      league="wnba"
      slug="score-predictor"
      title="Score Predictor"
      emoji="🔮"
      intro="Ten real WNBA matches, hidden results. Set your predicted scoreline for each, lock it in and see how sharp your hoops brain is."
      howTo={[
        "Use the steppers to set a predicted score for the home and away team.",
        "Lock in your prediction to reveal the real result.",
        "Exact scoreline scores 5 points; the right winner (or a drawn tip) scores 2.",
        "Add up your score across all ten matches.",
      ]}
    >
      <ScorePredictor league="wnba" />
    </GameShell>
  );
}
