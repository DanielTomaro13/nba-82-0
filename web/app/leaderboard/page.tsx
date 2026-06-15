import { pageMeta } from "@/lib/seo";
import LeaderboardView from "@/components/LeaderboardView";
import AdUnit from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";

export const metadata = pageMeta({
  title: "Hall of Fame — NBA 82-0 leaderboards",
  description: "The best Perfect Season records, Invincibles runs, daily streaks and high scores across every NBA 82-0 game.",
  path: "/leaderboard",
  keywords: ["NBA 82-0 leaderboard", "NBA game high scores", "hall of fame"],
});

export default function LeaderboardPage() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Hall of Fame</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>The best records, runs and streaks across every game.</p>
      </header>
      <LeaderboardView />
      <AdUnit slot={AD_SLOTS.result} />
    </div>
  );
}
