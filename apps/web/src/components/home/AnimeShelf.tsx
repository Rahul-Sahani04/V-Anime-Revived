"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Flame, Sparkles } from "lucide-react";
import { AnimeCard } from "../ui/AnimeCard";

interface AnimeItem {
  id: number;
  title: string;
  posterUrl: string;
  episodeCount?: number;
  currentEpisode?: number;
  progressPercentage?: number;
  rating?: string;
  genre?: string;
}

interface AnimeShelfProps {
  title: string;
  subtitle?: string;
  icon?: "flame" | "sparkles";
  categories?: string[];
  items: AnimeItem[];
}

export function AnimeShelf({
  title,
  subtitle,
  icon = "flame",
  categories,
  items,
}: AnimeShelfProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState(categories ? categories[0] : null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -600 : 600;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const filteredItems = selectedCategory && selectedCategory !== "All"
    ? items.filter((item) => item.genre?.includes(selectedCategory))
    : items;

  return (
    <section className="container mx-auto px-4 lg:px-8">
      {/* Header with Title & Controls */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            {icon === "flame" ? (
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/20">
                <Flame className="h-4 w-4 fill-current" />
              </span>
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/20">
                <Sparkles className="h-4 w-4" />
              </span>
            )}
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              {title}
            </h2>
          </div>
          {subtitle && <p className="text-xs text-muted font-medium">{subtitle}</p>}
        </div>

        {/* Categories Tabs & Scroll Buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          {categories && (
            <div className="flex items-center gap-1 bg-surface/60 p-1 rounded-lg border border-surface-border overflow-x-auto">
              {categories.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`relative px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      isActive ? "text-white" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId={`shelf-tab-${title}`}
                        className="absolute inset-0 rounded-md bg-primary shadow-sm"
                        transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{category}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => scroll("left")}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface/80 border border-surface-border text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface/80 border border-surface-border text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Grid */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map((anime) => (
            <div
              key={anime.id}
              className="w-[155px] sm:w-[185px] md:w-[200px] shrink-0 snap-start"
            >
              <AnimeCard {...anime} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
