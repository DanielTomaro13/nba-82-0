"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadResults, type Results, type MatchResult, type TeamBox } from "@/lib/data";
import { clubColors } from "@/lib/clubs";
import { leagueHref, type LeagueId } from "@/lib/league";

const sel: React.CSSProperties = { padding: ".4rem .6rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" };

export default function FixturesView({ league = "nba" }: { league?: LeagueId }) {
  const [data, setData] = useState<Results | null>(null);
  const [season, setSeason] = useState("");
  const [week, setWeek] = useState<string>("");
  const [open, setOpen] = useState<MatchResult | null>(null);
  useEffect(() => { loadResults(league).then((r) => { setData(r); setSeason(r.seasons[0]); }).catch(() => {}); }, [league]);
  // Close the box-score modal on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const weeks = useMemo(() => {
    const ws = new Set<number>();
    for (const m of data?.bySeason[season] ?? []) ws.add(m.round || 0);
    return [...ws].sort((a, b) => a - b);
  }, [data, season]);

  // default to the latest week when the season changes
  useEffect(() => { if (weeks.length) setWeek(String(weeks[weeks.length - 1])); }, [weeks]);

  if (!data) return <p style={{ color: "var(--muted)" }}>Loading the schedule…</p>;
  const hasPage = Boolean(data.lineupSeasons?.includes(season)); // these seasons have full match pages
  const matches = (data.bySeason[season] ?? []).filter((m) => week === "all" || String(m.round || 0) === week);
  const byRound = new Map<number, MatchResult[]>();
  for (const m of matches) { const k = m.round || 0; if (!byRound.has(k)) byRound.set(k, []); byRound.get(k)!.push(m); }
  const rounds = [...byRound.keys()].sort((a, b) => b - a);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <label style={{ fontSize: ".82rem", color: "var(--muted)" }}>Season</label>
        <select value={season} onChange={(e) => setSeason(e.target.value)} style={sel}>
          {data.seasons.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <label style={{ fontSize: ".82rem", color: "var(--muted)" }}>Week</label>
        <select value={week} onChange={(e) => setWeek(e.target.value)} style={sel}>
          <option value="all">All weeks</option>
          {weeks.map((w) => <option key={w} value={String(w)}>Week {w}</option>)}
        </select>
      </div>
      {rounds.map((rd) => (
        <div key={rd}>
          <div style={{ fontSize: ".74rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
            {rd ? `Week ${rd}` : "Other"}
          </div>
          <div className="grid-cards">
            {byRound.get(rd)!.map((m, i) => <MatchCard key={i} m={m} league={league} onOpen={setOpen} linkTo={hasPage && m.id ? leagueHref(league, `/match/${m.id}`) : undefined} />)}
          </div>
        </div>
      ))}
      {open && <BoxScoreModal m={open} league={league} onClose={() => setOpen(null)} />}
    </div>
  );
}

function MatchCard({ m, onOpen, linkTo, league = "nba" }: { m: MatchResult; onOpen: (m: MatchResult) => void; linkTo?: string; league?: LeagueId }) {
  const [h1] = clubColors(m.home, league), [a1] = clubColors(m.away, league);
  const homeWin = m.hs > m.as, awayWin = m.as > m.hs;
  const hasBox = Boolean(m.box);
  const cardStyle: React.CSSProperties = { padding: ".8rem 1rem", display: "grid", gap: 6 };
  const cta = linkTo ? "Box score & lineups →" : hasBox ? "Box score →" : "";
  const inner = (
    <>
      {m.date && <div style={{ fontSize: ".66rem", color: "var(--muted)", marginBottom: 2 }}>{m.date}</div>}
      <Row color={h1} name={m.home} score={m.hs} win={homeWin} />
      <Row color={a1} name={m.away} score={m.as} win={awayWin} />
      {cta && <div style={{ fontSize: ".64rem", color: "var(--accent)", textAlign: "right", marginTop: 2 }}>{cta}</div>}
    </>
  );
  // full match page (player lineups) takes priority over the team-box modal
  if (linkTo) return <Link href={linkTo} className="card" style={cardStyle}>{inner}</Link>;
  if (!hasBox) return <div className="card" style={cardStyle}>{inner}</div>;
  return (
    <button onClick={() => onOpen(m)} className="card" style={{ ...cardStyle, textAlign: "left", cursor: "pointer", border: "1px solid var(--border)", background: "var(--panel)", color: "inherit", font: "inherit" }}>
      {inner}
    </button>
  );
}

const STAT_ROWS: { key: keyof TeamBox; label: string; att?: keyof TeamBox }[] = [
  { key: "pts", label: "Points" },
  { key: "fgm", label: "Field goals", att: "fga" },
  { key: "fg3m", label: "Three-pointers", att: "fg3a" },
  { key: "ftm", label: "Free throws", att: "fta" },
  { key: "reb", label: "Rebounds" }, { key: "oreb", label: "Off rebounds" }, { key: "ast", label: "Assists" },
  { key: "stl", label: "Steals" }, { key: "blk", label: "Blocks" }, { key: "tov", label: "Turnovers" }, { key: "pf", label: "Fouls" },
];
const cell = (b: TeamBox, r: { key: keyof TeamBox; att?: keyof TeamBox }) => {
  if (r.att) { const m = b[r.key] as number, a = b[r.att] as number; return a ? `${m}/${a} · ${((m / a) * 100).toFixed(0)}%` : "—"; }
  return b[r.key] as number;
};

function BoxScoreModal({ m, onClose, league = "nba" }: { m: MatchResult; onClose: () => void; league?: LeagueId }) {
  const b = m.box!; const [h1] = clubColors(m.home, league), [a1] = clubColors(m.away, league);
  return (
    <div onClick={onClose} role="dialog" aria-modal="true" aria-label={`${m.away} at ${m.home} box score`} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.66)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))" }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ padding: "1.1rem", maxWidth: 460, width: "100%", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <strong style={{ fontSize: ".82rem", color: "var(--muted)" }}>{m.date || "Final"}</strong>
          <button onClick={onClose} aria-label="Close box score" style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "1.3rem", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 6, alignItems: "center", marginBottom: 12 }}>
          <span style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: m.hs > m.as ? 700 : 400 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: h1 }} />{m.home}</span>
          <span style={{ gridColumn: "2 / 4", fontFamily: "var(--font-cond)", fontSize: "1.5rem", textAlign: "right" }}>{m.hs}</span>
          <span style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: m.as > m.hs ? 700 : 400 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: a1 }} />{m.away}</span>
          <span style={{ gridColumn: "2 / 4", fontFamily: "var(--font-cond)", fontSize: "1.5rem", textAlign: "right" }}>{m.as}</span>
        </div>
        <table className="stat" style={{ width: "100%" }}>
          <thead><tr><th style={{ textAlign: "left" }}>Stat</th><th>{b.home.abbr || "Home"}</th><th>{b.away.abbr || "Away"}</th></tr></thead>
          <tbody>
            {STAT_ROWS.map((r) => (
              <tr key={r.key as string}>
                <td style={{ textAlign: "left", color: "var(--muted)" }}>{r.label}</td>
                <td style={{ fontWeight: r.key === "pts" ? 700 : 400 }}>{cell(b.home, r)}</td>
                <td style={{ fontWeight: r.key === "pts" ? 700 : 400 }}>{cell(b.away, r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Row({ color, name, score, win }: { color: string; name: string; score: number; win: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: win ? 700 : 400, opacity: win ? 1 : 0.75 }}>
      <span style={{ width: 9, height: 9, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: ".88rem" }}>{name}</span>
      <span style={{ fontFamily: "var(--font-cond)", fontSize: "1.1rem" }}>{score}</span>
    </div>
  );
}
