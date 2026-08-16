"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AnimeCard } from "@/components/ui/AnimeCard";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // We wrap it in a safe try-catch because `api` might not be generated yet until `npx convex dev` is run.
  let searchAnime: any;
  try {
    searchAnime = useAction(api.anilist.searchAnime);
  } catch {
    searchAnime = async () => [];
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const data = await searchAnime({ query });
      setResults(data || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="mb-8 text-4xl font-bold tracking-tight">Search Anime</h1>
        
        <form onSubmit={handleSearch} className="relative flex w-full items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to watch?"
            className="w-full rounded-lg border border-surface-border bg-surface py-4 pl-4 pr-32 text-lg text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none"
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className="absolute right-2 rounded-md bg-primary px-6 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? "..." : "Search"}
          </button>
        </form>
      </div>

      {results.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 text-xl font-semibold text-muted">Search Results</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {results.map((anime: any) => (
              <AnimeCard 
                key={anime.id} 
                id={anime.id}
                title={anime.title?.english || anime.title?.romaji || "Unknown"}
                posterUrl={anime.coverImage?.extraLarge || anime.coverImage?.large || ""}
                episodeCount={anime.episodes}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
