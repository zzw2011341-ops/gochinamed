import { NextRequest, NextResponse } from "next/server";
import { AuthManager } from "@/storage/database/authManager";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await AuthManager.verifyToken(token);

    if (!user) {
      const response = NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );

      // Clear invalid token
      response.cookies.set("auth_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });

      return response;
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { success: false, error: "Account has been blocked" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        points: user.points,
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
