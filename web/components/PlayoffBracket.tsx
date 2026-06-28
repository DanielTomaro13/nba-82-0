import { clubColors } from "@/lib/clubs";
import type { Playoffs, Series } from "@/lib/data";
import type { LeagueId } from "@/lib/league";

function Row({ seed, team, win, league = "nba" }: { seed: number; team: string; win: boolean; league?: LeagueId }) {
  const [c1] = clubColors(team, league);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: win ? 800 : 500, opacity: win ? 1 : 0.7 }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: ".62rem", color: "var(--muted)", minWidth: 14 }}>{seed}</span>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: c1, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: ".82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team}</span>
      {win && <span style={{ color: "var(--accent-2)", fontSize: ".7rem" }}>✓</span>}
    </div>
  );
}

function SeriesCard({ s, league = "nba" }: { s: Series; league?: LeagueId }) {
  return (
    <div className="card" style={{ padding: ".55rem .7rem", display: "grid", gap: 5, borderColor: s.conf === "Finals" ? "var(--gold)" : "var(--border)" }}>
      <Row seed={s.hi.seed} team={s.hi.team} win={s.hi.team === s.winner} league={league} />
      <Row seed={s.lo.seed} team={s.lo.team} win={s.lo.team === s.winner} league={league} />
      <div style={{ fontSize: ".64rem", color: "var(--muted)", textAlign: "right", fontFamily: "var(--font-mono)" }}>
        {s.score}
      </div>
    </div>
  );
}

export default function PlayoffBracket({ data, compact = false, league = "nba" }: { data: Playoffs; compact?: boolean; league?: LeagueId }) {
  const rounds = compact ? data.rounds.slice(2) : data.rounds; // compact: Conf Finals + Finals
  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <div className="card" style={{ padding: "1rem 1.1rem", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", borderColor: "var(--gold)" }}>
        <span style={{ fontSize: "1.6rem" }}>🏆</span>
        <div>
          <div style={{ fontSize: ".7rem", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)" }}>
            {data.season} Champions
          </div>
          <div style={{ fontFamily: "var(--font-cond)", fontSize: "1.4rem", color: "var(--gold)" }}>{data.champion}</div>
        </div>
      </div>

      {rounds.map((rd) => {
        const east = rd.series.filter((s) => s.conf === "East");
        const west = rd.series.filter((s) => s.conf === "West");
        const finals = rd.series.filter((s) => s.conf === "Finals");
        return (
          <section key={rd.name}>
            <h2 style={{ margin: "0 0 8px", fontSize: "1.05rem" }}>{rd.name}</h2>
            {finals.length > 0 ? (
              <div style={{ maxWidth: 320 }}>{finals.map((s, i) => <SeriesCard key={i} s={s} league={league} />)}</div>
            ) : (
              <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr" }} className="bracket-cols">
                <style>{`@media (max-width:560px){.bracket-cols{grid-template-columns:1fr !important}}`}</style>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: ".66rem", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)" }}>East</div>
                  {east.map((s, i) => <SeriesCard key={i} s={s} league={league} />)}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: ".66rem", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)" }}>West</div>
                  {west.map((s, i) => <SeriesCard key={i} s={s} league={league} />)}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
