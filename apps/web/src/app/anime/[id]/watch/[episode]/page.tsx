import { WatchPlayerClient } from "./WatchPlayerClient";

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; episode: string }>;
  searchParams: Promise<{ server?: string; type?: string }>;
}) {
  const { id, episode } = await params;
  const { server = "senshi", type = "sub" } = await searchParams;

  const availableServers = ["anikoto", "animepahe", "senshi", "animeheaven", "miruro"];

  return (
    <WatchPlayerClient
      animeId={id}
      episode={episode}
      server={server}
      type={type as "sub" | "dub"}
      availableServers={availableServers}
    />
  );
}

