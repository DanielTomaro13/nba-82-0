import { pageMeta } from "@/lib/seo";
import { serverMeta } from "@/lib/serverdata";
import LadderView from "@/components/LadderView";
import AdUnit from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";

export function generateMetadata() {
  const m = serverMeta();
  return pageMeta({
    title: `NBA Standings — ${m.latestSeason} standings`,
    description: `The ${m.latestSeason} NBA standings and every season back to ${m.seasons[m.seasons.length - 1]}, built from real game results — wins, losses, win percentage and point differential.`,
    path: "/ladder",
    keywords: ["NBA standings", "NBA table", "NBA win-loss"],
  });
}

export default function LadderPage() {
  const m = serverMeta();
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>NBA Standings</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>
          Standings for every season {m.seasons[m.seasons.length - 1]}–{m.latestSeason}, computed from real game results.
        </p>
      </header>
      <LadderView />
      <AdUnit slot={AD_SLOTS.result} />
    </div>
  );
}
