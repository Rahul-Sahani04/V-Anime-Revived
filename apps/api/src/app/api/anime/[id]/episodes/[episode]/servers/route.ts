import { NextResponse } from "next/server";
import { getAvailableServers } from "@/lib/anivault";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; episode: string }> }
) {
  const { id, episode } = await params;

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
