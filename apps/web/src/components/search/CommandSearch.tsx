"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Search, X, Play, Sparkles, Loader2 } from "lucide-react";

// Curated default trending list for instant display before typing
const DEFAULT_TRENDING = [
  { id: 113415, title: "Jujutsu Kaisen", genre: "Action, Supernatural", episodes: 24, poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg" },
  { id: 16498, title: "Attack on Titan", genre: "Action, Drama, Fantasy", episodes: 25, poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-73IhOXpJZiMF.jpg" },
  { id: 104578, title: "Vinland Saga", genre: "Action, Adventure, Historical", episodes: 24, poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx104578-LaZYFnmhFvdI.jpg" },
  { id: 11061, title: "Hunter x Hunter (2011)", genre: "Action, Adventure", episodes: 148, poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sMuvBNOJjPZe.png" },
  { id: 21, title: "One Piece", genre: "Action, Adventure, Comedy", episodes: 1071, poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx21-tXMN3Y20PIL9.jpg" },
  { id: 1535, title: "Death Note", genre: "Mystery, Psychological, Thriller", episodes: 37, poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-lawCWTlzntTj.jpg" },
  { id: 101922, title: "Demon Slayer: Kimetsu no Yaiba", genre: "Action, Fantasy", episodes: 26, poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0Clmgta.jpg" },
  { id: 127230, title: "Chainsaw Man", genre: "Action, Supernatural", episodes: 12, poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-FloXTaKaTZbu.png" },
];

interface CommandSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: number;
  title: string;
  genre: string;
  episodes: number;
  poster: string;
}

export function CommandSearch({ isOpen, onClose }: CommandSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchItem[]>(DEFAULT_TRENDING);
  const [isSearching, setIsSearching] = useState(false);
  const searchAction = useAction(api.anilist.searchAnime);
  const router = useRouter();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Live fuzzy search effect with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults(DEFAULT_TRENDING);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await searchAction({ query: query.trim() });
        if (data && data.length > 0) {
          const mapped: SearchItem[] = data.map((item: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
            id: item.id,
            title: item.title?.english || item.title?.romaji || "Anime",
            genre: (item.genres || []).slice(0, 3).join(", ") || "Action, Anime",
            episodes: item.episodes || 24,
            poster: item.coverImage?.large || item.coverImage?.extraLarge || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
          }));
          setResults(mapped);
        } else {
          // Fallback filter
          const fallback = DEFAULT_TRENDING.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase())
          );
          setResults(fallback);
        }
      } catch (err) {
        console.warn("Search palette error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, searchAction]);

  const handleSelect = useCallback(
    (id: number) => {
      onClose();
      router.push(`/anime/${id}`);
    },
    [onClose, router]
  );

  const handleFullSearch = useCallback(() => {
    if (query.trim()) {
      onClose();
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, onClose, router]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex].id);
        } else {
          handleFullSearch();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, handleSelect, handleFullSearch, onClose]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSelectedIndex(0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-surface-border bg-surface shadow-2xl shadow-black/80"
          >
            {/* Search Input Header */}
            <div className="flex items-center gap-3 border-b border-surface-border px-4 py-3.5 bg-surface/50">
              {isSearching ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
              ) : (
                <Search className="h-5 w-5 text-primary shrink-0" />
              )}
              <input
                id="palette-search-input"
                name="palette-search"
                aria-label="Search anime titles, genres, or series"
                type="text"
                autoFocus
                placeholder="Search any anime, synonyms, or characters..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    setSelectedIndex(0);
                  }}
                  className="rounded p-1 text-muted hover:bg-surface-hover hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className="flex items-center gap-1 text-[11px] font-mono text-muted bg-surface-hover px-2 py-0.5 rounded border border-surface-border">
                <span>ESC</span>
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-[380px] overflow-y-auto p-2">
              <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  {query ? <Search className="h-3 w-3" /> : <Sparkles className="h-3 w-3 text-primary" />}
                  {query ? `Matches (${results.length})` : "Trending Anime"}
                </span>
                {query && (
                  <button
                    onClick={handleFullSearch}
                    className="text-xs text-primary hover:underline lowercase"
                  >
                    View all in advanced search →
                  </button>
                )}
              </div>

              {results.length === 0 && !isSearching ? (
                <div className="py-12 text-center text-sm text-muted">
                  No anime found matching &quot;{query}&quot;
                  <div className="mt-2">
                    <button
                      onClick={handleFullSearch}
                      className="text-xs text-primary underline"
                    >
                      Try advanced multi-attribute search
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((item, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleSelect(item.id)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`group flex items-center justify-between gap-3 rounded-lg p-2 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-surface-hover border border-primary/40 shadow-sm"
                            : "hover:bg-surface-hover border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-surface border border-surface-border">
                            <Image
                              src={item.poster}
                              alt={item.title}
                              fill
                              className="object-cover"
                              sizes="36px"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className={`text-sm font-semibold truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                              {item.title}
                            </h4>
                            <p className="text-xs text-muted truncate">{item.genre}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-mono text-muted bg-surface/80 px-2 py-0.5 rounded border border-surface-border">
                            {item.episodes} EP
                          </span>
                          <span
                            className={`rounded-full p-1.5 transition-colors ${
                              isSelected ? "bg-primary text-primary-foreground" : "text-muted"
                            }`}
                          >
                            <Play className="h-3 w-3 fill-current" />
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Footer Info */}
            <div className="flex items-center justify-between border-t border-surface-border px-4 py-2 text-[11px] text-muted bg-surface/80">
              <div className="flex items-center gap-2">
                <span>Navigate</span>
                <kbd className="px-1.5 py-0.5 rounded bg-surface-hover border border-surface-border font-mono">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-surface-hover border border-surface-border font-mono">↓</kbd>
                <span>Select</span>
                <kbd className="px-1.5 py-0.5 rounded bg-surface-hover border border-surface-border font-mono">↵</kbd>
              </div>
              <div className="flex items-center gap-1">
                <span>Fuzzy & Rate-Limit Free</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
