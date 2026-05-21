import { NextRequest, NextResponse } from "next/server";
import { AuthManager } from "@/storage/database/authManager";
import { withAdminAuth } from "@/lib/admin-auth";

/**
 * GET /api/admin/users
 * Get all users with filters
 */
export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") as "patient" | "admin" | "staff" | null;
    const isBlocked = searchParams.get("isBlocked");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const users = await AuthManager.getAllUsers({
      role: role || undefined,
      isBlocked: isBlocked ? isBlocked === "true" : undefined,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/admin/users
 * Update user status (block/unblock)
 */
export const PUT = withAdminAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { userId, isBlocked } = body;

    if (!userId || typeof isBlocked !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request", message: "userId and isBlocked are required" },
        { status: 400 }
      );
    }

    const updatedUser = await AuthManager.setUserStatus(userId, isBlocked);

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: "Failed to update user", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
});
