import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { serverMeta } from "@/lib/serverdata";
import JsonLd from "@/components/JsonLd";

const FAQ: [string, string][] = [
  [
    "How are NBA 82-0 player ratings calculated?",
    "Every rating is built from real per-game box-score production — points, rebounds, assists, steals and blocks weighted like a game score — then mapped onto a 60–99 scale. Rotation starters sit in the low 80s and only all-time greats reach the high 90s.",
  ],
  [
    "What is a perfect 82-0 season?",
    "An NBA regular season is 82 games, so 82-0 means winning every single one — something no real team has ever done. In NBA 82-0 it's the ultimate goal, and it's deliberately rare: even the best starting five you can possibly draft only runs the table about 5% of the time.",
  ],
  [
    "Is the data real?",
    "Yes. Standings, schedules and per-game stats come from real NBA box scores via the public NBA Stats API, refreshed weekly. The all-time legend pool spans every era from the 1980s on.",
  ],
  [
    "How do I win the Perfect Season game?",
    "Spin for a franchise and era, draft a legend into each position, then your team plays out a full simulated 82-game season. You only 'win' by going a flawless 82-0 — so you'll want the strongest possible lineup and a lot of attempts.",
  ],
  [
    "Is NBA 82-0 free to play?",
    "Completely free, with no sign-up. Scores save in your browser, and there's an optional global leaderboard.",
  ],
];

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(([q, a]) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export const metadata = pageMeta({
  title: "How NBA 82-0 works — ratings, data & the simulator",
  description: "How NBA 82-0 builds player ratings from real NBA box-score production, how the season simulator works, and where the data comes from.",
  path: "/about",
  keywords: ["NBA 82-0 ratings", "how NBA ratings work", "NBA player ratings"],
});

const SCORING: [string, string][] = [
  ["Point scored", "×1"], ["Rebound", "×1.2"], ["Assist", "×1.5"],
  ["Steal", "×3"], ["Block", "×3"], ["Three-pointer made", "×0.5"],
];

export default function AboutPage() {
  const m = serverMeta();
  return (
    <div style={{ display: "grid", gap: "1.5rem", maxWidth: 760 }}>
      <JsonLd data={faqLd} />
      <header>
        <h1 style={{ fontSize: "2.2rem", margin: 0, textTransform: "uppercase" }}>How it works</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>
          NBA 82-0 is a basketball take on the perfect-season game. Every rating comes from real box-score production — no made-up numbers.
        </p>
      </header>

      <section className="card" style={{ padding: "1.25rem" }}>
        <h2 style={{ marginTop: 0 }}>The data</h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          Player ratings are built from the <strong style={{ color: "var(--text)" }}>public NBA Stats API</strong>{" "}
          (<code>stats.nba.com</code>) — the same feeds that power nba.com. Per-game box scores for recent seasons back to{" "}
          <strong style={{ color: "var(--text)" }}>{m.seasons[m.seasons.length - 1]}</strong> are aggregated at build time, and an
          all-time legend pool spans every era from the 1980s on. Each player is drafted to the franchise and era they defined, so
          1990s Jordan and 2010s LeBron are their own cards. Standings and the schedule come from real game results.
        </p>
      </section>

      <section className="card" style={{ padding: "1.25rem" }}>
        <h2 style={{ marginTop: 0 }}>The rating</h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          A player&apos;s rating comes from a <strong style={{ color: "var(--text)" }}>per-game production index</strong> — points,
          rebounds, assists, steals and blocks weighted like a game score. That index is mapped through a sigmoid into a{" "}
          <strong style={{ color: "var(--text)" }}>60–99</strong> band, calibrated so a rotation starter sits in the low 80s and only
          all-time greats reach the high 90s. A starting five averaging the high 90s is what it takes to go 82–0.
        </p>
        <div className="scroll-x">
          <table className="stat" style={{ marginTop: 8 }}>
            <thead><tr><th>Box-score stat</th><th>Weight</th></tr></thead>
            <tbody>
              {SCORING.map(([a, p]) => <tr key={a}><td>{a}</td><td style={{ fontFamily: "var(--font-mono)" }}>{p}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ padding: "1.25rem" }}>
        <h2 style={{ marginTop: 0 }}>The simulator</h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          Your team&apos;s average rating sets a deterministic win–loss record (high 90s ≈ 82–0). On top of that, a Monte-Carlo engine
          plays thousands of 82-game seasons against real per-season team strengths to show your odds of going 82–0, a win distribution,
          and where you&apos;d rank among real NBA teams.
        </p>
        <p style={{ marginBottom: 0 }}>
          <Link href="/play" className="btn btn-primary">Build your team →</Link>
        </p>
      </section>

      <section className="card" style={{ padding: "1.25rem" }}>
        <h2 style={{ marginTop: 0 }}>Frequently asked questions</h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          {FAQ.map(([q, a]) => (
            <div key={q}>
              <h3 style={{ margin: "0 0 4px", fontSize: "1rem" }}>{q}</h3>
              <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      <p style={{ fontSize: ".8rem", color: "var(--muted)" }}>
        NBA 82-0 is unofficial and not affiliated with the NBA or any team. Part of the 0 Series alongside{" "}
        <a href="https://afl23-0.com" style={{ color: "var(--accent)" }}>AFL 23-0</a>,{" "}
        <a href="https://nrl24-0.com" style={{ color: "var(--accent)" }}>NRL 24-0</a> and{" "}
        <a href="https://footballinvincibles.com" style={{ color: "var(--accent)" }}>Football Invincibles</a>.
      </p>
    </div>
  );
}
