import Link from "next/link";
import { pageMeta, SITE } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

export const metadata = pageMeta({
  title: "Contact",
  description:
    "Get in touch with NBA 82-0 — feedback, bug reports, data corrections, business and advertising enquiries.",
  path: "/contact",
  keywords: ["NBA 82-0 contact", "contact", "feedback"],
});

const EMAIL = "danieltomaro3@gmail.com";

const contactLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact — NBA 82-0",
  url: `${SITE.url}/contact`,
  mainEntity: {
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    email: EMAIL,
  },
};

export default function ContactPage() {
  return (
    <article style={{ display: "grid", gap: "1.5rem", maxWidth: 680, lineHeight: 1.65 }}>
      <JsonLd data={contactLd} />
      <header>
        <h1 style={{ fontSize: "2.2rem", margin: 0, textTransform: "uppercase" }}>Contact</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>
          NBA 82-0 is built and maintained by Daniel Tomaro. I read everything — feedback, bug reports, data
          corrections and ideas for new games are all welcome.
        </p>
      </header>

      <section className="card" style={{ padding: "1.5rem", display: "grid", gap: 12, textAlign: "center" }}>
        <div style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)" }}>
          Email
        </div>
        <a href={`mailto:${EMAIL}`} style={{ fontFamily: "var(--font-cond)", fontSize: "1.5rem", color: "var(--accent)" }}>
          {EMAIL}
        </a>
        <p style={{ color: "var(--muted)", fontSize: ".88rem", margin: 0 }}>
          For business, advertising or partnership enquiries, please put &ldquo;NBA 82-0&rdquo; in the subject line.
        </p>
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h2 style={{ margin: 0 }}>What you can reach out about</h2>
        <ul style={{ color: "var(--muted)", paddingLeft: "1.1rem", display: "grid", gap: 6, margin: 0 }}>
          <li><strong style={{ color: "var(--text)" }}>Data corrections</strong> — a rating, team, era or stat that looks off.</li>
          <li><strong style={{ color: "var(--text)" }}>Bug reports</strong> — something broken on a page or in a game.</li>
          <li><strong style={{ color: "var(--text)" }}>Suggestions</strong> — a mini-game or feature you&apos;d like to see.</li>
          <li><strong style={{ color: "var(--text)" }}>Business</strong> — advertising, sponsorship or partnerships.</li>
        </ul>
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h2 style={{ margin: 0 }}>Support the site</h2>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          NBA 82-0 is free and always will be. If you&apos;d like to help cover the running costs, you can{" "}
          <a href="https://ko-fi.com/danieltomaro" target="_blank" rel="noopener" style={{ color: "var(--accent)", fontWeight: 700 }}>
            buy me a coffee on Ko-fi ☕
          </a>. Every bit is appreciated.
        </p>
      </section>

      <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>
        Curious how the ratings and the simulator work? That&apos;s all on the{" "}
        <Link href="/about" style={{ color: "var(--accent)" }}>How it works</Link> page. See also our{" "}
        <Link href="/privacy" style={{ color: "var(--accent)" }}>Privacy Policy</Link> and{" "}
        <Link href="/terms" style={{ color: "var(--accent)" }}>Terms of Use</Link>.
      </p>
    </article>
  );
}
