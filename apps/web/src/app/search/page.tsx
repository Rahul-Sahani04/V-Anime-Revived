"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AnimeCard } from "@/components/ui/AnimeCard";
import { Search, Sparkles, Loader2 } from "lucide-react";

interface SearchResultItem {
  id: number;
  title?: {
    english?: string;
    romaji?: string;
  };
  coverImage?: {
    extraLarge?: string;
    large?: string;
  };
  episodes?: number;
  averageScore?: number;
}

const POPULAR_GENRES = [
  "All",
  "Action",
  "Adventure",
  "Supernatural",
  "Drama",
  "Fantasy",
  "Shounen",
  "Mystery",
  "Sci-Fi",
];

const DISCOVERY_SUGGESTIONS = [
  {
    id: 113415,
    title: "Jujutsu Kaisen",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg",
    episodeCount: 24,
    rating: "9.2",
    genre: "Action, Supernatural",
  },
  {
    id: 16498,
    title: "Attack on Titan",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-73IhOXpJZiMF.jpg",
    episodeCount: 25,
    rating: "9.5",
    genre: "Action, Drama",
  },
  {
    id: 104578,
    title: "Vinland Saga",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx104578-LaZYFnmhFvdI.jpg",
    episodeCount: 24,
    rating: "9.1",
    genre: "Action, Historical",
  },
  {
    id: 11061,
    title: "Hunter x Hunter (2011)",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sMuvBNOJjPZe.png",
    episodeCount: 148,
    rating: "9.3",
    genre: "Adventure, Fantasy",
  },
  {
    id: 21,
    title: "One Piece",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx21-tXMN3Y20PIL9.jpg",
    episodeCount: 1071,
    rating: "8.9",
    genre: "Action, Adventure",
  },
  {
    id: 1535,
    title: "Death Note",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-lawCWTlzntTj.jpg",
    episodeCount: 37,
    rating: "9.0",
    genre: "Mystery, Psychological",
  },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchAnime = useAction(api.anilist.searchAnime);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const data = await searchAnime({ query });
      setResults(data || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenreClick = (genre: string) => {
    setActiveGenre(genre);
    if (genre !== "All") {
      setQuery(genre);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 lg:px-8 max-w-6xl pb-24">
      {/* Search Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-3xl text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Explore The Infinite Anime Vault</span>
        </div>

        <h1 className="mb-6 text-4xl sm:text-5xl font-black tracking-tight text-white">
          Discover & Watch
        </h1>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="relative flex w-full items-center mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by anime name, characters, or studios..."
            className="w-full rounded-2xl border border-surface-border bg-surface/90 backdrop-blur-md py-4 pl-12 pr-32 text-sm sm:text-base text-foreground shadow-2xl transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Search className="absolute left-4 h-5 w-5 text-muted pointer-events-none" />

          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2.5 rounded-xl bg-primary px-6 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-102 disabled:opacity-50 shadow-[0_0_15px_rgba(225,29,72,0.4)]"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </span>
            ) : (
              "Search"
            )}
          </button>
        </form>

        {/* Genre Tags */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {POPULAR_GENRES.map((genre) => {
            const isActive = activeGenre === genre;
            return (
              <button
                key={genre}
                onClick={() => handleGenreClick(genre)}
                className={`relative px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(225,29,72,0.3)]"
                    : "bg-surface/70 text-muted hover:text-white border border-surface-border"
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Results Section */}
      {hasSearched ? (
        <div className="mt-14">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-primary" />
              Search Results ({results.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 py-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2 animate-pulse">
                  <div className="aspect-[2/3] w-full rounded-xl bg-surface border border-surface-border" />
                  <div className="h-4 w-3/4 rounded bg-surface" />
                  <div className="h-3 w-1/2 rounded bg-surface/60" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-surface-border bg-surface/50 p-12 text-center">
              <p className="text-lg font-semibold text-foreground">No anime found for &quot;{query}&quot;</p>
              <p className="text-xs text-muted mt-1">Try searching for popular titles like &quot;Jujutsu Kaisen&quot;, &quot;One Piece&quot;, or &quot;Attack on Titan&quot;</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
            >
              {results.map((anime) => (
                <AnimeCard
                  key={anime.id}
                  id={anime.id}
                  title={anime.title?.english || anime.title?.romaji || "Unknown"}
                  posterUrl={anime.coverImage?.extraLarge || anime.coverImage?.large || ""}
                  episodeCount={anime.episodes}
                  rating={anime.averageScore ? (anime.averageScore / 10).toFixed(1) : undefined}
                />
              ))}
            </motion.div>
          )}
        </div>
      ) : (
        /* Discovery Suggestions if user hasn't queried yet */
        <div className="mt-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-primary" />
              Trending Discoveries
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {DISCOVERY_SUGGESTIONS.map((anime) => (
              <AnimeCard key={anime.id} {...anime} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
