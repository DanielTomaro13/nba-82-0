import { pageMeta } from "@/lib/seo";
import ModelView from "@/components/ModelView";

export const metadata = pageMeta({
  title: "NBA Summer League Model — projections & value",
  description: "Model win probabilities, projected scores and bookmaker value for every NBA Summer League game (Las Vegas, California Classic, Salt Lake City) — from a clean-room possession/efficiency model.",
  path: "/summer/model",
  keywords: ["NBA Summer League model", "Summer League projections", "Summer League predictions", "Vegas Summer League odds", "Summer League value bets"],
});

export default function SummerModelPage() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Summer League Model</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>Win probabilities, projected scores and bookmaker value for every Summer League game. Player props, futures and fantasy don&apos;t run for Summer League — there&apos;s no box-score feed for it.</p>
      </header>
      <ModelView league="nbasummer" />
    </div>
  );
}
