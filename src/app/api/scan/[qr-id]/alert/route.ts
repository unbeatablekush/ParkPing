import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Use service role to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase envs missing", { supabaseUrl, supabaseServiceRoleKey });
}

const supabase = createClient(
  supabaseUrl || "",
  supabaseServiceRoleKey || ""
);

function hashPhone(phone: string): string {
  return crypto.createHash("sha256").update(phone).digest("hex");
}

type AlertRequestPayload = {
  scannerPhone?: string;
  scannerName?: string;
  contactMethod?: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { "qr-id": string } }
) {
  const qrString = params["qr-id"];

  if (!qrString || typeof qrString !== "string") {
    return NextResponse.json({ error: "Invalid QR code" }, { status: 400 });
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Supabase envs missing", { supabaseUrl, supabaseServiceRoleKey });
    return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 });
  }

  let payload: AlertRequestPayload;
  try {
    payload = (await request.json()) as AlertRequestPayload;
  } catch (err) {
    console.error("Alert API invalid JSON body:", err);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const scannerPhone = String(payload?.scannerPhone || "").trim();
  const scannerName = payload?.scannerName ? String(payload.scannerName).trim() : null;
  const contactMethod = payload?.contactMethod ? String(payload.contactMethod).trim() : "alert";

  if (!scannerPhone) {
    return NextResponse.json({ error: "Phone number required" }, { status: 400 });
  }

  const normalizedContactMethod = ["alert", "call", "chat"].includes(contactMethod)
    ? contactMethod
    : "alert";

  const phoneHash = hashPhone(scannerPhone);

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from("scan_logs")
      .select("*", { count: "exact", head: true })
      .eq("scanner_phone_hash", phoneHash)
      .gte("scanned_at", oneHourAgo);

    if (countError) {
      console.error("scan_logs count error:", countError);
      return NextResponse.json({ error: "Unable to check cooldown" }, { status: 500 });
    }

    if ((count || 0) >= 3) {
      return NextResponse.json(
        { error: "Maximum 3 alerts per hour. Please wait before trying again." },
        { status: 429 }
      );
    }

    const { data: qrCode, error: qrError } = await supabase
      .from("qr_codes")
      .select("id, vehicle_id")
      .eq("qr_code_string", qrString)
      .single();

    if (qrError) {
      console.error("qr_codes lookup error:", qrError);
      return NextResponse.json({ error: "QR code lookup failed" }, { status: 500 });
    }

    if (!qrCode) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("id, user_id, make, model")
      .eq("id", qrCode.vehicle_id)
      .single();

    if (vehicleError) {
      console.error("vehicle lookup error:", vehicleError);
      return NextResponse.json({ error: "Vehicle lookup failed" }, { status: 500 });
    }

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const city = request.headers.get("x-city") || "Unknown";

    const { data: scanLog, error: scanError } = await supabase
      .from("scan_logs")
      .insert({
        qr_id: qrCode.id,
        scanner_phone_hash: phoneHash,
        scanner_name: scannerName || null,
        contact_method: normalizedContactMethod,
        location_city: city,
        resolution_status: "pending",
      })
      .select("id")
      .single();

    if (scanError || !scanLog) {
      console.error("scan_logs create error:", scanError, "body:", payload);
      return NextResponse.json(
        {
          error: "Failed to create scan log",
          details: scanError?.message || JSON.stringify(scanError) || "unknown",
          scanData: {
            qr_id: qrCode.id,
            scanner_phone_hash: phoneHash,
            scanner_name: scannerName || null,
            contact_method: normalizedContactMethod,
            location_city: city,
            resolution_status: "pending",
          },
        },
        { status: 500 }
      );
    }

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
      console.error("alerts create error:", alertError, "body:", payload);
      return NextResponse.json(
        {
          error: "Failed to create alert",
          details: alertError?.message || JSON.stringify(alertError) || "unknown",
        },
        { status: 500 }
      );
    }

    const { data: ownerProfile, error: ownerProfileError } = await supabase
      .from("profiles")
      .select("fcm_token")
      .eq("id", vehicle.user_id)
      .single();

    if (ownerProfileError) {
      console.error("profiles lookup error:", ownerProfileError);
      // still continue without FCM
    }

    if (ownerProfile?.fcm_token) {
      try {
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
      }
    }

    const cooldownEnds = new Date(Date.now() + 4 * 60 * 1000).toISOString();

    return NextResponse.json({
      alertId: alert.id,
      scanId: scanLog.id,
      cooldownEnds,
    });
  } catch (err: unknown) {
    console.error("Alert API error:", err, "params:", params);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 }
    );
  }
}
