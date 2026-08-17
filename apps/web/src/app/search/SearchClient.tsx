"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { AnimeCard } from "@/components/ui/AnimeCard";
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

interface SearchResultItem {
  id: number;
  title?: {
    english?: string;
    romaji?: string;
    native?: string;
  };
  coverImage?: {
    extraLarge?: string;
    large?: string;
  };
  bannerImage?: string;
  episodes?: number;
  status?: string;
  format?: string;
  seasonYear?: number;
  genres?: string[];
  averageScore?: number;
}

interface PageInfo {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

const GENRES = [
  "All",
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mahou Shoujo",
  "Mecha",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];

const FORMATS = [
  { label: "All Formats", value: "All" },
  { label: "TV Series", value: "TV" },
  { label: "Movie", value: "MOVIE" },
  { label: "TV Short", value: "TV_SHORT" },
  { label: "OVA", value: "OVA" },
  { label: "Special", value: "SPECIAL" },
];

const SEASONS = [
  { label: "All Seasons", value: "All" },
  { label: "Winter", value: "WINTER" },
  { label: "Spring", value: "SPRING" },
  { label: "Summer", value: "SUMMER" },
  { label: "Fall", value: "FALL" },
];

const STATUSES = [
  { label: "All Statuses", value: "All" },
  { label: "Currently Airing", value: "RELEASING" },
  { label: "Finished", value: "FINISHED" },
  { label: "Not Yet Aired", value: "NOT_YET_RELEASED" },
];

const SORT_OPTIONS = [
  { label: "Most Popular", value: "POPULARITY_DESC" },
  { label: "Highest Rated", value: "SCORE_DESC" },
  { label: "Trending Now", value: "TRENDING_DESC" },
  { label: "Newest Releases", value: "START_DATE_DESC" },
];

const YEARS = [
  { label: "All Years", value: "" },
  { label: "2026", value: "2026" },
  { label: "2025", value: "2025" },
  { label: "2024", value: "2024" },
  { label: "2023", value: "2023" },
  { label: "2022", value: "2022" },
  { label: "2021", value: "2021" },
  { label: "2020", value: "2020" },
  { label: "2010s", value: "2015" },
  { label: "2000s", value: "2005" },
  { label: "1990s", value: "1995" },
];

export function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial states from URL
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [genre, setGenre] = useState(searchParams.get("genre") || "All");
  const [format, setFormat] = useState(searchParams.get("format") || "All");
  const [season, setSeason] = useState(searchParams.get("season") || "All");
  const [year, setYear] = useState(searchParams.get("year") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "All");
  const [sort, setSort] = useState(searchParams.get("sort") || "POPULARITY_DESC");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));

  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    total: 0,
    perPage: 18,
    currentPage: 1,
    lastPage: 1,
    hasNextPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const resultsTopRef = useRef<HTMLDivElement>(null);
  const searchAction = useAction(api.anilist.searchAnimeAdvanced);

  // Sync state changes into URL query params
  const syncUrlParams = useCallback(
    (params: {
      q?: string;
      genre?: string;
      format?: string;
      season?: string;
      year?: string;
      status?: string;
      sort?: string;
      page?: number;
    }) => {
      const url = new URL(window.location.href);
      if (params.q) url.searchParams.set("q", params.q);
      else url.searchParams.delete("q");

      if (params.genre && params.genre !== "All") url.searchParams.set("genre", params.genre);
      else url.searchParams.delete("genre");

      if (params.format && params.format !== "All") url.searchParams.set("format", params.format);
      else url.searchParams.delete("format");

      if (params.season && params.season !== "All") url.searchParams.set("season", params.season);
      else url.searchParams.delete("season");

      if (params.year) url.searchParams.set("year", params.year);
      else url.searchParams.delete("year");

      if (params.status && params.status !== "All") url.searchParams.set("status", params.status);
      else url.searchParams.delete("status");

      if (params.sort && params.sort !== "POPULARITY_DESC") url.searchParams.set("sort", params.sort);
      else url.searchParams.delete("sort");

      if (params.page && params.page > 1) url.searchParams.set("page", params.page.toString());
      else url.searchParams.delete("page");

      router.push(url.pathname + url.search, { scroll: false });
    },
    [router]
  );

  // Execute Search Function
  const executeSearch = useCallback(
    async (targetPage: number) => {
      setIsLoading(true);
      try {
        const data = await searchAction({
          query: query.trim() || undefined,
          genre: genre !== "All" ? genre : undefined,
          format: format !== "All" ? format : undefined,
          season: season !== "All" ? season : undefined,
          seasonYear: year ? parseInt(year, 10) : undefined,
          status: status !== "All" ? status : undefined,
          sort,
          page: targetPage,
          perPage: 18,
        });

        if (data) {
          setResults(data.media || []);
          setPageInfo(data.pageInfo);
        }
      } catch (err) {
        console.error("Advanced search error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [query, genre, format, season, year, status, sort, searchAction]
  );

  // Trigger search on query or filter changes (debounced for typing)
  useEffect(() => {
    const handler = setTimeout(() => {
      syncUrlParams({ q: query, genre, format, season, year, status, sort, page });
      executeSearch(page);
    }, 400);

    return () => clearTimeout(handler);
  }, [query, genre, format, season, year, status, sort, page, syncUrlParams, executeSearch]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (resultsTopRef.current) {
      resultsTopRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleResetFilters = () => {
    setQuery("");
    setGenre("All");
    setFormat("All");
    setSeason("All");
    setYear("");
    setStatus("All");
    setSort("POPULARITY_DESC");
    setPage(1);
  };

  const hasActiveFilters =
    query.trim() !== "" ||
    genre !== "All" ||
    format !== "All" ||
    season !== "All" ||
    year !== "" ||
    status !== "All" ||
    sort !== "POPULARITY_DESC";

  return (
    <div className="container mx-auto px-4 py-10 lg:px-8 max-w-6xl pb-28">
      {/* Search Header Banner */}
      <div className="mx-auto max-w-3xl text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Advanced Search Engine</span>
        </div>

        <h1 className="mb-6 text-4xl sm:text-5xl font-black tracking-tight text-white">
          Discover Any Anime
        </h1>

        {/* Main Search Input */}
        <div className="relative flex w-full items-center mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title, characters, studio..."
            className="w-full rounded-2xl border border-surface-border bg-surface/90 backdrop-blur-md py-4 pl-12 pr-28 text-sm sm:text-base text-foreground shadow-2xl transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Search className="absolute left-4 h-5 w-5 text-muted pointer-events-none" />

          {query && (
            <button
              onClick={() => {
                setQuery("");
                setPage(1);
              }}
              className="absolute right-20 text-muted hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-2.5 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all border ${
              showFilters || hasActiveFilters
                ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(225,29,72,0.4)]"
                : "bg-surface text-muted hover:text-white border-surface-border hover:bg-surface-hover"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Popular Genre Quick Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
          {GENRES.slice(0, 10).map((g) => {
            const isActive = genre === g;
            return (
              <button
                key={g}
                onClick={() => {
                  setGenre(g);
                  setPage(1);
                }}
                className={`relative px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(225,29,72,0.3)]"
                    : "bg-surface/70 text-muted hover:text-white border border-surface-border"
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Expandable Advanced Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-10"
          >
            <div className="rounded-2xl border border-surface-border bg-surface/70 backdrop-blur-xl p-6 shadow-2xl">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Genre Selector */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5 block">
                    Genre
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => {
                      setGenre(e.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs font-semibold text-white focus:border-primary focus:outline-none"
                  >
                    {GENRES.map((g) => (
                      <option key={g} value={g} className="bg-surface text-white">
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Format Selector */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5 block">
                    Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => {
                      setFormat(e.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs font-semibold text-white focus:border-primary focus:outline-none"
                  >
                    {FORMATS.map((f) => (
                      <option key={f.value} value={f.value} className="bg-surface text-white">
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Season Selector */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5 block">
                    Season
                  </label>
                  <select
                    value={season}
                    onChange={(e) => {
                      setSeason(e.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs font-semibold text-white focus:border-primary focus:outline-none"
                  >
                    {SEASONS.map((s) => (
                      <option key={s.value} value={s.value} className="bg-surface text-white">
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Selector */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5 block">
                    Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => {
                      setYear(e.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs font-semibold text-white focus:border-primary focus:outline-none"
                  >
                    {YEARS.map((y) => (
                      <option key={y.value} value={y.value} className="bg-surface text-white">
                        {y.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Selector */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5 block">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs font-semibold text-white focus:border-primary focus:outline-none"
                  >
                    {STATUSES.map((st) => (
                      <option key={st.value} value={st.value} className="bg-surface text-white">
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Order Selector */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5 block">
                    Sort By
                  </label>
                  <select
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs font-semibold text-white focus:border-primary focus:outline-none"
                  >
                    {SORT_OPTIONS.map((so) => (
                      <option key={so.value} value={so.value} className="bg-surface text-white">
                        {so.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reset All Filters */}
              {hasActiveFilters && (
                <div className="mt-5 flex justify-end border-t border-surface-border/60 pt-4">
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-rose-400 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Header with Counters & Active Filter Chips */}
      <div ref={resultsTopRef} className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-primary" />
            <span>Search Results</span>
          </h2>
          <span className="rounded-full bg-surface px-3 py-1 text-xs font-mono font-semibold text-muted border border-surface-border">
            {pageInfo.total} series found
          </span>
        </div>

        {/* Active Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {genre !== "All" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-primary/15 text-primary border border-primary/30 px-2.5 py-1 text-xs font-semibold">
              Genre: {genre}
              <button onClick={() => setGenre("All")} className="hover:text-white">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {format !== "All" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-primary/15 text-primary border border-primary/30 px-2.5 py-1 text-xs font-semibold">
              Format: {format}
              <button onClick={() => setFormat("All")} className="hover:text-white">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {season !== "All" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-primary/15 text-primary border border-primary/30 px-2.5 py-1 text-xs font-semibold">
              Season: {season}
              <button onClick={() => setSeason("All")} className="hover:text-white">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {year && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-primary/15 text-primary border border-primary/30 px-2.5 py-1 text-xs font-semibold">
              Year: {year}
              <button onClick={() => setYear("")} className="hover:text-white">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 py-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 animate-pulse">
              <div className="aspect-[2/3] w-full rounded-xl bg-surface border border-surface-border" />
              <div className="h-4 w-3/4 rounded bg-surface" />
              <div className="h-3 w-1/2 rounded bg-surface/60" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-surface-border bg-surface/50 p-12 text-center my-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-surface-border text-muted mb-4">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No anime matched your search</h3>
          <p className="text-xs text-muted mb-6 max-w-md mx-auto">
            Try adjusting your search keywords, switching genres, or removing some filter attributes.
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset All Filters</span>
          </button>
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
              title={anime.title?.english || anime.title?.romaji || "Anime"}
              posterUrl={anime.coverImage?.extraLarge || anime.coverImage?.large || ""}
              episodeCount={anime.episodes}
              rating={anime.averageScore ? (anime.averageScore / 10).toFixed(1) : undefined}
            />
          ))}
        </motion.div>
      )}

      {/* Pagination Bar */}
      {!isLoading && results.length > 0 && (
        <div className="mt-14 flex items-center justify-center gap-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1.5 rounded-xl bg-surface px-4 py-2.5 text-xs font-bold text-white border border-surface-border hover:bg-surface-hover disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono text-muted">
            <span className="font-bold text-white px-3 py-1 rounded-lg bg-surface border border-surface-border">
              Page {page} of {pageInfo.lastPage || 1}
            </span>
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={!pageInfo.hasNextPage}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-[0_0_12px_rgba(225,29,72,0.3)]"
          >
            <span>Next Page</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
