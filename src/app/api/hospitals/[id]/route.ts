import { NextRequest, NextResponse } from "next/server";
import { HospitalManager } from "@/storage/database/hospitalManager";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hospitalId } = await params;
    
    if (!hospitalId) {
      return NextResponse.json(
        { error: "Hospital ID is required" },
        { status: 400 }
      );
    }

    const manager = new HospitalManager();
    const hospital = await manager.getHospitalById(hospitalId);

    if (!hospital) {
      return NextResponse.json(
        { error: "Hospital not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(hospital);
  } catch (error) {
    console.error("Error fetching hospital:", error);
    return NextResponse.json(
      { error: "Failed to fetch hospital", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
