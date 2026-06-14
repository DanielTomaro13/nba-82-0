import { pageMeta } from "@/lib/seo";
import PerfectSeasonGame from "@/components/PerfectSeasonGame";

export const metadata = pageMeta({
  title: "Play Perfect Season — draft an all-time NBA team",
  description:
    "Spin for an NBA club and era, draft a legend into every position and chase a flawless 82-0 season. Five modes: Starting Five, Rotation Eight, Active Thirteen, Salary Cap, Gauntlet and The Tank.",
  path: "/play",
  keywords: ["NBA draft game", "perfect season", "NBA team builder", "82-0 game"],
});

export default function PlayPage() {
  return <PerfectSeasonGame />;
}
