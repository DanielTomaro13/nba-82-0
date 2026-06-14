import type { PlayerShots } from "@/lib/games-data";

/** Court positions (% of the box) for each NBA shot zone. Hoop at the bottom. */
const SPOT: Record<string, { x: number; y: number; three?: boolean }> = {
  "Restricted Area": { x: 50, y: 82 },
  "In The Paint (Non-RA)": { x: 50, y: 64 },
  "Mid-Range": { x: 22, y: 58 },
  "Above the Break 3": { x: 50, y: 22, three: true },
  "Left Corner 3": { x: 8, y: 80, three: true },
  "Right Corner 3": { x: 92, y: 80, three: true },
};

function effColor(pct: number, three: boolean): string {
  if (three) return pct >= 38 ? "var(--accent-2)" : pct >= 33 ? "var(--gold)" : "var(--danger)";
  return pct >= 52 ? "var(--accent-2)" : pct >= 44 ? "var(--gold)" : "var(--danger)";
}

export default function ShotChart({ data }: { data: PlayerShots; accent?: string }) {
  // a second mid-range marker on the right, split from the single Mid-Range zone
  const entries = Object.entries(data.zones).filter(([z]) => SPOT[z] && data.zones[z][1] >= 5);
  return (
    <div className="card" style={{ padding: "1rem" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 360, margin: "0 auto", aspectRatio: "1 / 0.94" }}>
        <svg viewBox="0 0 100 94" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden>
          <rect x="1" y="1" width="98" height="92" rx="3" fill="#16121c" stroke="var(--border)" strokeWidth="0.7" />
          {/* hoop bottom-centre */}
          <line x1="42" y1="88" x2="58" y2="88" stroke="var(--muted)" strokeWidth="1" />
          <circle cx="50" cy="84.5" r="2.2" fill="none" stroke="var(--accent)" strokeWidth="1" />
          {/* paint */}
          <rect x="38" y="50" width="24" height="40" fill="none" stroke="var(--border)" strokeWidth="0.7" />
          <circle cx="50" cy="50" r="9" fill="none" stroke="var(--border)" strokeWidth="0.7" />
          {/* 3-pt line */}
          <path d="M16 90 V66 A 34 34 0 0 1 84 66 V90" fill="none" stroke="var(--muted)" strokeWidth="0.7" opacity="0.7" />
        </svg>
        {entries.map(([zone, [made, att]]) => {
          const pos = SPOT[zone]; const p = att ? Math.round((made / att) * 100) : 0;
          const col = effColor(p, !!pos.three);
          return (
            <div key={zone} style={{ position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)", textAlign: "center", minWidth: 54 }}>
              <div style={{ display: "inline-grid", placeItems: "center", padding: "3px 8px", borderRadius: 999, background: "var(--panel-2)", border: `1.5px solid ${col}` }}>
                <span style={{ fontFamily: "var(--font-cond)", fontSize: "1.05rem", color: col, lineHeight: 1 }}>{p}%</span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: ".56rem", color: "var(--muted)", marginTop: 2, textShadow: "0 1px 3px #000" }}>{made}/{att}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 8, fontSize: ".66rem", color: "var(--muted)", flexWrap: "wrap" }}>
        <span><span style={{ color: "var(--accent-2)" }}>●</span> hot</span>
        <span><span style={{ color: "var(--gold)" }}>●</span> average</span>
        <span><span style={{ color: "var(--danger)" }}>●</span> cold</span>
        <span>{data.total} field-goal attempts</span>
      </div>
    </div>
  );
}
