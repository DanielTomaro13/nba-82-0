import { notFound } from "next/navigation";
import Link from "next/link";
import { pageMeta, breadcrumbJsonLd, SITE } from "@/lib/seo";
import { allPlayers, playerById, seasonsFor, shotsFor } from "@/lib/playerdb";
import { clubColors, clubAbbr } from "@/lib/clubs";
import { getLeague, leagueHref } from "@/lib/league";
import JsonLd from "@/components/JsonLd";
import ShotChart from "@/components/ShotChart";
import AdUnit from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";

const lg = getLeague("wnba");

export const dynamicParams = false;

// With `output: export`, an empty generateStaticParams fails the build. Emit a
// single placeholder param (rendered as an empty state) until WNBA data exists.
const NO_DATA = "__no-data__";
export function generateStaticParams() {
  let players: { id: number | string; slug: string }[] = [];
  try { players = allPlayers("wnba"); } catch { players = []; }
  return players.length
    ? players.map((p) => ({ id: String(p.id), slug: p.slug }))
    : [{ id: NO_DATA, slug: NO_DATA }];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params;
  if (id === NO_DATA) return pageMeta({ title: "WNBA Players", path: "/wnba/players" });
  const p = playerById(id, "wnba");
  if (!p) return {};
  return pageMeta({
    title: `${p.name} — WNBA profile, stats & rating`,
    description: `${p.name}: ${p.posName} for the ${p.club}. ${p.apps} WNBA games, ${p.pts} PPG, ${p.reb} RPG, ${p.ast} APG (${p.firstYear}–${p.lastYear})${p.ts ? `, ${p.ts}% TS` : ""}. All-time ${lg.brand} rating ${p.rating}.`,
    path: `/wnba/players/${p.id}/${p.slug}`,
    keywords: [p.name, "WNBA", p.club, p.posName, "stats", "career", "shot chart"],
  });
}

export default async function WnbaPlayerPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params;
  if (id === NO_DATA) {
    return (
      <div style={{ display: "grid", gap: "1rem" }}>
        <nav style={{ fontSize: ".82rem" }}><Link href={leagueHref("wnba", "/players")} style={{ color: "var(--accent)" }}>← All players</Link></nav>
        <div className="card" style={{ padding: "1.5rem", color: "var(--muted)" }}>
          WNBA player profiles arrive once the season pipeline has run.
        </div>
      </div>
    );
  }
  const p = playerById(id, "wnba");
  if (!p) notFound();
  const [c1, c2] = clubColors(p.club, "wnba");
  const seasons = seasonsFor(p.id, "wnba");
  const shots = shotsFor(p.id, "wnba");
  const bio = p.bio;

  const draft = bio?.draftYear
    ? bio.draftNumber ? `${bio.draftYear} · Round ${bio.draftRound}, Pick ${bio.draftNumber}` : `${bio.draftYear} draft`
    : "Undrafted";

  const personLd = {
    "@context": "https://schema.org", "@type": "Person", name: p.name,
    jobTitle: `${p.posName} (basketball)`, affiliation: { "@type": "SportsTeam", name: p.club },
    height: bio?.height || undefined, weight: bio?.weight || undefined,
    alumniOf: bio?.college && bio.college !== "None" ? bio.college : undefined,
    nationality: bio?.country || undefined, url: `${SITE.url}/wnba/players/${p.id}/${p.slug}`,
  };

  const stat = (label: string, value: string | number, hint?: string) => (
    <div style={{ padding: ".7rem .6rem", background: "var(--panel-2)", borderRadius: 10, textAlign: "center" }} title={hint}>
      <div style={{ fontFamily: "var(--font-cond)", fontSize: "1.5rem" }}>{value}</div>
      <div style={{ fontSize: ".64rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</div>
    </div>
  );
  const Label = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: ".7rem", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)" }}>{children}</div>
  );

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <JsonLd data={personLd} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Players", path: "/wnba/players" }, { name: p.name, path: `/wnba/players/${p.id}/${p.slug}` }])} />
      <nav style={{ fontSize: ".82rem" }}><Link href={leagueHref("wnba", "/players")} style={{ color: "var(--accent)" }}>← All players</Link></nav>

      <header className="card" style={{ padding: "1.25rem", borderTop: `3px solid ${c1}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "2rem" }}>{p.name}</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, color: "var(--muted)" }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: c1, border: `1px solid ${c2}` }} />
              <Link href={leagueHref("wnba", `/teams/${clubAbbr(p.club, "wnba").toLowerCase()}`)} style={{ color: "var(--accent)" }}>{p.club}</Link> · {p.posName}{bio?.jersey ? ` · #${bio.jersey}` : ""}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-cond)", fontSize: "3rem", lineHeight: 1, color: p.rating >= 90 ? "var(--gold)" : "var(--text)" }}>{p.rating}</div>
            <div style={{ fontSize: ".66rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>peak {lg.perfectLabel} rating</div>
          </div>
        </div>
        {bio && (
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)", fontSize: ".8rem", color: "var(--muted)" }}>
            {bio.height && <span><strong style={{ color: "var(--text)" }}>{bio.height}</strong> ht</span>}
            {bio.weight && <span><strong style={{ color: "var(--text)" }}>{bio.weight}</strong></span>}
            {bio.college && bio.college !== "None" && <span>{bio.college}</span>}
            {bio.country && <span>{bio.country}</span>}
            <span>{draft}</span>
            <span><strong style={{ color: "var(--text)" }}>{p.firstYear}–{p.lastYear}</strong></span>
          </div>
        )}
      </header>

      <Label>Career per game</Label>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill,minmax(82px,1fr))" }}>
        {stat("PPG", p.pts)}{stat("RPG", p.reb)}{stat("APG", p.ast)}{stat("SPG", p.stl)}{stat("BPG", p.blk)}
        {p.mpg ? stat("MPG", p.mpg) : null}{p.fg3 ? stat("3PM", p.fg3) : null}{stat("GP", p.apps)}
      </div>

      {(p.ts || p.fgPct) && <>
        <Label>Shooting &amp; advanced</Label>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill,minmax(82px,1fr))" }}>
          {p.fgPct ? stat("FG%", p.fgPct) : null}
          {p.fg3Pct ? stat("3P%", p.fg3Pct) : null}
          {p.ftPct ? stat("FT%", p.ftPct) : null}
          {p.ts ? stat("TS%", p.ts, "True shooting %") : null}
          {p.usg ? stat("USG%", p.usg, "Usage rate") : null}
          {p.pie ? stat("PIE", p.pie, "Player Impact Estimate") : null}
        </div>
      </>}

      {shots && <>
        <Label>Shot chart · {shots.season}</Label>
        <ShotChart data={shots} accent={c1} />
      </>}

      {seasons.length > 0 && <>
        <Label>Season by season</Label>
        <div className="card scroll-x" style={{ padding: ".3rem .5rem" }}>
          <table className="stat">
            <thead><tr><th>Season</th><th>Team</th><th>GP</th><th>PPG</th><th>RPG</th><th>APG</th><th>SPG</th><th>BPG</th><th>FG%</th><th>3P%</th><th>TS%</th><th>MPG</th><th>Rtg</th></tr></thead>
            <tbody>
              {seasons.map((s) => (
                <tr key={s.season + s.club}>
                  <td style={{ whiteSpace: "nowrap" }}>{s.season}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{s.club}</td>
                  <td>{s.gp}</td><td style={{ fontWeight: 700 }}>{s.pts}</td><td>{s.reb}</td><td>{s.ast}</td>
                  <td>{s.stl}</td><td>{s.blk}</td><td>{s.fgPct || "—"}</td><td>{s.fg3Pct || "—"}</td><td>{s.ts || "—"}</td><td>{s.mpg || "—"}</td>
                  <td style={{ fontFamily: "var(--font-cond)", color: s.rating >= 90 ? "var(--gold)" : "var(--text)" }}>{s.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: ".72rem", color: "var(--muted)", margin: 0 }}>
          Per-game and advanced stats from the WNBA Stats API (regular season).
        </p>
      </>}

      <p style={{ color: "var(--muted)", fontSize: ".88rem", lineHeight: 1.6 }}>
        {p.name} peaks at a <strong style={{ color: "var(--text)" }}>{p.rating}</strong> in {lg.brand}, built from {p.apps} games of real
        WNBA data: {p.pts} points, {p.reb} rebounds and {p.ast} assists a game{p.ts ? ` on ${p.ts}% true shooting` : ""}. {" "}
        <Link href={leagueHref("wnba", "/play")} style={{ color: "var(--accent)" }}>Draft {p.name.split(" ")[0]} into your perfect team →</Link>
      </p>
      <AdUnit slot={AD_SLOTS.result} />
    </div>
  );
}
