import Image from "next/image";
import Link from "next/link";

export default async function AnimeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  // Mock data for layout mapping
  const mockAnime = {
    id,
    title: "Jujutsu Kaisen",
    description: "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman's school to be able to locate the demon's other body parts and thus exorcise himself.",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg",
    bannerUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQ0PFeWZITiw.jpg",
    genres: ["Action", "Supernatural", "Shounen"],
    status: "FINISHED",
    episodes: 24,
  };

  return (
    <div className="flex flex-col pb-12">
      {/* Banner */}
      <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden bg-surface">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
        <Image
          src={mockAnime.bannerUrl}
          alt={mockAnime.title}
          fill
          className="object-cover opacity-60"
          priority
        />
      </div>

      <div className="container relative z-20 mx-auto px-4 lg:px-8 -mt-32">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Poster */}
          <div className="w-48 shrink-0 overflow-hidden rounded-lg border border-surface-border bg-surface shadow-xl md:w-64">
            <div className="relative aspect-[2/3] w-full">
              <Image
                src={mockAnime.posterUrl}
                alt={mockAnime.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col justify-end pt-4 md:pt-32">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-2">
              {mockAnime.title}
            </h1>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="rounded bg-surface px-2 py-1 text-xs font-semibold text-muted">
                {mockAnime.status}
              </span>
              <span className="rounded bg-surface px-2 py-1 text-xs font-semibold text-muted">
                {mockAnime.episodes} EPISODES
              </span>
              {mockAnime.genres.map((genre) => (
                <span key={genre} className="rounded border border-surface-border px-2 py-1 text-xs font-semibold text-muted">
                  {genre}
                </span>
              ))}
            </div>

            <div className="flex gap-4 mb-8">
              <Link 
                href={`/anime/${id}/watch/1`}
                className="rounded-md bg-primary px-8 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Watch Episode 1
              </Link>
              <button className="rounded-md bg-surface px-6 py-2.5 text-sm font-bold text-foreground hover:bg-surface-hover transition-colors">
                + Watchlist
              </button>
            </div>

            <div className="max-w-3xl">
              <h3 className="text-lg font-semibold mb-2">Synopsis</h3>
              <p className="text-muted leading-relaxed">
                {mockAnime.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
