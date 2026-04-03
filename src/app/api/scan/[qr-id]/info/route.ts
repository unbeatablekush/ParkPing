import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _request: NextRequest,
  { params }: { params: { "qr-id": string } }
) {
  try {
    const qrString = params["qr-id"];

    // Look up QR code by string
    const { data: qrCode } = await supabase
      .from("qr_codes")
      .select("id, vehicle_id, is_active")
      .eq("qr_code_string", qrString)
      .single();

    if (!qrCode) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    if (qrCode.is_active === false) {
      return NextResponse.json({ error: "QR code is inactive" }, { status: 410 });
    }

    // Get vehicle details (only safe public info — no owner data)
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("make, model, color")
      .eq("id", qrCode.vehicle_id)
      .single();

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json({
      qr_code_id: qrCode.id,
      vehicle_id: qrCode.vehicle_id,
      make: vehicle.make,
      model: vehicle.model,
      color: vehicle.color,
    });
  } catch (err) {
    console.error("Scan info API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
