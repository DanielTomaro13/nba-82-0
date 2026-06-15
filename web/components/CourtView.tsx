"use client";
import { clubColors } from "@/lib/clubs";
import { effectiveRating, type PoolPlayer, type Slot } from "@/lib/types";

/** On-court coordinates (% of the court box) for each starting position. */
const SPOT: Record<string, { x: number; y: number }> = {
  C: { x: 50, y: 24 },
  PF: { x: 28, y: 34 },
  SF: { x: 72, y: 41 },
  SG: { x: 23, y: 60 },
  PG: { x: 50, y: 76 },
};

function Node({ code, p, onRemove, done }: { code: string; p: PoolPlayer | null; onRemove?: () => void; done: boolean }) {
  const [c1, c2] = p ? clubColors(p.club) : ["var(--border)", "var(--border)"];
  const rating = p ? effectiveRating(p, false) : 0;
  return (
    <div style={{ position: "absolute", left: `${SPOT[code].x}%`, top: `${SPOT[code].y}%`, transform: "translate(-50%,-50%)", textAlign: "center", width: 78 }}>
      <div style={{ position: "relative", width: 42, margin: "0 auto" }}>
        <div
          title={p ? p.name : code}
          style={{
            width: 42, height: 42, borderRadius: "50%", display: "grid", placeItems: "center",
            background: p ? "var(--panel-2)" : "transparent",
            border: p ? `2px solid ${c1}` : "2px dashed var(--border)",
            boxShadow: p ? `0 0 0 2px ${c2}55` : "none",
            color: rating >= 90 ? "var(--gold)" : "var(--text)",
            fontFamily: "var(--font-cond)", fontSize: p ? "1.15rem" : ".8rem",
          }}
        >
          {p ? rating : code}
        </div>
      </div>
      {p && (
        <div style={{ fontSize: ".6rem", color: "var(--text)", marginTop: 2, lineHeight: 1.1, fontWeight: 600, textShadow: "0 1px 3px #000" }}>
          {p.name.split(" ").slice(-1)[0]}
        </div>
      )}
      <div style={{ fontFamily: "var(--font-mono)", fontSize: ".5rem", color: "var(--muted)", letterSpacing: ".06em" }}>{code}</div>
    </div>
  );
}

export default function CourtView({ slots, squad, onRemove, done }: {
  slots: Slot[]; squad: (PoolPlayer | null)[]; onRemove: (i: number) => void; done: boolean;
}) {
  const starters = slots.map((s, i) => ({ s, i })).filter(({ s }) => s.code !== "INT");
  const bench = slots.map((s, i) => ({ s, i })).filter(({ s }) => s.code === "INT");

  return (
    <div>
      {/* half court */}
      <div style={{ position: "relative", width: "100%", maxWidth: 340, margin: "0 auto", aspectRatio: "1 / 1.05" }}>
        <svg viewBox="0 0 100 105" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden>
          <defs>
            <linearGradient id="hw" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#241a12" />
              <stop offset="1" stopColor="#1a1320" />
            </linearGradient>
          </defs>
          <rect x="1" y="1" width="98" height="103" rx="3" fill="url(#hw)" stroke="var(--border)" strokeWidth="0.8" />
          {/* hoop + backboard (top) */}
          <line x1="42" y1="6" x2="58" y2="6" stroke="var(--muted)" strokeWidth="1" />
          <circle cx="50" cy="9.5" r="2.4" fill="none" stroke="var(--accent)" strokeWidth="1" />
          {/* paint / key */}
          <rect x="38" y="4" width="24" height="40" fill="none" stroke="var(--border)" strokeWidth="0.8" />
          <circle cx="50" cy="44" r="9" fill="none" stroke="var(--border)" strokeWidth="0.8" />
          {/* three-point line */}
          <path d="M16 4 V26 A 34 34 0 0 0 84 26 V4" fill="none" stroke="var(--muted)" strokeWidth="0.8" opacity="0.7" />
          {/* half-court line + circle */}
          <line x1="1" y1="100" x2="99" y2="100" stroke="var(--border)" strokeWidth="0.8" />
          <path d="M40 100 A 10 10 0 0 1 60 100" fill="none" stroke="var(--border)" strokeWidth="0.8" />
        </svg>
        {starters.map(({ s, i }) => (
          <Node key={i} code={s.code} p={squad[i]} onRemove={() => onRemove(i)} done={done} />
        ))}
      </div>

      {/* bench */}
      {bench.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: ".6rem", letterSpacing: ".12em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>
            Bench
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {bench.map(({ i }) => {
              const p = squad[i];
              const [c1] = p ? clubColors(p.club) : ["var(--border)"];
              const r = p ? effectiveRating(p, true) : 0;
              const boost = p ? r > p.rating : false;
              return (
                <span key={i} title={p ? p.name : "Bench"}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 9px", borderRadius: 999,
                    border: `1px solid ${p ? c1 : "var(--border)"}`, background: p ? "var(--panel-2)" : "transparent",
                    color: "var(--text)", fontSize: ".74rem" }}>
                  <span style={{ fontFamily: "var(--font-cond)", color: r >= 90 ? "var(--gold)" : "var(--text)" }}>{p ? r : "—"}</span>
                  {p ? p.name.split(" ").slice(-1)[0] : "Bench"}
                  {boost && <span style={{ color: "var(--accent-2)", fontSize: ".6rem" }}>▲</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
