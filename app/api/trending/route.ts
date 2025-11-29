import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "https://crisiswatch-uoj4.onrender.com";

// Mock data fallback
const MOCK_TRENDING = [
  {
    id: "1",
    claim: "NASA confirms asteroid will hit Earth in 2025",
    verdict: "FALSE",
    confidence: 98,
    category: "tech",
    checked_count: 2847,
    checked_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "2",
    claim: "New study shows coffee extends lifespan by 10 years",
    verdict: "MOSTLY_FALSE",
    confidence: 89,
    category: "health",
    checked_count: 1923,
    checked_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "3",
    claim: "Government announces free WiFi for all citizens",
    verdict: "UNVERIFIABLE",
    confidence: 45,
    category: "politics",
    checked_count: 1456,
    checked_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "4",
    claim: "Electric vehicles cause more pollution than diesel cars",
    verdict: "FALSE",
    confidence: 94,
    category: "climate",
    checked_count: 3201,
    checked_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: "5",
    claim: "AI will replace 50% of jobs by 2030",
    verdict: "MIXED",
    confidence: 62,
    category: "tech",
    checked_count: 2105,
    checked_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "6",
    claim: "Drinking 8 glasses of water daily is essential for health",
    verdict: "MOSTLY_TRUE",
    confidence: 78,
    category: "health",
    checked_count: 1678,
    checked_at: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "all";
  
  try {
    // Try fetching from backend
    const response = await fetch(`${BACKEND_URL}/api/trending?category=${category}`, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }
    
    throw new Error("Backend unavailable");
  } catch (error) {
    // Return mock data as fallback
    console.log("Trending: Using mock data fallback");
    
    const filtered = category === "all" 
      ? MOCK_TRENDING 
      : MOCK_TRENDING.filter(c => c.category === category);
    
    return NextResponse.json({
      claims: filtered,
      categories: ["politics", "health", "tech", "climate", "finance", "social"],
      total: filtered.length,
    });
  }
}
