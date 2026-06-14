import GameShell from "@/components/games/GameShell";
import PerfectSeasonGame from "@/components/PerfectSeasonGame";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Invincibles — draft a team and chase a perfect season",
  description: "Spin franchises and eras, draft a team onto the floor and play out a full 82-game NBA season. Can you go undefeated?",
  path: "/games/invincibles",
  keywords: ["NBA squad builder", "NBA season simulator", "invincibles NBA"],
});

export default function Page() {
  return (
    <GameShell
      slug="invincibles"
      title="Invincibles"
      emoji="🏆"
      intro="Draft a team from across NBA history onto the half-court, then play out a full 82-game season. Go undefeated and you're immortal."
      howTo={[
        "Pick a mode, then spin for a random franchise and era.",
        "Draft a player into each spot on the floor — versatile players can cover more than one.",
        "Fill the lineup, then your team plays out a full 82-game season.",
        "Chase a flawless 82-0 and post it to the Hall of Fame.",
      ]}
    >
      <PerfectSeasonGame />
    </GameShell>
  );
}
