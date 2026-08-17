import { ImageResponse } from "next/og";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

export default async function WatchOGImage({
  params,
}: {
  params: Promise<{ id: string; episode: string }>;
}) {
  const { id, episode } = await params;
  const numId = parseInt(id, 10);

  let title = "Anime Series";
  let bannerUrl = "";

  if (numId) {
    try {
      const anime = await convex.action(api.anilist.getAnimeDetails, { id: numId });
      if (anime) {
        title = anime.title?.english || anime.title?.romaji || title;
        bannerUrl = anime.bannerUrl || anime.posterUrl || "";
      }
    } catch {
      // Fallback
    }
  }

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
          fontFamily: "sans-serif",
          color: "#F8FAFC",
          padding: "55px 65px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Blurred Background Banner */}
        {bannerUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={bannerUrl}
            alt={title}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.3,
            }}
          />
        ) : null}

        {/* Cinematic Gradient Vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at center, rgba(11, 14, 20, 0.7) 0%, rgba(11, 14, 20, 0.95) 100%)",
          }}
        />

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
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                backgroundColor: "#E11D48",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: "22px",
                fontWeight: 900,
                boxShadow: "0 0 20px rgba(225, 29, 72, 0.6)",
              }}
            >
              V
            </div>
            <span style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.5px" }}>
              V-Anime <span style={{ color: "#E11D48" }}>Player</span>
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              borderRadius: "999px",
              backgroundColor: "rgba(225, 29, 72, 0.2)",
              border: "1px solid rgba(225, 29, 72, 0.4)",
              color: "#FB7185",
              fontSize: "14px",
              fontWeight: 800,
            }}
          >
            ▶ Now Streaming Episode {episode}
          </div>
        </div>

        {/* Center: Massive Title & Stream Quality Tag */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <span
            style={{
              fontSize: "16px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "#E11D48",
            }}
          >
            Watch Online Free in HD
          </span>
          <h1
            style={{
              fontSize: "58px",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-1px",
              color: "#FFFFFF",
              margin: 0,
              maxWidth: "950px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </h1>
        </div>

        {/* Bottom Feature Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", gap: "12px" }}>
            <div
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                backgroundColor: "rgba(22, 27, 38, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                fontSize: "14px",
                fontWeight: 700,
                color: "#E2E8F0",
              }}
            >
              🇯🇵 Subbed & 🇺🇸 Dubbed
            </div>
            <div
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                backgroundColor: "rgba(22, 27, 38, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                fontSize: "14px",
                fontWeight: 700,
                color: "#E2E8F0",
              }}
            >
              🚀 7 Fast HLS Servers
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#94A3B8",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Autoplay • Auto-Next • Zero Buffering
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
