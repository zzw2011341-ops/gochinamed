import { NextRequest, NextResponse } from "next/server";
import { AuthManager } from "@/storage/database/authManager";

export async function GET(request: NextRequest) {
  try {
    // 临时跳过数据库认证，直接返回虚拟用户
    return NextResponse.json({
      success: true,
      user: {
        id: "00000000-0000-0000-0000-000000000001",
        email: "user@gochinamed.com",
        name: "Guest User",
        role: "patient",
        preferredLanguage: "en",
        avatarUrl: null,
        phone: "1234567890",
        points: 0,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get user info" },
      { status: 500 }
    );
  }
}
