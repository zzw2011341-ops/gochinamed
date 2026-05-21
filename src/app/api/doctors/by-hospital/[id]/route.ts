import { NextRequest, NextResponse } from "next/server";
import { DoctorManager } from "@/storage/database/doctorManager";

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

    const manager = new DoctorManager();
    const doctors = await manager.getDoctorsByHospital(hospitalId);

    return NextResponse.json({ doctors, total: doctors.length });
  } catch (error) {
    console.error("Error fetching doctors by hospital:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctors", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
