import Link from "next/link";

const NAV = [
  { href: "/play", label: "Play" },
  { href: "/games", label: "Games" },
  { href: "/ladder", label: "Standings" },
  { href: "/playoffs", label: "Playoffs" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/fixtures", label: "Schedule" },
  { href: "/stats", label: "Stats" },
  { href: "/leaderboard", label: "Hall of Fame" },
];

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div
        className="container-x"
        style={{ display: "flex", alignItems: "center", gap: "0.75rem", height: 56 }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, flexShrink: 0 }}
        >
          <span
            aria-hidden
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "linear-gradient(135deg,#ee6730,#f0c45a)",
              color: "#1a0a06",
              fontWeight: 900,
              fontSize: ".82rem",
              fontFamily: "var(--font-cond)",
            }}
          >
            82
          </span>
          <span className="brand-text" style={{ fontFamily: "var(--font-cond)", letterSpacing: ".03em" }}>
            NBA <span style={{ color: "var(--accent)" }}>82-0</span>
          </span>
        </Link>
        <nav className="nav-strip" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="nav-link">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
