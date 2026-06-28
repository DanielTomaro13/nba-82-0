import GameShell from "@/components/games/GameShell";
import DraftClass from "@/components/games/DraftClass";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Draft Class — guess the WNBA draft pick",
  description: "Draft position, year, college and country are the clues. Name the player from four options and build your streak. Real WNBA draft data.",
  path: "/wnba/games/draft-class",
  keywords: ["WNBA draft game", "WNBA draft quiz", "guess the draft pick", "WNBA draft history"],
});

export default function Page() {
  return (
    <GameShell
      league="wnba"
      slug="draft-class"
      title="Draft Class"
      emoji="🎓"
      intro="Where they were picked, what year, which college — that's all you get. Name the player from four options. One miss ends the run."
      howTo={[
        "You're shown a real draft slot: overall pick, year, round, college and country.",
        "Pick the player who was drafted there from the four options.",
        "Distractors often come from the same draft class — read every clue.",
        "Each correct answer extends your streak; one wrong answer ends it.",
      ]}
    >
      <DraftClass league="wnba" />
    </GameShell>
  );
}
