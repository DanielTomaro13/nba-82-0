import { notFound } from "next/navigation";
import Link from "next/link";
import { pageMeta, breadcrumbJsonLd, SITE } from "@/lib/seo";
import { allMatchIds, matchById } from "@/lib/matchdb";
import { playerHasPage } from "@/lib/playerdb";
import { clubColors, clubAbbr } from "@/lib/clubs";
import { slugify } from "@/lib/format";
import { leagueHref } from "@/lib/league";
import type { TeamBoxFull, PlayerLine } from "@/lib/data";
import JsonLd from "@/components/JsonLd";
import AdUnit from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";

export const dynamicParams = false;

// With `output: export`, a dynamic route whose generateStaticParams returns an
// empty array fails the build ("missing generateStaticParams"). Until the WNBA
// pipeline runs there are no games, so emit a single placeholder param that the
// page renders as a tasteful empty state.
const NO_DATA = "__no-data__";
export function generateStaticParams() {
  let ids: string[] = [];
  try { ids = allMatchIds("wnba"); } catch { ids = []; }
  return ids.length ? ids.map((id) => ({ id })) : [{ id: NO_DATA }];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === NO_DATA) return pageMeta({ title: "WNBA box score", path: "/wnba/fixtures" });
  const g = matchById(id, "wnba");
  if (!g) return {};
  const winner = g.home.pts > g.away.pts ? g.home : g.away;
  return pageMeta({
    title: `${g.away.name} ${g.away.pts} @ ${g.home.name} ${g.home.pts} — box score`,
    description: `Full box score and player lineups: ${g.away.name} at ${g.home.name}, ${g.date}. ${winner.name} won ${Math.max(g.home.pts, g.away.pts)}–${Math.min(g.home.pts, g.away.pts)}. Real WNBA game stats.`,
    path: `/wnba/match/${id}`,
    keywords: [g.home.name, g.away.name, "WNBA box score", "lineups", "game stats", g.date],
  });
}

const pct = (m: number, a: number) => (a ? `${((m / a) * 100).toFixed(0)}%` : "—");

const TEAM_STATS: { key: keyof TeamBoxFull; label: string; att?: keyof TeamBoxFull }[] = [
  { key: "fgm", label: "Field goals", att: "fga" },
  { key: "fg3m", label: "Three-pointers", att: "fg3a" },
  { key: "ftm", label: "Free throws", att: "fta" },
  { key: "reb", label: "Rebounds" }, { key: "oreb", label: "Off rebounds" }, { key: "ast", label: "Assists" },
  { key: "stl", label: "Steals" }, { key: "blk", label: "Blocks" }, { key: "tov", label: "Turnovers" }, { key: "pf", label: "Fouls" },
];

function Lineup({ team }: { team: TeamBoxFull }) {
  const [c1, c2] = clubColors(team.name, "wnba");
  const played = team.players.filter((p) => p.min > 0);
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <Link href={leagueHref("wnba", `/teams/${clubAbbr(team.name, "wnba").toLowerCase()}`)} style={{ display: "flex", alignItems: "center", gap: 10, padding: ".7rem 1rem", borderBottom: "1px solid var(--border)", borderLeft: `4px solid ${c1}` }}>
        <span style={{ width: 12, height: 12, borderRadius: 3, background: c1, border: `2px solid ${c2}` }} />
        <strong style={{ flex: 1 }}>{team.name}</strong>
        <span style={{ fontFamily: "var(--font-cond)", fontSize: "1.5rem" }}>{team.pts}</span>
      </Link>
      <div className="scroll-x">
        <table className="stat" style={{ width: "100%", fontSize: ".8rem" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Player</th><th>MIN</th><th>PTS</th><th>REB</th><th>AST</th>
              <th>STL</th><th>BLK</th><th>TOV</th><th>FG</th><th>3P</th><th>FT</th><th>+/−</th>
            </tr>
          </thead>
          <tbody>
            {played.map((p: PlayerLine) => (
              <tr key={p.pid}>
                <td style={{ textAlign: "left", whiteSpace: "nowrap" }}>
                  {playerHasPage(p.pid, "wnba")
                    ? <Link href={leagueHref("wnba", `/players/${p.pid}/${slugify(p.name)}`)}>{p.name}</Link>
                    : <span>{p.name}</span>}
                </td>
                <td>{p.min}</td>
                <td style={{ fontWeight: 700 }}>{p.pts}</td>
                <td>{p.reb}</td><td>{p.ast}</td><td>{p.stl}</td><td>{p.blk}</td><td>{p.tov}</td>
                <td style={{ whiteSpace: "nowrap" }}>{p.fgm}/{p.fga}</td>
                <td style={{ whiteSpace: "nowrap" }}>{p.fg3m}/{p.fg3a}</td>
                <td style={{ whiteSpace: "nowrap" }}>{p.ftm}/{p.fta}</td>
                <td style={{ color: p.pm > 0 ? "var(--accent-2)" : p.pm < 0 ? "var(--accent)" : "var(--muted)" }}>{p.pm > 0 ? `+${p.pm}` : p.pm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <nav style={{ fontSize: ".82rem" }}><Link href={leagueHref("wnba", "/fixtures")} style={{ color: "var(--accent)" }}>← All scores</Link></nav>
      <div className="card" style={{ padding: "1.5rem", color: "var(--muted)" }}>
        WNBA box scores arrive once the season pipeline has run.
      </div>
    </div>
  );
}

export default async function WnbaMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === NO_DATA) return <EmptyState />;
  const g = matchById(id, "wnba");
  if (!g) notFound();
  const [hc] = clubColors(g.home.name, "wnba"), [ac] = clubColors(g.away.name, "wnba");
  const homeWin = g.home.pts > g.away.pts;

  const eventLd = {
    "@context": "https://schema.org", "@type": "SportsEvent", sport: "Basketball",
    name: `${g.away.name} at ${g.home.name}`, startDate: g.date,
    homeTeam: { "@type": "SportsTeam", name: g.home.name },
    awayTeam: { "@type": "SportsTeam", name: g.away.name },
    url: `${SITE.url}/wnba/match/${id}`,
  };

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <JsonLd data={eventLd} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Scores", path: "/wnba/fixtures" }, { name: `${g.away.name} @ ${g.home.name}`, path: `/wnba/match/${id}` }])} />
      <nav style={{ fontSize: ".82rem" }}><Link href={leagueHref("wnba", "/fixtures")} style={{ color: "var(--accent)" }}>← All scores</Link></nav>

      {/* scoreboard */}
      <header className="card" style={{ padding: "1.1rem 1.25rem" }}>
        <div style={{ fontSize: ".74rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>{g.date} · Final · {g.season}</div>
        <div style={{ display: "grid", gap: 10 }}>
          {[{ t: g.away, c: ac, win: !homeWin }, { t: g.home, c: hc, win: homeWin }].map(({ t, c, win }) => (
            <Link key={t.abbr} href={leagueHref("wnba", `/teams/${clubAbbr(t.name, "wnba").toLowerCase()}`)} style={{ display: "flex", alignItems: "center", gap: 12, opacity: win ? 1 : 0.7 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: c }} />
              <strong style={{ flex: 1, fontSize: "1.1rem", fontWeight: win ? 800 : 500 }}>{t.name}</strong>
              {win && <span style={{ fontSize: ".7rem", color: "var(--gold)" }}>WIN</span>}
              <span style={{ fontFamily: "var(--font-cond)", fontSize: "2rem", fontWeight: win ? 800 : 400 }}>{t.pts}</span>
            </Link>
          ))}
        </div>
      </header>

      {/* team comparison */}
      <div className="card" style={{ padding: ".4rem 1rem 1rem" }}>
        <h2 style={{ fontSize: "1rem", margin: ".6rem 0" }}>Team stats</h2>
        <table className="stat" style={{ width: "100%" }}>
          <thead><tr><th style={{ textAlign: "left" }}>Stat</th><th>{g.away.abbr}</th><th>{g.home.abbr}</th></tr></thead>
          <tbody>
            <tr><td style={{ textAlign: "left", color: "var(--muted)" }}>Points</td><td style={{ fontWeight: 700 }}>{g.away.pts}</td><td style={{ fontWeight: 700 }}>{g.home.pts}</td></tr>
            {TEAM_STATS.map((s) => {
              const fmt = (b: TeamBoxFull) => s.att ? `${b[s.key] as number}/${b[s.att] as number} · ${pct(b[s.key] as number, b[s.att] as number)}` : (b[s.key] as number);
              return (
                <tr key={s.key as string}>
                  <td style={{ textAlign: "left", color: "var(--muted)" }}>{s.label}</td>
                  <td>{fmt(g.away)}</td><td>{fmt(g.home)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* lineups */}
      <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Lineups &amp; player box score</h2>
      <Lineup team={g.away} />
      <Lineup team={g.home} />

      <AdUnit slot={AD_SLOTS.result} />
    </div>
  );
}
