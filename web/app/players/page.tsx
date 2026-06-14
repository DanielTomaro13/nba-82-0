import { pageMeta } from "@/lib/seo";
import { allPlayers } from "@/lib/playerdb";
import PlayersBrowser from "@/components/PlayersBrowser";

export const metadata = pageMeta({
  title: "NBA Players — search every player",
  description: "Search and filter every NBA player in the dataset by name, club and position. Career games, points and an all-time rating for each.",
  path: "/players",
  keywords: ["NBA players", "NBA player ratings", "NBA player stats"],
});

export default function PlayersPage() {
  const players = allPlayers().sort((a, b) => b.fame - a.fame);
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Players</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>{players.length} players, ranked and rated from real NBA match stats.</p>
      </header>
      <PlayersBrowser players={players} />
    </div>
  );
}
