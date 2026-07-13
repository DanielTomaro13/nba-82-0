"use client";
import { useEffect, useState } from "react";

// Same published Basketball-Modelling feed the ModelView reads. Summer League has
// no site-native standings dataset (ESPN exposes no season table for it), so the
// model's results-based power ratings stand in as the "standings" surface.
const BASE = process.env.NEXT_PUBLIC_MODEL_BASE ?? "https://danieltomaro13.github.io/Basketball-Modelling/data";

type Rating = {
  teamId: string; abbr: string; name: string; elo: number;
  played: number; off: number; def: number; pace: number; rank: number;
};

const panel: React.CSSProperties = { background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" };
const th: React.CSSProperties = { textAlign: "right", padding: ".5rem .65rem", color: "var(--muted)", fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".03em", borderBottom: "1px solid var(--border)" };
const td: React.CSSProperties = { textAlign: "right", padding: ".5rem .65rem", borderBottom: "1px solid var(--border)", fontSize: ".9rem" };

export default function SummerRatings() {
  const [rows, setRows] = useState<Rating[] | null>(null);

  useEffect(() => {
    fetch(`${BASE}/ratings.json`)
      .then((r) => r.json())
      .then((d) => setRows(d.nbasummer || []))
      .catch(() => setRows([]));
  }, []);

  if (!rows) return <p style={{ color: "var(--muted)" }}>Loading power ratings…</p>;
  if (!rows.length) return <p style={{ color: "var(--muted)" }}>Power ratings arrive once Summer League tips off and the model has games to rate.</p>;

  const sorted = [...rows].sort((a, b) => a.rank - b.rank);
  return (
    <div style={panel}><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr>
        <th style={{ ...th, textAlign: "left" }}>#</th>
        <th style={{ ...th, textAlign: "left" }}>Team</th>
        <th style={th}>GP</th><th style={th}>Off</th><th style={th}>Def</th><th style={th}>Net</th><th style={th}>Pace</th><th style={th}>Elo</th>
      </tr></thead>
      <tbody>{sorted.map((t) => (
        <tr key={t.teamId}>
          <td style={{ ...td, textAlign: "left", color: "var(--muted)" }}>{t.rank}</td>
          <td style={{ ...td, textAlign: "left" }}><strong>{t.name}</strong></td>
          <td style={{ ...td, color: "var(--muted)" }}>{t.played}</td>
          <td style={td}>{t.off?.toFixed(1)}</td>
          <td style={td}>{t.def?.toFixed(1)}</td>
          <td style={{ ...td, color: t.off - t.def >= 0 ? "var(--gold)" : "var(--muted)", fontWeight: 700 }}>{(t.off - t.def >= 0 ? "+" : "") + (t.off - t.def).toFixed(1)}</td>
          <td style={{ ...td, color: "var(--muted)" }}>{t.pace?.toFixed(1)}</td>
          <td style={{ ...td, color: "var(--accent)", fontWeight: 700 }}>{Math.round(t.elo)}</td>
        </tr>))}</tbody>
    </table></div></div>
  );
}
