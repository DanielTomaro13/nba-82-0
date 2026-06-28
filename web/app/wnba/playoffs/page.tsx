import { pageMeta } from "@/lib/seo";
import { readDataSafe } from "@/lib/serverdata";
import type { Playoffs } from "@/lib/data";
import PlayoffsView from "@/components/PlayoffsView";
import AdUnit from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";

const EMPTY_PLAYOFFS: Playoffs = {
  season: "", active: false, champion: "", rounds: [], seeds: {},
};
const wnbaPlayoffs = () => readDataSafe<Playoffs>("playoffs.json", EMPTY_PLAYOFFS, "wnba");

export function generateMetadata() {
  const po = wnbaPlayoffs();
  return pageMeta({
    title: po.season ? `WNBA Playoffs ${po.season} — bracket & results` : "WNBA Playoffs — bracket & results",
    description: po.champion
      ? `The ${po.season} WNBA playoff bracket: every series from the first round to the Finals. ${po.champion} are champions.`
      : "The WNBA playoff bracket: every series from the first round to the Finals.",
    path: "/wnba/playoffs",
    keywords: ["WNBA playoffs", "WNBA playoff bracket", "WNBA Finals", po.season ? `${po.season} playoffs` : "WNBA playoffs"],
  });
}

export default function WnbaPlayoffsPage() {
  const po = wnbaPlayoffs();
  const hasData = po.rounds.length > 0;
  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>WNBA Playoffs</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>
          Real playoff brackets — every series, winner and score from the WNBA Stats API.
        </p>
      </header>
      {hasData ? <PlayoffsView initial={po} league="wnba" /> : (
        <div className="card" style={{ padding: "1.5rem", color: "var(--muted)" }}>
          The WNBA playoff bracket arrives once the season pipeline has run.
        </div>
      )}
      <AdUnit slot={AD_SLOTS.result} />
    </div>
  );
}
