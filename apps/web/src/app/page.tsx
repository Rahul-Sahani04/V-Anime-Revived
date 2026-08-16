import { AnimeCard } from "@/components/ui/AnimeCard";
import Link from "next/link";

// Mock data until Convex is fully populated
const MOCK_ANIME = [
  { id: 1535, title: "Death Note", posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-lawCWTlzntTj.jpg", episodeCount: 37 },
  { id: 21, title: "One Piece", posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx21-tXMN3Y20PIL9.jpg" },
  { id: 11061, title: "Hunter x Hunter", posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sMuvBNOJjPZe.png", episodeCount: 148 },
  { id: 16498, title: "Attack on Titan", posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-73IhOXpJZiMF.jpg", episodeCount: 25 },
  { id: 113415, title: "Jujutsu Kaisen", posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg", episodeCount: 24 },
  { id: 104578, title: "Vinland Saga", posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx104578-LaZYFnmhFvdI.jpg", episodeCount: 24 },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-12 pb-16">
      {/* Cinematic Hero Section */}
      <section className="relative h-[75vh] min-h-[550px] w-full overflow-hidden">
        {/* Background Image & Vignette */}
        <div className="absolute inset-0 bg-background z-0" />
        <div 
          className="absolute inset-0 bg-cover bg-top bg-no-repeat opacity-60 mix-blend-luminosity transition-transform duration-1000 scale-105"
          style={{ backgroundImage: "url('https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQ0PFeWZITiw.jpg')" }}
        />
        {/* Deep Slate Gradients for Text Legibility (Left and Bottom) */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />

        <div className="container relative z-20 mx-auto flex h-full flex-col justify-end px-4 pb-16 lg:px-8">
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Metadata Tags */}
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest text-primary">
              <span className="rounded bg-primary/10 px-2 py-1 border border-primary/20">TV Series</span>
              <span className="flex items-center gap-1 text-muted"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> 24 Episodes</span>
              <span className="flex items-center gap-1 text-muted"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Sub | Dub</span>
            </div>

            <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl drop-shadow-md">
              Jujutsu Kaisen
            </h1>
            
            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-muted line-clamp-3 drop-shadow">
              A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman's school to be able to locate the demon's other body parts and thus exorcise himself.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link href="/anime/113415/watch/1" className="group flex items-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-bold text-primary-foreground transition-all duration-300 hover:scale-105 hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(225,29,72,0.3)]">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                Watch Now
              </Link>
              <Link href="/anime/113415" className="flex items-center gap-2 rounded-md bg-surface px-8 py-3 text-sm font-bold text-foreground transition-all hover:bg-surface-hover border border-surface-border">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                More Info
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Continue Watching (Mock) */}
      <section className="container mx-auto px-4 lg:px-8">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="h-6 w-1.5 rounded-full bg-primary block" />
          Continue Watching
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <AnimeCard 
            id={21} 
            title="One Piece" 
            posterUrl="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx21-tXMN3Y20PIL9.jpg"
            currentEpisode={1071}
            progressPercentage={65}
          />
        </div>
      </section>

      {/* Trending Section */}
      <section className="container mx-auto px-4 lg:px-8">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="h-6 w-1.5 rounded-full bg-primary block" />
          Trending Now
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {MOCK_ANIME.map((anime) => (
            <AnimeCard key={anime.id} {...anime} />
          ))}
        </div>
      </section>
    </div>
  );
}
