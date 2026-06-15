"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadSeasonLeaders, type SeasonLeaders } from "@/lib/data";
import { clubColors } from "@/lib/clubs";
import { slugify } from "@/lib/format";

const sel: React.CSSProperties = { padding: ".4rem .6rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" };
const PCT_CATS = new Set(["ts", "fg3Pct", "ftPct", "fgPct"]);
const fmtValue = (k: string, v: number) =>
  PCT_CATS.has(k) ? `${v}%` : k === "netRtg" ? (v > 0 ? `+${v}` : `${v}`) : `${v}`;

export default function SeasonLeaders() {
  const [data, setData] = useState<SeasonLeaders | null>(null);
  const [season, setSeason] = useState("");
  useEffect(() => { loadSeasonLeaders().then((d) => { setData(d); setSeason(Object.keys(d.bySeason).sort().reverse()[0] || ""); }); }, []);

  const seasons = useMemo(() => (data ? Object.keys(data.bySeason).sort().reverse() : []), [data]);
  if (!data) return <p style={{ color: "var(--muted)" }}>Loading season leaders…</p>;
  const cats = data.cats.filter((c) => data.bySeason[season]?.[c.key]?.length);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <label style={{ fontSize: ".82rem", color: "var(--muted)" }}>Season</label>
        <select value={season} onChange={(e) => setSeason(e.target.value)} style={sel}>
          {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
        {cats.map((c) => {
          const list = data.bySeason[season][c.key] || [];
          return (
            <div key={c.key} className="card" style={{ padding: "1rem" }}>
              <h3 style={{ margin: "0 0 8px", fontSize: "1rem" }}>{c.label}</h3>
              <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
                {list.slice(0, 10).map((p, i) => {
                  const [c1] = clubColors(p.club);
                  return (
                    <li key={p.pid} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".86rem" }}>
                      <span style={{ width: 16, color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: ".75rem" }}>{i + 1}</span>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: c1, flexShrink: 0 }} />
                      <Link href={`/players/${p.pid}/${slugify(p.name)}`} style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</Link>
                      <span style={{ fontFamily: "var(--font-cond)", color: "var(--gold)" }}>{fmtValue(c.key, p.value)}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
    </div>
  );
}
