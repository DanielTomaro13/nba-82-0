import { pageMeta } from "@/lib/seo";
import { notablePlayers } from "@/lib/playerdb";
import PlayersBrowser from "@/components/PlayersBrowser";

export const metadata = pageMeta({
  title: "WNBA Players — search every player",
  description: "Search and filter every WNBA player in the dataset by name, club and position. Career games, points and an all-time rating for each.",
  path: "/wnba/players",
  keywords: ["WNBA players", "WNBA player ratings", "WNBA player stats"],
});

function safeNotable() {
  try { return notablePlayers("wnba"); } catch { return []; }
}

export default function WnbaPlayersPage() {
  const players = safeNotable().slice().sort((a, b) => b.fame - a.fame);
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Players</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>{players.length} players, ranked and rated from real WNBA match stats.</p>
      </header>
      {players.length > 0 ? <PlayersBrowser players={players} league="wnba" /> : (
        <div className="card" style={{ padding: "1.5rem", color: "var(--muted)" }}>
          WNBA player profiles arrive once the season pipeline has run.
        </div>
      )}
    </div>
  );
}
