import { pageMeta } from "@/lib/seo";
import { readDataSafe } from "@/lib/serverdata";
import type { Results } from "@/lib/data";
import FixturesView from "@/components/FixturesView";
import AdUnit from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";

const EMPTY_RESULTS: Results = { seasons: [], bySeason: {}, laddersBySeason: {} };

export const metadata = pageMeta({
  title: "WNBA Schedule & Results",
  description: "Every completed WNBA game grouped by week, with real scores. Browse results season by season.",
  path: "/wnba/fixtures",
  keywords: ["WNBA schedule", "WNBA results", "WNBA scores"],
});

export default function WnbaFixturesPage() {
  const results = readDataSafe<Results>("results.json", EMPTY_RESULTS, "wnba");
  const hasData = results.seasons.length > 0;
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Schedule &amp; Results</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>Completed WNBA games by week, with real scores.</p>
      </header>
      {hasData ? <FixturesView league="wnba" /> : (
        <div className="card" style={{ padding: "1.5rem", color: "var(--muted)" }}>
          WNBA results arrive once the season pipeline has run.
        </div>
      )}
      <AdUnit slot={AD_SLOTS.result} />
    </div>
  );
}
