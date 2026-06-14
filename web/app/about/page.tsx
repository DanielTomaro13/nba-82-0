import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { serverMeta } from "@/lib/serverdata";
import JsonLd from "@/components/JsonLd";

const FAQ: [string, string][] = [
  [
    "How are NBA 82-0 player ratings worked out?",
    "Each player carries an all-time rating on a 60–99 scale, drawn from their real career production. Rotation starters land in the low 80s and only the genuine greats reach the high 90s.",
  ],
  [
    "What is a perfect 82-0 season?",
    "An NBA regular season is 82 games, so 82-0 means winning every single one — something no real team has ever done. In NBA 82-0 it's the ultimate goal, and it's meant to be hard: even a stacked lineup will rarely run the table, so a perfect season is a real bragging right.",
  ],
  [
    "Is the data real?",
    "Yes. Player stats span every era from the 1980s on, and recent standings and schedules are refreshed through the season.",
  ],
  [
    "How do I win the Perfect Season game?",
    "Spin for a franchise and era, draft a legend into each position, then play out a full season. You only 'win' by going a flawless 82-0 — so you'll want the strongest lineup you can build and a few attempts.",
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
  title: "How NBA 82-0 works",
  description: "What NBA 82-0 is, where the player and team data comes from, and how to chase a perfect 82-0 season.",
  path: "/about",
  keywords: ["NBA 82-0", "about", "NBA team builder game"],
});

export default function AboutPage() {
  const m = serverMeta();
  return (
    <div style={{ display: "grid", gap: "1.5rem", maxWidth: 760 }}>
      <JsonLd data={faqLd} />
      <header>
        <h1 style={{ fontSize: "2.2rem", margin: 0, textTransform: "uppercase" }}>How it works</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>
          NBA 82-0 is a basketball take on the perfect-season game: build an all-time team across franchises and eras and chase a
          flawless 82-0 record. It&apos;s free, runs in your browser, and there&apos;s no sign-up.
        </p>
      </header>

      <section className="card" style={{ padding: "1.25rem" }}>
        <h2 style={{ marginTop: 0 }}>The data</h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          Players, teams and recent standings are grounded in real NBA numbers. The legend pool spans every era from the 1980s on,
          with recent seasons back to <strong style={{ color: "var(--text)" }}>{m.seasons[m.seasons.length - 1]}</strong> kept current
          through the season. Each player is drafted to the franchise and era they defined, so 1990s Jordan and 2010s LeBron are their
          own cards.
        </p>
      </section>

      <section className="card" style={{ padding: "1.25rem" }}>
        <h2 style={{ marginTop: 0 }}>The ratings</h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          Every player carries an all-time rating on a <strong style={{ color: "var(--text)" }}>60–99</strong> scale, drawn from their
          real career production. Rotation starters sit in the low 80s; only the all-time greats reach the high 90s. The better your
          lineup, the deeper your team runs.
        </p>
      </section>

      <section className="card" style={{ padding: "1.25rem" }}>
        <h2 style={{ marginTop: 0 }}>Chasing 82-0</h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          Once your team is drafted it plays out a full season. Going a flawless 82-0 is deliberately tough — even a stacked roster
          will rarely run the table, which is exactly what makes a perfect season worth bragging about. Re-draft, chase a stronger
          lineup, and keep trying.
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
