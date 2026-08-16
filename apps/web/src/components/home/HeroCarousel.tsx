"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Play, Info, ChevronLeft, ChevronRight, Bookmark, Sparkles } from "lucide-react";

export interface FeaturedAnime {
  id: number;
  title: string;
  bannerUrl: string;
  posterUrl: string;
  description: string;
  episodes: number;
  type: string;
  genres: string[];
  rating: string;
  status: string;
}

const FEATURED_ANIME: FeaturedAnime[] = [
  {
    id: 113415,
    title: "Jujutsu Kaisen",
    bannerUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQ0PFeWZITiw.jpg",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg",
    description: "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman's school to be able to locate the demon's other body parts and exorcise himself.",
    episodes: 24,
    type: "TV Series",
    genres: ["Action", "Supernatural", "Shounen"],
    rating: "9.2",
    status: "FINISHED"
  },
  {
    id: 16498,
    title: "Attack on Titan",
    bannerUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFfDggpHJy.jpg",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-73IhOXpJZiMF.jpg",
    description: "Centuries ago, mankind was slaughtered by monstrous humanoid creatures called Titans. In the present, young Eren Jaeger vows to cleanse the earth of Titans after witnessing his mother's death.",
    episodes: 25,
    type: "TV Series",
    genres: ["Action", "Drama", "Fantasy"],
    rating: "9.5",
    status: "FINISHED"
  },
  {
    id: 104578,
    title: "Vinland Saga",
    bannerUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/104578-1G5A92zKjXbS.jpg",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx104578-LaZYFnmhFvdI.jpg",
    description: "Young Thorfinn grew up listening to the stories of old sailors that had traveled the ocean and reached the place of legend, Vinland. When tragedy strikes, he embarks on an epic quest of vengeance.",
    episodes: 24,
    type: "TV Series",
    genres: ["Action", "Adventure", "Historical"],
    rating: "9.1",
    status: "FINISHED"
  },
  {
    id: 101922,
    title: "Demon Slayer: Kimetsu no Yaiba",
    bannerUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-YfZhRmwD2dpn.jpg",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0Clmgta.jpg",
    description: "It is the Taisho Period in Japan. Tanjiro, a kindhearted boy who sells charcoal for a living, finds his family slaughtered by a demon. To make matters worse, his younger sister Nezuko has turned into a demon.",
    episodes: 26,
    type: "TV Series",
    genres: ["Action", "Fantasy", "Historical"],
    rating: "9.0",
    status: "FINISHED"
  }
];

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % FEATURED_ANIME.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + FEATURED_ANIME.length) % FEATURED_ANIME.length);
  }, []);

  // Auto advance every 7 seconds when not hovered
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(nextSlide, 7000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  const currentAnime = FEATURED_ANIME[currentIndex];

  return (
    <section 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative h-[78vh] min-h-[580px] max-h-[820px] w-full overflow-hidden select-none"
    >
      {/* Background Banner Crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAnime.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
        >
          <Image
            src={currentAnime.bannerUrl}
            alt={currentAnime.title}
            fill
            priority
            className="object-cover object-top opacity-55 mix-blend-luminosity brightness-95"
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>

      {/* Cinematic Ambient Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent z-10 w-full md:w-3/4" />
      <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/60 z-10" />

      {/* Hero Content Container */}
      <div className="container relative z-20 mx-auto flex h-full flex-col justify-end px-4 pb-14 lg:px-8">
        <div className="max-w-3xl">
          {/* Metadata Badges */}
          <motion.div
            key={`badge-${currentAnime.id}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-4 flex flex-wrap items-center gap-2.5 text-xs font-bold uppercase tracking-wider"
          >
            <span className="flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-primary border border-primary/30 shadow-[0_0_12px_rgba(225,29,72,0.3)]">
              <Sparkles className="h-3 w-3" />
              Spotlight #{currentIndex + 1}
            </span>
            <span className="rounded-full bg-surface/80 backdrop-blur-md px-3 py-1 text-neutral-300 border border-surface-border">
              {currentAnime.type}
            </span>
            <span className="rounded-full bg-surface/80 backdrop-blur-md px-3 py-1 text-neutral-300 border border-surface-border">
              {currentAnime.episodes} Episodes
            </span>
            <span className="rounded-full bg-surface/80 backdrop-blur-md px-3 py-1 text-primary border border-primary/20 font-mono">
              ★ {currentAnime.rating}
            </span>
          </motion.div>

          {/* Animated Anime Title */}
          <motion.h1
            key={`title-${currentAnime.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-4 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white drop-shadow-lg"
          >
            {currentAnime.title}
          </motion.h1>

          {/* Genres Tags */}
          <motion.div
            key={`genres-${currentAnime.id}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-4 flex flex-wrap gap-2 text-xs text-muted"
          >
            {currentAnime.genres.map((g) => (
              <span key={g} className="px-2 py-0.5 rounded bg-surface/60 border border-surface-border/80">
                {g}
              </span>
            ))}
          </motion.div>

          {/* Synopsis */}
          <motion.p
            key={`desc-${currentAnime.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8 max-w-2xl text-sm sm:text-base leading-relaxed text-muted line-clamp-3 drop-shadow"
          >
            {currentAnime.description}
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            key={`actions-${currentAnime.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Link
              href={`/anime/${currentAnime.id}/watch/1`}
              className="group flex items-center gap-2.5 rounded-xl bg-primary px-7 py-3 text-sm font-bold text-primary-foreground transition-all duration-300 hover:scale-105 hover:bg-primary/90 shadow-[0_0_25px_rgba(225,29,72,0.4)] hover:shadow-[0_0_35px_rgba(225,29,72,0.6)]"
            >
              <Play className="h-4 w-4 fill-current transition-transform duration-300 group-hover:scale-110" />
              <span>Watch Now</span>
            </Link>

            <Link
              href={`/anime/${currentAnime.id}`}
              className="flex items-center gap-2 rounded-xl bg-surface/90 backdrop-blur-md px-6 py-3 text-sm font-bold text-foreground transition-all duration-300 hover:bg-surface-hover hover:scale-105 border border-surface-border"
            >
              <Info className="h-4 w-4 text-muted" />
              <span>Details</span>
            </Link>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
                isBookmarked
                  ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                  : "bg-surface/80 border-surface-border text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
              title="Bookmark"
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
            </motion.button>
          </motion.div>
        </div>

        {/* Carousel Navigation Indicators */}
        <div className="absolute right-4 bottom-14 lg:right-8 z-30 flex items-center gap-3">
          <div className="flex items-center gap-1.5 mr-2">
            {FEATURED_ANIME.map((anime, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  key={anime.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? "w-8 bg-primary shadow-[0_0_10px_rgba(225,29,72,0.6)]"
                      : "w-2 bg-surface-border hover:bg-neutral-500"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              );
            })}
          </div>

          <button
            onClick={prevSlide}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/80 backdrop-blur-md border border-surface-border text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            aria-label="Previous anime"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextSlide}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/80 backdrop-blur-md border border-surface-border text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            aria-label="Next anime"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
