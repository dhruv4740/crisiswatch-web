import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { claim, language = "en" } = body;

    if (!claim || typeof claim !== "string") {
      return NextResponse.json(
        { error: "Claim is required and must be a string" },
        { status: 400 }
      );
    }

    // Call Python FastAPI backend
    const response = await fetch(`${BACKEND_URL}/api/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        claim: claim.trim(),
        language,
        skip_cache: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", errorText);
      return NextResponse.json(
        { error: "Failed to verify claim", details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Transform response for frontend
    return NextResponse.json({
      success: true,
      data: {
        claim_id: result.claim_id,
        claim: result.claim_text,
        verdict: result.verdict.toUpperCase(),
        confidence: Math.round(result.confidence * 100),
        severity: result.severity,
        explanation: result.explanation,
        explanation_hindi: result.explanation_hindi,
        correction: result.correction,
        sources: result.sources_checked,
        evidence: result.evidence || [],
        time: `${result.processing_time_seconds.toFixed(1)}s`,
        cached: result.cached,
      },
    });
  } catch (error) {
    console.error("API route error:", error);
    
    // Check if it's a connection error (backend not running)
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        { 
          error: "Backend service unavailable", 
          message: "The fact-checking service is not running. Please start the Python backend.",
          fallback: true 
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", message: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check - verify backend is available
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    
    if (!response.ok) {
      return NextResponse.json(
        { status: "unhealthy", backend: false },
        { status: 503 }
      );
    }

    const health = await response.json();
    return NextResponse.json({
      status: "healthy",
      backend: true,
      ...health,
    });
  } catch {
    return NextResponse.json(
      { status: "unhealthy", backend: false, message: "Backend not reachable" },
      { status: 503 }
    );
  }
}
