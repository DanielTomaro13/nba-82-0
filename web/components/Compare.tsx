"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadGamesData, type GamePlayer } from "@/lib/games-data";
import { clubColors } from "@/lib/clubs";
import { slugify } from "@/lib/format";

type Dir = "hi" | "lo";
interface Row { key: keyof GamePlayer; label: string; dir: Dir; pct?: boolean }
const ROWS: Row[] = [
  { key: "rating", label: "Peak rating", dir: "hi" },
  { key: "pts", label: "Points / game", dir: "hi" },
  { key: "reb", label: "Rebounds / game", dir: "hi" },
  { key: "ast", label: "Assists / game", dir: "hi" },
  { key: "stl", label: "Steals / game", dir: "hi" },
  { key: "blk", label: "Blocks / game", dir: "hi" },
  { key: "fg3", label: "Threes / game", dir: "hi" },
  { key: "fgPct", label: "Field goal %", dir: "hi", pct: true },
  { key: "fg3Pct", label: "Three-point %", dir: "hi", pct: true },
  { key: "ftPct", label: "Free throw %", dir: "hi", pct: true },
  { key: "mpg", label: "Minutes / game", dir: "hi" },
  { key: "ts", label: "True shooting %", dir: "hi", pct: true },
  { key: "usg", label: "Usage %", dir: "hi", pct: true },
  { key: "pie", label: "Player impact (PIE)", dir: "hi" },
  { key: "apps", label: "Career games", dir: "hi" },
];

function Picker({ players, value, onChange, label }: { players: GamePlayer[]; value: GamePlayer | null; onChange: (p: GamePlayer) => void; label: string }) {
  const [q, setQ] = useState("");
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return players.filter((p) => p.name.toLowerCase().includes(s)).slice(0, 8);
  }, [q, players]);
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)" }}>{label}</label>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a player…" aria-label={label}
        style={{ padding: ".5rem .7rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" }} />
      {matches.length > 0 && (
        <div className="card" style={{ padding: 4, display: "grid", gap: 2 }}>
          {matches.map((p) => (
            <button key={p.id} onClick={() => { onChange(p); setQ(""); }}
              style={{ textAlign: "left", padding: ".4rem .6rem", borderRadius: 6, border: "none", background: "none", color: "var(--text)", cursor: "pointer", font: "inherit" }}>
              {p.name} <span style={{ color: "var(--muted)", fontSize: ".8rem" }}>· {p.club} · {p.firstYear}–{p.lastYear}</span>
            </button>
          ))}
        </div>
      )}
      {value && <PlayerHead p={value} />}
    </div>
  );
}

function PlayerHead({ p }: { p: GamePlayer }) {
  const [c1] = clubColors(p.club);
  return (
    <Link href={`/players/${p.id}/${slugify(p.name)}`} className="card" style={{ padding: ".7rem .9rem", display: "grid", gap: 2 }}>
      <strong style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 9, height: 9, borderRadius: 2, background: c1 }} />{p.name}
      </strong>
      <span style={{ fontSize: ".74rem", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{p.club} · {p.posName} · {p.firstYear}–{p.lastYear}</span>
    </Link>
  );
}

export default function Compare() {
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [a, setA] = useState<GamePlayer | null>(null);
  const [b, setB] = useState<GamePlayer | null>(null);
  useEffect(() => {
    loadGamesData().then((d) => {
      const byFame = [...d.players].sort((x, y) => y.fame - x.fame);
      setPlayers(byFame);
      setA(byFame[0] ?? null);
      setB(byFame[1] ?? null);
    });
  }, []);

  if (!players.length) return <p style={{ color: "var(--muted)" }}>Loading players…</p>;

  const fmt = (p: GamePlayer | null, r: Row) => {
    if (!p) return "—";
    const v = p[r.key] as number;
    if (v === undefined || v === null) return "—";
    return r.pct ? `${v}%` : `${v}`;
  };
  const better = (r: Row): "a" | "b" | null => {
    if (!a || !b) return null;
    const va = a[r.key] as number, vb = b[r.key] as number;
    if (typeof va !== "number" || typeof vb !== "number" || va === vb) return null;
    const aWins = r.dir === "hi" ? va > vb : va < vb;
    return aWins ? "a" : "b";
  };

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Picker players={players} value={a} onChange={setA} label="Player A" />
        <Picker players={players} value={b} onChange={setB} label="Player B" />
      </div>

      {a && b && (
        <div className="card scroll-x" style={{ padding: ".3rem .5rem" }}>
          <table className="stat" style={{ width: "100%" }}>
            <thead>
              <tr><th style={{ textAlign: "left" }}>Stat</th><th>{a.name.split(" ").slice(-1)[0]}</th><th>{b.name.split(" ").slice(-1)[0]}</th></tr>
            </thead>
            <tbody>
              {ROWS.map((r) => {
                const w = better(r);
                return (
                  <tr key={r.key as string}>
                    <td style={{ textAlign: "left", color: "var(--muted)" }}>{r.label}</td>
                    <td style={{ fontWeight: w === "a" ? 800 : 400, color: w === "a" ? "var(--gold)" : "var(--text)" }}>{fmt(a, r)}</td>
                    <td style={{ fontWeight: w === "b" ? 800 : 400, color: w === "b" ? "var(--gold)" : "var(--text)" }}>{fmt(b, r)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ fontSize: ".78rem", color: "var(--muted)", margin: 0 }}>
        Per-game career averages and peak single-season rating, from real NBA box-score data. Advanced metrics (TS%, USG%, PIE) cover 1996-97 onward.
      </p>
    </div>
  );
}
