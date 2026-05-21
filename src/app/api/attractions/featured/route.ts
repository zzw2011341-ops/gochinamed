import { NextRequest, NextResponse } from "next/server";
import { AttractionManager } from "@/storage/database/attractionsManager";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");

    const attractions = await AttractionManager.getFeatured(limit);

    return NextResponse.json({ attractions });
  } catch (error) {
    console.error("Error fetching featured attractions:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured attractions", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
