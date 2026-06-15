import Link from "next/link";
import { serverMeta, serverResults, serverPlayoffs } from "@/lib/serverdata";
import { notablePlayers } from "@/lib/playerdb";
import { clubColors } from "@/lib/clubs";
import HomeLeaderboard from "@/components/HomeLeaderboard";
import DailyLeaderboard from "@/components/DailyLeaderboard";
import PlayoffBracket from "@/components/PlayoffBracket";
import AdUnit from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";
import { GAMES } from "@/lib/gamelist";

export default function Home() {
  const meta = serverMeta();
  const results = serverResults();
  const ladder = results.laddersBySeason[meta.latestSeason]?.slice(0, 5) ?? [];
  const featured = notablePlayers().slice(0, 6);
  const playoffs = serverPlayoffs();
  const inPlayoffs = Boolean(meta.playoffsActive && playoffs?.rounds?.length);

  return (
    <div style={{ display: "grid", gap: "2.5rem" }}>
      {/* hero */}
      <section style={{ display: "grid", gap: "1rem" }}>
        <span className="chip" style={{ width: "fit-content", color: "var(--gold)" }}>All-time NBA draft · live NBA box-score data</span>
        <h1 style={{ fontSize: "clamp(2.4rem, 7vw, 4rem)", margin: 0, lineHeight: 0.95, textTransform: "uppercase" }}>
          Build the perfect<br /><span style={{ color: "var(--accent)" }}>82–0</span> NBA season
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: 600, fontSize: "1.05rem" }}>
          Spin for a franchise and era, draft a legend into every position and chase a flawless 82-game
          season. Then take on a vault of basketball mini-games.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/play?quick=1" className="btn btn-primary">⚡ Starting Five — spin now</Link>
          <Link href="/play" className="btn">All modes</Link>
          <Link href="/games" className="btn">Mini-games</Link>
          <Link href="/ladder" className="btn">{meta.latestSeason} Standings</Link>
        </div>
      </section>

      {/* today's daily puzzles */}
      <section className="card" style={{ padding: "1rem 1.1rem", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", borderColor: "var(--accent)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginRight: "auto" }}>
          <span style={{ fontSize: ".68rem", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)" }}>New every day</span>
          <strong style={{ fontFamily: "var(--font-cond)", fontSize: "1.2rem", textTransform: "uppercase" }}>Today's puzzles</strong>
        </div>
        <Link href="/games/footle" className="btn">🟧 Hoople</Link>
        <Link href="/games/guess-the-player" className="btn">🕵️ Guess the Player</Link>
        <Link href="/games/draft-class" className="btn">🎓 Draft Class</Link>
        <Link href="/games/score-predictor" className="btn">🔮 Score Predictor</Link>
      </section>

      {/* games grid */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>The games</h2>
          <Link href="/games" style={{ fontSize: ".85rem", color: "var(--accent)" }}>All games →</Link>
        </div>
        <div className="grid-cards">
          {GAMES.map((g) => (
            <Link key={g.slug} href={`/games/${g.slug}`} className="card" style={{ padding: "1rem", display: "grid", gap: 4 }}>
              <span style={{ fontSize: "1.6rem" }}>{g.emoji}</span>
              <strong style={{ fontFamily: "var(--font-cond)", fontSize: "1.1rem", textTransform: "uppercase" }}>{g.title}</strong>
              <span style={{ fontSize: ".8rem", color: "var(--muted)" }}>{g.blurb}</span>
              <span className="chip" style={{ width: "fit-content", fontSize: ".64rem", marginTop: 4 }}>{g.tag}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ladder + hall of fame */}
      <section style={{ display: "grid", gap: "1rem", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)" }} className="home-split">
        <style>{`@media (max-width: 760px){ .home-split { grid-template-columns: 1fr !important; } }`}</style>
        {inPlayoffs ? (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{meta.latestSeason} Playoffs</h2>
              <Link href="/playoffs" style={{ fontSize: ".8rem", color: "var(--accent)" }}>Full bracket →</Link>
            </div>
            <PlayoffBracket data={playoffs} compact />
          </div>
        ) : (
          <div className="card" style={{ padding: "1.1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{meta.latestSeason} Standings</h2>
              <Link href="/ladder" style={{ fontSize: ".8rem", color: "var(--accent)" }}>Full standings →</Link>
            </div>
            <table className="stat">
              <thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>L</th><th>Pts</th></tr></thead>
              <tbody>
                {ladder.map((t, i) => {
                  const [c1] = clubColors(t.club);
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
        <div style={{ display: "grid", gap: "1rem" }}>
          <DailyLeaderboard />
          <HomeLeaderboard />
        </div>
      </section>

      {/* featured players */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Featured players</h2>
          <Link href="/players" style={{ fontSize: ".85rem", color: "var(--accent)" }}>All players →</Link>
        </div>
        <div className="grid-cards">
          {featured.map((p) => {
            const [c1] = clubColors(p.club);
            return (
              <Link key={p.id} href={`/players/${p.id}/${p.slug}`} className="card" style={{ padding: "1rem", display: "grid", gap: 4 }}>
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

      {/* Home ad unit */}
      <AdUnit slot={AD_SLOTS.home} />
    </div>
  );
}
