import { NextResponse } from "next/server";
import { getAvailableServers, resolveStreamWithFallback } from "@/lib/anivault";
import { consumePlaybackRateLimit, requireClerkUser, parsePlaybackParams } from "@/lib/security";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; episode: string }> }
) {
  const { id, episode } = await params;

  const user = await requireClerkUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }

  const playbackParams = parsePlaybackParams(request, { id, episode });
  if (!playbackParams) {
    return NextResponse.json({ success: false, error: "Invalid playback parameters." }, { status: 400 });
  }
  if (!consumePlaybackRateLimit(user.sub)) {
    return NextResponse.json({ success: false, error: "Playback rate limit exceeded." }, { status: 429 });
  }
  const { type, server, title } = playbackParams;

  try {
    // 1. Fetch available servers to build a fallback queue
    const availableServers = await getAvailableServers(id, episode);

    // 2. Resolve stream with automatic fallback logic
    const stream = await resolveStreamWithFallback(
      id,
      episode,
      type,
      server,
      availableServers,
      title
    );

    return NextResponse.json({
      success: true,
      data: stream,
    });
  } catch (error) {
    console.error(`Stream resolution failed for ${id} EP ${episode}:`, error);
    return NextResponse.json(
      { success: false, error: "All servers failed to resolve the stream." },
      { status: 502 }
    );
  }
}
