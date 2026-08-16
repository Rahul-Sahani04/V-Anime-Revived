import { NextResponse } from "next/server";
import { getAvailableServers, resolveStreamWithFallback } from "@/lib/anivault";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; episode: string }> }
) {
  const { id, episode } = await params;
  
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "sub";
  const server = searchParams.get("server") || "senshi";

  try {
    // 1. Fetch available servers to build a fallback queue
    const availableServers = await getAvailableServers(id, episode);

    // 2. Resolve stream with automatic fallback logic
    const stream = await resolveStreamWithFallback(
      id,
      episode,
      type,
      server,
      availableServers
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
