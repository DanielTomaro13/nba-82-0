"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLeague, type LeagueId } from "@/lib/league";

const NAV = [
  { href: "/play", label: "Play" },
  { href: "/games", label: "Games" },
  { href: "/model", label: "Model" },
  { href: "/ladder", label: "Standings" },
  { href: "/playoffs", label: "Playoffs" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/fixtures", label: "Schedule" },
  { href: "/stats", label: "Stats" },
  { href: "/leaderboard", label: "Hall of Fame" },
];

/** Prefix a nav href with the active league's base path ("" for NBA, "/wnba"). */
function withBase(base: string, href: string) {
  return `${base}${href}`;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const league: LeagueId = pathname === "/wnba" || pathname.startsWith("/wnba/") ? "wnba" : "nba";
  const cfg = getLeague(league);
  const base = cfg.basePath;

  return (
    <header className="site-header">
      <div
        className="container-x"
        style={{ display: "flex", alignItems: "center", gap: "0.75rem", height: 56 }}
      >
        <Link
          href={base || "/"}
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
              background: league === "wnba"
                ? "linear-gradient(135deg,#c84cdb,#f0c45a)"
                : "linear-gradient(135deg,#ee6730,#f0c45a)",
              color: "#1a0a06",
              fontWeight: 900,
              fontSize: ".82rem",
              fontFamily: "var(--font-cond)",
            }}
          >
            {league === "wnba" ? "44" : "82"}
          </span>
          <span className="brand-text" style={{ fontFamily: "var(--font-cond)", letterSpacing: ".03em" }}>
            {cfg.short} <span style={{ color: "var(--accent)" }}>{cfg.perfectLabel.replace("–", "-")}</span>
          </span>
        </Link>

        {/* League switcher — segmented control, both leagues always visible */}
        <div className="league-switch" role="group" aria-label="Choose league" style={{ display: "flex", gap: 3, padding: 3, border: "1px solid var(--border)", borderRadius: 999, flexShrink: 0, background: "var(--bg)" }}>
          <Link href="/" aria-current={league === "nba" ? "page" : undefined} title="NBA 82-0" style={{ padding: ".22rem .7rem", borderRadius: 999, fontSize: ".82rem", fontWeight: 800, letterSpacing: ".02em", color: league === "nba" ? "#1a0a06" : "var(--text)", background: league === "nba" ? "linear-gradient(135deg,#ee6730,#f0c45a)" : "transparent" }}>NBA</Link>
          <Link href="/wnba" aria-current={league === "wnba" ? "page" : undefined} title="WNBA 44-0" style={{ padding: ".22rem .7rem", borderRadius: 999, fontSize: ".82rem", fontWeight: 800, letterSpacing: ".02em", color: league === "wnba" ? "#1a0a06" : "var(--text)", background: league === "wnba" ? "linear-gradient(135deg,#c84cdb,#f0c45a)" : "transparent" }}>WNBA</Link>
        </div>

        <nav className="nav-strip" aria-label="Primary">
          {NAV.map((n) => {
            const href = withBase(base, n.href);
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} className="nav-link" aria-current={active ? "page" : undefined} style={active ? { borderColor: "var(--accent)", color: "var(--text)" } : undefined}>
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
