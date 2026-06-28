import { pageMeta } from "@/lib/seo";
import { getLeague } from "@/lib/league";
import PerfectSeasonGame from "@/components/PerfectSeasonGame";

const lg = getLeague("wnba");

export const metadata = pageMeta({
  title: `Play Perfect Season — draft an all-time ${lg.short} team`,
  description:
    `Spin for a ${lg.short} club and era, draft a legend into every position and chase a flawless ${lg.perfectLabel} season. Five modes: Starting Five, Rotation Eight, Active Thirteen, Salary Cap, Gauntlet and The Tank.`,
  path: "/wnba/play",
  keywords: ["WNBA draft game", "perfect season", "WNBA team builder", `${lg.perfectLabel} game`],
});

export default function WnbaPlayPage() {
  return <PerfectSeasonGame league="wnba" />;
}
