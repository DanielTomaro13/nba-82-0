import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { allTeams } from "@/lib/teamdb";
import { clubColors } from "@/lib/clubs";
import { leagueHref, getLeague } from "@/lib/league";
import AdUnit from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";

export const metadata = pageMeta({
  title: "WNBA Teams — every franchise, rosters & stats",
  description: "Every WNBA franchise by conference. All-time rosters, franchise leaders, season records and championships — built from real WNBA data.",
  path: "/wnba/teams",
  keywords: ["WNBA teams", "WNBA franchises", "WNBA rosters", "WNBA team stats"],
});

const DIV_ORDER = ["Atlantic", "Central", "Southeast", "Northwest", "Pacific", "Southwest"];

function safeTeams() {
  try { return allTeams("wnba"); } catch { return []; }
}

export default function WnbaTeamsPage() {
  const teams = safeTeams();
  if (teams.length === 0) {
    return (
      <div style={{ display: "grid", gap: "1.5rem" }}>
        <header>
          <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Teams</h1>
          <p style={{ color: "var(--muted)", marginTop: 6 }}>Every franchise — tap a team for its all-time roster, leaders and record.</p>
        </header>
        <div className="card" style={{ padding: "1.5rem", color: "var(--muted)" }}>
          WNBA teams arrive once the season pipeline has run.
        </div>
      </div>
    );
  }
  const confs = Array.from(new Set(teams.map((t) => t.conf).filter(Boolean)));
  const hasDivisions = getLeague("wnba").hasDivisions;
  const teamCard = (t: { abbr: string; club: string }) => {
    const [c1, c2] = clubColors(t.club, "wnba");
    return (
      <Link key={t.abbr} href={leagueHref("wnba", `/teams/${t.abbr.toLowerCase()}`)} className="card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: 12, borderLeft: `4px solid ${c1}` }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: c1, border: `2px solid ${c2}`, flexShrink: 0 }} />
        <span><strong>{t.club}</strong><br /><span style={{ fontSize: ".72rem", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{t.abbr}</span></span>
      </Link>
    );
  };
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Teams</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>{teams.length} franchises — tap a team for its all-time roster, leaders and record.</p>
      </header>
      {confs.map((conf) => (
        <section key={conf}>
          <h2 style={{ fontSize: "1.2rem", margin: "0 0 10px" }}>{conf}ern Conference</h2>
          {hasDivisions ? (
            DIV_ORDER.filter((d) => teams.some((t) => t.conf === conf && t.div === d)).map((div) => (
              <div key={div} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)", marginBottom: 6 }}>{div}</div>
                <div className="grid-cards">{teams.filter((t) => t.conf === conf && t.div === div).map(teamCard)}</div>
              </div>
            ))
          ) : (
            <div className="grid-cards">{teams.filter((t) => t.conf === conf).map(teamCard)}</div>
          )}
        </section>
      ))}
      <AdUnit slot={AD_SLOTS.result} />
    </div>
  );
}
