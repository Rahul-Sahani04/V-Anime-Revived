import { AnimeDetailsClient } from "./AnimeDetailsClient";

export default async function AnimeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Mock data for anime details
  const mockAnime = {
    id,
    title: id === "16498" ? "Attack on Titan" : id === "21" ? "One Piece" : "Jujutsu Kaisen",
    description: "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman's school to be able to locate the demon's other body parts and thus exorcise himself.",
    posterUrl: id === "16498" ? "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-73IhOXpJZiMF.jpg" : id === "21" ? "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx21-tXMN3Y20PIL9.jpg" : "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg",
    bannerUrl: id === "16498" ? "https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFfDggpHJy.jpg" : "https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQ0PFeWZITiw.jpg",
    genres: ["Action", "Supernatural", "Shounen", "Fantasy"],
    status: "FINISHED",
    episodes: 24,
    rating: "9.2",
    year: "2020",
    studio: "MAPPA",
  };

  return <AnimeDetailsClient anime={mockAnime} />;
}

