import GameShell from "@/components/games/GameShell";
import InvinciblesGame from "@/components/games/InvinciblesGame";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Invincibles — draft a squad and simulate a season",
  description: "Spin clubs and seasons, draft a starting side and simulate a full 82-game NBA season thousands of times. Can you go undefeated?",
  path: "/games/invincibles",
  keywords: ["NBA squad builder", "NBA season simulator", "invincibles NBA"],
});

export default function Page() {
  return (
    <GameShell
      slug="invincibles"
      title="Invincibles"
      emoji="🏆"
      intro="Draft a starting side from across NBA history, then simulate a full season thousands of times. See your win distribution, your odds of going 82–0 and how you stack up against real contenders."
      howTo={[
        "Spin for a random club and season, then draft a player into each position.",
        "Fill all five positions to build your spine.",
        "Hit simulate to run thousands of 82-game seasons.",
        "Chase a perfect record and post it to the Hall of Fame.",
      ]}
    >
      <InvinciblesGame />
    </GameShell>
  );
}
