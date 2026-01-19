import { NextRequest, NextResponse } from "next/server";
import { AttractionManager } from "@/storage/database/attractionsManager";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attractionId } = await params;

    if (!attractionId) {
      return NextResponse.json(
        { error: "Attraction ID is required" },
        { status: 400 }
      );
    }

    const manager = new AttractionManager();
    const attraction = await manager.getAttractionById(attractionId);

    if (!attraction) {
      return NextResponse.json(
        { error: "Attraction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(attraction);
  } catch (error) {
    console.error("Error fetching attraction:", error);
    return NextResponse.json(
      { error: "Failed to fetch attraction", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
