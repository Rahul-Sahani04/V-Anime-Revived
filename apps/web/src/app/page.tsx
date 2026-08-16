import { HeroCarousel } from "@/components/home/HeroCarousel";
import { AnimeShelf } from "@/components/home/AnimeShelf";
import { AnimeCard } from "@/components/ui/AnimeCard";

const CONTINUE_WATCHING = [
  {
    id: 21,
    title: "One Piece",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx21-tXMN3Y20PIL9.jpg",
    currentEpisode: 1071,
    progressPercentage: 65,
    rating: "8.9",
    genre: "Action, Adventure",
  },
  {
    id: 113415,
    title: "Jujutsu Kaisen",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg",
    currentEpisode: 14,
    progressPercentage: 80,
    rating: "9.2",
    genre: "Action, Supernatural",
  },
  {
    id: 16498,
    title: "Attack on Titan",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-73IhOXpJZiMF.jpg",
    currentEpisode: 22,
    progressPercentage: 45,
    rating: "9.5",
    genre: "Action, Drama",
  }
];

const TRENDING_ANIME = [
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
    id: 1535,
    title: "Death Note",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-lawCWTlzntTj.jpg",
    episodeCount: 37,
    rating: "9.0",
    genre: "Mystery, Psychological",
  },
  {
    id: 101922,
    title: "Demon Slayer: Kimetsu no Yaiba",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0Clmgta.jpg",
    episodeCount: 26,
    rating: "9.0",
    genre: "Action, Fantasy",
  },
  {
    id: 127230,
    title: "Chainsaw Man",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-FloXTaKaTZbu.png",
    episodeCount: 12,
    rating: "8.8",
    genre: "Action, Supernatural",
  },
  {
    id: 21,
    title: "One Piece",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx21-tXMN3Y20PIL9.jpg",
    episodeCount: 1071,
    rating: "8.9",
    genre: "Action, Adventure",
  }
];

const TOP_RATED_ANIME = [
  {
    id: 16498,
    title: "Attack on Titan",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-73IhOXpJZiMF.jpg",
    episodeCount: 25,
    rating: "9.5",
    genre: "Action, Drama",
  },
  {
    id: 11061,
    title: "Hunter x Hunter",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sMuvBNOJjPZe.png",
    episodeCount: 148,
    rating: "9.3",
    genre: "Adventure, Fantasy",
  },
  {
    id: 113415,
    title: "Jujutsu Kaisen",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg",
    episodeCount: 24,
    rating: "9.2",
    genre: "Action, Supernatural",
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
    id: 101922,
    title: "Demon Slayer",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0Clmgta.jpg",
    episodeCount: 26,
    rating: "9.0",
    genre: "Action, Fantasy",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-12 pb-24">
      {/* Cinematic Hero Carousel */}
      <HeroCarousel />

      {/* Continue Watching Section */}
      <section className="container mx-auto px-4 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-5 w-1 rounded-full bg-primary" />
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Continue Watching
            </h2>
          </div>
          <span className="text-xs text-muted font-mono">{CONTINUE_WATCHING.length} in progress</span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {CONTINUE_WATCHING.map((anime) => (
            <AnimeCard key={anime.id} {...anime} />
          ))}
        </div>
      </section>

      {/* Trending Now Shelf with Genre Filters */}
      <AnimeShelf
        title="Trending Now"
        subtitle="Most watched series this week"
        icon="flame"
        categories={["All", "Action", "Adventure", "Fantasy", "Mystery"]}
        items={TRENDING_ANIME}
      />

      {/* Top Rated Masterpieces */}
      <AnimeShelf
        title="Critically Acclaimed"
        subtitle="Highest community ratings of all time"
        icon="sparkles"
        items={TOP_RATED_ANIME}
      />
    </div>
  );
}
