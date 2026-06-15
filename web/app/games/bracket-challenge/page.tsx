import GameShell from "@/components/games/GameShell";
import BracketChallenge from "@/components/games/BracketChallenge";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Bracket Challenge — predict a real NBA playoff bracket",
  description: "Fill out a real NBA playoff bracket from the first round to the Finals and score your picks against what actually happened. 30 real postseasons to play.",
  path: "/games/bracket-challenge",
  keywords: ["NBA bracket challenge", "NBA playoff predictor", "NBA bracket game", "predict NBA playoffs"],
});

export default function Page() {
  return (
    <GameShell
      slug="bracket-challenge"
      title="Bracket Challenge"
      emoji="🗂️"
      intro="A real NBA postseason, seeded exactly as it was. Pick every series winner from the first round to the Finals, then score your bracket against what actually happened."
      howTo={[
        "A season's playoff bracket loads with the real conference seeds.",
        "Click a team to advance them; later rounds fill in from your picks.",
        "Pick all the way to a champion, then lock it in.",
        "You score more for deeper rounds — correct Finals pick is worth the most.",
      ]}
    >
      <BracketChallenge />
    </GameShell>
  );
}
