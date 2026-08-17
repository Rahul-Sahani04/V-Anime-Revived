import { ImageResponse } from "next/og";

export const alt = "My Library | V-Anime Revived";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function LibraryOGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0B0E14",
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(225, 29, 72, 0.25) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(2, 169, 255, 0.2) 0%, transparent 50%)",
          padding: "60px 70px",
          fontFamily: "sans-serif",
          color: "#F8FAFC",
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                backgroundColor: "#E11D48",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: "24px",
                fontWeight: 900,
              }}
            >
              V
            </div>
            <span style={{ fontSize: "26px", fontWeight: 900 }}>
              V-Anime <span style={{ color: "#E11D48" }}>Library</span>
            </span>
          </div>

          <div
            style={{
              padding: "8px 18px",
              borderRadius: "999px",
              backgroundColor: "rgba(2, 169, 255, 0.15)",
              border: "1px solid rgba(2, 169, 255, 0.35)",
              color: "#38BDF8",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            Cloud Synchronization
          </div>
        </div>

        {/* Center: Headlines and Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "900px" }}>
          <h1
            style={{
              fontSize: "58px",
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: "-1px",
              color: "#FFFFFF",
              margin: 0,
            }}
          >
            Your Personal Anime Command Center
          </h1>
          <p style={{ fontSize: "20px", color: "#94A3B8", margin: 0, lineHeight: 1.4 }}>
            Track in-progress episodes, organize custom watchlists, save all-time favorites, and sync watch history across all devices.
          </p>
        </div>

        {/* Bottom Feature Tabs Showcase */}
        <div style={{ display: "flex", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 22px",
              borderRadius: "14px",
              backgroundColor: "rgba(22, 27, 38, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "15px",
              fontWeight: 700,
              color: "#FFFFFF",
            }}
          >
            ▶ Continue Watching
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 22px",
              borderRadius: "14px",
              backgroundColor: "rgba(22, 27, 38, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "15px",
              fontWeight: 700,
              color: "#FFFFFF",
            }}
          >
            📑 Watchlist & Bookmarks
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 22px",
              borderRadius: "14px",
              backgroundColor: "rgba(22, 27, 38, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "15px",
              fontWeight: 700,
              color: "#FFFFFF",
            }}
          >
            ❤️ Masterpiece Favorites
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
