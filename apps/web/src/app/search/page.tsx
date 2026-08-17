import { Suspense } from "react";
import { Metadata } from "next";
import { SearchClient } from "./SearchClient";

export const metadata: Metadata = {
  title: "Search Anime | V-Anime Revived",
  description: "Search and filter anime by genre, season, year, format, and rating on V-Anime Revived.",
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-3 text-xs text-muted">Loading search engine...</p>
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
