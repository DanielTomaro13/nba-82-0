"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadResults, type Results } from "@/lib/data";
import { clubColors } from "@/lib/clubs";

const pct = (w: number, l: number) => (w + l ? (w / (w + l)).toFixed(3).replace(/^0/, "") : ".000");
const DIVS: Record<string, string[]> = {
  East: ["Atlantic", "Central", "Southeast"],
  West: ["Northwest", "Pacific", "Southwest"],
};

const sel: React.CSSProperties = { padding: ".4rem .6rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" };

export default function LadderView() {
  const [data, setData] = useState<Results | null>(null);
  const [season, setSeason] = useState<string>("");
  const [conf, setConf] = useState<string>("All");
  const [div, setDiv] = useState<string>("All");
  useEffect(() => { loadResults().then((r) => { setData(r); setSeason(r.seasons[0]); }); }, []);

  const rows = useMemo(() => {
    const all = data?.laddersBySeason[season] ?? [];
    return all
      .filter((t) => conf === "All" || t.conf === conf)
      .filter((t) => div === "All" || t.div === div);
  }, [data, season, conf, div]);

  if (!data) return <p style={{ color: "var(--muted)" }}>Loading standings…</p>;
  const lead = rows[0]?.w ?? 0;
  const cut = conf === "All" ? { p: 6, pi: 10 } : { p: 6, pi: 10 }; // playoff / play-in cut per view

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <label style={{ fontSize: ".82rem", color: "var(--muted)" }}>Season</label>
        <select value={season} onChange={(e) => setSeason(e.target.value)} style={sel}>
          {data.seasons.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <label style={{ fontSize: ".82rem", color: "var(--muted)" }}>Conference</label>
        <select value={conf} onChange={(e) => { setConf(e.target.value); setDiv("All"); }} style={sel}>
          <option>All</option><option>East</option><option>West</option>
        </select>
        <label style={{ fontSize: ".82rem", color: "var(--muted)" }}>Division</label>
        <select value={div} onChange={(e) => setDiv(e.target.value)} style={sel} disabled={conf === "All"}>
          <option>All</option>
          {conf !== "All" && DIVS[conf].map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
      <div className="card scroll-x" style={{ padding: ".4rem .6rem" }}>
        <table className="stat">
          <thead><tr><th>#</th><th>Team</th><th>W</th><th>L</th><th>PCT</th><th>GB</th><th>PF</th><th>PA</th><th>Diff</th></tr></thead>
          <tbody>
            {rows.map((t, i) => {
              const [c1] = clubColors(t.club);
              const gb = ((lead - t.w) + (t.l - (rows[0]?.l ?? 0))) / 2;
              const tone = i < cut.p ? "rgba(74,222,128,0.06)" : i < cut.pi ? "rgba(240,196,90,0.05)" : undefined;
              return (
                <tr key={t.club} style={tone ? { background: tone } : undefined}>
                  <td style={{ color: i < cut.p ? "var(--accent-2)" : i < cut.pi ? "var(--gold)" : "var(--muted)", fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ display: "flex", gap: 8, alignItems: "center", whiteSpace: "nowrap" }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: c1, flexShrink: 0 }} />
                    <span title={`${t.club}${t.div ? ` · ${t.div}` : ""}`}>{t.club}</span>
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
        {conf === "All"
          ? "Filter by conference and division. "
          : "Per-conference: top 6 clinch a playoff berth (green); seeds 7–10 (gold) head to the play-in. "}
        <Link href="/playoffs" style={{ color: "var(--accent)" }}>See the playoff bracket →</Link>
      </p>
    </div>
  );
}
