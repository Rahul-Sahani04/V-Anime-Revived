"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { HeroCarousel, FeaturedAnime } from "./HeroCarousel";
import { ContinueWatchingShelf } from "./ContinueWatchingShelf";
import { AnimeShelf } from "./AnimeShelf";

interface RawAnime {
  id: number;
  title: {
    english?: string;
    romaji?: string;
    native?: string;
  };
  description?: string;
  coverImage?: {
    extraLarge?: string;
    large?: string;
  };
  bannerImage?: string;
  episodes?: number;
  status?: string;
  genres?: string[];
  averageScore?: number;
}

export function HomeFeedClient() {
  const [trending, setTrending] = useState<RawAnime[]>([]);
  const [popular, setPopular] = useState<RawAnime[]>([]);
  const [topRated, setTopRated] = useState<RawAnime[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getHomeFeedAction = useAction(api.anilist.getHomeFeed);

  useEffect(() => {
    let isMounted = true;
    async function loadFeed() {
      try {
        const feed = await getHomeFeedAction({});
        if (isMounted && feed) {
          setTrending(feed.trending || []);
          setPopular(feed.popular || []);
          setTopRated(feed.topRated || []);
        }
      } catch (err) {
        console.error("Failed to load home feed from Convex", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadFeed();
    return () => {
      isMounted = false;
    };
  }, [getHomeFeedAction]);

  // Convert raw trending anime to FeaturedAnime format for HeroCarousel
  const featuredList: FeaturedAnime[] = trending.slice(0, 5).map((anime) => ({
    id: anime.id,
    title: anime.title.english || anime.title.romaji || "Anime",
    bannerUrl: anime.bannerImage || anime.coverImage?.extraLarge || "",
    posterUrl: anime.coverImage?.extraLarge || anime.coverImage?.large || "",
    description: anime.description?.replace(/<[^>]*>?/gm, "").trim() || "Watch this series on V-Anime Revived.",
    episodes: anime.episodes,
    type: "TV Series",
    genres: anime.genres || ["Action"],
    rating: anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "9.0",
    status: anime.status || "FINISHED",
  }));

  // Convert RawAnime to AnimeItem format for shelves
  const formatShelfItems = (list: RawAnime[]) =>
    list.map((anime) => ({
      id: anime.id,
      title: anime.title.english || anime.title.romaji || "Anime",
      posterUrl: anime.coverImage?.extraLarge || anime.coverImage?.large || "",
      episodeCount: anime.episodes,
      rating: anime.averageScore ? (anime.averageScore / 10).toFixed(1) : undefined,
      genre: anime.genres?.join(", "),
    }));

  return (
    <div className="flex flex-col gap-12 pb-24">
      {/* Cinematic Hero Spotlight Carousel */}
      <HeroCarousel items={featuredList.length > 0 ? featuredList : undefined} />

      {/* Reactive Continue Watching Shelf */}
      <ContinueWatchingShelf />

      {/* Trending Now Shelf */}
      <AnimeShelf
        title="Trending Now"
        subtitle="Most watched series across the community this week"
        icon="flame"
        categories={["All", "Action", "Adventure", "Fantasy", "Supernatural", "Drama"]}
        items={formatShelfItems(trending)}
      />

      {/* Popular This Season Shelf */}
      {popular.length > 0 && (
        <AnimeShelf
          title="Popular This Season"
          subtitle="Top rated broadcasts and seasonal favorites"
          icon="sparkles"
          categories={["All", "Action", "Comedy", "Sci-Fi", "Mystery"]}
          items={formatShelfItems(popular)}
        />
      )}

      {/* All Time Masterpieces */}
      {topRated.length > 0 && (
        <AnimeShelf
          title="Critically Acclaimed"
          subtitle="Highest community ratings of all time"
          icon="sparkles"
          items={formatShelfItems(topRated)}
        />
      )}

      {/* Initial loading placeholder if feed is fetching */}
      {isLoading && trending.length === 0 && (
        <div className="container mx-auto px-4 lg:px-8 -mt-8 flex justify-center py-12">
          <div className="flex items-center gap-3 text-sm text-muted">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Curating anime feed...</span>
          </div>
        </div>
      )}
    </div>
  );
}
