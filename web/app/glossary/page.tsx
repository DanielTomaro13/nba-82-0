import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import AdUnit from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";

export const metadata = pageMeta({
  title: "NBA Stats Glossary — what every abbreviation means",
  description: "A plain-English glossary of NBA stat abbreviations: PPG, RPG, APG, TS%, USG%, PIE, net rating, plus/minus and more — and how to read them.",
  path: "/glossary",
  keywords: ["NBA stats glossary", "what is TS%", "what is PIE NBA", "NBA usage rate", "NBA net rating", "basketball stat abbreviations"],
});

const GROUPS: { title: string; items: { term: string; abbr: string; desc: string }[] }[] = [
  {
    title: "Box-score basics (per game)",
    items: [
      { term: "Points", abbr: "PTS / PPG", desc: "Points scored per game." },
      { term: "Rebounds", abbr: "REB / RPG", desc: "Total rebounds (offensive + defensive) per game." },
      { term: "Assists", abbr: "AST / APG", desc: "Passes that directly lead to a made basket, per game." },
      { term: "Steals", abbr: "STL / SPG", desc: "Times a player takes the ball from the opponent, per game." },
      { term: "Blocks", abbr: "BLK / BPG", desc: "Shots deflected by a defender, per game." },
      { term: "Turnovers", abbr: "TOV", desc: "Times a player loses the ball to the opponent, per game." },
      { term: "Minutes", abbr: "MPG", desc: "Minutes played per game — a proxy for how much a team leans on a player." },
    ],
  },
  {
    title: "Shooting",
    items: [
      { term: "Field goal %", abbr: "FG%", desc: "Share of all shot attempts (except free throws) that go in." },
      { term: "Three-point %", abbr: "3P%", desc: "Share of three-point attempts that go in." },
      { term: "Free throw %", abbr: "FT%", desc: "Share of free throws made." },
      { term: "Threes made", abbr: "3PM", desc: "Made three-pointers per game." },
    ],
  },
  {
    title: "Advanced (1996-97 onward)",
    items: [
      { term: "True shooting %", abbr: "TS%", desc: "Scoring efficiency that accounts for twos, threes and free throws in one number. ~58%+ is excellent." },
      { term: "Usage rate", abbr: "USG%", desc: "Share of a team's plays a player 'uses' (shot, free-throw trip or turnover) while on court. Stars sit around 28-35%." },
      { term: "Player impact estimate", abbr: "PIE", desc: "A player's share of the total statistical contribution in their games — a quick all-in-one value gauge. ~10% is average; 15%+ is a star." },
      { term: "Net rating", abbr: "NetRtg", desc: "Team point differential per 100 possessions while the player is on court (positive = team outscores opponents)." },
      { term: "Plus / minus", abbr: "+/−", desc: "How many points a team outscored (or was outscored by) the opponent while the player was on the floor." },
    ],
  },
  {
    title: "This site",
    items: [
      { term: "Rating", abbr: "—", desc: "Our 58–99 player rating, derived from real per-game production (points, rebounds, assists, steals, blocks and threes). Used to draft and grade teams." },
      { term: "Peak rating", abbr: "—", desc: "A player's best single-season rating across their career." },
    ],
  },
];

export default function GlossaryPage() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Stats Glossary</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>
          Every abbreviation used across <Link href="/stats" style={{ color: "var(--accent)" }}>the stats pages</Link>, in plain English.
        </p>
      </header>

      {GROUPS.map((g) => (
        <section key={g.title} style={{ display: "grid", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>{g.title}</h2>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <dl style={{ margin: 0 }}>
              {g.items.map((it, i) => (
                <div key={it.abbr + it.term} style={{ display: "grid", gridTemplateColumns: "minmax(120px, 160px) 1fr", gap: 12, padding: ".8rem 1rem", borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <dt style={{ display: "grid", gap: 2 }}>
                    <strong>{it.term}</strong>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: ".74rem", color: "var(--gold)" }}>{it.abbr}</span>
                  </dt>
                  <dd style={{ margin: 0, color: "var(--muted)", fontSize: ".9rem", alignSelf: "center" }}>{it.desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ))}

      <AdUnit slot={AD_SLOTS.result} />
    </div>
  );
}
