import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import SummerRatings from "@/components/SummerRatings";

export const metadata = pageMeta({
  title: "NBA Summer League — projections, power ratings & value",
  description: "Model projections, power ratings and bookmaker value for the NBA Summer League — Las Vegas, the California Classic and Salt Lake City. Win probabilities and projected scores for every game.",
  path: "/summer",
  keywords: ["NBA Summer League", "Vegas Summer League", "Summer League projections", "Summer League power ratings", "Summer League predictions"],
});

const cardLink: React.CSSProperties = {
  display: "block", background: "var(--panel)", border: "1px solid var(--border)",
  borderRadius: 12, padding: "1rem 1.1rem", textDecoration: "none", color: "var(--text)",
};

export default function SummerPage() {
  return (
    <div style={{ display: "grid", gap: "1.6rem" }}>
      <header style={{ display: "grid", gap: 8 }}>
        <span style={{ color: "var(--accent)", fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", fontSize: ".8rem" }}>NBA Summer League</span>
        <h1 style={{ fontSize: "2.2rem", margin: 0, textTransform: "uppercase", lineHeight: 1.05 }}>Vegas · California Classic · Salt Lake City</h1>
        <p style={{ color: "var(--muted)", margin: 0, maxWidth: 640 }}>
          The July showcase, modelled game by game. Win probabilities, projected scores and bookmaker
          value from the same clean-room possession/efficiency engine that prices the NBA and WNBA —
          plus results-based power ratings for all 30 franchises. Player props, futures and fantasy
          don&apos;t run for Summer League; ESPN publishes no box-score feed for it.
        </p>
      </header>

      <section style={{ display: "grid", gap: ".8rem" }}>
        <Link href="/summer/model" style={cardLink}>
          <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>Projections &amp; value →</div>
          <div style={{ color: "var(--muted)", fontSize: ".9rem", marginTop: 4 }}>Every upcoming game: win %, projected score, margin, total, the full market book and where the model sees value.</div>
        </Link>
      </section>

      <section style={{ display: "grid", gap: ".6rem" }}>
        <h2 style={{ fontSize: "1.25rem", margin: 0, textTransform: "uppercase" }}>Power ratings</h2>
        <p style={{ color: "var(--muted)", margin: 0, fontSize: ".85rem" }}>
          Opponent-adjusted offence/defence (points per game) and margin-aware Elo, built from every
          Summer League result across Las Vegas, the California Classic and Salt Lake City.
        </p>
        <SummerRatings />
      </section>

      <p style={{ color: "var(--muted)", fontSize: ".78rem" }}>
        For research and entertainment only — not betting advice. Independent project, not affiliated
        with or endorsed by the NBA.
      </p>
    </div>
  );
}
