import { pageMeta } from "@/lib/seo";
import ModelView from "@/components/ModelView";

export const metadata = pageMeta({
  title: "NBA Model — projections, futures & value",
  description: "Model win probabilities, projected scores, championship futures and bookmaker value for every NBA game — from a clean-room possession/efficiency model.",
  path: "/model",
  keywords: ["NBA model", "NBA projections", "NBA predictions", "NBA championship odds", "NBA value bets"],
});

export default function ModelPage() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>NBA Model</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>Win probabilities, projected scores, championship futures and bookmaker value — every game, every market.</p>
      </header>
      <ModelView league="nba" />
    </div>
  );
}
