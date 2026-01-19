import { NextRequest, NextResponse } from "next/server";
import { AttractionManager } from "@/storage/database/attractionsManager";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get("city");
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit") || "20");

    const manager = new AttractionManager();

    if (featured === "true") {
      const attractions = await manager.getFeaturedAttractions(limit);
      return NextResponse.json({ attractions });
    }

    const attractions = await manager.search({
      city: city || undefined,
      category: category || undefined,
      limit,
    });

    return NextResponse.json({ attractions: attractions.attractions, total: attractions.total });
  } catch (error) {
    console.error("Error fetching attractions:", error);
    return NextResponse.json(
      { error: "Failed to fetch attractions", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
