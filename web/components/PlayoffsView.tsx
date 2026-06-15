"use client";
import { useEffect, useState } from "react";
import { loadPlayoffsBySeason, type Playoffs } from "@/lib/data";
import PlayoffBracket from "@/components/PlayoffBracket";

export default function PlayoffsView({ initial }: { initial: Playoffs }) {
  const [all, setAll] = useState<Record<string, Playoffs> | null>(null);
  const [season, setSeason] = useState(initial.season);
  useEffect(() => { loadPlayoffsBySeason().then(setAll).catch(() => {}); }, []);
  const data = (all && all[season]) || initial;
  const seasons = all ? Object.keys(all).sort().reverse() : [initial.season];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <label style={{ fontSize: ".82rem", color: "var(--muted)" }}>Season</label>
        <select value={season} onChange={(e) => setSeason(e.target.value)}
          style={{ padding: ".4rem .6rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" }}>
          {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <PlayoffBracket data={data} />
    </div>
  );
}
