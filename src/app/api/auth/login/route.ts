import { NextRequest, NextResponse } from "next/server";
import { AuthManager, loginSchema } from "@/storage/database/authManager";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Attempt login
    const result = await AuthManager.login(validatedData);

    // Set httpOnly cookie with token
    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        preferredLanguage: result.user.preferredLanguage,
        avatarUrl: result.user.avatarUrl,
      },
    });

    response.cookies.set("auth_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
