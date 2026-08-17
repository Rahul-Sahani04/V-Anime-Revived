import { ImageResponse } from "next/og";

export const alt = "V-Anime Revived | Next-Gen Anime Streaming";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#0B0E14",
          backgroundImage:
            "radial-gradient(circle at 15% 15%, rgba(225, 29, 72, 0.25) 0%, transparent 50%), radial-gradient(circle at 85% 85%, rgba(2, 169, 255, 0.15) 0%, transparent 45%)",
          padding: "60px 70px",
          fontFamily: "sans-serif",
          color: "#F8FAFC",
          position: "relative",
        }}
      >
        {/* Subtle grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            opacity: 0.6,
          }}
        />

        {/* Top Bar: Brand Logo & Pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                backgroundColor: "#E11D48",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: "26px",
                fontWeight: 900,
                boxShadow: "0 0 25px rgba(225, 29, 72, 0.5)",
              }}
            >
              V
            </div>
            <span style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.5px" }}>
              V-Anime <span style={{ color: "#E11D48" }}>Revived</span>
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 18px",
              borderRadius: "999px",
              backgroundColor: "rgba(225, 29, 72, 0.15)",
              border: "1px solid rgba(225, 29, 72, 0.35)",
              color: "#FB7185",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            HD Streaming • Zero Ads
          </div>
        </div>

        {/* Main Content: Hero Headline & Subtext */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "900px" }}>
          <h1
            style={{
              fontSize: "64px",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              margin: 0,
              color: "#FFFFFF",
            }}
          >
            Stream 10,000+ Anime Series in Ultra HD
          </h1>
          <p
            style={{
              fontSize: "22px",
              lineHeight: 1.4,
              color: "#94A3B8",
              margin: 0,
            }}
          >
            Next-generation anime platform with lightning-fast CDN streaming, AniList watchlist synchronization, and community playback tracking.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "12px",
              backgroundColor: "rgba(22, 27, 38, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "15px",
              fontWeight: 700,
              color: "#E2E8F0",
            }}
          >
            ⚡ Multi-Server Fallback
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "12px",
              backgroundColor: "rgba(22, 27, 38, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "15px",
              fontWeight: 700,
              color: "#E2E8F0",
            }}
          >
            🎧 Dual Audio (Sub & Dub)
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "12px",
              backgroundColor: "rgba(2, 169, 255, 0.12)",
              border: "1px solid rgba(2, 169, 255, 0.35)",
              fontSize: "15px",
              fontWeight: 700,
              color: "#38BDF8",
            }}
          >
            🔄 1-Click AniList Sync
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
