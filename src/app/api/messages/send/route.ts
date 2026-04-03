import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { scanId, content, senderType } = await request.json();

    if (!scanId || !content || !senderType) {
      return NextResponse.json({ error: "scanId, content, and senderType required" }, { status: 400 });
    }

    if (!["scanner", "owner"].includes(senderType)) {
      return NextResponse.json({ error: "senderType must be 'scanner' or 'owner'" }, { status: 400 });
    }

    // Insert message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        scan_id: scanId,
        sender_type: senderType,
        content,
      })
      .select("id")
      .single();

    if (error || !message) {
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    // Try to send FCM notification to the other party
    try {
      // Get the scan log to find the vehicle/owner
      const { data: scanLog } = await supabase
        .from("scan_logs")
        .select("qr_id")
        .eq("id", scanId)
        .single();

      if (scanLog) {
        const { data: qrCode } = await supabase
          .from("qr_codes")
          .select("vehicle_id")
          .eq("id", scanLog.qr_id)
          .single();

        if (qrCode) {
          const { data: vehicle } = await supabase
            .from("vehicles")
            .select("user_id")
            .eq("id", qrCode.vehicle_id)
            .single();

          if (vehicle && senderType === "scanner") {
            // Notify owner
            const { data: profile } = await supabase
              .from("profiles")
              .select("fcm_token")
              .eq("id", vehicle.user_id)
              .single();

            if (profile?.fcm_token) {
              const { fcmAdmin } = await import("@/lib/firebase-admin");
              await fcmAdmin.send({
                token: profile.fcm_token,
                notification: {
                  title: "💬 New message from scanner",
                  body: content.length > 100 ? content.substring(0, 100) + "..." : content,
                },
                data: {
                  type: "chat_message",
                  scan_id: scanId,
                  url: `/dashboard?tab=alerts`,
                },
              });
            }
          }
        }
      }
    } catch (fcmErr) {
      console.error("FCM notification for message failed:", fcmErr);
    }

    return NextResponse.json({ messageId: message.id });
  } catch (err) {
    console.error("Messages API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
