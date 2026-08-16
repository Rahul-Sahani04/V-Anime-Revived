import { VideoPlayer } from "@/components/player/VideoPlayer";
import Link from "next/link";

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; episode: string }>;
  searchParams: Promise<{ server?: string; type?: string }>;
}) {
  const { id, episode } = await params;
  const { server = "anikoto", type = "sub" } = await searchParams;

  const availableServers = ["anikoto", "miruro", "senshi", "animeheaven"];

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Theater Mode Video Container */}
      <div className="relative aspect-video w-full max-w-7xl mx-auto bg-neutral-900 flex items-center justify-center">
        <VideoPlayer animeId={id} episode={episode} server={server} type={type as "sub" | "dub"} />
      </div>

      {/* Episode Controls & Info */}
      <div className="container mx-auto px-4 py-8 lg:px-8">
        <div className="flex items-center justify-between border-b border-surface-border pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Episode {episode}</h1>
            <p className="text-muted">Anime ID: {id}</p>
          </div>
          
          <div className="flex gap-4">
            <Link 
              href={`/anime/${id}/watch/${Math.max(1, parseInt(episode) - 1)}?server=${server}&type=${type}`}
              className="rounded bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-hover transition-colors"
            >
              Previous
            </Link>
            <Link 
              href={`/anime/${id}/watch/${parseInt(episode) + 1}?server=${server}&type=${type}`}
              className="rounded bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-hover transition-colors"
            >
              Next
            </Link>
          </div>
        </div>

        {/* Server & Sub/Dub Selection */}
        <div className="mt-6 flex flex-wrap gap-8">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted uppercase tracking-wider">Servers</h3>
            <div className="flex gap-2 flex-wrap">
              {availableServers.map((s) => (
                <Link
                  key={s}
                  href={`/anime/${id}/watch/${episode}?server=${s}&type=${type}`}
                  className={`rounded border px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                    server === s 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-surface-border bg-surface hover:bg-surface-hover"
                  }`}
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted uppercase tracking-wider">Audio</h3>
            <div className="flex gap-2">
              <Link
                href={`/anime/${id}/watch/${episode}?server=${server}&type=sub`}
                className={`rounded border px-4 py-1.5 text-sm font-medium uppercase transition-colors ${
                  type === "sub" 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-surface-border bg-surface hover:bg-surface-hover"
                }`}
              >
                SUB
              </Link>
              <Link
                href={`/anime/${id}/watch/${episode}?server=${server}&type=dub`}
                className={`rounded border px-4 py-1.5 text-sm font-medium uppercase transition-colors ${
                  type === "dub" 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-surface-border bg-surface hover:bg-surface-hover"
                }`}
              >
                DUB
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
