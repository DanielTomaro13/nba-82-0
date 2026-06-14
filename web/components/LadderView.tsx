"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { loadResults, type Results } from "@/lib/data";
import { clubColors } from "@/lib/clubs";

const pct = (w: number, l: number) => (w + l ? (w / (w + l)).toFixed(3).replace(/^0/, "") : ".000");

export default function LadderView() {
  const [data, setData] = useState<Results | null>(null);
  const [season, setSeason] = useState<string>("");
  useEffect(() => { loadResults().then((r) => { setData(r); setSeason(r.seasons[0]); }); }, []);
  if (!data) return <p style={{ color: "var(--muted)" }}>Loading standings…</p>;
  const rows = data.laddersBySeason[season] ?? [];
  const lead = rows[0]?.w ?? 0;
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <label style={{ fontSize: ".82rem", color: "var(--muted)" }}>Season</label>
        <select value={season} onChange={(e) => setSeason(e.target.value)}
          style={{ padding: ".4rem .6rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" }}>
          {data.seasons.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="card scroll-x" style={{ padding: ".4rem .6rem" }}>
        <table className="stat">
          <thead><tr><th>#</th><th>Team</th><th>W</th><th>L</th><th>PCT</th><th>GB</th><th>PF</th><th>PA</th><th>Diff</th></tr></thead>
          <tbody>
            {rows.map((t, i) => {
              const [c1] = clubColors(t.club);
              const gb = ((lead - t.w) + (t.l - (rows[0]?.l ?? 0))) / 2;
              const tone = i < 6 ? "rgba(74,222,128,0.06)" : i < 10 ? "rgba(240,196,90,0.05)" : undefined;
              return (
                <tr key={t.club} style={tone ? { background: tone } : undefined}>
                  <td style={{ color: i < 6 ? "var(--accent-2)" : i < 10 ? "var(--gold)" : "var(--muted)", fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ display: "flex", gap: 8, alignItems: "center", whiteSpace: "nowrap" }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: c1, flexShrink: 0 }} />
                    <span title={t.club}>{t.club}</span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{t.w}</td><td>{t.l}</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{pct(t.w, t.l)}</td>
                  <td style={{ color: "var(--muted)" }}>{gb <= 0 ? "—" : gb.toFixed(1)}</td>
                  <td>{t.pf}</td><td>{t.pa}</td>
                  <td style={{ color: t.pd > 0 ? "var(--accent-2)" : t.pd < 0 ? "var(--danger)" : "var(--muted)" }}>{t.pd > 0 ? "+" : ""}{t.pd}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: ".75rem", color: "var(--muted)" }}>
        Top 6 clinch a playoff berth (green); seeds 7–10 (gold) head to the play-in. Computed from real game results.
        {" "}<Link href="/fixtures" style={{ color: "var(--accent)" }}>See the schedule →</Link>
      </p>
    </div>
  );
}
