"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { Play, Star } from "lucide-react";

interface AnimeCardProps {
  id: number;
  title: string;
  posterUrl: string;
  episodeCount?: number;
  currentEpisode?: number;
  progressPercentage?: number;
  rating?: string;
  genre?: string;
}

export function AnimeCard({
  id,
  title,
  posterUrl,
  episodeCount,
  currentEpisode,
  progressPercentage,
  rating,
  genre,
}: AnimeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group relative flex flex-col gap-2.5"
    >
      <Link href={`/anime/${id}`} className="block">
        <motion.div
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
          className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-surface shadow-md transition-shadow duration-300 group-hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8)] group-hover:border-primary/50 border border-surface-border"
        >
          <Image
            src={posterUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-108"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Quick Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <motion.div
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_rgba(225,29,72,0.6)]"
            >
              <Play className="h-5 w-5 fill-current translate-x-0.5" />
            </motion.div>
          </div>

          {/* Top badges */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
            {rating && (
              <div className="flex items-center gap-1 rounded-md bg-background/85 backdrop-blur-md px-1.5 py-0.5 text-[11px] font-mono font-bold text-primary border border-primary/20 shadow-sm">
                <Star className="h-2.5 w-2.5 fill-current" />
                <span>{rating}</span>
              </div>
            )}
            {currentEpisode && (
              <div className="rounded-md bg-background/85 backdrop-blur-md px-2 py-0.5 text-[11px] font-mono font-semibold text-foreground border border-surface-border shadow-sm ml-auto">
                EP {currentEpisode}
              </div>
            )}
          </div>

          {/* Progress Bar for Continue Watching */}
          {progressPercentage !== undefined && (
            <div className="absolute bottom-0 left-0 h-1.5 w-full bg-surface-border/90 z-20">
              <div
                className="h-full bg-primary shadow-[0_0_10px_rgba(225,29,72,0.8)] relative"
                style={{ width: `${Math.min(Math.max(progressPercentage, 0), 100)}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white shadow-sm" />
              </div>
            </div>
          )}
        </motion.div>

        {/* Title and Metadata */}
        <div className="flex flex-col pt-1">
          <h3 className="line-clamp-1 text-sm font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">
            {title}
          </h3>
          <div className="mt-0.5 flex items-center justify-between text-xs text-muted font-medium">
            {genre ? <span>{genre}</span> : <span>{episodeCount ? `${episodeCount} Episodes` : "TV Series"}</span>}
            {progressPercentage !== undefined && (
              <span className="text-[11px] font-mono text-primary">{progressPercentage}% watched</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
