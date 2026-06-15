"use client";
import { useEffect, useMemo, useState } from "react";
import { loadPlayoffsBySeason, type Playoffs } from "@/lib/data";
import { recordScore, getScore } from "@/lib/progress";
import { submitScore } from "@/lib/leaderboard";
import { clubColors } from "@/lib/clubs";

const GAME = "bracket-challenge";

// Bracket seeding order within a conference (1v8, 4v5, 3v6, 2v7).
const SEED_ORDER = [1, 8, 4, 5, 3, 6, 2, 7];
const ROUND_POINTS = [1, 2, 3, 5]; // R1, Conf Semis, Conf Finals, Finals
const ROUND_LABEL = ["First Round", "Conference Semifinals", "Conference Finals", "NBA Finals"];

interface Slot { id: string; round: number; conf: "East" | "West" | "Finals"; a: string | null; b: string | null }

/** Build the (reactive) bracket from seeds + the user's picks so far. */
function buildSlots(po: Playoffs, picks: Record<string, string>): Slot[] {
  const slots: Slot[] = [];
  const winner = (id: string): string | null => picks[id] ?? null;
  for (const conf of ["East", "West"] as const) {
    const seeds = (po.seeds?.[conf] ?? []).slice().sort((a, b) => a.seed - b.seed);
    const ordered = SEED_ORDER.map((s) => seeds.find((x) => x.seed === s)?.team ?? seeds[s - 1]?.team ?? null);
    // Round 1 — 4 series
    for (let i = 0; i < 4; i++) slots.push({ id: `${conf}-0-${i}`, round: 0, conf, a: ordered[i * 2] ?? null, b: ordered[i * 2 + 1] ?? null });
    // Round 2 — 2 series
    for (let i = 0; i < 2; i++) slots.push({ id: `${conf}-1-${i}`, round: 1, conf, a: winner(`${conf}-0-${i * 2}`), b: winner(`${conf}-0-${i * 2 + 1}`) });
    // Conf Finals — 1 series
    slots.push({ id: `${conf}-2-0`, round: 2, conf, a: winner(`${conf}-1-0`), b: winner(`${conf}-1-1`) });
  }
  // Finals
  slots.push({ id: `Finals-3-0`, round: 3, conf: "Finals", a: winner("East-2-0"), b: winner("West-2-0") });
  return slots;
}

/** Real winners per round, for scoring. */
function realWinnersByRound(po: Playoffs): Set<string>[] {
  return [0, 1, 2, 3].map((r) => new Set((po.rounds?.[r]?.series ?? []).map((s) => s.winner)));
}

export default function BracketChallenge() {
  const [all, setAll] = useState<Record<string, Playoffs> | null>(null);
  const [season, setSeason] = useState<string>("");
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [best, setBest] = useState(0);

  useEffect(() => {
    loadPlayoffsBySeason().then((data) => {
      // Only fully-formed brackets: 4 rounds and 8 seeds per conference.
      const ok: Record<string, Playoffs> = {};
      for (const [s, b] of Object.entries(data)) {
        if ((b.rounds?.length ?? 0) >= 4 && (b.seeds?.East?.length ?? 0) >= 8 && (b.seeds?.West?.length ?? 0) >= 8) ok[s] = b;
      }
      setAll(ok);
      setBest(getScore(GAME).best);
      const seasons = Object.keys(ok).sort();
      // Deterministic "random" season from the day, so it's shareable.
      const idx = Math.floor((Date.now() / 86400000)) % (seasons.length || 1);
      setSeason(seasons[idx] || seasons[0] || "");
    });
  }, []);

  const po = all && season ? all[season] : null;
  const slots = useMemo(() => (po ? buildSlots(po, picks) : []), [po, picks]);

  if (!all) return <p style={{ color: "var(--muted)" }}>Loading brackets…</p>;
  if (!po) return <p style={{ color: "var(--muted)" }}>No bracket available.</p>;

  const pick = (slot: Slot, team: string) => { if (!submitted) setPicks((p) => ({ ...p, [slot.id]: team })); };
  const champion = picks["Finals-3-0"] ?? null;
  const totalPicks = slots.filter((s) => s.a && s.b).length;
  const madePicks = slots.filter((s) => picks[s.id]).length;
  const complete = Boolean(champion);

  // scoring
  const real = realWinnersByRound(po);
  const maxScore = ROUND_POINTS[0] * 8 + ROUND_POINTS[1] * 4 + ROUND_POINTS[2] * 2 + ROUND_POINTS[3] * 1;
  let score = 0;
  if (submitted) for (const s of slots) { const p = picks[s.id]; if (p && real[s.round].has(p)) score += ROUND_POINTS[s.round]; }

  const submit = () => {
    if (!complete) return;
    setSubmitted(true);
    let sc = 0;
    for (const s of slots) { const p = picks[s.id]; if (p && real[s.round].has(p)) sc += ROUND_POINTS[s.round]; }
    const isBest = recordScore(GAME, sc, true);
    setBest(isBest ? sc : getScore(GAME).best);
    void submitScore(GAME, sc, true).catch(() => {});
  };
  const reset = () => { setPicks({}); setSubmitted(false); };

  const seasons = Object.keys(all).sort().reverse();

  const renderRound = (conf: "East" | "West", round: number) => (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontSize: ".68rem", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)" }}>{conf} · {ROUND_LABEL[round]}</div>
      {slots.filter((s) => s.conf === conf && s.round === round).map((s) => <SeriesPick key={s.id} slot={s} picked={picks[s.id]} submitted={submitted} real={real} onPick={pick} />)}
    </div>
  );

  return (
    <section style={{ display: "grid", gap: "1.1rem" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ fontSize: ".82rem", color: "var(--muted)" }}>Season</label>
        <select value={season} onChange={(e) => { setSeason(e.target.value); reset(); }} style={{ padding: ".4rem .6rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" }}>
          {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="chip" style={{ marginLeft: "auto" }}>Best <strong style={{ color: "var(--gold)" }}>{best}</strong></span>
      </div>

      {submitted && (
        <div className="card" style={{ padding: "1rem", textAlign: "center", display: "grid", gap: 6, borderColor: "var(--accent)" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: 900 }}>You scored <span style={{ color: "var(--gold)" }}>{score}</span> / {maxScore}</div>
          <div style={{ color: "var(--muted)", fontSize: ".9rem" }}>Real champion: <strong style={{ color: "var(--text)" }}>{po.champion}</strong>{po.runnerUp ? ` (def. ${po.runnerUp})` : ""}</div>
          <div><button className="btn btn-primary" onClick={reset} style={{ marginTop: 6 }}>Try another season</button></div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="bracket-grid">
        <style>{`@media (max-width:640px){ .bracket-grid{ grid-template-columns:1fr !important; } }`}</style>
        <div style={{ display: "grid", gap: 14 }}>{renderRound("East", 0)}{renderRound("East", 1)}{renderRound("East", 2)}</div>
        <div style={{ display: "grid", gap: 14 }}>{renderRound("West", 0)}{renderRound("West", 1)}{renderRound("West", 2)}</div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontSize: ".68rem", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--gold)", textAlign: "center" }}>{ROUND_LABEL[3]}</div>
        {slots.filter((s) => s.conf === "Finals").map((s) => <SeriesPick key={s.id} slot={s} picked={picks[s.id]} submitted={submitted} real={real} onPick={pick} />)}
      </div>

      {!submitted && (
        <button className="btn btn-primary" onClick={submit} disabled={!complete} style={{ minHeight: 48, fontWeight: 800, opacity: complete ? 1 : 0.5 }}>
          {complete ? "Lock it in & score" : `Pick a champion (${madePicks}/${totalPicks} series)`}
        </button>
      )}
    </section>
  );
}

function SeriesPick({ slot, picked, submitted, real, onPick }: {
  slot: Slot; picked?: string; submitted: boolean; real: Set<string>[]; onPick: (s: Slot, team: string) => void;
}) {
  const ready = Boolean(slot.a && slot.b);
  return (
    <div className="card" style={{ padding: 6, display: "grid", gap: 4, opacity: ready ? 1 : 0.5 }}>
      {([slot.a, slot.b] as (string | null)[]).map((team, i) => {
        const chosen = picked && team === picked;
        const realWin = submitted && team ? real[slot.round].has(team) : false;
        const wrongPick = submitted && chosen && !realWin;
        const [c1] = team ? clubColors(team) : ["var(--muted)"];
        return (
          <button key={i} disabled={!ready || submitted || !team} onClick={() => team && onPick(slot, team)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: ".4rem .6rem", borderRadius: 6, font: "inherit", cursor: ready && !submitted ? "pointer" : "default",
              border: `1px solid ${chosen ? "var(--accent)" : "var(--border)"}`,
              background: chosen ? "color-mix(in srgb, var(--accent) 16%, var(--panel))" : "var(--panel-2)",
              color: "var(--text)", textAlign: "left", width: "100%",
            }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: c1, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: ".82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team ?? "—"}</span>
            {submitted && chosen && <span style={{ fontSize: ".7rem", color: realWin ? "var(--accent-2)" : "var(--danger)" }}>{realWin ? "✓" : "✗"}</span>}
            {submitted && !chosen && realWin && <span style={{ fontSize: ".66rem", color: "var(--muted)" }}>won</span>}
            {wrongPick && null}
          </button>
        );
      })}
    </div>
  );
}
