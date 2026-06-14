import Link from "next/link";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Terms of Use",
  description:
    "The terms governing your use of NBA 82-0 — a free, unofficial basketball game and statistics site.",
  path: "/terms",
  keywords: ["NBA 82-0 terms", "terms of use", "disclaimer"],
});

const UPDATED = "15 June 2026";
const sec: React.CSSProperties = { display: "grid", gap: 8 };

export default function TermsPage() {
  return (
    <article style={{ display: "grid", gap: "1.5rem", maxWidth: 760, lineHeight: 1.65 }}>
      <header>
        <h1 style={{ fontSize: "2.2rem", margin: 0, textTransform: "uppercase" }}>Terms of Use</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>Last updated {UPDATED}</p>
      </header>

      <section style={sec}>
        <p style={{ color: "var(--muted)" }}>
          By accessing <strong style={{ color: "var(--text)" }}>nba82-0.com</strong> (&ldquo;NBA 82-0&rdquo;, the
          &ldquo;site&rdquo;) you agree to these terms. If you don&apos;t agree, please don&apos;t use the site.
        </p>
      </section>

      <section style={sec}>
        <h2 style={{ margin: 0 }}>The site</h2>
        <p style={{ color: "var(--muted)" }}>
          NBA 82-0 is a free, ad-supported entertainment site offering a basketball team-builder game, mini-games and
          statistics. It is provided &ldquo;as is&rdquo; and may change, break or go offline at any time without notice.
        </p>
      </section>

      <section style={sec}>
        <h2 style={{ margin: 0 }}>Not official, not affiliated</h2>
        <p style={{ color: "var(--muted)" }}>
          NBA 82-0 is an independent project and is <strong style={{ color: "var(--text)" }}>not affiliated with,
          endorsed by, or connected to the National Basketball Association (NBA), its teams, or any of its players</strong>.
          Team names, player names and related references are used for identification and commentary only and remain the
          property of their respective owners.
        </p>
      </section>

      <section style={sec}>
        <h2 style={{ margin: 0 }}>Statistics &amp; accuracy</h2>
        <p style={{ color: "var(--muted)" }}>
          Ratings, standings and statistics are derived from publicly available box-score data and modelled for a game.
          They are provided for entertainment only, may contain errors, and must not be relied on for any betting,
          financial or other decision. Game outcomes are simulated and do not predict real results.
        </p>
      </section>

      <section style={sec}>
        <h2 style={{ margin: 0 }}>Acceptable use</h2>
        <p style={{ color: "var(--muted)" }}>
          Don&apos;t attempt to disrupt the site, scrape it at scale, or submit offensive or impersonating names to the
          leaderboard. We may remove leaderboard entries at our discretion.
        </p>
      </section>

      <section style={sec}>
        <h2 style={{ margin: 0 }}>Advertising</h2>
        <p style={{ color: "var(--muted)" }}>
          The site displays third-party advertising (Google AdSense). We are not responsible for the content of ads or of
          any third-party sites they link to. See our{" "}
          <Link href="/privacy" style={{ color: "var(--accent)" }}>Privacy Policy</Link> for how advertising data is handled.
        </p>
      </section>

      <section style={sec}>
        <h2 style={{ margin: 0 }}>Limitation of liability</h2>
        <p style={{ color: "var(--muted)" }}>
          To the fullest extent permitted by law, NBA 82-0 and its maintainer are not liable for any loss or damage
          arising from your use of, or inability to use, the site.
        </p>
      </section>

      <section style={sec}>
        <h2 style={{ margin: 0 }}>Contact</h2>
        <p style={{ color: "var(--muted)" }}>
          Questions about these terms? Reach us via the{" "}
          <Link href="/contact" style={{ color: "var(--accent)" }}>contact page</Link>.
        </p>
      </section>
    </article>
  );
}
