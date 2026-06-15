import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { allPlayers, type ProfilePlayer } from "@/lib/playerdb";
import { clubColors } from "@/lib/clubs";
import SeasonLeaders from "@/components/SeasonLeaders";
import AdUnit from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";

export const metadata = pageMeta({
  title: "NBA Stat Leaders — points, rebounds, assists & more",
  description: "Per-season and career per-game leaders across the dataset: points, rebounds, assists, steals, blocks, threes, true shooting and more. Built from real NBA box-score data.",
  path: "/stats",
  keywords: ["NBA stats", "NBA scoring leaders", "NBA stat leaders", "most NBA points", "NBA season leaders"],
});

const BOARDS: { key: keyof ProfilePlayer; label: string; fmt?: (n: number) => string }[] = [
  { key: "pts", label: "Points / game" },
  { key: "reb", label: "Rebounds / game" },
  { key: "ast", label: "Assists / game" },
  { key: "blk", label: "Blocks / game" },
  { key: "apps", label: "Most Games" },
  { key: "rating", label: "Top Rated" },
];

export default function StatsPage() {
  const players = allPlayers();
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Stat Leaders</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>Per-season and career leaders, from real NBA match stats.</p>
        <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <Link href="/compare" className="btn" style={{ minHeight: 36, padding: ".4rem .8rem", fontSize: ".82rem" }}>⚖️ Compare players</Link>
          <Link href="/glossary" className="btn" style={{ minHeight: 36, padding: ".4rem .8rem", fontSize: ".82rem" }}>📖 Stats glossary</Link>
        </div>
      </header>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Single-season leaders</h2>
        <SeasonLeaders />
      </section>

      <h2 style={{ margin: "0.5rem 0 0", fontSize: "1.2rem" }}>Career leaders</h2>
      <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
        {BOARDS.map((b) => {
          const top = [...players].sort((a, b2) => (b2[b.key] as number) - (a[b.key] as number)).slice(0, 10);
          return (
            <div key={b.key} className="card" style={{ padding: "1rem" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: "1rem" }}>{b.label}</h2>
              <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
                {top.map((p, i) => {
                  const [c1] = clubColors(p.club);
                  return (
                    <li key={p.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".86rem" }}>
                      <span style={{ width: 16, color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: ".75rem" }}>{i + 1}</span>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: c1, flexShrink: 0 }} />
                      <Link href={`/players/${p.id}/${p.slug}`} style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</Link>
                      <span style={{ fontFamily: "var(--font-cond)", color: "var(--gold)" }}>{p[b.key] as number}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
      <AdUnit slot={AD_SLOTS.result} />
    </div>
  );
}
