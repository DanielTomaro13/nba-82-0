import { notFound } from "next/navigation";
import Link from "next/link";
import { pageMeta, breadcrumbJsonLd, SITE } from "@/lib/seo";
import { allTeams, teamByAbbr, teamRoster, teamLeaders, teamRecords, teamTitles } from "@/lib/teamdb";
import { recentMatchesForTeam } from "@/lib/matchdb";
import { playerHasPage } from "@/lib/playerdb";
import { clubColors } from "@/lib/clubs";
import { leagueHref, getLeague } from "@/lib/league";
import JsonLd from "@/components/JsonLd";
import AdUnit from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";

export const dynamicParams = false;

// With `output: export`, an empty generateStaticParams fails the build. Emit a
// single placeholder param (rendered as an empty state) until WNBA data exists.
const NO_DATA = "__no-data__";
export function generateStaticParams() {
  let teams: { abbr: string }[] = [];
  try { teams = allTeams("wnba"); } catch { teams = []; }
  return teams.length ? teams.map((t) => ({ abbr: t.abbr.toLowerCase() })) : [{ abbr: NO_DATA }];
}

export async function generateMetadata({ params }: { params: Promise<{ abbr: string }> }) {
  const { abbr } = await params;
  if (abbr === NO_DATA) return pageMeta({ title: "WNBA Teams", path: "/wnba/teams" });
  const t = teamByAbbr(abbr, "wnba");
  if (!t) return {};
  const titles = teamTitles(t.club, "wnba");
  return pageMeta({
    title: `${t.club} — all-time roster, leaders & record`,
    description: `${t.club} (${t.conf}ern Conference): all-time roster, franchise leaders, season-by-season record${titles.length ? ` and ${titles.length} championship${titles.length > 1 ? "s" : ""}` : ""}. Real WNBA data.`,
    path: `/wnba/teams/${t.abbr.toLowerCase()}`,
    keywords: [t.club, "WNBA", "roster", "stats", "record"],
  });
}

const leadBoard = (label: string, list: { id: number; name: string; slug: string; v: number }[]) => (
  <div className="card" style={{ padding: "1rem" }}>
    <h3 style={{ margin: "0 0 8px", fontSize: ".95rem" }}>{label}</h3>
    <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
      {list.slice(0, 5).map((p, i) => (
        <li key={p.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".84rem" }}>
          <span style={{ width: 14, color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: ".74rem" }}>{i + 1}</span>
          <Link href={leagueHref("wnba", `/players/${p.id}/${p.slug}`)} style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</Link>
          <span style={{ fontFamily: "var(--font-cond)", color: "var(--gold)" }}>{p.v}</span>
        </li>
      ))}
    </ol>
  </div>
);

export default async function WnbaTeamPage({ params }: { params: Promise<{ abbr: string }> }) {
  const { abbr } = await params;
  if (abbr === NO_DATA) {
    return (
      <div style={{ display: "grid", gap: "1rem" }}>
        <nav style={{ fontSize: ".82rem" }}><Link href={leagueHref("wnba", "/teams")} style={{ color: "var(--accent)" }}>← All teams</Link></nav>
        <div className="card" style={{ padding: "1.5rem", color: "var(--muted)" }}>
          WNBA team pages arrive once the season pipeline has run.
        </div>
      </div>
    );
  }
  const t = teamByAbbr(abbr, "wnba");
  if (!t) notFound();
  const [c1, c2] = clubColors(t.club, "wnba");
  const roster = teamRoster(t.club, "wnba");
  const leaders = teamLeaders(t.club, "wnba");
  const records = teamRecords(t.club, "wnba");
  const titles = teamTitles(t.club, "wnba");
  const recent = recentMatchesForTeam(t.abbr, 8, "wnba");
  const top = (key: "pts" | "reb" | "ast", min = 100) =>
    [...leaders].filter((p) => p.apps >= min).sort((a, b) => (b[key] || 0) - (a[key] || 0)).map((p) => ({ id: p.id, name: p.name, slug: p.slug, v: p[key] || 0 }));

  const teamLd = {
    "@context": "https://schema.org", "@type": "SportsTeam", name: t.club, sport: "Basketball",
    memberOf: { "@type": "SportsOrganization", name: "Women's National Basketball Association" }, url: `${SITE.url}/wnba/teams/${t.abbr.toLowerCase()}`,
  };

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <JsonLd data={teamLd} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Teams", path: "/wnba/teams" }, { name: t.club, path: `/wnba/teams/${t.abbr.toLowerCase()}` }])} />
      <nav style={{ fontSize: ".82rem" }}><Link href={leagueHref("wnba", "/teams")} style={{ color: "var(--accent)" }}>← All teams</Link></nav>

      <header className="card" style={{ padding: "1.25rem", borderTop: `4px solid ${c1}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ width: 40, height: 40, borderRadius: 10, background: c1, border: `3px solid ${c2}`, flexShrink: 0 }} />
          <div>
            <h1 style={{ margin: 0, fontSize: "2rem" }}>{t.club}</h1>
            <div style={{ color: "var(--muted)", marginTop: 4 }}>{t.conf}ern Conference{getLeague("wnba").hasDivisions ? ` · ${t.div} Division` : ""}{titles.length ? ` · ${titles.length}× champion` : ""}</div>
          </div>
          <Link href={leagueHref("wnba", "/play")} className="btn btn-primary" style={{ marginLeft: "auto" }}>Draft this franchise →</Link>
        </div>
        {titles.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)", fontSize: ".82rem", color: "var(--muted)" }}>
            🏆 Championships: <strong style={{ color: "var(--gold)" }}>{titles.join(", ")}</strong>
          </div>
        )}
      </header>

      <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Franchise leaders</h2>
      <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}>
        {leadBoard("Points / game", top("pts"))}
        {leadBoard("Rebounds / game", top("reb"))}
        {leadBoard("Assists / game", top("ast"))}
      </div>

      {recent.length > 0 && <>
        <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Recent games <span style={{ fontSize: ".8rem", color: "var(--muted)", fontWeight: 400 }}>(tap for box score)</span></h2>
        <div className="grid-cards">
          {recent.map((g) => {
            const isHome = g.home.abbr === t.abbr;
            const us = isHome ? g.home : g.away, them = isHome ? g.away : g.home;
            const win = us.pts > them.pts;
            const [oc] = clubColors(them.name, "wnba");
            return (
              <Link key={g.id} href={leagueHref("wnba", `/match/${g.id}`)} className="card" style={{ padding: ".7rem .9rem", display: "grid", gap: 3 }}>
                <span style={{ fontSize: ".64rem", color: "var(--muted)" }}>{g.date} · {isHome ? "vs" : "@"}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: oc }} />
                  <span style={{ flex: 1, fontSize: ".86rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{them.name}</span>
                  <span style={{ fontFamily: "var(--font-cond)", fontSize: ".9rem", color: win ? "var(--gold)" : "var(--muted)", fontWeight: 700 }}>{win ? "W" : "L"}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: ".8rem" }}>{us.pts}–{them.pts}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </>}

      <AdUnit slot={AD_SLOTS.result} />

      <h2 style={{ margin: 0, fontSize: "1.2rem" }}>All-time roster <span style={{ fontSize: ".8rem", color: "var(--muted)", fontWeight: 400 }}>({roster.length} players)</span></h2>
      <div className="grid-cards">
        {roster.slice(0, 60).map((p) => {
          const inner = (
            <>
              <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</strong>
                <span style={{ fontFamily: "var(--font-cond)", fontSize: "1.2rem", color: p.rating >= 90 ? "var(--gold)" : "var(--text)" }}>{p.rating}</span>
              </span>
              <span style={{ fontSize: ".72rem", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{p.posName} · {p.era} · {p.pts} PPG</span>
            </>
          );
          const style = { padding: ".8rem", display: "grid", gap: 3 } as const;
          return playerHasPage(p.pid, "wnba")
            ? <Link key={p.pid} href={leagueHref("wnba", `/players/${p.pid}/${p.slug}`)} className="card" style={style}>{inner}</Link>
            : <div key={p.pid} className="card" style={style}>{inner}</div>;
        })}
      </div>

      {records.length > 0 && <>
        <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Season by season</h2>
        <div className="card scroll-x" style={{ padding: ".3rem .5rem" }}>
          <table className="stat">
            <thead><tr><th>Season</th><th>W</th><th>L</th><th>PCT</th><th>Conf rank</th><th>PF</th><th>PA</th><th>Result</th></tr></thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.season}>
                  <td style={{ whiteSpace: "nowrap" }}>{r.season}</td><td style={{ fontWeight: 700 }}>{r.w}</td><td>{r.l}</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{(r.w + r.l ? r.w / (r.w + r.l) : 0).toFixed(3).replace(/^0/, "")}</td>
                  <td>{r.rank > 0 ? `#${r.rank}` : "—"}</td><td>{r.pf}</td><td>{r.pa}</td>
                  <td style={{ whiteSpace: "nowrap", color: r.champ ? "var(--gold)" : r.finals ? "var(--accent-2)" : "var(--muted)" }}>{r.champ ? "🏆 Champions" : (r.result || "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>}
    </div>
  );
}
