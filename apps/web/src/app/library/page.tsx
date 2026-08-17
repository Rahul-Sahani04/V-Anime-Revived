import { Metadata } from "next";
import { LibraryClient } from "./LibraryClient";

export const metadata: Metadata = {
  title: "My Library | V-Anime Revived",
  description: "Manage your anime watchlist, favorites, continue watching queue, and watch history.",
};

export default function LibraryPage() {
  return <LibraryClient />;
}
