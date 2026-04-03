import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Use service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function hashPhone(phone: string): string {
  return crypto.createHash("sha256").update(phone).digest("hex");
}

export async function POST(
  request: NextRequest,
  { params }: { params: { "qr-id": string } }
) {
  try {
    const { scannerPhone, scannerName, contactMethod } = await request.json();
    const qrString = params["qr-id"];

    if (!scannerPhone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    const phoneHash = hashPhone(scannerPhone);

    // Check cooldown: max 3 alerts per hour from this phone
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("scan_logs")
      .select("*", { count: "exact", head: true })
      .eq("scanner_phone_hash", phoneHash)
      .gte("scanned_at", oneHourAgo);

    if ((count || 0) >= 3) {
      return NextResponse.json(
        { error: "Maximum 3 alerts per hour. Please wait before trying again." },
        { status: 429 }
      );
    }

    // Look up the QR code
    const { data: qrCode } = await supabase
      .from("qr_codes")
      .select("id, vehicle_id")
      .eq("qr_code_string", qrString)
      .single();

    if (!qrCode) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    // Get vehicle details
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id, user_id, make, model")
      .eq("id", qrCode.vehicle_id)
      .single();

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Get browser geolocation city (from request header or default)
    const city = request.headers.get("x-city") || "Unknown";

    // Create scan log
    const { data: scanLog, error: scanError } = await supabase
      .from("scan_logs")
      .insert({
        qr_id: qrCode.id,
        scanner_phone_hash: phoneHash,
        scanner_name: scannerName || null,
        contact_method: contactMethod || "alert",
        location_city: city,
        resolution_status: "pending",
      })
      .select("id")
      .single();

    if (scanError || !scanLog) {
      return NextResponse.json({ error: "Failed to create scan log" }, { status: 500 });
    }

    // Create alert
    const { data: alert, error: alertError } = await supabase
      .from("alerts")
      .insert({
        scan_id: scanLog.id,
        alert_type: "standard",
        status: "pending",
      })
      .select("id")
      .single();

    if (alertError || !alert) {
      return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
    }

    // Get owner's FCM token
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("fcm_token")
      .eq("id", vehicle.user_id)
      .single();

    // Send FCM notification if owner has a token
    if (ownerProfile?.fcm_token) {
      try {
        // Dynamic import to avoid loading firebase-admin on client
        const { fcmAdmin } = await import("@/lib/firebase-admin");
        await fcmAdmin.send({
          token: ownerProfile.fcm_token,
          notification: {
            title: "🚨 Someone needs you to move your car!",
            body: `Your ${vehicle.make} ${vehicle.model} is blocking someone. Please move it.`,
          },
          data: {
            scan_id: scanLog.id,
            alert_id: alert.id,
            type: "parking_alert",
            url: "/dashboard?tab=alerts",
          },
          webpush: {
            fcmOptions: { link: "/dashboard?tab=alerts" },
            notification: {
              vibrate: [500, 200, 500, 200, 1000],
            },
          },
        });
      } catch (fcmErr) {
        console.error("FCM send error:", fcmErr);
        // Don't fail the request if FCM fails — alert is still created
      }
    }

    const cooldownEnds = new Date(Date.now() + 4 * 60 * 1000).toISOString();

    return NextResponse.json({
      alertId: alert.id,
      scanId: scanLog.id,
      cooldownEnds,
    });
  } catch (err) {
    console.error("Alert API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
