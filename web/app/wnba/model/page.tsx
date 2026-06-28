import { pageMeta } from "@/lib/seo";
import ModelView from "@/components/ModelView";

export const metadata = pageMeta({
  title: "WNBA Model — projections, futures & value",
  description: "Model win probabilities, projected scores, championship futures and bookmaker value for every WNBA game — from a clean-room possession/efficiency model.",
  path: "/wnba/model",
  keywords: ["WNBA model", "WNBA projections", "WNBA predictions", "WNBA championship odds", "WNBA value bets"],
});

export default function WnbaModelPage() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>WNBA Model</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>Win probabilities, projected scores, championship futures and bookmaker value — every game, every market.</p>
      </header>
      <ModelView league="wnba" />
    </div>
  );
}
