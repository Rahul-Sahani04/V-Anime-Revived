import { ImageResponse } from "next/og";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

export default async function AnimeOGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = parseInt(id, 10);

  let title = "Anime Details";
  let posterUrl = "";
  let bannerUrl = "";
  let rating = "9.0";
  let episodes = "24";
  let genres: string[] = ["Action", "Anime"];
  let description = "Stream this anime in HD on V-Anime Revived.";

  if (numId) {
    try {
      const anime = await convex.action(api.anilist.getAnimeDetails, { id: numId });
      if (anime) {
        title = anime.title?.english || anime.title?.romaji || title;
        posterUrl = anime.posterUrl || "";
        bannerUrl = anime.bannerUrl || "";
        if (anime.rating) rating = String(anime.rating);
        if (anime.episodes) episodes = String(anime.episodes);
        if (anime.genres && anime.genres.length > 0) genres = anime.genres.slice(0, 3);
        if (anime.description) {
          description = anime.description.replace(/<[^>]*>?/gm, "").slice(0, 160) + "...";
        }
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
          backgroundColor: "#0B0E14",
          fontFamily: "sans-serif",
          color: "#F8FAFC",
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
              opacity: 0.25,
              filter: "blur(8px)",
            }}
          />
        ) : null}

        {/* Dark Vignette & Gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(11, 14, 20, 0.95) 0%, rgba(11, 14, 20, 0.8) 50%, rgba(11, 14, 20, 0.6) 100%)",
          }}
        />

        {/* Content Layout */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            height: "100%",
            padding: "50px 60px",
            gap: "45px",
            zIndex: 10,
          }}
        >
          {/* Poster Image Card */}
          {posterUrl ? (
            <div
              style={{
                width: "280px",
                height: "410px",
                borderRadius: "20px",
                overflow: "hidden",
                border: "2px solid rgba(225, 29, 72, 0.4)",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(225, 29, 72, 0.25)",
                display: "flex",
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={posterUrl}
                alt={title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          ) : null}

          {/* Right Info Section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
              flex: 1,
            }}
          >
            {/* Header Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(225, 29, 72, 0.2)",
                  border: "1px solid rgba(225, 29, 72, 0.4)",
                  color: "#FB7185",
                  fontSize: "13px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                V-Anime • Series
              </div>
              <div
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  color: "#CBD5E1",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                {episodes} Episodes
              </div>
              <div
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  color: "#F43F5E",
                  fontSize: "13px",
                  fontWeight: 800,
                }}
              >
                ★ {rating}
              </div>
            </div>

            {/* Title & Synopsis */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h1
                style={{
                  fontSize: "46px",
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: "-1px",
                  color: "#FFFFFF",
                  margin: 0,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {title}
              </h1>
              <p
                style={{
                  fontSize: "17px",
                  lineHeight: 1.45,
                  color: "#94A3B8",
                  margin: 0,
                }}
              >
                {description}
              </p>
            </div>

            {/* Genres & Call-to-Action */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                {genres.map((g) => (
                  <div
                    key={g}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(22, 27, 38, 0.9)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#E2E8F0",
                    }}
                  >
                    {g}
                  </div>
                ))}
              </div>

              <div
                style={{
                  padding: "10px 22px",
                  borderRadius: "12px",
                  backgroundColor: "#E11D48",
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontWeight: 800,
                  boxShadow: "0 0 20px rgba(225, 29, 72, 0.5)",
                }}
              >
                Watch Now ▶
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
