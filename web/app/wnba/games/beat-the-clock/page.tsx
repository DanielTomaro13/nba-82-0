import GameShell from "@/components/games/GameShell";
import BeatTheClock from "@/components/games/BeatTheClock";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Beat the Clock — name the WNBA scoring leaders",
  description: "Sixty seconds to name 30 of the season's top scorers. Type fast and beat your best.",
  path: "/wnba/games/beat-the-clock",
  keywords: ["WNBA scorers", "WNBA timed game", "name the WNBA players"],
});

export default function Page() {
  return (
    <GameShell
      league="wnba"
      slug="beat-the-clock"
      title="Beat the Clock"
      emoji="⏱️"
      intro="The clock starts the moment you do. Name as many of the season's top 30 scorers as you can in 60 seconds."
      howTo={[
        "Press start and begin typing player surnames or full names.",
        "A correct, not-yet-named scorer locks in instantly.",
        "Keep going until the 60 seconds run out.",
        "When time's up, see who you missed and beat your best score.",
      ]}
    >
      <BeatTheClock league="wnba" />
    </GameShell>
  );
}
