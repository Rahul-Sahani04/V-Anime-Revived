import { ImageResponse } from "next/og";

export const alt = "Advanced Anime Search | V-Anime Revived";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function SearchOGImage() {
  const sampleGenres = ["Action", "Fantasy", "Romance", "Adventure", "Sci-Fi", "Mystery", "Supernatural", "Comedy"];

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
            "radial-gradient(circle at 80% 20%, rgba(225, 29, 72, 0.2) 0%, transparent 45%), radial-gradient(circle at 20% 80%, rgba(2, 169, 255, 0.15) 0%, transparent 45%)",
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
              V-Anime <span style={{ color: "#E11D48" }}>Search</span>
            </span>
          </div>

          <div
            style={{
              padding: "8px 18px",
              borderRadius: "999px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#CBD5E1",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            Multi-Attribute Filtering
          </div>
        </div>

        {/* Center: Search Headline & Filter Pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h1
            style={{
              fontSize: "56px",
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: "-1px",
              color: "#FFFFFF",
              margin: 0,
            }}
          >
            Explore & Discover Anime by Genre, Season, Year & Score
          </h1>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", maxWidth: "900px" }}>
            {sampleGenres.map((genre) => (
              <div
                key={genre}
                style={{
                  padding: "8px 18px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(22, 27, 38, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#E2E8F0",
                }}
              >
                {genre}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ color: "#94A3B8", fontSize: "16px", fontWeight: 600 }}>
            Instant Debounced Search • Live URL Sync • Pagination
          </div>

          <div
            style={{
              padding: "10px 22px",
              borderRadius: "12px",
              backgroundColor: "#E11D48",
              color: "#FFFFFF",
              fontSize: "15px",
              fontWeight: 800,
              boxShadow: "0 0 20px rgba(225, 29, 72, 0.4)",
            }}
          >
            Start Exploring 🔍
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
