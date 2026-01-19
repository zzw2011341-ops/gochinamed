import { NextRequest, NextResponse } from "next/server";
import { HotelManager } from "@/storage/database/hotelManager";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const result = await HotelManager.search({
      city: params.city,
      location: params.location,
      starRating: params.starRating ? parseInt(params.starRating) : undefined,
      minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
      minDistance: params.minDistance ? parseFloat(params.minDistance) : undefined,
      maxDistance: params.maxDistance ? parseFloat(params.maxDistance) : undefined,
      limit: parseInt(params.limit || "20"),
      offset: parseInt(params.offset || "0"),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Hotel search error:", error);
    return NextResponse.json(
      { error: "Hotel search failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
