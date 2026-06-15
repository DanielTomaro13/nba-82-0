import { pageMeta } from "@/lib/seo";
import { serverPlayoffs } from "@/lib/serverdata";
import PlayoffsView from "@/components/PlayoffsView";

export function generateMetadata() {
  const po = serverPlayoffs();
  return pageMeta({
    title: `NBA Playoffs ${po.season} — bracket & results`,
    description: `The ${po.season} NBA playoff bracket: every series from the first round to the Finals, by conference. ${po.champion} are champions.`,
    path: "/playoffs",
    keywords: ["NBA playoffs", "NBA playoff bracket", "NBA Finals", `${po.season} playoffs`],
  });
}

export default function PlayoffsPage() {
  const po = serverPlayoffs();
  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>NBA Playoffs</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>
          Real playoff brackets — every series, winner and score from the NBA Stats API.
        </p>
      </header>
      <PlayoffsView initial={po} />
    </div>
  );
}
