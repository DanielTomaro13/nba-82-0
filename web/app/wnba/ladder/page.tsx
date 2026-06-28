import { pageMeta } from "@/lib/seo";
import { readDataSafe } from "@/lib/serverdata";
import type { Meta } from "@/lib/types";
import { getLeague } from "@/lib/league";
import LadderView from "@/components/LadderView";
import AdUnit from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";

const lg = getLeague("wnba");
const FALLBACK_META: Meta = { generatedAt: "", seasons: [], latestSeason: "", clubs: [], clubsBySeason: {} };
const wnbaMeta = () => readDataSafe<Meta>("meta.json", FALLBACK_META, "wnba");

export function generateMetadata() {
  const m = wnbaMeta();
  const range = m.seasons.length ? `${m.seasons[m.seasons.length - 1]}–${m.latestSeason}` : "";
  return pageMeta({
    title: m.latestSeason ? `WNBA Standings — ${m.latestSeason} standings` : "WNBA Standings",
    description: `The ${lg.short} standings, built from real game results — wins, losses, win percentage and point differential.${range ? ` Covering ${range}.` : ""}`,
    path: "/wnba/ladder",
    keywords: ["WNBA standings", "WNBA table", "WNBA win-loss"],
  });
}

export default function WnbaLadderPage() {
  const m = wnbaMeta();
  const hasData = m.seasons.length > 0;
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>WNBA Standings</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>
          {hasData
            ? `Standings for every season ${m.seasons[m.seasons.length - 1]}–${m.latestSeason}, computed from real game results.`
            : "Standings computed from real game results."}
        </p>
      </header>
      {hasData ? <LadderView league="wnba" /> : (
        <div className="card" style={{ padding: "1.5rem", color: "var(--muted)" }}>
          WNBA standings arrive once the season pipeline has run.
        </div>
      )}
      <AdUnit slot={AD_SLOTS.result} />
    </div>
  );
}
