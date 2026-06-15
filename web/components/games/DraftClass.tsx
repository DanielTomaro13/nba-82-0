"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadGamesData, rng, pickN, type GamePlayer } from "@/lib/games-data";
import { recordScore, getScore } from "@/lib/progress";
import { submitScore } from "@/lib/leaderboard";
import { clubColors } from "@/lib/clubs";

const GAME = "draft-class";

interface Round { target: GamePlayer; options: GamePlayer[] }
type Phase = "loading" | "playing" | "over";

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
const hasDraft = (p: GamePlayer) => Boolean(p.bio && p.bio.draftYear && p.bio.draftNumber);

function buildRound(pool: GamePlayer[], rand: () => number): Round | null {
  if (pool.length < 4) return null;
  const [target] = pickN(pool, 1, rand);
  if (!target) return null;
  // Distractors: prefer the same draft year (hardest), then same position.
  const yr = target.bio?.draftYear;
  const sameYear = pool.filter((p) => p.id !== target.id && p.bio?.draftYear === yr);
  const samePos = pool.filter((p) => p.id !== target.id && p.pos === target.pos && p.bio?.draftYear !== yr);
  const rest = pool.filter((p) => p.id !== target.id);
  const distractors: GamePlayer[] = [];
  const seen = new Set<number>([target.id]);
  for (const group of [sameYear, samePos, rest]) {
    for (const p of pickN(group, group.length, rand)) {
      if (distractors.length >= 3) break;
      if (!seen.has(p.id)) { distractors.push(p); seen.add(p.id); }
    }
    if (distractors.length >= 3) break;
  }
  if (distractors.length < 3) return null;
  return { target, options: pickN([target, ...distractors], 4, rand) };
}

export default function DraftClass() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [pool, setPool] = useState<GamePlayer[]>([]);
  const [round, setRound] = useState<Round | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [chosenId, setChosenId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const randRef = useRef<() => number>(rng(Date.now()));
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nextRound = useCallback((src: GamePlayer[]) => {
    setChosenId(null);
    setRound(buildRound(src, randRef.current));
  }, []);

  useEffect(() => {
    let alive = true;
    randRef.current = rng(Date.now());
    setBest(getScore(GAME).best);
    loadGamesData().then((data) => {
      if (!alive) return;
      const eligible = data.players.filter((p) => hasDraft(p) && p.apps >= 100 && p.fame > 55);
      if (eligible.length < 4) { setError("Not enough draft data to play."); setPhase("over"); return; }
      setPool(eligible);
      nextRound(eligible);
      setPhase("playing");
    }).catch(() => { if (alive) { setError("Could not load player data."); setPhase("over"); } });
    return () => { alive = false; if (advanceTimer.current) clearTimeout(advanceTimer.current); };
  }, [nextRound]);

  const endRun = useCallback((finalScore: number) => {
    recordScore(GAME, finalScore);
    void submitScore(GAME, finalScore);
    setBest(getScore(GAME).best);
    setPhase("over");
  }, []);

  const onPick = useCallback((player: GamePlayer) => {
    if (!round || chosenId !== null) return;
    setChosenId(player.id);
    if (player.id === round.target.id) {
      const ns = score + 1; setScore(ns);
      advanceTimer.current = setTimeout(() => nextRound(pool), 750);
    } else { endRun(score); }
  }, [round, chosenId, score, pool, nextRound, endRun]);

  const playAgain = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    randRef.current = rng(Date.now());
    setScore(0); setChosenId(null); setError(null);
    if (pool.length >= 4) { nextRound(pool); setPhase("playing"); }
  }, [pool, nextRound]);

  const target = round?.target;
  const bio = target?.bio;
  const dotColor = target ? clubColors(target.club)[0] : "var(--muted)";
  const correctId = round?.target.id ?? null;

  return (
    <div style={styles.wrap}>
      <style>{css}</style>
      <header style={styles.header}>
        <div style={styles.scoreBox}><span style={styles.scoreLabel}>Streak</span><span style={styles.scoreValue}>{score}</span></div>
        <div style={styles.title}>Draft Class</div>
        <div style={styles.scoreBox}><span style={styles.scoreLabel}>Best</span><span style={{ ...styles.scoreValue, color: "var(--gold)" }}>{best}</span></div>
      </header>

      {phase === "loading" && <div className="card" style={styles.centerCard}><span style={{ color: "var(--muted)" }}>Loading draft data…</span></div>}

      {phase === "playing" && target && bio && round && (
        <>
          <div className="card" style={styles.profile}>
            <div style={styles.bigPick}>
              {bio.draftNumber === 1 ? "No. 1 overall pick" : `${ordinal(bio.draftNumber!)} overall pick`}
            </div>
            <div style={styles.draftLine}>
              {bio.draftYear} NBA Draft{bio.draftRound ? ` · Round ${bio.draftRound}` : ""}
            </div>
            <div style={styles.clues}>
              {bio.college && <span className="chip">{bio.college}</span>}
              {bio.country && bio.country !== "USA" && <span className="chip">{bio.country}</span>}
              {bio.height && <span className="chip">{bio.height}</span>}
              <span className="chip" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ ...styles.dot, background: dotColor }} aria-hidden />{target.posName}
              </span>
            </div>
            <div style={styles.prompt}>Who was drafted here?</div>
          </div>

          <div className="answer-grid">
            {round.options.map((opt) => {
              const isChosen = chosenId === opt.id, isCorrect = opt.id === correctId, reveal = chosenId !== null;
              let cls = "btn answer";
              if (reveal && isCorrect) cls += " correct";
              else if (reveal && isChosen && !isCorrect) cls += " wrong";
              return <button key={opt.id} className={cls} onClick={() => onPick(opt)} disabled={reveal}>{opt.name}</button>;
            })}
          </div>
        </>
      )}

      {phase === "over" && (
        <div className="card" style={styles.centerCard}>
          {error ? <div style={styles.overMsg}>{error}</div> : (
            <>
              <div style={styles.overTitle}>Run over</div>
              <div style={styles.overMsg}>{score} correct <span style={{ color: "var(--muted)" }}>(best {best})</span></div>
            </>
          )}
          <button className="btn play-again" onClick={playAgain} disabled={pool.length < 4}>Play again</button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 560, margin: "0 auto", width: "100%", color: "var(--text)", display: "flex", flexDirection: "column", gap: 16 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  title: { fontWeight: 700, fontSize: 18, letterSpacing: 0.2 },
  scoreBox: { display: "flex", flexDirection: "column", alignItems: "center", minWidth: 54 },
  scoreLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--muted)" },
  scoreValue: { fontSize: 22, fontWeight: 800, lineHeight: 1.1 },
  profile: { display: "flex", flexDirection: "column", gap: 10, textAlign: "center", alignItems: "center" },
  bigPick: { fontSize: 26, fontWeight: 900, fontFamily: "var(--font-cond)", textTransform: "uppercase", color: "var(--accent)" },
  draftLine: { fontSize: 15, color: "var(--text)", fontWeight: 600 },
  clues: { display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  dot: { width: 11, height: 11, borderRadius: "50%", display: "inline-block", flexShrink: 0 },
  prompt: { marginTop: 4, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--muted)" },
  centerCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center", padding: "28px 20px" },
  overTitle: { fontSize: 22, fontWeight: 800 },
  overMsg: { fontSize: 17 },
};

const css = `
.card { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 16px; }
.chip { background: var(--panel-2); border: 1px solid var(--border); color: var(--text); font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: 999px; letter-spacing: 0.3px; }
.btn { font: inherit; cursor: pointer; border-radius: 12px; border: 1px solid var(--border); background: var(--panel-2); color: var(--text); font-weight: 600; transition: background 0.12s ease, border-color 0.12s ease, transform 0.06s ease; }
.btn:active { transform: translateY(1px); }
.btn:disabled { cursor: default; }
.answer { min-height: 44px; padding: 12px 14px; font-size: 15px; line-height: 1.25; text-align: center; }
.answer:not(:disabled):hover { border-color: var(--accent); background: var(--panel); }
.answer.correct { background: color-mix(in srgb, var(--accent-2) 22%, var(--panel-2)); border-color: var(--accent-2); color: var(--text); }
.answer.wrong { background: color-mix(in srgb, var(--danger) 22%, var(--panel-2)); border-color: var(--danger); color: var(--text); }
.play-again { min-height: 44px; padding: 12px 22px; font-size: 15px; background: var(--accent); border-color: var(--accent); color: #fff; }
.play-again:not(:disabled):hover { filter: brightness(1.08); }
.answer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
@media (max-width: 480px) { .answer-grid { grid-template-columns: 1fr; } }
`;
