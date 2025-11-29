import { NextRequest } from "next/server";

// Hardcoded for production - Render backend
const BACKEND_URL = process.env.BACKEND_URL || "https://crisiswatch-uoj4.onrender.com";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const claim = searchParams.get("claim");
  const language = searchParams.get("language") || "en";

  if (!claim) {
    return new Response(
      JSON.stringify({ error: "Claim is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Proxy SSE from backend
    const backendUrl = new URL(`${BACKEND_URL}/api/check/stream`);
    backendUrl.searchParams.set("claim", claim);
    backendUrl.searchParams.set("language", language);

    const response = await fetch(backendUrl.toString(), {
      headers: {
        Accept: "text/event-stream",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Backend SSE connection failed" }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create a TransformStream to pass through the SSE events
    const { readable, writable } = new TransformStream();

    // Pipe the backend response through
    response.body?.pipeTo(writable);

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("SSE proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to connect to backend", fallback: true }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
