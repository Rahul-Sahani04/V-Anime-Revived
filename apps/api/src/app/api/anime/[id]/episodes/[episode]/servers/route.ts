import { NextResponse } from "next/server";
import { getAvailableServers } from "@/lib/anivault";
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
  if (!parsePlaybackParams(request, { id, episode })) {
    return NextResponse.json({ success: false, error: "Invalid anime or episode parameters." }, { status: 400 });
  }
  if (!consumePlaybackRateLimit(user.sub)) {
    return NextResponse.json({ success: false, error: "Playback rate limit exceeded." }, { status: 429 });
  }

  try {
    const servers = await getAvailableServers(id, episode);
    
    return NextResponse.json({
      success: true,
      data: servers,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to retrieve servers." },
      { status: 500 }
    );
  }
}
