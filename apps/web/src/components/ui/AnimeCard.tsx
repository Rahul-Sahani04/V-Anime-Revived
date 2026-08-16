import Link from "next/link";
import Image from "next/image";

interface AnimeCardProps {
  id: number;
  title: string;
  posterUrl: string;
  episodeCount?: number;
  currentEpisode?: number;
  progressPercentage?: number;
}

export function AnimeCard({
  id,
  title,
  posterUrl,
  episodeCount,
  currentEpisode,
  progressPercentage
}: AnimeCardProps) {
  return (
    <Link href={`/anime/${id}`} className="group flex flex-col gap-2">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface shadow-sm transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-primary/10 border border-surface-border/50">
        <Image
          src={posterUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
        />
        
        {/* Progress Bar for Continue Watching */}
        {progressPercentage !== undefined && (
          <div className="absolute bottom-0 left-0 h-1 w-full bg-surface-border/80">
            <div 
              className="h-full bg-primary" 
              style={{ width: `${Math.min(Math.max(progressPercentage, 0), 100)}%` }}
            />
          </div>
        )}
        
        {/* Episode Badge overlay */}
        {currentEpisode && (
          <div className="absolute top-2 right-2 rounded bg-background/80 backdrop-blur-sm px-1.5 py-0.5 text-xs font-mono font-medium text-foreground">
            EP {currentEpisode}
          </div>
        )}
      </div>
      
      <div className="flex flex-col">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
          {title}
        </h3>
        {episodeCount !== undefined && (
          <span className="mt-0.5 text-xs text-muted">
            {episodeCount} Episodes
          </span>
        )}
      </div>
    </Link>
  );
}
