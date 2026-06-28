import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { readDataSafe } from "@/lib/serverdata";
import { notablePlayers } from "@/lib/playerdb";
import { clubColors } from "@/lib/clubs";
import { getLeague, leagueHref } from "@/lib/league";
import type { Meta } from "@/lib/types";
import type { Results, Playoffs } from "@/lib/data";
import PlayoffBracket from "@/components/PlayoffBracket";
import AdUnit from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";

const lg = getLeague("wnba");

export const metadata = pageMeta({
  title: `${lg.brand} — build the perfect WNBA season`,
  description: `Spin for a WNBA franchise and era, draft a legend into every position and chase a flawless ${lg.perfectLabel} season — plus WNBA standings, schedules, stats and player profiles.`,
  path: "/wnba",
  keywords: ["WNBA", "WNBA draft game", `${lg.perfectLabel} season`, "WNBA team builder", "WNBA standings"],
});

const EMPTY_META: Meta = { generatedAt: "", seasons: [], latestSeason: "", clubs: [], clubsBySeason: {} };
const EMPTY_RESULTS: Results = { seasons: [], bySeason: {}, laddersBySeason: {} };
const EMPTY_PLAYOFFS: Playoffs = { season: "", active: false, champion: "", rounds: [], seeds: {} };

function safeNotable() {
  try { return notablePlayers("wnba"); } catch { return []; }
}

export default function WnbaHome() {
  const meta = readDataSafe<Meta>("meta.json", EMPTY_META, "wnba");
  const results = readDataSafe<Results>("results.json", EMPTY_RESULTS, "wnba");
  const playoffs = readDataSafe<Playoffs>("playoffs.json", EMPTY_PLAYOFFS, "wnba");
  const ladder = (meta.latestSeason ? results.laddersBySeason[meta.latestSeason] : undefined)?.slice(0, 5) ?? [];
  const featured = safeNotable().slice(0, 6);
  const inPlayoffs = Boolean(meta.playoffsActive && playoffs?.rounds?.length);
  const hasData = meta.seasons.length > 0;

  return (
    <div style={{ display: "grid", gap: "2.5rem" }}>
      {/* hero */}
      <section style={{ display: "grid", gap: "1rem" }}>
        <span className="chip" style={{ width: "fit-content", color: "var(--gold)" }}>All-time WNBA draft · live WNBA box-score data</span>
        <h1 style={{ fontSize: "clamp(2.4rem, 7vw, 4rem)", margin: 0, lineHeight: 0.95, textTransform: "uppercase" }}>
          Build the perfect<br /><span style={{ color: "var(--accent)" }}>{lg.perfectLabel}</span> WNBA season
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: 600, fontSize: "1.05rem" }}>
          Spin for a franchise and era, draft a legend into every position and chase a flawless {lg.seasonGames}-game
          season.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href={leagueHref("wnba", "/play") + "?quick=1"} className="btn btn-primary">⚡ Starting Five — spin now</Link>
          <Link href={leagueHref("wnba", "/play")} className="btn">All modes</Link>
          <Link href={leagueHref("wnba", "/model")} className="btn">Model</Link>
          {hasData && <Link href={leagueHref("wnba", "/ladder")} className="btn">{meta.latestSeason} Standings</Link>}
        </div>
      </section>

      {!hasData && (
        <section className="card" style={{ padding: "1.5rem", color: "var(--muted)" }}>
          WNBA standings, schedules, stats and player profiles arrive once the season pipeline has run.
          You can still draft an all-time squad above.
        </section>
      )}

      {/* ladder + playoffs */}
      {hasData && (
        <section style={{ display: "grid", gap: "1rem", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)" }} className="home-split">
          <style>{`@media (max-width: 760px){ .home-split { grid-template-columns: 1fr !important; } }`}</style>
          {inPlayoffs ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{meta.latestSeason} Playoffs</h2>
                <Link href={leagueHref("wnba", "/playoffs")} style={{ fontSize: ".8rem", color: "var(--accent)" }}>Full bracket →</Link>
              </div>
              <PlayoffBracket data={playoffs} compact league="wnba" />
            </div>
          ) : (
            <div className="card" style={{ padding: "1.1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{meta.latestSeason} Standings</h2>
                <Link href={leagueHref("wnba", "/ladder")} style={{ fontSize: ".8rem", color: "var(--accent)" }}>Full standings →</Link>
              </div>
              <table className="stat">
                <thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>L</th><th>Pts</th></tr></thead>
                <tbody>
                  {ladder.map((t, i) => {
                    const [c1] = clubColors(t.club, "wnba");
                    return (
                      <tr key={t.club}>
                        <td style={{ color: "var(--muted)" }}>{i + 1}</td>
                        <td style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: c1 }} />{t.club}
                        </td>
                        <td>{t.p}</td><td>{t.w}</td><td>{t.l}</td>
                        <td style={{ fontWeight: 700 }}>{t.pts}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="card" style={{ padding: "1.1rem", display: "grid", gap: 8, alignContent: "start" }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Explore the {lg.short}</h2>
            <Link href={leagueHref("wnba", "/teams")} className="btn">Teams</Link>
            <Link href={leagueHref("wnba", "/players")} className="btn">Players</Link>
            <Link href={leagueHref("wnba", "/stats")} className="btn">Stat leaders</Link>
            <Link href={leagueHref("wnba", "/fixtures")} className="btn">Schedule &amp; results</Link>
          </div>
        </section>
      )}

      {/* featured players */}
      {featured.length > 0 && (
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Featured players</h2>
            <Link href={leagueHref("wnba", "/players")} style={{ fontSize: ".85rem", color: "var(--accent)" }}>All players →</Link>
          </div>
          <div className="grid-cards">
            {featured.map((p) => {
              const [c1] = clubColors(p.club, "wnba");
              return (
                <Link key={p.id} href={leagueHref("wnba", `/players/${p.id}/${p.slug}`)} className="card" style={{ padding: "1rem", display: "grid", gap: 4 }}>
                  <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{p.name}</strong>
                    <span style={{ fontFamily: "var(--font-cond)", fontSize: "1.3rem", color: p.rating >= 90 ? "var(--gold)" : "var(--text)" }}>{p.rating}</span>
                  </span>
                  <span style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".8rem", color: "var(--muted)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c1 }} />{p.club} · {p.posName}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: ".7rem", color: "var(--muted)" }}>{p.pts} PPG · {p.reb} RPG · {p.firstYear}–{p.lastYear}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <AdUnit slot={AD_SLOTS.home} />
    </div>
  );
}
