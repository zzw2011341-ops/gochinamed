import { NextRequest, NextResponse } from "next/server";
import { FlightManager } from "@/storage/database/flightManager";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const result = await FlightManager.search({
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      classType: params.classType as any,
      minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
      airline: params.airline,
      limit: parseInt(params.limit || "20"),
      offset: parseInt(params.offset || "0"),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Flight search error:", error);
    return NextResponse.json(
      { error: "Flight search failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
