import { pageMeta } from "@/lib/seo";
import Compare from "@/components/Compare";
import AdUnit from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";

export const metadata = pageMeta({
  title: "Compare NBA Players — head-to-head stats",
  description: "Compare any two NBA players side by side: points, rebounds, assists, shooting splits, true shooting, usage and player impact — built from real NBA data.",
  path: "/compare",
  keywords: ["compare NBA players", "NBA player comparison", "NBA head to head stats", "NBA stats compare"],
});

export default function ComparePage() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Compare Players</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>Pick any two players to see their career numbers head-to-head.</p>
      </header>
      <Compare />
      <AdUnit slot={AD_SLOTS.result} />
    </div>
  );
}
