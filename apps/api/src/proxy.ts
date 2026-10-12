import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function allowedOrigins() {
  const configuredOrigins = process.env.WEB_ORIGINS;
  const origins = configuredOrigins ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
  return origins
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowed = origin ? allowedOrigins().includes(origin) : false;

  if (origin && !allowed) {
    return NextResponse.json({ success: false, error: "Origin not allowed." }, { status: 403 });
  }

  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    if (origin && allowed) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
      response.headers.set("Vary", "Origin");
    }
    return response;
  }

  const response = NextResponse.next();
  if (origin && allowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Vary", "Origin");
  }
  return response;
}

export const config = { matcher: "/api/:path*" };
