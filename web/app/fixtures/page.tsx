import { pageMeta } from "@/lib/seo";
import FixturesView from "@/components/FixturesView";
import AdUnit from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";

export const metadata = pageMeta({
  title: "NBA Schedule & Results",
  description: "Every completed NBA game grouped by week, with real scores. Browse results season by season.",
  path: "/fixtures",
  keywords: ["NBA schedule", "NBA results", "NBA scores"],
});

export default function FixturesPage() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Schedule &amp; Results</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>Completed NBA games by week, with real scores.</p>
      </header>
      <FixturesView />
      <AdUnit slot={AD_SLOTS.result} />
    </div>
  );
}
