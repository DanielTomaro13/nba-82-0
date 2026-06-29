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
type FutOdds = { team: string; abbr: string; model_pct: number; model_fair: number | null; books: Record<string, number>; best?: { price: number; book: string }; edge?: number };
type FutRow = { name: string; abbr?: string; model_pct?: number; model_fair?: number; books: Record<string, number>; best?: { price: number; book: string }; edge?: number };
type FutMarket = { key: string; label: string; type: string; model: boolean; rows: FutRow[] };
type Fantasy = { id: string; name: string; team: string; pos: string[]; price: number; proj: number; value: number | null; owned: number; gp: number; captain: number; pos_rank: string; price_change: number; ppm: number; opp: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Leaders = Record<string, { label: string; rows: { name: string; team: string; per_game: number; proj_total: number }[] }> | null;

const pct = (p: number | null | undefined) => (p == null ? "—" : Math.round(p * 100) + "%");
const od = (v: number | null | undefined) => (v && v > 0 ? v.toFixed(2) : "—");
const confTier = (c: number) => (c >= 0.75 ? "Lock" : c >= 0.65 ? "Strong" : c >= 0.55 ? "Lean" : "Coin flip");

const panel: React.CSSProperties = { background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" };
const th: React.CSSProperties = { textAlign: "right", padding: ".5rem .65rem", color: "var(--muted)", fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".03em", borderBottom: "1px solid var(--border)" };
const td: React.CSSProperties = { textAlign: "right", padding: ".5rem .65rem", borderBottom: "1px solid var(--border)", fontSize: ".9rem" };
const tabBtn = (on: boolean): React.CSSProperties => ({ padding: ".45rem .9rem", borderRadius: 8, border: "1px solid var(--border)", background: on ? "var(--accent)" : "var(--panel)", color: on ? "#10131a" : "var(--text)", fontWeight: 700, cursor: "pointer" });
const chip: React.CSSProperties = { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: ".35rem .55rem", fontSize: ".8rem", minWidth: 78 };

// ---- full market book modal ----
const GROUPS: [string, string[]][] = [
  ["Main", ["ml", "spread", "total", "team_total", "margin_band", "total_band", "race20", "overtime", "odd_even"]],
  ["Halves", ["h1_ml", "h1_spread", "h1_total", "h1_team_total", "h2_ml", "h2_spread", "h2_total", "h2_team_total", "htft", "half_combo"]],
  ["Quarters", ["q1_ml", "q1_spread", "q1_total", "q1_team_total", "q2_ml", "q2_spread", "q2_total", "q2_team_total", "q3_ml", "q3_spread", "q3_total", "q3_team_total", "q4_ml", "q4_spread", "q4_total", "q4_team_total"]],
];

/* eslint-disable @typescript-eslint/no-explicit-any */
function Market({ m }: { m: any }) {
  let body: React.ReactNode = null;
  if (m.selections) {
    body = m.selections.map((s: any, i: number) => (
      <div key={i} style={chip}><strong>{s.label}</strong><div style={{ color: "var(--muted)", fontSize: ".72rem" }}>{pct(s.prob)} · {od(s.fair)}</div></div>
    ));
  } else if (m.lines && m.lines[0] && "home" in m.lines[0]) {
    body = m.lines.map((l: any, i: number) => (
      <div key={i} style={chip}><strong>{l.home_label}</strong><div style={{ color: "var(--muted)", fontSize: ".72rem" }}>{pct(l.home)} · {od(l.home_fair)}</div></div>
    ));
  } else if (m.lines) {
    body = m.lines.map((l: any, i: number) => (
      <div key={i} style={chip}><strong>{l.team ? l.team + " " : ""}{l.line}</strong><div style={{ color: "var(--muted)", fontSize: ".72rem" }}>O {pct(l.over)} / U {pct(l.under)}</div></div>
    ));
  }
  return (
    <div style={{ margin: ".5rem 0" }}>
      <div style={{ color: "var(--accent)", fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".04em", margin: ".3rem 0" }}>{m.label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem" }}>{body}</div>
    </div>
  );
}

function PropCard({ pp }: { pp: any }) {
  const lines = (s: any) => (s.lines || []).map((l: any) => `${l.line} (O ${pct(l.over)})`).join("  ");
  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: ".5rem .65rem", margin: ".4rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}><span>{pp.name}</span><span style={{ color: "var(--muted)", fontWeight: 600, fontSize: ".75rem" }}>{pp.min} min</span></div>
      {[...(pp.singles || []), ...(pp.combos || [])].map((s: any, i: number) => (
        <div key={i} style={{ color: "var(--muted)", fontSize: ".75rem", margin: "2px 0" }}><span style={{ color: "var(--text)" }}>{s.label} {s.proj}:</span> {lines(s)}</div>
      ))}
      {(pp.discrete || []).map((s: any, i: number) => (
        <div key={"d" + i} style={{ color: "var(--muted)", fontSize: ".75rem", margin: "2px 0" }}><span style={{ color: "var(--text)" }}>{s.label}:</span> {pct(s.prob)} · {od(s.fair)}</div>
      ))}
      {(pp.periods || []).length > 0 && (
        <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
          <div style={{ color: "var(--accent)", fontSize: ".66rem", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>1Q / 1H markets</div>
          {pp.periods.map((s: any, i: number) => (
            <div key={"p" + i} style={{ color: "var(--muted)", fontSize: ".75rem", margin: "2px 0" }}><span style={{ color: "var(--text)" }}>{s.label} {s.proj}:</span> {lines(s)}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function GameModal({ f, detail, onClose }: { f: Fixture; detail: any | null; onClose: () => void }) {
  const [sub, setSub] = useState<string>("Main");
  const markets: any[] = detail?.markets || [];
  const byKey: Record<string, any> = Object.fromEntries(markets.map((m) => [m.key, m]));
  const tabs = [...GROUPS.map((g) => g[0]), "Players"];
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(2,6,16,.72)", zIndex: 60, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "1.4rem .8rem", overflowY: "auto" }}>
      <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 14, maxWidth: 760, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: ".9rem 1rem", borderBottom: "1px solid var(--border)" }}>
          <strong style={{ fontSize: "1.05rem" }}>{f.away} @ {f.home}</strong>
          <button onClick={onClose} style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 8, width: 34, height: 34, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: ".7rem 1rem 1.1rem" }}>
          {!detail ? <p style={{ color: "var(--muted)" }}>Loading the full market book…</p> : <>
            <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap", margin: ".2rem 0 .6rem" }}>
              {tabs.map((t) => <button key={t} onClick={() => setSub(t)} style={tabBtn(sub === t)}>{t}</button>)}
            </div>
            {sub === "Players" ? (
              [["away", f.awayAbbr], ["home", f.homeAbbr]].map(([side, abbr]) => (
                <div key={side}>
                  <div style={{ color: "var(--accent)", fontSize: ".72rem", textTransform: "uppercase", margin: ".5rem 0 .2rem" }}>{abbr} props</div>
                  {((detail?.props?.[side] || []) as any[]).map((pp, i) => <PropCard key={i} pp={pp} />)}
                </div>
              ))
            ) : (
              (GROUPS.find((g) => g[0] === sub)?.[1] || []).filter((k) => byKey[k]).map((k) => <Market key={k} m={byKey[k]} />)
            )}
          </>}
        </div>
      </div>
    </div>
  );
}

const bookLabel = (b: string) => ({ sportsbet: "Sportsbet", ladbrokes: "Ladbrokes", pointsbet: "PointsBet", tab: "TAB", dabble: "Dabble" } as Record<string, string>)[b] || b;

function MarketTable({ m, books }: { m: FutMarket; books: string[] }) {
  return (
    <div style={panel}><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr><th style={{ ...th, textAlign: "left" }}>{m.type === "player" ? "Player" : "Team"}</th>
        {m.model ? <><th style={th}>Model %</th><th style={th}>Fair</th></> : null}
        {books.map((b) => <th key={b} style={th}>{bookLabel(b)}</th>)}<th style={th}>Best</th>
        {m.model ? <th style={th}>Edge</th> : null}</tr></thead>
      <tbody>{m.rows.map((r, i) => (
        <tr key={i}><td style={{ ...td, textAlign: "left" }}><strong>{r.name}</strong></td>
          {m.model ? <><td style={{ ...td, color: "var(--gold)", fontWeight: 700 }}>{r.model_pct != null ? pct(r.model_pct) : "—"}</td><td style={{ ...td, color: "var(--muted)" }}>{od(r.model_fair)}</td></> : null}
          {books.map((b) => <td key={b} style={{ ...td, color: r.best?.book === b ? "var(--text)" : "var(--muted)" }}>{od(r.books?.[b])}</td>)}
          <td style={td}>{od(r.best?.price)}</td>
          {m.model ? <td style={{ ...td, color: (r.edge ?? 0) > 0 ? "var(--gold)" : "var(--muted)", fontWeight: 700 }}>{r.edge == null ? "—" : (r.edge > 0 ? "+" : "") + (r.edge * 100).toFixed(1) + "%"}</td> : null}</tr>))}</tbody>
    </table></div></div>
  );
}

function FuturesValueTable({ rows, books }: { rows: FutOdds[]; books: string[] }) {
  return (
    <div style={panel}><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr><th style={{ ...th, textAlign: "left" }}>Team</th><th style={th}>Model %</th><th style={th}>Fair</th>
        {books.map((b) => <th key={b} style={th}>{bookLabel(b)}</th>)}<th style={th}>Best</th><th style={th}>Edge</th></tr></thead>
      <tbody>{rows.map((r, i) => (
        <tr key={i}><td style={{ ...td, textAlign: "left" }}><strong>{r.team}</strong></td>
          <td style={{ ...td, color: "var(--gold)", fontWeight: 700 }}>{pct(r.model_pct)}</td><td style={{ ...td, color: "var(--muted)" }}>{od(r.model_fair)}</td>
          {books.map((b) => <td key={b} style={{ ...td, color: r.best?.book === b ? "var(--text)" : "var(--muted)" }}>{od(r.books?.[b])}</td>)}
          <td style={td}>{od(r.best?.price)}</td>
          <td style={{ ...td, color: (r.edge ?? 0) > 0 ? "var(--gold)" : "var(--muted)", fontWeight: 700 }}>{r.edge == null ? "—" : (r.edge > 0 ? "+" : "") + (r.edge * 100).toFixed(1) + "%"}</td></tr>))}</tbody>
    </table></div></div>
  );
}

function ValueTab({ value, futOdds, futBooks }: { value: { label: string; model: number; fair: number; best?: { price: number; book: string }; ev: number; g: OddsGame; market: string }[]; futOdds: FutOdds[] | null; futBooks: string[] }) {
  const futVal = (futOdds || []).filter((r) => (r.edge ?? -1) > 0).sort((a, b) => (b.edge ?? 0) - (a.edge ?? 0));
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {value.length > 0 ? (
        <div style={panel}><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={{ ...th, textAlign: "left" }}>Game</th><th style={{ ...th, textAlign: "left" }}>Selection</th><th style={th}>Model</th><th style={th}>Fair</th><th style={th}>Best</th><th style={th}>EV</th></tr></thead>
          <tbody>{value.map((s, i) => (
            <tr key={i}><td style={{ ...td, textAlign: "left", color: "var(--muted)" }}>{s.g.awayAbbr} @ {s.g.homeAbbr}</td><td style={{ ...td, textAlign: "left" }}>{s.label} <span style={{ color: "var(--muted)" }}>· {s.market}</span></td>
              <td style={td}>{pct(s.model)}</td><td style={td}>{od(s.fair)}</td><td style={td}>{od(s.best?.price)} <span style={{ color: "var(--muted)" }}>{s.best?.book}</span></td><td style={{ ...td, color: "var(--gold)", fontWeight: 700 }}>+{(s.ev * 100).toFixed(1)}%</td></tr>))}</tbody>
        </table></div></div>
      ) : <p style={{ color: "var(--muted)" }}>Game markets open closer to tip-off — here&apos;s where the model sees value in the championship futures.</p>}
      {futVal.length > 0 && <>
        <div style={{ fontWeight: 700, marginTop: ".3rem" }}>Championship futures value <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: ".8rem" }}>· {futBooks.map(bookLabel).join(", ")}</span></div>
        <FuturesValueTable rows={futVal} books={futBooks} />
      </>}
      {value.length === 0 && futVal.length === 0 && <p style={{ color: "var(--muted)" }}>No bookmaker value loaded yet.</p>}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function ModelView({ league }: { league: "nba" | "nbl" | "wnba" }) {
  const [tab, setTab] = useState<"projections" | "pickem" | "compare" | "futures" | "value" | "fantasy" | "leaders">("projections");
  const [fixtures, setFixtures] = useState<Fixture[] | null>(null);
  const [futures, setFutures] = useState<FuturesTeam[] | null>(null);
  const [odds, setOdds] = useState<OddsGame[] | null>(null);
  const [fantasy, setFantasy] = useState<Fantasy[] | null>(null);
  const [leaders, setLeaders] = useState<Leaders>(null);
  const [futOdds, setFutOdds] = useState<FutOdds[] | null>(null);
  const [futMarkets, setFutMarkets] = useState<FutMarket[]>([]);
  const [futBooks, setFutBooks] = useState<string[]>([]);
  const [futMkt, setFutMkt] = useState<string>("championship");
  const [leadCat, setLeadCat] = useState<string>("pts");
  const [fSort, setFSort] = useState<"proj" | "value" | "price" | "owned" | "captain" | "price_change">("proj");
  const [fq, setFq] = useState("");
  const [updated, setUpdated] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [modal, setModal] = useState<{ f: Fixture; detail: any | null } | null>(null);

  useEffect(() => {
    fetch(`${BASE}/predictions.json`).then((r) => r.json()).then((d) => {
      setFixtures((d.fixtures || []).filter((f: Fixture) => f.league === league));
      setUpdated(d.generated || "");
    }).catch(() => setFixtures([]));
    fetch(`${BASE}/futures.json`).then((r) => r.json()).then((d) => setFutures(d.leagues?.[league]?.teams || [])).catch(() => setFutures([]));
    fetch(`${BASE}/odds.json`).then((r) => r.json()).then((d) => setOdds((d.games || []).filter((g: OddsGame) => g.league === league))).catch(() => setOdds([]));
    fetch(`${BASE}/fantasy-${league}.json`).then((r) => r.json()).then((d) => setFantasy(d.players || [])).catch(() => setFantasy([]));
    fetch(`${BASE}/leaders.json`).then((r) => r.json()).then((d) => setLeaders(d.leagues?.[league]?.cats || null)).catch(() => setLeaders(null));
    fetch(`${BASE}/futures-odds.json`).then((r) => r.json()).then((d) => {
      setFutOdds(d.leagues?.[league]?.championship || []);
      setFutMarkets((d.leagues?.[league]?.markets || []).filter((m: FutMarket) => m.rows.some((r) => r.books && Object.keys(r.books).length)));
      setFutBooks(d.books || []);
    }).catch(() => setFutOdds([]));
  }, [league]);

  function openGame(f: Fixture) {
    setModal({ f, detail: null });
    fetch(`${BASE}/games/${league}-${f.gameId}.json`).then((r) => r.json())
      .then((d) => setModal({ f, detail: d })).catch(() => setModal({ f, detail: { markets: [], props: {} } }));
  }

  const value = useMemo(() => (odds || []).flatMap((g) => g.markets.flatMap((m) => m.selections.map((s) => ({ ...s, g, market: m.label }))))
    .filter((s) => s.ev > 0).sort((a, b) => b.ev - a.ev), [odds]);
  const fRows = useMemo(() => (fantasy || []).filter((p) => p.name.toLowerCase().includes(fq.toLowerCase()))
    .sort((a, b) => ((b[fSort] as number) || 0) - ((a[fSort] as number) || 0)).slice(0, 160), [fantasy, fq, fSort]);
  // Pick'em: the model's straight-up pick per game, ranked by confidence.
  const pickem = useMemo(() => (fixtures || []).map((f) => {
    const homePick = f.win_home >= f.win_away;
    return { f, homePick, pick: homePick ? f.homeAbbr : f.awayAbbr, conf: Math.max(f.win_home, f.win_away) };
  }).sort((a, b) => b.conf - a.conf), [fixtures]);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
        <button style={tabBtn(tab === "projections")} onClick={() => setTab("projections")}>Projections</button>
        <button style={tabBtn(tab === "pickem")} onClick={() => setTab("pickem")}>Pick&apos;em</button>
        <button style={tabBtn(tab === "compare")} onClick={() => setTab("compare")}>Compare odds</button>
        <button style={tabBtn(tab === "futures")} onClick={() => setTab("futures")}>Futures</button>
        <button style={tabBtn(tab === "value")} onClick={() => setTab("value")}>Value</button>
        <button style={tabBtn(tab === "fantasy")} onClick={() => setTab("fantasy")}>Fantasy</button>
        <button style={tabBtn(tab === "leaders")} onClick={() => setTab("leaders")}>Leaders</button>
        {updated && <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: ".75rem", alignSelf: "center" }}>updated {updated}</span>}
      </div>

      {tab === "projections" && (
        !fixtures ? <p style={{ color: "var(--muted)" }}>Loading projections…</p> :
        !fixtures.length ? <p style={{ color: "var(--muted)" }}>No games to project right now — check back when the season tips off.</p> :
        <div style={panel}><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={{ ...th, textAlign: "left" }}>Matchup</th><th style={th}>Win %</th><th style={th}>Proj score</th><th style={th}>Margin</th><th style={th}>Total</th><th style={th}>Fair</th></tr></thead>
          <tbody>{fixtures.map((f) => (
            <tr key={f.gameId} onClick={() => openGame(f)} style={{ cursor: "pointer" }}>
              <td style={{ ...td, textAlign: "left" }}><strong>{f.awayAbbr} @ {f.homeAbbr}</strong>{f.featured && <span style={{ color: "var(--muted)", fontSize: ".7rem" }}> · featured</span>}<span style={{ color: "var(--accent)", fontSize: ".7rem" }}> · full book ›</span></td>
              <td style={td}>{f.homeAbbr} {pct(f.win_home)}</td><td style={td}>{f.proj_away}–{f.proj_home}</td>
              <td style={td}>{f.homeAbbr} {f.mu_margin > 0 ? "-" : "+"}{Math.abs(f.mu_margin).toFixed(1)}</td><td style={td}>{f.mu_total}</td><td style={td}>{od(f.fair_home)} / {od(f.fair_away)}</td>
            </tr>))}</tbody>
        </table></div></div>
      )}

      {tab === "pickem" && (
        !fixtures ? <p style={{ color: "var(--muted)" }}>Loading picks…</p> :
        !fixtures.length ? <p style={{ color: "var(--muted)" }}>No games to pick right now — check back when the season tips off.</p> : <>
        <p style={{ color: "var(--muted)", fontSize: ".8rem" }}>The model&apos;s straight-up pick for every game, ranked by confidence. Tap a row for the full market book.</p>
        <div style={panel}><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={{ ...th, textAlign: "left" }}>Matchup</th><th style={{ ...th, textAlign: "left" }}>Pick</th><th style={th}>Confidence</th><th style={{ ...th, textAlign: "left" }}>Lean</th><th style={th}>Proj score</th></tr></thead>
          <tbody>{pickem.map(({ f, pick, conf, homePick }) => (
            <tr key={f.gameId} onClick={() => openGame(f)} style={{ cursor: "pointer" }}>
              <td style={{ ...td, textAlign: "left" }}><strong>{f.awayAbbr} @ {f.homeAbbr}</strong>{f.featured && <span style={{ color: "var(--muted)", fontSize: ".7rem" }}> · featured</span>}<span style={{ color: "var(--accent)", fontSize: ".7rem" }}> · full book ›</span></td>
              <td style={{ ...td, textAlign: "left", fontWeight: 700, color: "var(--gold)" }}>{pick}</td>
              <td style={td}>{pct(conf)}</td>
              <td style={{ ...td, textAlign: "left", color: "var(--muted)" }}>{confTier(conf)}</td>
              <td style={td}>{homePick ? `${f.proj_home}–${f.proj_away}` : `${f.proj_away}–${f.proj_home}`}</td>
            </tr>))}</tbody>
        </table></div></div></>
      )}

      {tab === "compare" && (
        !futMarkets.length ?
          <p style={{ color: "var(--muted)" }}>Game markets open closer to tip-off. Bookmaker futures will show here as soon as they&apos;re posted.</p> : <>
          <p style={{ color: "var(--muted)", fontSize: ".8rem" }}>Model fair price vs every book ({futBooks.map(bookLabel).join(", ")}) across every futures market. Best price highlighted.</p>
          <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ color: "var(--muted)", fontSize: ".8rem" }}>Market</span>
            <select value={futMarkets.some((m) => m.key === futMkt) ? futMkt : futMarkets[0].key} onChange={(e) => setFutMkt(e.target.value)} style={{ padding: ".45rem .6rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" }}>
              {futMarkets.map((m) => <option key={m.key} value={m.key}>{m.label}{m.model ? "  ·  model" : ""}</option>)}
            </select>
            <span style={{ color: "var(--muted)", fontSize: ".75rem" }}>{futMarkets.length} markets</span>
          </div>
          <MarketTable m={futMarkets.find((m) => m.key === futMkt) || futMarkets[0]} books={futBooks} />
        </>
      )}

      {tab === "futures" && (
        !futures ? <p style={{ color: "var(--muted)" }}>Loading futures…</p> :
        !futures.length ? <p style={{ color: "var(--muted)" }}>Futures unavailable.</p> :
        <div style={panel}><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={{ ...th, textAlign: "left" }}>#</th><th style={{ ...th, textAlign: "left" }}>Team</th><th style={th}>Proj W-L</th><th style={th}>Playoffs</th><th style={th}>Title</th><th style={th}>Title $</th></tr></thead>
          <tbody>{futures.map((t) => (
            <tr key={t.abbr + t.rank}><td style={{ ...td, textAlign: "left", color: "var(--muted)" }}>{t.rank}</td><td style={{ ...td, textAlign: "left" }}><strong>{t.name}</strong></td>
              <td style={td}>{t.proj_wins}-{t.proj_losses}</td><td style={td}>{pct(t.playoff_pct)}</td><td style={{ ...td, color: "var(--gold)", fontWeight: 700 }}>{pct(t.title_pct)}</td><td style={{ ...td, color: "var(--muted)" }}>{od(t.title_fair)}</td></tr>))}</tbody>
        </table></div></div>
      )}

      {tab === "value" && (!odds ? <p style={{ color: "var(--muted)" }}>Loading value…</p> : <ValueTab value={value} futOdds={futOdds} futBooks={futBooks} />)}

      {tab === "fantasy" && (
        !fantasy ? <p style={{ color: "var(--muted)" }}>Loading SuperCoach…</p> :
        !fantasy.length ? <p style={{ color: "var(--muted)" }}>SuperCoach data unavailable.</p> : <>
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          <input value={fq} onChange={(e) => setFq(e.target.value)} placeholder="Search players…" style={{ flex: 1, minWidth: 140, padding: ".45rem .6rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }} />
          <select value={fSort} onChange={(e) => setFSort(e.target.value as "proj" | "value" | "price" | "owned" | "captain" | "price_change")} style={{ padding: ".45rem .6rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" }}>
            <option value="proj">Projection</option><option value="captain">Captain</option><option value="value">Value</option><option value="price">Price</option><option value="price_change">Price move</option><option value="owned">Ownership</option>
          </select>
        </div>
        <div style={panel}><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={{ ...th, textAlign: "left" }}>Player</th><th style={th}>Team</th><th style={th}>Pos</th><th style={th}>Price</th><th style={th}>Δ</th><th style={th}>Proj</th><th style={th}>Capt</th><th style={th}>Value</th><th style={th}>Own</th><th style={th}>Next</th></tr></thead>
          <tbody>{fRows.map((p) => (
            <tr key={p.id}><td style={{ ...td, textAlign: "left" }}><strong>{p.name}</strong>{p.pos_rank && parseInt(p.pos_rank.replace(/\D/g, ""), 10) <= 30 ? <span style={{ marginLeft: 6, fontSize: ".68rem", color: "var(--gold)", fontWeight: 700 }}>{p.pos_rank}</span> : null}</td>
              <td style={{ ...td, color: "var(--muted)" }}>{p.team}</td><td style={{ ...td, color: "var(--muted)" }}>{(p.pos || []).join("/")}</td>
              <td style={td}>${(p.price / 1000).toFixed(0)}k</td><td style={{ ...td, color: p.price_change > 0 ? "var(--gold)" : p.price_change < 0 ? "var(--danger,#ff6b6b)" : "var(--muted)" }}>{p.price_change ? (p.price_change > 0 ? "+" : "") + (p.price_change / 1000).toFixed(0) + "k" : "0"}</td>
              <td style={{ ...td, color: "var(--gold)", fontWeight: 700 }}>{p.proj}</td><td style={{ ...td, color: "var(--muted)" }}>{p.captain}</td><td style={td}>{p.value ?? "—"}</td><td style={{ ...td, color: "var(--muted)" }}>{p.owned}%</td><td style={{ ...td, color: "var(--muted)" }}>{p.opp || "—"}</td></tr>))}</tbody>
        </table></div></div></>
      )}

      {tab === "leaders" && (
        !leaders ? <p style={{ color: "var(--muted)" }}>Loading leaders…</p> : <>
        <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
          {Object.entries(leaders).map(([k, c]) => <button key={k} style={tabBtn(leadCat === k)} onClick={() => setLeadCat(k)}>{c.label}</button>)}
        </div>
        <p style={{ color: "var(--muted)", fontSize: ".78rem" }}>Model-projected season leaders — each player&apos;s per-game rate over a full season.</p>
        <div style={panel}><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={{ ...th, textAlign: "left" }}>#</th><th style={{ ...th, textAlign: "left" }}>Player</th><th style={th}>Team</th><th style={th}>Per game</th><th style={th}>Proj season</th></tr></thead>
          <tbody>{(leaders[leadCat]?.rows || []).map((r, i) => (
            <tr key={i}><td style={{ ...td, textAlign: "left", color: "var(--muted)" }}>{i + 1}</td><td style={{ ...td, textAlign: "left" }}><strong>{r.name}</strong></td><td style={{ ...td, color: "var(--muted)" }}>{r.team}</td>
              <td style={{ ...td, color: "var(--gold)", fontWeight: 700 }}>{r.per_game}</td><td style={{ ...td, color: "var(--muted)" }}>{r.proj_total.toLocaleString()}</td></tr>))}</tbody>
        </table></div></div></>
      )}

      {modal && <GameModal f={modal.f} detail={modal.detail} onClose={() => setModal(null)} />}

      <p style={{ color: "var(--muted)", fontSize: ".78rem" }}>
        Model prices from a clean-room possession/efficiency engine (margin &amp; total modelled as
        Normals, blended with results-based Elo). Projections, futures, value and fantasy refresh
        automatically. For research and entertainment only — not betting advice.
      </p>
    </div>
  );
}
