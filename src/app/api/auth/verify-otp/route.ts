import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, phone } = body;

    if (!token || !phone) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    // Check if the user already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("phone", phone)
      .single();

    if (!existingUser) {
      // Insert new user if they don't exist
      const { error: insertError } = await supabaseAdmin
        .from("users")
        .insert([{ phone }]);
        
      if (insertError) {
        console.error("Supabase insert error:", insertError);
        return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 });
      }
    }

    // Set simple session token
    cookies().set({
      name: "session_token",
      value: `mock_jwt_token_123`, // For MVP purposes string matching the middleware default behavior
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return NextResponse.json({ success: true, message: "Verified successfully" });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
