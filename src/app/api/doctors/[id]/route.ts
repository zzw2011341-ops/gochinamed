import { NextRequest, NextResponse } from "next/server";
import { DoctorManager } from "@/storage/database/doctorManager";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: doctorId } = await params;
    
    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 }
      );
    }

    const manager = new DoctorManager();
    const doctor = await manager.getDoctorWithHospital(doctorId);

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(doctor);
  } catch (error) {
    console.error("Error fetching doctor:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctor", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
