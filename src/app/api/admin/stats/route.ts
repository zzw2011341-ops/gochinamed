import { NextResponse } from "next/server";
import { AuthManager } from "@/storage/database/authManager";
import { DoctorManager } from "@/storage/database/doctorManager";
import { HospitalManager } from "@/storage/database/hospitalManager";
import { OrderManager } from "@/storage/database/orderManager";

export async function GET() {
  try {
    // Parallel fetch all stats
    const [userCount, doctorCount, hospitalCount, orderCount] = await Promise.all([
      AuthManager.getUserCountByRole(),
      DoctorManager.getDoctorCount(),
      HospitalManager.getHospitalCount(),
      OrderManager.getOrderStats(),
    ]);

    return NextResponse.json({
      users: userCount,
      doctors: doctorCount,
      hospitals: hospitalCount,
      orders: orderCount,
      posts: 0,
    });
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
