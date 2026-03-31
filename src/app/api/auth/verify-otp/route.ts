import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { otp } = body;

    // Simulate OTP verification and login
    if (otp.length === 6) {
      // Mock session token setting for Middleware
      cookies().set({
        name: "session_token",
        value: "mock_jwt_token_123",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      });

      return NextResponse.json({ success: true, message: "Verified successfully" });
    }

    return NextResponse.json({ success: false, error: "Invalid OTP" }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
