"use client";
import { useEffect, useMemo, useState } from "react";

// Consumes the published Basketball-Modelling feed (clean-room model, separate repo).
// GitHub Pages serves it with permissive CORS, so we fetch it straight from the client.
const BASE = process.env.NEXT_PUBLIC_MODEL_BASE ?? "https://danieltomaro13.github.io/Basketball-Modelling/data";

type Fixture = {
  league: string; gameId: string; date: string | null; featured?: boolean;
  home: string; away: string; homeAbbr: string; awayAbbr: string;
  win_home: number; win_away: number; fair_home: number; fair_away: number;
  proj_home: number; proj_away: number; mu_total: number; mu_margin: number;
};
type FuturesTeam = {
  rank: number; name: string; abbr: string; elo: number; proj_wins: number; proj_losses: number;
  playoff_pct: number; title_pct: number; title_fair: number | null;
};
type OddsSel = { label: string; model: number; fair: number; best?: { price: number; book: string }; ev: number };
type OddsGame = { league: string; homeAbbr: string; awayAbbr: string; markets: { label: string; selections: OddsSel[] }[] };

const pct = (p: number | null | undefined) => (p == null ? "—" : Math.round(p * 100) + "%");
const od = (v: number | null | undefined) => (v && v > 0 ? v.toFixed(2) : "—");

const panel: React.CSSProperties = { background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" };
const th: React.CSSProperties = { textAlign: "right", padding: ".5rem .65rem", color: "var(--muted)", fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".03em", borderBottom: "1px solid var(--border)" };
const td: React.CSSProperties = { textAlign: "right", padding: ".5rem .65rem", borderBottom: "1px solid var(--border)", fontSize: ".9rem" };
const tabBtn = (on: boolean): React.CSSProperties => ({ padding: ".45rem .9rem", borderRadius: 8, border: "1px solid var(--border)", background: on ? "var(--accent)" : "var(--panel)", color: on ? "#10131a" : "var(--text)", fontWeight: 700, cursor: "pointer" });

export default function ModelView({ league }: { league: "nba" | "nbl" }) {
  const [tab, setTab] = useState<"projections" | "futures" | "value">("projections");
  const [fixtures, setFixtures] = useState<Fixture[] | null>(null);
  const [futures, setFutures] = useState<FuturesTeam[] | null>(null);
  const [odds, setOdds] = useState<OddsGame[] | null>(null);
  const [updated, setUpdated] = useState<string>("");

  useEffect(() => {
    fetch(`${BASE}/predictions.json`).then((r) => r.json()).then((d) => {
      setFixtures((d.fixtures || []).filter((f: Fixture) => f.league === league));
      setUpdated(d.generated || "");
    }).catch(() => setFixtures([]));
    fetch(`${BASE}/futures.json`).then((r) => r.json()).then((d) => setFutures(d.leagues?.[league]?.teams || [])).catch(() => setFutures([]));
    fetch(`${BASE}/odds.json`).then((r) => r.json()).then((d) => setOdds((d.games || []).filter((g: OddsGame) => g.league === league))).catch(() => setOdds([]));
  }, [league]);

  const value = useMemo(() => {
    return (odds || []).flatMap((g) => g.markets.flatMap((m) => m.selections.map((s) => ({ ...s, g, market: m.label }))))
      .filter((s) => s.ev > 0).sort((a, b) => b.ev - a.ev);
  }, [odds]);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
        <button style={tabBtn(tab === "projections")} onClick={() => setTab("projections")}>Projections</button>
        <button style={tabBtn(tab === "futures")} onClick={() => setTab("futures")}>Futures</button>
        <button style={tabBtn(tab === "value")} onClick={() => setTab("value")}>Value</button>
        {updated && <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: ".75rem", alignSelf: "center" }}>updated {updated}</span>}
      </div>

      {tab === "projections" && (
        !fixtures ? <p style={{ color: "var(--muted)" }}>Loading projections…</p> :
        !fixtures.length ? <p style={{ color: "var(--muted)" }}>No games to project right now — check back when the season tips off.</p> :
        <div style={panel}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={{ ...th, textAlign: "left" }}>Matchup</th>
                <th style={th}>Win %</th><th style={th}>Proj score</th>
                <th style={th}>Margin</th><th style={th}>Total</th><th style={th}>Fair</th>
              </tr></thead>
              <tbody>
                {fixtures.map((f) => (
                  <tr key={f.gameId}>
                    <td style={{ ...td, textAlign: "left" }}><strong>{f.awayAbbr} @ {f.homeAbbr}</strong>{f.featured && <span style={{ color: "var(--muted)", fontSize: ".7rem" }}> · featured</span>}</td>
                    <td style={td}>{f.homeAbbr} {pct(f.win_home)}</td>
                    <td style={td}>{f.proj_away}–{f.proj_home}</td>
                    <td style={td}>{f.homeAbbr} {f.mu_margin > 0 ? "-" : "+"}{Math.abs(f.mu_margin).toFixed(1)}</td>
                    <td style={td}>{f.mu_total}</td>
                    <td style={td}>{od(f.fair_home)} / {od(f.fair_away)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "futures" && (
        !futures ? <p style={{ color: "var(--muted)" }}>Loading futures…</p> :
        !futures.length ? <p style={{ color: "var(--muted)" }}>Futures unavailable.</p> :
        <div style={panel}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={{ ...th, textAlign: "left" }}>#</th><th style={{ ...th, textAlign: "left" }}>Team</th>
                <th style={th}>Proj W-L</th><th style={th}>Playoffs</th><th style={th}>Title</th><th style={th}>Title $</th>
              </tr></thead>
              <tbody>
                {futures.map((t) => (
                  <tr key={t.abbr + t.rank}>
                    <td style={{ ...td, textAlign: "left", color: "var(--muted)" }}>{t.rank}</td>
                    <td style={{ ...td, textAlign: "left" }}><strong>{t.name}</strong></td>
                    <td style={td}>{t.proj_wins}-{t.proj_losses}</td>
                    <td style={td}>{pct(t.playoff_pct)}</td>
                    <td style={{ ...td, color: "var(--gold)", fontWeight: 700 }}>{pct(t.title_pct)}</td>
                    <td style={{ ...td, color: "var(--muted)" }}>{od(t.title_fair)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "value" && (
        !odds ? <p style={{ color: "var(--muted)" }}>Loading value…</p> :
        !value.length ? <p style={{ color: "var(--muted)" }}>No bookmaker value right now — markets open closer to tip-off. The model&apos;s fair price is on the Projections tab.</p> :
        <div style={panel}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={{ ...th, textAlign: "left" }}>Game</th><th style={{ ...th, textAlign: "left" }}>Selection</th>
                <th style={th}>Model</th><th style={th}>Fair</th><th style={th}>Best</th><th style={th}>EV</th>
              </tr></thead>
              <tbody>
                {value.map((s, i) => (
                  <tr key={i}>
                    <td style={{ ...td, textAlign: "left", color: "var(--muted)" }}>{s.g.awayAbbr} @ {s.g.homeAbbr}</td>
                    <td style={{ ...td, textAlign: "left" }}>{s.label} <span style={{ color: "var(--muted)" }}>· {s.market}</span></td>
                    <td style={td}>{pct(s.model)}</td><td style={td}>{od(s.fair)}</td>
                    <td style={td}>{od(s.best?.price)} <span style={{ color: "var(--muted)" }}>{s.best?.book}</span></td>
                    <td style={{ ...td, color: "var(--gold)", fontWeight: 700 }}>+{(s.ev * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p style={{ color: "var(--muted)", fontSize: ".78rem" }}>
        Model prices from a clean-room possession/efficiency engine (margin &amp; total modelled as
        Normals, blended with results-based Elo). Projections, futures and value refresh automatically.
        For research and entertainment only — not betting advice.
      </p>
    </div>
  );
}
