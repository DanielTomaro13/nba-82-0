import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "NBA 82-0 — build the perfect all-time NBA team";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "70px 80px",
          background: "linear-gradient(135deg,#0b0b10,#121119 55%,#16141d)",
          color: "#f4f3f7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: "#a09bb0", letterSpacing: 6 }}>
          ALL-TIME NBA DRAFT
        </div>
        <div style={{ display: "flex", fontSize: 128, fontWeight: 800, lineHeight: 1, marginTop: 12 }}>
          BUILD THE PERFECT
        </div>
        <div style={{ display: "flex", fontSize: 128, fontWeight: 800, lineHeight: 1 }}>
          <span style={{ color: "#ee6730" }}>82–0</span>
          <span style={{ marginLeft: 24 }}>SEASON</span>
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#a09bb0", marginTop: 28 }}>
          nba82-0.com · spin · draft · go 82-0
        </div>
      </div>
    ),
    { ...size }
  );
}
