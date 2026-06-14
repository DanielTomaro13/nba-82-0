import Link from "next/link";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Privacy Policy",
  description:
    "How NBA 82-0 handles data: cookies, Google AdSense advertising, privacy-friendly analytics, local browser storage and your choices.",
  path: "/privacy",
  keywords: ["NBA 82-0 privacy policy", "cookies", "AdSense privacy"],
});

const UPDATED = "15 June 2026";

const sec: React.CSSProperties = { display: "grid", gap: 8 };

export default function PrivacyPage() {
  return (
    <article style={{ display: "grid", gap: "1.5rem", maxWidth: 760, lineHeight: 1.65 }}>
      <header>
        <h1 style={{ fontSize: "2.2rem", margin: 0, textTransform: "uppercase" }}>Privacy Policy</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>Last updated {UPDATED}</p>
      </header>

      <section style={sec}>
        <p style={{ color: "var(--muted)" }}>
          NBA 82-0 (&ldquo;we&rdquo;, &ldquo;us&rdquo;, the &ldquo;site&rdquo;) is a free, ad-supported basketball
          game and statistics site at <strong style={{ color: "var(--text)" }}>nba82-0.com</strong>. This policy
          explains what data is collected when you visit, how it is used, and the choices you have. We try to collect
          as little as possible — there are no accounts and no sign-up.
        </p>
      </section>

      <section style={sec}>
        <h2 style={{ margin: 0 }}>Information we collect</h2>
        <p style={{ color: "var(--muted)" }}>
          We do not ask for your name, email address or any personal details to use the site. The only data involved is:
        </p>
        <ul style={{ color: "var(--muted)", paddingLeft: "1.1rem", display: "grid", gap: 6, margin: 0 }}>
          <li><strong style={{ color: "var(--text)" }}>Local browser storage.</strong> Your game progress, streaks, high scores and an optional display name are saved in your own browser using <code>localStorage</code>. This never leaves your device unless you choose to submit a score to the global leaderboard.</li>
          <li><strong style={{ color: "var(--text)" }}>Leaderboard submissions.</strong> If you save a score to the Hall of Fame, the display name and score you entered are sent to our leaderboard service and shown publicly. Don&apos;t use a real name if you&apos;d rather stay anonymous.</li>
          <li><strong style={{ color: "var(--text)" }}>Aggregate analytics.</strong> We use Cloudflare Web Analytics, which is privacy-first: it uses no cookies and does not fingerprint or track individuals. It only reports anonymous, aggregate traffic (page views, referrers, country, device type).</li>
          <li><strong style={{ color: "var(--text)" }}>Advertising data.</strong> Google AdSense and its partners may collect data as described below.</li>
        </ul>
      </section>

      <section style={sec}>
        <h2 style={{ margin: 0 }}>Cookies &amp; advertising</h2>
        <p style={{ color: "var(--muted)" }}>
          This site is supported by advertising served through <strong style={{ color: "var(--text)" }}>Google
          AdSense</strong>. Third-party vendors, including Google, use cookies to serve ads based on your prior visits
          to this and other websites.
        </p>
        <ul style={{ color: "var(--muted)", paddingLeft: "1.1rem", display: "grid", gap: 6, margin: 0 }}>
          <li>Google&apos;s use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the Internet.</li>
          <li>You may opt out of personalised advertising by visiting{" "}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>Google Ads Settings</a>.</li>
          <li>You can opt out of a third-party vendor&apos;s use of cookies for personalised advertising at{" "}
            <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>aboutads.info/choices</a>{" "}
            and{" "}
            <a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>youronlinechoices.eu</a>.</li>
          <li>For more on how Google uses information from sites that use its services, see{" "}
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>Google&apos;s policy</a>.</li>
        </ul>
        <p style={{ color: "var(--muted)" }}>
          Where required by law (for example under the EU/UK GDPR), Google&apos;s consent mechanism will ask for your
          permission before personalised ads are shown.
        </p>
      </section>

      <section style={sec}>
        <h2 style={{ margin: 0 }}>Children&apos;s privacy</h2>
        <p style={{ color: "var(--muted)" }}>
          NBA 82-0 is a general-audience site and is not directed at children under 13. We do not knowingly collect
          personal information from children.
        </p>
      </section>

      <section style={sec}>
        <h2 style={{ margin: 0 }}>Your choices</h2>
        <p style={{ color: "var(--muted)" }}>
          You can clear all locally-stored progress at any time by clearing your browser&apos;s site data for
          nba82-0.com. You can block or delete cookies in your browser settings, and use the ad-personalisation opt-outs
          linked above. None of these will stop the games from working.
        </p>
      </section>

      <section style={sec}>
        <h2 style={{ margin: 0 }}>Data sources</h2>
        <p style={{ color: "var(--muted)" }}>
          Player ratings, standings and statistics are derived from publicly available NBA box-score data and are
          provided for informational and entertainment purposes only. NBA 82-0 is unofficial and not affiliated with the
          NBA or any team.
        </p>
      </section>

      <section style={sec}>
        <h2 style={{ margin: 0 }}>Changes &amp; contact</h2>
        <p style={{ color: "var(--muted)" }}>
          We may update this policy from time to time; the &ldquo;last updated&rdquo; date above will change accordingly.
          Questions about privacy? See our{" "}
          <Link href="/contact" style={{ color: "var(--accent)" }}>contact page</Link>.
        </p>
      </section>
    </article>
  );
}
