import GameShell from "@/components/games/GameShell";
import PerfectSeasonGame from "@/components/PerfectSeasonGame";
import { pageMeta } from "@/lib/seo";
import { getLeague } from "@/lib/league";

const lg = getLeague("wnba");

export const metadata = pageMeta({
  title: "Invincibles — draft a team and chase a perfect WNBA season",
  description: `Spin franchises and eras, draft a team onto the floor and play out a full ${lg.seasonGames}-game WNBA season. Can you go undefeated?`,
  path: "/wnba/games/invincibles",
  keywords: ["WNBA squad builder", "WNBA season simulator", "invincibles WNBA"],
});

export default function Page() {
  return (
    <GameShell
      league="wnba"
      slug="invincibles"
      title="Invincibles"
      emoji="🏆"
      intro={`Draft a team from across WNBA history onto the half-court, then play out a full ${lg.seasonGames}-game season. Go undefeated and you're immortal.`}
      howTo={[
        "Pick a mode, then spin for a random franchise and era.",
        "Draft a player into each spot on the floor — versatile players can cover more than one.",
        `Fill the lineup, then your team plays out a full ${lg.seasonGames}-game season.`,
        `Chase a flawless ${lg.perfectLabel} and post it to the Hall of Fame.`,
      ]}
    >
      <PerfectSeasonGame league="wnba" />
    </GameShell>
  );
}
